import { describe, expect, it } from "vitest";
import { calculateHexagram } from "@/features/yijing/engine/calculate-hexagram";
import { HEXAGRAMS } from "@/features/yijing/engine/hexagrams";
import { getLineAuspice, LINE_AUSPICES } from "@/features/yijing/engine/line-auspices";

describe("line auspices", () => {
  it("defines an auspice entry for every hexagram line", () => {
    expect(Object.keys(LINE_AUSPICES).sort()).toEqual(Object.keys(HEXAGRAMS).sort());

    for (const key of Object.keys(HEXAGRAMS)) {
      expect(LINE_AUSPICES[key]).toHaveLength(6);
      for (const entry of LINE_AUSPICES[key]) {
        expect(["吉", "凶", "无咎"]).toContain(entry.main);
        expect(entry.classicalLabel.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("attaches the matching line auspice to calculated results", () => {
    const result = calculateHexagram({ numbers: [1, 1, 3] });

    expect(result.primaryHexagram).toBe("乾为天");
    expect(result.lineAuspice.main).toBe("无咎");
    expect(result.lineAuspice.classicalLabel).toContain("厉");
    expect(result.lineAuspice.classicalLabel).toContain("无咎");
  });

  it("keeps classical labels for representative auspices", () => {
    expect(getLineAuspice("乾-乾", 6)).toMatchObject({
      main: "凶",
      classicalLabel: expect.stringContaining("有悔")
    });
    expect(getLineAuspice("兑-兑", 1)).toMatchObject({
      main: "吉",
      classicalLabel: expect.stringContaining("吉")
    });
  });

  it("does not treat no-fault phrases as single-character blame", () => {
    expect(getLineAuspice("巽-乾", 1)).toMatchObject({
      main: "吉",
      classicalLabel: expect.stringContaining("何其咎")
    });
  });

  it("uses the final decisive clause for mixed auspices", () => {
    expect(getLineAuspice("巽-乾", 6)).toMatchObject({
      main: "凶",
      classicalLabel: expect.stringContaining("征凶")
    });
    expect(getLineAuspice("巽-巽", 5)).toMatchObject({
      main: "吉",
      classicalLabel: expect.stringContaining("吉")
    });
  });
});
