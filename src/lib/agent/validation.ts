import { validateDraft } from "../demo-trip.ts";
import type { TripDraft, CityId } from "../demo-trip";
import type { TravelPlace } from "../travel-types";
import type { AgentRequest, Requirements, PlanProposal } from "./types";

export class AgentError extends Error {
  code: string;
  constructor(code: string, message: string) { super(message); this.name = "AgentError"; this.code = code; }
}
export function record(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
export function text(value: unknown, max = 1000): value is string { return typeof value === "string" && value.trim().length > 0 && value.length <= max; }
export function minutes(value: unknown): number {
  if (typeof value !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return -1;
  const [h, m] = value.split(":").map(Number); return h * 60 + m;
}
export function dateAt(start: string, day: number) {
  const date = new Date(`${start}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + day - 1); return date.toISOString().slice(0, 10);
}
export function parseDraft(value: unknown): TripDraft {
  if (!record(value)) throw new AgentError("INVALID_INPUT", "请填写旅行需求。");
  const errors = validateDraft(value as TripDraft);
  if (Object.keys(errors).length) throw new AgentError("INVALID_INPUT", Object.values(errors).join(" "));
  if((value.interests as string[]).length>20||(value.interests as string[]).some(x=>x.length>100))throw new AgentError("INVALID_INPUT","兴趣选项过多或过长。");
  // Copy only the supported fields. No user-controlled messages or model configuration.
  return { idea: value.idea as string, cities: [...value.cities as CityId[]], startDate: value.startDate as string,
    datesFlexible: value.datesFlexible as boolean, days: value.days as number, startCity: value.startCity as CityId,
    endCity: value.endCity as CityId, interests: [...value.interests as string[]], pace: value.pace as TripDraft["pace"],
    mustVisit: value.mustVisit as string, fixedPlans: value.fixedPlans as string };
}
export function parseRequirements(value: unknown, places: readonly TravelPlace[]): Requirements {
  if (!record(value)) throw new AgentError("INVALID_REQUIREMENTS", "旅行条件格式不完整。");
  const draft = parseDraft(value.draft);
  if (draft.datesFlexible || !draft.startDate) throw new AgentError("DATE_REQUIRED", "真实规划需要确认出发日期，以检查当天开放资料；请先补充日期。");
  if (!text(value.summary, 1500) || minutes(value.availableFrom) < 0 || minutes(value.availableUntil) <= minutes(value.availableFrom))
    throw new AgentError("INVALID_REQUIREMENTS", "请确认需求摘要和每天的活动时间范围。");
  const ids = value.mustVisitIds;
  if (!Array.isArray(ids) || ids.length > 20 || ids.some(id => !text(id, 100) || !places.some(p => p.id === id && draft.cities.includes(p.city))))
    throw new AgentError("UNKNOWN_PLACE", "必去地点必须来自所选城市的资料库；未收录地点需要先说明。");
  if (new Set(ids).size !== ids.length) throw new AgentError("INVALID_REQUIREMENTS", "必去地点重复。");
  if (!Array.isArray(value.fixed) || value.fixed.length > 15) throw new AgentError("INVALID_REQUIREMENTS", "固定安排格式不正确，最多 15 项。");
  const fixed = value.fixed.map(item => {
    if (!record(item) || !Number.isInteger(item.day) || Number(item.day) < 1 || Number(item.day) > draft.days || !text(item.id,100) || !text(item.title,200) || !draft.cities.includes(item.city as CityId) || minutes(item.start)<0 || minutes(item.end)<=minutes(item.start))
      throw new AgentError("INVALID_REQUIREMENTS", "固定安排须明确第几天、城市和同日开始结束时间。");
    if (minutes(item.start)<minutes(value.availableFrom) || minutes(item.end)>minutes(value.availableUntil))
      throw new AgentError("FIXED_CONFLICT", "固定安排超出每日活动时间，请先确认时间范围。");
    return { day: item.day as number, id: item.id as string, title:item.title as string, city:item.city as CityId, start:item.start as string, end:item.end as string };
  });
  if (new Set(fixed.map(f=>f.id)).size!==fixed.length) throw new AgentError("INVALID_REQUIREMENTS", "固定安排编号重复。");
  for (let i=0;i<fixed.length;i++) for(let j=i+1;j<fixed.length;j++) {
    const a=fixed[i],b=fixed[j];
    if(a.day===b.day && minutes(a.start)<minutes(b.end) && minutes(b.start)<minutes(a.end)) throw new AgentError("FIXED_CONFLICT", "两项固定安排时间重叠，请先调整或确认。");
  }
  return { draft, summary:value.summary, availableFrom:value.availableFrom as string, availableUntil:value.availableUntil as string, mustVisitIds:[...ids] as string[], fixed };
}
export function parseRequest(value: unknown, places: readonly TravelPlace[]): AgentRequest {
  if (!record(value) || !text(value.requestId,80) || !/^[a-zA-Z0-9_-]{8,80}$/.test(value.requestId)) throw new AgentError("INVALID_INPUT", "请求编号无效，请重新发起。");
  if(value.action==="revise") {
    const baseRequirements=parseRequirements(value.baseRequirements,places);
    const basePlan=parsePlan(value.basePlan,baseRequirements,places);
    if(!text(value.instruction,1500)||!Array.isArray(value.lockedIds)||value.lockedIds.length>35||new Set(value.lockedIds).size!==value.lockedIds.length||!value.lockedIds.every(id=>text(id,100)&&basePlan.days.some(d=>d.visits.some(v=>v.id===id))))throw new AgentError("INVALID_INPUT","修改说明或锁定记录无效。");
    // Reject impossible shortening before a paid model request, with an actionable reason.
    const draft=parseDraft({...baseRequirements.draft,days:value.days,pace:value.pace});
    if(baseRequirements.fixed.some(f=>f.day>draft.days))throw new AgentError("FIXED_DAY_REMOVED","缩短后的行程不包含部分固定活动日期。请保留相应天数；若要改变固定条件，请新建旅行。");
    const lockedIds=value.lockedIds as string[];
    if(basePlan.days.some(d=>d.day>draft.days&&d.visits.some(v=>lockedIds.includes(v.id))))throw new AgentError("LOCKED_DAY_REMOVED","缩短后的行程不包含部分已锁定景点的日期。请先解锁这些安排，或保留相应天数。");
    const requirements=parseRequirements({...baseRequirements,draft,summary:value.instruction},places);
    return {action:"revise",requestId:value.requestId,basePlan,baseRequirements,requirements,lockedIds:value.lockedIds as string[],instruction:value.instruction};
  }
  if(value.action==="generate") return {action:"generate",requestId:value.requestId,requirements:parseRequirements(value.requirements,places)};
  if(value.action!=="understand") throw new AgentError("INVALID_INPUT", "请求类型无效。");
  if(!Array.isArray(value.answers) || value.answers.length>4) throw new AgentError("INVALID_INPUT", "最多补充四轮信息，请回到表单整理需求。");
  const answers=value.answers.map(item=>{
    if(!record(item)||!Array.isArray(item.questions)||item.questions.length>3||!item.questions.every(q=>text(q,250))||!text(item.answer,1500)) throw new AgentError("INVALID_INPUT","补充说明格式不正确。");
    return {questions:item.questions as string[],answer:item.answer};
  });
  return {action:"understand",requestId:value.requestId,draft:parseDraft(value.draft),answers};
}

/** Validate model output independently; never trust an AI claim that a plan is checked. */
export function parsePlan(value: unknown, req: Requirements, places: readonly TravelPlace[]): PlanProposal {
  if(!record(value)||!text(value.title,100)||!text(value.summary,1500)||!Array.isArray(value.days)||value.days.length!==req.draft.days)
    throw new AgentError("INVALID_PLAN", "行程必须包含所要求的全部天数、标题和摘要。");
  const maxVisits={relaxed:3,balanced:4,full:5}[req.draft.pace];
  const invalidDays=value.days.flatMap((raw,index)=>record(raw)&&Array.isArray(raw.visits)&&Array.isArray(raw.fixedArrangements)&&(raw.visits.length>maxVisits||raw.visits.length+raw.fixedArrangements.length===0)?[index+1]:[]);
  if(invalidDays.length)throw new AgentError("INVALID_PLAN",`第 ${invalidDays.join("、")} 天须有至少一项参观或固定安排，且每天参观点不超过 ${maxVisits} 个。休息可作为活动间留白，不能提交完全空白的旅行日；请一次修正这些日期。`);
  const used=new Set<string>(); const itemIds=new Set<string>(); const seenCities=new Set<CityId>();
  let previousCity=req.draft.startCity;
  const days=value.days.map((raw,index)=>{
    const day=index+1;
    if(!record(raw)||raw.day!==day||raw.date!==dateAt(req.draft.startDate,day)||!text(raw.title,100)||raw.startCity!==previousCity||raw.availableFrom!==req.availableFrom||raw.availableUntil!==req.availableUntil||!Array.isArray(raw.visits)||!Array.isArray(raw.fixedArrangements))
      throw new AgentError("INVALID_PLAN", `第 ${day} 天的日期、起点或活动时间与已确认条件不符。`);
    const visits=raw.visits.map(v=>{
      if(!record(v)||!text(v.id,100)||!text(v.placeId,100)||!text(v.reason,500)||minutes(v.start)<0||minutes(v.end)<=minutes(v.start)) throw new AgentError("INVALID_PLAN",`第 ${day} 天的参观内容或时间不完整。`);
      const place=places.find(p=>p.id===v.placeId);
      if(!place||!req.draft.cities.includes(place.city)) throw new AgentError("UNKNOWN_PLACE",`地点 ${v.placeId} 不在所选城市资料中。`);
      if(used.has(place.id)) throw new AgentError("DUPLICATE_PLACE",`${place.name} 被重复安排，请选择其他地点或减少安排。`);
      if(itemIds.has(v.id)) throw new AgentError("INVALID_PLAN","安排编号重复。");
      itemIds.add(v.id); used.add(place.id); seenCities.add(place.city);
      return {id:v.id,placeId:place.id,start:v.start as string,end:v.end as string,reason:v.reason};
    });
    visits.sort((a,b)=>minutes(a.start)-minutes(b.start));
    const expected=req.fixed.filter(f=>f.day===day).map(f=>({id:f.id,title:f.title,city:f.city,start:f.start,end:f.end})).sort((a,b)=>minutes(a.start)-minutes(b.start));
    const actualFixed=raw.fixedArrangements;
    if(actualFixed.length!==expected.length || expected.some(f=>!actualFixed.some((x:unknown)=>record(x)&&["id","title","city","start","end"].every(k=>x[k]===f[k as keyof typeof f]))))
      throw new AgentError("FIXED_CHANGED",`第 ${day} 天未原样保留已确认的固定安排。`);
    for(const fixed of expected) { if(itemIds.has(fixed.id)) throw new AgentError("INVALID_PLAN","安排编号重复。"); itemIds.add(fixed.id); seenCities.add(fixed.city); }
    const timeline=[...visits.map(v=>({...v,city:places.find(p=>p.id===v.placeId)!.city})),...expected].sort((a,b)=>minutes(a.end)-minutes(b.end));
    previousCity=timeline.at(-1)!.city;
    return {day,date:raw.date as string,title:raw.title,startCity:raw.startCity as CityId,availableFrom:req.availableFrom,availableUntil:req.availableUntil,visits,fixedArrangements:expected};
  });
  if(previousCity!==req.draft.endCity || req.draft.cities.some(c=>!seenCities.has(c))) throw new AgentError("CITY_MISMATCH","行程未覆盖全部所选城市，或未在指定城市结束。");
  if(req.mustVisitIds.some(id=>!used.has(id))) throw new AgentError("MUST_VISIT_MISSING","行程遗漏已确认的必去地点。");
  return {title:value.title,summary:value.summary,days};
}
