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

function getArchiveKindFromLocation() {
  if (typeof window === "undefined") return null;
  const kind = new URL(window.location.href).searchParams.get("archive");
  return kind === "bazi" || kind === "yijing" ? kind : null;
}

export default function MePage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [archives, setArchives] = useState<ArchiveItem[]>([]);
  const [draftNames, setDraftNames] = useState<Record<string, string>>({});
  const [archiveKind, setArchiveKind] = useState<"bazi" | "yijing" | null>(null);
  const [message, setMessage] = useState("");

  const groupedArchives = useMemo(() => ({
    bazi: archives.filter((item) => item.kind === "bazi"),
    yijing: archives.filter((item) => item.kind === "yijing")
  }), [archives]);

  useEffect(() => {
    refreshOverview();
    syncArchives();
    setArchiveKind(getArchiveKindFromLocation());

    function handleArchiveChange() {
      syncArchives();
    }

    function handleRouteChange() {
      setArchiveKind(getArchiveKindFromLocation());
    }

    window.addEventListener("storage", handleArchiveChange);
    window.addEventListener("mystic-archive-change", handleArchiveChange);
    window.addEventListener("popstate", handleRouteChange);
    return () => {
      window.removeEventListener("storage", handleArchiveChange);
      window.removeEventListener("mystic-archive-change", handleArchiveChange);
      window.removeEventListener("popstate", handleRouteChange);
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
    setMessage("已删除这条存档。");
  }

  const activeArchiveItems = archiveKind ? groupedArchives[archiveKind] : [];

  return (
    <div className="space-y-4">
      <section className="flex items-center gap-3 px-1 pb-2 pt-3">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#ddd2c0] bg-[#f4efe6] shadow-[0_10px_28px_rgba(75,48,27,0.08)]" aria-hidden="true">
          <svg className="h-12 w-12 text-[#9f988e]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.5a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 9c-2.33 0-7 2.33-7 7v4h14v-4c0-4.67-4.67-7-7-7z" />
          </svg>
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-black leading-tight text-[#201b16]">{overview?.user.loginStatus === "active" ? overview.user.name : "未登录"}</h1>
          <p className="mt-1 text-sm font-semibold leading-5 text-[#756a5d]">登录后可购买权益并永久保存存档</p>
        </div>
      </section>

      <section className="panel space-y-4 p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-black">当前权益</h2>
          </div>
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

        <div className="relative overflow-hidden rounded border border-[#c9ad83] bg-[#fffcf7] p-4 shadow-[inset_0_0_0_1px_rgba(184,138,59,0.06),0_8px_18px_rgba(75,48,27,0.04)]">
          {/* Traditional writing lines watermark to fill blank space */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.35]" style={{ backgroundImage: "linear-gradient(rgba(184,138,59,0.08) 1px, transparent 1px)", backgroundSize: "100% 20px" }} />
          
          <p className="relative mb-3 text-xs font-bold text-[#756a5d] tracking-wider">购买权益</p>
          <div className="relative grid gap-3">
            <button className="w-full min-h-[46px] rounded-lg bg-[#8f2f24] hover:bg-[#a63d32] border border-[#721f16] text-[#fffcf7] font-black text-sm shadow-[0_4px_12px_rgba(143,47,36,0.16)] transition active:scale-[0.985] cursor-pointer" onClick={() => buy("bazi_30d")}>
              八字会员 30 天 ￥19.9
            </button>
            <button className="w-full min-h-[46px] rounded-lg bg-[#1f5d57] hover:bg-[#2b756d] border border-[#14443f] text-[#fffcf7] font-black text-sm shadow-[0_4px_12px_rgba(31,93,87,0.16)] transition active:scale-[0.985] cursor-pointer" onClick={() => buy("yijing_3")}>
              易经解读 3 次 ￥9.9
            </button>
          </div>
        </div>
      </section>

      <section className="panel space-y-4 p-4">
        {!archiveKind ? (
          <>
            <h2 className="font-black">我的存档</h2>
            <div className="space-y-3">
              <ArchiveCategoryCard label="八字存档" value={groupedArchives.bazi.length} action="进入八字存档" tone="red" href="/me?archive=bazi" />
              <ArchiveCategoryCard label="易经存档" value={groupedArchives.yijing.length} action="进入易经存档" tone="green" href="/me?archive=yijing" />
            </div>
          </>
        ) : (
          <ArchiveList
            title={archiveKind === "bazi" ? "八字存档" : "易经存档"}
            emptyText={archiveKind === "bazi" ? "还没有八字存档。排盘后可一键保存完整命盘。" : "还没有易经存档。生成深度解读后可一键保存。"}
            items={activeArchiveItems}
            draftNames={draftNames}
            onChangeName={(id, name) => setDraftNames((current) => ({ ...current, [id]: name }))}
            onRename={renameArchive}
            onDelete={removeArchive}
          />
        )}
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
  const isBazi = tone === "red";
  
  const cardStyle = "border-[#c9ad83] bg-gradient-to-br from-[#fffdf9] to-[#faf4e6] shadow-[inset_0_0_0_1px_rgba(184,138,59,0.06),0_8px_18px_rgba(75,48,27,0.03)]";

  return (
    <div className={`relative overflow-hidden rounded border p-3 ${cardStyle}`}>
      {isBazi ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "linear-gradient(135deg, rgba(184,138,59,0.12) 0 1px, transparent 1px 16px)" }} />
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full border border-[#b88a3b]/12" />
          <div className="absolute right-3 top-3 text-[2.5rem] font-black leading-none text-[#b88a3b]/[0.08]">甲子</div>
          <div className="absolute bottom-3 right-3 grid grid-cols-2 overflow-hidden rounded border border-[#b88a3b]/8 text-[0.55rem] font-black leading-none text-[#b88a3b]/15">
            <span className="border-b border-r border-[#b88a3b]/8 px-1.5 py-1">年</span>
            <span className="border-b border-[#b88a3b]/8 px-1.5 py-1">月</span>
            <span className="border-r border-[#b88a3b]/8 px-1.5 py-1">日</span>
            <span className="px-1.5 py-1">时</span>
          </div>
        </div>
      ) : (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "linear-gradient(45deg, rgba(184,138,59,0.12) 0 1px, transparent 1px 15px)" }} />
          <div className="absolute -right-7 -top-7 h-24 w-24 rounded-full border border-[#b88a3b]/12" />
          <div className="absolute right-4 top-3 text-[3.1rem] font-black leading-none text-[#b88a3b]/[0.08]">易</div>
          <div className="absolute bottom-3 right-3 grid gap-1.5 opacity-[0.16]">
            <span className="h-1 w-12 rounded-full bg-[#b88a3b]" />
            <span className="flex w-12 justify-between">
              <i className="h-1 w-5 rounded-full bg-[#b88a3b]" />
              <i className="h-1 w-5 rounded-full bg-[#b88a3b]" />
            </span>
            <span className="h-1 w-12 rounded-full bg-[#b88a3b]" />
            <span className="flex w-12 justify-between">
              <i className="h-1 w-5 rounded-full bg-[#b88a3b]" />
              <i className="h-1 w-5 rounded-full bg-[#b88a3b]" />
            </span>
            <span className="h-1 w-12 rounded-full bg-[#b88a3b]" />
            <span className="flex w-12 justify-between">
              <i className="h-1 w-5 rounded-full bg-[#b88a3b]" />
              <i className="h-1 w-5 rounded-full bg-[#b88a3b]" />
            </span>
          </div>
        </div>
      )}
      <div className="relative">
        <p className={`text-lg font-black leading-6 ${color}`}>{label}</p>
        <p className="mt-2 text-2xl font-black !text-[#201b16]">{value}</p>
        <p className="mt-1 text-xs leading-5 text-[#756a5d]">{detail}</p>
      </div>
    </div>
  );
}

