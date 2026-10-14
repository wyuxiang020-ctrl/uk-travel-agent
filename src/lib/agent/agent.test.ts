import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseTestBudget, reserveTestCall } from "./test-budget.ts";
import { DEFAULT_DRAFT } from "../demo-trip.ts";
import { LONDON_PLACES } from "../../data/london-places.ts";
import { OXFORD_PLACES } from "../../data/oxford-places.ts";
import { BATH_PLACES } from "../../data/bath-places.ts";
import { TRANSFER_REFERENCES } from "../../data/transfer-references.ts";
import { AgentError, parsePlan, parseRequest, parseRequirements } from "./validation.ts";
import { runAgent } from "./runner.ts";
import { createModelClient, getModelConfig } from "./model.ts";
import { acquireRun, readAgentBody } from "./http.ts";
import { assertLocks, checkedPlan, commitRevision, editPlan, newDocument, restoreDocument } from "./itinerary.ts";
import type { AgentEvent, AgentRequest, FunctionTool, ModelClient, ModelMessage, PlanProposal, Requirements } from "./types";

// Offline fixtures only. They never appear in the application or claim live model success.
const places=[...LONDON_PLACES,...OXFORD_PLACES,...BATH_PLACES];
const requirements:Requirements={draft:{...DEFAULT_DRAFT,idea:"伦敦三天，慢慢散步。",cities:["london"],startCity:"london",endCity:"london",days:3,datesFlexible:false,startDate:"2026-11-10"},summary:"伦敦三天，每天09:00–19:00。",availableFrom:"09:00",availableUntil:"19:00",mustVisitIds:["london-south-bank"],fixed:[{day:1,id:"fixed-1",title:"和朋友见面",city:"london",start:"14:00",end:"15:00"}]};
const proposal:PlanProposal={title:"伦敦三日测试",summary:"离线测试候选，不是实际模型成果。",days:["london-big-ben","london-south-bank","london-british-museum"].map((placeId,i)=>({day:i+1,date:`2026-11-${10+i}`,startCity:"london",title:`测试第${i+1}天`,availableFrom:"09:00",availableUntil:"19:00",visits:[{id:`visit-${i+1}`,placeId,start:"10:00",end:"12:00",reason:"测试偏好匹配"}],fixedArrangements:i===0?[{id:"fixed-1",title:"和朋友见面",city:"london",start:"14:00",end:"15:00"}]:[]}))};
const generate:AgentRequest={action:"generate",requestId:"offline-test-001",requirements};
const understand:AgentRequest={action:"understand",requestId:"offline-test-002",draft:requirements.draft,answers:[]};
const clone=<T>(v:T):T=>structuredClone(v);
const reply=(name:string,input:unknown)=>({message:{role:"assistant" as const,content:null,tool_calls:[{id:crypto.randomUUID(),type:"function" as const,function:{name,arguments:JSON.stringify(input)}}]}});
function deps(model:ModelClient,events:AgentEvent[]=[],maxRounds=10,signal=new AbortController().signal){return {model,places,transfers:TRANSFER_REFERENCES,events,maxRounds,signal,emit:(e:AgentEvent)=>events.push(e)};}
const code=(expected:string)=>(e:unknown)=>e instanceof AgentError&&e.code===expected;

test("edits protect locked, must-visit and fixed arrangements and recheck conflicts",()=>{
  const plan=checkedPlan(proposal,requirements,places,TRANSFER_REFERENCES);
  const original=JSON.stringify(plan);
  assert.throws(()=>editPlan(plan,{type:"replace",id:"visit-1",placeId:"london-national-gallery"},["visit-1"],places,TRANSFER_REFERENCES),code("LOCKED_CHANGED"));
  assert.throws(()=>editPlan(plan,{type:"replace",id:"visit-2",placeId:"london-national-gallery"},[],places,TRANSFER_REFERENCES),code("MUST_VISIT_MISSING"));
  assert.throws(()=>editPlan(plan,{type:"reschedule",id:"visit-1",day:1,start:"14:00",end:"16:00"},[],places,TRANSFER_REFERENCES),code("PLAN_CONFLICT"));
  const next=editPlan(plan,{type:"replace",id:"visit-1",placeId:"london-national-gallery"},[],places,TRANSFER_REFERENCES);
  assert.equal(next.days[0].visits[0].placeId,"london-national-gallery");
  assert.deepEqual(next.days[0].fixedArrangements,plan.days[0].fixedArrangements);
  assert.equal(JSON.stringify(plan),original);
  assert.equal(next.checks.length,3);
});

