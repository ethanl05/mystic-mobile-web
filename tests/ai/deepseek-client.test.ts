import { afterEach, describe, expect, it, vi } from "vitest";
import { callDeepSeek } from "@/lib/ai/deepseek-client";
import { STANDARD_DISCLAIMER } from "@/lib/safety/disclaimers";

const originalEnv = { ...process.env };

describe("callDeepSeek", () => {
  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("calls DeepSeek V4 chat completions with JSON output", async () => {
    process.env.AI_PROVIDER = "deepseek";
    process.env.AI_API_KEY = "test-key";
    process.env.AI_MODEL = "deepseek-v4-pro";
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  title: "真实模型解读",
                  summary: "结构化摘要",
                  sections: [{ heading: "提示", body: "保持条件式表达。" }],
                  actionSuggestions: ["先观察现实反馈。"],
                  disclaimer: STANDARD_DISCLAIMER
                })
              }
            }
          ]
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const report = await callDeepSeek({
      mode: "yijing",
      computedResult: { primaryHexagram: "火地晋" },
      userContext: { focusArea: "career", questionText: "是否适合推进计划？" },
      safetyPolicy: {
        noDeterministicPrediction: true,
        noMedicalLegalFinancialDirective: true,
        tone: "traditional_culture_reflective"
      }
    });

    expect(report.title).toBe("真实模型解读");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.deepseek.com/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-key",
          "Content-Type": "application/json"
        }),
        body: expect.any(String)
      })
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.model).toBe("deepseek-v4-pro");
    expect(body.response_format).toEqual({ type: "json_object" });
    expect(body.messages[0].content).toContain("只输出 JSON");
  });

  it("fails clearly when the API key is missing", async () => {
    process.env.AI_PROVIDER = "deepseek";
    process.env.AI_API_KEY = "";

    await expect(
      callDeepSeek({
        mode: "bazi",
        computedResult: {},
        userContext: { focusArea: "general" },
        safetyPolicy: {
          noDeterministicPrediction: true,
          noMedicalLegalFinancialDirective: true,
          tone: "traditional_culture_reflective"
        }
      })
    ).rejects.toThrow("缺少 DeepSeek API Key");
  });
});
