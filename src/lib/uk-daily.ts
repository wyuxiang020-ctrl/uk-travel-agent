import { UK_PLACES, KNOWLEDGE_VERSION, KNOWLEDGE_VALID_THROUGH, type UkPlace } from "../data/uk-knowledge.ts";
import { addDays, parseRoute, routeLegs, routeNights, type RouteDraft } from "./uk-route.ts";
import { AgentError, record, text, minutes } from "./agent/validation.ts";

export const DAILY_HANDOFF = "slowtrail.uk-daily.handoff.v1";
export const DAILY_STORAGE = "slowtrail.uk-daily.saved.v1";
export type RouteDay = { day: number; date: string; destination: string; name: string; kind: "arrival" | "transfer" | "stay" | "departure"; note: string };
export type DailyVisit = { placeId: string; start: string; end: string; reason: string };
export type DailyFixed = { title: string; start: string; end: string };
export type DailyRequest = { route: RouteDraft; day: number; from: string; until: string; must: string[]; fixed: DailyFixed[]; preferences: string };
export type DailyResult = { day: number; date: string; destination: string; mode: "manual" | "model"; visits: DailyVisit[]; warnings: string[]; knowledgeVersion: string };
export type DailyDocument = { version: 1; route: RouteDraft; entries: { request: Omit<DailyRequest, "route">; result: DailyResult }[] };

