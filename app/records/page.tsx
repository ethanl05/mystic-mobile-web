"use client";

import { useEffect, useState } from "react";
import type { BaziChart } from "@/features/bazi/engine/types";
import type { YijingResult } from "@/features/yijing/engine/types";

type BaziRecord = {
  id: string;
  chart: BaziChart;
  fateSummary?: string;
  createdAt: string;
  report?: unknown;
};

type YijingRecord = {
  id: string;
  numbers: [number, number, number];
  result: YijingResult;
  createdAt: string;
  report?: unknown;
};

type RecordsResponse = {
  bazi: BaziRecord[];
  yijing: YijingRecord[];
};

export default function RecordsPage() {
  const [records, setRecords] = useState<RecordsResponse | null>(null);
  const [activeKind, setActiveKind] = useState<"bazi" | "yijing" | null>(null);

  useEffect(() => {
    fetch("/api/records").then((response) => response.json()).then(setRecords);
    const kind = new URL(window.location.href).searchParams.get("kind");
    if (kind === "bazi" || kind === "yijing") setActiveKind(kind);

    function handlePopState() {
      const nextKind = new URL(window.location.href).searchParams.get("kind");
      setActiveKind(nextKind === "bazi" || nextKind === "yijing" ? nextKind : null);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function openKind(kind: "bazi" | "yijing") {
    setActiveKind(kind);
    window.history.pushState({}, "", `/records?kind=${kind}`);
  }

  function closeKind() {
    setActiveKind(null);
    window.history.pushState({}, "", "/records");
  }

  const baziCount = records?.bazi.length ?? 0;
  const yijingCount = records?.yijing.length ?? 0;
  const activeTitle = activeKind === "bazi" ? "八字记录" : "易经记录";
  const activeCount = activeKind === "bazi" ? baziCount : yijingCount;

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-xl border border-[#ddd2c0] bg-gradient-to-br from-[#fffdfa] to-[#faf4e8] p-4 shadow-[0_12px_36px_rgba(75,48,27,0.05)]">
        <div className="pointer-events-none absolute right-[-2.5rem] top-[-2.5rem] h-28 w-28 rounded-full border border-[#dcc8a6] opacity-70" />
        <div className="pointer-events-none absolute bottom-4 right-5 grid gap-1 opacity-20">
          <span className="h-1 w-12 rounded bg-[#201b16]" />
          <span className="h-1 w-12 rounded bg-[#201b16]" />
          <span className="h-1 w-12 rounded bg-[#201b16]" />
        </div>
        <div className="relative">
          <p className="text-xs font-black text-[#8f2f24] tracking-wide">最近记录</p>
          <h1 className="mt-2 text-3xl font-black leading-tight text-[#201b16]">记录</h1>
        </div>
      </section>

      {!activeKind ? (
        <section className="grid gap-3">
          <RecordCategoryCard label="八字记录" value={baziCount} action="进入八字记录" tone="red" onClick={() => openKind("bazi")} />
          <RecordCategoryCard label="易经记录" value={yijingCount} action="进入易经记录" tone="green" onClick={() => openKind("yijing")} />
        </section>
      ) : (
        <section className="panel space-y-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <button className="text-sm font-black text-[#8f2f24]" onClick={closeKind}>‹ 返回</button>
            <span className="rounded-lg border border-[#eadfce] bg-[#fffdf8] px-2 py-1 text-xs font-bold text-[#756a5d] shadow-sm">{activeCount} 条</span>
          </div>
          <h2 className="text-xl font-black text-[#201b16]">{activeTitle}</h2>
          {activeKind === "bazi" ? (
            baziCount ? <div className="space-y-3">{records?.bazi.map((record) => <BaziRecordCard record={record} key={record.id} />)}</div> : <EmptyRecord text="还没有命盘记录。完成一次八字排盘后会显示在这里。" />
          ) : (
            yijingCount ? <div className="space-y-3">{records?.yijing.map((record) => <YijingRecordCard record={record} key={record.id} />)}</div> : <EmptyRecord text="还没有卦例记录。完成一次数字起卦后会显示在这里。" />
          )}
        </section>
      )}
    </div>
  );
}

function RecordCategoryCard({ label, value, action, tone, onClick }: { label: string; value: number; action: string; tone: "red" | "green"; onClick: () => void }) {
  const color = tone === "red" ? "text-[#8f2f24]" : "text-[#1f5d57]";
  const softBg = tone === "red" ? "bg-[#fff8eb]" : "bg-[#edf7f4]";
  const ring = tone === "red" ? "border-[#d7c3a3]" : "border-[#bfd8cf]";
  const actionTone = tone === "red"
    ? "border-[#8f2f24] bg-[#8f2f24] text-white shadow-[0_10px_24px_rgba(143,47,36,0.22)]"
    : "border-[#1f5d57] bg-[#1f5d57] text-white shadow-[0_10px_24px_rgba(31,93,87,0.2)]";
  const mark = tone === "red" ? "四柱" : "六爻";
  return (
    <button className="panel relative min-h-[132px] w-full overflow-hidden p-5 text-left transition active:scale-[0.99]" onClick={onClick}>
      <div className="pointer-events-none absolute right-[-1.75rem] top-[-1.75rem] h-24 w-24 rounded-full border border-[#eadfce]" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 pt-1">
          <span className={`text-xs font-black ${color}`}>{mark}</span>
          <h2 className="mt-1 text-2xl font-black leading-tight text-[#201b16]">{label}</h2>
        </div>
        <div className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded border ${ring} ${softBg}`}>
          <span className={`text-2xl font-black leading-none ${color}`}>{value}</span>
          <span className="mt-1 text-xs font-black text-[#756a5d]">条</span>
        </div>
      </div>
      <div className={`relative mt-5 flex min-h-12 items-center justify-between rounded border px-4 text-base font-black ${actionTone}`}>
        <span className="truncate">{action}</span>
        <span className="text-2xl leading-none">›</span>
      </div>
    </button>
  );
}

function EmptyRecord({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed border-[#ddd2c0] bg-[#fffdf8]/60 p-3 text-sm leading-6 text-[#756a5d]">{text}</p>;
}

function BaziRecordCard({ record }: { record: BaziRecord }) {
  const chart = record.chart;
  return (
    <article className="rounded-lg border border-[#eadfce] bg-[#fffdf8] p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-[#756a5d]">{formatRecordDate(record.createdAt)}</p>
          <h3 className="mt-1 font-black text-[#201b16]">日主 {chart.dayMaster} · 月令 {chart.monthOrder}</h3>
          <p className="mt-1 text-xs font-bold text-[#756a5d]">年柱{chart.pillars.year.stem}{chart.pillars.year.branch} · 日柱{chart.pillars.day.stem}{chart.pillars.day.branch}</p>
        </div>
        <span className="rounded bg-[#fff8eb] px-2 py-1 text-xs font-bold text-[#8f2f24]">{record.report ? "已解读" : "未解读"}</span>
      </div>
      <a className="button-secondary mt-3 flex min-h-10 w-full items-center justify-center text-sm" href={`/bazi/result/${record.id}`}>查看完整记录</a>
    </article>
  );
}

function YijingRecordCard({ record }: { record: YijingRecord }) {
  const result = record.result;
  return (
    <article className="rounded-lg border border-[#eadfce] bg-[#fffdf8] p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-[#756a5d]">{formatRecordDate(record.createdAt)} · {record.numbers.join(" / ")}</p>
          <h3 className="mt-1 font-black text-[#201b16]">{result.primarySymbol} {result.primaryHexagram}</h3>
          <p className="mt-1 text-xs font-bold text-[#756a5d]">动爻{result.movingLine} · 变卦 {result.changedHexagram}</p>
        </div>
        <span className="rounded bg-[#edf7f4] px-2 py-1 text-xs font-bold text-[#1f5d57]">{record.report ? "已解读" : `动爻${result.movingLine}`}</span>
      </div>
      <a className="button-secondary mt-3 flex min-h-10 w-full items-center justify-center text-sm" href={`/yijing/result/${record.id}`}>查看完整记录</a>
    </article>
  );
}

function formatRecordDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
