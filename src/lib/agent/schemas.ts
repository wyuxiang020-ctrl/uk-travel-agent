import type { FunctionTool } from "./types";
const string={type:"string"};
const city={type:"string",enum:["london","oxford","bath"]};
const clock={type:"string",pattern:"^([01][0-9]|2[0-3]):[0-5][0-9]$"};
const date={type:"string",pattern:"^[0-9]{4}-[0-9]{2}-[0-9]{2}$"};
const object=(properties:Record<string,unknown>,required=Object.keys(properties))=>({type:"object",properties,required,additionalProperties:false});
const array=(items:unknown)=>({type:"array",items});
const fixed=object({id:string,title:string,city,start:clock,end:clock});
const visit=object({id:string,placeId:string,start:clock,end:clock});
const dayFields={date,startCity:city,availableFrom:clock,availableUntil:clock,visits:array(visit),fixedArrangements:array(fixed)};
export const requirementSchema=object({
  draft:object({idea:string,cities:array(city),startDate:date,datesFlexible:{type:"boolean",enum:[false]},days:{type:"integer",minimum:3,maximum:7},startCity:city,endCity:city,interests:array(string),pace:{type:"string",enum:["relaxed","balanced","full"]},mustVisit:string,fixedPlans:string}),
  summary:string,availableFrom:clock,availableUntil:clock,mustVisitIds:array(string),
  fixed:array(object({day:{type:"integer",minimum:1,maximum:7},...fixed.properties})),
});
function tool(name:string,description:string,parameters:Record<string,unknown>):FunctionTool {return {type:"function",function:{name,description,parameters,strict:false}};}
export const readTools=[
  tool("list_places","查询所支持三城的精选资料；非实时网络搜索。",object({city,query:string,category:string},[])),
  tool("get_place","读取指定地点的完整来源、预约、开放和未知资料。",object({id:string})),
  tool("get_transfer","获取两座城市间参考与编辑估算，不能当实时班次。",object({from:city,to:city})),
  tool("check_day","实际运行单日时间及固定安排检查，不修改计划。",object(dayFields)),
];
export const understandTools=[...readTools,
  tool("ask_questions","缺少日期、条件矛盾、地点不支持或固定活动含糊时，问最多三个具体问题后停止。",object({questions:{...array(string),minItems:1,maxItems:3}})),
  tool("confirm_requirements","把理解后的需求交给用户确认；尚不生成行程。只能保留或经用户补充确认后的条件。",requirementSchema),
];
export const planTools=[...readTools,
  tool("submit_plan","一次提交全部旅行日；每天至少一项参观或固定活动，不能提交空白日。服务器独立核验全部地点、日期连续性、转场与固定安排，无需事先逐日重复检查；失败须修正完整候选。",object({title:string,summary:string,days:array(object({...dayFields,day:{type:"integer"},title:string,visits:array(object({...visit.properties,reason:string}))}))})),
  tool("cannot_plan","已确认的条件无法同时满足时停止，说明原因；不能修改用户要求。",object({reason:string})),
];
