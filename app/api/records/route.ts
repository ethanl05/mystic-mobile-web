import { NextResponse } from "next/server";
import { store } from "@/lib/store/memory";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  if (type === "bazi") {
    return NextResponse.json({ records: [...store.baziProfiles.values()].filter((record) => !record.deletedAt) });
  }
  if (type === "yijing") {
    return NextResponse.json({ records: [...store.yijingCasts.values()].filter((record) => !record.deletedAt) });
  }
  return NextResponse.json({
    bazi: [...store.baziProfiles.values()].filter((record) => !record.deletedAt),
    yijing: [...store.yijingCasts.values()].filter((record) => !record.deletedAt)
  });
}
