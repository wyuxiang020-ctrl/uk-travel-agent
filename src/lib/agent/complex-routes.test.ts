import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_DRAFT } from "../demo-trip.ts";
import { LONDON_PLACES } from "../../data/london-places.ts";
import { OXFORD_PLACES } from "../../data/oxford-places.ts";
import { BATH_PLACES } from "../../data/bath-places.ts";
import { TRANSFER_REFERENCES } from "../../data/transfer-references.ts";
import { checkDay, getTransfer } from "../travel-tools.ts";
import { AgentError, dateAt, parseRequest } from "./validation.ts";
import { assertLocks, checkedPlan, commitRevision, editPlan, newDocument, restoreDocument } from "./itinerary.ts";
import { runAgent } from "./runner.ts";
import type { Requirements, PlanProposal, ModelClient, AgentEvent } from "./types";
import type { CityId } from "../demo-trip";

// Offline engineering fixtures, never served as real model results.
const places=[...LONDON_PLACES,...OXFORD_PLACES,...BATH_PLACES];
const req:Requirements={draft:{...DEFAULT_DRAFT,idea:"三城历史与博物馆旅行，保留会面。",cities:["london","oxford","bath"],startCity:"london",endCity:"bath",days:5,datesFlexible:false,startDate:"2026-11-10",pace:"balanced"},summary:"离线三城验证",availableFrom:"09:00",availableUntil:"19:00",mustVisitIds:["london-british-museum"],fixed:[{day:3,id:"meeting",title:"牛津会面",city:"oxford",start:"17:00",end:"18:00"}]};
const ids=["london-british-museum","london-south-bank",OXFORD_PLACES[0].id,OXFORD_PLACES[1].id,BATH_PLACES[0].id];
const candidate:PlanProposal={title:"离线三城测试",summary:"仅工程测试",days:ids.map((placeId,i)=>({day:i+1,date:dateAt(req.draft.startDate,i+1),title:`第${i+1}天`,startCity:(i<3?"london":"oxford") as CityId,availableFrom:"09:00",availableUntil:"19:00",visits:[{id:`v${i+1}`,placeId,start:"13:00",end:"15:00",reason:"离线验证"}],fixedArrangements:i===2?[{id:"meeting",title:"牛津会面",city:"oxford",start:"17:00",end:"18:00"}]:[]}))};
const isCode=(code:string)=>(e:unknown)=>e instanceof AgentError&&e.code===code;
const clock=(n:number)=>`${String(Math.floor(n/60)).padStart(2,"0")}:${String(n%60).padStart(2,"0")}`;

for(const from of ["london","oxford","bath"] as const)for(const to of ["london","oxford","bath"] as const){
  if(from===to)continue;
  test(`transfer boundary ${from} to ${to}: exact allowance vs one minute short`,()=>{
    const ref=getTransfer({from,to},TRANSFER_REFERENCES);assert.ok(ref.ok);if(!ref.ok)return;
    const needed=ref.data.planningRideMinutes+ref.data.bufferMinutes;
    for(const initial of [true,false])for(const delta of [-1,0]){
      const start=(initial?540:600)+needed+delta;
      const result=checkDay({date:"2026-11-10",startCity:from,availableFrom:"09:00",availableUntil:"19:00",visits:[{id:"destination",placeId:places.find(p=>p.city===to)!.id,start:clock(start),end:clock(start+60)}],fixedArrangements:initial?[]:[{id:"departure",title:"出发前固定活动",city:from,start:"09:00",end:"10:00"}]},places,TRANSFER_REFERENCES);
      assert.ok(result.ok);if(!result.ok)continue;
      assert.equal(result.data.transfers[0].neededMinutes,needed);
      assert.equal(result.data.issues.some(i=>i.code==="INSUFFICIENT_TRANSFER_TIME"),delta<0);
    }
  });
}

test("shortening cannot delete locked or fixed days and rejects before model execution",()=>{
  const base={action:"revise",requestId:"complex-shortening",basePlan:candidate,baseRequirements:req,days:4,pace:"balanced",instruction:"缩短为四天",lockedIds:["v5"]};
  assert.throws(()=>parseRequest(base,places),isCode("LOCKED_DAY_REMOVED"));
  const fixedReq=structuredClone(req);fixedReq.fixed[0].day=5;fixedReq.fixed[0].city="bath";
  const fixedPlan=structuredClone(candidate);fixedPlan.days[2].fixedArrangements=[];fixedPlan.days[4].fixedArrangements=[{id:"meeting",title:"牛津会面",city:"bath",start:"17:00",end:"18:00"}];
  assert.throws(()=>parseRequest({...base,basePlan:fixedPlan,baseRequirements:fixedReq,lockedIds:[]},places),isCode("FIXED_DAY_REMOVED"));
  assert.equal(parseRequest({...base,lockedIds:[]},places).action,"revise");
});

test("maximum-length revision instruction is accepted without hidden summary overflow",()=>{
  const instruction="调".repeat(1500);
  const request=parseRequest({action:"revise",requestId:"complex-long-text",basePlan:candidate,baseRequirements:req,days:5,pace:"balanced",instruction,lockedIds:[]},places);
  assert.equal(request.action,"revise");if(request.action==="revise")assert.equal(request.requirements.summary,instruction);
});

