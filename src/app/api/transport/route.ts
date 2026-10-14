import { NextResponse } from "next/server";
import { transportProvider } from "@/lib/transport-provider";

export async function GET() {
  return NextResponse.json({ ...(await transportProvider.search({ from: "", to: "", date: "", mode: "rail" })), configured: false }, { headers: { "Cache-Control": "no-store" } });
}
