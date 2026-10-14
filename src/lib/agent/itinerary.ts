import { checkDay, getTransfer } from "../travel-tools.ts";
import { AgentError, parsePlan, parseRequirements, record, text } from "./validation.ts";
import type { GeneratedPlan, PlanProposal, Requirements } from "./types";
import type { TravelPlace, TransferReference } from "../travel-types";

export type EditOperation =
  | {type:"remove";id:string}
  | {type:"replace";id:string;placeId:string}
  | {type:"reschedule";id:string;day:number;start:string;end:string};
export type Revision = {id:string;at:string;label:string;plan:GeneratedPlan;changes:string[]};
export type PlanDocument = {schema:1;id:string;versions:Revision[];cursor:number;lockedIds:string[]};
export const STORAGE_KEY="slowtrail.saved-plan.v1";
export const proposalOf=(plan:PlanProposal):PlanProposal=>({title:plan.title,summary:plan.summary,days:structuredClone(plan.days)});
function entries(plan:PlanProposal){return plan.days.flatMap(d=>d.visits.map(v=>({day:d.day,date:d.date,...v})));}
export function assertLocks(before:PlanProposal,after:PlanProposal,ids:string[]) {
  const a=entries(before),b=entries(after);
  if(ids.length>35||new Set(ids).size!==ids.length)throw new AgentError("INVALID_LOCK","锁定记录无效。");
  for(const id of ids){const old=a.find(v=>v.id===id),next=b.find(v=>v.id===id);if(!old||!next||JSON.stringify(old)!==JSON.stringify(next))throw new AgentError("LOCKED_CHANGED","修改涉及已锁定安排，请先解锁该安排。");}
}
export function checkedPlan(proposal:unknown,requirements:Requirements,places:readonly TravelPlace[],transfers:readonly TransferReference[]):GeneratedPlan {
  const req=parseRequirements(requirements,places),parsed=parsePlan(proposal,req,places);
  const checks=parsed.days.map(day=>{const result=checkDay({date:day.date,startCity:day.startCity,availableFrom:day.availableFrom,availableUntil:day.availableUntil,fixedArrangements:day.fixedArrangements,visits:day.visits.map(v=>({id:v.id,placeId:v.placeId,start:v.start,end:v.end}))},places,transfers);if(!result.ok)throw new AgentError(result.error.code,result.error.message);return {day:day.day,result:result.data};});
  const conflicts=checks.flatMap(c=>c.result.issues.filter(i=>i.severity==="conflict").map(i=>`第 ${c.day} 天：${i.message}`));
  if(conflicts.length)throw new AgentError("PLAN_CONFLICT",conflicts.join("\n"));
  const refs:TransferReference[]=[];
  for(const check of checks)for(const t of check.result.transfers){const found=getTransfer({from:t.from,to:t.to},transfers);if(found.ok&&!refs.some(r=>r.from===t.from&&r.to===t.to))refs.push(found.data);}
  return {...parsed,mode:"model",generatedAt:new Date().toISOString(),requirements:req,checks,places:places.filter(p=>parsed.days.some(d=>d.visits.some(v=>v.placeId===p.id))),transfers:refs};
}
export function editPlan(before:GeneratedPlan,operation:EditOperation,lockedIds:string[],places:readonly TravelPlace[],transfers:readonly TransferReference[]):GeneratedPlan {
  const next=proposalOf(before),day=next.days.find(d=>d.visits.some(v=>v.id===operation.id));
  const visit=day?.visits.find(v=>v.id===operation.id);
  if(!visit||!day)throw new AgentError("UNKNOWN_VISIT","要修改的安排不存在。");
  if(lockedIds.includes(visit.id))throw new AgentError("LOCKED_CHANGED","这项安排已锁定，请先解锁。");
  if(operation.type==="remove")day.visits=day.visits.filter(v=>v.id!==visit.id);
  else if(operation.type==="replace") {visit.placeId=operation.placeId;visit.reason="由你选择替换；开放、预约与实际交通仍需确认。";}
  else if(operation.type==="reschedule") {const target=next.days.find(d=>d.day===operation.day);if(!target)throw new AgentError("INVALID_INPUT","目标日期无效。");day.visits=day.visits.filter(v=>v.id!==visit.id);target.visits.push({...visit,start:operation.start,end:operation.end});}
  else throw new AgentError("INVALID_INPUT","不支持这个修改动作。");
  // Recompute physical continuity from the last activity, never invent a transfer.
  let city=before.requirements.draft.startCity;
  for(const d of next.days){d.startCity=city;const last=[...d.visits.map(v=>({...v,city:places.find(p=>p.id===v.placeId)?.city})),...d.fixedArrangements].sort((a,b)=>a.end.localeCompare(b.end)).at(-1);if(last?.city)city=last.city;}
  assertLocks(before,next,lockedIds);
  next.summary="已按你的操作调整安排并重新检查；以各日安排为准，开放、预约与实际交通仍需确认。";
  return checkedPlan(next,before.requirements,places,transfers);
}
export function diffPlans(before:GeneratedPlan,after:GeneratedPlan):string[] {
  const a=entries(before),b=entries(after),changes:string[]=[];
  const name=(id:string)=>[...before.places,...after.places].find(p=>p.id===id)?.name??id;
  if(before.title!==after.title)changes.push(`标题：${before.title} → ${after.title}`);
  if(before.summary!==after.summary)changes.push(`说明更新：${after.summary}`);
  for(const d of after.days){const old=before.days.find(x=>x.day===d.day);if(old&&old.title!==d.title)changes.push(`第 ${d.day} 天标题：${old.title} → ${d.title}`);}
  for(const old of a){const next=b.find(v=>v.id===old.id);if(!next)changes.push(`移除：第 ${old.day} 天 ${name(old.placeId)}`);else if(JSON.stringify(old)!==JSON.stringify(next))changes.push(`调整：${name(old.placeId)}（第 ${old.day} 天 ${old.start}—${old.end}） → ${name(next.placeId)}（第 ${next.day} 天 ${next.start}—${next.end}）`);}
  for(const next of b)if(!a.some(v=>v.id===next.id))changes.push(`新增：第 ${next.day} 天 ${name(next.placeId)} ${next.start}—${next.end}`);
  if(before.days.length!==after.days.length)changes.push(`天数：${before.days.length} → ${after.days.length}`);
  if(before.requirements.draft.pace!==after.requirements.draft.pace)changes.push(`节奏：${before.requirements.draft.pace} → ${after.requirements.draft.pace}`);
  return changes.length?changes:["安排未变化，更新说明与检查记录。"];
}
export function newDocument(plan:GeneratedPlan):PlanDocument{return {schema:1,id:crypto.randomUUID(),cursor:0,lockedIds:[],versions:[{id:crypto.randomUUID(),at:new Date().toISOString(),label:"首次生成",plan,changes:[]}]};}
export function commitRevision(doc:PlanDocument,plan:GeneratedPlan,label:string):PlanDocument {
  assertLocks(doc.versions[doc.cursor].plan,plan,doc.lockedIds);
  const versions=[...doc.versions.slice(0,doc.cursor+1),{id:crypto.randomUUID(),at:new Date().toISOString(),label,plan,changes:diffPlans(doc.versions[doc.cursor].plan,plan)}].slice(-20);
  return {...doc,versions,cursor:versions.length-1};
}
export function restoreDocument(raw:string,places:readonly TravelPlace[],transfers:readonly TransferReference[]):PlanDocument {
  if(raw.length>3_000_000)throw new AgentError("SAVE_INVALID","本地记录过大，未载入。");
  let value:unknown;try{value=JSON.parse(raw);}catch{throw new AgentError("SAVE_INVALID","本地记录无法读取，原记录未被覆盖。");}
  if(!record(value)||value.schema!==1||!text(value.id,100)||!Array.isArray(value.versions)||value.versions.length<1||value.versions.length>20||!Number.isInteger(value.cursor)||Number(value.cursor)<0||Number(value.cursor)>=value.versions.length||!Array.isArray(value.lockedIds)||!value.lockedIds.every(id=>text(id,100)))throw new AgentError("SAVE_INVALID","本地记录格式或版本不支持，原记录未被覆盖。");
  const versions=value.versions.map(v=>{if(!record(v)||!text(v.id,100)||!text(v.at,100)||!text(v.label,200)||!record(v.plan))throw new AgentError("SAVE_INVALID","版本记录不完整。");const plan=checkedPlan(v.plan,parseRequirements(v.plan.requirements,places),places,transfers);plan.generatedAt=typeof v.plan.generatedAt==="string"?v.plan.generatedAt:plan.generatedAt;return {id:v.id,at:v.at,label:v.label,plan,changes:Array.isArray(v.changes)&&v.changes.every(c=>text(c,2000))?v.changes as string[]:[]};});
  const result:PlanDocument={schema:1,id:value.id,versions,cursor:Number(value.cursor),lockedIds:value.lockedIds as string[]};
  assertLocks(versions[result.cursor].plan,versions[result.cursor].plan,result.lockedIds);return result;
}
