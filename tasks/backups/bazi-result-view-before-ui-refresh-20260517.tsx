"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Disclaimer } from "@/components/disclaimer";
import { BRANCH_ELEMENT, ELEMENT_LABEL, STEM_ELEMENT } from "@/features/bazi/engine/constants";
import type { BaziChart, Pillar } from "@/features/bazi/engine/types";
import type { InterpretationReport } from "@/lib/ai/schemas";

const elementLabels = { wood: "木", fire: "火", earth: "土", metal: "金", water: "水" } as const;
const elementTone = {
  wood: "border-emerald-200 bg-emerald-50 text-emerald-800",
  fire: "border-red-200 bg-red-50 text-red-800",
  earth: "border-amber-200 bg-amber-50 text-amber-800",
  metal: "border-zinc-200 bg-zinc-50 text-zinc-800",
  water: "border-sky-200 bg-sky-50 text-sky-800"
} as const;
const pillarLabels = {
  year: "年柱",
  month: "月柱",
  day: "日柱",
  hour: "时柱"
} as const;

export function BaziResultView({ profileId }: { profileId: string }) {
  const [chart, setChart] = useState<BaziChart | null>(null);
  const [report, setReport] = useState<InterpretationReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cached = sessionStorage.getItem(`bazi:${profileId}`);
    if (cached) setChart(JSON.parse(cached).chart);
  }, [profileId]);

  async function generateReport() {
    setLoading(true);
    const response = await fetch("/api/bazi/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, focusArea: "general" })
    });
    const data = await response.json();
    setLoading(false);
    if (response.ok) setReport(data.report);
  }

  if (!chart) return <p className="panel p-4">未找到本地命盘缓存，请返回重新排盘。</p>;
  const pillars = {
    year: chart.pillars.year,
    month: chart.pillars.month,
    day: chart.pillars.day,
    hour: chart.pillars.hour
  } satisfies Record<keyof typeof pillarLabels, Pillar | undefined>;

  return (
    <div className="space-y-4">
      <section className="panel p-4">
        <h1 className="text-2xl font-black">八字命盘</h1>
        <p className="mt-1 text-sm text-[#756a5d]">日主：{chart.dayMaster} · 月令：{chart.monthOrder} · 空亡：{chart.voidBranches.join("、")}</p>
      </section>
      <section className="panel overflow-hidden p-3">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-black">原始排盘</h2>
            <p className="mt-1 text-xs leading-5 text-[#756a5d]">四柱原盘，可截图保存或分享。</p>
          </div>
          <span className="shrink-0 rounded border border-[#ddd2c0] bg-white px-2 py-1 text-xs font-bold text-[#8f2f24]">四柱八字</span>
        </div>
        <BaziChartTable pillars={pillars} />
      </section>
      <section className="panel space-y-4 p-4">
        <div>
          <h2 className="font-black">结构摘要</h2>
          <p className="mt-1 text-sm leading-6 text-[#756a5d]">下面是从原始命盘中提取出来的易读信息，适合快速理解整体结构。</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded border border-[#ddd2c0] bg-white p-2">
            <div className="text-xs text-[#756a5d]">日主</div>
            <div className="mt-1 text-xl font-black">{chart.dayMaster}</div>
          </div>
          <div className="rounded border border-[#ddd2c0] bg-white p-2">
            <div className="text-xs text-[#756a5d]">月令</div>
            <div className="mt-1 text-xl font-black">{chart.monthOrder}</div>
          </div>
          <div className="rounded border border-[#ddd2c0] bg-white p-2">
            <div className="text-xs text-[#756a5d]">空亡</div>
            <div className="mt-1 text-xl font-black">{chart.voidBranches.join("")}</div>
          </div>
        </div>
        <FiveElementSummary chart={chart} />
        <LuckCycleSummary chart={chart} />
      </section>
      <section className="panel space-y-3 p-4">
        <div>
          <h2 className="font-black">AI 深度分析</h2>
          <p className="mt-1 text-sm leading-6 text-[#756a5d]">AI 会基于上方原始命盘和结构摘要生成解释，不参与排盘计算。</p>
        </div>
        <button className="button-primary w-full" onClick={generateReport} disabled={loading}>{loading ? "生成中..." : "一键 AI 分析"}</button>
      </section>
      {report ? <Report report={report} /> : null}
      <Disclaimer />
    </div>
  );
}

