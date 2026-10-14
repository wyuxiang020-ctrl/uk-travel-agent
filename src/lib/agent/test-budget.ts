import { closeSync, existsSync, mkdirSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { AgentError } from "./validation.ts";

// Explicitly scoped to this GPT-4.1 API test. Prices checked 2026-10-11:
// https://developers.openai.com/api/docs/models/gpt-4.1
// $2 / million input tokens and $8 / million output tokens; ignore cache discounts.
type Entry = { id:string; reservedMicros:number; chargedMicros:number; status:"reserved"|"reported"; promptTokens?:number; completionTokens?:number };
type Ledger = { version:1; id:string; limitMicros:number; entries:Entry[] };
export type TestBudget = { id:string; limitUsd:number };
export function parseTestBudget(env:Record<string,string|undefined>):TestBudget|undefined {
  if(!env.TRAVEL_MODEL_TEST_BUDGET_USD)return undefined;
  const limitUsd=Number(env.TRAVEL_MODEL_TEST_BUDGET_USD);
  const id=env.TRAVEL_MODEL_TEST_BUDGET_ID;
  if(!Number.isFinite(limitUsd)||limitUsd<=0||limitUsd>1||!id||!/^[a-zA-Z0-9_-]{1,80}$/.test(id))throw new AgentError("MODEL_CONFIG_INVALID","本轮测试预算配置无效，额度必须在 1 美元以内。");
  return {id,limitUsd};
}
function transact<T>(budget:TestBudget,root:string,fn:(ledger:Ledger)=>T):T {
  const directory=join(root,"work");mkdirSync(directory,{recursive:true});
  const path=join(directory,`model-budget-${budget.id}.json`);
  let lock:number;
  try{lock=openSync(`${path}.lock`,"wx");}catch{throw new AgentError("BUDGET_BUSY","测试预算记录正被使用或需要核查，已停止模型调用。");}
  try{
    const ledger:Ledger=existsSync(path)?JSON.parse(readFileSync(path,"utf8")):{version:1,id:budget.id,limitMicros:Math.floor(budget.limitUsd*1_000_000),entries:[]};
    if(ledger.version!==1||ledger.id!==budget.id||ledger.limitMicros!==Math.floor(budget.limitUsd*1_000_000)||!Array.isArray(ledger.entries)||ledger.entries.some(e=>!Number.isSafeInteger(e.chargedMicros)||e.chargedMicros<0||!Number.isSafeInteger(e.reservedMicros)||e.reservedMicros<e.chargedMicros))throw new AgentError("BUDGET_INVALID","测试预算记录不一致，已停止模型调用。");
    const result=fn(ledger);
    writeFileSync(`${path}.tmp`,JSON.stringify(ledger,null,2),"utf8");renameSync(`${path}.tmp`,path);
    return result;
  }catch(error){if(error instanceof AgentError)throw error;throw new AgentError("BUDGET_INVALID","无法安全记录测试额度，已停止模型调用。");}
  finally{closeSync(lock);unlinkSync(`${path}.lock`);}
}
export function reserveTestCall(budget:TestBudget,body:string,maxTokens:number,root=process.cwd()) {
  // All current messages/tools are text JSON. Count each UTF-8 byte as an input
  // token, plus 8192 tokens for protocol overhead: deliberately above normal usage.
  const reservedMicros=(Buffer.byteLength(body,"utf8")+8192)*2+maxTokens*8;
  const id=crypto.randomUUID();
  transact(budget,root,ledger=>{
    const committed=ledger.entries.reduce((n,e)=>n+e.chargedMicros,0);
    // Leave a 10% margin rather than using every last cent of the allowance.
    if(committed+reservedMicros>Math.floor(ledger.limitMicros*0.9))throw new AgentError("TEST_BUDGET_EXHAUSTED","剩余测试额度不足以安全发起下一次调用，已停止。请先查看本轮用量。");
    ledger.entries.push({id,reservedMicros,chargedMicros:reservedMicros,status:"reserved"});
  });
  // Failed/unknown requests retain the full reservation, including after restart.
  return (usage:unknown)=>{
    if(!usage||typeof usage!=="object")return;
    const u=usage as Record<string,unknown>;
    if(!Number.isSafeInteger(u.prompt_tokens)||!Number.isSafeInteger(u.completion_tokens)||Number(u.prompt_tokens)<0||Number(u.completion_tokens)<0)return;
    const chargedMicros=Number(u.prompt_tokens)*2+Number(u.completion_tokens)*8;
    transact(budget,root,ledger=>{
      const entry=ledger.entries.find(e=>e.id===id);
      if(!entry||entry.status!=="reserved"||chargedMicros>entry.reservedMicros)throw new AgentError("BUDGET_INVALID","模型用量超出预留记录，需要核查后再继续。");
      Object.assign(entry,{chargedMicros,status:"reported",promptTokens:u.prompt_tokens,completionTokens:u.completion_tokens});
    });
  };
}
