import { NextResponse } from "next/server";
import { interpret } from "@/lib/ai/interpreter";
import { hasBaziMembership } from "@/lib/entitlement/check-entitlement";
import { store } from "@/lib/store/memory";

export async function POST(request: Request) {
  try {
    const { profileId, focusArea = "general" } = await request.json();
    if (!hasBaziMembership()) return NextResponse.json({ error: "八字会员已过期，请先购买。" }, { status: 402 });
    const profile = store.baziProfiles.get(profileId);
    if (!profile || profile.deletedAt) return NextResponse.json({ error: "命盘不存在。" }, { status: 404 });
    const { report, safetyReviewStatus } = await interpret({
      mode: "bazi",
      computedResult: profile.chart,
      userContext: { focusArea },
      safetyPolicy: {
        noDeterministicPrediction: true,
        noMedicalLegalFinancialDirective: true,
        tone: "traditional_culture_reflective"
      }
    });
    profile.report = report;
    store.baziProfiles.set(profile.id, profile);
    return NextResponse.json({ reportId: `br_${profile.id}`, report, safetyReviewStatus });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "报告生成失败。" }, { status: 400 });
  }
}
