import { UK_DESTINATIONS } from "../data/uk-destinations.ts";
import { journeyBySlug } from "../data/journeys.ts";
import { emptyRoute, validDate } from "./uk-route.ts";
export const INTAKE_KEY="slowtrail.travel-intake.v1", ROUTE_INTENT="slowtrail.route-intent.v1";
export const WORKING_PLAN_KEY="slowtrail.working-plan.v1";
export type TravelIntake={version:1; destinations:string[]; destinationText:string; month:string; year:string; date:string; days:string; people:string; budget:string; idea:string; template:string};
export function emptyIntake():TravelIntake{return {version:1,destinations:[],destinationText:"",month:"",year:"",date:"",days:"",people:"",budget:"",idea:"",template:""};}
export function parseIntake(raw:string):TravelIntake{
 if(raw.length>15000)throw new Error("旅行想法过长。"); const v=JSON.parse(raw);
 if(!v||v.version!==1||!Array.isArray(v.destinations)||v.destinations.length>12||new Set(v.destinations).size!==v.destinations.length||!v.destinations.every((id:unknown)=>UK_DESTINATIONS.some(d=>d.id===id)))throw new Error("目的地记录不完整。");
 for(const k of ["date","days","people","budget","idea","template"])if(typeof v[k]!=="string")throw new Error("旅行记录格式不正确。");
 if(v.idea.length>2000||v.date&&!validDate(v.date)||v.days&&!/^(?:[2-9]|[1-5]\d|60)$/.test(v.days)||v.people&&!/^(?:[1-9]|1[0-2])$/.test(v.people)||v.budget&&!/^\d{1,5}$/.test(v.budget)||v.template&&!journeyBySlug(v.template))throw new Error("请检查日期、天数、人数或预算。");
 const destinationText=v.destinationText??"",month=v.month??"",year=v.year??"";
 if(typeof destinationText!=="string"||destinationText.length>200||typeof month!=="string"||month&&!/^(?:[1-9]|1[0-2])$/.test(month)||typeof year!=="string"||year&&!/^(?:20\d\d|2100)$/.test(year))throw new Error("请检查目的地、月份与年份。");
 return {version:1,destinations:v.destinations,destinationText,month,year,date:v.date,days:v.days,people:v.people,budget:v.budget,idea:v.idea,template:v.template};
}
export function intakeRoute(input:TravelIntake){
 const v=parseIntake(JSON.stringify(input)),j=journeyBySlug(v.template),route=emptyRoute(v.idea);
 route.startDate=v.date;
 const ids=v.destinations;
 const nights=v.days?Number(v.days)-1:undefined;
 if(nights!==undefined&&nights<ids.length)throw new Error("天数不足以在每个据点住宿，先减少据点或增加天数。");
 if(nights!==undefined&&ids.length&&Math.ceil(nights/ids.length)>30)throw new Error("每个据点最多住宿30晚，请增加据点或缩短旅行时间。");
 route.stops=ids.map((id,i)=>({key:`intake-${i}-${id}`,destination:UK_DESTINATIONS.find(d=>d.id===id)!,nights:nights===undefined?j?.stops.find(s=>s.id===id)?.nights||2:Math.floor(nights/ids.length)+(i<nights%ids.length?1:0)}));
 if(j&&v.days===String(j.days)&&ids.join()===j.stops.map(s=>s.id).join())route.stops=route.stops.map((s,i)=>({...s,nights:j.stops[i].nights}));
 route.idea=[v.idea,v.destinationText?`目的地意向：${v.destinationText}`:"",!v.date&&(v.month||v.year)?`出行意向：${v.year||"年份待定"}年${v.month||"月份待定"}月，具体日期待定。`:"",v.days?`计划${v.days}天。`:"",v.people?`同行${v.people}人。`:"",v.budget?`每人预算意向£${v.budget}（未核算）。`:""].filter(Boolean).join("\n");
 return route;
}