test("three-city continuous edits keep downstream transfer checks, locks and history",()=>{
  const original=checkedPlan(candidate,req,places,TRANSFER_REFERENCES);
  let doc=newDocument(original);doc.lockedIds=["v1"];
  // Move an Oxford visit to the previous Oxford day; its former day gets a Bath visit.
  const extra=structuredClone(candidate);extra.days[3].visits.push({id:"extra",placeId:BATH_PLACES[1].id,start:"18:00",end:"19:00",reason:"离线验证"});extra.days[4].startCity="bath";
  doc=commitRevision(doc,checkedPlan(extra,req,places,TRANSFER_REFERENCES),"补充巴斯");
  const moved=editPlan(doc.versions[doc.cursor].plan,{type:"reschedule",id:"v4",day:3,start:"15:10",end:"16:10"},doc.lockedIds,places,TRANSFER_REFERENCES);
  doc=commitRevision(doc,moved,"牛津停留集中");
  assert.equal(moved.days[4].startCity,"bath");
  assert.equal(moved.checks[3].result.transfers[0].from,"oxford");
  const before=JSON.stringify(doc);
  assert.throws(()=>editPlan(moved,{type:"reschedule",id:"extra",day:4,start:"09:05",end:"10:00"},doc.lockedIds,places,TRANSFER_REFERENCES),isCode("PLAN_CONFLICT"));
  assert.throws(()=>editPlan(moved,{type:"remove",id:"v1"},doc.lockedIds,places,TRANSFER_REFERENCES),isCode("LOCKED_CHANGED"));
  assert.equal(JSON.stringify(doc),before);
  doc.cursor=1;const saved=restoreDocument(JSON.stringify(doc),places,TRANSFER_REFERENCES);
  assert.equal(saved.cursor,1);assert.equal(saved.versions.length,3);assert.deepEqual(saved.lockedIds,["v1"]);
  assertLocks(saved.versions[1].plan,saved.versions[2].plan,saved.lockedIds);
  saved.cursor=2;assert.deepEqual(saved.versions[2].plan.requirements.fixed,req.fixed);
  saved.cursor=0;const branched=commitRevision(saved,editPlan(original,{type:"replace",id:"v2",placeId:"london-national-gallery"},saved.lockedIds,places,TRANSFER_REFERENCES),"撤销后新分支");
  assert.equal(branched.versions.length,2);assert.equal(branched.cursor,1);
});

test("model orchestration supports 5 to 6 to 4 days with three cities and protected commitments",async()=>{
  let plan=checkedPlan(candidate,req,places,TRANSFER_REFERENCES);
  for(const days of [6,4]){
    const next=structuredClone(candidate);
    if(days===6){next.days.push({...next.days[4],day:6,date:dateAt(req.draft.startDate,6),startCity:"bath",visits:[{id:"v6",placeId:BATH_PLACES[2].id,start:"13:00",end:"15:00",reason:"新增巴斯一天"}]});}
    else{next.days=next.days.slice(0,4);next.days[3].visits=[candidate.days[4].visits[0]];}
    const request=parseRequest({action:"revise",requestId:`complex-days-${days}`,basePlan:plan,baseRequirements:plan.requirements,days,pace:"relaxed",instruction:`改为${days}天，固定及锁定安排保持原样`,lockedIds:["v1"]},places);
    const events:AgentEvent[]=[];
    const model:ModelClient=async()=>({message:{role:"assistant",content:null,tool_calls:[{id:"offline",type:"function",function:{name:"submit_plan",arguments:JSON.stringify(next)}}]}});
    const result=await runAgent(request,{places,transfers:TRANSFER_REFERENCES,model,maxRounds:1,signal:new AbortController().signal,emit:e=>events.push(e)});
    assert.equal(result.kind,"plan");if(result.kind!=="plan")return;
    assertLocks(plan,result.plan,["v1"]);plan=result.plan;
    assert.equal(plan.days.length,days);assert.deepEqual(plan.requirements.fixed,req.fixed);
    assert.equal(plan.transfers.length,2);assert.equal(events.filter(e=>e.tool==="check_day"&&e.type==="tool_finished").length,days);
  }
});

test("empty-day failure is reported together and final rounds retain submission and repair",async()=>{
  const broken=structuredClone(candidate);for(const i of [1,3,4])broken.days[i].visits=[];
  let calls=0;
  const model:ModelClient=async(messages,tools)=>{
    calls++;
    const names=tools.map(t=>t.function.name);
    if(calls===1){assert.ok(names.includes("get_transfer"));return {message:{role:"assistant",content:null,tool_calls:[{id:"lookup",type:"function",function:{name:"get_transfer",arguments:'{"from":"london","to":"oxford"}'}}]}};}
    assert.deepEqual(names,["submit_plan","cannot_plan"]);
    if(calls===3)assert.match(messages.at(-1)!.content!,/第 2、4、5 天/);
    return {message:{role:"assistant",content:null,tool_calls:[{id:`submit-${calls}`,type:"function",function:{name:"submit_plan",arguments:JSON.stringify(calls===2?broken:candidate)}}]}};
  };
  const result=await runAgent({action:"generate",requestId:"empty-day-regression",requirements:req},{places,transfers:TRANSFER_REFERENCES,model,maxRounds:3,signal:new AbortController().signal,emit:()=>{}});
  assert.equal(result.kind,"plan");assert.equal(calls,3);
});
