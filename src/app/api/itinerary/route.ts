import { TRAVEL_PLACES, TRANSFER_REFERENCES } from "@/data/travel-catalog";
import { readAgentBody } from "@/lib/agent/http";
import { AgentError, parsePlan, parseRequirements, record, text } from "@/lib/agent/validation";
import { checkedPlan, editPlan, assertLocks } from "@/lib/agent/itinerary";
import type { EditOperation } from "@/lib/agent/itinerary";
export const runtime="nodejs";
export async function POST(request:Request){
  try{
    const input=await readAgentBody(request);
    if(!record(input)||!record(input.operation)||!Array.isArray(input.lockedIds)||!input.lockedIds.every(id=>text(id,100)))throw new AgentError("INVALID_INPUT","修改参数不完整。");
    const requirements=parseRequirements(input.requirements,TRAVEL_PLACES);
    const proposal=parsePlan(input.plan,requirements,TRAVEL_PLACES);
    assertLocks(proposal,proposal,input.lockedIds as string[]);
    const before=checkedPlan(proposal,requirements,TRAVEL_PLACES,TRANSFER_REFERENCES);
    const next=editPlan(before,input.operation as EditOperation,input.lockedIds as string[],TRAVEL_PLACES,TRANSFER_REFERENCES);
    return Response.json({ok:true,plan:next},{headers:{"Cache-Control":"no-store"}});
  }catch(e){const error=e instanceof AgentError?e:new AgentError("INVALID_INPUT","修改未完成，原行程未改变。");return Response.json({ok:false,error:{code:error.code,message:error.message}},{status:400});}
}
