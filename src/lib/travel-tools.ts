import type {
  CheckDayInput,
  CheckDayResult,
  CheckIssue,
  SupportedCity,
  ToolResult,
  TransferAllowance,
  TransferReference,
  TravelPlace,
} from "./travel-types";

const CITIES: SupportedCity[] = ["london", "oxford", "bath"];
const CITY_NAMES: Record<SupportedCity, string> = {
  london: "伦敦",
  oxford: "牛津",
  bath: "巴斯",
};
const MAX_SCHEDULE_ITEMS = 30;

function failure(code: string, message: string): ToolResult<never> {
  return { ok: false, error: { code, message } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key));
}

function isCity(value: unknown): value is SupportedCity {
  return typeof value === "string" && CITIES.includes(value as SupportedCity);
}

function isText(value: unknown, limit: number): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= limit
  );
}

function clockMinutes(value: unknown): number | null {
  if (typeof value !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    return null;
  }
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function calendarWeekday(value: unknown): number | null {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    value.startsWith("0000")
  ) {
    return null;
  }
  // Treat the input as a UK calendar date. UTC is only used to compute its
  // weekday; no browser/server timezone conversion is applied to clock times.
  const date = new Date(`${value}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value)
    return null;
  return date.getUTCDay() || 7;
}

export function listPlaces(
  input: unknown,
  places: readonly TravelPlace[],
): ToolResult<TravelPlace[]> {
  if (!isRecord(input) || !hasOnlyKeys(input, ["city", "query", "category"])) {
    return failure(
      "INVALID_INPUT",
      "查询条件须为对象，只支持 city、query 和 category。",
    );
  }
  if (input.city !== undefined && !isCity(input.city)) {
    return failure(
      "UNSUPPORTED_CITY",
      "仅支持 london、oxford 和 bath 三个城市。",
    );
  }
  for (const field of ["query", "category"] as const) {
    if (
      input[field] !== undefined &&
      (typeof input[field] !== "string" || input[field].length > 100)
    ) {
      return failure("INVALID_INPUT", `${field} 须为不超过 100 字符的字符串。`);
    }
  }
  const query =
    typeof input.query === "string"
      ? input.query.trim().toLocaleLowerCase("en-GB")
      : "";
  const category =
    typeof input.category === "string" ? input.category.trim() : "";
  return {
    ok: true,
    data: places.filter(
      (place) =>
        (!input.city || place.city === input.city) &&
        (!category || place.category === category) &&
        (!query ||
          [
            place.name,
            place.english,
            place.description,
            place.address,
            place.category,
          ].some((value) => value.toLocaleLowerCase("en-GB").includes(query))),
    ),
  };
}

export function getPlace(
  input: unknown,
  places: readonly TravelPlace[],
): ToolResult<TravelPlace> {
  if (
    !isRecord(input) ||
    !hasOnlyKeys(input, ["id"]) ||
    !isText(input.id, 100)
  ) {
    return failure("INVALID_INPUT", "地点查询须提供不超过 100 字符的 id。");
  }
  const place = places.find((entry) => entry.id === input.id);
  return place
    ? { ok: true, data: place }
    : failure("PLACE_NOT_FOUND", "资料库中没有这个地点；请重新选择。");
}

export function getTransfer(
  input: unknown,
  references: readonly TransferReference[],
): ToolResult<TransferReference> {
  if (
    !isRecord(input) ||
    !hasOnlyKeys(input, ["from", "to"]) ||
    typeof input.from !== "string" ||
    typeof input.to !== "string"
  ) {
    return failure("INVALID_INPUT", "城际查询须提供 from 和 to 城市代码。");
  }
  if (!isCity(input.from) || !isCity(input.to)) {
    return failure(
      "UNSUPPORTED_CITY",
      "仅支持 london、oxford 和 bath 三个城市。",
    );
  }
  if (input.from === input.to)
    return failure(
      "SAME_CITY_TRANSFER",
      "同城移动不使用城际参考；具体地点间交通仍需另外核对。",
    );
  const direct = references.find(
    (entry) => entry.from === input.from && entry.to === input.to,
  );
  if (direct) return { ok: true, data: direct };
  const reverse = references.find(
    (entry) => entry.from === input.to && entry.to === input.from,
  );
  if (!reverse)
    return failure(
      "TRANSFER_NOT_FOUND",
      "没有这段城际交通的参考资料，不能据此判断可行性。",
    );
  return {
    ok: true,
    data: {
      ...reverse,
      from: input.from,
      to: input.to,
      route: `${CITY_NAMES[input.from]} → ${CITY_NAMES[input.to]}（反向规划参考；原来源路线：${reverse.route}）`,
      // Published figures remain explicitly attached to the original direction.
      referenceText: `原方向 ${CITY_NAMES[reverse.from]} → ${CITY_NAMES[reverse.to]}：${reverse.referenceText}；反向实际车程未核验。`,
      planningBasis: `反向暂沿用同一参考的对称规划估算。${reverse.planningBasis}`,
      caveat: `此为反向规划估算，原来源不保证反向班次或车程相同。${reverse.caveat}`,
    },
  };
}

function validateCheckInput(input: unknown): ToolResult<CheckDayInput> {
  const fields = [
    "date",
    "startCity",
    "availableFrom",
    "availableUntil",
    "visits",
    "fixedArrangements",
  ];
  if (!isRecord(input) || !hasOnlyKeys(input, fields))
    return failure(
      "INVALID_INPUT",
      "单日检查需要结构化日期、可用时间、地点和固定安排。",
    );
  if (calendarWeekday(input.date) === null)
    return failure(
      "INVALID_INPUT",
      "date 须为真实日历日期，格式为 YYYY-MM-DD。",
    );
  if (!isCity(input.startCity))
    return failure(
      "UNSUPPORTED_CITY",
      "出发城市仅支持 london、oxford 和 bath。",
    );
  const from = clockMinutes(input.availableFrom);
  const until = clockMinutes(input.availableUntil);
  if (from === null || until === null || from >= until)
    return failure(
      "INVALID_INPUT",
      "可用时间须为 HH:mm，结束晚于开始；暂不支持跨午夜安排。",
    );
  if (!Array.isArray(input.visits) || !Array.isArray(input.fixedArrangements))
    return failure(
      "INVALID_INPUT",
      "visits 和 fixedArrangements 须为数组，未填写时使用空数组。",
    );
  const count = input.visits.length + input.fixedArrangements.length;
  if (count === 0 || count > MAX_SCHEDULE_ITEMS)
    return failure(
      "INVALID_INPUT",
      `请提供 1–${MAX_SCHEDULE_ITEMS} 项地点或固定安排。`,
    );
  const ids = new Set<string>();
  for (const [kind, items] of [
    ["visits", input.visits],
    ["fixedArrangements", input.fixedArrangements],
  ] as const) {
    for (const item of items) {
      const keys =
        kind === "visits"
          ? ["id", "placeId", "start", "end"]
          : ["id", "title", "city", "start", "end"];
      if (!isRecord(item) || !hasOnlyKeys(item, keys) || !isText(item.id, 100))
        return failure(
          "INVALID_INPUT",
          "每项安排须有唯一且不超过 100 字符的 id，以及规定字段。",
        );
      if (ids.has(item.id))
        return failure("INVALID_INPUT", `安排 id 重复：${item.id}。`);
      ids.add(item.id);
      const start = clockMinutes(item.start);
      const end = clockMinutes(item.end);
      if (start === null || end === null || start >= end)
        return failure(
          "INVALID_INPUT",
          "每项安排的时间须为 HH:mm，结束晚于开始；暂不支持跨午夜。",
        );
      if (kind === "visits" && !isText(item.placeId, 100))
        return failure("INVALID_INPUT", "每个参观点都须提供有效 placeId。");
      if (kind === "fixedArrangements") {
        if (!isText(item.title, 200))
          return failure(
            "INVALID_INPUT",
            "固定安排须提供不超过 200 字符的名称。",
          );
        if (!isCity(item.city))
          return failure(
            "UNSUPPORTED_CITY",
            "固定安排的城市仅支持 london、oxford 和 bath。",
          );
      }
    }
  }
  return { ok: true, data: input as unknown as CheckDayInput };
}

type TimelineItem = {
  id: string;
  title: string;
  city: SupportedCity;
  start: number;
  end: number;
  kind: "visit" | "fixed";
};

export function checkDay(
  input: unknown,
  places: readonly TravelPlace[],
  references: readonly TransferReference[],
): ToolResult<CheckDayResult> {
  const validation = validateCheckInput(input);
  if (!validation.ok) return validation;
  const day = validation.data;
  const weekday = calendarWeekday(day.date)!;
  const availableFrom = clockMinutes(day.availableFrom)!;
  const availableUntil = clockMinutes(day.availableUntil)!;
  const issues: CheckIssue[] = [];
  const timeline: TimelineItem[] = [];
  const transfers: TransferAllowance[] = [];

  for (const visit of day.visits) {
    const place = places.find((entry) => entry.id === visit.placeId);
    if (!place)
      return failure(
        "PLACE_NOT_FOUND",
        `资料库中没有地点 ${visit.placeId}，本次检查未执行。`,
      );
    const start = clockMinutes(visit.start)!;
    const end = clockMinutes(visit.end)!;
    timeline.push({
      id: visit.id,
      title: place.name,
      city: place.city,
      start,
      end,
      kind: "visit",
    });
    const windows =
      place.openingWindows?.filter((window) =>
        window.weekdays.includes(weekday),
      ) ?? [];
    if (place.knownClosedDates?.includes(day.date)) {
      issues.push({
        code: "KNOWN_CLOSED_DATE",
        severity: "conflict",
        message: `${place.name}：已核查的来源明确标注 ${day.date} 闭馆，当前安排与该通知冲突；仍建议核对官网最新通知。${place.openingCaveat}`,
        relatedIds: [visit.id],
      });
    } else if (place.opening.status === "unknown" || windows.length === 0) {
      issues.push({
        code: "OPENING_UNKNOWN",
        severity: "unknown",
        message: `${place.name}：没有覆盖该星期的可计算开放时间，须查看来源确认。${place.openingCaveat}`,
        relatedIds: [visit.id],
      });
    } else if (
      !windows.some((window) => {
        const opens = clockMinutes(window.opens);
        const closes = clockMinutes(window.closes);
        return (
          opens !== null && closes !== null && opens <= start && end <= closes
        );
      })
    ) {
      issues.push({
        code: "OUTSIDE_REGULAR_OPENING",
        severity: "warning",
        message: `${place.name}：安排未完全落在资料记载的常规开放时段内；这不是当天关闭的确定结论，请核对日期例外与预约。${place.openingCaveat}`,
        relatedIds: [visit.id],
      });
    } else {
      issues.push({
        code: "OPENING_EXCEPTIONS",
        severity: "unknown",
        message: `${place.name}：安排落在常规开放时段内，但这不能确认旅行当天可入场，仍需核对日期例外与预约。${place.openingCaveat}`,
        relatedIds: [visit.id],
      });
    }
    if (end - start < place.suggestedMinutes) {
      issues.push({
        code: "SHORT_VISIT",
        severity: "warning",
        message: `${place.name}：安排 ${end - start} 分钟，少于项目建议的 ${place.suggestedMinutes} 分钟。${place.durationBasis}`,
        relatedIds: [visit.id],
      });
    }
    if (
      [place.visiting, place.admission, place.booking].some(
        (fact) => fact.status === "unknown",
      )
    ) {
      issues.push({
        code: "PLACE_DETAILS_UNKNOWN",
        severity: "unknown",
        message: `${place.name}：参观、入场或预约资料有未知项，请从地点详情核对来源。`,
        relatedIds: [visit.id],
      });
    }
  }
  for (const item of day.fixedArrangements) {
    timeline.push({
      id: item.id,
      title: item.title,
      city: item.city,
      start: clockMinutes(item.start)!,
      end: clockMinutes(item.end)!,
      kind: "fixed",
    });
  }
  timeline.sort(
    (a, b) => a.start - b.start || a.end - b.end || a.id.localeCompare(b.id),
  );
  for (const item of timeline) {
    if (item.start < availableFrom || item.end > availableUntil) {
      issues.push({
        code: "OUTSIDE_DAY_WINDOW",
        severity: "conflict",
        message: `“${item.title}”超出当天可用时间 ${day.availableFrom}–${day.availableUntil}。`,
        relatedIds: [item.id],
      });
    }
  }
  // Pairwise checking is deliberate: comparing only neighbors misses a long
  // arrangement that overlaps several shorter arrangements nested inside it.
  for (let left = 0; left < timeline.length; left += 1) {
    for (let right = left + 1; right < timeline.length; right += 1) {
      const a = timeline[left];
      const b = timeline[right];
      if (a.start < b.end && b.start < a.end) {
        issues.push({
          code:
            a.kind === "fixed" || b.kind === "fixed"
              ? "FIXED_ARRANGEMENT_CONFLICT"
              : "VISIT_OVERLAP",
          severity: "conflict",
          message: `“${a.title}”与“${b.title}”的时间重叠。`,
          relatedIds: [a.id, b.id],
        });
      }
    }
  }
  for (let index = 0; index < timeline.length; index += 1) {
    const item = timeline[index];
    const previous = timeline[index - 1];
    const from = previous?.city ?? day.startCity;
    if (from === item.city) continue;
    const gap = item.start - (previous?.end ?? availableFrom);
    const result = getTransfer({ from, to: item.city }, references);
    const reference = result.ok ? result.data : null;
    const knownEstimate =
      reference &&
      Number.isFinite(reference.planningRideMinutes) &&
      reference.planningRideMinutes > 0 &&
      Number.isFinite(reference.bufferMinutes) &&
      reference.bufferMinutes >= 0;
    const needed = knownEstimate
      ? reference.planningRideMinutes + reference.bufferMinutes
      : null;
    transfers.push({
      from,
      to: item.city,
      beforeId: item.id,
      availableMinutes: gap,
      neededMinutes: needed,
      referenceId: reference?.id ?? null,
    });
    const relatedIds = previous ? [previous.id, item.id] : [item.id];
    if (needed === null) {
      issues.push({
        code: "TRANSFER_UNKNOWN",
        severity: "unknown",
        message: `${CITY_NAMES[from]} → ${CITY_NAMES[item.city]}：缺少可用的交通规划参考，无法判断这段间隔是否充足。`,
        relatedIds,
      });
    } else if (gap < needed) {
      issues.push({
        code: "INSUFFICIENT_TRANSFER_TIME",
        severity: "conflict",
        message: `${CITY_NAMES[from]} → ${CITY_NAMES[item.city]}：可用间隔 ${Math.max(0, gap)} 分钟，项目估算至少 ${needed} 分钟（车程估算 ${reference!.planningRideMinutes} + 缓冲 ${reference!.bufferMinutes}）；需要调整时间。`,
        relatedIds,
      });
    }
  }
  issues.push({
    code: "LOCAL_TRAVEL_UNCHECKED",
    severity: "unknown",
    message:
      "同城地点间移动、车站至地点交通及具体出发位置尚未自动核验；城际缓冲是项目估算，可能不足。",
    relatedIds: [],
  });
  issues.push({
    code: "LIVE_CONDITIONS_UNVERIFIED",
    severity: "unknown",
    message:
      "本工具按英国当地单日钟面时间比较，不核验日期例外、票额、实际班次、实时延误或夏令时切换的真实经过时长；仍需按具体日期确认。固定安排按手动输入检查，自由文本未被解析。",
    relatedIds: [],
  });
  const conflicts = issues.filter(
    (issue) => issue.severity === "conflict",
  ).length;
  return {
    ok: true,
    data: {
      status: conflicts > 0 ? "conflicts" : "needs-confirmation",
      issues,
      transfers,
      summary:
        conflicts > 0
          ? `发现 ${conflicts} 项时间冲突；其余未知项仍须核对。`
          : "在本次基础检查范围内未发现硬性冲突，仍需确认开放、预约与实际交通。",
      checkedScope: [
        "结构化输入及真实日历日期",
        "当天可用时间范围",
        "地点与固定安排全部两两重叠",
        "起始城市及相邻异城安排的车程估算与缓冲",
        "来源明确记载的闭馆日期",
        "有覆盖记录的常规开放时段（警告）",
        "项目建议参观时长（警告）",
      ],
    },
  };
}
