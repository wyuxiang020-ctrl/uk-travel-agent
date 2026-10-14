import { readAgentBody, acquireRun } from "@/lib/agent/http";
import { createModelClient, getModelConfig } from "@/lib/agent/model";
import { AgentError, record, text } from "@/lib/agent/validation";
import { parseDailyRequest, validateDaily } from "@/lib/uk-daily";
import { runUkDaily } from "@/lib/agent/uk-daily-runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET() {
  return Response.json({ enabled: process.env.TRAVEL_UK_DAILY_ENABLED === "true", verified: false, message: process.env.TRAVEL_UK_DAILY_ENABLED === "true" ? "新逐日模型流程已启用，但尚未完成真实验证；点击生成会使用现有模型预算。" : "新逐日生成代码已接入，真实测试尚未启用。可先查资料、手动编排并免费检查。" }, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: Request) {
  let release: (() => void) | undefined;
  try {
    const raw = await readAgentBody(request);
    if (!record(raw)) throw new AgentError("INVALID_INPUT", "请求格式不正确。");
    const input = parseDailyRequest(raw.request);
    if (raw.action === "check") return Response.json({ ok: true, result: validateDaily(raw.proposal, input, "manual") });
    if (raw.action !== "generate" || !text(raw.requestId, 80) || !/^[\w-]{8,80}$/.test(raw.requestId)) throw new AgentError("INVALID_INPUT", "请求类型或编号无效。");
    if (process.env.TRAVEL_UK_DAILY_ENABLED !== "true") throw new AgentError("UK_MODEL_PAUSED", "新的英国逐日模型测试尚未启用；本次未调用模型、未计费。");
    const config = getModelConfig();
    if (!config.testBudget || config.testBudget.id !== "20261011-gpt41-first") throw new AgentError("BUDGET_REQUIRED", "需要保留原累计测试预算配置，不允许无额度保护运行。");
    request.signal.throwIfAborted(); release = acquireRun(raw.requestId);
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(180000)]), events: string[] = [];
    const result = await runUkDaily(input, { model: createModelClient(config), signal, maxRounds: 4, emit: m => events.push(m) });
    return Response.json({ ok: true, result, events }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const e = request.signal.aborted ? new AgentError("CANCELLED", "已取消，未采用新安排。") : error instanceof AgentError ? error : new AgentError("DAILY_FAILED", "本次安排未完成，原结果保留。");
    return Response.json({ ok: false, error: { code: e.code, message: e.message } }, { status: e.code === "UK_MODEL_PAUSED" ? 503 : e.code === "ORIGIN_REJECTED" ? 403 : e.code === "AGENT_BUSY" || e.code === "DUPLICATE_REQUEST" ? 409 : 400, headers: { "Cache-Control": "no-store" } });
  } finally { release?.(); }
}
