import { describe, expect, it } from "vitest";
import { calculateHexagram } from "@/features/yijing/engine/calculate-hexagram";
import { HEXAGRAMS } from "@/features/yijing/engine/hexagrams";

describe("calculateHexagram", () => {
  it("uses the planned numeric rules", () => {
    const result = calculateHexagram({ numbers: [123, 456, 789] });
    expect(result.upperTrigram).toBe("离");
    expect(result.lowerTrigram).toBe("坤");
    expect(result.movingLine).toBe(3);
    expect(result.primaryHexagram).toBe("火地晋");
    expect(result.changedHexagram).toBe("火山旅");
  });

  it("normalizes zero to 8 for trigrams and 6 for moving line", () => {
    const result = calculateHexagram({ numbers: [0, 0, 0] });
    expect(result.upperTrigram).toBe("坤");
    expect(result.lowerTrigram).toBe("坤");
    expect(result.movingLine).toBe(6);
  });

  it("covers all 64 upper/lower mappings", () => {
    expect(Object.keys(HEXAGRAMS)).toHaveLength(64);
    for (let upper = 1; upper <= 8; upper += 1) {
      for (let lower = 1; lower <= 8; lower += 1) {
        expect(() => calculateHexagram({ numbers: [upper, lower, 1] })).not.toThrow();
      }
    }
  });

  it("rejects unsafe numbers", () => {
    expect(() => calculateHexagram({ numbers: [Number.MAX_SAFE_INTEGER + 1, 1, 1] })).toThrow();
  });
});
