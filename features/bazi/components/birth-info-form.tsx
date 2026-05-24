"use client";

import { useEffect, useRef, useState } from "react";
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
const defaultBirthDate = "1998-06-15";
const birthYearStart = 1900;
const birthYearEnd = 2100;
const birthYearOptions = Array.from({ length: birthYearEnd - birthYearStart + 1 }, (_, index) => birthYearEnd - index);
const monthOptions = Array.from({ length: 12 }, (_, index) => index + 1);

type DatePickerStep = "year" | "month" | "day";

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

function parseBirthDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function buildBirthDate(year: number, month: number, day: number) {
  return `${year}-${padDatePart(month)}-${padDatePart(day)}`;
}

function formatBirthDate(value: string) {
  const { year, month, day } = parseBirthDate(value);
  return `${year}年${padDatePart(month)}月${padDatePart(day)}日`;
}

export function BirthInfoForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [birthDate, setBirthDate] = useState(defaultBirthDate);
  const [datePickerStep, setDatePickerStep] = useState<DatePickerStep | null>(null);
  const [birthTimePrecision, setBirthTimePrecision] = useState("exact");
  const [provinceCode, setProvinceCode] = useState(defaultProvinceCode);
  const [cityCode, setCityCode] = useState(defaultCityCode);
  const [districtCode, setDistrictCode] = useState(defaultDistrictCode);

  const cityOptions = provinceCode ? getCityOptions(provinceCode) : [];
  const districtOptions = provinceCode && cityCode ? getDistrictOptions(provinceCode, cityCode) : [];
  const birthPlaceCode = districtCode || cityCode || provinceCode;

  useEffect(() => {
    if (!loading) {
      setProgress(0);
      return;
    }

    setProgress(1);
    const timer = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 96) return current;
        return Math.min(96, current + Math.max(1, Math.ceil((96 - current) / 16)));
      });
    }, 220);

    return () => window.clearInterval(timer);
  }, [loading]);

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

  function selectBirthYear(year: number) {
    const current = parseBirthDate(birthDate);
    const day = Math.min(current.day, daysInMonth(year, current.month));
    setBirthDate(buildBirthDate(year, current.month, day));
    setDatePickerStep("month");
  }

  function selectBirthMonth(month: number) {
    const current = parseBirthDate(birthDate);
    const day = Math.min(current.day, daysInMonth(current.year, month));
    setBirthDate(buildBirthDate(current.year, month, day));
    setDatePickerStep("day");
  }

  function selectBirthDay(day: number) {
    const current = parseBirthDate(birthDate);
    const safeDay = Math.min(day, daysInMonth(current.year, current.month));
    setBirthDate(buildBirthDate(current.year, current.month, safeDay));
    setDatePickerStep(null);
  }

  async function submit(formData: FormData) {
    setLoading(true);
    setProgress(1);
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
    setProgress(100);
    sessionStorage.setItem(`bazi:${data.profileId}`, JSON.stringify({ input: payload, chart: data.chart, fateSummary: data.fateSummary }));
    router.push(`/bazi/result/${data.profileId}`);
  }

  return (
    <form action={submit} className="panel space-y-4 p-4">
      <div>
        <label className="label">出生日期</label>
        <input name="birthDate" type="hidden" value={birthDate} readOnly />
        <button
          aria-expanded={Boolean(datePickerStep)}
          className="field flex items-center justify-between gap-3 text-left"
          onClick={() => setDatePickerStep((current) => current ?? "year")}
          type="button"
        >
          <span className="font-black text-[#201b16]">{formatBirthDate(birthDate)}</span>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-[#eadfce] bg-[#fffaf1] text-[#8f2f24]" aria-hidden="true">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path d="M7 4v3M17 4v3M5 9h14M6 6h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </span>
        </button>
        {datePickerStep ? (
          <BirthDatePicker
            birthDate={birthDate}
            step={datePickerStep}
            onChangeStep={setDatePickerStep}
            onSelectYear={selectBirthYear}
            onSelectMonth={selectBirthMonth}
            onSelectDay={selectBirthDay}
          />
        ) : null}
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
          <div className="rounded border border-dashed border-[#d8cbb8] bg-[#fffdf8]/60 p-3 text-sm leading-6 text-[#756a5d]">
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
      {loading ? <BaziLoadingProgress progress={progress} /> : null}
      <button className="button-primary w-full" disabled={loading}>
        {loading ? "排盘中..." : "生成命盘"}
      </button>
    </form>
  );
}