test("edits support reducing stops and changing days while rejecting empty or invalid days",()=>{
  const candidate=clone(proposal);candidate.days[0].visits.push({id:"extra",placeId:"london-national-gallery",start:"16:00",end:"17:00",reason:"离线检查"});
  const plan=checkedPlan(candidate,requirements,places,TRANSFER_REFERENCES);
  const less=editPlan(plan,{type:"remove",id:"extra"},[],places,TRANSFER_REFERENCES);
  assert.equal(less.days[0].visits.length,1);
  const moved=editPlan(plan,{type:"reschedule",id:"extra",day:3,start:"14:00",end:"16:00"},[],places,TRANSFER_REFERENCES);
  assert.equal(moved.days[2].visits.length,2);
  assert.throws(()=>editPlan(less,{type:"remove",id:"visit-3"},[],places,TRANSFER_REFERENCES),code("INVALID_PLAN"));
  assert.throws(()=>editPlan(plan,{type:"reschedule",id:"extra",day:9,start:"14:00",end:"16:00"},[],places,TRANSFER_REFERENCES),code("INVALID_INPUT"));
});

test("version save/restore preserves cursor and locks and discards untrusted check data",()=>{
  const plan=checkedPlan(proposal,requirements,places,TRANSFER_REFERENCES);
  const next=editPlan(plan,{type:"replace",id:"visit-1",placeId:"london-national-gallery"},[],places,TRANSFER_REFERENCES);
  const doc=commitRevision(newDocument(plan),next,"替换地点");doc.lockedIds=["visit-2"];
  doc.cursor=0;
  const restored=restoreDocument(JSON.stringify(doc),places,TRANSFER_REFERENCES);
  assert.equal(restored.cursor,0);assert.equal(restored.versions.length,2);assert.deepEqual(restored.lockedIds,["visit-2"]);
  assert.equal(restored.versions[0].plan.days[0].visits[0].placeId,"london-big-ben");
  restored.versions[0].plan.checks=[];
  assert.equal(restoreDocument(JSON.stringify(restored),places,TRANSFER_REFERENCES).versions[0].plan.checks.length,3);
  const branched=commitRevision(restored,next,"撤销后分支");assert.equal(branched.versions.length,2);
  assert.throws(()=>restoreDocument("{",places,TRANSFER_REFERENCES),code("SAVE_INVALID"));
  assert.throws(()=>restoreDocument(JSON.stringify({...doc,schema:99}),places,TRANSFER_REFERENCES),code("SAVE_INVALID"));
  assert.throws(()=>restoreDocument(JSON.stringify({...doc,lockedIds:["missing"]}),places,TRANSFER_REFERENCES),code("LOCKED_CHANGED"));
});

test("model revision rejects changes to locked visits before accepting a candidate",async()=>{
  const request=parseRequest({action:"revise",requestId:"revision-offline",basePlan:proposal,baseRequirements:requirements,days:3,pace:"balanced",instruction:"保留已锁定的安排，调整其他安排。",lockedIds:["visit-1"]},places);
  let calls=0;
  const changed=clone(proposal);changed.days[0].visits[0].start="09:30";
  const result=await runAgent(request,deps(async()=>{calls++;return reply("submit_plan",calls===1?changed:proposal);}));
  assert.equal(calls,2);assert.equal(result.kind,"plan");
  assert.throws(()=>assertLocks(proposal,changed,["visit-1"]),code("LOCKED_CHANGED"));
  assert.throws(()=>parseRequest({action:"revise",requestId:"revision-invalid",basePlan:proposal,baseRequirements:requirements,days:2,pace:"balanced",instruction:"减天",lockedIds:[]},places),code("INVALID_INPUT"));
});

test("revisions can expand duration and pace without changing fixed commitments",async()=>{
  const request=parseRequest({action:"revise",requestId:"revision-duration",basePlan:proposal,baseRequirements:requirements,days:4,pace:"balanced",instruction:"增加一天，多留时间看艺术。",lockedIds:["visit-1"]},places);
  const candidate=clone(proposal);candidate.days.push({...candidate.days[2],day:4,date:"2026-11-13",title:"艺术",visits:[{id:"new-visit",placeId:"london-national-gallery",start:"10:00",end:"12:00",reason:"新增一天"}]});
  const result=await runAgent(request,deps(async()=>reply("submit_plan",candidate)));
  assert.equal(result.kind,"plan");if(result.kind!=="plan")return;assert.equal(result.plan.days.length,4);assert.deepEqual(result.plan.requirements.fixed,requirements.fixed);assert.equal(result.plan.requirements.draft.pace,"balanced");
});

