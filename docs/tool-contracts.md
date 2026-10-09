# 阶段 3：资料与基础检查工具

当前工具查询项目内的资料快照。地点与交通记录保留来源链接和核对日期；运行查询时不会自动重新抓取官网。工具不调用模型、不解析需求自由文本、不修改行程。

## HTTP 入口

- `GET /api/tools`：查看四个工具与输入简介。
- `POST /api/tools`：`Content-Type: application/json`，请求为 `{ "tool": "工具名", "input": { ... } }`。
- 请求最大 32 KiB，按实际读取字节限制；不只依赖 `Content-Length`。
- 成功：`{ "ok": true, "data": ... }`。
- 失败：`{ "ok": false, "error": { "code": "...", "message": "..." } }`。
- 验证错误及未知工具返回 HTTP 400；地点或城际参考缺失返回 404；格式类型不符为 415；超限为 413；未预期的工具内部故障返回 500 和通用说明。响应不缓存，不返回堆栈。

| 工具 | 输入 | data |
| --- | --- | --- |
| `list_places` | `{ city?, query?, category? }` | `TravelPlace[]`；城市限定三城，category 精确匹配，query 在名称、英文名、描述、地址和分类中按子串查找；无匹配为 `[]` |
| `get_place` | `{ id }` | `TravelPlace`，包含事实状态、来源与核对日期 |
| `get_transfer` | `{ from, to }` | `TransferReference`；反向沿用同一参考做明确标注的规划估算，不声称反向车程已核验 |
| `check_day` | `CheckDayInput`，见下例 | `CheckDayResult`，包含问题、转场占用、检查范围与限定结论 |

城市代码只接受 `london`、`oxford`、`bath`。未知字段被拒绝。同城移动不适用城际工具，返回 `SAME_CITY_TRANSFER`；地点间实际交通须另查。

纯函数导出于 `src/lib/travel-tools.ts`：`listPlaces(input, places)`、`getPlace(input, places)`、`getTransfer(input, references)`、`checkDay(input, places, references)`。所有输入为 `unknown` 并校验，资料由调用方注入，便于后续模型工具层复用和独立单测。

## 单日检查输入

```json
{
  "tool": "check_day",
  "input": {
    "date": "2026-10-12",
    "startCity": "london",
    "availableFrom": "09:00",
    "availableUntil": "18:00",
    "visits": [
      { "id": "visit-1", "placeId": "资料库中实际存在的地点 id", "start": "10:00", "end": "12:00" }
    ],
    "fixedArrangements": [
      { "id": "fixed-1", "title": "已预约的午餐", "city": "london", "start": "12:00", "end": "13:00" }
    ]
  }
}
```

日期须为真实 `YYYY-MM-DD` 日历日期。钟面时间为英国当地同一天的严格 `HH:mm`，不支持跨午夜；不做时区转换或夏令时实际经过时间计算。安排合计为 1–30 项，id 在两组安排中全局唯一，结束须晚于开始。固定安排必须由用户结构化输入，阶段 2 的自由文本不会自动进入检查。

检查规则：

1. 所有安排均须落在当天可用时间内。
2. 全部两两检查半开区间 `[start, end)` 的重叠，涵盖固定安排之间的冲突和一个长安排包住多个短安排。恰好首尾相接不属于时间重叠，但同城交通仍未验证。
3. 从 `startCity`、`availableFrom` 到第一项，以及按开始时间排序后每对相邻异城安排，比较可用间隔与 `planningRideMinutes + bufferMinutes`。参考公布的最快车程和项目车程、缓冲估算分开保留；缺资料为未知，不默认为零。
4. 来源明确记载在 `knownClosedDates` 的日期优先判为闭馆冲突，并提示复核最新通知。其它日期已有该星期常规开放记录时，要求访问全部落入其中一个开放区间，否则给警告；未知开放时间或星期未覆盖均标为未知，不能据此判定关闭。未记录的日期例外和预约未验证。
5. 少于项目建议参观时长只给警告，不作为硬性冲突。

结论只有 `conflicts` 或 `needs-confirmation`，没有“已验证可行”。同城移动、车站至地点交通、精确起点、班次、票额、实时延误、日期例外与实际预约条件仍待确认。资料未知问题不会转为虚构的确定事实。工具不会修改、锁定、撤销或保存任何安排。

## 错误代码

`INVALID_INPUT`、`UNSUPPORTED_CITY`、`PLACE_NOT_FOUND`、`TRANSFER_NOT_FOUND`、`SAME_CITY_TRANSFER`、`UNSUPPORTED_MEDIA_TYPE`、`PAYLOAD_TOO_LARGE`、`INVALID_JSON`、`UNKNOWN_TOOL`、`INTERNAL_ERROR`。

单测使用注入的测试资料，验证算法行为，不把测试来源或测试时间当作旅行事实。运行：`node --experimental-strip-types --test src/lib/travel-tools.test.ts`。
