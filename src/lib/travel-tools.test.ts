import assert from "node:assert/strict";
import test from "node:test";
import type {
  CheckDayInput,
  CheckDayResult,
  ToolResult,
  TravelPlace,
  TransferReference,
} from "./travel-types";

const moduleUrl = new URL("./travel-tools.ts", import.meta.url);
const {
  listPlaces,
  getPlace,
  getTransfer,
  checkDay,
}: typeof import("./travel-tools") = await import(moduleUrl.href);

const source = {
  id: "fixture-source",
  title: "Test source",
  url: "https://example.org/fixture",
  checkedOn: "2026-10-09",
};
const known = {
  text: "Fixture information",
  status: "sourced" as const,
  sourceIds: [source.id],
};
function place(
  id: string,
  city: TravelPlace["city"],
  overrides: Partial<TravelPlace> = {},
): TravelPlace {
  return {
    id,
    name: `${city}地点`,
    english: `${city} Museum`,
    city,
    category: "博物馆",
    description: "历史收藏",
    address: "Fixture Road",
    position: [51, -1],
    coordinateStatus: "approximate",
    visiting: known,
    admission: known,
    booking: known,
    opening: known,
    openingWindows: [
      { weekdays: [1, 2, 3, 4, 5], opens: "09:00", closes: "17:00" },
    ],
    openingCaveat: "Special dates require confirmation.",
    suggestedMinutes: 60,
    durationBasis: "项目估算",
    sources: [source],
    ...overrides,
  };
}
const places = [
  place("london-place", "london"),
  place("oxford-place", "oxford"),
  place("bath-place", "bath", { category: "公园" }),
];
const references: TransferReference[] = [
  {
    id: "london-oxford",
    from: "london",
    to: "oxford",
    mode: "rail",
    route: "London → Oxford",
    serviceSummary: "Fixture service",
    referenceMinutes: 55,
    referenceKind: "fastest",
    referenceText: "Fixture fastest service",
    planningRideMinutes: 60,
    bufferMinutes: 30,
    planningBasis: "项目估算",
    caveat: "Confirm current timetable",
    sources: [source],
  },
];
function day(overrides: Partial<CheckDayInput> = {}): CheckDayInput {
  return {
    date: "2026-10-09",
    startCity: "london",
    availableFrom: "09:00",
    availableUntil: "18:00",
    visits: [
      { id: "visit-1", placeId: "london-place", start: "10:00", end: "11:00" },
    ],
    fixedArrangements: [],
    ...overrides,
  };
}
function data<T>(result: ToolResult<T>): T {
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) throw new Error("Expected success");
  return result.data;
}
function errorCode(result: ToolResult<unknown>): string {
  assert.equal(result.ok, false, JSON.stringify(result));
  if (result.ok) throw new Error("Expected failure");
  return result.error.code;
}
function issuesWith(result: CheckDayResult, code: string) {
  return result.issues.filter((issue) => issue.code === code);
}

test("place queries filter the injected catalog and preserve evidence and unknowns", () => {
  assert.equal(data(listPlaces({}, places)).length, 3);
  assert.deepEqual(
    data(
      listPlaces(
        { city: "oxford", query: "MuSeUm", category: "博物馆" },
        places,
      ),
    ).map((entry) => entry.id),
    ["oxford-place"],
  );
  assert.deepEqual(data(listPlaces({ query: "无匹配地点" }, places)), []);
  assert.deepEqual(
    data(listPlaces({ query: "历史" }, places)).map((entry) => entry.id),
    places.map((entry) => entry.id),
  );
  assert.deepEqual(data(getPlace({ id: "london-place" }, places)).sources, [
    source,
  ]);
  const unknown = place("unknown", "london", {
    opening: { status: "unknown", text: "尚未核对", sourceIds: [] },
    openingWindows: null,
  });
  assert.equal(
    data(getPlace({ id: "unknown" }, [unknown])).opening.status,
    "unknown",
  );
});

test("query tools reject unknown destinations, malformed fields and missing records", () => {
  assert.equal(
    errorCode(listPlaces({ city: "edinburgh" }, places)),
    "UNSUPPORTED_CITY",
  );
  for (const input of [
    null,
    [],
    "london",
    { query: 7 },
    { category: "a".repeat(101) },
    { unsupported: true },
  ]) {
    assert.equal(errorCode(listPlaces(input, places)), "INVALID_INPUT");
  }
  assert.equal(
    errorCode(getPlace({ id: "missing" }, places)),
    "PLACE_NOT_FOUND",
  );
  assert.equal(errorCode(getPlace({ id: " " }, places)), "INVALID_INPUT");
  assert.equal(
    errorCode(getPlace({ id: "london-place", extra: 1 }, places)),
    "INVALID_INPUT",
  );
});

