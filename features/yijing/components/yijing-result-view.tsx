"use client";

import { useEffect, useState } from "react";
import { Disclaimer } from "@/components/disclaimer";
import type { YijingResult } from "@/features/yijing/engine/types";
import type { InterpretationReport } from "@/lib/ai/schemas";
import { saveArchiveItem } from "@/lib/archive/local-archive";

export function YijingResultView({ castId }: { castId: string }) {
  const [result, setResult] = useState<YijingResult | null>(null);
  const [focusArea, setFocusArea] = useState("career");
  const [questionText, setQuestionText] = useState("是否适合近期推进这个计划？");
  const [report, setReport] = useState<InterpretationReport | null>(null);
  const [message, setMessage] = useState("");
  const [archiveMessage, setArchiveMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cached = sessionStorage.getItem(`yijing:${castId}`);
    if (cached) setResult(JSON.parse(cached).result);
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
    setArchiveMessage("");
    setMessage(`${data.cooldownHint} 剩余次数：${data.creditRemaining}`);
  }

  function archiveReport() {
    if (!result || !report) return;
    const saved = saveArchiveItem({
      kind: "yijing",
      sourceId: castId,
      title: `易经数字卦 · ${result.primaryHexagram}`,
      summary: report.summary,
      payload: { yijingResult: result, report }
    });
    setArchiveMessage(saved.updatedExisting ? "已更新到我的存档。" : "已存入我的存档。");
  }

  if (!result) return <p className="panel p-4">未找到本地卦象缓存，请返回重新起卦。</p>;

  return (
    <div className="space-y-4">
      <section className="panel p-4 text-center">
        <div className="text-6xl">{result.primarySymbol}</div>
        <h1 className="mt-2 text-3xl font-black">{result.primaryHexagram}</h1>
        <p className="mt-2 text-sm text-[#756a5d]">上卦{result.upperTrigram} · 下卦{result.lowerTrigram} · 动爻{result.movingLine}</p>
      </section>
      <section className="grid grid-cols-2 gap-3">
        <div className="panel p-3"><div className="text-xs font-bold text-[#1f5d57]">变卦</div><div className="mt-2 text-2xl font-black">{result.changedSymbol} {result.changedHexagram}</div></div>
        <div className="panel p-3"><div className="text-xs font-bold text-[#8f2f24]">互卦</div><div className="mt-2 text-2xl font-black">{result.mutualSymbol} {result.mutualHexagram}</div></div>
      </section>
      <section className="panel space-y-3 p-4">
        <div>
          <h2 className="font-black">易经原文</h2>
          <div className="mt-3 space-y-2 rounded border border-[#eadfce] bg-white p-3 text-sm leading-7 text-[#3a3028]">
            <p><strong>卦辞：</strong>{result.judgement}</p>
            <p><strong>动爻：</strong>{result.lineText}</p>
          </div>
        </div>
        <div>
          <h2 className="font-black">卦象简析</h2>
          <div className="mt-3 space-y-2 text-sm leading-7 text-[#3a3028]">
            <p>{result.analysis}</p>
            <p className="rounded border border-[#eadfce] bg-[#fff8eb] p-3"><strong>动爻提示：</strong>{result.lineAnalysis}</p>
          </div>
        </div>
      </section>
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
        {message ? <p className="rounded bg-white p-3 text-sm leading-6 text-[#756a5d]">{message}</p> : null}
        {report ? (
          <div className="rounded border border-[#eadfce] bg-white p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-[#3a3028]">这次问题可以存档，方便之后对比。</p>
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

function Report({ report }: { report: InterpretationReport }) {
  const featuredSections = report.sections.slice(0, 6);
  return (
    <section className="panel overflow-hidden p-0">
      <div className="border-b border-[#eadfce] bg-[#fbf5ea] p-4">
        <h2 className="text-2xl font-black leading-tight text-[#201b16]">{report.title}</h2>
        <p className="mt-3 rounded border border-[#eadfce] bg-white/70 p-3 text-sm font-semibold leading-6 text-[#3a3028]">{report.summary}</p>
      </div>

      <div className="space-y-3 p-4">
        {featuredSections.map((section) => (
          <article className="rounded border border-[#eadfce] bg-white p-3" key={section.heading}>
            <div className="flex gap-2">
              <div className="mt-1 h-8 w-1 shrink-0 rounded-full bg-[#1f5d57]" />
              <div>
                <h3 className="font-black text-[#201b16]">{section.heading}</h3>
                <p className="mt-2 text-sm leading-7 text-[#3a3028]">{section.body}</p>
              </div>
            </div>
          </article>
        ))}

        {report.actionSuggestions.length ? (
          <div className="rounded border border-[#d7c3a3] bg-[#fff8eb] p-3">
            <h3 className="font-black text-[#201b16]">观察提醒</h3>
            <p className="mt-1 text-xs leading-5 text-[#756a5d]">把卦象当作观察问题的角度，而不是替你做决定的答案。</p>
            <div className="mt-3 space-y-2">
              {report.actionSuggestions.slice(0, 4).map((suggestion, index) => (
                <div className="flex gap-2 text-sm leading-6 text-[#3a3028]" key={suggestion}>
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