function BirthDatePicker({
  birthDate,
  step,
  onChangeStep,
  onSelectYear,
  onSelectMonth,
  onSelectDay
}: {
  birthDate: string;
  step: DatePickerStep;
  onChangeStep: (step: DatePickerStep) => void;
  onSelectYear: (year: number) => void;
  onSelectMonth: (month: number) => void;
  onSelectDay: (day: number) => void;
}) {
  const selected = parseBirthDate(birthDate);
  const dayOptions = Array.from({ length: daysInMonth(selected.year, selected.month) }, (_, index) => index + 1);
  const selectedYearRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (step !== "year") return;
    selectedYearRef.current?.scrollIntoView({ block: "center" });
  }, [step]);

  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-[#d7c3a3] bg-[#fffaf1] shadow-[0_14px_34px_rgba(75,48,27,0.10)]">
      <div className="flex items-center justify-between border-b border-[#eadfce] px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          {step !== "year" ? (
            <button
              className="shrink-0 rounded border border-[#eadfce] bg-[#fffdf8] px-2 py-1 text-xs font-black text-[#8f2f24]"
              onClick={() => onChangeStep(step === "month" ? "year" : "month")}
              type="button"
            >
              ‹ {step === "month" ? "年份" : "月份"}
            </button>
          ) : null}
          <p className="text-sm font-black text-[#201b16]">{step === "year" ? "选择年份" : step === "month" ? "选择月份" : "选择日期"}</p>
        </div>
        <p className="text-xs font-bold text-[#8f2f24]">{formatBirthDate(birthDate)}</p>
      </div>

      {step === "year" ? (
        <div className="max-h-64 space-y-2 overflow-y-auto p-3">
          {birthYearOptions.map((year) => (
            <button
              className={`flex min-h-12 w-full items-center justify-between rounded border px-4 text-base font-black ${year === selected.year ? "border-[#8f2f24] bg-[#8f2f24] text-[#fffaf1]" : "border-[#eadfce] bg-[#fffdf8] text-[#3a3028]"}`}
              key={year}
              onClick={() => onSelectYear(year)}
              ref={year === selected.year ? selectedYearRef : null}
              type="button"
            >
              <span>{year}年</span>
              <span className={`h-2.5 w-2.5 rounded-full ${year === selected.year ? "bg-[#fffaf1]" : "bg-[#eadfce]"}`} aria-hidden="true" />
            </button>
          ))}
        </div>
      ) : null}

      {step === "month" ? (
        <div className="grid grid-cols-4 gap-2 p-3">
          {monthOptions.map((month) => (
            <button
              className={`min-h-11 rounded border text-sm font-black ${month === selected.month ? "border-[#8f2f24] bg-[#8f2f24] text-[#fffaf1]" : "border-[#eadfce] bg-[#fffdf8] text-[#3a3028]"}`}
              key={month}
              onClick={() => onSelectMonth(month)}
              type="button"
            >
              {month}月
            </button>
          ))}
        </div>
      ) : null}

      {step === "day" ? (
        <div className="grid grid-cols-7 gap-1.5 p-3">
          {dayOptions.map((day) => (
            <button
              className={`min-h-9 rounded border text-sm font-black ${day === selected.day ? "border-[#8f2f24] bg-[#8f2f24] text-[#fffaf1]" : "border-[#eadfce] bg-[#fffdf8] text-[#3a3028]"}`}
              key={day}
              onClick={() => onSelectDay(day)}
              type="button"
            >
              {day}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function BaziLoadingProgress({ progress }: { progress: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="rounded-lg border border-[#d7b7a0] bg-[#fff8eb] p-3">
      <div className="flex items-center gap-3">
        <div className="relative h-12 w-12 shrink-0">
          <svg className="h-12 w-12 -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
            <circle cx="24" cy="24" r={radius} fill="none" stroke="#eadfce" strokeWidth="5" />
            <circle
              cx="24"
              cy="24"
              r={radius}
              fill="none"
              stroke="#8f2f24"
              strokeLinecap="round"
              strokeWidth="5"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-[stroke-dashoffset] duration-200 ease-out"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-[#8f2f24]">{progress}%</span>
        </div>
        <div className="min-w-0">
          <p className="font-black text-[#201b16]">正在生成命盘</p>
          <p className="mt-1 text-xs font-bold leading-5 text-[#756a5d]">排盘已完成，正在生成命局提要，请稍候。</p>
        </div>
      </div>
    </div>
  );
}
