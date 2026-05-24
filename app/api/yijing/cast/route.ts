import { NextResponse } from "next/server";
import { calculateHexagram } from "@/features/yijing/engine/calculate-hexagram";
import { getLineAuspice } from "@/features/yijing/engine/line-auspices";
import { MOCK_USER_ID, store } from "@/lib/store/memory";
import { createId } from "@/lib/utils/ids";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const castId = url.searchParams.get("castId");
  if (!castId) return NextResponse.json({ error: "缺少卦例 ID。" }, { status: 400 });
  const cast = store.yijingCasts.get(castId);
  if (!cast || cast.deletedAt) return NextResponse.json({ error: "卦例不存在。" }, { status: 404 });
  cast.result.lineAuspice = getLineAuspice(`${cast.result.upperTrigram}-${cast.result.lowerTrigram}`, cast.result.movingLine);
  store.yijingCasts.set(cast.id, cast);
  return NextResponse.json({ cast });
}

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
