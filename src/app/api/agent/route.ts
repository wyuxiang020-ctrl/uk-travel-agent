import { TRAVEL_PLACES, TRANSFER_REFERENCES } from "@/data/travel-catalog";
import { createModelClient, getModelConfig, modelStatus } from "@/lib/agent/model";
import { parseRequest, AgentError } from "@/lib/agent/validation";
import { acquireRun, readAgentBody } from "@/lib/agent/http";
import { runAgent } from "@/lib/agent/runner";
import type { AgentEvent } from "@/lib/agent/types";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export function GET(){return Response.json({...modelStatus(),scope:"英国三城 · 3–7天 · 支持修改与本机保存",verification:"配置状态不代表本次生成一定成功，请以实际执行结果为准。"},{headers:{"Cache-Control":"no-store"}});}
export async function POST(request:Request){
  try{
    const input=parseRequest(await readAgentBody(request),TRAVEL_PLACES);
    const config=getModelConfig();
    request.signal.throwIfAborted();
    const release=acquireRun(input.requestId);
    const abort=new AbortController();const deadline=setTimeout(()=>abort.abort("deadline"),240000);
    const signal=AbortSignal.any([request.signal,abort.signal]);const encoder=new TextEncoder();
    let closed=false;
    const stream=new ReadableStream<Uint8Array>({
      start(controller){
        let sequence=0;
        const emit=(event:AgentEvent)=>{sequence=event.sequence;if(!closed&&!request.signal.aborted)controller.enqueue(encoder.encode(JSON.stringify(event)+"\n"));};
        void runAgent(input,{places:TRAVEL_PLACES,transfers:TRANSFER_REFERENCES,model:createModelClient(config),maxRounds:config.maxRounds,signal,emit})
          .then(outcome=>{if(!signal.aborted)emit({sequence:sequence+1,at:new Date().toISOString(),type:"result",message:outcome.kind==="plan"?"行程已通过基础检查，仍有待确认事项":outcome.kind==="questions"?"需要补充旅行信息":"请确认理解后的旅行条件",outcome});})
          .catch(error=>{
            const failure=signal.aborted?new AgentError(abort.signal.reason==="deadline"?"RUN_TIMEOUT":"CANCELLED",abort.signal.reason==="deadline"?"本次规划达到总时限，已停止。":"已停止当前规划。"):error instanceof AgentError?error:new AgentError("INTERNAL_ERROR","规划暂时无法完成，未生成或改写行程。");
            emit({sequence:sequence+1,at:new Date().toISOString(),type:"error",message:failure.message,code:failure.code});
          })
          .finally(()=>{clearTimeout(deadline);release();if(!closed){closed=true;controller.close();}});
      },
      cancel(){closed=true;abort.abort("cancelled");},
    });
    return new Response(stream,{headers:{"Content-Type":"application/x-ndjson; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
  }catch(error){
    const failure=error instanceof AgentError?error:new AgentError("INVALID_INPUT","请求无法处理，请检查需求后重试。");
    const status=failure.code==="MODEL_NOT_CONFIGURED"||failure.code==="MODEL_CONFIG_INVALID"?503:failure.code==="AGENT_BUSY"||failure.code==="DUPLICATE_REQUEST"?409:failure.code==="PAYLOAD_TOO_LARGE"?413:failure.code==="ORIGIN_REJECTED"?403:failure.code==="UNSUPPORTED_MEDIA_TYPE"?415:400;
    return Response.json({ok:false,error:{code:failure.code,message:failure.message}},{status,headers:{"Cache-Control":"no-store"}});
  }
}
