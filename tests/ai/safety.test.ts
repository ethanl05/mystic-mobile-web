import { describe, expect, it } from "vitest";
import { classifyQuestion } from "@/lib/safety/classify-question";
import { STANDARD_DISCLAIMER } from "@/lib/safety/disclaimers";
import { reviewOutput } from "@/lib/safety/review-output";

describe("safety", () => {
  it("blocks unethical questions", () => {
    expect(classifyQuestion("怎么监控对方行踪").status).toBe("blocked_unethical");
  });

  it("blocks factual questions", () => {
    expect(classifyQuestion("1+1 等于几").status).toBe("blocked_factual");
  });

  it("blocks high-risk medical or financial questions", () => {
    expect(classifyQuestion("我是不是心脏有问题").status).toBe("blocked_high_risk");
    expect(classifyQuestion("能不能满仓买入").status).toBe("blocked_high_risk");
  });

  it("allows broad wealth reflection without trading instructions", () => {
    expect(classifyQuestion("最近财运方面需要注意什么").status).toBe("allowed");
    expect(classifyQuestion("我该从哪些角度评估这个投资机会").status).toBe("allowed");
  });

  it("requires disclaimer and rejects deterministic wording", () => {
    expect(reviewOutput(`你一定会成功。\n${STANDARD_DISCLAIMER}`).passed).toBe(false);
    expect(reviewOutput(`这是一个温和的参考。\n${STANDARD_DISCLAIMER}`).passed).toBe(true);
  });
});
