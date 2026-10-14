"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CircleAlert, Square, RotateCcw } from "lucide-react";
import { usePlannerDraft } from "./planner-context";
import { CITIES, validateDraft } from "@/lib/demo-trip";
import { TRAVEL_PLACES } from "@/data/travel-catalog";
import type { AgentEvent, AgentOutcome, AgentRequest, Requirements } from "@/lib/agent/types";
import PlanWorkspace from "./plan-workspace";
import "./agent-planner.css";

const cityName=(id:string)=>CITIES.find(c=>c.id===id)?.name??id;
const placeName=(id:string)=>TRAVEL_PLACES.find(p=>p.id===id)?.name??id;
type Status={configured:boolean;message:string;maxRounds:number};

export default function AgentPlanner(){
  const {draft}=usePlannerDraft();
  const [status,setStatus]=useState<Status|null>(null);
  const [statusError,setStatusError]=useState("");
  const [outcome,setOutcome]=useState<AgentOutcome|null>(null);
  const [requirements,setRequirements]=useState<Requirements|null>(null);
  const [answers,setAnswers]=useState<{questions:string[];answer:string}[]>([]);
  const [answer,setAnswer]=useState("");
  const [events,setEvents]=useState<AgentEvent[]>([]);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [lastAction,setLastAction]=useState<"understand"|"generate">("understand");
  const [attempt,setAttempt]=useState(0);
  const [refresh,setRefresh]=useState(0);
  const controller=useRef<AbortController|null>(null);
  const sequence=useRef(0);
  const resultHeading=useRef<HTMLHeadingElement>(null);
  const valid=Object.keys(validateDraft(draft)).length===0;
  useEffect(()=>{
    const abort=new AbortController();
    fetch("/api/agent",{signal:abort.signal,cache:"no-store"}).then(async r=>{if(!r.ok)throw new Error();const data=await r.json();if(typeof data.configured!=="boolean")throw new Error();if(!abort.signal.aborted){setStatus(data);setStatusError("");}}).catch(()=>{if(!abort.signal.aborted)setStatusError("无法读取规划服务状态，请确认本地服务运行后重试。");});
    return ()=>abort.abort();
  },[refresh]);
  useEffect(()=>()=>{sequence.current++;controller.current?.abort();},[]);
  useEffect(()=>{if(outcome)resultHeading.current?.focus({preventScroll:true});},[outcome]);

  async function run(action:"understand"|"generate",history=answers){
    if(controller.current||!valid||!status?.configured)return;
    if(action==="generate"&&!requirements)return;
    const runId=++sequence.current;const abort=new AbortController();controller.current=abort;
    const timeout=setTimeout(()=>abort.abort("timeout"),250000);
    setBusy(true);setError("");setEvents([]);setOutcome(null);setLastAction(action);setAttempt(n=>n+1);
    const payload:AgentRequest=action==="understand"?{action,requestId:crypto.randomUUID(),draft,answers:history}:{action,requestId:crypto.randomUUID(),requirements:requirements!};
    let terminal=false;
    try{
      const response=await fetch("/api/agent",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),signal:abort.signal});
      if(!response.ok){const body=await response.json();throw new Error(body.error?.message??"规划服务暂时无法完成请求。");}
      if(!response.body||!response.headers.get("content-type")?.includes("application/x-ndjson"))throw new Error("规划服务返回了无法识别的内容。");
      const reader=response.body.getReader();const decoder=new TextDecoder();let buffer="";let total=0;
      const handle=(line:string)=>{
        if(!line.trim()||sequence.current!==runId)return;
        const event=JSON.parse(line) as AgentEvent;
        if(typeof event.type!=="string"||typeof event.sequence!=="number"||typeof event.message!=="string")throw new Error("规划执行记录不完整。");
        setEvents(previous=>[...previous,event]);
        if(event.type==="result"&&event.outcome){terminal=true;setOutcome(event.outcome);if(event.outcome.kind==="requirements")setRequirements(event.outcome.requirements);}
        if(event.type==="error"){terminal=true;setError(event.message);}
      };
      try{while(true){const item=await reader.read();if(sequence.current!==runId)break;if(item.done)break;total+=item.value.byteLength;if(total>8*1024*1024)throw new Error("执行记录过大，当前请求已停止。");buffer+=decoder.decode(item.value,{stream:true});let end:number;while((end=buffer.indexOf("\n"))!==-1){handle(buffer.slice(0,end));buffer=buffer.slice(end+1);}}buffer+=decoder.decode();if(buffer.trim())handle(buffer);}
      finally{reader.releaseLock();}
      if(sequence.current===runId&&!terminal)throw new Error("连接中断，尚未收到完整结果。请重试，当前没有发布行程。");
    }catch(e){
      const timedOut=abort.signal.reason==="timeout";
      abort.abort();
      if(sequence.current===runId)setError(timedOut?"连接等待超时，本次请求已停止，可以重试。":e instanceof Error?e.message:"规划未完成，请重试。");
    }finally{clearTimeout(timeout);if(sequence.current===runId){controller.current=null;setBusy(false);}}
  }
  function cancel(){sequence.current++;controller.current?.abort();controller.current=null;setBusy(false);setError("已取消本次规划；没有生成结果。正在进行的模型请求可能仍产生少量费用。");}
  function submitAnswer(event:React.FormEvent){event.preventDefault();if(!answer.trim()||outcome?.kind!=="questions")return;const next=[...answers,{questions:outcome.questions,answer:answer.trim()}];setAnswers(next);setAnswer("");void run("understand",next);}

  return <div className="agent-page">
    <header className="agent-header"><Link href="/" className="agent-brand">SLOWTRAIL<span>欧洲慢游</span></Link><nav aria-label="规划导航"><Link href="/plan/details">旅行需求</Link><Link href="/plan/example">查看示例</Link><Link href="/plan/saved">已保存行程</Link></nav></header>
    <main className="agent-shell">
      <div className="agent-heading"><p className="agent-eyebrow">YOUR JOURNEY, TAKING SHAPE</p><h1>把想法，变成下一程。</h1><p>先确认我们理解的旅行，再查询资料、编排行程与检查时间。</p></div>
      {!valid?<section className="agent-card"><h2>先说说你的旅行。</h2><p>当前没有完整需求。刷新后内容不会保留，请回到需求页填写。</p><Link className="agent-button" href="/plan/details">填写旅行需求 <ArrowRight size={16}/></Link></section>:<>
        {outcome?.kind!=="plan"&&<section className="agent-card agent-request"><p className="agent-eyebrow">你带来的想法</p><blockquote>{draft.idea}</blockquote><p>{draft.cities.map(cityName).join(" · ")} / {draft.days} 天 / {draft.datesFlexible?"日期待确认":draft.startDate}</p><Link href="/plan/details" className="agent-link"><ArrowLeft size={14}/> 返回修改需求</Link></section>}
        {(statusError||status&&!status.configured)&&<section className="agent-notice" role="status"><CircleAlert size={20}/><div><h2>等待模型配置</h2><p>{statusError||status?.message}</p><p>接入代码可使用；当前不会发起模型调用，也不会把示例当作生成结果。</p><button className="agent-link" onClick={()=>setRefresh(n=>n+1)}><RotateCcw size={14}/> 重新检查配置</button><Link className="agent-link" href="/plan/example">先浏览固定示例 <ArrowRight size={14}/></Link></div></section>}
        {!outcome&&!busy&&!error&&<section className="agent-start"><p>需求和补充说明将发送到你在本机配置的模型服务。每次最多 {status?.maxRounds||10} 次模型请求；不会预订或付款。</p><button className="agent-button" disabled={!status?.configured} onClick={()=>void run("understand")}>{status===null&&!statusError?"正在读取配置…":"理解我的旅行需求"}<ArrowRight size={16}/></button></section>}
        {busy&&<section className="agent-card" aria-busy="true"><div className="agent-running"><div><p className="agent-eyebrow">正在执行 / 第 {attempt} 次任务</p><h2 role="status">{events.at(-1)?.message??"正在连接规划服务…"}</h2><p>这里显示实际请求和工具执行状态，没有预设进度。</p></div><button className="agent-secondary" onClick={cancel}><Square size={13}/>取消</button></div></section>}
        {error&&<section className="agent-notice" role="alert"><CircleAlert size={20}/><div><h2>本次没有完成规划</h2><p>{error}</p><button className="agent-button" disabled={busy||!status?.configured} onClick={()=>void run(lastAction)}>重新发起请求 <RotateCcw size={15}/></button><p className="agent-small">重试会重新调用模型，可能产生新的费用。</p></div></section>}
        {outcome?.kind==="questions"&&<section className="agent-card"><p className="agent-eyebrow">补充一点信息</p><h2 ref={resultHeading} tabIndex={-1}>让这次旅行更明确。</h2><ol>{outcome.questions.map(q=><li key={q}>{q}</li>)}</ol>{answers.length<4?<form onSubmit={submitAnswer}><label htmlFor="agent-answer">你的补充说明</label><textarea id="agent-answer" value={answer} maxLength={1500} required rows={4} onChange={e=>setAnswer(e.target.value)}/><button className="agent-button" disabled={!answer.trim()||busy} type="submit">补充并继续 <ArrowRight size={16}/></button></form>:<p>已补问四轮，请回到需求页整理条件后重新开始。</p>}</section>}
        {outcome?.kind==="requirements"&&<section className="agent-card"><p className="agent-eyebrow">先确认，再规划</p><h2 ref={resultHeading} tabIndex={-1}>这是我们理解的旅行。</h2><p>{outcome.requirements.summary}</p><dl className="agent-facts"><div><dt>目的地与天数</dt><dd>{outcome.requirements.draft.cities.map(cityName).join(" · ")} / {outcome.requirements.draft.days} 天</dd></div><div><dt>出发与每天活动时间</dt><dd>{outcome.requirements.draft.startDate} / {outcome.requirements.availableFrom}—{outcome.requirements.availableUntil}（英国当地）</dd></div><div><dt>首尾城市</dt><dd>{cityName(outcome.requirements.draft.startCity)} → {cityName(outcome.requirements.draft.endCity)}</dd></div><div><dt>兴趣与节奏</dt><dd>{outcome.requirements.draft.interests.join("、")||"未特别指定"} / {{relaxed:"慢慢来",balanced:"刚刚好",full:"多看看"}[outcome.requirements.draft.pace]}</dd></div><div><dt>必去地点</dt><dd>{outcome.requirements.mustVisitIds.map(placeName).join("、")||"未指定"}</dd></div><div><dt>固定安排</dt><dd>{outcome.requirements.fixed.length?outcome.requirements.fixed.map(f=><p key={f.id}>第 {f.day} 天 · {cityName(f.city)} · {f.start}—{f.end} · {f.title}</p>):"未指定"}</dd></div></dl><p className="agent-small">请特别核对日期、必去和固定活动是否遗漏。确认后才会进行新一轮模型调用。</p><div className="agent-actions"><Link className="agent-secondary" href="/plan/details">返回修改</Link><button className="agent-button" onClick={()=>void run("generate")}>条件正确，开始规划 <ArrowRight size={16}/></button></div></section>}
        {outcome?.kind==="plan"&&<PlanWorkspace key={outcome.plan.generatedAt} initialPlan={outcome.plan}/>}
        {events.length>0&&<details className="agent-trace"><summary>本次实际执行记录 · {events.filter(e=>e.type==="tool_finished").length} 次工具返回</summary><p>“流程”表示系统自动执行，“模型”表示模型请求。记录只在当前页面保留。</p><ol>{events.map(e=><li key={e.sequence}><div><time>{new Date(e.at).toLocaleTimeString("zh-CN")}</time> {e.actor==="workflow"?"流程":e.actor==="model"?"模型":"系统"} · {e.message}{e.elapsedMs!==undefined&&<small> / {e.elapsedMs} ms</small>}</div>{(e.input!==undefined||e.output!==undefined)&&<details><summary>查看输入与返回</summary><pre>{JSON.stringify({input:e.input,output:e.output},null,2)}</pre></details>}</li>)}</ol></details>}
      </>}
      <p className="agent-footnote">英国三城首个案例 · 资料为有来源的本地快照 · 行程可修改与保存；离开前请保存，刷新后从“已保存行程”恢复。</p>
    </main>
  </div>;
}
