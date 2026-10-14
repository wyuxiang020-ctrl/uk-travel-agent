import { AgentError } from "./validation.ts";

export async function readAgentBody(request:Request):Promise<unknown>{
  if(request.headers.get("content-type")?.split(";")[0].trim().toLowerCase()!=="application/json")throw new AgentError("UNSUPPORTED_MEDIA_TYPE","请使用 JSON 提交需求。");
  const origin=request.headers.get("origin");
  // Next may normalize the internal request URL to localhost while the browser
  // uses 127.0.0.1. Only accept the two explicit local preview origins/hosts.
  const localOrigins=["http://127.0.0.1:3005","http://localhost:3005"];
  const localAlias=origin&&localOrigins.includes(origin)&&["127.0.0.1:3005","localhost:3005"].includes(request.headers.get("host")??"");
  if((origin&&origin!==new URL(request.url).origin&&!localAlias)||request.headers.get("sec-fetch-site")==="cross-site")throw new AgentError("ORIGIN_REJECTED","不能从其他网站发起模型调用。");
  if(!request.body)throw new AgentError("INVALID_INPUT","需求不能为空。");
  const reader=request.body.getReader();let raw="",length=0;const decoder=new TextDecoder("utf-8",{fatal:true});
  try{while(true){const item=await reader.read();if(item.done)break;length+=item.value.byteLength;if(length>32768){await reader.cancel();throw new AgentError("PAYLOAD_TOO_LARGE","需求超过 32 KiB，请简化后提交。");}raw+=decoder.decode(item.value,{stream:true});}raw+=decoder.decode();return JSON.parse(raw);}
  catch(e){if(e instanceof AgentError)throw e;throw new AgentError("INVALID_JSON","需求格式无法读取。");}finally{reader.releaseLock();}
}

// Local single-process guard; not a persistent job queue or multi-user deployment control.
const state=globalThis as typeof globalThis & { slowtrailAgentGate?:{active:boolean;seen:Map<string,number>} };
export function acquireRun(id:string,now=Date.now()){
  const gate=state.slowtrailAgentGate??= {active:false,seen:new Map()};
  for(const [key,time]of gate.seen)if(now-time>30*60*1000)gate.seen.delete(key);
  if(gate.seen.has(id))throw new AgentError("DUPLICATE_REQUEST","这次请求已处理或仍在进行；重试请明确发起新任务。");
  if(gate.active)throw new AgentError("AGENT_BUSY","已有一个规划任务正在运行，请等待结束或取消后重试。");
  if(gate.seen.size>=1000)throw new AgentError("AGENT_BUSY","本地请求过多，请稍后再试。");
  gate.active=true;gate.seen.set(id,now);let released=false;
  return ()=>{if(!released){released=true;gate.active=false;}};
}
