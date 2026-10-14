import { UK_DESTINATIONS, UK_AIRPORTS, NATIONS, OFFICIAL, type Destination } from "../data/uk-destinations.ts";

export const ROUTE_STORAGE_KEY = "slowtrail.uk-route.v1";
export type Stop = { key: string; destination: Destination; nights: number };
export type Mode = "rail" | "coach" | "drive" | "flight" | "ferry";
export const MODE_NAMES: Record<Mode, string> = { rail: "铁路", coach: "巴士 / 大巴", drive: "自驾", flight: "航班 + 两端接驳", ferry: "海渡 + 两端接驳" };
export type Connection = { mode: Mode; minutes: string; note: string };
export type Flight = { airport: string; number: string; time: string; origin: string };
export type RouteDraft = { version: 1; idea: string; startDate: string; stops: Stop[]; arrival: Flight; departure: Flight; connections: Record<string, Connection> };
export type RouteLeg = { key: string; from: Destination; to: Destination; date: string; day: number; seaCrossing: boolean; modes: Mode[] };
export function emptyRoute(idea = ""): RouteDraft {
  return { version: 1, idea, startDate: "", stops: [], arrival: { airport: "", number: "", time: "", origin: "" }, departure: { airport: "", number: "", time: "", origin: "" }, connections: {} };
}
export function validDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value && value >= "2020-01-01" && value <= "2100-12-31";
}
export function addDays(date: string, days: number): string {
  if (!validDate(date) || !Number.isInteger(days) || days < 0 || days > 360) return "";
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function routeNights(draft: RouteDraft): number { return draft.stops.reduce((sum, stop) => sum + stop.nights, 0); }
export function withRouteStops(draft: RouteDraft, stops: Stop[]): RouteDraft {
  const nightsChanged = routeNights(draft) !== stops.reduce((sum, stop) => sum + stop.nights, 0);
  return { ...draft, stops, connections: {}, departure: nightsChanged ? { ...draft.departure, number: "", time: "" } : draft.departure };
}
export function routeLegs(draft: RouteDraft): RouteLeg[] {
  let day = 1;
  return draft.stops.slice(1).map((stop, index) => {
    day += draft.stops[index].nights;
    const from = draft.stops[index].destination, to = stop.destination;
    const seaCrossing = (from.nation === "northernIreland") !== (to.nation === "northernIreland");
    const date = addDays(draft.startDate, day - 1);
    // Date and stop identity are part of the key: changing route dates never reuses stale transport notes.
    return { key: `${draft.stops[index].key}:${stop.key}:${date || `day${day}`}`, from, to, date, day, seaCrossing, modes: seaCrossing ? ["flight", "ferry"] : ["rail", "coach", "drive", "flight", "ferry"] };
  });
}
export function linksForLeg(leg: RouteLeg, mode: Mode) {
  if (mode === "ferry") return [OFFICIAL.ferry, OFFICIAL.local, ...(leg.from.nation === "northernIreland" || leg.to.nation === "northernIreland" ? [OFFICIAL.ni] : [])];
  if (leg.from.nation === "northernIreland" && leg.to.nation === "northernIreland") return [OFFICIAL.ni];
  if (mode === "rail") return [OFFICIAL.rail, OFFICIAL.local];
  if (mode === "flight") return UK_AIRPORTS.filter(a => a.nation === leg.from.nation || a.nation === leg.to.nation).map(a => ({ label: `${a.code} · 航线及接驳`, url: a.transport }));
  return [OFFICIAL.local];
}
export function routeErrors(draft: RouteDraft): string[] {
  const errors: string[] = [];
  if (!validDate(draft.startDate)) errors.push("请选择有效的英国抵达日期。");
  if (!draft.stops.length) errors.push("至少添加一个住宿据点。");
  if (draft.stops.length > 12) errors.push("单条路线最多 12 个据点，可分段规划。");
  if (draft.stops.some(s => !Number.isInteger(s.nights) || s.nights < 1 || s.nights > 30)) errors.push("每站住宿需为 1–30 晚；当日往返地点请写入该站备注或旅行想法。");
  if (routeNights(draft) > 60) errors.push("单条路线最多 60 晚，请拆分为多段。");
  if (draft.stops.some((s, i) => i > 0 && s.destination.id === draft.stops[i - 1].destination.id)) errors.push("相邻两站是同一地点，请合并住宿晚数；返程再访可以保留为非相邻站。");
  if (validDate(draft.startDate) && addDays(draft.startDate, routeNights(draft)) > "2100-12-31") errors.push("离境日期超出支持范围。");
  for (const leg of routeLegs(draft)) {
    const c = draft.connections[leg.key];
    if (c && !leg.modes.includes(c.mode)) errors.push(`${leg.from.name} → ${leg.to.name} 涉及跨海，请选择航班或海渡。`);
    if (c?.minutes && (!/^\d{1,4}$/.test(c.minutes) || +c.minutes < 1 || +c.minutes > 1440)) errors.push("交通门到门耗时需为 1–1440 分钟；超过一天的交通请单独拆分安排。");
  }
  for (const [label, f] of [["抵达", draft.arrival], ["离境", draft.departure]] as const) {
    if (f.airport && !UK_AIRPORTS.some(a => a.code === f.airport)) errors.push(`${label}机场不在已接入目录。`);
    if (f.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(f.time)) errors.push(`${label}时间格式无效。`);
    if ((f.time || f.number) && !f.airport) errors.push(`填写${label}航班前请先选择机场。`);
  }
  return errors;
}
export function routeWarnings(draft: RouteDraft): string[] {
  const warnings: string[] = [];
  for (const stop of draft.stops) {
    if (stop.destination.custom) warnings.push(`${stop.destination.name}：用户添加的地点，需核实所属地区、同名地点及交通可达性。`);
    if (stop.destination.kind === "town") warnings.push(`${stop.destination.name}：需单独核对末段巴士、出租车或步行；不假设有直达火车。`);
  }
  for (const leg of routeLegs(draft)) {
    const c = draft.connections[leg.key];
    if (!c?.minutes) warnings.push(`第 ${leg.day} 天 ${leg.from.name} → ${leg.to.name}：交通耗时待查，暂不分配当天景点。`);
    else if (+c.minutes >= 360) warnings.push(`第 ${leg.day} 天：手填交通占用至少 6 小时，建议将当天作为转场日。`);
    if (leg.seaCrossing) warnings.push(`${leg.from.name} → ${leg.to.name} 需要跨海；分别查询两端接驳和航班／渡轮，不能全程按铁路处理。`);
  }
  for (const [label, flight, stop] of [["抵达", draft.arrival, draft.stops[0]], ["离境", draft.departure, draft.stops.at(-1)]] as const) {
    const a = UK_AIRPORTS.find(a => a.code === flight.airport);
    if (!a) warnings.push(`${label}机场尚未选择；也可经铁路或海渡进出，另行核对边境交通。`);
    if (a && stop && a.hub !== stop.destination.id) warnings.push(`${label}机场 ${a.code} 与${stop.destination.name}不在同一据点，需另查跨城接驳。`);
  }
  return warnings;
}
// Strict restore boundary: do not trust user-supplied catalogue names, ids or future versions.
export function parseRoute(raw: string, allowIncomplete = false): RouteDraft {
  if (raw.length > 100_000) throw new Error("路线文件过大。");
  const v = JSON.parse(raw) as RouteDraft;
  const text = (s: unknown, max: number): s is string => typeof s === "string" && s.length <= max;
  if (!v || v.version !== 1 || !text(v.idea, 3000) || !text(v.startDate, 10) || !Array.isArray(v.stops) || v.stops.length > 12 || !v.connections || typeof v.connections !== "object" || Array.isArray(v.connections)) throw new Error("路线格式或版本不受支持。");
  const keys = new Set<string>();
  const stops = v.stops.map(s => {
    if (!s || !text(s.key, 80) || !/^[\w-]+$/.test(s.key) || keys.has(s.key) || !Number.isInteger(s.nights) || s.nights < 1 || s.nights > 30 || !s.destination) throw new Error("住宿据点数据损坏。");
    keys.add(s.key);
    const d = s.destination;
    const known = UK_DESTINATIONS.find(k => k.id === d.id);
    if (known) return { key: s.key, nights: s.nights, destination: known };
    if (!d.custom || !text(d.id, 90) || !d.id.startsWith("custom-") || !text(d.name, 80) || !d.name.trim() || !text(d.english, 80) || !Object.hasOwn(NATIONS, d.nation) || !["city", "town"].includes(d.kind) || !text(d.hub, 120)) throw new Error("自定义地点信息不完整。");
    return { key: s.key, nights: s.nights, destination: { id: d.id, name: d.name, english: d.english, nation: d.nation, kind: d.kind, custom: true, hub: d.hub } };
  });
  for (const f of [v.arrival, v.departure]) if (!f || !text(f.airport, 3) || !text(f.number, 20) || !text(f.time, 5) || !text(f.origin, 80)) throw new Error("航班数据损坏。");
  if (Object.keys(v.connections).length > 100) throw new Error("交通记录过多。");
  for (const c of Object.values(v.connections)) if (!c || !Object.hasOwn(MODE_NAMES, c.mode) || !text(c.minutes, 4) || !text(c.note, 600)) throw new Error("交通记录损坏。");
  const result: RouteDraft = { version: 1, idea: v.idea, startDate: v.startDate, stops, arrival: { ...v.arrival }, departure: { ...v.departure }, connections: { ...v.connections } };
  const errors = routeErrors(result).filter(e => !allowIncomplete || !(e === "请选择有效的英国抵达日期。" && !result.startDate || e === "至少添加一个住宿据点。" && !result.stops.length));
  if (errors.length) throw new Error(errors.join(" "));
  return result;
}
export function routeSummary(draft: RouteDraft): string {
  const lines = ["SLOWTRAIL · 英国路线草案（非实时交通、非 AI 逐日行程）", `${draft.startDate} — ${addDays(draft.startDate, routeNights(draft))} · ${routeNights(draft)} 晚`, draft.idea];
  let offset = 0;
  for (const stop of draft.stops) {
    lines.push(`${addDays(draft.startDate, offset)} 入住 ${stop.destination.name} / ${stop.destination.english}，${stop.nights} 晚${stop.destination.custom ? "（地点待核实）" : ""}`);
    offset += stop.nights;
  }
  for (const [label, f] of [["抵达", draft.arrival], ["离境", draft.departure]] as const) lines.push(`${label}：${f.airport || "待定"} ${f.number} ${f.time} ${f.origin}（用户填写，未核验）`);
  for (const leg of routeLegs(draft)) {
    const c = draft.connections[leg.key];
    lines.push(`${leg.date} ${leg.from.english} → ${leg.to.english} · ${c ? MODE_NAMES[c.mode] : "方式待选"} · ${c?.minutes ? c.minutes + " 分钟（手填）" : "耗时待查"} ${c?.note || ""}`);
  }
  return [...lines, "待核对：", ...routeWarnings(draft)].join("\n");
}
