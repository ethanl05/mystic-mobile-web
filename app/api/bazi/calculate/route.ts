import { NextResponse } from "next/server";
import { calculateBaziChart } from "@/features/bazi/engine/calculate-bazi-chart";
import type { BaziInput } from "@/features/bazi/engine/types";
import { generateBaziFateSummary } from "@/lib/ai/bazi-fate-summary";
import { MOCK_USER_ID, store } from "@/lib/store/memory";
import { createId } from "@/lib/utils/ids";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const profileId = url.searchParams.get("profileId");
  if (!profileId) return NextResponse.json({ error: "缺少命盘 ID。" }, { status: 400 });
  const profile = store.baziProfiles.get(profileId);
  if (!profile || profile.deletedAt) return NextResponse.json({ error: "命盘不存在。" }, { status: 404 });
  return NextResponse.json({ profile });
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as BaziInput;
    const chart = calculateBaziChart(input);
    const fateSummary = await generateBaziFateSummary(chart);
    const id = createId("bp");
    store.baziProfiles.set(id, {
      id,
      userId: MOCK_USER_ID,
      input,
      chart,
      fateSummary,
      createdAt: new Date().toISOString()
    });
    return NextResponse.json({ profileId: id, chart, fateSummary });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "八字排盘失败。" }, { status: 400 });
  }
}
