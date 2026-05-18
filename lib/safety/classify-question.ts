export type QuestionClassification =
  | { status: "allowed"; reason: string }
  | { status: "blocked_unethical" | "blocked_factual" | "blocked_high_risk" | "low_quality"; reason: string; message: string };

const unethical = ["报复", "诅咒", "伤害", "监控", "跟踪", "控制", "威胁", "逃避法律", "违法"];
const factual = ["等于几", "距离", "谁赢了", "今天星期", "天气", "百科", "定义"];
const medicalAndSelfHarm = ["诊断", "癌", "心脏", "肾", "用药", "停药", "自杀", "轻生"];
const investmentInstruction = ["买入", "卖出", "满仓", "清仓", "加仓", "梭哈", "贷款投资", "借钱投资", "配资", "杠杆"];

export function classifyQuestion(questionText?: string): QuestionClassification {
  const text = questionText?.trim() ?? "";
  if (!text) return { status: "allowed", reason: "未提供具体问题，按方向通用解读。" };
  if (text.length < 2 || /^(测试|啊+|随便|不知道)$/.test(text)) {
    return {
      status: "low_quality",
      reason: "问题内容过于随意。",
      message: "建议先静心想清楚真正想问的事情，再重新输入一个具体问题。"
    };
  }
  if (unethical.some((word) => text.includes(word))) {
    return {
      status: "blocked_unethical",
      reason: "问题涉及伤害、控制或违法意图。",
      message: "这类问题不适合占卦，建议换一个更积极、更尊重他人边界的思考方向。"
    };
  }
  if (medicalAndSelfHarm.some((word) => text.includes(word))) {
    return {
      status: "blocked_high_risk",
      reason: "问题涉及医疗、自伤或其他高风险场景。",
      message: "这个问题不适合用玄学方式回答。请优先寻求专业人士或现实支持。"
    };
  }
  if (investmentInstruction.some((word) => text.includes(word))) {
    return {
      status: "blocked_high_risk",
      reason: "问题涉及明确投资交易指令。",
      message: "这个问题涉及具体买卖、仓位或借贷投资决策，不适合用占卦直接回答。本次不会扣除解读次数，可以改成“我该从哪些角度评估这件事？”这类反思型问题。"
    };
  }
  if (factual.some((word) => text.includes(word))) {
    return {
      status: "blocked_factual",
      reason: "问题更适合查资料获得确定答案。",
      message: "这个问题可以通过查阅资料获得确切答案，不需要占卦。占卦更适合面对不确定性时的自我反思。"
    };
  }
  return { status: "allowed", reason: "问题通过基础安全过滤。" };
}
