import areaData from "china-area-data";

export type RegionOption = {
  code: string;
  name: string;
};

const collator = new Intl.Collator("zh-Hans-u-co-pinyin", {
  numeric: true,
  sensitivity: "base"
});

function sortByPinyin(options: RegionOption[]) {
  return [...options].sort((a, b) => {
    const nameOrder = collator.compare(a.name, b.name);
    return nameOrder === 0 ? a.code.localeCompare(b.code) : nameOrder;
  });
}

function toOptions(map?: Record<string, string>) {
  if (!map) return [];
  return sortByPinyin(Object.entries(map).map(([code, name]) => ({ code, name })));
}

function hasNestedChildren(code: string) {
  return Boolean(areaData[code]);
}

export function getProvinceOptions() {
  return toOptions(areaData["86"]);
}

export function getCityOptions(provinceCode: string) {
  const provinceChildren = areaData[provinceCode];
  if (!provinceChildren) return [];

  const childCodes = Object.keys(provinceChildren);
  const hasCityLevel = childCodes.some(hasNestedChildren);
  if (!hasCityLevel) {
    return [{ code: provinceCode, name: areaData["86"]?.[provinceCode] ?? "本级行政区" }];
  }

  return toOptions(provinceChildren).map((city) => {
    const provinceName = areaData["86"]?.[provinceCode] ?? "";
    const isOnlyMunicipalDistrict = childCodes.length === 1 && city.name === "市辖区";
    return isOnlyMunicipalDistrict ? { ...city, name: provinceName } : city;
  });
}

export function getDistrictOptions(provinceCode: string, cityCode: string) {
  if (!provinceCode || !cityCode) return [];
  if (cityCode === provinceCode) return toOptions(areaData[provinceCode]);
  return toOptions(areaData[cityCode]);
}

export function getFirstRegionCode(options: RegionOption[]) {
  return options[0]?.code ?? "";
}

export function getRegionLabel(provinceCode: string, cityCode: string, districtCode: string) {
  const provinceName = areaData["86"]?.[provinceCode];
  const cityName = areaData[provinceCode]?.[cityCode];
  const districtName = areaData[cityCode]?.[districtCode] ?? areaData[provinceCode]?.[districtCode];
  return [provinceName, cityName, districtName].filter(Boolean).join(" ");
}