function ArchiveCategoryCard({ label, value, action, tone, href }: { label: string; value: number; action: string; tone: "red" | "green"; href: string }) {
  const color = tone === "red" ? "text-[#8f2f24]" : "text-[#1f5d57]";
  const isRed = tone === "red";
  
  const cardStyle = "border-[#c9ad83] bg-gradient-to-br from-[#fffdf9] to-[#faf4e6]";
    
  const actionStyle = "border-[1.5px] border-[#b88a3b] bg-[#f5ebd6] text-[#5c4a37] shadow-[0_2px_8px_rgba(184,138,59,0.06)]";
    
  const mark = isRed ? "命盘" : "卦例";
  const watermarkChar = isRed ? "命" : "卦";
  const watermarkColor = "text-[#b88a3b]/[0.06]";
  
  return (
    <a className={`relative block min-h-[132px] w-full overflow-hidden rounded border p-5 text-left shadow-[0_10px_24px_rgba(75,48,27,0.03)] transition active:scale-[0.99] ${cardStyle}`} href={href}>
      {/* Decorative Watermark */}
      <div 
        className="absolute right-[-1.5rem] top-[-1.5rem] text-[8.5rem] font-normal leading-none pointer-events-none select-none text-[#b88a3b]/[0.14]"
        style={{ fontFamily: '"STXingkai", "Xingkai SC", "华文行楷", "Kaiti SC", "STKaiti", serif' }}
      >
        {watermarkChar}
      </div>
      <div className="pointer-events-none absolute right-[-1.75rem] top-[-1.75rem] h-24 w-24 rounded-full border border-[#eadfce]/30" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 pt-1">
          <span className={`text-xs font-black ${color}`}>{mark}</span>
          <h3 className="mt-1 text-2xl font-black leading-tight text-[#201b16]">{label}</h3>
          <p className="mt-2 text-sm font-bold leading-5 text-[#756a5d]">{value} 条记录</p>
        </div>
      </div>
      <div className={`relative mt-5 flex min-h-12 items-center justify-between rounded-lg px-4 text-base font-black transition-all active:scale-[0.98] ${actionStyle} overflow-hidden`}>
        {/* Inner thin red border to echo the primary red theme */}
        <div className="pointer-events-none absolute inset-0.5 rounded-[6px] border border-[#8f2f24]/30" aria-hidden="true" />

        <span className="relative z-10 truncate">{action}</span>
        <span className="relative z-10 text-2xl leading-none text-[#b88a3b]">›</span>
      </div>
    </a>
  );
}

