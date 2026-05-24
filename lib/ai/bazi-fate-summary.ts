import { ELEMENT_LABEL } from "@/features/bazi/engine/constants";
import type { BaziChart, Branch, ElementName } from "@/features/bazi/engine/types";

type DeepSeekSummaryResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const monthScene: Record<Branch, string> = {
  子: "子月严冬水旺",
  丑: "丑月寒土敛金",
  寅: "寅月初春木动",
  卯: "卯月仲春木盛",
  辰: "辰月湿土藏机",
  巳: "巳月初夏火起",
  午: "午月阳火当令",
  未: "未月长夏土厚",
  申: "申月初秋金起",
  酉: "酉月仲秋金明",
  戌: "戌月燥土敛火",
  亥: "亥月孟冬水深"
};

const hourScene: Record<Branch, string> = {
  子: "子时水气归藏",
  丑: "丑时湿土含金",
  寅: "寅时木气初升",
  卯: "卯时日出木明",
  辰: "辰时土气承露",
  巳: "巳时火气渐旺",
  午: "午时阳火正盛",
  未: "未时土火相交",
  申: "申时金气初成",
  酉: "酉时金气清肃",
  戌: "戌时燥土收束",
  亥: "亥时水气归根"
};

function elementPattern(chart: BaziChart): string {
  const entries = Object.entries(chart.fiveElements) as Array<[ElementName, number]>;
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  const missing = entries.filter(([, count]) => count === 0).map(([element]) => ELEMENT_LABEL[element]);
  const strongest = sorted[0];
  const second = sorted[1];
  if (missing.length === 0) return "五行俱全，自有成局之美";
  if (strongest && second && strongest[1] >= second[1] + 2) return `${ELEMENT_LABEL[strongest[0]]}势最显，格中自带锋芒`;
  const visible = sorted.filter(([, count]) => count > 0).slice(0, 2).map(([element]) => ELEMENT_LABEL[element]).join("、");
  return `${visible}气成势，格局有可观之处`;
}

function localFateSummary(chart: BaziChart): string {
  const hourBranch = chart.pillars.hour?.branch;
  const hour = hourBranch ? `，又逢${hourScene[hourBranch]}` : "";
  return `生于${monthScene[chart.monthOrder]}${hour}，${chart.dayMaster}日立命，${elementPattern(chart)}。`;
}

function parseSummary(content: string): string | undefined {
  try {
    const parsed = JSON.parse(content) as { summary?: unknown };
    if (typeof parsed.summary !== "string") return undefined;
    const summary = parsed.summary.trim().replace(/^["“”]+|["“”]+$/g, "");
    if (!summary || Array.from(summary).length > 64) return undefined;
    return /[。！？]$/.test(summary) ? summary : `${summary}。`;
  } catch {
    return undefined;
  }
}

function buildPrompt(chart: BaziChart): string {
  return JSON.stringify(
    {
      task: "用一句话概括这个八字命格",
      requirements: [
        "只输出 JSON：{\"summary\":\"...\"}",
        "summary 必须是一句话，尽量 28 到 54 个汉字，最多 64 个汉字",
        "基本结构：先点出出生时令、日主、时柱或五行格局等具体特征，再给一句有气势的命格判语",
        "要让普通用户看得懂，能觉得这句话确实贴合自己的盘；不要只写空泛诗句",
        "文风可略装、略玄妙、有高级感，但必须保留明确命盘信息",
        "可以写五行俱全、某元素偏旺、格局清奇、财气可观、锋芒待磨等娱乐化表达",
        "不得写确定性命运、必富必贵、命中大财、寿命、疾病、法律、投资或恐吓性判断"
      ],
      examples: [
        "生于午月火旺，又逢未时土厚，辛金立命，格中土金有根，清贵中自带锋芒。",
        "五行俱全，日主得令，格局自成圆融之象，宜守其正而渐见光华。",
        "木火成势，日主承时而起，命局不落平常，宜以定力收其锋芒。"
      ],
      chart: {
        dayMaster: chart.dayMaster,
        monthOrder: chart.monthOrder,
        pillars: chart.pillars,
        fiveElements: chart.fiveElements,
        voidBranches: chart.voidBranches,
        lifeGuideFactors: chart.lifeGuideFactors
      },
      outputShape: { summary: "string" }
    },
    null,
    2
  );
}

export async function generateBaziFateSummary(chart: BaziChart): Promise<string> {
  const fallback = localFateSummary(chart);
  if (process.env.AI_PROVIDER !== "deepseek") return fallback;

  try {
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) return fallback;
    const baseUrl = process.env.AI_BASE_URL ?? "https://api.deepseek.com";
    const model = process.env.AI_MODEL ?? "deepseek-v4-pro";
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "你是传统文化短句助手，只根据排盘结构写一句审美化概括；不得预言、恐吓或提供专业建议；只输出 JSON。"
          },
          { role: "user", content: buildPrompt(chart) }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
        max_tokens: 120,
        thinking: { type: "disabled" }
      })
    });

    if (!response.ok) return fallback;
    const data = (await response.json()) as DeepSeekSummaryResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content) return fallback;
    return parseSummary(content) ?? fallback;
  } catch {
    return fallback;
  }
}
