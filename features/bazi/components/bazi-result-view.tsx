"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Disclaimer } from "@/components/disclaimer";
import { BRANCH_ELEMENT, ELEMENT_LABEL, STEM_ELEMENT } from "@/features/bazi/engine/constants";
import type { BaziChart, Pillar } from "@/features/bazi/engine/types";
import type { InterpretationReport } from "@/lib/ai/schemas";
import { saveArchiveItem } from "@/lib/archive/local-archive";

const elementLabels = { wood: "木", fire: "火", earth: "土", metal: "金", water: "水" } as const;
const elementTone = {
  wood: "border-emerald-200 bg-emerald-50 text-emerald-800",
  fire: "border-red-200 bg-red-50 text-red-800",
  earth: "border-amber-200 bg-amber-50 text-amber-800",
  metal: "border-zinc-200 bg-zinc-50 text-zinc-800",
  water: "border-sky-200 bg-sky-50 text-sky-800"
} as const;
const elementDot = {
  wood: "bg-emerald-500",
  fire: "bg-red-500",
  earth: "bg-amber-500",
  metal: "bg-zinc-500",
  water: "bg-sky-500"
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
  const [archiveMessage, setArchiveMessage] = useState("");

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

  function archiveReport() {
    if (!chart || !report) return;
    const result = saveArchiveItem({
      kind: "bazi",
      sourceId: profileId,
      title: `八字命盘 · 日主${chart.dayMaster}`,
      summary: report.summary,
      payload: { chart, report }
    });
    setArchiveMessage(result.updatedExisting ? "已更新到我的存档。" : "已存入我的存档。");
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
      <ReportHero chart={chart} />
      <section className="panel overflow-hidden p-3">
        <SectionHeader title="原始排盘" />
        <ElementLegend />
        <BaziChartTable pillars={pillars} />
      </section>
      <section className="panel space-y-4 p-4">
        <SectionHeader title="结构摘要" />
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
        <SectionHeader title="AI 深度解读" description="基于上方原始命盘和结构摘要生成解释，不参与排盘计算。" />
        <button className="button-primary w-full" onClick={generateReport} disabled={loading}>{loading ? "生成中..." : "一键生成 AI 解读"}</button>
        {report ? (
          <div className="rounded border border-[#eadfce] bg-white p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-[#3a3028]">这份解读可以长期保存到“我的”。</p>
              <button className="button-secondary min-h-10 shrink-0 px-3 text-sm" onClick={archiveReport}>一键存档</button>
            </div>
            {archiveMessage ? <p className="mt-2 text-xs font-bold text-[#1f5d57]">{archiveMessage}</p> : null}
          </div>
        ) : null}
      </section>
      {report ? <Report report={report} /> : null}
      <Disclaimer />
    </div>
  );
}