function BaziChartTable({ pillars }: { pillars: Record<keyof typeof pillarLabels, Pillar | undefined> }) {
  const pillarKeys = Object.keys(pillarLabels) as (keyof typeof pillarLabels)[];
  return (
    <div className="overflow-hidden rounded border border-[#ddd2c0] bg-white text-center">
      <div className="grid grid-cols-[48px_repeat(4,minmax(0,1fr))] border-b border-[#ddd2c0] bg-[#f3eadb] text-xs font-black text-[#5f5143]">
        <div className="p-2">柱</div>
        {pillarKeys.map((key) => <div className="border-l border-[#ddd2c0] p-2" key={key}>{pillarLabels[key]}</div>)}
      </div>
      <TableRow label="十神">
        {pillarKeys.map((key) => <PlainCell key={key}>{pillars[key]?.tenGod ?? (key === "day" ? "日主" : "-")}</PlainCell>)}
      </TableRow>
      <TableRow label="天干">
        {pillarKeys.map((key) => <StemBranchCell kind="stem" pillar={pillars[key]} key={key} />)}
      </TableRow>
      <TableRow label="地支">
        {pillarKeys.map((key) => <StemBranchCell kind="branch" pillar={pillars[key]} key={key} />)}
      </TableRow>
      <TableRow label="藏干">
        {pillarKeys.map((key) => <HiddenStemCell pillar={pillars[key]} key={key} />)}
      </TableRow>
      <TableRow label="纳音">
        {pillarKeys.map((key) => <PlainCell key={key}>{pillars[key]?.nayin ?? "-"}</PlainCell>)}
      </TableRow>
      <TableRow label="五行" isLast>
        {pillarKeys.map((key) => <ElementCell pillar={pillars[key]} key={key} />)}
      </TableRow>
    </div>
  );
}

function TableRow({ label, children, isLast = false }: { label: string; children: ReactNode; isLast?: boolean }) {
  return (
    <div className={`grid grid-cols-[48px_repeat(4,minmax(0,1fr))] text-xs ${isLast ? "" : "border-b border-[#eadfce]"}`}>
      <div className="flex items-center justify-center bg-[#fbf5ea] p-2 font-bold text-[#756a5d]">{label}</div>
      {children}
    </div>
  );
}

function PlainCell({ children }: { children: ReactNode }) {
  return <div className="flex min-h-11 items-center justify-center border-l border-[#eadfce] p-1 leading-5 text-[#3a3028]">{children}</div>;
}

function StemBranchCell({ kind, pillar }: { kind: "stem" | "branch"; pillar?: Pillar }) {
  if (!pillar) return <PlainCell>-</PlainCell>;
  const value = kind === "stem" ? pillar.stem : pillar.branch;
  const element = kind === "stem" ? STEM_ELEMENT[pillar.stem] : BRANCH_ELEMENT[pillar.branch];
  return (
    <div className="flex min-h-14 items-center justify-center border-l border-[#eadfce] p-1">
      <div className={`w-full rounded border px-1 py-2 ${elementTone[element]}`}>
        <div className="text-2xl font-black leading-none">{value}</div>
        <div className="mt-1 text-[10px] font-bold">{ELEMENT_LABEL[element]}</div>
      </div>
    </div>
  );
}

function HiddenStemCell({ pillar }: { pillar?: Pillar }) {
  if (!pillar) return <PlainCell>-</PlainCell>;
  return (
    <div className="flex min-h-14 flex-wrap items-center justify-center gap-1 border-l border-[#eadfce] p-1">
      {pillar.hiddenStems.map((stem) => {
        const element = STEM_ELEMENT[stem];
        return <span className={`rounded border px-1.5 py-1 text-[11px] font-bold ${elementTone[element]}`} key={stem}>{stem}</span>;
      })}
    </div>
  );
}

function ElementCell({ pillar }: { pillar?: Pillar }) {
  if (!pillar) return <PlainCell>-</PlainCell>;
  return (
    <PlainCell>
      {ELEMENT_LABEL[STEM_ELEMENT[pillar.stem]]}/{ELEMENT_LABEL[BRANCH_ELEMENT[pillar.branch]]}
    </PlainCell>
  );
}

function FiveElementSummary({ chart }: { chart: BaziChart }) {
  return (
    <div>
      <h3 className="font-black">五行分布</h3>
      <div className="mt-3 space-y-2">
        {Object.entries(chart.fiveElements).map(([element, count]) => (
          <div key={element}>
            <div className="flex justify-between text-sm"><span>{elementLabels[element as keyof typeof elementLabels]}</span><span>{count}</span></div>
            <div className="mt-1 h-2 rounded bg-[#eadfce]"><div className="h-2 rounded bg-[#1f5d57]" style={{ width: `${Math.min(Number(count) * 14, 100)}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LuckCycleSummary({ chart }: { chart: BaziChart }) {
  return (
    <div>
      <h3 className="font-black">大运</h3>
      <div className="mt-3 grid gap-2">
        {chart.luckCycles.length ? chart.luckCycles.map((cycle) => (
          <div className="flex justify-between rounded border border-[#ddd2c0] bg-white p-2 text-sm" key={cycle.index}>
            <span>{cycle.startAge}岁 · {cycle.startYear}</span><strong>{cycle.pillar}</strong>
          </div>
        )) : <p className="text-sm text-[#756a5d]">性别或时辰不完整，大运暂不展示。</p>}
      </div>
    </div>
  );
}

function Report({ report }: { report: InterpretationReport }) {
  return (
    <section className="panel space-y-3 p-4">
      <h2 className="text-xl font-black">{report.title}</h2>
      <p className="text-sm leading-6 text-[#756a5d]">{report.summary}</p>
      {report.sections.map((section) => (
        <div key={section.heading}>
          <h3 className="font-bold">{section.heading}</h3>
          <p className="mt-1 text-sm leading-6 text-[#3a3028]">{section.body}</p>
        </div>
      ))}
    </section>
  );
}
