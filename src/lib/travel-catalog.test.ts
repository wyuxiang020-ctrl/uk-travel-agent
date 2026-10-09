import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import type { TravelPlace, TransferReference } from "./travel-types";

// Type-only imports in the data files let native Node test the checked-in
// dataset without a bundler, independently of its application barrel file.
const london = await import(
  new URL("../data/london-places.ts", import.meta.url).href
);
const oxford = await import(
  new URL("../data/oxford-places.ts", import.meta.url).href
);
const bath = await import(
  new URL("../data/bath-places.ts", import.meta.url).href
);
const transport = await import(
  new URL("../data/transfer-references.ts", import.meta.url).href
);
const demo = await import(new URL("./demo-trip.ts", import.meta.url).href);
const stories = await import(
  new URL("../data/place-stories.ts", import.meta.url).href
);
const places: TravelPlace[] = [
  ...london.LONDON_PLACES,
  ...oxford.OXFORD_PLACES,
  ...bath.BATH_PLACES,
];
const references: TransferReference[] = transport.TRANSFER_REFERENCES;
const time = (value: string) => {
  assert.match(value, /^([01]\d|2[0-3]):[0-5]\d$/);
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
};

test("catalog covers all three cities and all existing sample identifiers", () => {
  assert.equal(places.length, 30);
  const ids = new Set(places.map((place) => place.id));
  assert.equal(ids.size, 30);
  for (const city of ["london", "oxford", "bath"])
    assert.equal(places.filter((place) => place.city === city).length, 10);
  for (const fixture of demo.PLACES)
    assert.ok(ids.has(fixture.id), `Missing sample evidence: ${fixture.id}`);
});

test("discovery stories join real places and their own evidence sources", () => {
  const ids = new Set<string>();
  for (const story of stories.PLACE_STORIES) {
    assert.ok(!ids.has(story.id), `Duplicate story: ${story.id}`);
    ids.add(story.id);
    const place = places.find((item) => item.id === story.placeId);
    assert.ok(place, `Missing place: ${story.placeId}`);
    assert.equal(story.city, place.city, story.id);
    assert.ok(story.sourceIds.length > 0, story.id);
    for (const id of story.sourceIds)
      assert.ok(
        place.sources.some((source) => source.id === id),
        `${story.id}: ${id}`,
      );
    assert.ok(story.title && story.summary && story.body.length >= 2, story.id);
    assert.match(story.image.src, /^\/images\/[\w-]+\.(jpg|png|webp)$/);
    assert.ok(
      existsSync(new URL(`../../public${story.image.src}`, import.meta.url)),
      `Missing story image: ${story.image.src}`,
    );
    assert.ok(story.image.alt && story.image.caption, story.id);
  }
  for (const city of ["london", "oxford", "bath"])
    assert.ok(
      stories.PLACE_STORIES.filter((story: { city: string }) => story.city === city)
        .length >= 2,
      city,
    );
  for (const id of ["london-south-bank", "oxford-bodleian", "bath-roman-baths"])
    assert.ok(ids.has(id), `Missing home story link: ${id}`);
});

test("every sourced claim resolves to a dated source and every computable window is valid", () => {
  for (const place of places) {
    assert.ok(place.description && place.address && place.english, place.id);
    assert.equal(place.coordinateStatus, "approximate");
    assert.ok(place.position.every(Number.isFinite));
    assert.ok(
      place.position[0] >= 50 &&
        place.position[0] <= 53 &&
        place.position[1] >= -4 &&
        place.position[1] <= 1,
      place.id,
    );
    assert.ok(place.suggestedMinutes > 0 && place.durationBasis.length > 0);
    assert.ok(place.sources.length > 0);
    const sources = new Set(place.sources.map((source) => source.id));
    assert.equal(sources.size, place.sources.length);
    for (const source of place.sources) {
      assert.equal(new URL(source.url).protocol, "https:");
      assert.equal(source.checkedOn, "2026-10-09");
      assert.ok(source.title);
    }
    for (const fact of [
      place.visiting,
      place.opening,
      place.admission,
      place.booking,
    ]) {
      assert.ok(fact.text.trim());
      if (fact.status === "sourced")
        assert.ok(fact.sourceIds.length > 0, place.id);
      for (const id of fact.sourceIds)
        assert.ok(
          sources.has(id),
          `${place.id} references absent source ${id}`,
        );
    }
    if (place.openingWindows?.length)
      assert.equal(place.opening.status, "sourced", place.id);
    for (const window of place.openingWindows ?? []) {
      assert.ok(
        window.weekdays.length > 0 &&
          window.weekdays.every(
            (day) => Number.isInteger(day) && day >= 1 && day <= 7,
          ),
      );
      assert.ok(time(window.opens) < time(window.closes));
    }
    for (const date of place.knownClosedDates ?? []) {
      assert.match(date, /^\d{4}-\d{2}-\d{2}$/);
      assert.equal(
        new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10),
        date,
      );
      assert.ok(place.opening.sourceIds.length > 0);
    }
  }
});

test("all city pairs have separately labelled travel estimates and provenance", () => {
  assert.equal(references.length, 3);
  assert.equal(
    new Set(
      references.map((reference) =>
        [reference.from, reference.to].sort().join("/"),
      ),
    ).size,
    3,
  );
  for (const reference of references) {
    assert.notEqual(reference.from, reference.to);
    assert.ok(
      Number.isFinite(reference.planningRideMinutes) &&
        reference.planningRideMinutes > 0,
    );
    assert.ok(
      Number.isFinite(reference.bufferMinutes) && reference.bufferMinutes >= 0,
    );
    assert.ok(
      reference.planningBasis && reference.caveat && reference.referenceText,
    );
    assert.ok(reference.sources.length > 0);
    for (const source of reference.sources) {
      assert.equal(new URL(source.url).protocol, "https:");
      assert.equal(source.checkedOn, "2026-10-09");
    }
    if (reference.referenceKind === "unknown")
      assert.equal(reference.referenceMinutes, null);
    else
      assert.ok(
        reference.referenceMinutes !== null && reference.referenceMinutes > 0,
      );
  }
});
