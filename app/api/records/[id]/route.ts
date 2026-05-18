import { NextResponse } from "next/server";
import { store } from "@/lib/store/memory";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bazi = store.baziProfiles.get(id);
  if (bazi) {
    bazi.deletedAt = new Date().toISOString();
    store.baziProfiles.set(id, bazi);
    return NextResponse.json({ ok: true });
  }
  const yijing = store.yijingCasts.get(id);
  if (yijing) {
    yijing.deletedAt = new Date().toISOString();
    store.yijingCasts.set(id, yijing);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "记录不存在。" }, { status: 404 });
}
