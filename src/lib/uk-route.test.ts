import test from "node:test";
import assert from "node:assert/strict";
import { UK_DESTINATIONS, OFFICIAL } from "../data/uk-destinations.ts";
import { emptyRoute, addDays, validDate, routeLegs, routeNights, routeErrors, routeWarnings, parseRoute, routeSummary, linksForLeg, withRouteStops } from "./uk-route.ts";
import { transportProvider } from "./transport-provider.ts";

function route(ids = ["london", "manchester", "york", "edinburgh"]) {
  const d = emptyRoute("足球、历史和小城慢游");
  d.startDate = "2026-12-28";
  d.stops = ids.map((id, i) => ({ key: `stop-${i}`, destination: UK_DESTINATIONS.find(s => s.id === id)!, nights: 2 }));
  return d;
}
test("英国四区与小镇均可编排，不依赖旧三城资料", () => {
  const d = route(["edinburgh", "fort-william", "manchester", "conwy", "belfast"]);
  assert.equal(routeErrors(d).length, 0);
  assert.equal(routeLegs(d).length, 4);
  assert.equal(new Set(UK_DESTINATIONS.map(d => d.nation)).size, 4);
});
test("住宿晚数产生确定跨年日期，不重复计算转场日", () => {
  const d = route();
  assert.equal(routeNights(d), 8);
  assert.deepEqual(routeLegs(d).map(l => [l.day, l.date]), [[3, "2026-12-30"], [5, "2027-01-01"], [7, "2027-01-03"]]);
  assert.equal(addDays(d.startDate, routeNights(d)), "2027-01-05");
});
test("非法日期、住宿与极端输入不会造成日期崩溃", () => {
  for (const s of ["2026-02-29", "2026-13-01", "garbage", ""]) assert.equal(validDate(s), false);
  assert.equal(validDate("2028-02-29"), true);
  for (const n of [Infinity, NaN, 10000000000, -1, 1.5]) assert.equal(addDays("2026-01-01", n), "");
  const d = route(); d.stops[0].nights = 0;
  assert.ok(routeErrors(d).some(e => e.includes("1–30")));
  d.stops.forEach(s => s.nights = 30);
  assert.ok(routeErrors(d).some(e => e.includes("60")));
  assert.ok(routeErrors(emptyRoute()).length >= 2);
});
test("英国大陆往返北爱只允许海空转场", () => {
  for (const ids of [["edinburgh", "belfast"], ["belfast", "manchester"]]) {
    const d = route(ids), leg = routeLegs(d)[0];
    assert.equal(leg.seaCrossing, true);
    assert.deepEqual(leg.modes, ["flight", "ferry"]);
    d.connections[leg.key] = { mode: "rail", minutes: "120", note: "" };
    assert.ok(routeErrors(d).some(e => e.includes("跨海")));
    assert.throws(() => parseRoute(JSON.stringify(d)));
  }
});
test("北爱区内使用 Translink，大陆火车包含末段接驳入口", () => {
  const ni = routeLegs(route(["belfast", "derry"]))[0];
  assert.equal(ni.seaCrossing, false);
  assert.deepEqual(linksForLeg(ni, "rail"), [OFFICIAL.ni]);
  assert.deepEqual(linksForLeg(routeLegs(route())[0], "rail"), [OFFICIAL.rail, OFFICIAL.local]);
});
test("耗时未知不会假装时间可行；长途提示转场日", () => {
  const d = route(), leg = routeLegs(d)[0];
  assert.ok(routeWarnings(d).some(e => e.includes("暂不分配当天景点")));
  d.connections[leg.key] = { mode: "rail", minutes: "420", note: "手填" };
  assert.ok(routeWarnings(d).some(e => e.includes("转场日")));
  d.connections[leg.key].minutes = "-5";
  assert.ok(routeErrors(d).some(e => e.includes("耗时")));
});
test("目录外小镇可恢复但一直标注用户提供和待核实", () => {
  const d = route(); d.stops.push({ key: "rye", nights: 1, destination: { id: "custom-rye", name: "Rye, East Sussex", english: "Rye", nation: "england", kind: "town", custom: true, hub: "Rye station" } });
  const restored = parseRoute(JSON.stringify(d));
  assert.equal(restored.stops.at(-1)?.destination.hub, "Rye station");
  assert.ok(routeWarnings(restored).some(w => w.includes("用户添加")));
  assert.ok(routeSummary(restored).includes("地点待核实"));
});
test("恢复拒绝未支持国家、自定义假身份和损坏结构", () => {
  for (const raw of ["{", "null", JSON.stringify({ version: 2 }), " ".repeat(100001)]) assert.throws(() => parseRoute(raw));
  const d = route(); d.stops[0].destination = { ...d.stops[0].destination, id: "paris" };
  assert.throws(() => parseRoute(JSON.stringify(d)));
  assert.throws(() => parseRoute(JSON.stringify({ ...route(), connections: [] })));
});
test("恢复目录条目时不信任被篡改的名字与地区", () => {
  const d = route(); d.stops[0].destination = { ...d.stops[0].destination, name: "伪造地名", nation: "northernIreland" };
  const r = parseRoute(JSON.stringify(d));
  assert.equal(r.stops[0].destination.name, "伦敦");
  assert.equal(r.stops[0].destination.nation, "england");
});
test("重复据点身份拒绝；相邻同城提示合并，返回旧城有效", () => {
  const d = route(); d.stops[1].key = d.stops[0].key;
  assert.throws(() => parseRoute(JSON.stringify(d)));
  assert.ok(routeErrors(route(["london", "london"])).length);
  assert.equal(routeErrors(route(["london", "york", "london"])).length, 0);
});
test("更改住宿和顺序后不复用原日期的交通记录", () => {
  const d = route(), oldLeg = routeLegs(d)[0];
  d.connections[oldLeg.key] = { mode: "rail", minutes: "130", note: "旧车次" };
  d.stops[0].nights = 3;
  assert.equal(d.connections[routeLegs(d)[0].key], undefined);
  d.stops.reverse();
  assert.ok(routeLegs(d).every(l => !d.connections[l.key]));
});
test("机场与首末站不匹配明确提示，手填航班不能成为核验结论", () => {
  const d = route(["manchester", "edinburgh"]);
  d.arrival = { airport: "LHR", number: "TEST123", time: "18:30", origin: "Shanghai" };
  assert.ok(routeWarnings(d).some(e => e.includes("跨城接驳")));
  assert.ok(routeSummary(d).includes("未核验"));
  d.arrival.time = "26:10";
  assert.ok(routeErrors(d).some(e => e.includes("时间格式")));
  d.arrival.airport = "XXX";
  assert.throws(() => parseRoute(JSON.stringify(d)));
});
test("完整路线及手填交通可无损保存恢复", () => {
  const d = route(), leg = routeLegs(d)[0];
  d.connections[leg.key] = { mode: "rail", minutes: "180", note: "测试记录，不是真实班次" };
  assert.deepEqual(parseRoute(JSON.stringify(d)), d);
  assert.ok(routeSummary(d).includes("180 分钟（手填）"));
});
test("实时提供商未配置时显式失败，不返回假班次或成功空列表", async () => {
  const result = await transportProvider.search({ from: "Manchester", to: "Edinburgh", date: "2026-12-30", mode: "rail" });
  assert.equal(result.status, "not_configured");
  assert.equal("options" in result, false);
});
test("增减住宿不把原离境航班搬到新日期，原草案保持不变", () => {
  const d = route(); d.departure = { airport: "EDI", number: "TEST123", time: "18:30", origin: "Shanghai" };
  const changed = withRouteStops(d, d.stops.map((s, i) => i === 0 ? { ...s, nights: 3 } : s));
  assert.equal(changed.departure.airport, "EDI");
  assert.equal(changed.departure.number, "");
  assert.equal(changed.departure.time, "");
  assert.equal(d.departure.number, "TEST123");
  assert.equal(withRouteStops(d, [...d.stops].reverse()).departure.number, "TEST123");
});
