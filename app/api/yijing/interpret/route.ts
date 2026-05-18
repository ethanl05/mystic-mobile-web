import { NextResponse } from "next/server";
import { interpret } from "@/lib/ai/interpreter";
import { deductYijingCredit, refundYijingCredit } from "@/lib/entitlement/deduct-credit";
import { getYijingCredits } from "@/lib/entitlement/check-entitlement";
import { classifyQuestion } from "@/lib/safety/classify-question";
import { store } from "@/lib/store/memory";

export async function POST(request: Request) {
  let deducted = false;
  try {
    const { castId, focusArea = "general", questionText } = await request.json();
    const cast = store.yijingCasts.get(castId);
    if (!cast || cast.deletedAt) return NextResponse.json({ error: "卦例不存在。" }, { status: 404 });
    const classification = classifyQuestion(questionText);
    if (classification.status !== "allowed") {
      return NextResponse.json({ blocked: true, classification }, { status: 200 });
    }
    deductYijingCredit();
    deducted = true;
    const { report, safetyReviewStatus } = await interpret({
      mode: "yijing",
      computedResult: cast.result,
      userContext: { focusArea, questionText },
      safetyPolicy: {
        noDeterministicPrediction: true,
        noMedicalLegalFinancialDirective: true,
        tone: "traditional_culture_reflective"
      }
    });
    cast.focusArea = focusArea;
    cast.questionText = questionText;
    cast.report = report;
    store.yijingCasts.set(cast.id, cast);
    return NextResponse.json({
      reportId: `yr_${cast.id}`,
      creditRemaining: getYijingCredits(),
      report,
      safetyReviewStatus,
      cooldownHint: "同一问题建议至少间隔 3 天/3 周/3 个月再问。"
    });
  } catch (error) {
    if (deducted) refundYijingCredit();
    return NextResponse.json({ error: error instanceof Error ? error.message : "解读失败。" }, { status: 400 });
  }
}