test("transfer references support explicit reverse estimates without changing their source", () => {
  const before = structuredClone(references);
  assert.deepEqual(
    data(getTransfer({ from: "london", to: "oxford" }, references)),
    references[0],
  );
  const reverse = data(
    getTransfer({ from: "oxford", to: "london" }, references),
  );
  assert.equal(reverse.from, "oxford");
  assert.equal(reverse.to, "london");
  assert.match(reverse.planningBasis, /反向.*估算/);
  assert.match(reverse.referenceText, /原方向.*反向实际车程未核验/);
  assert.deepEqual(reverse.sources, references[0].sources);
  assert.deepEqual(references, before);
  assert.equal(
    errorCode(getTransfer({ from: "london", to: "london" }, references)),
    "SAME_CITY_TRANSFER",
  );
  assert.equal(
    errorCode(getTransfer({ from: "bath", to: "london" }, references)),
    "TRANSFER_NOT_FOUND",
  );
  assert.equal(
    errorCode(getTransfer({ from: "paris", to: "london" }, references)),
    "UNSUPPORTED_CITY",
  );
  assert.equal(
    errorCode(getTransfer({ from: "london" }, references)),
    "INVALID_INPUT",
  );
});

test("day input requires real dates and positive same-day clock intervals", () => {
  for (const date of [
    "2026-02-29",
    "2026-04-31",
    "2026-13-01",
    "2026-1-09",
    "0000-01-01",
    "not-a-date",
  ]) {
    assert.equal(
      errorCode(checkDay(day({ date }), places, references)),
      "INVALID_INPUT",
      date,
    );
  }
  for (const date of ["2024-02-29", "2000-02-29", "0099-10-09", "2026-10-09"]) {
    assert.equal(checkDay(day({ date }), places, references).ok, true, date);
  }
  for (const [start, end] of [
    ["10:00", "10:00"],
    ["23:00", "01:00"],
    ["9:00", "10:00"],
    ["10:00", "24:00"],
    ["10:60", "11:00"],
  ]) {
    assert.equal(
      errorCode(
        checkDay(
          day({ visits: [{ id: "v", placeId: "london-place", start, end }] }),
          places,
          references,
        ),
      ),
      "INVALID_INPUT",
    );
  }
  assert.equal(
    errorCode(
      checkDay(
        day({ availableFrom: "18:00", availableUntil: "09:00" }),
        places,
        references,
      ),
    ),
    "INVALID_INPUT",
  );
});

test("day validation rejects unknown places, duplicate schedule IDs, oversized and malformed schedules", () => {
  assert.equal(
    errorCode(
      checkDay(
        day({
          visits: [
            { id: "v", placeId: "absent", start: "10:00", end: "11:00" },
          ],
        }),
        places,
        references,
      ),
    ),
    "PLACE_NOT_FOUND",
  );
  assert.equal(
    errorCode(
      checkDay(
        day({
          fixedArrangements: [
            {
              id: "visit-1",
              title: "约会",
              city: "london",
              start: "12:00",
              end: "13:00",
            },
          ],
        }),
        places,
        references,
      ),
    ),
    "INVALID_INPUT",
  );
  assert.equal(
    errorCode(checkDay(day({ visits: [] }), places, references)),
    "INVALID_INPUT",
  );
  const many = Array.from({ length: 31 }, (_, index) => ({
    id: `v-${index}`,
    placeId: "london-place",
    start: "10:00",
    end: "11:00",
  }));
  assert.equal(
    errorCode(checkDay(day({ visits: many }), places, references)),
    "INVALID_INPUT",
  );
  for (const input of [
    null,
    [],
    {},
    { ...day(), fixedArrangements: null },
    { ...day(), visits: [null] },
    { ...day(), ignoredField: true },
    { ...day(), visits: [{ ...day().visits[0], ignored: 1 }] },
  ]) {
    assert.equal(checkDay(input, places, references).ok, false);
  }
  assert.equal(
    errorCode(checkDay({ ...day(), startCity: "york" }, places, references)),
    "UNSUPPORTED_CITY",
  );
  assert.equal(
    errorCode(
      checkDay(
        {
          ...day(),
          fixedArrangements: [
            {
              id: "fixed",
              title: "预约",
              city: "paris",
              start: "12:00",
              end: "13:00",
            },
          ],
        },
        places,
        references,
      ),
    ),
    "UNSUPPORTED_CITY",
  );
});