function ReportHero({ chart }: { chart: BaziChart }) {
  const dayElement = STEM_ELEMENT[chart.dayMaster];
  return (
    <section className="relative overflow-hidden rounded-lg border border-[#ddd2c0] bg-[#fffaf1] p-4 shadow-[0_18px_50px_rgba(75,48,27,0.08)]">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute right-[-3rem] top-[-3rem] h-36 w-36 rounded-full border border-[#dcc8a6]" />
        <div className="absolute right-5 top-5 h-20 w-20 rounded-full border border-[#eadfce]" />
        <div className="absolute bottom-3 left-4 h-px w-24 bg-[#d7c3a3]" />
      </div>
      <div className="relative flex items-center justify-between gap-4">
        <div>
          <h1 className="mt-2 text-3xl font-black leading-tight text-[#201b16]">八字命盘</h1>
          <p className="mt-2 text-sm leading-6 text-[#756a5d]">月令 {chart.monthOrder} · 空亡 {chart.voidBranches.join("、")}</p>
        </div>
        <div className={`flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full border ${elementTone[dayElement]} shadow-inner`}>
          <span className="text-[11px] font-bold">日主</span>
          <span className="mt-1 text-4xl font-black leading-none">{chart.dayMaster}</span>
          <span className="mt-1 text-[11px] font-bold">{ELEMENT_LABEL[dayElement]}</span>
        </div>
      </div>
    </section>
  );
}

function SectionHeader({ title, description, action }: { title: string; description?: string; action?: string }) {
  return (
    <div className="mb-3">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-black text-[#201b16]">{title}</h2>
          </div>
          {description ? <p className="mt-1 text-xs leading-5 text-[#756a5d]">{description}</p> : null}
        </div>
        {action ? <span className="shrink-0 rounded border border-[#ddd2c0] bg-white px-2 py-1 text-xs font-bold text-[#8f2f24]">{action}</span> : null}
      </div>
      <div className="mt-3 flex items-center">
        <div className="h-px flex-1 bg-[#eadfce]" />
        <div className="ml-2 h-1.5 w-1.5 rounded-full bg-[#8f2f24]" />
      </div>
    </div>
  );
}

function ElementLegend() {
  const elements = Object.keys(elementLabels) as (keyof typeof elementLabels)[];
  return (
    <div className="mb-3 grid grid-cols-5 gap-1.5">
      {elements.map((element) => (
        <div className="flex items-center justify-center gap-1 rounded border border-[#eadfce] bg-white px-1.5 py-1 text-[11px] font-bold text-[#5f5143]" key={element}>
          <span className={`h-2 w-2 rounded-full ${elementDot[element]}`} />
          {elementLabels[element]}
        </div>
      ))}
    </div>
  );
}

function BaziChartTable({ pillars }: { pillars: Record<keyof typeof pillarLabels, Pillar | undefined> }) {
  const pillarKeys = Object.keys(pillarLabels) as (keyof typeof pillarLabels)[];
  return (
    <div className="overflow-hidden rounded border border-[#ddd2c0] bg-white text-center">
      <div className="grid grid-cols-[48px_repeat(4,minmax(0,1fr))] border-b border-[#ddd2c0] bg-[#f3eadb] text-xs font-black text-[#5f5143]">
        <div className="p-2">柱</div>
        {pillarKeys.map((key) => <div className={`border-l border-[#ddd2c0] p-2 ${key === "day" ? "bg-[#f7ead6] text-[#8f2f24]" : ""}`} key={key}>{pillarLabels[key]}</div>)}
      </div>
      <TableRow label="十神">
        {pillarKeys.map((key) => <PlainCell isDay={key === "day"} key={key}>{pillars[key]?.tenGod ?? (key === "day" ? "日主" : "-")}</PlainCell>)}
      </TableRow>
      <TableRow label="天干">
        {pillarKeys.map((key) => <StemBranchCell kind="stem" pillar={pillars[key]} isDay={key === "day"} key={key} />)}
      </TableRow>
      <TableRow label="地支">
        {pillarKeys.map((key) => <StemBranchCell kind="branch" pillar={pillars[key]} isDay={key === "day"} key={key} />)}
      </TableRow>
      <TableRow label="藏干">
        {pillarKeys.map((key) => <HiddenStemCell pillar={pillars[key]} isDay={key === "day"} key={key} />)}
      </TableRow>
      <TableRow label="纳音">
        {pillarKeys.map((key) => <PlainCell isDay={key === "day"} key={key}>{pillars[key]?.nayin ?? "-"}</PlainCell>)}
      </TableRow>
      <TableRow label="五行" isLast>
        {pillarKeys.map((key) => <ElementCell pillar={pillars[key]} isDay={key === "day"} key={key} />)}
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

function PlainCell({ children, isDay = false }: { children: ReactNode; isDay?: boolean }) {
  return <div className={`flex min-h-11 items-center justify-center border-l border-[#eadfce] p-1 leading-5 text-[#3a3028] ${isDay ? "bg-[#fff8eb]" : ""}`}>{children}</div>;
}

function StemBranchCell({ kind, pillar, isDay = false }: { kind: "stem" | "branch"; pillar?: Pillar; isDay?: boolean }) {
  if (!pillar) return <PlainCell isDay={isDay}>-</PlainCell>;
  const value = kind === "stem" ? pillar.stem : pillar.branch;
  const element = kind === "stem" ? STEM_ELEMENT[pillar.stem] : BRANCH_ELEMENT[pillar.branch];
  return (
    <div className={`flex min-h-14 items-center justify-center border-l border-[#eadfce] p-1 ${isDay ? "bg-[#fff8eb]" : ""}`}>
      <div className={`w-full rounded border px-1 py-2 ${elementTone[element]}`}>
        <div className="text-2xl font-black leading-none">{value}</div>
        <div className="mt-1 text-[10px] font-bold">{ELEMENT_LABEL[element]}</div>
      </div>
    </div>
  );
}

function HiddenStemCell({ pillar, isDay = false }: { pillar?: Pillar; isDay?: boolean }) {
  if (!pillar) return <PlainCell isDay={isDay}>-</PlainCell>;
  return (
    <div className={`flex min-h-14 flex-wrap items-center justify-center gap-1 border-l border-[#eadfce] p-1 ${isDay ? "bg-[#fff8eb]" : ""}`}>
      {pillar.hiddenStems.map((stem) => {
        const element = STEM_ELEMENT[stem];
        return <span className={`rounded border px-1.5 py-1 text-[11px] font-bold ${elementTone[element]}`} key={stem}>{stem}</span>;
      })}
    </div>
  );
}

function ElementCell({ pillar, isDay = false }: { pillar?: Pillar; isDay?: boolean }) {
  if (!pillar) return <PlainCell isDay={isDay}>-</PlainCell>;
  return (
    <PlainCell isDay={isDay}>
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
  const featuredSections = report.sections.slice(0, 6);
  return (
    <section className="panel overflow-hidden p-0">
      <div className="border-b border-[#eadfce] bg-[#fbf5ea] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="mt-1 text-2xl font-black leading-tight text-[#201b16]">{report.title}</h2>
          </div>
        </div>
        <p className="mt-3 rounded border border-[#eadfce] bg-white/70 p-3 text-sm font-semibold leading-6 text-[#3a3028]">{report.summary}</p>
      </div>

      <div className="space-y-3 p-4">
        {featuredSections.map((section) => (
          <article className="rounded border border-[#eadfce] bg-white p-3" key={section.heading}>
            <div className="flex gap-2">
              <div className="mt-1 h-8 w-1 shrink-0 rounded-full bg-[#8f2f24]" />
              <div>
                <h3 className="font-black text-[#201b16]">{section.heading}</h3>
                <p className="mt-2 text-sm leading-7 text-[#3a3028]">{section.body}</p>
              </div>
            </div>
          </article>
        ))}

        {report.actionSuggestions.length ? (
          <div className="rounded border border-[#d7c3a3] bg-[#fff8eb] p-3">
            <h3 className="font-black text-[#201b16]">五行生活灵感</h3>
            <p className="mt-1 text-xs leading-5 text-[#756a5d]">偏娱乐参考，可看看颜色、方位、城市气质、工作类型、运动和饰品灵感。</p>
            <div className="mt-3 space-y-2">
              {report.actionSuggestions.slice(0, 4).map((suggestion, index) => (
                <div className="flex gap-2 text-sm leading-6 text-[#3a3028]" key={suggestion}>
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#8f2f24] text-[11px] font-black text-white">{index + 1}</span>
                  <p>{suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
