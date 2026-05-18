import { STANDARD_DISCLAIMER } from "@/lib/safety/disclaimers";
import type { InterpretationReport, InterpretationRequest } from "./schemas";

type DeepSeekChoice = {
  message?: {
    content?: string;
  };
};

type DeepSeekResponse = {
  choices?: DeepSeekChoice[];
};

function getDeepSeekConfig() {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) throw new Error("缺少 DeepSeek API Key，请在 .env.local 中设置 AI_API_KEY。");
  return {
    apiKey,
    baseUrl: process.env.AI_BASE_URL ?? "https://api.deepseek.com",
    model: process.env.AI_MODEL ?? "deepseek-v4-pro"
  };
}

function systemPrompt(): string {
  return [
    "你是一个传统文化解读助手，不是预言者。",
    "你只根据用户提供的代码计算结果做解释，不得改写八字命盘、卦象、动爻、卦辞或爻辞。",
    "不要输出确定性预测，不要提供医疗、法律、投资、心理治疗等专业建议。",
    "健康相关只允许谈情绪、作息、压力和生活节奏，不得提疾病、器官、诊断、用药或寿命。",
    "输出必须温和、条件式、启发式，不能制造恐惧。",
    "只输出 JSON，不要输出 Markdown，不要输出额外说明。",
    `JSON 字段必须是：title, summary, sections, actionSuggestions, disclaimer。disclaimer 必须原样包含：${STANDARD_DISCLAIMER}`
  ].join("\n");
}

function userPrompt(request: InterpretationRequest): string {
  const modeInstruction =
    request.mode === "bazi"
      ? {
          reportStyle: "先给结构化命盘解读，再给偏娱乐性质的五行生活灵感。",
          actionSuggestions:
            "actionSuggestions 不要写成严肃的行动指令。请写 3-4 条轻松的五行生活灵感，可包含适合的颜色、穿衣风格、饰品材质、运动方式、工作类型、城市方位或空间气质；必须避免确定性命运判断。"
        }
      : {
          reportStyle: "围绕卦象和问题方向给启发式解读。",
          actionSuggestions:
            "actionSuggestions 写成温和的现实观察和反思提醒，不要替用户做决定。若问题方向涉及财运或投资，只能谈风险意识、信息核对、情绪节奏和决策前的反思角度；不得给具体标的、买入卖出、仓位、收益承诺、借贷投资等建议。"
        };
  return JSON.stringify(
    {
      task: request.mode === "bazi" ? "生成八字命盘解读" : "生成易经卦象解读",
      computedResult: request.computedResult,
      userContext: request.userContext,
      safetyPolicy: request.safetyPolicy,
      modeInstruction,
      outputShape: {
        title: "string",
        summary: "string",
        sections: [{ heading: "string", body: "string" }],
        actionSuggestions: ["string"],
        disclaimer: STANDARD_DISCLAIMER
      }
    },
    null,
    2
  );
}

function parseReport(content: string): InterpretationReport {
  const parsed = JSON.parse(content) as Partial<InterpretationReport>;
  if (!parsed.title || !parsed.summary || !Array.isArray(parsed.sections) || !Array.isArray(parsed.actionSuggestions)) {
    throw new Error("DeepSeek 返回的 JSON 缺少必要字段。");
  }
  return {
    title: parsed.title,
    summary: parsed.summary,
    sections: parsed.sections.map((section) => ({
      heading: String(section.heading ?? "解读"),
      body: String(section.body ?? "")
    })),
    actionSuggestions: parsed.actionSuggestions.map(String),
    disclaimer: parsed.disclaimer || STANDARD_DISCLAIMER
  };
}

export async function callDeepSeek(request: InterpretationRequest): Promise<InterpretationReport> {
  const { apiKey, baseUrl, model } = getDeepSeekConfig();
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt() },
        { role: "user", content: userPrompt(request) }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1800,
      thinking: { type: "disabled" }
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`DeepSeek 调用失败：${response.status} ${detail.slice(0, 200)}`);
  }
  const data = (await response.json()) as DeepSeekResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("DeepSeek 响应为空。");
  return parseReport(content);
}
