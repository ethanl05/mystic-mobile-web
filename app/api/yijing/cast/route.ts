import { NextResponse } from "next/server";
import { calculateHexagram } from "@/features/yijing/engine/calculate-hexagram";
import { MOCK_USER_ID, store } from "@/lib/store/memory";
import { createId } from "@/lib/utils/ids";

export async function POST(request: Request) {
  try {
    const { numbers } = await request.json();
    const result = calculateHexagram({ numbers });
    const id = createId("yc");
    store.yijingCasts.set(id, {
      id,
      userId: MOCK_USER_ID,
      numbers,
      result,
      createdAt: new Date().toISOString()
    });
    return NextResponse.json({ castId: id, result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "起卦失败。" }, { status: 400 });
  }
}
