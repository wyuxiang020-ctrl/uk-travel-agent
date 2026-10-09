import assert from "node:assert/strict";
import test from "node:test";
import type { CityId, TripDraft } from "./demo-trip";

// Native Node requires the explicit .ts runtime extension. The type import above
// stays compatible with the application's existing bundler-resolution settings.
const moduleUrl = new URL("./demo-trip.ts", import.meta.url);
const {
  CITIES,
  PLACES,
  DEFAULT_DRAFT,
  buildDemoDays,
  validateDraft,
}: typeof import("./demo-trip") = await import(moduleUrl.href);

function draft(overrides: Partial<TripDraft> = {}): TripDraft {
  return {
    ...DEFAULT_DRAFT,
    idea: "想慢慢认识英国的三座城市。",
    cities: [...DEFAULT_DRAFT.cities],
    interests: [],
    ...overrides,
  };
}

test("every supported city/start/end/day combination preserves the itinerary contract", () => {
  const cityIds = CITIES.map((city) => city.id);
  const knownPlaces = new Map(PLACES.map((place) => [place.id, place]));
  let validCases = 0;

  // All subsets and their permutations exercise the user's selected order too.
  function permutations(items: CityId[]): CityId[][] {
    if (items.length <= 1) return [items];
    return items.flatMap((item) =>
      permutations(items.filter((other) => other !== item)).map((rest) => [
        item,
        ...rest,
      ]),
    );
  }

  for (let mask = 1; mask < 1 << cityIds.length; mask += 1) {
    const subset = cityIds.filter((_, index) => (mask & (1 << index)) !== 0);
    for (const cities of permutations(subset)) {
      for (const startCity of cities) {
        for (const endCity of cities) {
          for (let days = 3; days <= 7; days += 1) {
            const input = draft({ cities, startCity, endCity, days });
            const label = JSON.stringify({ cities, startCity, endCity, days });
            if (cities.length === 3 && startCity === endCity && days === 3) {
              assert.ok(validateDraft(input).days, label);
              assert.deepEqual(buildDemoDays(input), [], label);
              continue;
            }
            assert.deepEqual(validateDraft(input), {}, label);
            const output = buildDemoDays(input);
            assert.equal(output.length, days, label);
            assert.equal(output[0].city, startCity, label);
            assert.equal(output.at(-1)?.city, endCity, label);
            assert.deepEqual(
              new Set(output.map((day) => day.city)),
              new Set(cities),
              label,
            );
            output.forEach((day, index) => {
              assert.equal(day.day, index + 1, label);
              assert.ok(day.placeIds.length >= 2, label);
              assert.equal(
                new Set(day.placeIds).size,
                day.placeIds.length,
                label,
              );
              for (const placeId of day.placeIds) {
                assert.equal(knownPlaces.get(placeId)?.city, day.city, label);
              }
              const previous = output[index - 1];
              if (previous && previous.city !== day.city) {
                assert.equal(day.transferFrom, previous.city, label);
              } else {
                assert.equal(day.transferFrom, undefined, label);
              }
            });
            validCases += 1;
          }
        }
      }
    }
  }
  assert.ok(validCases > 300);
});

test("city order is retained between the requested start and end, including a return", () => {
  const output = buildDemoDays(
    draft({
      cities: ["bath", "london", "oxford"],
      startCity: "london",
      endCity: "london",
      days: 4,
    }),
  );
  assert.deepEqual(
    output.map((day) => day.city),
    ["london", "bath", "oxford", "london"],
  );
  const sevenDays = buildDemoDays(draft());
  assert.deepEqual(
    sevenDays.map((day) => day.city),
    ["london", "london", "london", "oxford", "oxford", "bath", "bath"],
  );
});

test("fixtures have unique identifiers, usable marker positions and coverage for all cities", () => {
  assert.equal(new Set(PLACES.map((place) => place.id)).size, PLACES.length);
  assert.ok(PLACES.length >= 9 && PLACES.length <= 12);
  for (const city of CITIES) {
    assert.ok(PLACES.filter((place) => place.city === city.id).length >= 2);
  }
  for (const place of PLACES) {
    assert.ok(CITIES.some((city) => city.id === place.city));
    assert.ok(
      place.name && place.english && place.category && place.description,
    );
    assert.ok(
      Number.isFinite(place.position[0]) && Math.abs(place.position[0]) <= 90,
    );
    assert.ok(
      Number.isFinite(place.position[1]) && Math.abs(place.position[1]) <= 180,
    );
  }
});

test("invalid or missing form fields return specific errors and never build a partial sample", () => {
  const cases: [Partial<TripDraft>, string][] = [
    [{ idea: "  " }, "idea"],
    [{ idea: "文".repeat(501) }, "idea"],
    [{ cities: [] }, "cities"],
    [{ cities: ["edinburgh" as CityId] }, "cities"],
    [{ cities: ["london", "london"] }, "cities"],
    [
      { cities: ["oxford"], startCity: "london", endCity: "oxford" },
      "startCity",
    ],
    [{ cities: ["london"], startCity: "london", endCity: "bath" }, "endCity"],
    [{ startCity: "paris" as CityId }, "startCity"],
    [{ endCity: "paris" as CityId }, "endCity"],
    [{ days: 2 }, "days"],
    [{ days: 8 }, "days"],
    [{ days: 3.5 }, "days"],
    [{ days: Number.NaN }, "days"],
    [{ datesFlexible: "yes" as unknown as boolean }, "datesFlexible"],
    [{ datesFlexible: false, startDate: "" }, "startDate"],
    [{ pace: "fast" as TripDraft["pace"] }, "pace"],
    [{ interests: [1] as unknown as string[] }, "interests"],
    [{ mustVisit: "文".repeat(1001) }, "mustVisit"],
    [{ fixedPlans: "文".repeat(1001) }, "fixedPlans"],
  ];
  for (const [changes, field] of cases) {
    const input = draft(changes);
    assert.ok(
      validateDraft(input)[field],
      `${field}: ${JSON.stringify(changes)}`,
    );
    assert.deepEqual(buildDemoDays(input), []);
  }
});

test("dates validate real calendar days while accepting flexible and historical dates", () => {
  for (const startDate of [
    "2026-02-29",
    "2026-04-31",
    "2026-13-01",
    "2026-00-01",
    "2026-01-00",
    "2026-1-01",
    "0000-01-01",
  ]) {
    assert.ok(
      validateDraft(draft({ datesFlexible: false, startDate })).startDate,
      startDate,
    );
  }
  for (const startDate of ["2024-02-29", "2000-01-01", "2026-10-09"]) {
    assert.deepEqual(
      validateDraft(draft({ datesFlexible: false, startDate })),
      {},
      startDate,
    );
  }
  assert.deepEqual(
    validateDraft(draft({ datesFlexible: true, startDate: "" })),
    {},
  );
});

test("preferences remain unimplemented and assembly does not mutate the draft", () => {
  const input = draft();
  const before = structuredClone(input);
  const output = buildDemoDays(input);
  assert.deepEqual(input, before);
  assert.deepEqual(
    buildDemoDays(
      draft({
        interests: ["自然风景"],
        pace: "relaxed",
        mustVisit: "我自己的必去地点",
        fixedPlans: "周三下午另有安排",
      }),
    ),
    output,
  );
});
