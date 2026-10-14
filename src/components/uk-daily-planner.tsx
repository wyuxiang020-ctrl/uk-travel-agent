"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { UK_PLACES, CORRIDORS, KNOWLEDGE_VALID_THROUGH } from "@/data/uk-knowledge";
import { ROUTE_STORAGE_KEY, parseRoute, type RouteDraft } from "@/lib/uk-route";
import { DAILY_HANDOFF, DAILY_STORAGE, routeDays, dailyPlaces, parseDailyDocument, type DailyDocument, type DailyVisit, type DailyFixed, type DailyRequest } from "@/lib/uk-daily";
import "./uk-route-planner.css";
import "./uk-daily-planner.css";

type Entry = DailyDocument["entries"][number];
const labels = { arrival: "抵达日", stay: "停留日", transfer: "转场日", departure: "离境日" };
export default function UkDailyPlanner() {
  const [route, setRoute] = useState<RouteDraft | null>(null), [entries, setEntries] = useState<Entry[]>([]);
  const [selected, setSelected] = useState(1), [visits, setVisits] = useState<DailyVisit[]>([]), [fixed, setFixed] = useState<DailyFixed[]>([]);
  const [from, setFrom] = useState("10:00"), [until, setUntil] = useState("17:00"), [preferences, setPreferences] = useState("");
  const [must, setMust] = useState<string[]>([]), [candidate, setCandidate] = useState<Entry | null>(null);
  const [notice, setNotice] = useState("正在读取已确认路线…"), [error, setError] = useState("");
  const [enabled, setEnabled] = useState(false), [status, setStatus] = useState("正在检查服务状态…"), [busy, setBusy] = useState(false), [confirmed, setConfirmed] = useState(false), [events, setEvents] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null), fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const saved = localStorage.getItem(DAILY_STORAGE);
        let doc: DailyDocument | null = null;
        try { if (saved) doc = parseDailyDocument(saved); } catch { setError("已存逐日记录无法通过当前资料检查，原记录未删除；请重新检查后保存。"); }
        const handoff = sessionStorage.getItem(DAILY_HANDOFF);
        const savedRoute = localStorage.getItem(ROUTE_STORAGE_KEY);
        // An explicit route confirmation takes priority; otherwise restore the complete daily document.
        const next = handoff ? parseRoute(handoff) : doc?.route ?? (savedRoute ? parseRoute(savedRoute) : null);
        if (!next) { setNotice("请先在英国路线页安排并确认你的住宿路线。"); return; }
        setRoute(next);
        const compatible = doc && JSON.stringify(doc.route) === JSON.stringify(next);
        setEntries(compatible && doc ? doc.entries : []);
        setNotice(compatible ? "已恢复此前采用的逐日安排。" : "已读取路线。抵达、转场和离境保留为交通日；停留日可逐天展开。旧版本不会混入新路线。");
      } catch { setError("路线无法读取，请返回路线页核对或导入有效备份。"); }
    });
    const abort = new AbortController();
    fetch("/api/uk-daily", { signal: abort.signal, cache: "no-store" }).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(s => { if (active) { setEnabled(s.enabled === true); setStatus(s.message); } }).catch(() => { if (active) setStatus("服务状态读取失败；生成保持停用，可刷新重试。"); });
    return () => { active = false; abort.abort(); abortRef.current?.abort(); };
  }, []);
  const days = route ? routeDays(route) : [], current = days.find(d => d.day === selected), places = route ? dailyPlaces(route, selected) : [];
  const ready = current?.kind === "stay" && places.some(p => p.availability.state === "known");
  function invalidate() { setCandidate(null); setConfirmed(false); setError(""); }
  function selectDay(day: number) {
    if (busy) return;
    const previous = entries.find(e => e.request.day === day);
    setSelected(day); setVisits(previous?.result.visits || []); setFixed(previous?.request.fixed || []); setMust(previous?.request.must || []); setFrom(previous?.request.from || "10:00"); setUntil(previous?.request.until || "17:00"); setPreferences(previous?.request.preferences || ""); invalidate(); setEvents([]);
  }
  function addPlace(id: string) {
    invalidate();
    const p = places.find(p => p.id === id)!;
    const start = p.availability.from && p.availability.from > from ? p.availability.from : from;
    const n = Number(start.slice(0, 2)) * 60 + Number(start.slice(3)) + p.minutes;
    const end = `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
    setVisits(v => [...v, { placeId: id, start, end, reason: "手动选择，时长为项目建议；可编辑时间后检查。" }]);
  }
  async function run(action: "check" | "generate") {
    if (!route || !ready || busy || action === "generate" && (!enabled || !confirmed)) return;
    const request: DailyRequest = { route, day: selected, from, until, must, fixed, preferences };
    const controller = new AbortController(); abortRef.current = controller; setBusy(true); setError(""); setCandidate(null); setEvents([]);
    const timer = setTimeout(() => controller.abort(), 190000);
    try {
      const response = await fetch("/api/uk-daily", { method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal, body: JSON.stringify({ action, requestId: crypto.randomUUID(), request, proposal: { visits } }) });
      const body = await response.json(); if (!response.ok || !body.ok) throw new Error(body.error?.message || "检查未完成。");
      const { route: ignored, ...requirements } = request; void ignored;
      // Revalidate response shape and all constraints before it can be adopted or saved.
      const doc = parseDailyDocument(JSON.stringify({ version: 1, route, entries: [{ request: requirements, result: body.result }] }));
      setCandidate(doc.entries[0]); setEvents(body.events || []);
    } catch (e) { setError(controller.signal.aborted ? "本次已停止，已采用的安排保留。" : e instanceof Error ? e.message : "安排未完成。"); }
    finally { clearTimeout(timer); abortRef.current = null; setBusy(false); }
  }
  function adopt() {
    if (!candidate) return;
    setEntries(e => [...e.filter(item => item.request.day !== selected), candidate].sort((a, b) => a.request.day - b.request.day)); setVisits(candidate.result.visits); setCandidate(null); setNotice(`已采用第 ${selected} 天安排，记得保存整条路线。`);
  }
  function save(exportFile = false) {
    if (!route) return;
    try {
      const doc = parseDailyDocument(JSON.stringify({ version: 1, route, entries }));
      if (exportFile) {
        const url = URL.createObjectURL(new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" })); const a = document.createElement("a"); a.href = url; a.download = "slowtrail-uk-daily.json"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else { localStorage.setItem(DAILY_STORAGE, JSON.stringify(doc)); sessionStorage.setItem(DAILY_HANDOFF, JSON.stringify(route)); setNotice("路线和已采用的每日安排已保存。尚未采用的候选不计入保存。"); }
    } catch { setError("保存未完成，当前内容仍保留；请核对安排或导出备份。"); }
  }
  return <main className="uk-page"><header className="uk-header"><Link href="/" className="uk-brand">SLOWTRAIL<span>欧洲慢游</span></Link><nav><Link href="/plan/route">修改英国路线</Link><Link href="/plan/details">原三城 Agent</Link></nav></header><div className="uk-shell"><section className="uk-intro"><p className="uk-eyebrow">THE PLACES BECOME DAYS</p><h1>沿着路线，<br/>展开每一天。</h1><p>先确认目的地与停留时间，再根据有来源的资料选择想去的地方。</p></section><div role="status" className="uk-status">{notice}</div>{error && <p role="alert" className="uk-alert">{error}</p>}
      {!route ? <p className="uk-empty"><Link href="/plan/route">返回英国路线，先安排住宿据点 →</Link></p> : <>
      <section className="ud-overview"><p>{route.stops.map(s => s.destination.name).join(" → ")}</p><small>旅行想法：{route.idea || "未填写"}。想法仅作参考，固定活动和必去地点需在下方明确填写。</small><p className="uk-muted">当前新逐日资料覆盖曼彻斯特、约克、爱丁堡、皮特洛赫里，核对日2026-10-12，维护范围至{KNOWLEDGE_VALID_THROUGH}。不代表全英国景点已覆盖。</p></section>
      <div className="ud-layout"><nav className="ud-days" aria-label="选择旅行日期">{days.map(d => <button key={d.day} disabled={busy} aria-current={d.day === selected ? "step" : undefined} onClick={() => selectDay(d.day)}><span>DAY {String(d.day).padStart(2, "0")}</span><strong>{d.name}</strong><small>{d.date} · {labels[d.kind]}{entries.some(e => e.request.day === d.day) ? " · 已采用" : ""}</small></button>)}</nav>
      <section className="ud-day"><p className="uk-eyebrow">DAY {selected} / {current?.date}</p><h2>{current?.name} · {current && labels[current.kind]}</h2><p className="uk-muted">{current?.note}</p>
      {current?.kind !== "stay" && <div className="uk-alert">当前保留交通时间，不会用景点填满这一天。<Link href="/plan/route"> 返回路线核对航班与接驳 ↗</Link></div>}
      {current?.kind === "stay" && !places.length && <p className="uk-alert">这个据点尚未接入逐日资料，不会替换为其他城市。若此前手填了 Pitlochry，请回到路线选择新的“皮特洛赫里”目录条目；系统不会擅自认定同名地点。</p>}
      {!!places.length && <div className="ud-evidence"><h3>这一站，有哪些值得停留。</h3><p className="uk-muted">开放资料不是当日运营保证。建议时长为项目估算；标记资料不足的地点暂不进入自动安排。</p>{places.map(p => <article key={p.id}><div><h4>{p.name}</h4><span className="uk-tag">{p.availability.state === "known" ? "有常规时间资料" : p.availability.state === "closed" ? "当天关闭" : "时间待核对"}</span></div><p>{p.description}</p><small>{p.opening} {p.booking}</small><small>{p.availability.message} {p.caveat}</small><a href={p.url} target="_blank" rel="noopener noreferrer">官方来源 · {p.checkedOn} ↗</a>{ready && <div className="ud-place-actions"><button disabled={busy || p.availability.state !== "known" || visits.length >= 3 || visits.some(v => v.placeId === p.id)} onClick={() => addPlace(p.id)}>手动加入这一天</button><label><input type="checkbox" checked={must.includes(p.id)} disabled={busy || p.availability.state !== "known"} onChange={e => { invalidate(); setMust(m => e.target.checked ? [...m, p.id] : m.filter(id => id !== p.id)); }}/>必去</label></div>}</article>)}</div>}
      {ready && <fieldset disabled={busy} className="ud-editor"><legend>确认这一天的安排</legend><div className="uk-fields"><label>活动开始<input type="time" value={from} onInput={e => { setFrom(e.currentTarget.value); invalidate(); }}/></label><label>活动结束<input type="time" value={until} onInput={e => { setUntil(e.currentTarget.value); invalidate(); }}/></label></div><label>这一天的偏好<textarea value={preferences} maxLength={1000} onChange={e => { setPreferences(e.target.value); invalidate(); }} placeholder="例如更喜欢足球和工业历史；预约和固定时间请填在下方。"/></label>
      <details><summary>有不可移动的固定安排？</summary>{fixed.map((f, i) => <div className="uk-fields" key={i}><label>活动名称<input value={f.title} maxLength={100} onChange={e => { setFixed(a => a.map((x, j) => j === i ? { ...x, title: e.target.value } : x)); invalidate(); }}/></label><label>固定开始<input type="time" value={f.start} onInput={e => { const value = e.currentTarget.value; setFixed(a => a.map((x, j) => j === i ? { ...x, start: value } : x)); invalidate(); }}/></label><label>固定结束<input type="time" value={f.end} onInput={e => { const value = e.currentTarget.value; setFixed(a => a.map((x, j) => j === i ? { ...x, end: value } : x)); invalidate(); }}/></label><button onClick={() => { setFixed(a => a.filter((_, j) => i !== j)); invalidate(); }}>移除固定安排</button></div>)}<button disabled={fixed.length >= 8} onClick={() => { setFixed(f => [...f, { title: "", start: "12:00", end: "13:00" }]); invalidate(); }}>添加固定安排</button></details>
      {visits.map((v, i) => <article key={v.placeId} className="ud-visit"><h4>{UK_PLACES.find(p => p.id === v.placeId)?.name}</h4><div className="uk-fields"><label>参观开始<input type="time" value={v.start} onInput={e => { const value = e.currentTarget.value; setVisits(a => a.map((x, j) => i === j ? { ...x, start: value } : x)); invalidate(); }}/></label><label>参观结束<input type="time" value={v.end} onInput={e => { const value = e.currentTarget.value; setVisits(a => a.map((x, j) => i === j ? { ...x, end: value } : x)); invalidate(); }}/></label></div><button onClick={() => { setVisits(a => a.filter((_, j) => i !== j)); invalidate(); }}>移除这处景点</button></article>)}
      <div className="uk-actions"><button className="uk-button" disabled={!visits.length} onClick={() => void run("check")}>免费检查手动安排</button></div><p className="uk-muted">{status}</p><label className="ud-confirm"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}/>我已确认这一天的活动窗口、必去和固定安排；生成只处理这一天，启用后会产生模型费用。</label><button className="uk-button" disabled={!enabled || !confirmed} onClick={() => void run("generate")}>让 Agent 安排这一天</button></fieldset>}
      {busy && <p role="status">{enabled ? "正在处理请求，尚未采用任何新安排。" : "正在执行免费时间检查。"}<button onClick={() => abortRef.current?.abort()}>取消本次</button></p>}
      {candidate && <section className="ud-candidate"><h3>{candidate.result.mode === "manual" ? "手动安排已通过基础检查" : "Agent 候选已通过基础检查"}</h3>{candidate.result.visits.map(v => <p key={v.placeId}>{v.start}—{v.end} · {UK_PLACES.find(p => p.id === v.placeId)?.name}</p>)}{candidate.request.fixed.map((f, i) => <p key={i}>固定：{f.start}—{f.end} · {f.title}</p>)}<p className="uk-muted">{candidate.result.warnings.join(" ")}</p><button className="uk-button" onClick={adopt}>采用这一天</button></section>}
      {events.length > 0 && <details><summary>本次实际执行记录</summary><ol>{events.map((e, i) => <li key={i}>{e}</li>)}</ol></details>}
      {entries.find(e => e.request.day === selected) && <p className="uk-status">这一天已有采用的版本。修改后需重新检查并采用，失败不会覆盖旧版本。</p>}
      </section></div>
      <section className="ud-transport"><h2>沿线交通依据</h2>{CORRIDORS.filter(c => route.stops.some(s => s.destination.id === c.from) && route.stops.some(s => s.destination.id === c.to)).map(c => <p key={c.from + c.to}><a href={c.url} target="_blank" rel="noopener noreferrer">{c.label} ↗</a><small>{c.note}</small></p>)}<p className="uk-muted">这些入口不返回实时班次。未收录路段和末段接驳仍在英国路线页逐段查询。</p></section>
      <footer className="uk-review"><h2>{entries.length} 天已有采用的安排</h2><p className="uk-muted">只保存已采用的结果；手动安排、模型结果与交通占位分别记录。备份中的来源标签是文件记录，不构成真实模型调用证明。</p><div className="uk-actions"><button className="uk-button" disabled={busy} onClick={() => save()}>保存路线与每日安排</button><button disabled={busy} onClick={() => save(true)}>导出逐日备份</button><button disabled={busy} onClick={() => fileRef.current?.click()}>导入逐日备份</button></div><input hidden ref={fileRef} type="file" accept=".json" onChange={async e => { const f = e.target.files?.[0]; e.target.value = ""; if (!f) return; try { if (f.size > 500000) throw new Error(); const doc = parseDailyDocument(await f.text()); setRoute(doc.route); setEntries(doc.entries); setSelected(1); setVisits([]); setFixed([]); setMust([]); setFrom("10:00"); setUntil("17:00"); setPreferences(""); invalidate(); setNotice("逐日备份已重新检查并导入，尚未覆盖本地保存。"); } catch { setError("逐日备份无法通过检查，当前内容未改动。"); } }}/></footer>
      </>}
    </div></main>;
}
