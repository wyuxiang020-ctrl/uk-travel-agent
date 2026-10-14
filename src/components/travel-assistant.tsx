"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {JOURNEYS} from "@/data/journeys";
import {INTAKE_KEY,parseIntake,type TravelIntake} from "@/lib/travel-intake";
import {intakeFromRoute,intakeSummary,missingIntake} from "@/lib/intake-assistant";
import type {RouteDraft} from "@/lib/uk-route";
import "./travel-assistant.css";
type Proposal={candidate:TravelIntake;summary:string;questions:string[];missing:string[]};
type Chat={role:"user"|"assistant";content:string};
export default function TravelAssistant({value,route,ready,onApply}:{value:TravelIntake;route:RouteDraft;ready:boolean;onApply:(next:TravelIntake,previous:TravelIntake)=>void}){
 const router=useRouter(),[text,setText]=useState(""),[history,setHistory]=useState<Chat[]>([]),[proposal,setProposal]=useState<Proposal|null>(null),[busy,setBusy]=useState(false),[proposalSource,setProposalSource]=useState(""),[understood,setUnderstood]=useState<TravelIntake|null>(null),[status,setStatus]=useState({enabled:false,message:"正在检查需求助手…"}),[error,setError]=useState("");
 const request=useRef<AbortController|null>(null),snapshot=useRef(""),previous=useRef(value),latest=useRef("");
 const current=intakeFromRoute(value,route),fingerprint=JSON.stringify({value,route});
 useEffect(()=>{latest.current=fingerprint;},[fingerprint]);
 useEffect(()=>{const controller=new AbortController();fetch("/api/intake",{signal:controller.signal}).then(r=>r.json()).then(setStatus).catch(()=>{if(!controller.signal.aborted)setStatus({enabled:false,message:"暂时无法连接需求助手，可以先手动安排路线。"});});return()=>{controller.abort();request.current?.abort();};},[]);
 const displayed=understood&&proposalSource===fingerprint?understood:current;const missing=missingIntake(displayed);
 async function send(){if(!text.trim()||busy)return;setError("");setProposal(null);setBusy(true);const controller=new AbortController();request.current=controller;snapshot.current=fingerprint;previous.current=current;const message=text.trim();
 try{const response=await fetch("/api/intake",{method:"POST",signal:controller.signal,headers:{"Content-Type":"application/json"},body:JSON.stringify({requestId:crypto.randomUUID(),input:{message,current:understood&&proposalSource===fingerprint?understood:current,history:history.slice(-6),routeContext:JSON.stringify({stops:route.stops.map(s=>({name:s.destination.name,nights:s.nights})),notes:route.idea}).slice(0,4000)}})});const data=await response.json();if(!response.ok||!data.ok)throw new Error(data.error?.message||"暂时无法理解这段需求。");if(controller.signal.aborted)return;if(latest.current!==snapshot.current)throw new Error("等待期间计划已发生变化，本次建议未采用。请基于新计划重新发送。");parseIntake(JSON.stringify(data.result.candidate));setProposal(data.result);setUnderstood(data.result.candidate);setProposalSource(snapshot.current);setHistory(h=>[...h,{role:"user",content:message},{role:"assistant",content:[data.result.summary,...data.result.questions].join("\n")}].slice(-6) as Chat[]);setText("");}
 catch(e){if(!controller.signal.aborted)setError((e as Error).message);}finally{if(request.current===controller){setBusy(false);request.current=null;}}}
 function back(){try{localStorage.setItem(INTAKE_KEY,JSON.stringify(current));router.push("/plan");}catch{setError("无法保存基础信息，请检查浏览器存储权限。");}}
 function apply(){if(!proposal)return;if(fingerprint!==snapshot.current){setError("计划已修改，请重新发送后再采用建议。");return;}try{onApply(proposal.candidate,previous.current);setProposal(null);setUnderstood(null);setError("");}catch(e){setError((e as Error).message);}}
 return <section className="ta" aria-labelledby="assistant-title"><div className="ta-heading"><p>YOUR PERSONAL JOURNEY</p><h1 id="assistant-title">你的旅行，从一句想法开始。</h1></div><div className="ta-composer"><label htmlFor="travel-chat">这次，想怎样旅行？</label><textarea id="travel-chat" disabled={!ready||busy} value={text} maxLength={2000} onChange={e=>setText(e.target.value)} placeholder="比如：明年5月，我们两个人想去英国玩9天。喜欢艺术和湖泊，希望在爱丁堡多住两晚，每人预算1500英镑。"/><div className="ta-send"><span>目的地、时间、同行的人，或者只是一个期待。</span>{busy?<button onClick={()=>{request.current?.abort();setBusy(false);setError("已取消，原计划没有改变。");}}>停止处理</button>:<button disabled={!ready||!text.trim()||!status.enabled} onClick={send}>发送给旅行助手 ↗</button>}</div></div><div className="ta-under"><button onClick={back} disabled={!ready||busy}>← 返回填写基础信息</button><span role="status">{busy?"正在理解你的想法…":status.message}</span></div>
 {intakeSummary(displayed)&&<p className="ta-summary">{displayed===current?"已采用的旅行轮廓：":"待确认的旅行轮廓："}{intakeSummary(displayed)}</p>}{missing.length>0&&<p className="ta-missing">还可以补充：{missing.join("、")}。{!status.enabled?"可通过上面的基础信息入口填写。":"直接在对话框告诉我就好。"}</p>}
 {error&&<p className="ta-error" role="alert">{error}</p>}
 {history.length>0&&<div className="ta-history" aria-live="polite">{history.slice(-4).map((h,i)=><div key={i} className={h.role}><strong>{h.role==="user"?"你":"旅行助手"}</strong><p>{h.content}</p></div>)}</div>}
 {proposal&&<div className="ta-proposal"><h2>确认这份旅行轮廓</h2><p>{intakeSummary(proposal.candidate)||"目的地与时间还待补充"}</p><p>{proposal.candidate.idea}</p><small>采用后更新下方路线。目的地、天数或日期变动时，需重新填写航班号、时间及城际交通记录；具体住宿晚数仍可修改。</small><button disabled={fingerprint!==proposalSource} onClick={apply}>采用并更新下方计划 ↓</button><button className="ta-dismiss" onClick={()=>setProposal(null)}>暂不采用，继续聊</button></div>}
 {!history.length&&<div className="ta-examples"><span>也可以这样开始</span>{JOURNEYS.map(j=><button key={j.slug} disabled={busy} onClick={()=>{setText(`我想以“${j.title}”为灵感，去${j.stops.map(s=>s.name).join("、")}，共${j.days}天。${j.subtitle}。`);document.getElementById("travel-chat")?.focus();}}>{j.days}天 · {j.title} ↗</button>)}</div>}
 </section>;
}
