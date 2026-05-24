"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Disclaimer } from "@/components/disclaimer";
import { BRANCH_ELEMENT, ELEMENT_LABEL, STEM_ELEMENT } from "@/features/bazi/engine/constants";
import type { BaziChart, Branch, ElementName, Pillar, BaziInput } from "@/features/bazi/engine/types";
import { SharePosterButton } from "@/features/share/share-poster-button";
import type { InterpretationReport } from "@/lib/ai/schemas";
import { saveArchiveItem } from "@/lib/archive/local-archive";

const elementLabels = { wood: "木", fire: "火", earth: "土", metal: "金", water: "水" } as const;
const elementTextColor = {
  wood: "text-[#2e7d32]",
  fire: "text-[#c62828]",
  earth: "text-[#795548]",
  metal: "text-[#b88a3b]",
  water: "text-[#1565c0]"
} as const;
const elementBar = {
  wood: "bg-[#2e7d32]",
  fire: "bg-[#c62828]",
  earth: "bg-[#795548]",
  metal: "bg-[#b88a3b]",
  water: "bg-[#1565c0]"
} as const;
const dayMasterSealTone = {
  wood: "border-[#641b16] bg-[#8f2f24] text-[#fffaf1] shadow-[0_14px_32px_rgba(100,27,22,0.24)]",
  fire: "border-[#641b16] bg-[#8f2f24] text-[#fffaf1] shadow-[0_14px_32px_rgba(100,27,22,0.24)]",
  earth: "border-[#641b16] bg-[#8f2f24] text-[#fffaf1] shadow-[0_14px_32px_rgba(100,27,22,0.24)]",
  metal: "border-[#641b16] bg-[#8f2f24] text-[#fffaf1] shadow-[0_14px_32px_rgba(100,27,22,0.24)]",
  water: "border-[#641b16] bg-[#8f2f24] text-[#fffaf1] shadow-[0_14px_32px_rgba(100,27,22,0.24)]"
} as const;
const elementDot = {
  wood: "border-[#dff1e2] bg-[#2e7d32] shadow-[0_0_0_2px_rgba(46,125,50,0.16)]",
  fire: "border-[#ffe0d7] bg-[#c62828] shadow-[0_0_0_2px_rgba(198,40,40,0.16)]",
  earth: "border-[#f1dcc3] bg-[#795548] shadow-[0_0_0_2px_rgba(121,85,72,0.16)]",
  metal: "border-[#fff2a8] bg-[#b88a3b] shadow-[0_0_0_2px_rgba(184,138,59,0.18)]",
  water: "border-[#dceeff] bg-[#1565c0] shadow-[0_0_0_2px_rgba(21,101,192,0.16)]"
} as const;
const elementBarPercentage = {
  wood: "bg-[#2e7d32]",
  fire: "bg-[#c62828]",
  earth: "bg-[#795548]",
  metal: "bg-[#b88a3b]",
  water: "bg-[#1565c0]"
} as const;
const pillarLabels = {
  year: "年柱",
  month: "月柱",
  day: "日柱",
  hour: "时柱"
} as const;
const monthScene: Record<Branch, string> = {
  子: "子月严冬水旺",
  丑: "丑月寒土敛金",
  寅: "寅月初春木动",
  卯: "卯月仲春木盛",
  辰: "辰月湿土藏机",
  巳: "巳月初夏火起",
  午: "午月阳火当令",
  未: "未月长夏土厚",
  申: "申月初秋金起",
  酉: "酉月仲秋金明",
  戌: "戌月燥土敛火",
  亥: "亥月孟冬水深"
};
const hourScene: Record<Branch, string> = {
  子: "子时水气归藏",
  丑: "丑时湿土含金",
  寅: "寅时木气初升",
  卯: "卯时日出木明",
  辰: "辰时土气承露",
  巳: "巳时火气渐旺",
  午: "午时阳火正盛",
  未: "未时土火相交",
  申: "申时金气初成",
  酉: "酉时金气清肃",
  戌: "戌时燥土收束",
  亥: "亥时水气归根"
};

