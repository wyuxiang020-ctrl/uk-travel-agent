import { TRAVEL_PLACES, TRANSFER_REFERENCES } from "@/data/travel-catalog";
import {
  checkDay,
  getPlace,
  getTransfer,
  listPlaces,
} from "@/lib/travel-tools";
import type { ToolResult } from "@/lib/travel-types";

export const runtime = "nodejs";
const MAX_BODY_BYTES = 32 * 1024;

function json(result: ToolResult<unknown>, status = 200) {
  return Response.json(result, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function error(code: string, message: string, status: number) {
  return json({ ok: false, error: { code, message } }, status);
}

export function GET() {
  return json({
    ok: true,
    data: {
      tools: [
        {
          name: "list_places",
          input:
            "{ city?: london|oxford|bath, query?: string, category?: string }",
        },
        { name: "get_place", input: "{ id: string }" },
        {
          name: "get_transfer",
          input: "{ from: london|oxford|bath, to: london|oxford|bath }",
        },
        {
          name: "check_day",
          input:
            "{ date: YYYY-MM-DD, startCity, availableFrom: HH:mm, availableUntil: HH:mm, visits: [{id,placeId,start,end}], fixedArrangements: [{id,title,city,start,end}] }",
        },
      ],
      maxBodyBytes: MAX_BODY_BYTES,
      scope:
        "查询项目已核对来源的本地资料快照和基础时间检查；不请求实时班次、票额或模型，不改写行程。",
    },
  });
}

export async function POST(request: Request) {
  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  ) {
    return error(
      "UNSUPPORTED_MEDIA_TYPE",
      "请使用 application/json 请求。",
      415,
    );
  }
  const declaredLength = request.headers.get("content-length");
  if (
    declaredLength &&
    /^\d+$/.test(declaredLength) &&
    Number(declaredLength) > MAX_BODY_BYTES
  ) {
    return error("PAYLOAD_TOO_LARGE", "请求超过 32 KiB 限制。", 413);
  }
  if (!request.body) return error("INVALID_INPUT", "请求体不能为空。", 400);
  let body: unknown;
  const reader = request.body.getReader();
  try {
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      length += next.value.byteLength;
      if (length > MAX_BODY_BYTES) {
        await reader.cancel();
        return error("PAYLOAD_TOO_LARGE", "请求超过 32 KiB 限制。", 413);
      }
      chunks.push(next.value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    body = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return error("INVALID_JSON", "无法读取 JSON，请检查请求格式后重试。", 400);
  } finally {
    reader.releaseLock();
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return error("INVALID_INPUT", "请求须为 { tool, input } 对象。", 400);
  }
  const envelope = body as Record<string, unknown>;
  if (
    typeof envelope.tool !== "string" ||
    !("input" in envelope) ||
    Object.keys(envelope).some((key) => key !== "tool" && key !== "input")
  ) {
    return error(
      "INVALID_INPUT",
      "请求须仅包含 tool 字符串和 input 对象。",
      400,
    );
  }
  try {
    let result: ToolResult<unknown>;
    switch (envelope.tool) {
      case "list_places":
        result = listPlaces(envelope.input, TRAVEL_PLACES);
        break;
      case "get_place":
        result = getPlace(envelope.input, TRAVEL_PLACES);
        break;
      case "get_transfer":
        result = getTransfer(envelope.input, TRANSFER_REFERENCES);
        break;
      case "check_day":
        result = checkDay(envelope.input, TRAVEL_PLACES, TRANSFER_REFERENCES);
        break;
      default:
        return error(
          "UNKNOWN_TOOL",
          "未找到这个工具。请使用 GET /api/tools 查看可用工具。",
          400,
        );
    }
    const status = result.ok
      ? 200
      : ["PLACE_NOT_FOUND", "TRANSFER_NOT_FOUND"].includes(result.error.code)
        ? 404
        : 400;
    return json(result, status);
  } catch {
    return error(
      "INTERNAL_ERROR",
      "工具暂时无法完成查询或检查，请稍后重试。未生成或改写行程。",
      500,
    );
  }
}
