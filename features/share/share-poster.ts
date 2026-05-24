"use client";

import type { BaziChart, ElementName, Pillar } from "@/features/bazi/engine/types";
import type { YijingResult } from "@/features/yijing/engine/types";

export type SharePosterInput =
  | {
      kind: "bazi";
      chart: BaziChart;
      fateSummary?: string;
      reportSummary?: string;
      createdAt?: string;
      url?: string;
    }
  | {
      kind: "yijing";
      result: YijingResult;
      reportSummary?: string;
      questionText?: string;
      createdAt?: string;
      url?: string;
    };

const posterWidth = 1080;
const posterHeight = 1440;
const fontFamily = `"Songti SC", STSong, SimSun, "Noto Serif SC", serif`;
const elementLabel: Record<ElementName, string> = {
  wood: "木",
  fire: "火",
  earth: "土",
  metal: "金",
  water: "水"
};

export async function createSharePoster(input: SharePosterInput): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = posterWidth;
  canvas.height = posterHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("当前浏览器无法生成分享图。");

  drawBase(ctx, input.kind);
  if (input.kind === "bazi") drawBaziPoster(ctx, input);
  else drawYijingPoster(ctx, input);

  const blob = await canvasToBlob(canvas);
  return new File([blob], `${buildSharePosterTitle(input)}.png`, { type: "image/png" });
}

export function buildSharePosterTitle(input: SharePosterInput) {
  return input.kind === "bazi" ? "玄问-八字命盘" : "玄问-易经卦象";
}

function drawBase(ctx: CanvasRenderingContext2D, kind: SharePosterInput["kind"]) {
  const accent = kind === "bazi" ? "#8f2f24" : "#1f5d57";
  const second = kind === "bazi" ? "#1f5d57" : "#8f2f24";
  const gradient = ctx.createLinearGradient(0, 0, 0, posterHeight);
  gradient.addColorStop(0, "#fbf4e8");
  gradient.addColorStop(1, "#eadcc5");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, posterWidth, posterHeight);

  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = "#b88a3b";
  ctx.lineWidth = 1;
  for (let x = 66; x < posterWidth; x += 54) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, posterHeight);
    ctx.stroke();
  }
  for (let y = 84; y < posterHeight; y += 54) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(posterWidth, y);
    ctx.stroke();
  }
  ctx.restore();

  drawRing(ctx, 880, 184, 164, accent, 0.16);
  drawRing(ctx, 930, 1250, 220, second, 0.1);
  drawRoundedRect(ctx, 46, 46, 988, 1348, 42, "rgba(255,250,241,0.64)", "rgba(184,138,59,0.38)", 2);
  drawTopBar(ctx, kind);
}

function drawTopBar(ctx: CanvasRenderingContext2D, kind: SharePosterInput["kind"]) {
  const label = kind === "bazi" ? "八字命盘" : "易经卦象";
  const accent = kind === "bazi" ? "#8f2f24" : "#1f5d57";
  setFont(ctx, 46, 900);
  ctx.fillStyle = "#201b16";
  ctx.fillText("玄问", 82, 118);

  setFont(ctx, 24, 800);
  drawRoundedRect(ctx, 814, 76, 172, 58, 18, "#fffaf1", "rgba(184,138,59,0.58)", 2);
  ctx.fillStyle = accent;
  ctx.textAlign = "center";
  ctx.fillText(label, 900, 113);
  ctx.textAlign = "left";
}