function ArchiveList({
  title,
  emptyText,
  items,
  draftNames,
  onChangeName,
  onRename,
  onDelete
}: {
  title: string;
  emptyText: string;
  items: ArchiveItem[];
  draftNames: Record<string, string>;
  onChangeName: (id: string, name: string) => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <a className="text-sm font-black text-[#8f2f24]" href="/me">‹ 返回</a>
        <span className="rounded border border-[#e5d8c3] bg-[#fffefa] px-2 py-1 text-xs font-bold text-[#756a5d]">{items.length} 条</span>
      </div>
      <h3 className="text-xl font-black">{title}</h3>
      {items.length ? (
        <div className="space-y-3">
          {items.map((item) => (
            <article className="rounded border border-[#e5d8c3] bg-[#fffefa] p-3 shadow-[0_8px_20px_rgba(75,48,27,0.03)]" key={item.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-[#756a5d]">{formatArchiveDate(item.updatedAt)}</p>
                  <p className="mt-1 font-black leading-6 text-[#201b16]">{item.name || item.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-[#756a5d]">{item.summary}</p>
                </div>
                <a className="shrink-0 rounded border border-[#ddd2c0] px-2 py-1 text-xs font-bold text-[#1f5d57]" href={`/me/archive/${item.id}?from=${item.kind}`}>查看</a>
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
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded border border-dashed border-[#ddd2c0] bg-[#fffdf9]/70 p-3 text-sm leading-6 text-[#756a5d]">{emptyText}</p>
      )}
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
