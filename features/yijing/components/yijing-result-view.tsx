"use client";

import { useEffect, useState } from "react";
import { Disclaimer } from "@/components/disclaimer";
import type { YijingResult } from "@/features/yijing/engine/types";
import { SharePosterButton } from "@/features/share/share-poster-button";
import type { InterpretationReport } from "@/lib/ai/schemas";
import { saveArchiveItem } from "@/lib/archive/local-archive";

type YijingCastPayload = {
  cast?: {
    result: YijingResult;
    focusArea?: string;
    questionText?: string;
    report?: InterpretationReport;
  };
};

export function YijingResultView({ castId }: { castId: string }) {
  const [result, setResult] = useState<YijingResult | null>(null);
  const [focusArea, setFocusArea] = useState("career");
  const [questionText, setQuestionText] = useState("是否适合近期推进这个计划？");
  const [report, setReport] = useState<InterpretationReport | null>(null);
  const [message, setMessage] = useState("");
  const [archiveMessage, setArchiveMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [recordLoaded, setRecordLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const cached = sessionStorage.getItem(`yijing:${castId}`);
    if (cached) {
      const parsed = JSON.parse(cached) as { result: YijingResult; focusArea?: string; questionText?: string; report?: InterpretationReport };
      setResult(parsed.result);
      if (parsed.focusArea) setFocusArea(parsed.focusArea);
      if (parsed.questionText) setQuestionText(parsed.questionText);
      setReport(parsed.report ?? null);
      setRecordLoaded(true);
    }
    fetch(`/api/yijing/cast?castId=${encodeURIComponent(castId)}`)
      .then((response) => response.ok ? response.json() : null)
      .then((data: YijingCastPayload | null) => {
        if (cancelled || !data?.cast) return;
        setResult(data.cast.result);
        if (data.cast.focusArea) setFocusArea(data.cast.focusArea);
        if (data.cast.questionText) setQuestionText(data.cast.questionText);
        setReport(data.cast.report ?? null);
        sessionStorage.setItem(`yijing:${castId}`, JSON.stringify({
          result: data.cast.result,
          focusArea: data.cast.focusArea,
          questionText: data.cast.questionText,
          report: data.cast.report
        }));
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setRecordLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [castId]);

  async function generateReport() {
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/yijing/interpret", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ castId, focusArea, questionText })
    });
    const data = await response.json();
    setLoading(false);
    if (data.blocked) {
      setMessage(data.classification.message);
      return;
    }
    if (!response.ok) {
      setMessage(data.error ?? "解读失败");
      return;
    }
    setReport(data.report);
    if (result) {
      sessionStorage.setItem(`yijing:${castId}`, JSON.stringify({ result, focusArea, questionText, report: data.report }));
    }
    setArchiveMessage("");
    setMessage(`${data.cooldownHint} 剩余次数：${data.creditRemaining}`);
  }

  function archiveReport() {
    if (!result) return;
    const saved = saveArchiveItem({
      kind: "yijing",
      sourceId: castId,
      title: `易经数字卦 · ${result.primaryHexagram}`,
      summary: report?.summary ?? result.analysis,
      payload: { yijingResult: result, report: report ?? undefined }
    });
    setArchiveMessage(saved.updatedExisting ? "已更新到我的存档。" : "已存入我的存档。");
  }

  if (!result) return <p className="panel p-4">{recordLoaded ? "未找到这条卦例记录，请返回重新起卦。" : "正在读取卦例记录..."}</p>;

  return (
    <div className="space-y-4 pb-24">
      <YijingSnapshotView result={result} />
      <section className="panel space-y-3 p-4">
        <label className="label">问题方向</label>
        <select className="field" value={focusArea} onChange={(event) => setFocusArea(event.target.value)}>
          <option value="general">综合</option>
          <option value="relationship">感情</option>
          <option value="career">事业</option>
          <option value="wealth">财运</option>
          <option value="study">学业</option>
          <option value="mental_state">身心状态</option>
        </select>
        <label className="label">具体问题（可选，100字内）</label>
        <textarea className="field min-h-24" maxLength={100} value={questionText} onChange={(event) => setQuestionText(event.target.value)} />
        <button className="button-primary w-full" onClick={generateReport} disabled={loading}>{loading ? "解读中..." : "生成深度解读并扣 1 次"}</button>
        {message ? <p className="rounded-lg border border-[#ddd2c0] bg-[#fffdf8] p-3 text-sm leading-6 text-[#756a5d] shadow-sm">{message}</p> : null}
      </section>
      {report ? <Report report={report} /> : null}
      <section className="rounded-lg border border-[#d7b7a0] bg-[#fff8eb] p-3 shadow-[0_12px_32px_rgba(75,48,27,0.06)]">
        <button className="button-primary w-full text-base" onClick={archiveReport}>一键存档</button>
        <p className="mt-2 text-center text-xs font-bold leading-5 text-[#756a5d]">{report ? "将卦象、原文、简析和 AI 解读一起保存。" : "保存当前卦象、原文和简析。"}</p>
        {archiveMessage ? <p className="mt-2 rounded border border-[#eadfce] bg-[#fffdf8] p-2 text-center text-xs font-bold text-[#1f5d57] shadow-sm">{archiveMessage}</p> : null}
      </section>
      <Disclaimer />
      <SharePosterButton data={{ kind: "yijing", result, reportSummary: report?.summary, questionText }} />
    </div>
  );
}

export function YijingSnapshotView({ result, report }: { result: YijingResult; report?: InterpretationReport | null }) {
  return (
    <div className="space-y-4">
      <section className="panel p-5 text-center relative overflow-hidden">
        <div className="text-6xl text-[#1f5d57] relative z-10">{result.primarySymbol}</div>
        <h1 className="mt-2 text-3xl font-black text-[#201b16] relative z-10">{result.primaryHexagram}</h1>
        <p className="mt-2 text-xs font-bold text-[#756a5d] relative z-10">上卦 {result.upperTrigram} · 下卦 {result.lowerTrigram} · 动爻 {result.movingLine}爻</p>
      </section>
      {result.lineAuspice ? <LineAuspiceCard result={result} /> : null}
      <section className="grid grid-cols-2 gap-3">
        <div className="panel p-3">
          <div className="text-xs font-black text-[#1f5d57] flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#1f5d57]/70" />
            变卦
          </div>
          <div className="mt-2 text-2xl font-black text-[#201b16]">{result.changedSymbol} {result.changedHexagram}</div>
        </div>
        <div className="panel p-3">
          <div className="text-xs font-black text-[#8f2f24] flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#8f2f24]/70" />
            互卦
          </div>
          <div className="mt-2 text-2xl font-black text-[#201b16]">{result.mutualSymbol} {result.mutualHexagram}</div>
        </div>
      </section>
      <section className="panel space-y-4 p-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-black text-[#201b16]">易经原文</h2>
          </div>
          <div className="mt-2.5 mb-3 flex items-center justify-between">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#eadfce]" />
            <span className="mx-2 text-[9px] tracking-widest text-[#1f5d57]/50">◆ ◇ ◆</span>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#eadfce]" />
          </div>
          <div className="mt-3 space-y-2.5 rounded-lg border border-[#eadfce] bg-[#fffdf8] p-3 text-sm leading-7 text-[#3a3028] shadow-sm">
            <p><strong>卦辞：</strong>{result.judgement}</p>
            <p><strong>动爻：</strong>{result.lineText}</p>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-black text-[#201b16]">卦象简析</h2>
          </div>
          <div className="mt-2.5 mb-3 flex items-center justify-between">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#eadfce]" />
            <span className="mx-2 text-[9px] tracking-widest text-[#1f5d57]/50">◆ ◇ ◆</span>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#eadfce]" />
          </div>
          <div className="mt-3 space-y-3 text-sm leading-7 text-[#3a3028]">
            <p className="font-medium px-1">{result.analysis}</p>
            <p className="rounded-lg border border-[#eadfce] bg-[#fffbf2] p-3 shadow-inner relative overflow-hidden">
              <strong className="text-[#1f5d57]">动爻提示：</strong>{result.lineAnalysis}
            </p>
          </div>
        </div>
      </section>
      {report ? <Report report={report} /> : null}
    </div>
  );
}

function LineAuspiceCard({ result }: { result: YijingResult }) {
  return (
    <section className="panel overflow-hidden p-0 text-center">
      <div className="border-b border-[#eadfce] bg-[#fffbf2] p-4 relative">
        <div className="text-xs font-black text-[#8f2f24] relative z-10">动爻断语</div>
        <div className="mt-2 text-5xl font-black leading-none text-[#7f1d1d] relative z-10">{result.lineAuspice.main}</div>
        <p className="mt-3 text-sm font-bold leading-6 text-[#5f5143] relative z-10">原典断辞：{result.lineAuspice.classicalLabel}</p>
        {result.lineAuspice.hint ? <p className="mt-1 text-xs leading-5 text-[#756a5d] font-bold relative z-10">{result.lineAuspice.hint}</p> : null}
      </div>
      <p className="p-3.5 text-sm leading-7 text-[#3a3028] font-medium bg-[#fffdf8]/30">{result.lineText}</p>
    </section>
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
              <div className="mt-1 h-6 w-1 shrink-0 rounded-full bg-[#1f5d57]" />
              <div>
                <h3 className="font-black text-[#201b16]">{section.heading}</h3>
                <p className="mt-2 text-sm leading-7 text-[#3a3028] font-medium">{section.body}</p>
              </div>
            </div>
          </article>
        ))}

        {report.actionSuggestions.length ? (
          <div className="rounded-lg border border-[#d7c3a3] bg-[#fffbf2] p-4 shadow-sm relative overflow-hidden">
            <h3 className="font-black text-[#201b16] relative z-10">观察提醒</h3>
            <p className="mt-1 text-xs leading-5 text-[#756a5d] font-bold relative z-10">把卦象当作观察问题的角度，而不是替你做决定的答案。</p>
            <div className="mt-3 space-y-2 relative z-10">
              {report.actionSuggestions.slice(0, 4).map((suggestion, index) => (
                <div className="flex gap-2 text-sm leading-6 text-[#3a3028] font-medium" key={suggestion}>
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1f5d57] text-[11px] font-black text-white">{index + 1}</span>
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
