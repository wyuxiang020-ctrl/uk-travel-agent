"use client";

import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { DEFAULT_DRAFT, type TripDraft } from "@/lib/demo-trip";

type DraftContext = {
  draft: TripDraft;
  setDraft: Dispatch<SetStateAction<TripDraft>>;
};
const PlannerContext = createContext<DraftContext | null>(null);

export function PlannerProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<TripDraft>(() => ({
    ...DEFAULT_DRAFT,
    cities: [...DEFAULT_DRAFT.cities],
    interests: [],
  }));
  return (
    <PlannerContext.Provider value={{ draft, setDraft }}>
      {children}
    </PlannerContext.Provider>
  );
}

export function usePlannerDraft() {
  const context = useContext(PlannerContext);
  if (!context) throw new Error("PlannerProvider is required");
  return context;
}
