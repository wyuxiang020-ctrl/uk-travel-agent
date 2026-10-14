import { UK_DESTINATIONS } from "../data/uk-destinations.ts";
import { parseIntake, intakeRoute, type TravelIntake } from "./travel-intake.ts";
import { type RouteDraft, routeNights } from "./uk-route.ts";
export function intakeFromRoute(value:TravelIntake,route:RouteDraft):TravelIntake{
 return {...value,destinations:[...new Set(route.stops.filter(s=>!s.destination.custom).map(s=>s.destination.id))],date:route.startDate,days:route.stops.length?String(routeNights(route)+1):value.days};
}
export function missingIntake(value:TravelIntake){
 const missing:string[]=[];
 if(!value.destinations.length&&!value.destinationText.trim())missing.push("想去的目的地");
 if(!value.date&&!(value.month&&value.year))missing.push("出发时间");
 if(!value.days)missing.push("旅行天数");
 if(!value.people)missing.push("同行人数");
 return missing;
}
export function applyIntakeToRoute(route:RouteDraft,previous:TravelIntake,next:TravelIntake):RouteDraft{
 const checked=parseIntake(JSON.stringify(next));
 const stopsChanged=previous.destinations.join()!==checked.destinations.join()||previous.days!==checked.days;
 const dateChanged=route.startDate!==checked.date;
 const generated=intakeRoute(stopsChanged?checked:{...checked,destinations:[]});
 return {...route,idea:generated.idea,startDate:checked.date,stops:stopsChanged?generated.stops:route.stops,
 connections:stopsChanged||dateChanged?{}:route.connections,
 arrival:stopsChanged||dateChanged?{...route.arrival,number:"",time:""}:route.arrival,
 departure:stopsChanged||dateChanged?{...route.departure,number:"",time:""}:route.departure};
}
export function intakeSummary(value:TravelIntake){return [value.destinations.map(id=>UK_DESTINATIONS.find(d=>d.id===id)?.name).join(" → "),value.destinationText,value.date||[value.year&&`${value.year}年`,value.month&&`${value.month}月`].filter(Boolean).join(""),value.days&&`${value.days}天`,value.people&&`${value.people}人`,value.budget&&`£${value.budget}/人`].filter(Boolean).join(" · ");}