test("saved history is bounded and tampered conflicting schedules never restore",()=>{
  const plan=checkedPlan(proposal,requirements,places,TRANSFER_REFERENCES);let doc=newDocument(plan);
  for(let i=0;i<25;i++)doc=commitRevision(doc,plan,`离线版本 ${i}`);
  assert.equal(doc.versions.length,20);assert.equal(doc.cursor,19);
  doc.versions[0].plan.days[0].visits[0].start="14:00";doc.versions[0].plan.days[0].visits[0].end="16:00";
  assert.throws(()=>restoreDocument(JSON.stringify(doc),places,TRANSFER_REFERENCES),code("PLAN_CONFLICT"));
});

test("local preview accepts Next loopback normalization but rejects foreign origins",async()=>{
  const req=(origin:string,host="127.0.0.1:3005")=>new Request("http://localhost:3005/api/agent",{method:"POST",headers:{"content-type":"application/json",origin,host},body:"{}"});
  assert.deepEqual(await readAgentBody(req("http://127.0.0.1:3005")),{});
  await assert.rejects(readAgentBody(req("https://attacker.example")),code("ORIGIN_REJECTED"));
  await assert.rejects(readAgentBody(req("http://127.0.0.1:3005","attacker.example")),code("ORIGIN_REJECTED"));
});

test("test budget persists reservations, settles reported usage and stops before exceeding the cap",()=>{
  const root=mkdtempSync(join(process.cwd(),"work/budget-test-"));
  const budget={id:"test",limitUsd:0.03};
  const settle=reserveTestCall(budget,"{}",512,root);
  assert.throws(()=>reserveTestCall(budget,"{}",512,root),code("TEST_BUDGET_EXHAUSTED"));
  settle({prompt_tokens:100,completion_tokens:20});
  const ledger=JSON.parse(readFileSync(join(root,"work/model-budget-test.json"),"utf8"));
  assert.equal(ledger.entries[0].chargedMicros,360);
  reserveTestCall(budget,"{}",512,root)({prompt_tokens:-1,completion_tokens:0});
  assert.throws(()=>reserveTestCall(budget,"{}",512,root),code("TEST_BUDGET_EXHAUSTED"));
});

test("test budget fails closed for corrupted records and invalid configuration",()=>{
  const root=mkdtempSync(join(process.cwd(),"work/budget-test-"));
  const budget={id:"corrupt",limitUsd:1};
  reserveTestCall(budget,"{}",512,root);
  writeFileSync(join(root,"work/model-budget-corrupt.json"),"invalid");
  assert.throws(()=>reserveTestCall(budget,"{}",512,root),code("BUDGET_INVALID"));
  assert.throws(()=>parseTestBudget({TRAVEL_MODEL_TEST_BUDGET_USD:"2",TRAVEL_MODEL_TEST_BUDGET_ID:"test"}),code("MODEL_CONFIG_INVALID"));
  assert.throws(()=>parseTestBudget({TRAVEL_MODEL_TEST_BUDGET_USD:"1",TRAVEL_MODEL_TEST_BUDGET_ID:"../escape"}),code("MODEL_CONFIG_INVALID"));
  assert.deepEqual(parseTestBudget({TRAVEL_MODEL_TEST_BUDGET_USD:"1",TRAVEL_MODEL_TEST_BUDGET_ID:"test"}),{id:"test",limitUsd:1});
});

