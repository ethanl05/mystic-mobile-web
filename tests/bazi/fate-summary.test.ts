import { afterEach, describe, expect, it, vi } from "vitest";
import { generateBaziFateSummary } from "@/lib/ai/bazi-fate-summary";
import { calculateBaziChart } from "@/features/bazi/engine/calculate-bazi-chart";

const chart = calculateBaziChart({
  birthDate: "1998-06-15",
  birthTime: "14:35",
  birthTimePrecision: "exact",
  birthPlaceCode: "110101",
  gender: "female",
  timeCorrectionMode: "beijing_time"
});

describe("generateBaziFateSummary", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  const fallbackPattern = /生于午月阳火当令，又逢未时土火相交，辛日立命/;

  it("returns a local fallback summary when AI is not enabled", async () => {
    vi.stubEnv("AI_PROVIDER", "");

    await expect(generateBaziFateSummary(chart)).resolves.toMatch(fallbackPattern);
  });

  it("falls back when the AI response is not valid JSON", async () => {
    vi.stubEnv("AI_PROVIDER", "deepseek");
    vi.stubEnv("AI_API_KEY", "test-key");
    vi.stubEnv("AI_BASE_URL", "https://example.test");
    vi.stubEnv("AI_MODEL", "test-model");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ choices: [{ message: { content: "not json" } }] })
      }))
    );

    await expect(generateBaziFateSummary(chart)).resolves.toMatch(fallbackPattern);
  });

  it("falls back when the AI response is empty", async () => {
    vi.stubEnv("AI_PROVIDER", "deepseek");
    vi.stubEnv("AI_API_KEY", "test-key");
    vi.stubEnv("AI_BASE_URL", "https://example.test");
    vi.stubEnv("AI_MODEL", "test-model");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ choices: [{ message: { content: JSON.stringify({ summary: "" }) } }] })
      }))
    );

    await expect(generateBaziFateSummary(chart)).resolves.toMatch(fallbackPattern);
  });

  it("falls back when the AI response is too long", async () => {
    vi.stubEnv("AI_PROVIDER", "deepseek");
    vi.stubEnv("AI_API_KEY", "test-key");
    vi.stubEnv("AI_BASE_URL", "https://example.test");
    vi.stubEnv("AI_MODEL", "test-model");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  summary:
                    "此命局格局极其绵长，山川云水皆入其怀，春秋冬夏各有玄机，行至何处皆能转圜成章，云开月明之间又见山河入怀，且句子明显超过了页面需要的一句话长度。"
                })
              }
            }
          ]
        })
      }))
    );

    await expect(generateBaziFateSummary(chart)).resolves.toMatch(fallbackPattern);
  });
});
