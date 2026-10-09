export type SupportedCity = "london" | "oxford" | "bath";

export type EvidenceSource = {
  id: string;
  title: string;
  url: string;
  checkedOn: string;
};

export type SourcedFact = {
  text: string;
  status: "sourced" | "unknown";
  sourceIds: string[];
};

export type OpeningWindow = {
  weekdays: number[]; // ISO weekday: Monday 1 through Sunday 7.
  opens: string;
  closes: string;
};

export type TravelPlace = {
  id: string;
  name: string;
  english: string;
  city: SupportedCity;
  category: string;
  description: string;
  address: string;
  position: [number, number];
  coordinateStatus: "approximate";
  visiting: SourcedFact;
  admission: SourcedFact;
  booking: SourcedFact;
  opening: SourcedFact;
  // Only populate when the official page supports a simple recurring pattern.
  openingWindows: OpeningWindow[] | null;
  // Explicit date closures confirmed in opening sources; never inferred from absent hours.
  knownClosedDates?: string[];
  // null windows or an uncovered weekday is unknown, never assumed closed.
  openingCaveat: string;
  suggestedMinutes: number;
  durationBasis: string; // Always label editorial estimate unless sourced.
  sources: EvidenceSource[];
};

export type TransferReference = {
  id: string;
  from: SupportedCity;
  to: SupportedCity;
  mode: "rail";
  route: string;
  serviceSummary: string;
  // Published journey-time reference, not a timetable or guaranteed duration.
  referenceMinutes: number | null;
  referenceKind: "fastest" | "typical" | "unknown";
  referenceText: string;
  planningRideMinutes: number;
  bufferMinutes: number;
  planningBasis: string;
  caveat: string;
  sources: EvidenceSource[];
};

export type ScheduleVisit = {
  id: string;
  placeId: string;
  start: string;
  end: string;
};

export type FixedArrangement = {
  id: string;
  title: string;
  city: SupportedCity;
  start: string;
  end: string;
};

export type CheckDayInput = {
  date: string;
  startCity: SupportedCity;
  availableFrom: string;
  availableUntil: string;
  visits: ScheduleVisit[];
  fixedArrangements: FixedArrangement[];
};

export type CheckIssue = {
  code: string;
  severity: "conflict" | "warning" | "unknown";
  message: string;
  relatedIds: string[];
};

export type TransferAllowance = {
  from: SupportedCity;
  to: SupportedCity;
  beforeId: string;
  availableMinutes: number;
  neededMinutes: number | null;
  referenceId: string | null;
};

export type CheckDayResult = {
  status: "conflicts" | "needs-confirmation";
  issues: CheckIssue[];
  transfers: TransferAllowance[];
  summary: string;
  checkedScope: string[];
};

export type ToolResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };
