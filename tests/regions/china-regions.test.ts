import { describe, expect, it } from "vitest";
import { getCityOptions, getDistrictOptions, getProvinceOptions } from "@/lib/regions/china-regions";

describe("china region options", () => {
  it("provides all province-level regions and sorts by pinyin", () => {
    const provinces = getProvinceOptions();
    expect(provinces.length).toBeGreaterThanOrEqual(34);

    const beijingIndex = provinces.findIndex((province) => province.name === "北京市");
    const chongqingIndex = provinces.findIndex((province) => province.name === "重庆市");
    const guangdongIndex = provinces.findIndex((province) => province.name === "广东省");

    expect(beijingIndex).toBeGreaterThanOrEqual(0);
    expect(chongqingIndex).toBeGreaterThan(beijingIndex);
    expect(guangdongIndex).toBeGreaterThan(chongqingIndex);
  });

  it("normalizes direct-admin cities into a useful city column label", () => {
    const beijingCities = getCityOptions("110000");
    expect(beijingCities).toEqual([{ code: "110100", name: "北京市" }]);

    const districts = getDistrictOptions("110000", "110100");
    expect(districts.some((district) => district.name === "东城区")).toBe(true);
  });

  it("supports regions whose province-level children are districts", () => {
    const hongKongCities = getCityOptions("810000");
    expect(hongKongCities).toEqual([{ code: "810000", name: "香港特别行政区" }]);

    const districts = getDistrictOptions("810000", "810000");
    expect(districts.some((district) => district.name === "中西區")).toBe(true);
  });
});
