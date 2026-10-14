// Server-only dependency graph: imported by API routes, never by UI components.
import { AgentError, record, text } from "./validation.ts";
import type { ModelClient, ModelReply, ToolCall } from "./types";
import { parseTestBudget, reserveTestCall } from "./test-budget.ts";
import type { TestBudget } from "./test-budget.ts";

export type ModelConfig={endpoint:string;apiKey:string;model:string;maxRounds:number;timeoutMs:number;maxTokens:number;tokenField:"max_tokens"|"max_completion_tokens";testBudget?:TestBudget};
function integer(value:string|undefined,fallback:number,min:number,max:number) { const n=Number(value??fallback); if(!Number.isInteger(n)||n<min||n>max) throw new AgentError("MODEL_CONFIG_INVALID","模型调用上限配置无效，请检查本地配置说明。"); return n; }
export function getModelConfig(env:Record<string,string|undefined>=process.env):ModelConfig {
  if(env.TRAVEL_MODEL_ENABLED!=="true") throw new AgentError("MODEL_NOT_CONFIGURED","真实规划尚未启用。请先完成本地模型配置并确认测试额度；仍可查看示例和地点资料。");
  if(!env.TRAVEL_MODEL_BASE_URL?.trim()||!env.TRAVEL_MODEL_API_KEY?.trim()||!env.TRAVEL_MODEL_NAME?.trim()) throw new AgentError("MODEL_NOT_CONFIGURED","缺少模型服务地址、模型名称或密钥。请在本地配置后重启服务。");
  let url:URL;
  try {url=new URL(env.TRAVEL_MODEL_BASE_URL);} catch {throw new AgentError("MODEL_CONFIG_INVALID","模型服务地址无效。");}
  if(url.username||url.password||url.search||url.hash || !(url.protocol==="https:" || (url.protocol==="http:"&&["127.0.0.1","localhost","[::1]"].includes(url.hostname)))) throw new AgentError("MODEL_CONFIG_INVALID","模型地址须使用 HTTPS；本机服务可使用 HTTP，不接受地址中的凭据或查询参数。");
  const field=env.TRAVEL_MODEL_TOKEN_FIELD??"max_completion_tokens";
  if(field!=="max_tokens"&&field!=="max_completion_tokens") throw new AgentError("MODEL_CONFIG_INVALID","模型输出上限字段配置无效。");
  const testBudget=parseTestBudget(env);
  if(testBudget&&(url.href.replace(/\/$/,"")!=="https://api.openai.com/v1"||env.TRAVEL_MODEL_NAME.trim()!=="gpt-4.1"))throw new AgentError("MODEL_CONFIG_INVALID","本轮费用限制只允许已确认的 OpenAI gpt-4.1 服务。");
  return {endpoint:url.href.replace(/\/$/,"")+"/chat/completions",apiKey:env.TRAVEL_MODEL_API_KEY.trim(),model:env.TRAVEL_MODEL_NAME.trim(),maxRounds:integer(env.TRAVEL_MODEL_MAX_ROUNDS,10,1,16),timeoutMs:integer(env.TRAVEL_MODEL_TIMEOUT_MS,45000,1000,90000),maxTokens:integer(env.TRAVEL_MODEL_MAX_OUTPUT_TOKENS,6000,512,12000),tokenField:field,testBudget};
}
export function modelStatus() {
  try {const c=getModelConfig();return {configured:true,message:"模型配置已填写，尚不代表已通过真实连通验收。",maxRounds:c.maxRounds};}
  catch(e){const error=e as AgentError;return {configured:false,message:error.message,maxRounds:0};}
}
async function readResponse(response:Response) {
  if(!response.body) throw new AgentError("MODEL_INVALID_RESPONSE","模型未返回内容。");
  const reader=response.body.getReader(); const decoder=new TextDecoder(); let bytes=0; let raw="";
  try {while(true) {const item=await reader.read();if(item.done)break;bytes+=item.value.byteLength;if(bytes>1024*1024){await reader.cancel();throw new AgentError("MODEL_INVALID_RESPONSE","模型响应过大，本次已停止。");}raw+=decoder.decode(item.value,{stream:true});} raw+=decoder.decode();}
  finally {reader.releaseLock();}
  try{return JSON.parse(raw) as unknown;}catch{throw new AgentError("MODEL_INVALID_RESPONSE","模型返回的格式无法识别，请重试或检查服务兼容性。");}
}
export function createModelClient(config:ModelConfig,transport:typeof fetch=fetch):ModelClient {
  return async(messages,tools,signal)=>{
    signal.throwIfAborted();
    const timeout=AbortSignal.timeout(config.timeoutMs); const combined=AbortSignal.any([signal,timeout]);
    try {
      const bodyText=JSON.stringify({model:config.model,messages,tools,tool_choice:"required",parallel_tool_calls:false,[config.tokenField]:config.maxTokens,stream:false});
      const settle=config.testBudget?reserveTestCall(config.testBudget,bodyText,config.maxTokens):undefined;
      const response=await transport(config.endpoint,{method:"POST",redirect:"error",signal:combined,headers:{"Content-Type":"application/json",Authorization:`Bearer ${config.apiKey}`},body:bodyText});
      if(!response.ok){await response.body?.cancel();if(response.status===401||response.status===403)throw new AgentError("MODEL_AUTH_FAILED","模型服务拒绝授权，请检查本地密钥和模型权限。");if(response.status===429)throw new AgentError("MODEL_RATE_LIMIT","模型额度或请求频率受限，请稍后重试或检查额度。");throw new AgentError("MODEL_SERVICE_ERROR",`模型服务请求失败（HTTP ${response.status}），本次没有生成行程。`);}
      const body=await readResponse(response);
      if(record(body))settle?.(body.usage);
      if(!record(body)||!Array.isArray(body.choices)||!record(body.choices[0])) throw new AgentError("MODEL_INVALID_RESPONSE","模型未返回有效选项。");
      const choice=body.choices[0];
      if(choice.finish_reason==="length") throw new AgentError("MODEL_OUTPUT_LIMIT","模型输出达到本次上限，内容不完整；请缩小需求或调整本地输出上限后重试。");
      const message=choice.message;
      if(!record(message)||message.refusal) throw new AgentError("MODEL_REFUSED","模型没有完成这次请求，请检查需求或更换可用配置。");
      if(!Array.isArray(message.tool_calls)||message.tool_calls.length===0||message.tool_calls.length>8) throw new AgentError("MODEL_INVALID_RESPONSE","模型未按工具调用格式返回结果，请确认所选模型支持函数工具调用。");
      const seen=new Set<string>();
      const calls:ToolCall[]=message.tool_calls.map(call=>{
        if(!record(call)||!text(call.id,120)||seen.has(call.id)||call.type!=="function"||!record(call.function)||!text(call.function.name,100)||!text(call.function.arguments,100000)) throw new AgentError("MODEL_INVALID_RESPONSE","模型返回了不完整的工具调用。");
        seen.add(call.id);return {id:call.id,type:"function",function:{name:call.function.name,arguments:call.function.arguments}};
      });
      const rawUsage=body.usage;
      const usage:ModelReply["usage"]=record(rawUsage)?Object.fromEntries(["prompt_tokens","completion_tokens","total_tokens"].filter(k=>typeof rawUsage[k]==="number"&&Number.isFinite(rawUsage[k])).map(k=>[k,rawUsage[k]])):undefined;
      return {message:{role:"assistant",content:null,tool_calls:calls},usage};
    } catch(error) {
      if(signal.aborted) throw new AgentError("CANCELLED","已停止当前规划。");
      if(timeout.aborted) throw new AgentError("MODEL_TIMEOUT","模型响应超时，本次已停止；可以保留需求后重试。");
      if(error instanceof AgentError) throw error;
      // Never return upstream response bodies, request headers, or secrets to the browser.
      throw new AgentError("MODEL_CONNECTION_FAILED","无法连接模型服务，请检查服务地址和网络后重试。");
    }
  };
}
