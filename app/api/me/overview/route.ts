import { NextResponse } from "next/server";
import { store } from "@/lib/store/memory";

export async function GET() {
  const expiresAt = store.entitlement.baziMembershipExpiresAt;
  return NextResponse.json({
    user: {
      id: "user_mock",
      name: "本地测试账号",
      loginStatus: "pending"
    },
    entitlement: {
      baziMembershipExpiresAt: expiresAt,
      baziMembershipActive: new Date(expiresAt).getTime() > Date.now(),
      yijingCredits: store.entitlement.yijingCredits
    }
  });
}