function drawBaziPoster(ctx: CanvasRenderingContext2D, input: Extract<SharePosterInput, { kind: "bazi" }>) {
  const { chart } = input;
  const summary = clampText(input.fateSummary || input.reportSummary || fallbackBaziSummary(chart), 86);
  const reportSummary = input.reportSummary ? clampText(input.reportSummary, 72) : "";
  const pillars = [
    ["年柱", chart.pillars.year],
    ["月柱", chart.pillars.month],
    ["日柱", chart.pillars.day],
    ["时柱", chart.pillars.hour]
  ] satisfies Array<[string, Pillar | undefined]>;

  drawRoundedRect(ctx, 78, 178, 924, 420, 34, "#fffaf1", "rgba(143,47,36,0.34)", 3);
  setFont(ctx, 25, 900);
  ctx.fillStyle = "#8f2f24";
  ctx.fillText("命局提要", 126, 246);

  const summaryLines = wrapText(ctx, summary, 750, 3, 64, 900);
  setFont(ctx, 64, 900);
  ctx.fillStyle = "#201b16";
  drawLines(ctx, summaryLines, 126, 342, 84);

  drawSeal(ctx, 780, 338, chart.dayMaster, "日主", "#8f2f24");
  setFont(ctx, 25, 900);
  ctx.fillStyle = "#756a5d";
  ctx.fillText(`月令 ${chart.monthOrder} · 空亡 ${chart.voidBranches.join("、") || "无"}`, 126, 536);

  setFont(ctx, 28, 900);
  ctx.fillStyle = "#201b16";
  ctx.fillText("四柱排盘", 82, 680);
  const cardWidth = 222;
  pillars.forEach(([label, pillar], index) => {
    const x = 78 + index * 236;
    drawRoundedRect(ctx, x, 720, cardWidth, 230, 24, "rgba(255,250,241,0.92)", "rgba(221,210,192,0.9)", 2);
    setFont(ctx, 24, 800);
    ctx.fillStyle = index === 2 ? "#8f2f24" : "#756a5d";
    ctx.textAlign = "center";
    ctx.fillText(label, x + cardWidth / 2, 768);
    setFont(ctx, 68, 900);
    ctx.fillStyle = "#201b16";
    ctx.fillText(pillar ? `${pillar.stem}${pillar.branch}` : "--", x + cardWidth / 2, 850);
    setFont(ctx, 23, 800);
    ctx.fillStyle = "#5f5143";
    ctx.fillText(pillar?.tenGod || (index === 2 ? "日主" : "未定"), x + cardWidth / 2, 895);
    setFont(ctx, 20, 700);
    ctx.fillStyle = "#756a5d";
    ctx.fillText(clampText(pillar?.nayin || "时辰未定", 8), x + cardWidth / 2, 925);
    ctx.textAlign = "left";
  });

  drawRoundedRect(ctx, 78, 1010, 924, 202, 28, "rgba(255,248,235,0.88)", "rgba(184,138,59,0.36)", 2);
  drawBaziStat(ctx, 128, 1072, "日主", chart.dayMaster);
  drawBaziStat(ctx, 332, 1072, "月令", chart.monthOrder);
  drawBaziStat(ctx, 536, 1072, "喜用", favoredElements(chart));
  drawBaziStat(ctx, 740, 1072, "空亡", chart.voidBranches.join("") || "无");

  if (reportSummary) {
    setFont(ctx, 24, 900);
    ctx.fillStyle = "#8f2f24";
    ctx.fillText("AI 摘要", 128, 1166);
    const lines = wrapText(ctx, reportSummary, 780, 2, 30, 800);
    setFont(ctx, 30, 800);
    ctx.fillStyle = "#3a3028";
    drawLines(ctx, lines, 128, 1212, 42);
  }

  drawFooter(ctx, input.url);
}

function drawYijingPoster(ctx: CanvasRenderingContext2D, input: Extract<SharePosterInput, { kind: "yijing" }>) {
  const { result } = input;
  const auspice = result.lineAuspice?.main || inferAuspice(result.lineText);
  const classicalLabel = result.lineAuspice?.classicalLabel || result.lineText;
  const insight = clampText(input.reportSummary || result.lineAnalysis || result.analysis, 84);
  const accent = auspice === "凶" ? "#8f2f24" : "#1f5d57";

  drawRoundedRect(ctx, 78, 178, 924, 520, 34, "#fffaf1", "rgba(31,93,87,0.34)", 3);
  setFont(ctx, 25, 900);
  ctx.fillStyle = accent;
  ctx.fillText("动爻断语", 126, 246);

  setFont(ctx, auspice.length > 1 ? 138 : 206, 900);
  ctx.fillStyle = accent;
  ctx.fillText(auspice, 122, 438);

  drawRoundedRect(ctx, 590, 250, 318, 318, 36, "rgba(237,247,244,0.78)", "rgba(191,216,207,0.9)", 2);
  ctx.textAlign = "center";
  setFont(ctx, 134, 900);
  ctx.fillStyle = "#201b16";
  ctx.fillText(result.primarySymbol, 749, 382);
  setFont(ctx, 48, 900);
  ctx.fillText(result.primaryHexagram, 749, 465);
  setFont(ctx, 24, 800);
  ctx.fillStyle = "#756a5d";
  ctx.fillText(`动爻 ${result.movingLine}`, 749, 518);
  ctx.textAlign = "left";

  setFont(ctx, 31, 900);
  ctx.fillStyle = "#201b16";
  const classicalLines = wrapText(ctx, `原典：${clampText(classicalLabel, 42)}`, 760, 2, 31, 900);
  drawLines(ctx, classicalLines, 126, 622, 42);

  setFont(ctx, 28, 900);
  ctx.fillStyle = "#201b16";
  ctx.fillText("卦象结构", 82, 780);
  drawHexStat(ctx, 78, 820, "本卦", `${result.primarySymbol} ${result.primaryHexagram}`, "#1f5d57");
  drawHexStat(ctx, 390, 820, "变卦", `${result.changedSymbol} ${result.changedHexagram}`, "#8f2f24");
  drawHexStat(ctx, 702, 820, "互卦", `${result.mutualSymbol} ${result.mutualHexagram}`, "#756a5d");

  drawRoundedRect(ctx, 78, 1018, 924, 218, 28, "rgba(255,248,235,0.9)", "rgba(184,138,59,0.38)", 2);
  setFont(ctx, 25, 900);
  ctx.fillStyle = accent;
  ctx.fillText(input.reportSummary ? "AI 摘要" : "动爻提示", 126, 1082);
  const lines = wrapText(ctx, insight, 820, 3, 36, 800);
  setFont(ctx, 36, 800);
  ctx.fillStyle = "#3a3028";
  drawLines(ctx, lines, 126, 1140, 48);

  drawFooter(ctx, input.url);
}