export function routeDays(route: RouteDraft): RouteDay[] {
  const days: RouteDay[] = [], legs = routeLegs(route); let offset = 0;
  for (const stop of route.stops) {
    for (let i = 0; i < stop.nights; i++) {
      const day = offset + i + 1;
      const leg = legs.find(l => l.day === day);
      days.push({ day, date: addDays(route.startDate, day - 1), destination: stop.destination.custom ? stop.destination.id : stop.destination.id, name: stop.destination.name,
        kind: day === 1 ? "arrival" : leg ? "transfer" : "stay",
        note: day === 1 ? "抵达和入住日：先核对落地、入境与机场接驳，本轮不自动填入景点。" : leg ? `${leg.from.name} → ${leg.to.name}。${route.connections[leg.key]?.minutes ? `手填门到门 ${route.connections[leg.key].minutes} 分钟，尚未核验。` : "交通耗时未知。"}转场日暂不自动安排景点。` : "完整停留日：可查看资料，手动安排或在启用后生成。" });
    }
    offset += stop.nights;
  }
  const last = route.stops.at(-1);
  if (last) days.push({ day: offset + 1, date: addDays(route.startDate, offset), destination: last.destination.id, name: last.destination.name, kind: "departure", note: "离境日：核对前往机场、值机和航班时间，本轮不自动填入景点。" });
  return days;
}
export function openingOn(place: UkPlace, date: string): { state: "known" | "closed" | "unknown"; from?: string; until?: string; lastEntry?: string; message: string } {
  if (date < place.checkedOn || date > KNOWLEDGE_VALID_THROUGH) return { state: "unknown", message: "日期超出本期资料维护范围，需重新核对来源。" };
  if (place.closedDates?.includes(date) || place.overrides?.[date] === null) return { state: "closed", message: "官方资料列明当日关闭。" };
  const override = place.overrides?.[date];
  if (override) return { state: "known", ...override, message: "采用所选日期的特别开放时间。" };
  if (!place.hours) return { state: "unknown", message: "开放时间需按日查询，当前仅作资料参考。" };
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay() || 7;
  if (!place.hours.weekdays.includes(weekday)) return { state: "closed", message: "按常规开放表，当天不开放；如有特别安排请官网核对。" };
  return { state: "known", ...place.hours, message: "匹配常规开放资料，临时变化和预约仍待确认。" };
}
export function dailyPlaces(route: RouteDraft, day: number) {
  const current = routeDays(route).find(d => d.day === day);
  return current ? UK_PLACES.filter(p => p.destination === current.destination).map(p => ({ ...p, availability: openingOn(p, current.date) })) : [];
}
export function parseDailyRequest(value: unknown): DailyRequest {
  if (!record(value)) throw new AgentError("INVALID_INPUT", "每日安排请求不完整。");
  let route: RouteDraft;
  try { route = parseRoute(JSON.stringify(value.route)); } catch { throw new AgentError("INVALID_ROUTE", "路线数据不完整，请回到路线页确认。"); }
  if (!Number.isInteger(value.day) || Number(value.day) < 1 || Number(value.day) > routeNights(route) + 1) throw new AgentError("INVALID_DAY", "选择的日期不在路线中。");
  const current = routeDays(route).find(d => d.day === value.day)!;
  if (current.kind !== "stay") throw new AgentError("TRANSPORT_DAY", "抵达、转场和离境日先保留给交通，不能绕过时间核对直接生成景点。");
  const available = dailyPlaces(route, current.day).filter(p => p.availability.state === "known");
  if (!available.length) throw new AgentError("DATA_GAP", "这一天没有开放资料足够的地点；请核对日期或补充目的地资料。");
  if (minutes(value.from) < 0 || minutes(value.until) <= minutes(value.from) || minutes(value.until) - minutes(value.from) < 60) throw new AgentError("INVALID_WINDOW", "活动窗口至少一小时，且须在同一英国当地日期内。");
  if (!Array.isArray(value.must) || value.must.length > 3 || new Set(value.must).size !== value.must.length || !value.must.every(id => typeof id === "string" && available.some(p => p.id === id))) throw new AgentError("UNKNOWN_PLACE", "必去地点须来自当前据点且当天有可用开放资料，最多3处。");
  if (typeof value.preferences !== "string" || value.preferences.length > 1000 || !Array.isArray(value.fixed) || value.fixed.length > 8) throw new AgentError("INVALID_INPUT", "偏好或固定安排格式不正确。");
  const fixed = value.fixed.map(f => {
    if (!record(f) || !text(f.title, 100) || minutes(f.start) < minutes(value.from) || minutes(f.end) > minutes(value.until) || minutes(f.start) < 0 || minutes(f.end) <= minutes(f.start)) throw new AgentError("FIXED_CONFLICT", "固定安排必须位于当天活动窗口内。");
    return { title: f.title, start: f.start as string, end: f.end as string };
  });
  for (const [i, a] of fixed.entries()) for (const b of fixed.slice(i + 1)) if (minutes(a.start) < minutes(b.end) && minutes(b.start) < minutes(a.end)) throw new AgentError("FIXED_CONFLICT", "固定安排时间重叠。");
  return { route, day: current.day, from: value.from as string, until: value.until as string, must: value.must as string[], fixed, preferences: value.preferences };
}
export function validateDaily(value: unknown, request: DailyRequest, mode: DailyResult["mode"]): DailyResult {
  const req = parseDailyRequest(request), day = routeDays(req.route).find(d => d.day === req.day)!;
  if (!record(value) || !Array.isArray(value.visits) || value.visits.length < 1 || value.visits.length > 3) throw new AgentError("INVALID_PLAN", "每天安排1–3处景点，不能用空结果冒充完成。");
  const candidates = dailyPlaces(req.route, req.day), ids = new Set<string>();
  const visits: DailyVisit[] = value.visits.map(v => {
    if (!record(v) || !text(v.placeId, 100) || !text(v.reason, 300) || minutes(v.start) < minutes(req.from) || minutes(v.end) > minutes(req.until) || minutes(v.start) < 0 || minutes(v.end) - minutes(v.start) < 30) throw new AgentError("INVALID_PLAN", "参观必须在活动窗口内，至少预留30分钟并填写理由。");
    const place = candidates.find(p => p.id === v.placeId);
    if (!place || ids.has(place.id)) throw new AgentError("UNKNOWN_PLACE", "存在跨据点、未收录或重复景点。");
    ids.add(place.id);
    const h = place.availability;
    if (h.state !== "known") throw new AgentError("OPENING_UNKNOWN", `${place.name}当天关闭或缺少可用开放时间。`);
    if (minutes(v.start) < minutes(h.from) || minutes(v.end) > minutes(h.until) || h.lastEntry && minutes(v.start) > minutes(h.lastEntry)) throw new AgentError("OPENING_CONFLICT", `${place.name}的安排超出开放或最后入场时间。`);
    return { placeId: place.id, start: v.start as string, end: v.end as string, reason: v.reason };
  }).sort((a, b) => minutes(a.start) - minutes(b.start));
  if (req.must.some(id => !ids.has(id))) throw new AgentError("MUST_MISSING", "遗漏已确认的必去地点。");
  const timeline = [...visits.map(v => ({ start: v.start, end: v.end })), ...req.fixed].sort((a, b) => minutes(a.start) - minutes(b.start));
  for (let i = 1; i < timeline.length; i++) if (minutes(timeline[i].start) - minutes(timeline[i - 1].end) < 30) throw new AgentError("TIME_CONFLICT", "活动重叠或间隔不足30分钟。该间隔是规划缓冲，不代表真实步行时间。");
  return { day: day.day, date: day.date, destination: day.destination, visits, mode, knowledgeVersion: KNOWLEDGE_VERSION, warnings: ["基于核对日资料，不保证当日开放、余票或已预约。", "活动间至少30分钟为项目缓冲；同城距离、餐饮与实际交通仍需核对。", ...visits.map(v => candidates.find(p => p.id === v.placeId)!.caveat)] };
}
export function parseDailyDocument(raw: string): DailyDocument {
  if (raw.length > 500_000) throw new AgentError("INVALID_DOCUMENT", "备份过大。");
  const value = JSON.parse(raw);
  if (!record(value) || value.version !== 1 || !Array.isArray(value.entries) || value.entries.length > 60) throw new AgentError("INVALID_DOCUMENT", "不支持的逐日备份。");
  const route = parseRoute(JSON.stringify(value.route)); const seen = new Set<number>();
  const entries = value.entries.map(e => {
    if (!record(e) || !record(e.request) || !record(e.result) || !["manual", "model"].includes(e.result.mode as string)) throw new AgentError("INVALID_DOCUMENT", "每日备份损坏。");
    const req = parseDailyRequest({ ...e.request, route });
    if (seen.has(req.day)) throw new AgentError("INVALID_DOCUMENT", "备份中日期重复。"); seen.add(req.day);
    const result = validateDaily(e.result, req, e.result.mode as DailyResult["mode"]);
    const { route: ignored, ...request } = req; void ignored;
    return { request, result };
  });
  return { version: 1, route, entries };
}