test("all overlapping pairs are checked, including nested visits and fixed-to-fixed conflicts", () => {
  const output = data(
    checkDay(
      day({
        visits: [
          { id: "long", placeId: "london-place", start: "09:00", end: "15:00" },
          {
            id: "short-1",
            placeId: "london-place",
            start: "10:00",
            end: "11:00",
          },
          {
            id: "short-2",
            placeId: "london-place",
            start: "12:00",
            end: "13:00",
          },
        ],
        fixedArrangements: [
          {
            id: "fixed-1",
            title: "午餐",
            city: "london",
            start: "12:30",
            end: "13:30",
          },
          {
            id: "fixed-2",
            title: "预约",
            city: "london",
            start: "13:00",
            end: "14:00",
          },
        ],
      }),
      places,
      references,
    ),
  );
  assert.equal(output.status, "conflicts");
  assert.deepEqual(
    issuesWith(output, "VISIT_OVERLAP").map((issue) => issue.relatedIds),
    [
      ["long", "short-1"],
      ["long", "short-2"],
    ],
  );
  assert.ok(
    issuesWith(output, "FIXED_ARRANGEMENT_CONFLICT").some(
      (issue) =>
        issue.relatedIds.includes("fixed-1") &&
        issue.relatedIds.includes("fixed-2"),
    ),
  );
  assert.ok(
    issuesWith(output, "FIXED_ARRANGEMENT_CONFLICT").some(
      (issue) =>
        issue.relatedIds.includes("long") &&
        issue.relatedIds.includes("fixed-2"),
    ),
  );
});

test("half-open adjacent visits and fixed arrangements do not count as overlapping", () => {
  const output = data(
    checkDay(
      day({
        fixedArrangements: [
          {
            id: "fixed",
            title: "约会",
            city: "london",
            start: "11:00",
            end: "12:00",
          },
        ],
      }),
      places,
      references,
    ),
  );
  assert.equal(
    output.issues.filter((issue) => issue.severity === "conflict").length,
    0,
  );
  assert.equal(output.status, "needs-confirmation");
  assert.equal(issuesWith(output, "LOCAL_TRAVEL_UNCHECKED").length, 1);
});

test("first-city and adjacent intercity transitions reserve ride plus buffer, including exact boundaries", () => {
  const first = data(
    checkDay(
      day({
        visits: [
          {
            id: "oxford",
            placeId: "oxford-place",
            start: "10:00",
            end: "11:00",
          },
        ],
      }),
      places,
      references,
    ),
  );
  assert.deepEqual(first.transfers[0], {
    from: "london",
    to: "oxford",
    beforeId: "oxford",
    availableMinutes: 60,
    neededMinutes: 90,
    referenceId: "london-oxford",
  });
  assert.equal(issuesWith(first, "INSUFFICIENT_TRANSFER_TIME").length, 1);
  const exact = data(
    checkDay(
      day({
        visits: [
          {
            id: "oxford",
            placeId: "oxford-place",
            start: "10:30",
            end: "11:30",
          },
        ],
      }),
      places,
      references,
    ),
  );
  assert.equal(issuesWith(exact, "INSUFFICIENT_TRANSFER_TIME").length, 0);
  const adjacent = data(
    checkDay(
      day({
        fixedArrangements: [
          {
            id: "appointment",
            title: "牛津预约",
            city: "oxford",
            start: "12:00",
            end: "13:00",
          },
        ],
      }),
      places,
      references,
    ),
  );
  assert.equal(adjacent.transfers[0].availableMinutes, 60);
  assert.deepEqual(
    issuesWith(adjacent, "INSUFFICIENT_TRANSFER_TIME")[0].relatedIds,
    ["visit-1", "appointment"],
  );
  const reverse = data(
    checkDay(day({ startCity: "oxford" }), places, references),
  );
  assert.equal(reverse.transfers[0].neededMinutes, 90);
});

test("missing or unusable intercity data remains unknown and never implies feasibility", () => {
  const output = data(
    checkDay(
      day({
        visits: [
          { id: "bath", placeId: "bath-place", start: "10:00", end: "11:00" },
        ],
      }),
      places,
      references,
    ),
  );
  assert.equal(output.status, "needs-confirmation");
  assert.equal(output.transfers[0].neededMinutes, null);
  assert.equal(output.transfers[0].referenceId, null);
  assert.equal(issuesWith(output, "TRANSFER_UNKNOWN").length, 1);
  const broken = data(
    checkDay(day({ startCity: "oxford" }), places, [
      { ...references[0], planningRideMinutes: Number.NaN },
    ]),
  );
  assert.equal(issuesWith(broken, "TRANSFER_UNKNOWN").length, 1);
});

