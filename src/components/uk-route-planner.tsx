"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { DAILY_HANDOFF } from "@/lib/uk-daily";
import { ROUTE_INTENT, INTAKE_KEY, WORKING_PLAN_KEY, emptyIntake, parseIntake, intakeRoute, type TravelIntake } from "@/lib/travel-intake";
import { applyIntakeToRoute, intakeFromRoute } from "@/lib/intake-assistant";
import TravelAssistant from "./travel-assistant";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ArrowUp, ArrowDown, Plus, X, TrainFront, Plane, MapPin, Download } from "lucide-react";
import { UK_DESTINATIONS, UK_AIRPORTS, NATIONS, OFFICIAL, SOURCE_CHECK_DATE, type Nation, type Destination } from "@/data/uk-destinations";
import { emptyRoute, parseRoute, routeLegs, routeNights, routeErrors, routeWarnings, routeSummary, addDays, linksForLeg, withRouteStops, MODE_NAMES, ROUTE_STORAGE_KEY, type RouteDraft, type Flight, type Mode } from "@/lib/uk-route";
import { usePlannerDraft } from "./planner-context";
import "./uk-route-planner.css";

export default function UkRoutePlanner() {
  const router = useRouter();
  const { draft: oldDraft } = usePlannerDraft();
  const [draft, setDraft] = useState<RouteDraft>(() => emptyRoute(oldDraft.idea));
  const [intake, setIntake] = useState<TravelIntake>(emptyIntake);
  const [query, setQuery] = useState("");
  const [customName, setCustomName] = useState("");
  const [customNation, setCustomNation] = useState<Nation>("england");
  const [customHub, setCustomHub] = useState("");
  const [message, setMessage] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [ready, setReady] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const basics = localStorage.getItem(INTAKE_KEY);
        if (basics) setIntake(parseIntake(basics));
        const workingRaw = sessionStorage.getItem(WORKING_PLAN_KEY);
        let working: { route: RouteDraft; intake: TravelIntake } | undefined;
        if (workingRaw) { try { const w=JSON.parse(workingRaw);working={route:parseRoute(JSON.stringify(w.route),true),intake:parseIntake(JSON.stringify(w.intake))}; } catch { /* Keep the older saved route available. */ } }
        const intent = sessionStorage.getItem(ROUTE_INTENT);
        if (intent) {
          const incoming = parseIntake(intent); setIntake(incoming);
          try {setDraft(working?applyIntakeToRoute(working.route,working.intake,incoming):intakeRoute(incoming));setMessage(incoming.destinations.length?"已带入基础信息。下方住宿晚数是可调整的初稿，请确认后保存。":"可以从上方对话开始，也可以直接在下方安排路线。");}
          catch(e){setDraft(emptyRoute(incoming.idea));setMessage(`基础信息已保留：${(e as Error).message}`);}
          sessionStorage.removeItem(ROUTE_INTENT);
          setReady(true);
          return;
        }
        if(working){setDraft(working.route);setIntake(working.intake);setReady(true);setMessage("已恢复本次编辑中的计划。确认后可保存长期备份。");return;}
        const saved = localStorage.getItem(ROUTE_STORAGE_KEY);
        if (saved) { setDraft(parseRoute(saved)); setMessage("已恢复上次保存的英国路线。新的首页想法可在下方补充。"); }
      } catch { setMessage("本地路线无法读取。旧记录未改动，你可以导入备份或重新填写。"); }
      setReady(true);
    });
    return () => { active = false; };
  }, []);
  useEffect(()=>{if(!ready)return;try{sessionStorage.setItem(WORKING_PLAN_KEY,JSON.stringify({route:parseRoute(JSON.stringify(draft),true),intake:intakeFromRoute(intake,draft)}));}catch{/* Invalid intermediate edits do not replace the last readable draft. */}},[draft,intake,ready]);
  const nights = routeNights(draft), endDate = addDays(draft.startDate, nights);
  const legs = routeLegs(draft), errors = routeErrors(draft), warnings = routeWarnings(draft);
  const matches = UK_DESTINATIONS.filter(d => `${d.name} ${d.english} ${NATIONS[d.nation]}`.toLowerCase().includes(query.toLowerCase().trim()));
  function add(destination: Destination) {
    if (draft.stops.length >= 12) { setMessage("单条路线最多 12 个据点。"); return; }
    setDraft(d => withRouteStops(d, [...d.stops, { key: crypto.randomUUID(), destination, nights: 2 }]));
    setMessage(`已加入${destination.name}。路线变更后请重新核对交通记录。`);
  }
  function changeStops(stops: RouteDraft["stops"]) { setDraft(d => withRouteStops(d, stops)); setMessage("路线已修改，尚未保存。交通记录已清除；离境日期变化时请重新填写离境航班。"); }
  function move(index: number, direction: number) {
    const stops = [...draft.stops];
    [stops[index], stops[index + direction]] = [stops[index + direction], stops[index]];
    changeStops(stops);
  }
  function save() {
    setShowErrors(true);
    if (errors.length) { setMessage("请先完成标出的信息，再保存路线。"); return; }
    try { localStorage.setItem(ROUTE_STORAGE_KEY, JSON.stringify(parseRoute(JSON.stringify(draft)))); sessionStorage.removeItem(ROUTE_INTENT); setMessage("路线已保存到本浏览器，刷新可恢复。逐日 Agent 的旧行程不会被覆盖。"); }
    catch { setMessage("未能保存，请导出备份保留当前路线。"); }
  }
  function download(kind: "json" | "txt") {
    setShowErrors(true);
    if (errors.length) { setMessage("请先完成标出的信息，再导出。"); return; }
    const url = URL.createObjectURL(new Blob([kind === "json" ? JSON.stringify(draft, null, 2) : routeSummary(draft)], { type: kind === "json" ? "application/json" : "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `slowtrail-uk-route.${kind}`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const external = (label: string, url: string) => <a key={label} href={url} target="_blank" rel="noopener noreferrer">{label}<ArrowUpRight size={14}/></a>;
  function flightForm(kind: "arrival" | "departure") {
    const arrival = kind === "arrival", f = draft[kind], airport = UK_AIRPORTS.find(a => a.code === f.airport);
    const stop = arrival ? draft.stops[0] : draft.stops.at(-1);
    const update = (patch: Partial<Flight>) => setDraft(d => ({ ...d, [kind]: { ...d[kind], ...patch } }));
    return <article className="uk-flight"><h3><Plane size={18}/>{arrival ? "抵达英国" : "离开英国"}</h3><p className="uk-muted">{arrival ? draft.startDate || "抵达日期待选" : endDate || "离境日期随住宿晚数计算"} · 英国当地时间</p>
      <label>{arrival ? "抵达机场" : "离境机场"}<select value={f.airport} onChange={e => update({ airport: e.target.value, number: "", time: "" })}><option value="">待定 / 非航空入境</option>{UK_AIRPORTS.map(a => <option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}</select></label>
      <div className="uk-fields"><label>{arrival ? "出发城市 / 机场" : "下一目的地 / 机场"}<input value={f.origin} maxLength={80} placeholder="可选，如 Shanghai PVG" onChange={e => update({ origin: e.target.value })}/></label><label>{arrival ? "抵达航班号" : "离境航班号"}<input disabled={!airport} value={f.number} maxLength={20} placeholder="查询后填写" onChange={e => update({ number: e.target.value })}/></label><label>{arrival ? "落地时间" : "起飞时间"}<input disabled={!airport} aria-label={arrival ? "落地时间" : "起飞时间"} type="time" value={f.time} onInput={e => update({ time: e.currentTarget.value })}/></label></div>
      {airport && <div className="uk-connection"><p>{arrival ? `${airport.code} → ${stop?.destination.name || "首站待选"}` : `${stop?.destination.name || "末站待选"} → ${airport.code}`}</p><div className="uk-links">{external("机场航班信息", airport.flights)}{external("机场地面交通", airport.transport)}{external("接驳至住宿据点", airport.nation === "northernIreland" ? OFFICIAL.ni.url : OFFICIAL.local.url)}</div>{!airport.checked && <small>机场网站本次未能读取；可尝试官网或 Translink 核对。</small>}</div>}
      <small>航班号与时间为你手动填写，未自动核验。请另留入境、行李、值机与接驳时间；跨夜航班以英国落地日为路线首日。</small>
    </article>;
  }
  return <main className="uk-page">
    <header className="uk-header"><Link className="uk-brand" href="/">SLOWTRAIL<span>欧洲慢游</span></Link><nav aria-label="规划导航"><Link href="/journeys">发现旅行</Link><Link href="/plan/saved">已保存逐日行程</Link></nav></header>
    <div className="uk-shell">
      <TravelAssistant value={intake} route={draft} ready={ready} onApply={(next,previous)=>{const updated=applyIntakeToRoute(draft,previous,next);localStorage.setItem(INTAKE_KEY,JSON.stringify(next));sessionStorage.removeItem(ROUTE_INTENT);setIntake(next);setDraft(updated);setMessage("已更新旅行轮廓，请核对下方路线并保存。交通与票价仍需查询确认。");}}/>
      <div className="uk-status" role="status" aria-live="polite">{message || "先选择住宿据点。这里整理的是路线草案，班次、价格和可达性需在官方入口核对。"}</div>
      <section className="uk-section" aria-labelledby="route-title"><div className="uk-section-heading"><div><p className="uk-eyebrow">01 / PLACES & PACE</p><h2 id="route-title">确认你的路线。</h2></div><p>最多 12 站 · 60 晚<br/>日期变化后，交通记录需重新核对。</p></div>
        <div className="uk-top-fields"><label>行程开始日期（当地时间）<input type="date" min="2020-01-01" max="2100-12-31" value={draft.startDate} onInput={e => { const value = e.currentTarget.value; setDraft(d => ({ ...d, startDate: value, arrival: { ...d.arrival, number: "", time: "" }, departure: { ...d.departure, number: "", time: "" }, connections: {} })); }}/></label></div>
        <div className="uk-builder"><aside className="uk-picker"><label>寻找城市或小镇<input type="search" placeholder="爱丁堡、曼彻斯特、York…" value={query} onChange={e => setQuery(e.target.value)}/></label><div className="uk-destinations">{matches.map(d => <button key={d.id} onClick={() => add(d)} disabled={!ready || draft.stops.length >= 12}><span>{d.name}<small>{d.english} · {NATIONS[d.nation]}</small></span><Plus size={16}/></button>)}{!matches.length && <p>目录中没有这个地点，可在下方手动添加。</p>}</div>
          <details className="uk-custom"><summary>加入目录外的小城 / 小镇</summary><p>填写英文名或郡名以区分同名地点。它会作为待核实据点加入。</p><label>地点名称<input maxLength={80} value={customName} onChange={e => setCustomName(e.target.value)} placeholder="例如 Rye, East Sussex"/></label><label>所属地区<select value={customNation} onChange={e => setCustomNation(e.target.value as Nation)}>{Object.entries(NATIONS).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label><label>附近车站 / 交通据点（可选）<input value={customHub} maxLength={120} onChange={e => setCustomHub(e.target.value)}/></label><button className="uk-button" disabled={!customName.trim() || draft.stops.length >= 12} onClick={() => { add({ id: `custom-${crypto.randomUUID()}`, name: customName.trim(), english: customName.trim(), nation: customNation, kind: "town", custom: true, hub: customHub.trim() }); setCustomName(""); setCustomHub(""); }}>加入路线</button></details>
        </aside>
        <div className="uk-stops"><div className="uk-route-total"><MapPin size={18}/><span>{draft.stops.length ? `${draft.stops.length} 个据点 · ${nights} 晚 / ${nights + 1} 天` : "从第一站开始"}</span></div>{!draft.stops.length && <div className="uk-empty"><h3>不必从伦敦开始。</h3><p>在左侧挑选你的第一站。顺序和停留晚数，随时可以调整。</p></div>}
          {draft.stops.map((s, index) => { const offset = draft.stops.slice(0, index).reduce((n, s) => n + s.nights, 0); return <article className="uk-stop" key={s.key}><span className="uk-number">{String(index + 1).padStart(2, "0")}</span><div className="uk-stop-body"><h3>{s.destination.name}</h3><p>{NATIONS[s.destination.nation]} · {s.destination.english}{s.destination.custom ? " · 地点待核实" : ""}</p><small>{addDays(draft.startDate, offset) || `第 ${offset + 1} 天`} 入住 → {addDays(draft.startDate, offset + s.nights) || `第 ${offset + s.nights + 1} 天`} 离开</small>{s.destination.hub && <small>自填接驳据点：{s.destination.hub}</small>}</div><label className="uk-nights">住宿晚数<input aria-label={`${s.destination.name}住宿晚数，第${index + 1}站`} type="number" min={1} max={30} value={s.nights || ""} onChange={e => changeStops(draft.stops.map((stop, i) => i === index ? { ...stop, nights: Number(e.target.value) } : stop))}/></label><div className="uk-stop-actions"><button disabled={index === 0} aria-label={`上移第${index + 1}站`} onClick={() => move(index, -1)}><ArrowUp size={16}/></button><button disabled={index === draft.stops.length - 1} aria-label={`下移第${index + 1}站`} onClick={() => move(index, 1)}><ArrowDown size={16}/></button><button aria-label={`移除第${index + 1}站`} onClick={() => changeStops(draft.stops.filter((_, i) => i !== index))}><X size={16}/></button></div></article>; })}
          {!!draft.stops.length && <p className="uk-footnote">离境日期：{endDate || "待选择抵达日期"}。每站按住宿晚数连接，转场日并非完整游玩日；此顺序由你决定，尚未进行最优路线计算。</p>}
        </div></div>
      </section>
      <section className="uk-section" aria-labelledby="airport-title"><div className="uk-section-heading"><div><p className="uk-eyebrow">02 / ARRIVAL & DEPARTURE</p><h2 id="airport-title">把抵达与离开，一起考虑。</h2></div><p>可从不同机场进出。当前提供四座机场入口；<br/>其他机场请先写进旅行想法，另行核对。</p></div><div className="uk-flight-grid">{flightForm("arrival")}{flightForm("departure")}</div></section>
      <section className="uk-section" aria-labelledby="transport-title"><div className="uk-section-heading"><div><p className="uk-eyebrow">03 / CONNECT THE PLACES</p><h2 id="transport-title">每一段路，都留好时间。</h2></div><p>选择查询方向，记录确认后的交通。<br/>不代表所选方式存在直达服务。</p></div>
        {!legs.length && <p className="uk-empty">添加两个据点后，这里会出现逐段交通。单城旅行可直接查看上方机场接驳。</p>}
        {legs.map(leg => { const c = draft.connections[leg.key] || { mode: leg.seaCrossing ? "flight" as const : "rail" as const, minutes: "", note: "" }; const update = (patch: Partial<typeof c>) => setDraft(d => ({ ...d, connections: { ...d.connections, [leg.key]: { ...c, ...patch } } })); return <article className="uk-leg" key={leg.key}><div className="uk-leg-title"><TrainFront size={22}/><div><small>第 {leg.day} 天 · {leg.date || "日期待选"}</small><h3>{leg.from.name}<span>→</span>{leg.to.name}</h3></div><span className="uk-tag">{c.minutes ? "耗时已手填 · 未核验" : "交通待查询"}</span></div>{leg.seaCrossing && <p className="uk-alert">这一段跨越爱尔兰海，需要航班或海渡，并衔接两端地面交通。</p>}<div className="uk-fields"><label>交通查询方向<select value={c.mode} onChange={e => update({ mode: e.target.value as Mode, minutes: "", note: "" })}>{leg.modes.map(m => <option key={m} value={m}>{MODE_NAMES[m]}</option>)}</select></label><label>门到门耗时（分钟，可留空）<input type="number" min={1} max={1440} value={c.minutes} placeholder="包括候车、换乘和接驳" onChange={e => update({ minutes: e.target.value })}/></label></div><p className="uk-query">查询条件：{leg.from.english} → {leg.to.english} · {leg.date || `第 ${leg.day} 天`}。进入官网后，选择实际车站、机场或港口。</p><div className="uk-links">{linksForLeg(leg, c.mode).map(l => external(l.label, l.url))}</div><label>查到的车次 / 班次、换乘与接驳备注<textarea rows={2} maxLength={600} value={c.note} placeholder="记录官网结果与查询时间；请勿填写护照或支付信息。" onChange={e => update({ note: e.target.value })}/></label>{c.mode === "flight" && <small>目录内机场仅供起点参考，不保证最近或有直飞。请核对航线，再把前往机场、值机和离开机场的时间计入总耗时。</small>}{c.mode === "drive" && <small>Traveline 供公共交通比较，自驾路线、停车和路况需另行核对。</small>}</article>; })}
      </section>
      <section className="uk-review"><p className="uk-eyebrow">BEFORE YOU GO</p><h2>路线有了，再确认这些。</h2>{showErrors && errors.length > 0 && <div role="alert" className="uk-alert"><ul>{errors.map(e => <li key={e}>{e}</li>)}</ul></div>}<details><summary>{warnings.length} 项待核对事项</summary><ul>{warnings.map((w, i) => <li key={i}>{w}</li>)}</ul></details><p className="uk-muted">官网入口核对于 {SOURCE_CHECK_DATE}；北爱机场页面读取受限。本站未接入实时航班、票价、余票和预订，手填信息不构成交通可行性验证。</p><div className="uk-actions"><button className="uk-button" disabled={!ready} onClick={save}>保存这条路线</button><button onClick={() => download("json")}><Download size={15}/> 导出备份</button><button onClick={() => download("txt")}>导出路线清单</button><button onClick={() => fileRef.current?.click()}>导入备份</button></div><input ref={fileRef} type="file" accept=".json,application/json" hidden aria-label="导入英国路线备份" onChange={async e => { const file = e.target.files?.[0]; e.target.value = ""; if (!file) return; try { if (file.size > 100_000) throw new Error("文件过大"); const restored = parseRoute(await file.text()); setDraft(restored); setMessage("备份已导入到编辑区，尚未覆盖本地保存。确认后点击保存。"); } catch { setMessage("导入失败：文件格式或内容不受支持，当前路线未改动。"); } }}/>
      </section>
      <footer className="uk-footer"><div><h3>沿着这条路线，展开每一天。</h3><p>曼城、约克、爱丁堡与皮特洛赫里已有新资料，可先手动安排并免费检查。新 Agent 生成代码已接入，真实测试尚未启用；其他据点明确提示资料缺口。</p></div><button className="uk-button" onClick={() => { setShowErrors(true); if (errors.length) { setMessage("请先完成路线信息，再展开每天。"); return; } try { sessionStorage.setItem(DAILY_HANDOFF, JSON.stringify(parseRoute(JSON.stringify(draft)))); router.push("/plan/days"); } catch { setMessage("无法传递路线，请检查浏览器存储权限或导出备份。"); } }}>确认路线，展开每天 <ArrowUpRight size={16}/></button></footer>
    </div>
  </main>;
}
