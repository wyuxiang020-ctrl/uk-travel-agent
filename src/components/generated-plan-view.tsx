"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Clock3 } from "lucide-react";
import type { GeneratedPlan } from "@/lib/agent/types";
import { CITIES } from "@/lib/demo-trip";
import ItineraryMap from "./itinerary-map";
import { PlaceEvidence, EvidenceSources } from "./place-evidence";

export default function GeneratedPlanView({plan}:{plan:GeneratedPlan}){
  const [index,setIndex]=useState(0);
  const [selected,setSelected]=useState<string|null>(null);
  const day=plan.days[index];
  const check=plan.checks.find(c=>c.day===day.day)?.result;
  const selectedPlace=plan.places.find(p=>p.id===selected&&day.visits.some(v=>v.placeId===p.id))??plan.places.find(p=>p.id===day.visits[0]?.placeId);
  const stops=day.visits.map(v=>{const p=plan.places.find(p=>p.id===v.placeId)!;return {id:p.id,name:p.name,position:p.position};});
  return <section className="generated-plan" aria-label="真实模型行程结果">
    <div className="agent-card"><p className="agent-eyebrow">MODEL-GENERATED / 英国旅行草案</p><h2>{plan.title}</h2><p>{plan.summary}</p><div className="agent-result-note"><strong>已通过基础时间检查，仍需确认开放、预约与实际交通。</strong><p>当前版本形成于 {new Date(plan.generatedAt).toLocaleString("zh-CN")}。地点资料来自项目来源快照，推荐理由包含模型建议或手动调整说明；保存状态请见工作区上方；修改后会重新检查。</p></div></div>
    <nav className="agent-day-tabs" aria-label="选择生成行程的日期">{plan.days.map((d,i)=><button key={d.day} aria-pressed={index===i} onClick={()=>{setIndex(i);setSelected(null);}}>第 {d.day} 天<span>{d.date.slice(5)}</span></button>)}</nav>
    <div className="agent-result-grid"><div className="agent-card"><p className="agent-eyebrow">{day.date} / {day.availableFrom}—{day.availableUntil}</p><h3>{day.title}</h3><p className="agent-small">当天从 {CITIES.find(c=>c.id===day.startCity)?.name} 开始，时间为英国当地时间。</p>
      <ol className="agent-visit-list">{day.visits.map((visit,i)=>{const place=plan.places.find(p=>p.id===visit.placeId)!;return <li key={visit.id} className={selectedPlace?.id===place.id?"is-selected":""}><button onClick={()=>setSelected(place.id)} aria-pressed={selectedPlace?.id===place.id}><span className="agent-visit-number">{i+1}</span><span><small><Clock3 size={12}/> {visit.start}—{visit.end}</small><strong>{place.name}</strong></span><ArrowUpRight size={17}/></button><p>{visit.reason}</p></li>;})}</ol>
      {day.fixedArrangements.length>0&&<div className="agent-fixed"><h4>已确认的固定安排</h4>{day.fixedArrangements.map(f=><p key={f.id}>{f.start}—{f.end} · {f.title} · {CITIES.find(c=>c.id===f.city)?.name}</p>)}</div>}
      {check&&<details className="agent-checks" open><summary>这一天的检查与待确认事项（{check.issues.length}）</summary><p>{check.summary}</p><ul>{check.issues.map((issue,i)=><li key={`${issue.code}-${i}`}><span>{issue.severity==="warning"?"提醒":issue.severity==="conflict"?"冲突":"待确认"}</span>{issue.message}</li>)}</ul>{check.transfers.map((t,i)=><p key={i}>转场：{CITIES.find(c=>c.id===t.from)?.name} → {CITIES.find(c=>c.id===t.to)?.name}，间隔 {t.availableMinutes} 分钟 / 项目预留 {t.neededMinutes??"未知"} 分钟。</p>)}</details>}
    </div><aside className="agent-map-panel"><h3>这一天的重点地点</h3>{stops.length?<ItineraryMap stops={stops} selectedId={selectedPlace?.id??null} onSelect={setSelected}/>:<p>这一天只有固定活动，未提供可标记的参观点。</p>}<p className="agent-small">只标记参观点，位置近似；固定活动与真实导航不在地图上呈现。</p>{selectedPlace&&<details key={selectedPlace.id} className="agent-evidence"><summary>{selectedPlace.name} · 资料与来源</summary><PlaceEvidence place={selectedPlace}/></details>}</aside></div>
    {plan.transfers.length>0&&<details className="agent-card"><summary>本次使用的城际交通参考</summary>{plan.transfers.map(t=><section key={`${t.from}-${t.to}`}><h3>{t.route}</h3><p>{t.planningBasis}</p><p className="agent-small">{t.caveat}</p><EvidenceSources sources={t.sources}/></section>)}</details>}
    <p className="agent-small">如需改变要求，可 <Link href="/plan/details" className="agent-link">返回需求页重新规划</Link>。这会发起新任务，也可在下方调整安排、锁定、撤销并保存版本。</p>
  </section>;
}
