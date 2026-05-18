import { STANDARD_DISCLAIMER } from "./disclaimers";

const blockedTerms = ["必然", "一定会", "百分百", "注定", "停止治疗", "全部投入", "满仓", "跟踪对方", "监控对方"];

export type OutputReview = {
  passed: boolean;
  reasons: string[];
};

export function reviewOutput(text: string): OutputReview {
  const reasons: string[] = [];
  for (const term of blockedTerms) {
    if (text.includes(term)) reasons.push(`包含高风险表达：${term}`);
  }
  if (!text.includes(STANDARD_DISCLAIMER)) reasons.push("缺少标准免责声明。");
  return { passed: reasons.length === 0, reasons };
}
