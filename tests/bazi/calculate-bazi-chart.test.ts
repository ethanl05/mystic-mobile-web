import { describe, expect, it } from "vitest";
import { calculateBaziChart, getTenGod } from "@/features/bazi/engine/calculate-bazi-chart";

const baseInput = {
  birthDate: "1998-06-15",
  birthTime: "14:35",
  birthTimePrecision: "exact" as const,
  birthPlaceCode: "110101",
  gender: "female" as const,
  timeCorrectionMode: "beijing_time" as const
};

describe("calculateBaziChart", () => {
  it("returns a complete chart for a standard birth input", () => {
    const chart = calculateBaziChart(baseInput);
    expect(chart.pillars.year.stem).toBeTruthy();
    expect(chart.pillars.month.branch).toBeTruthy();
    expect(chart.pillars.day.tenGod).toBe("日主");
    expect(chart.pillars.hour).toBeTruthy();
    expect(chart.luckCycles).toHaveLength(8);
  });

  it("omits hour and luck cycles when hour is unknown", () => {
    const chart = calculateBaziChart({ ...baseInput, birthTimePrecision: "unknown_hour" });
    expect(chart.pillars.hour).toBeUndefined();
    expect(chart.luckCycles).toHaveLength(0);
  });

  it("uses the selected hour when only hour precision is available", () => {
    const chart = calculateBaziChart({ ...baseInput, birthTime: "14:00", birthTimePrecision: "unknown_minute" });
    expect(chart.pillars.hour?.branch).toBe("未");
  });

  it("requires birthplace for true solar time", () => {
    expect(() => calculateBaziChart({ ...baseInput, birthPlaceCode: "", timeCorrectionMode: "true_solar_time" })).toThrow();
  });

  it("calculates ten gods deterministically", () => {
    expect(getTenGod("甲", "甲")).toBe("比肩");
    expect(getTenGod("甲", "乙")).toBe("劫财");
    expect(getTenGod("甲", "丙")).toBe("食神");
  });

  it("supports twenty deterministic sample dates", () => {
    const years = Array.from({ length: 20 }, (_, index) => 1984 + index);
    for (const year of years) {
      const chart = calculateBaziChart({ ...baseInput, birthDate: `${year}-06-15` });
      expect(chart.pillars.year.stem).toBeTruthy();
      expect(Object.values(chart.fiveElements).reduce((sum, count) => sum + count, 0)).toBeGreaterThan(0);
    }
  });
});