type BaziProfilePayload = {
  profile?: {
    chart: BaziChart;
    fateSummary?: string;
    report?: InterpretationReport;
    input?: BaziInput;
  };
};

export function BaziResultView({ profileId }: { profileId: string }) {
  const [chart, setChart] = useState<BaziChart | null>(null);
  const [input, setInput] = useState<BaziInput | null>(null);
  const [fateSummary, setFateSummary] = useState("");
  const [report, setReport] = useState<InterpretationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [recordLoaded, setRecordLoaded] = useState(false);
  const [archiveMessage, setArchiveMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    const cached = sessionStorage.getItem(`bazi:${profileId}`);
    if (cached) {
      const parsed = JSON.parse(cached) as { chart: BaziChart; fateSummary?: string; report?: InterpretationReport; input?: BaziInput };
      setChart(parsed.chart);
      setFateSummary(normalizeFateSummary(parsed.chart, parsed.fateSummary));
      setReport(parsed.report ?? null);
      if (parsed.input) setInput(parsed.input);
      setRecordLoaded(true);
    }

    fetch(`/api/bazi/calculate?profileId=${encodeURIComponent(profileId)}`)
      .then((response) => response.ok ? response.json() : null)
      .then((data: BaziProfilePayload | null) => {
        if (cancelled || !data?.profile) return;
        const nextSummary = normalizeFateSummary(data.profile.chart, data.profile.fateSummary);
        setChart(data.profile.chart);
        setFateSummary(nextSummary);
        setReport(data.profile.report ?? null);
        if (data.profile.input) setInput(data.profile.input);
        sessionStorage.setItem(`bazi:${profileId}`, JSON.stringify({
          chart: data.profile.chart,
          fateSummary: nextSummary,
          report: data.profile.report,
          input: data.profile.input
        }));
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setRecordLoaded(true);
      });
    return () => {
      cancelled = true;
    };
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
    if (response.ok) {
      setReport(data.report);
      if (chart) {
        sessionStorage.setItem(`bazi:${profileId}`, JSON.stringify({ chart, fateSummary, report: data.report, input }));
      }
    }
  }

  function archiveReport() {
    if (!chart) return;
    const result = saveArchiveItem({
      kind: "bazi",
      sourceId: profileId,
      title: `八字命盘 · 日主${chart.dayMaster}`,
      summary: report?.summary ?? fateSummary,
      payload: { chart, fateSummary, report: report ?? undefined, input: input ?? undefined }
    });
    setArchiveMessage(result.updatedExisting ? "已更新到我的存档。" : "已存入我的存档。");
  }

  if (!chart) return <p className="panel p-4">{recordLoaded ? "未找到这条命盘记录，请返回重新排盘。" : "正在读取命盘记录..."}</p>;

  return (
    <div className="space-y-4 pb-24">
      <BaziSnapshotView chart={chart} fateSummary={fateSummary} input={input} />
      <section className="panel space-y-3 p-4">
        <SectionHeader title="AI 深度解读" description="基于上方原始命盘和结构摘要生成解释，不参与排盘计算。" />
        <button className="button-primary w-full" onClick={generateReport} disabled={loading}>{loading ? "生成中..." : "一键生成 AI 解读"}</button>
      </section>
      {report ? <Report report={report} /> : null}
      <ArchiveSavePanel report={report} archiveMessage={archiveMessage} onArchive={archiveReport} />
      <Disclaimer />
      <SharePosterButton data={{ kind: "bazi", chart, fateSummary, reportSummary: report?.summary }} />
    </div>
  );
}

function ArchiveSavePanel({ report, archiveMessage, onArchive }: { report: InterpretationReport | null; archiveMessage?: string; onArchive: () => void }) {
  return (
    <section className="rounded-lg border border-[#d7b7a0] bg-[#fff8eb] p-3 shadow-[0_12px_32px_rgba(75,48,27,0.06)]">
      <button className="button-primary w-full text-base" onClick={onArchive}>一键存档</button>
      <p className="mt-2 text-center text-xs font-bold leading-5 text-[#756a5d]">{report ? "将命盘、结构摘要 and AI 解读一起保存。" : "先保存完整命盘，之后生成 AI 解读可再次更新存档。"}</p>
      {archiveMessage ? <p className="mt-2 rounded border border-[#eadfce] bg-[#fffdf8] p-2 text-center text-xs font-bold text-[#1f5d57] shadow-sm">{archiveMessage}</p> : null}
    </section>
  );
}

