"use client";

import { useEffect, useMemo, useState } from "react";
import type { ArchiveItem } from "@/lib/archive/local-archive";
import { deleteArchiveItem, formatArchiveDate, readArchiveItems, renameArchiveItem } from "@/lib/archive/local-archive";

type Overview = {
  user: {
    name: string;
    loginStatus: "pending" | "active";
  };
  entitlement: {
    baziMembershipExpiresAt: string;
    baziMembershipActive: boolean;
    yijingCredits: number;
  };
};

export default function MePage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [archives, setArchives] = useState<ArchiveItem[]>([]);
  const [draftNames, setDraftNames] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const groupedArchives = useMemo(() => ({
    bazi: archives.filter((item) => item.kind === "bazi"),
    yijing: archives.filter((item) => item.kind === "yijing")
  }), [archives]);

  useEffect(() => {
    refreshOverview();
    syncArchives();

    function handleArchiveChange() {
      syncArchives();
    }

    window.addEventListener("storage", handleArchiveChange);
    window.addEventListener("mystic-archive-change", handleArchiveChange);
    return () => {
      window.removeEventListener("storage", handleArchiveChange);
      window.removeEventListener("mystic-archive-change", handleArchiveChange);
    };
  }, []);

  async function refreshOverview() {
    const data = await fetch("/api/me/overview").then((response) => response.json());
    setOverview(data);
  }

  function syncArchives() {
    const nextArchives = readArchiveItems();
    setArchives(nextArchives);
    setDraftNames((current) => {
      const nextNames: Record<string, string> = {};
      for (const item of nextArchives) nextNames[item.id] = current[item.id] ?? item.name;
      return nextNames;
    });
  }

  async function buy(productType: string) {
    const order = await fetch("/api/orders/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productType })
    }).then((response) => response.json());
    const callback = await fetch("/api/payments/callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNo: order.orderNo })
    }).then((response) => response.json());
    setMessage(`${getProductLabel(callback.order.productType)}已加入当前权益。`);
    refreshOverview();
  }

  function renameArchive(id: string) {
    const nextArchives = renameArchiveItem(id, draftNames[id] ?? "");
    setArchives(nextArchives);
    setMessage("存档名称已更新。");
  }

  function removeArchive(id: string) {
    const nextArchives = deleteArchiveItem(id);
    setArchives(nextArchives);
    if (expandedId === id) setExpandedId(null);
    setMessage("已删除这条存档。");
  }

  return (
    <div className="space-y-4">
      <section className="flex items-center gap-3 px-1 pb-2 pt-3">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#ddd2c0] bg-[#f4efe6] shadow-[0_10px_28px_rgba(75,48,27,0.08)]" aria-hidden="true">
          <div className="absolute top-[0.65rem] h-[1.35rem] w-[1.35rem] rounded-full bg-[#9f988e]" />
          <div className="absolute top-[2.05rem] h-3 w-3 rounded-b-[0.35rem] bg-[#9f988e]" />
          <div className="absolute bottom-[0.42rem] h-[1.15rem] w-9 rounded-t-[999px] bg-[#9f988e]" />
          <div className="absolute bottom-0 h-[0.65rem] w-14 bg-[#f4efe6]" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-black leading-tight text-[#201b16]">{overview?.user.loginStatus === "active" ? overview.user.name : "未登录"}</h1>
          <p className="mt-1 text-sm font-semibold leading-5 text-[#756a5d]">登录后可继续接入</p>
        </div>
      </section>

      <section className="panel space-y-4 p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-black">当前权益</h2>
            <p className="mt-1 text-xs leading-5 text-[#756a5d]">会员有效期与解读次数一目了然。</p>
          </div>
          <span className="rounded border border-[#ddd2c0] bg-white px-2 py-1 text-xs font-bold text-[#1f5d57]">可用</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <EntitlementCard
            label="八字会员"
            value={overview?.entitlement.baziMembershipActive ? "已开通" : "未开通"}
            detail={overview ? `到期 ${formatEntitlementDate(overview.entitlement.baziMembershipExpiresAt)}` : "读取中"}
            tone="red"
          />
          <EntitlementCard
            label="易经次数"
            value={`${overview?.entitlement.yijingCredits ?? "-"} 次`}
            detail="生成深度解读时扣减"
            tone="green"
          />
        </div>

        <div className="rounded border border-[#eadfce] bg-white/70 p-3">
          <p className="mb-2 text-xs font-bold text-[#756a5d]">补充权益</p>
          <div className="grid gap-2">
            <button className="button-secondary w-full" onClick={() => buy("bazi_30d")}>八字会员 30 天 ¥9.9</button>
            <button className="button-secondary w-full" onClick={() => buy("yijing_3")}>易经解读 3 次 ¥9.9</button>
          </div>
        </div>
      </section>

      <section className="panel space-y-4 p-4">
        <div>
          <h2 className="font-black">我的存档</h2>
          <p className="mt-1 text-sm leading-6 text-[#756a5d]">重要解读可长期保存，八字和易经会自动分类，也可以自己改名。</p>
        </div>

        <ArchiveGroup
          title="八字存档"
          emptyText="还没有八字存档。生成 AI 解读后可一键保存。"
          items={groupedArchives.bazi}
          draftNames={draftNames}
          expandedId={expandedId}
          onChangeName={(id, name) => setDraftNames((current) => ({ ...current, [id]: name }))}
          onRename={renameArchive}
          onDelete={removeArchive}
          onToggle={(id) => setExpandedId((current) => current === id ? null : id)}
        />

        <ArchiveGroup
          title="易经存档"
          emptyText="还没有易经存档。生成深度解读后可一键保存。"
          items={groupedArchives.yijing}
          draftNames={draftNames}
          expandedId={expandedId}
          onChangeName={(id, name) => setDraftNames((current) => ({ ...current, [id]: name }))}
          onRename={renameArchive}
          onDelete={removeArchive}
          onToggle={(id) => setExpandedId((current) => current === id ? null : id)}
        />
      </section>

      {message ? <p className="rounded border border-[#ddd2c0] bg-white p-3 text-sm leading-6 text-[#756a5d]">{message}</p> : null}

      <section className="panel p-4 text-sm leading-6 text-[#756a5d]">
        本产品适合 18 岁以上用户使用。内容仅供传统文化体验与自我反思。
      </section>
    </div>
  );
}

function EntitlementCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: "red" | "green" }) {
  const color = tone === "red" ? "text-[#8f2f24]" : "text-[#1f5d57]";
  return (
    <div className="rounded border border-[#eadfce] bg-white p-3">
        <p className="text-xs font-bold text-[#756a5d]">{label}</p>
        <p className={`mt-2 text-2xl font-black ${color}`}>{value}</p>
        <p className="mt-1 text-xs leading-5 text-[#756a5d]">{detail}</p>
    </div>
  );
}

function ArchiveGroup({
  title,
  emptyText,
  items,
  draftNames,
  expandedId,
  onChangeName,
  onRename,
  onDelete,
  onToggle
}: {
  title: string;
  emptyText: string;
  items: ArchiveItem[];
  draftNames: Record<string, string>;
  expandedId: string | null;
  onChangeName: (id: string, name: string) => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-t border-[#eadfce] pt-4">
        <h3 className="font-black">{title}</h3>
        <span className="text-xs font-bold text-[#756a5d]">{items.length} 条</span>
      </div>
      {items.length ? (
        <div className="space-y-3">
          {items.map((item) => (
            <article className="rounded border border-[#eadfce] bg-white p-3 shadow-[0_10px_24px_rgba(75,48,27,0.04)]" key={item.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-[#756a5d]">{formatArchiveDate(item.updatedAt)} · {item.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm font-bold leading-6 text-[#3a3028]">{item.summary}</p>
                </div>
                <button className="shrink-0 rounded border border-[#ddd2c0] px-2 py-1 text-xs font-bold text-[#1f5d57]" onClick={() => onToggle(item.id)}>
                  {expandedId === item.id ? "收起" : "查看"}
                </button>
              </div>
              <div className="mt-3 grid grid-cols-[1fr_auto_auto] gap-2">
                <input
                  className="field min-h-10 text-sm"
                  value={draftNames[item.id] ?? item.name}
                  onChange={(event) => onChangeName(item.id, event.target.value)}
                  aria-label="存档名称"
                />
                <button className="button-secondary min-h-10 px-3 text-sm" onClick={() => onRename(item.id)}>改名</button>
                <button className="button-secondary min-h-10 px-3 text-sm" onClick={() => onDelete(item.id)}>删除</button>
              </div>
              {expandedId === item.id ? <ArchivePreview item={item} /> : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded border border-dashed border-[#ddd2c0] bg-white/60 p-3 text-sm leading-6 text-[#756a5d]">{emptyText}</p>
      )}
    </div>
  );
}

function ArchivePreview({ item }: { item: ArchiveItem }) {
  const report = item.payload.report;
  const chart = item.payload.chart;
  const yijing = item.payload.yijingResult;
  return (
    <div className="mt-3 space-y-3 rounded border border-[#eadfce] bg-[#fff8eb] p-3">
      {chart ? (
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <MiniStat label="日主" value={chart.dayMaster} />
          <MiniStat label="月令" value={chart.monthOrder} />
          <MiniStat label="空亡" value={chart.voidBranches.join("")} />
        </div>
      ) : null}
      {yijing ? (
        <div className="rounded border border-[#eadfce] bg-white p-3 text-center">
          <div className="text-4xl">{yijing.primarySymbol}</div>
          <p className="mt-1 font-black">{yijing.primaryHexagram}</p>
          <p className="mt-1 text-xs text-[#756a5d]">动爻{yijing.movingLine} · 变卦 {yijing.changedHexagram}</p>
        </div>
      ) : null}
      <div className="rounded border border-[#eadfce] bg-white p-3">
        <h4 className="font-black">{report.title}</h4>
        <p className="mt-2 text-sm leading-7 text-[#3a3028]">{report.summary}</p>
      </div>
      <div className="space-y-2">
        {report.sections.slice(0, 3).map((section) => (
          <div className="rounded border border-[#eadfce] bg-white p-3" key={section.heading}>
            <h5 className="font-black text-[#201b16]">{section.heading}</h5>
            <p className="mt-1 text-sm leading-7 text-[#3a3028]">{section.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-[#eadfce] bg-white p-2">
      <p className="text-xs text-[#756a5d]">{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}

function formatEntitlementDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(value));
}

function getProductLabel(productType: string) {
  const labels: Record<string, string> = {
    bazi_30d: "八字会员 30 天",
    bazi_90d: "八字会员 90 天",
    yijing_1: "易经解读 1 次",
    yijing_3: "易经解读 3 次",
    yijing_9: "易经解读 9 次"
  };
  return labels[productType] ?? "权益";
}
