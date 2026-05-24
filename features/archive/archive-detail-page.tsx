"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { SharePosterButton } from "@/features/share/share-poster-button";
import { formatArchiveDate, readArchiveItems } from "@/lib/archive/local-archive";
import type { ArchiveItem } from "@/lib/archive/local-archive";

const BaziSnapshotView = dynamic(
  () => import("@/features/bazi/components/bazi-result-view").then((mod) => mod.BaziSnapshotView),
  { ssr: false }
);

const YijingSnapshotView = dynamic(
  () => import("@/features/yijing/components/yijing-result-view").then((mod) => mod.YijingSnapshotView),
  { ssr: false }
);

export function ArchiveDetailPage({ archiveId }: { archiveId: string }) {
  const [item, setItem] = useState<ArchiveItem | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setItem(readArchiveItems().find((archive) => archive.id === archiveId) ?? null);
    setLoaded(true);
  }, [archiveId]);

  if (!loaded) {
    return <p className="panel p-4">正在读取存档...</p>;
  }

  if (!item) {
    return (
      <div className="space-y-4">
        <section className="panel p-4">
          <h1 className="text-xl font-black">未找到这条存档</h1>
          <p className="mt-2 text-sm leading-6 text-[#756a5d]">这条内容可能已经被删除，或不在当前浏览器的本地存档里。</p>
        </section>
      </div>
    );
  }

  const report = item.payload.report;
  const chart = item.payload.chart;
  const yijing = item.payload.yijingResult;

  return (
    <div className="space-y-4 pb-24">
      <section className="flex justify-end px-1 pt-3">
        <span className="rounded-lg border border-[#eadfce] bg-[#fffdf8] px-2 py-1 text-xs font-bold text-[#756a5d] shadow-sm">{formatArchiveDate(item.updatedAt)}</span>
      </section>

      <section className="relative overflow-hidden rounded-xl border border-[#ddd2c0] bg-gradient-to-br from-[#fffdfa] to-[#faf4e8] p-4 shadow-[0_12px_36px_rgba(75,48,27,0.05)]">
        <div className="pointer-events-none absolute right-[-2.5rem] top-[-2.5rem] h-28 w-28 rounded-full border border-[#dcc8a6] opacity-70" />
        <div className="relative">
          <p className="text-xs font-black text-[#8f2f24] tracking-wide">{item.kind === "bazi" ? "八字存档" : "易经存档"}</p>
          <h1 className="mt-2 text-2xl font-black leading-tight text-[#201b16]">{item.name || item.title}</h1>
        </div>
      </section>

      {chart ? (
        <>
          <BaziSnapshotView chart={chart} fateSummary={item.payload.fateSummary ?? item.summary} report={report} input={item.payload.input} />
          <SharePosterButton data={{ kind: "bazi", chart, fateSummary: item.payload.fateSummary ?? item.summary, reportSummary: report?.summary, createdAt: item.updatedAt }} />
        </>
      ) : yijing ? (
        <>
          <YijingSnapshotView result={yijing} report={report} />
          <SharePosterButton data={{ kind: "yijing", result: yijing, reportSummary: report?.summary, createdAt: item.updatedAt }} />
        </>
      ) : (
        <p className="rounded-lg border border-dashed border-[#ddd2c0] bg-[#fffdf8]/60 p-3 text-sm leading-6 text-[#756a5d]">这条存档暂无可展示内容。</p>
      )}
    </div>
  );
}
