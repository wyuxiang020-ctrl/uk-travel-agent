import test from "node:test";
import assert from "node:assert/strict";
import { UK_DESTINATIONS } from "../data/uk-destinations.ts";
import { UK_PLACES } from "../data/uk-knowledge.ts";
import { emptyRoute } from "./uk-route.ts";
import { parseDailyRequest, routeDays, openingOn, validateDaily, parseDailyDocument, type DailyRequest } from "./uk-daily.ts";
import { runUkDaily } from "./agent/uk-daily-runner.ts";
import type { ModelClient } from "./agent/types";

function request(city = "manchester", date = "2026-11-10"): DailyRequest {
  const route = emptyRoute("测试安排，非真实旅行"); route.startDate = date;
  route.stops = [{ key: "a", destination: UK_DESTINATIONS.find(p => p.id === city)!, nights: 3 }];
  return { route, day: 2, from: "10:00", until: "17:00", must: [], fixed: [], preferences: "工业历史" };
}
const visit = (placeId = "man-science", start = "10:00", end = "12:00") => ({ placeId, start, end, reason: "离线测试理由，非模型真实生成" });
function fake(replies: { name: string; args: unknown }[]): ModelClient {
  let n = 0;
  return async () => { const r = replies[n++]; assert.ok(r, "unexpected paid/model round"); return { message: { role: "assistant", content: null, tool_calls: [{ id: `call-${n}`, type: "function", function: { name: r.name, arguments: JSON.stringify(r.args) } }] } }; };
}
test("资料有唯一地点、官方来源、核对日期与明确未知开放时间", () => {
  assert.equal(new Set(UK_PLACES.map(p => p.id)).size, UK_PLACES.length);
  assert.equal(UK_PLACES.length, 11);
  for (const p of UK_PLACES) { assert.ok(p.url.startsWith("https://")); assert.ok(p.checkedOn); assert.ok(p.caveat); assert.ok(UK_DESTINATIONS.some(d => d.id === p.destination)); }
  assert.equal(UK_PLACES.filter(p => p.hours === null).length, 2);
});
test("日期骨架完全沿用住宿路线，不隐藏转场和首尾时间", () => {
  const req = request(); req.route.stops.push({ key: "b", destination: UK_DESTINATIONS.find(p => p.id === "edinburgh")!, nights: 2 });
  const days = routeDays(req.route);
  assert.deepEqual(days.map(d => d.kind), ["arrival", "stay", "stay", "transfer", "stay", "departure"]);
  assert.equal(days[3].destination, "edinburgh"); assert.equal(days[5].date, "2026-11-15");
  for (const day of [1, 4, 6]) assert.throws(() => parseDailyRequest({ ...req, day }), /交通/);
});
test("星期与特别日期优先于普通营业时间", () => {
  const p = UK_PLACES.find(p => p.id === "man-rylands")!;
  assert.equal(openingOn(p, "2026-11-09").state, "closed");
  assert.equal(openingOn(p, "2026-11-11").state, "known");
  const museum = UK_PLACES.find(p => p.id === "edi-national-museum")!;
  assert.equal(openingOn(museum, "2026-12-25").state, "closed");
  assert.equal(openingOn(museum, "2027-01-01").from, "12:00");
  assert.equal(openingOn(museum, "2028-01-01").state, "unknown");
  assert.equal(openingOn(UK_PLACES.find(p => p.id === "pit-theatre")!, "2026-11-11").state, "unknown");
});
test("未覆盖据点和自定义同名小镇不会被自动映射", () => {
  assert.throws(() => parseDailyRequest(request("belfast")), /没有开放资料/);
  const req = request("pitlochry"); req.route.stops[0].destination = { id: "custom-pit", name: "Pitlochry", english: "Pitlochry", nation: "scotland", kind: "town", custom: true, hub: "" };
  assert.throws(() => parseDailyRequest(req), /没有开放资料/);
  assert.doesNotThrow(() => parseDailyRequest(request("pitlochry")));
});
test("手动与模型共用服务器约束，未知地点和开放冲突被拒", () => {
  const req = request();
  assert.throws(() => validateDaily({ visits: [visit("invented")] }, req, "manual"), /未收录/);
  assert.throws(() => validateDaily({ visits: [visit("edi-castle")] }, req, "model"), /跨据点/);
  assert.throws(() => validateDaily({ visits: [visit("man-football", "16:10", "17:00")] }, req, "model"), /最后入场/);
  const ed = request("edinburgh", "2026-12-31");
  assert.throws(() => validateDaily({ visits: [visit("edi-national-museum")] }, ed, "model"), /开放/);
  assert.doesNotThrow(() => validateDaily({ visits: [visit("edi-national-museum", "12:00", "14:00")] }, ed, "manual"));
});
test("固定安排、必去、重复景点和30分钟缓冲严格检查", () => {
  const req = request(); req.fixed = [{ title: "会面", start: "12:20", end: "13:00" }];
  assert.throws(() => validateDaily({ visits: [visit()] }, req, "manual"), /30分钟/);
  req.fixed[0].start = "12:30";
  assert.doesNotThrow(() => validateDaily({ visits: [visit()] }, req, "manual"));
  req.must = ["man-football"];
  assert.throws(() => validateDaily({ visits: [visit()] }, req, "model"), /遗漏/);
  req.must = [];
  assert.throws(() => validateDaily({ visits: [visit(), visit()] }, req, "manual"), /重复/);
  assert.throws(() => validateDaily({ visits: [] }, req, "manual"), /空结果/);
});
test("保存恢复重新核验资料、忽略文件自称检查通过", () => {
  const req = request(), result = validateDaily({ visits: [visit()] }, req, "manual");
  const { route, ...requirements } = req;
  const doc = { version: 1, route, entries: [{ request: requirements, result }] };
  assert.equal(parseDailyDocument(JSON.stringify(doc)).entries[0].result.mode, "manual");
  result.visits[0].start = "08:00";
  assert.throws(() => parseDailyDocument(JSON.stringify(doc)));
  assert.throws(() => parseDailyDocument(JSON.stringify({ ...doc, version: 2 })));
});
test("资料工具读取后才能提交，真实工作流可用替身离线执行", async () => {
  const logs: string[] = [];
  const result = await runUkDaily(request(), { signal: new AbortController().signal, emit: s => logs.push(s), model: fake([{ name: "read_places", args: { ids: ["man-science"] } }, { name: "submit_day", args: { visits: [visit()] } }]) });
  assert.equal(result.visits[0].placeId, "man-science"); assert.equal(result.mode, "model");
  assert.ok(logs.some(s => s.includes("资料工具"))); assert.ok(logs.some(s => s.includes("服务器")));
});
test("缺少读取证据时拒绝候选并允许有限修复", async () => {
  const logs: string[] = [];
  const result = await runUkDaily(request(), { signal: new AbortController().signal, emit: s => logs.push(s), model: fake([{ name: "submit_day", args: { visits: [visit()] } }, { name: "read_places", args: { ids: ["man-science"] } }, { name: "submit_day", args: { visits: [visit()] } }]) });
  assert.equal(result.visits.length, 1); assert.ok(logs.some(s => s.includes("未通过")));
});
test("失败、取消、调用超限不输出示例替代", async () => {
  const deps = { signal: new AbortController().signal, emit: () => {} };
  await assert.rejects(runUkDaily(request(), { ...deps, model: fake([{ name: "cannot_plan", args: {} }]) }), /无法可靠/);
  await assert.rejects(runUkDaily(request(), { ...deps, maxRounds: 1, model: fake([{ name: "submit_day", args: { visits: [visit()] } }]) }), /调用上限/);
  const a = new AbortController(); a.abort(); let called = false;
  await assert.rejects(runUkDaily(request(), { emit: () => {}, signal: a.signal, model: async () => { called = true; throw new Error(); } })); assert.equal(called, false);
  await assert.rejects(runUkDaily(request(), { ...deps, model: async () => { throw new Error("offline network failure"); } }), /offline network failure/);
});