export function BaziSnapshotView({ chart, fateSummary, report, showHero = true, input }: { chart: BaziChart; fateSummary?: string; report?: InterpretationReport; showHero?: boolean; input?: BaziInput | null }) {
  const normalizedSummary = normalizeFateSummary(chart, fateSummary);
  const pillars = {
    year: chart.pillars.year,
    month: chart.pillars.month,
    day: chart.pillars.day,
    hour: chart.pillars.hour
  } satisfies Record<keyof typeof pillarLabels, Pillar | undefined>;

  return (
    <div className="space-y-4">
      {showHero ? <ReportHero chart={chart} input={input} /> : null}
      <section className="panel overflow-hidden p-4">
        <SectionHeader title="命局提要" />
        <FateSummary summary={normalizedSummary} />
        <h3 className="mb-3 mt-4 text-sm font-black text-[#201b16]">原始排盘</h3>
        <ElementLegend />
        <BaziChartTable pillars={pillars} />
      </section>
      <section className="panel space-y-4 p-4">
        <SectionHeader title="结构摘要" />
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg border border-[#ddd2c0] bg-[#fffdf8] p-2 shadow-sm">
            <div className="text-xs text-[#756a5d]">日主</div>
            <div className="mt-1 text-xl font-black text-[#8f2f24]">{chart.dayMaster}</div>
          </div>
          <div className="rounded-lg border border-[#ddd2c0] bg-[#fffdf8] p-2 shadow-sm">
            <div className="text-xs text-[#756a5d]">月令</div>
            <div className="mt-1 text-xl font-black text-[#201b16]">{chart.monthOrder}</div>
          </div>
          <div className="rounded-lg border border-[#ddd2c0] bg-[#fffdf8] p-2 shadow-sm">
            <div className="text-xs text-[#756a5d]">空亡</div>
            <div className="mt-1 text-xl font-black text-[#201b16]">{chart.voidBranches.join("")}</div>
          </div>
        </div>
        <FiveElementSummary chart={chart} />
        <LuckCycleSummary chart={chart} />
      </section>
      {report ? <Report report={report} /> : null}
    </div>
  );
}

function normalizeFateSummary(chart: BaziChart, summary?: string): string {
  const value = summary?.trim() ?? "";
  if (value && /生于|月|时|日主|五行|格局|立命/.test(value)) return value;
  return readableFateSummary(chart);
}

function readableFateSummary(chart: BaziChart): string {
  const hourBranch = chart.pillars.hour?.branch;
  const hour = hourBranch ? `，又逢${hourScene[hourBranch]}` : "";
  return `生于${monthScene[chart.monthOrder]}${hour}，${chart.dayMaster}日立命，${elementPattern(chart)}。`;
}

function elementPattern(chart: BaziChart): string {
  const entries = Object.entries(chart.fiveElements) as Array<[ElementName, number]>;
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  const missing = entries.filter(([, count]) => count === 0);
  const strongest = sorted[0];
  const second = sorted[1];
  if (missing.length === 0) return "五行俱全，自有成局之美";
  if (strongest && second && strongest[1] >= second[1] + 2) return `${ELEMENT_LABEL[strongest[0]]}势最显，格中自带锋芒`;
  const visible = sorted.filter(([, count]) => count > 0).slice(0, 2).map(([element]) => ELEMENT_LABEL[element]).join("、");
  return `${visible}气成势，格局有可观之处`;
}

function FateSummary({ summary }: { summary: string }) {
  return (
    <div className="mb-4 rounded-lg border border-[#d7b7a0] bg-[#fffbf2] px-3 py-4 text-center shadow-inner relative overflow-hidden">
      <div className="absolute right-2 bottom-1 text-[2.5rem] font-bold text-[#8f2f24]/3 select-none pointer-events-none">命</div>
      <p className="text-xl font-black leading-8 text-[#201b16] relative z-10">{summary}</p>
    </div>
  );
}

function ReportHero({ chart, input }: { chart: BaziChart; input?: BaziInput | null }) {
  const dayElement = STEM_ELEMENT[chart.dayMaster];
  const genderLabel = input?.gender === "male" ? "乾造" : input?.gender === "female" ? "坤造" : "本造";
  const genderColor = input?.gender === "male" ? "border-[#2c5f95]/30 bg-[#edf6ff] text-[#2c5f95]" : input?.gender === "female" ? "border-[#8f2f24]/30 bg-[#fff2e5] text-[#8f2f24]" : "border-[#756a5d]/30 bg-[#fbf8f3] text-[#756a5d]";

  let formattedBirth = "";
  if (input?.birthDate) {
    const [y, m, d] = input.birthDate.split("-");
    formattedBirth = `${y}年${Number(m)}月${Number(d)}日`;
    if (input.birthTime) {
      formattedBirth += ` ${input.birthTime}`;
    }
    if (chart.pillars.hour) {
      formattedBirth += ` (${chart.pillars.hour.branch}时)`;
    }
  }

  return (
    <section className="relative overflow-hidden rounded-xl border border-[#ddd2c0] bg-gradient-to-br from-[#fffdfa] to-[#faf4e8] p-4 shadow-[0_12px_36px_rgba(75,48,27,0.06)]">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute right-[-3rem] top-[-3rem] h-36 w-36 rounded-full border border-[#dcc8a6]" />
        <div className="absolute right-5 top-5 h-20 w-20 rounded-full border border-[#eadfce]" />
        <div className="absolute bottom-3 left-4 h-px w-24 bg-[#d7c3a3]" />
      </div>
      <div className="relative flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`inline-block rounded border px-2 py-0.5 text-xs font-black tracking-wide ${genderColor}`}>
              {genderLabel}
            </span>
            <span className="text-xs font-bold text-[#756a5d]">八字算命</span>
          </div>
          <h1 className="mt-2 text-3xl font-black leading-tight text-[#201b16]">八字命盘</h1>
          {formattedBirth ? (
            <p className="mt-2 text-xs font-bold leading-5 text-[#756a5d]">
              生辰：{formattedBirth}
            </p>
          ) : (
            <p className="mt-2 text-xs font-bold leading-5 text-[#756a5d]">
              月令 {chart.monthOrder} · 空亡 {chart.voidBranches.join("、")}
            </p>
          )}
        </div>
        <div className={`flex h-[6.4rem] w-[6.4rem] shrink-0 flex-col items-center justify-center rounded-full border-[3px] ${dayMasterSealTone[dayElement]} ring-[5px] ring-[#e2cdaa]`}>
          <span className="text-xs font-black tracking-[0.12em]">日主</span>
          <span className="mt-1 text-5xl font-black leading-none">{chart.dayMaster}</span>
          <span className="mt-1 text-xs font-black tracking-[0.18em]">{ELEMENT_LABEL[dayElement]}</span>
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
      <div className="mt-2.5 flex items-center justify-between">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#eadfce]" />
        <span className="mx-2.5 text-[9px] tracking-widest text-[#8f2f24]/50">◆ ◇ ◆</span>
        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#eadfce]" />
      </div>
    </div>
  );
}

function ElementLegend() {
  const elements = Object.keys(elementLabels) as (keyof typeof elementLabels)[];
  return (
    <div className="mb-3 grid grid-cols-5 gap-1.5">
      {elements.map((element) => (
        <div className="flex items-center justify-center gap-1 rounded border border-[#eadfce] bg-[#fffdf8] px-1.5 py-1 text-[11px] font-black text-[#5f5143] shadow-sm" key={element}>
          <span className={`h-2.5 w-2.5 rounded-full border ${elementDot[element]}`} />
          {elementLabels[element]}
        </div>
      ))}
    </div>
  );
}

function BaziChartTable({ pillars }: { pillars: Record<keyof typeof pillarLabels, Pillar | undefined> }) {
  const pillarKeys = Object.keys(pillarLabels) as (keyof typeof pillarLabels)[];
  return (
    <div className="overflow-hidden rounded-lg border border-[#ddd2c0] bg-[#fffcf7] text-center shadow-sm">
      <div className="grid grid-cols-[48px_repeat(4,minmax(0,1fr))] border-b border-[#ddd2c0] bg-[#f3eadb] text-xs font-black text-[#5f5143]">
        <div className="p-2 flex items-center justify-center">柱</div>
        {pillarKeys.map((key) => <div className={`border-l border-[#ddd2c0] p-2 flex items-center justify-center ${key === "day" ? "bg-[#f7ead6] text-[#8f2f24]" : ""}`} key={key}>{pillarLabels[key]}</div>)}
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
      <div className="flex items-center justify-center bg-[#faf4e7] p-2 font-bold text-[#756a5d]">{label}</div>
      {children}
    </div>
  );
}

function PlainCell({ children, isDay = false }: { children: ReactNode; isDay?: boolean }) {
  return <div className={`flex min-h-11 items-center justify-center border-l border-[#eadfce] p-1 leading-5 text-[#3a3028] font-bold ${isDay ? "bg-[#fff5e5]/80 text-[#8f2f24]" : ""}`}>{children}</div>;
}

function StemBranchCell({ kind, pillar, isDay = false }: { kind: "stem" | "branch"; pillar?: Pillar; isDay?: boolean }) {
  if (!pillar) return <PlainCell isDay={isDay}>-</PlainCell>;
  const value = kind === "stem" ? pillar.stem : pillar.branch;
  const element = kind === "stem" ? STEM_ELEMENT[pillar.stem] : BRANCH_ELEMENT[pillar.branch];
  return (
    <div className={`flex min-h-14 items-center justify-center border-l border-[#eadfce] p-1 ${isDay ? "bg-[#fff5e5]/80" : ""}`}>
      <div className="relative w-full overflow-hidden rounded border border-[#ddd2c0] bg-[#fffdf8] px-1 py-1.5 shadow-sm">
        <div className={`absolute top-0 inset-x-0 h-[3px] ${elementBar[element]}`} />
        <div className="text-2xl font-black leading-none text-[#201b16] mt-0.5">{value}</div>
        <div className={`mt-1 text-[10px] font-black ${elementTextColor[element]}`}>{ELEMENT_LABEL[element]}</div>
      </div>
    </div>
  );
}

function HiddenStemCell({ pillar, isDay = false }: { pillar?: Pillar; isDay?: boolean }) {
  if (!pillar) return <PlainCell isDay={isDay}>-</PlainCell>;
  return (
    <div className={`flex min-h-14 flex-wrap items-center justify-center gap-1 border-l border-[#eadfce] p-1.5 ${isDay ? "bg-[#fff5e5]/80" : ""}`}>
      {pillar.hiddenStems.map((stem) => {
        const element = STEM_ELEMENT[stem];
        return (
          <span className="relative overflow-hidden rounded border border-[#ddd2c0] bg-[#fffdf8] px-1.5 py-0.5 text-[11px] font-black text-[#201b16] shadow-sm flex items-center justify-center" key={stem}>
            <span className={`absolute left-0 inset-y-0 w-[2px] ${elementBar[element]}`} />
            <span className="pl-0.5">{stem}</span>
            <span className={`ml-0.5 text-[9px] font-black ${elementTextColor[element]}`}>{ELEMENT_LABEL[element]}</span>
          </span>
        );
      })}
    </div>
  );
}

function ElementCell({ pillar, isDay = false }: { pillar?: Pillar; isDay?: boolean }) {
  if (!pillar) return <PlainCell isDay={isDay}>-</PlainCell>;
  return (
    <PlainCell isDay={isDay}>
      <span className="font-bold text-[#201b16]">
        {ELEMENT_LABEL[STEM_ELEMENT[pillar.stem]]}
      </span>
      <span className="mx-0.5 text-[#ddd2c0]">/</span>
      <span className="font-bold text-[#201b16]">
        {ELEMENT_LABEL[BRANCH_ELEMENT[pillar.branch]]}
      </span>
    </PlainCell>
  );
}

function FiveElementSummary({ chart }: { chart: BaziChart }) {
  return (
    <div>
      <h3 className="font-black text-[#201b16]">五行分布</h3>
      <div className="mt-3 space-y-2.5">
        {Object.entries(chart.fiveElements).map(([element, count]) => (
          <div key={element}>
            <div className="flex justify-between text-sm">
              <span className={`font-black ${elementTextColor[element as keyof typeof elementTextColor]}`}>{elementLabels[element as keyof typeof elementLabels]}</span>
              <span className="font-black text-[#5f5143]">{elementStrengthLabel(Number(count))}</span>
            </div>
            <div className="mt-1 h-2 rounded bg-[#eadfce]"><div className={`h-2 rounded ${elementBarPercentage[element as keyof typeof elementBarPercentage]}`} style={{ width: `${Math.min(Number(count) * 14, 100)}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function elementStrengthLabel(count: number): string {
  if (count <= 0) return "缺";
  if (count <= 1.5) return "偏弱";
  if (count <= 3) return "中和";
  if (count <= 5) return "偏旺";
  return "旺";
}

function LuckCycleSummary({ chart }: { chart: BaziChart }) {
  return (
    <div>
      <h3 className="font-black text-[#201b16]">大运</h3>
      <div className="mt-3 grid gap-2">
        {chart.luckCycles.length ? chart.luckCycles.map((cycle) => (
          <div className="flex justify-between rounded-lg border border-[#ddd2c0] bg-[#fffdf8] px-3 py-2 text-sm shadow-sm" key={cycle.index}>
            <span className="font-bold text-[#756a5d]">{cycle.startAge}岁 · {cycle.startYear}</span>
            <strong className="text-[#8f2f24] font-black">{cycle.pillar}</strong>
          </div>
        )) : <p className="text-sm text-[#756a5d] font-bold">性别或时辰不完整，大运暂不展示。</p>}
      </div>
    </div>
  );
}

function Report({ report }: { report: InterpretationReport }) {
  const featuredSections = report.sections.slice(0, 6);
  return (
    <section className="panel overflow-hidden p-0">
      <div className="border-b border-[#eadfce] bg-[#faf4e7] p-4 relative">
        <h2 className="text-2xl font-black leading-tight text-[#201b16]">{report.title}</h2>
        <p className="mt-3 rounded-lg border border-[#eadfce] bg-[#fffdf8]/85 p-3 text-sm font-semibold leading-6 text-[#3a3028] shadow-sm">{report.summary}</p>
      </div>

      <div className="space-y-3 p-4 bg-[#fffdf9]/20">
        {featuredSections.map((section) => (
          <article className="rounded-lg border border-[#eadfce] bg-[#fffdf9] p-3.5 shadow-sm" key={section.heading}>
            <div className="flex gap-2">
              <div className="mt-1 h-6 w-1 shrink-0 rounded-full bg-[#8f2f24]" />
              <div>
                <h3 className="font-black text-[#201b16]">{section.heading}</h3>
                <p className="mt-2 text-sm leading-7 text-[#3a3028] font-medium">{section.body}</p>
              </div>
            </div>
          </article>
        ))}

        {report.actionSuggestions.length ? (
          <div className="rounded-lg border border-[#d7c3a3] bg-[#fffbf2] p-4 shadow-sm relative overflow-hidden">
            <div className="absolute right-2 bottom-1 text-[2.5rem] font-bold text-[#8f2f24]/3 select-none pointer-events-none">印</div>
            <h3 className="font-black text-[#201b16] relative z-10">五行生活灵感</h3>
            <p className="mt-1 text-xs leading-5 text-[#756a5d] font-bold relative z-10">偏娱乐参考，可看看颜色、方位、城市气质、工作类型、运动和饰品灵感。</p>
            <div className="mt-3 space-y-2 relative z-10">
              {report.actionSuggestions.slice(0, 4).map((suggestion, index) => (
                <div className="flex gap-2 text-sm leading-6 text-[#3a3028] font-medium" key={suggestion}>
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
