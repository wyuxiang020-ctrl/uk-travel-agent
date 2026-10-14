import type { TripDraft, CityId } from "../demo-trip";
import type { CheckDayInput, CheckDayResult, TravelPlace, TransferReference } from "../travel-types";

export type Requirements = {
  draft: TripDraft;
  summary: string;
  availableFrom: string;
  availableUntil: string;
  mustVisitIds: string[];
  fixed: { day: number; id: string; title: string; city: CityId; start: string; end: string }[];
};
export type PlannedDay = Omit<CheckDayInput,"visits"> & {
  day: number;
  title: string;
  visits: (CheckDayInput["visits"][number] & { reason: string })[];
};
export type PlanProposal = { title: string; summary: string; days: PlannedDay[] };
export type GeneratedPlan = PlanProposal & {
  mode: "model";
  generatedAt: string;
  requirements: Requirements;
  checks: { day: number; result: CheckDayResult }[];
  places: TravelPlace[];
  transfers: TransferReference[];
};
export type AgentOutcome =
  | { kind: "questions"; questions: string[] }
  | { kind: "requirements"; requirements: Requirements }
  | { kind: "plan"; plan: GeneratedPlan };
export type AgentRequest =
  | { action: "revise"; requestId:string; basePlan:PlanProposal; baseRequirements:Requirements; requirements:Requirements; lockedIds:string[]; instruction:string }
  | { action: "understand"; requestId: string; draft: TripDraft; answers: { questions: string[]; answer: string }[] }
  | { action: "generate"; requestId: string; requirements: Requirements };
export type AgentEvent = {
  sequence: number;
  at: string;
  type: "run_started" | "model_started" | "model_finished" | "tool_started" | "tool_finished" | "repair" | "result" | "error";
  message: string;
  actor?: "model" | "workflow";
  tool?: string;
  callId?: string;
  input?: unknown;
  output?: unknown;
  elapsedMs?: number;
  outcome?: AgentOutcome;
  code?: string;
};
export type FunctionTool = { type: "function"; function: { name: string; description: string; parameters: Record<string, unknown>; strict: boolean } };
export type ToolCall = { id: string; type: "function"; function: { name: string; arguments: string } };
export type ModelMessage = { role: "system" | "user" | "assistant" | "tool"; content: string | null; tool_calls?: ToolCall[]; tool_call_id?: string };
export type ModelReply = { message: ModelMessage; usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } };
export type ModelClient = (messages: ModelMessage[], tools: FunctionTool[], signal: AbortSignal) => Promise<ModelReply>;
