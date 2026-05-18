"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { BaziChart } from "@/features/bazi/engine/types";
import type { YijingResult } from "@/features/yijing/engine/types";

type BaziRecord = {
  id: string;
  chart: BaziChart;
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

  useEffect(() => {
    fetch("/api/records").then((response) => response.json()).then(setRecords);
  }, []);

  const recentItems = useMemo(() => {
    if (!records) return [];
    return [
      ...records.bazi.map((record) => ({ kind: "bazi" as const, createdAt: record.createdAt, record })),
      ...records.yijing.map((record) => ({ kind: "yijing" as const, createdAt: record.createdAt, record }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6);
  }, [records]);

  const baziCount = records?.bazi.length ?? 0;
  const yijingCount = records?.yijing.length ?? 0;

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-lg border border-[#ddd2c0] bg-[#fffaf1] p-4 shadow-[0_18px_50px_rgba(75,48,27,0.08)]">
        <div className="pointer-events-none absolute right-[-2.5rem] top-[-2.5rem] h-28 w-28 rounded-full border border-[#dcc8a6]" />
        <div className="pointer-events-none absolute bottom-4 right-5 grid gap-1 opacity-30">
          <span className="h-1 w-12 rounded bg-[#201b16]" />
          <span className="h-1 w-12 rounded bg-[#201b16]" />
          <span className="h-1 w-12 rounded bg-[#201b16]" />
        </div>
        <div className="relative">
          <p className="text-xs font-black text-[#8f2f24]">最近记录</p>
          <h1 className="mt-2 text-3xl font-black leading-tight">记录</h1>
          <p className="mt-2 text-sm leading-6 text-[#756a5d]">这里保留本次使用中生成过的命盘与卦例，重要内容可在报告页存入“我的存档”。</p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <RecordStat label="八字记录" value={baziCount} detail="命盘" tone="red" />
        <RecordStat label="易经记录" value={yijingCount} detail="卦例" tone="green" />
      </section>

      <RecordGroup
        title="八字记录"
        emptyText="还没有命盘记录。完成一次八字排盘后会显示在这里。"
        count={baziCount}
      >
        {records?.bazi.slice(0, 4).map((record) => <BaziRecordCard record={record} key={record.id} />)}
      </RecordGroup>

      <RecordGroup
        title="易经记录"
        emptyText="还没有卦例记录。完成一次数字起卦后会显示在这里。"
        count={yijingCount}
      >
        {records?.yijing.slice(0, 4).map((record) => <YijingRecordCard record={record} key={record.id} />)}
      </RecordGroup>

      <section className="panel space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-black">最近生成</h2>
          <span className="text-xs font-bold text-[#756a5d]">{recentItems.length} 条</span>
        </div>
        {recentItems.length ? (
          <div className="space-y-2">
            {recentItems.map((item) => (
              <div className="flex items-center justify-between rounded border border-[#eadfce] bg-white px-3 py-2 text-sm" key={`${item.kind}-${item.record.id}`}>
                <span className="font-bold text-[#3a3028]">{item.kind === "bazi" ? "八字命盘" : "易经数字卦"}</span>
                <span className="text-xs text-[#756a5d]">{formatRecordDate(item.createdAt)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded border border-dashed border-[#ddd2c0] bg-white/60 p-3 text-sm leading-6 text-[#756a5d]">暂无最近生成内容。</p>
        )}
      </section>
    </div>
  );
}

function RecordStat({ label, value, detail, tone }: { label: string; value: number; detail: string; tone: "red" | "green" }) {
  const color = tone === "red" ? "text-[#8f2f24]" : "text-[#1f5d57]";
  return (
    <div className="panel p-3">
      <p className="text-xs font-bold text-[#756a5d]">{label}</p>
      <p className={`mt-2 text-3xl font-black leading-none ${color}`}>{value}</p>
      <p className="mt-2 text-xs text-[#756a5d]">{detail}</p>
    </div>
  );
}

function RecordGroup({ title, count, emptyText, children }: { title: string; count: number; emptyText: string; children: ReactNode }) {
  return (
    <section className="panel space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-black">{title}</h2>
        <span className="rounded border border-[#eadfce] bg-white px-2 py-1 text-xs font-bold text-[#756a5d]">{count} 条</span>
      </div>
      {count ? <div className="space-y-3">{children}</div> : <p className="rounded border border-dashed border-[#ddd2c0] bg-white/60 p-3 text-sm leading-6 text-[#756a5d]">{emptyText}</p>}
    </section>
  );
}

function BaziRecordCard({ record }: { record: BaziRecord }) {
  const chart = record.chart;
  return (
    <article className="rounded border border-[#eadfce] bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-[#756a5d]">{formatRecordDate(record.createdAt)}</p>
          <h3 className="mt-1 font-black">日主 {chart.dayMaster} · 月令 {chart.monthOrder}</h3>
        </div>
        <span className="rounded bg-[#fff8eb] px-2 py-1 text-xs font-bold text-[#8f2f24]">{record.report ? "已解读" : "未解读"}</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
        <MiniInfo label="年柱" value={`${chart.pillars.year.stem}${chart.pillars.year.branch}`} />
        <MiniInfo label="日柱" value={`${chart.pillars.day.stem}${chart.pillars.day.branch}`} />
        <MiniInfo label="空亡" value={chart.voidBranches.join("")} />
      </div>
    </article>
  );
}

function YijingRecordCard({ record }: { record: YijingRecord }) {
  const result = record.result;
  return (
    <article className="rounded border border-[#eadfce] bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-[#756a5d]">{formatRecordDate(record.createdAt)} · {record.numbers.join(" / ")}</p>
          <h3 className="mt-1 font-black">{result.primarySymbol} {result.primaryHexagram}</h3>
        </div>
        <span className="rounded bg-[#edf7f4] px-2 py-1 text-xs font-bold text-[#1f5d57]">{record.report ? "已解读" : `动爻${result.movingLine}`}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-center text-sm">
        <MiniInfo label="变卦" value={result.changedHexagram} />
        <MiniInfo label="互卦" value={result.mutualHexagram} />
      </div>
    </article>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-[#eadfce] bg-[#fffaf1] p-2">
      <p className="text-xs text-[#756a5d]">{label}</p>
      <p className="mt-1 font-black text-[#201b16]">{value}</p>
    </div>
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