function drawBaziStat(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, value: string) {
  setFont(ctx, 22, 800);
  ctx.fillStyle = "#756a5d";
  ctx.fillText(label, x, y);
  setFont(ctx, 40, 900);
  ctx.fillStyle = "#201b16";
  ctx.fillText(clampText(value, 6), x, y + 54);
}

function drawHexStat(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, value: string, color: string) {
  drawRoundedRect(ctx, x, y, 286, 156, 24, "rgba(255,250,241,0.92)", "rgba(221,210,192,0.86)", 2);
  setFont(ctx, 22, 900);
  ctx.fillStyle = color;
  ctx.fillText(label, x + 34, y + 50);
  setFont(ctx, 36, 900);
  ctx.fillStyle = "#201b16";
  ctx.fillText(clampText(value, 9), x + 34, y + 106);
}

function drawFooter(ctx: CanvasRenderingContext2D, url?: string) {
  ctx.save();
  ctx.strokeStyle = "rgba(184,138,59,0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(82, 1304);
  ctx.lineTo(998, 1304);
  ctx.stroke();
  ctx.restore();

  setFont(ctx, 30, 900);
  ctx.fillStyle = "#201b16";
  ctx.fillText("玄问 · 传统文化体验", 82, 1360);
  setFont(ctx, 22, 700);
  ctx.fillStyle = "#756a5d";
  ctx.textAlign = "right";
  ctx.fillText(url ? clampText(url.replace(/^https?:\/\//, ""), 36) : "打开查看完整解读", 998, 1358);
  ctx.textAlign = "left";
}

function drawSeal(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, value: string, label: string, color: string) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, 116, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 9;
  ctx.strokeStyle = "#e2cdaa";
  ctx.stroke();
  ctx.textAlign = "center";
  setFont(ctx, 24, 900);
  ctx.fillStyle = "#fffaf1";
  ctx.fillText(label, centerX, centerY - 42);
  setFont(ctx, 100, 900);
  ctx.fillText(value, centerX, centerY + 58);
  ctx.restore();
  ctx.textAlign = "left";
}

function drawRing(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.62, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillStyle: string,
  strokeStyle?: string,
  lineWidth = 1
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
  ctx.restore();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number, size: number, weight: number) {
  setFont(ctx, size, weight);
  const source = cleanText(text);
  const lines: string[] = [];
  let line = "";

  for (const char of source) {
    const next = line + char;
    if (ctx.measureText(next).width <= maxWidth) {
      line = next;
      continue;
    }
    if (line) lines.push(line);
    line = char;
    if (lines.length === maxLines) break;
  }

  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length > maxLines) lines.length = maxLines;
  if (source.length > lines.join("").length && lines.length) {
    lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[，。；、,.!?！？;：:]$/, "")}...`;
  }
  return lines;
}

function drawLines(ctx: CanvasRenderingContext2D, lines: string[], x: number, y: number, lineHeight: number) {
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
}

function setFont(ctx: CanvasRenderingContext2D, size: number, weight: number) {
  ctx.font = `${weight} ${size}px ${fontFamily}`;
}

function cleanText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function clampText(text: string, maxLength: number) {
  const value = cleanText(text);
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).replace(/[，。；、,.!?！？;：:]$/, "")}...`;
}

function favoredElements(chart: BaziChart) {
  const values = chart.lifeGuideFactors.favorableElements.map((element) => elementLabel[element]);
  return values.length ? values.slice(0, 2).join("") : "平衡";
}

function fallbackBaziSummary(chart: BaziChart) {
  return `生于${chart.monthOrder}月，${chart.dayMaster}日立命，四柱成局。`;
}

function inferAuspice(lineText: string): "吉" | "凶" | "无咎" {
  if (/凶|吝|厉|有悔|悔|眚|灾|不利|无攸利/.test(lineText)) return "凶";
  if (/吉|亨|利有攸往|利见大人|利贞|无不利/.test(lineText)) return "吉";
  return "无咎";
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("分享图生成失败。"));
    }, "image/png", 0.96);
  });
}
