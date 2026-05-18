import { NextResponse } from "next/server";
import { calculateBaziChart } from "@/features/bazi/engine/calculate-bazi-chart";
import type { BaziInput } from "@/features/bazi/engine/types";
import { MOCK_USER_ID, store } from "@/lib/store/memory";
import { createId } from "@/lib/utils/ids";

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as BaziInput;
    const chart = calculateBaziChart(input);
    const id = createId("bp");
    store.baziProfiles.set(id, {
      id,
      userId: MOCK_USER_ID,
      input,
      chart,
      createdAt: new Date().toISOString()
    });
    return NextResponse.json({ profileId: id, chart });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "八字排盘失败。" }, { status: 400 });
  }
}
