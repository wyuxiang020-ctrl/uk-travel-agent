// Server-side provider seam. No credentials, network calls or empty-success fallback.
export type TransportQuery = { from: string; to: string; date: string; mode: "rail" | "coach" | "flight" | "ferry" };
export type TransportOption = { operator: string; departure: string; arrival: string; sourceUrl: string; retrievedAt: string; price?: { amount: number; currency: string } };
export type TransportResult = { status: "not_configured" | "unavailable"; message: string } | { status: "ok"; options: TransportOption[] };
export interface TransportProvider { search(query: TransportQuery): Promise<TransportResult> }
export const transportProvider: TransportProvider = {
  async search() { return { status: "not_configured", message: "实时交通尚未接入，请在官方查询入口确认班次与价格。" }; },
};