test("request validation rejects unsupported cities, missing fields and excessive clarification",()=>{
  assert.throws(()=>parseRequest({...understand,draft:{...requirements.draft,cities:["paris"]}},places),code("INVALID_INPUT"));
  assert.throws(()=>parseRequest({action:"generate",requestId:"x"},places),code("INVALID_INPUT"));
  assert.throws(()=>parseRequest({...understand,answers:Array(5).fill({questions:["何时？"],answer:"11月"})},places),code("INVALID_INPUT"));
  assert.throws(()=>parseRequirements({...requirements,draft:{...requirements.draft,datesFlexible:true}},places),code("DATE_REQUIRED"));
  assert.throws(()=>parseRequirements({...requirements,mustVisitIds:["paris-louvre"]},places),code("UNKNOWN_PLACE"));
});
test("requirements reject overlapping fixed activities before generation",()=>{
  assert.throws(()=>parseRequirements({...requirements,fixed:[...requirements.fixed,{...requirements.fixed[0],id:"fixed-2",start:"14:30"}]},places),code("FIXED_CONFLICT"));
});
test("proposal cannot invent places, repeat stops, omit must-visits or alter fixed commitments",()=>{
  assert.deepEqual(parsePlan(proposal,requirements,places),proposal);
  const unknown=clone(proposal);unknown.days[0].visits[0].placeId="invented";assert.throws(()=>parsePlan(unknown,requirements,places),code("UNKNOWN_PLACE"));
  const duplicate=clone(proposal);duplicate.days[1].visits[0].placeId=duplicate.days[0].visits[0].placeId;assert.throws(()=>parsePlan(duplicate,requirements,places),code("DUPLICATE_PLACE"));
  const omitted=clone(proposal);omitted.days[1].visits[0].placeId="london-national-gallery";assert.throws(()=>parsePlan(omitted,requirements,places),code("MUST_VISIT_MISSING"));
  const fixed=clone(proposal);fixed.days[0].fixedArrangements[0].end="15:30";assert.throws(()=>parsePlan(fixed,requirements,places),code("FIXED_CHANGED"));
});
test("proposal preserves dates, day windows, city continuity and selected city coverage",()=>{
  const date=clone(proposal);date.days[1].date="2026-11-15";assert.throws(()=>parsePlan(date,requirements,places),code("INVALID_PLAN"));
  const window=clone(proposal);window.days[1].availableUntil="23:00";assert.throws(()=>parsePlan(window,requirements,places),code("INVALID_PLAN"));
  const teleport=clone(proposal);teleport.days[1].startCity="oxford";assert.throws(()=>parsePlan(teleport,requirements,places),code("INVALID_PLAN"));
  assert.throws(()=>parsePlan(proposal,{...requirements,draft:{...requirements.draft,cities:["london","oxford"]}},places),code("CITY_MISMATCH"));
});
test("understanding can ask a real clarification without producing a plan",async()=>{
  const events:AgentEvent[]=[];
  const result=await runAgent({...understand,draft:{...requirements.draft,datesFlexible:true,startDate:""}},deps(async()=>reply("ask_questions",{questions:["请补充具体出发日期。"]}),events));
  assert.equal(result.kind,"questions");assert.ok(events.some(e=>e.type==="tool_finished"&&e.tool==="list_places"));
  assert.ok(!events.some(e=>e.tool==="check_day"));
});
test("understanding requires confirmation and does not silently change form constraints",async()=>{
  let calls=0;
  const result=await runAgent(understand,deps(async messages=>{calls++;if(calls===1)return reply("confirm_requirements",{...requirements,draft:{...requirements.draft,days:5}});assert.match(messages.at(-1)!.content!,/REQUIREMENTS_CHANGED/);return reply("confirm_requirements",requirements);}));
  assert.equal(result.kind,"requirements");assert.equal(calls,2);
});
test("offline orchestration executes actual tools and preserves unknowns and authoritative sources",async()=>{
  const events:AgentEvent[]=[];let calls=0;
  const result=await runAgent(generate,deps(async messages=>{
    calls++;if(calls===1)return reply("get_place",{id:"london-big-ben"});assert.match(messages.at(-1)!.content!,/sources/);return reply("submit_plan",proposal);
  },events));
  assert.equal(result.kind,"plan");if(result.kind!=="plan")return;
  assert.equal(result.plan.checks.length,3);assert.ok(result.plan.checks.every(c=>c.result.status==="needs-confirmation"));
  assert.ok(result.plan.checks[0].result.issues.some(i=>i.code==="OPENING_UNKNOWN"));
  assert.deepEqual(result.plan.places[0].sources,places.find(p=>p.id==="london-big-ben")!.sources);
  assert.ok(events.some(e=>e.actor==="model"&&e.tool==="get_place"));assert.equal(events.filter(e=>e.type==="tool_finished"&&e.tool==="check_day").length,3);
  assert.deepEqual(events.map(e=>e.sequence),events.map((_,i)=>i+1));
});
test("candidate conflict triggers real validation feedback then bounded repair",async()=>{
  const invalid=clone(proposal);invalid.days[0].visits[0].start="14:00";invalid.days[0].visits[0].end="15:00";
  const events:AgentEvent[]=[];let rounds=0;
  const result=await runAgent(generate,deps(async messages=>{rounds++;if(rounds===1)return reply("submit_plan",invalid);assert.match(messages.at(-1)!.content!,/PLAN_CONFLICT/);return reply("submit_plan",proposal);},events));
  assert.equal(result.kind,"plan");assert.equal(rounds,2);assert.equal(events.filter(e=>e.type==="repair").length,1);
});
test("unrepaired hard conflicts never become a successful itinerary",async()=>{
  const bad=clone(proposal);bad.days[0].visits[0].start="14:00";bad.days[0].visits[0].end="15:00";
  let rounds=0;await assert.rejects(runAgent(generate,deps(async()=>{rounds++;return reply("submit_plan",bad);})),code("PLAN_CHECK_FAILED"));assert.equal(rounds,3);
});
test("unknown tools are fed back, then stop at request limit",async()=>{
  let calls=0;await assert.rejects(runAgent(generate,deps(async messages=>{calls++;if(calls>1)assert.match(messages.at(-1)!.content!,/UNKNOWN_TOOL/);return reply("execute_shell",{command:"anything"});},[],2)),code("MODEL_ROUND_LIMIT"));assert.equal(calls,2);
});
test("malformed tool arguments are rejected and can be corrected",async()=>{
  let calls=0;
  const result=await runAgent(generate,deps(async messages=>{
    if(++calls===1){const response=reply("get_place",{});response.message.tool_calls[0].function.arguments="{";return response;}
    assert.match(messages.at(-1)!.content!,/INVALID_TOOL_INPUT/);return reply("submit_plan",proposal);
  }));
  assert.equal(result.kind,"plan");assert.equal(calls,2);
});
test("multi-city planning checks transfer time and returns source-backed references",async()=>{
  const req:Requirements={...clone(requirements),draft:{...requirements.draft,cities:["london","oxford","bath"],endCity:"bath"},mustVisitIds:[],fixed:[]};
  const candidate=clone(proposal);
  candidate.days.forEach((day,i)=>{
    day.startCity=i===2?"oxford":"london";day.fixedArrangements=[];
    day.visits[0]={...day.visits[0],placeId:["london-big-ben","oxford-bodleian","bath-roman-baths"][i],start:"14:00",end:"16:00"};
  });
  // Resolve fixture IDs from the real catalog instead of creating synthetic places.
  candidate.days[1].visits[0].placeId=OXFORD_PLACES[0].id;
  candidate.days[2].visits[0].placeId=BATH_PLACES[0].id;
  const events:AgentEvent[]=[];
  const result=await runAgent({...generate,requirements:req},deps(async()=>reply("submit_plan",candidate),events));
  assert.equal(result.kind,"plan");if(result.kind!=="plan")return;
  assert.equal(result.plan.transfers.length,2);
  assert.ok(result.plan.transfers.every(t=>t.sources.length>0));
  assert.equal(events.filter(e=>e.type==="tool_finished"&&e.tool==="get_transfer").length,2);
  const rushed=clone(candidate);rushed.days[1].visits[0].start="09:10";
  await assert.rejects(runAgent({...generate,requirements:req},deps(async()=>reply("submit_plan",rushed))),code("PLAN_CHECK_FAILED"));
});
test("tool exceptions, cancellation and cannot-plan terminate without demo fallback",async()=>{
  await assert.rejects(runAgent(generate,deps(async()=>reply("cannot_plan",{reason:"条件无法同时满足。"}))),code("CANNOT_PLAN"));
  const abort=new AbortController();abort.abort();await assert.rejects(runAgent(generate,deps(async()=>reply("submit_plan",proposal),[],10,abort.signal)));
  const broken=new Proxy(places,{get(target,key){if(key==="filter")throw new Error("private-internal-test");return Reflect.get(target,key);}});
  await assert.rejects(runAgent(generate,{...deps(async()=>reply("submit_plan",proposal)),places:broken}),code("TOOL_FAILED"));
});
test("server config is disabled by default and rejects unsafe or incomplete settings",()=>{
  assert.throws(()=>getModelConfig({}),code("MODEL_NOT_CONFIGURED"));
  assert.throws(()=>getModelConfig({TRAVEL_MODEL_ENABLED:"true"}),code("MODEL_NOT_CONFIGURED"));
  assert.throws(()=>getModelConfig({TRAVEL_MODEL_ENABLED:"true",TRAVEL_MODEL_BASE_URL:"http://example.com/v1",TRAVEL_MODEL_API_KEY:"offline-fixture",TRAVEL_MODEL_NAME:"fixture"}),code("MODEL_CONFIG_INVALID"));
});
const config=getModelConfig({TRAVEL_MODEL_ENABLED:"true",TRAVEL_MODEL_BASE_URL:"https://provider.example/v1",TRAVEL_MODEL_API_KEY:"offline-fixture-secret",TRAVEL_MODEL_NAME:"fixture-model"});
const messages:ModelMessage[]=[{role:"user",content:"offline test"}];const tools:FunctionTool[]=[];
test("model adapter sends tool protocol and configured limits without unsupported temperature",async()=>{
  let body:Record<string,unknown>={};
  const model=createModelClient(config,async(url,init)=>{assert.equal(url,"https://provider.example/v1/chat/completions");assert.equal(init?.redirect,"error");body=JSON.parse(init!.body as string);return Response.json({choices:[{finish_reason:"tool_calls",message:reply("ask_questions",{questions:["何时出发？"]}).message}],usage:{total_tokens:20}});});
  const result=await model(messages,tools,new AbortController().signal);
  assert.equal(body.tool_choice,"required");assert.equal(body.max_completion_tokens,6000);assert.equal(body.temperature,undefined);assert.equal(result.usage?.total_tokens,20);
});
test("model adapter sanitizes auth, rate, malformed, truncated and missing-tool failures",async()=>{
  for(const [status,expected]of [[401,"MODEL_AUTH_FAILED"],[429,"MODEL_RATE_LIMIT"],[500,"MODEL_SERVICE_ERROR"]] as const){
    const model=createModelClient(config,async()=>new Response("offline-fixture-secret",{status}));
    await assert.rejects(model(messages,tools,new AbortController().signal),e=>code(expected)(e)&&!(e as Error).message.includes("offline-fixture-secret"));
  }
  for(const body of [{choices:[{finish_reason:"length",message:{content:"unfinished"}}]},{choices:[{finish_reason:"stop",message:{content:"pretend success"}}]},{}]){
    await assert.rejects(createModelClient(config,async()=>Response.json(body))(messages,tools,new AbortController().signal),e=>e instanceof AgentError);
  }
});
test("model cancellation aborts in-flight transport and returns no partial result",async()=>{
  const abort=new AbortController();const model=createModelClient(config,async(_url,init)=>new Promise((_resolve,reject)=>{init!.signal!.addEventListener("abort",()=>reject(new Error("aborted")),{once:true});abort.abort();}));
  await assert.rejects(model(messages,tools,abort.signal),code("CANCELLED"));
});
test("model timeout aborts transport with a recoverable error",async()=>{
  const keepAlive=setTimeout(()=>{},1000);
  try{
    const model=createModelClient({...config,timeoutMs:10},async(_url,init)=>new Promise((_resolve,reject)=>{
      init!.signal!.addEventListener("abort",()=>reject(new Error("aborted")),{once:true});
    }));
    await assert.rejects(model(messages,tools,new AbortController().signal),code("MODEL_TIMEOUT"));
  }finally{clearTimeout(keepAlive);}
});
test("HTTP input limits and cross-origin guard execute before model access",async()=>{
  await assert.rejects(readAgentBody(new Request("http://127.0.0.1:3005/api/agent",{method:"POST",headers:{"Content-Type":"application/json",Origin:"https://other.example"},body:"{}"})),code("ORIGIN_REJECTED"));
  await assert.rejects(readAgentBody(new Request("http://127.0.0.1:3005/api/agent",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({idea:"旅".repeat(12000)})})),code("PAYLOAD_TOO_LARGE"));
  await assert.rejects(readAgentBody(new Request("http://127.0.0.1:3005/api/agent",{method:"POST",headers:{"Content-Type":"application/json"},body:"{"})),code("INVALID_JSON"));
});
test("local run gate prevents duplicate spend and concurrent jobs and releases once",()=>{
  const id=crypto.randomUUID(),release=acquireRun(id);
  try{assert.throws(()=>acquireRun(id),code("DUPLICATE_REQUEST"));assert.throws(()=>acquireRun(crypto.randomUUID()),code("AGENT_BUSY"));}finally{release();release();}
  assert.throws(()=>acquireRun(id),code("DUPLICATE_REQUEST"));const another=acquireRun(crypto.randomUUID());another();
});
