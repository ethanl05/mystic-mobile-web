import { STANDARD_DISCLAIMER } from "@/lib/safety/disclaimers";
import { reviewOutput } from "@/lib/safety/review-output";
import { callDeepSeek } from "./deepseek-client";
import type { InterpretationReport, InterpretationRequest } from "./schemas";

function stringifyReport(report: InterpretationReport): string {
  return [report.title, report.summary, ...report.sections.map((section) => section.body), ...report.actionSuggestions, report.disclaimer].join("\n");
}

function buildMockReport(request: InterpretationRequest): InterpretationReport {
  if (request.mode === "bazi") {
    return {
      title: "八字命盘综合解读",
      summary: "这份报告基于代码排出的命盘结构，提供性格、行动方式和生活节奏层面的参考。",
      sections: [
        {
          heading: "盘面提示",
          body: "从四柱、五行和十神分布看，可以先关注自身能量的偏重与不足，把它当成理解行为模式的镜子。"
        },
        {
          heading: "行动建议",
          body: "更适合用渐进方式调整节奏：先识别稳定优势，再补足过弱的五行象征领域，避免把解读当作唯一决策依据。"
        },
        {
          heading: "趣味生活指南",
          body: "可结合喜用五行选择城市方位、空间风格、季节节奏和运动方式，但这些建议只作为文化趣味延伸。"
        }
      ],
      actionSuggestions: [
        "颜色上可多尝试清爽的蓝、绿或米白，作为日常穿搭里的轻量点缀。",
        "空间和城市气质上，可留意靠近水岸、绿地或节奏舒缓的环境。",
        "工作类型更适合有稳定节奏、可长期积累经验的方向。",
        "运动上可选择散步、游泳、拉伸这类帮助放松节奏的项目。"
      ],
      disclaimer: STANDARD_DISCLAIMER
    };
  }
  return {
    title: "本卦对当前问题的提示",
    summary: "这次解读从卦象结构、动爻变化和你选择的问题方向出发，给出反思角度。",
    sections: [
      {
        heading: "卦象提示",
        body: "本卦更像是在提醒你观察当下局势的主线，变卦则提示事情可能随着你的行动方式而改变。"
      },
      {
        heading: "问题方向",
        body: `你选择的方向是“${request.userContext.focusArea}”。如果涉及财运，应优先回到现实信息、风险承受能力和决策节奏，不把卦象当作买卖或收益判断。`
      },
      {
        heading: "冷却提醒",
        body: "同一问题不建议频繁追问。小事可隔三天，中等事项隔三周，重大事项隔三个月再观察。"
      }
    ],
    actionSuggestions: ["先记录现在最担心的一点，再列出一个现实中可验证的下一步。", "涉及财务事项时，只把卦象当作风险意识提醒，不作为具体投资依据。"],
    disclaimer: STANDARD_DISCLAIMER
  };
}

export async function interpret(request: InterpretationRequest): Promise<{ report: InterpretationReport; safetyReviewStatus: "passed" | "fallback" }> {
  const report = process.env.AI_PROVIDER === "deepseek" ? await callDeepSeek(request) : buildMockReport(request);
  const review = reviewOutput(stringifyReport(report));
  if (review.passed) return { report, safetyReviewStatus: "passed" };
  return {
    report: {
      title: "安全解读提示",
      summary: "这次内容无法按原样生成，以下为更稳妥的反思提示。",
      sections: [{ heading: "建议", body: "请把本次结果作为传统文化体验，不要替代专业判断或现实沟通。" }],
      actionSuggestions: ["暂停一下，先确认现实信息。"],
      disclaimer: STANDARD_DISCLAIMER
    },
    safetyReviewStatus: "fallback"
  };
}