test("regular opening warnings use the date weekday and missing coverage remains unknown", () => {
  const friday = data(
    checkDay(
      day({
        visits: [
          { id: "v", placeId: "london-place", start: "17:00", end: "18:00" },
        ],
      }),
      places,
      references,
    ),
  );
  assert.equal(issuesWith(friday, "OUTSIDE_REGULAR_OPENING").length, 1);
  assert.equal(
    issuesWith(friday, "OUTSIDE_REGULAR_OPENING")[0].severity,
    "warning",
  );
  assert.equal(friday.status, "needs-confirmation");
  assert.equal(issuesWith(friday, "OPENING_EXCEPTIONS").length, 0);
  const sunday = data(
    checkDay(day({ date: "2026-10-11" }), places, references),
  );
  assert.equal(issuesWith(sunday, "OPENING_UNKNOWN").length, 1);
  assert.equal(issuesWith(sunday, "OUTSIDE_REGULAR_OPENING").length, 0);
  assert.equal(issuesWith(sunday, "OPENING_EXCEPTIONS").length, 0);
  const lunchBreak = place("london-place", "london", {
    openingWindows: [
      { weekdays: [5], opens: "09:00", closes: "10:30" },
      { weekdays: [5], opens: "11:00", closes: "17:00" },
    ],
  });
  assert.equal(
    issuesWith(
      data(checkDay(day(), [lunchBreak], references)),
      "OUTSIDE_REGULAR_OPENING",
    ).length,
    1,
  );
});

test("visits within recurring opening still expose the place-specific date exception caveat", () => {
  const caveat = "测试场馆通知：2026-10-10 延迟至 12:00 开放，请复核当天通知。";
  const withException = place("london-place", "london", {
    openingWindows: [{ weekdays: [6], opens: "10:00", closes: "17:00" }],
    openingCaveat: caveat,
  });
  const output = data(
    checkDay(
      day({
        date: "2026-10-10",
        visits: [
          { id: "v", placeId: "london-place", start: "10:00", end: "12:00" },
        ],
      }),
      [withException],
      references,
    ),
  );
  const reminders = issuesWith(output, "OPENING_EXCEPTIONS");
  assert.equal(reminders.length, 1);
  assert.equal(reminders[0].severity, "unknown");
  assert.deepEqual(reminders[0].relatedIds, ["v"]);
  assert.ok(reminders[0].message.includes(caveat));
  assert.match(reminders[0].message, /不能确认旅行当天可入场/);
  assert.equal(output.status, "needs-confirmation");
  assert.equal(issuesWith(output, "OUTSIDE_REGULAR_OPENING").length, 0);
  assert.equal(issuesWith(output, "OPENING_UNKNOWN").length, 0);
});

test("explicit sourced closure dates take precedence over regular opening and unknown weekday coverage", () => {
  const closed = place("london-place", "london", {
    knownClosedDates: ["2026-10-09", "2026-10-11"],
  });
  for (const date of ["2026-10-09", "2026-10-11"]) {
    const output = data(checkDay(day({ date }), [closed], references));
    assert.equal(output.status, "conflicts");
    assert.equal(
      issuesWith(output, "KNOWN_CLOSED_DATE")[0].severity,
      "conflict",
    );
    assert.equal(issuesWith(output, "OPENING_UNKNOWN").length, 0);
    assert.equal(issuesWith(output, "OUTSIDE_REGULAR_OPENING").length, 0);
    assert.equal(issuesWith(output, "OPENING_EXCEPTIONS").length, 0);
  }
  const otherSunday = data(
    checkDay(day({ date: "2026-10-18" }), [closed], references),
  );
  assert.equal(issuesWith(otherSunday, "KNOWN_CLOSED_DATE").length, 0);
  assert.equal(issuesWith(otherSunday, "OPENING_UNKNOWN").length, 1);
  assert.equal(otherSunday.status, "needs-confirmation");
});

test("outside the user day is a conflict while short visits and unknown facts have separate severities", () => {
  const unknown = place("london-place", "london", {
    booking: { text: "未知", status: "unknown", sourceIds: [] },
    openingWindows: null,
  });
  const output = data(
    checkDay(
      day({
        visits: [
          { id: "v", placeId: "london-place", start: "08:45", end: "09:00" },
        ],
      }),
      [unknown],
      references,
    ),
  );
  assert.equal(
    issuesWith(output, "OUTSIDE_DAY_WINDOW")[0].severity,
    "conflict",
  );
  assert.equal(issuesWith(output, "SHORT_VISIT")[0].severity, "warning");
  assert.equal(
    issuesWith(output, "PLACE_DETAILS_UNKNOWN")[0].severity,
    "unknown",
  );
  assert.equal(issuesWith(output, "OPENING_UNKNOWN")[0].severity, "unknown");
  assert.equal(issuesWith(output, "LIVE_CONDITIONS_UNVERIFIED").length, 1);
});

test("checks preserve input order and catalog while returning only qualified outcomes", () => {
  const input = day({
    visits: [
      { id: "late", placeId: "london-place", start: "14:00", end: "15:00" },
      { id: "early", placeId: "london-place", start: "10:00", end: "11:00" },
    ],
  });
  const before = structuredClone({ input, places, references });
  const output = data(checkDay(input, places, references));
  assert.equal(output.status, "needs-confirmation");
  assert.match(output.summary, /仍需确认/);
  assert.deepEqual({ input, places, references }, before);
});
