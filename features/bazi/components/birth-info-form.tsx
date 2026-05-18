"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getCityOptions,
  getDistrictOptions,
  getFirstRegionCode,
  getProvinceOptions
} from "@/lib/regions/china-regions";

const provinceOptions = getProvinceOptions();
const defaultProvinceCode = "110000";
const defaultCityCode = getFirstRegionCode(getCityOptions(defaultProvinceCode));
const defaultDistrictCode = getFirstRegionCode(getDistrictOptions(defaultProvinceCode, defaultCityCode));
const hourOptions = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, "0"));

export function BirthInfoForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [birthTimePrecision, setBirthTimePrecision] = useState("exact");
  const [provinceCode, setProvinceCode] = useState(defaultProvinceCode);
  const [cityCode, setCityCode] = useState(defaultCityCode);
  const [districtCode, setDistrictCode] = useState(defaultDistrictCode);

  const cityOptions = provinceCode ? getCityOptions(provinceCode) : [];
  const districtOptions = provinceCode && cityCode ? getDistrictOptions(provinceCode, cityCode) : [];
  const birthPlaceCode = districtCode || cityCode || provinceCode;

  function changeProvince(nextProvinceCode: string) {
    setProvinceCode(nextProvinceCode);
    if (!nextProvinceCode) {
      setCityCode("");
      setDistrictCode("");
      return;
    }

    const nextCityCode = getFirstRegionCode(getCityOptions(nextProvinceCode));
    setCityCode(nextCityCode);
    setDistrictCode(getFirstRegionCode(getDistrictOptions(nextProvinceCode, nextCityCode)));
  }

  function changeCity(nextCityCode: string) {
    setCityCode(nextCityCode);
    setDistrictCode(getFirstRegionCode(getDistrictOptions(provinceCode, nextCityCode)));
  }

  async function submit(formData: FormData) {
    setLoading(true);
    setError("");
    const selectedPrecision = String(formData.get("birthTimePrecision"));
    const selectedHour = String(formData.get("birthHour") || "00").padStart(2, "0");
    const payload = {
      birthDate: String(formData.get("birthDate")),
      birthTime: selectedPrecision === "unknown_hour" ? "" : selectedPrecision === "unknown_minute" ? `${selectedHour}:00` : String(formData.get("birthTime")),
      birthTimePrecision: selectedPrecision,
      birthPlaceCode: String(formData.get("birthPlaceCode") || ""),
      gender: String(formData.get("gender")),
      timeCorrectionMode: String(formData.get("timeCorrectionMode"))
    };
    const response = await fetch("/api/bazi/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "排盘失败");
      return;
    }
    sessionStorage.setItem(`bazi:${data.profileId}`, JSON.stringify({ input: payload, chart: data.chart }));
    router.push(`/bazi/result/${data.profileId}`);
  }

  return (
    <form action={submit} className="panel space-y-4 p-4">
      <div>
        <label className="label">出生日期</label>
        <input className="field" name="birthDate" type="date" defaultValue="1998-06-15" required />
      </div>
      <div>
        <label className="label">时间精度</label>
        <select className="field" name="birthTimePrecision" value={birthTimePrecision} onChange={(event) => setBirthTimePrecision(event.target.value)}>
          <option value="exact">准确到分钟</option>
          <option value="unknown_minute">只记得小时</option>
          <option value="unknown_hour">不确定具体小时</option>
        </select>
      </div>
      <div>
        <label className="label">出生时间</label>
        {birthTimePrecision === "exact" ? (
          <input className="field" name="birthTime" type="time" defaultValue="14:35" required />
        ) : null}
        {birthTimePrecision === "unknown_minute" ? (
          <select className="field" name="birthHour" defaultValue="14" required>
            {hourOptions.map((hour) => (
              <option key={hour} value={hour}>
                {Number(hour)}点
              </option>
            ))}
          </select>
        ) : null}
        {birthTimePrecision === "unknown_hour" ? (
          <div className="rounded border border-dashed border-[#d8cbb8] bg-white/60 p-3 text-sm leading-6 text-[#756a5d]">
            已选择“不确定具体小时”，本次排盘将不计算时柱。
          </div>
        ) : null}
      </div>
      <div>
        <label className="label">出生地点</label>
        <input type="hidden" name="birthPlaceCode" value={birthPlaceCode} />
        <div className="grid grid-cols-3 gap-2">
          <select
            aria-label="出生省份"
            className="field px-2 text-sm"
            value={provinceCode}
            onChange={(event) => changeProvince(event.target.value)}
          >
            <option value="">不提供</option>
            {provinceOptions.map((province) => (
              <option key={province.code} value={province.code}>
                {province.name}
              </option>
            ))}
          </select>
          <select
            aria-label="出生城市"
            className="field px-2 text-sm"
            disabled={!provinceCode}
            value={cityCode}
            onChange={(event) => changeCity(event.target.value)}
          >
            {cityOptions.map((city) => (
              <option key={city.code} value={city.code}>
                {city.name}
              </option>
            ))}
          </select>
          <select
            aria-label="出生区县"
            className="field px-2 text-sm"
            disabled={!provinceCode || !cityCode || districtOptions.length === 0}
            value={districtCode}
            onChange={(event) => setDistrictCode(event.target.value)}
          >
            {districtOptions.map((district) => (
              <option key={district.code} value={district.code}>
                {district.name}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-2 text-xs leading-5 text-[#756a5d]">省、市、区县均按拼音字母顺序排列；不提供地点时默认按北京时间排盘。</p>
      </div>
      <div>
        <label className="label">性别</label>
        <select className="field" name="gender" defaultValue="female">
          <option value="female">女</option>
          <option value="male">男</option>
          <option value="undisclosed">不透露</option>
        </select>
      </div>
      <div>
        <label className="label">排盘时间规则</label>
        <select className="field" name="timeCorrectionMode" defaultValue="beijing_time">
          <option value="beijing_time">按北京时间排盘</option>
          <option value="true_solar_time">按出生地校正时间 · VIP</option>
        </select>
        <p className="mt-2 text-xs leading-5 text-[#756a5d]">出生时间接近时辰交界时更适合使用出生地校正；多数情况对结果影响不大。</p>
      </div>
      {error ? <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <button className="button-primary w-full" disabled={loading}>
        {loading ? "排盘中..." : "生成命盘"}
      </button>
    </form>
  );
}
