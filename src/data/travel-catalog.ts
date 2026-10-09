import { LONDON_PLACES } from "./london-places";
import { OXFORD_PLACES } from "./oxford-places";
import { BATH_PLACES } from "./bath-places";
import type { TravelPlace } from "../lib/travel-types";

export const TRAVEL_PLACES: TravelPlace[] = [
  ...LONDON_PLACES,
  ...OXFORD_PLACES,
  ...BATH_PLACES,
];

export { TRANSFER_REFERENCES } from "./transfer-references";
