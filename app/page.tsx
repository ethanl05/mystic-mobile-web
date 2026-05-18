import Link from "next/link";
import type { ReactNode } from "react";

export default function HomePage() {
  return (
    <div className="home-oracle space-y-5 pt-10">
      <header className="home-hero relative overflow-hidden px-1 pb-2 pt-4">
        <CosmicWheel />
        <div className="relative z-[1]">
          <div className="max-w-full">
            <h1 className="home-title">生辰八字 易经数字卦</h1>
          </div>
        </div>
        <TalismanRail />
      </header>

      <section className="grid gap-5">
        <HomeEntryCard
          href="/bazi"
          variant="bazi"
          title="生辰八字"
          subtitle="排四柱，观五行"
          description="录入生辰与出生地，排定年、月、日、时四柱，参看十神、大运与日常宜向。"
          accent="text-[#b88a3b]"
          visual={<FourPillarVisual />}
        />
        <HomeEntryCard
          href="/yijing"
          variant="yijing"
          title="易经数字卦"
          subtitle="心有所问，数字成卦"
          description="取当下所感三数，依先天八卦成象，观本卦、动爻与所问之机。"
          accent="text-[#1f5d57]"
          visual={<HexagramVisual />}
        />
      </section>

    </div>
  );
}

function HomeEntryCard({
  href,
  variant,
  title,
  subtitle,
  description,
  accent,
  visual
}: {
  href: string;
  variant: "bazi" | "yijing";
  title: string;
  subtitle: string;
  description: string;
  accent: string;
  visual: ReactNode;
}) {
  return (
    <Link href={href} className={`home-entry-card home-entry-card-${variant} panel group relative block min-h-[12.8rem] overflow-hidden p-5`}>
      <div className="home-card-orbit" aria-hidden="true" />
      <div className="relative flex h-full min-h-[10rem] items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[2.26rem] font-[950] leading-tight text-[#201b16]">{title}</h2>
          <div className={`mt-2 text-lg font-extrabold leading-snug ${accent}`}>{subtitle}</div>
          <p className="mt-2 text-sm leading-6 text-[#756a5d]">{description}</p>
        </div>
        <div className="shrink-0">{visual}</div>
      </div>
    </Link>
  );
}

function CosmicWheel() {
  const marks = ["乾", "坤", "震", "艮", "离", "坎", "兑", "巽"];

  return (
    <div className="home-cosmic-wheel" aria-hidden="true">
      <div className="home-cosmic-core">☷</div>
      {marks.map((mark, index) => (
        <span className={`home-cosmic-mark home-cosmic-mark-${index}`} key={mark}>
          {mark}
        </span>
      ))}
    </div>
  );
}

function TalismanRail() {
  const stems = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛"];

  return (
    <div className="home-talisman-rail" aria-hidden="true">
      {stems.map((stem) => (
        <span key={stem}>{stem}</span>
      ))}
    </div>
  );
}

function FourPillarVisual() {
  const pillars = ["年", "月", "日", "时"];
  return (
    <div className="home-pillar-visual grid w-20 grid-cols-2 gap-1.5 rounded border border-[#eadfce] bg-white/70 p-2">
      {pillars.map((pillar, index) => (
        <div className={`flex h-8 items-center justify-center rounded border text-sm font-black ${index === 2 ? "border-[#8f2f24]/30 bg-[#fff2e5] text-[#8f2f24]" : "border-[#eadfce] bg-[#fffaf1] text-[#756a5d]"}`} key={pillar}>
          {pillar}
        </div>
      ))}
    </div>
  );
}

function HexagramVisual() {
  return (
    <div className="home-hexagram-visual flex w-20 flex-col gap-1.5 rounded border border-[#eadfce] bg-white/70 p-3">
      <YaoLine broken={false} />
      <YaoLine broken />
      <YaoLine broken={false} />
      <YaoLine broken={false} />
      <YaoLine broken />
      <YaoLine broken={false} />
    </div>
  );
}

function YaoLine({ broken = false }: { broken?: boolean }) {
  if (broken) {
    return (
      <div className="flex h-1.5 w-full gap-1">
        <span className="h-full flex-1 rounded bg-[#1f5d57]" />
        <span className="h-full flex-1 rounded bg-[#1f5d57]" />
      </div>
    );
  }
  return <span className="block h-1.5 w-full rounded bg-[#201b16]" />;
}
