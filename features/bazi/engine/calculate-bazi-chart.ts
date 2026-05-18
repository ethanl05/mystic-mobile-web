import {
  BRANCH_ELEMENT,
  BRANCHES,
  ELEMENT_LABEL,
  HIDDEN_STEMS,
  MONTH_BRANCHES,
  NAYIN,
  STEM_ELEMENT,
  STEM_YANG,
  STEMS,
  TWELVE_STAGES
} from "./constants";
import type { BaziChart, BaziInput, Branch, ElementName, LuckCycle, Pillar, Stem } from "./types";

const monthBoundaryDays = [4, 6, 5, 5, 6, 6, 7, 8, 8, 8, 7, 7];
const monthStemStart: Record<Stem, number> = {
  甲: 2,
  己: 2,
  乙: 4,
  庚: 4,
  丙: 6,
  辛: 6,
  丁: 8,
  壬: 8,
  戊: 0,
  癸: 0
};
const hourStemStart: Record<Stem, number> = {
  甲: 0,
  己: 0,
  乙: 2,
  庚: 2,
  丙: 4,
  辛: 4,
  丁: 6,
  壬: 6,
  戊: 8,
  癸: 8
};

function mod(value: number, size: number): number {
  return ((value % size) + size) % size;
}

function parseDate(input: string): Date {
  const [year, month, day] = input.split("-").map(Number);
  if (!year || !month || !day || year < 1900 || year > 2100) {
    throw new Error("出生日期仅支持 1900-01-01 至 2100-12-31。");
  }
  return new Date(Date.UTC(year, month - 1, day));
}

function jiaziIndex(stem: Stem, branch: Branch): number {
  const stemIndex = STEMS.indexOf(stem);
  const branchIndex = BRANCHES.indexOf(branch);
  for (let index = 0; index < 60; index += 1) {
    if (index % 10 === stemIndex && index % 12 === branchIndex) return index;
  }
  return 0;
}

function pillarFromIndex(index: number, dayMaster?: Stem): Pillar {
  const stem = STEMS[mod(index, 10)];
  const branch = BRANCHES[mod(index, 12)];
  return {
    stem,
    branch,
    tenGod: dayMaster ? getTenGod(dayMaster, stem) : undefined,
    hiddenStems: HIDDEN_STEMS[branch],
    nayin: NAYIN[mod(index, 60)],
    element: STEM_ELEMENT[stem]
  };
}

function getBaziYear(date: Date): number {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  return month < 2 || (month === 2 && day < 4) ? year - 1 : year;
}

function getYearPillar(date: Date): Pillar {
  const baziYear = getBaziYear(date);
  return pillarFromIndex(mod(baziYear - 1984, 60));
}

function getMonthIndex(date: Date): number {
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  let index = month - 2;
  if (day < monthBoundaryDays[month - 1]) index -= 1;
  return mod(index, 12);
}

function getMonthPillar(date: Date, yearStem: Stem): Pillar {
  const monthIndex = getMonthIndex(date);
  const stemIndex = mod(monthStemStart[yearStem] + monthIndex, 10);
  const branch = MONTH_BRANCHES[monthIndex];
  return {
    stem: STEMS[stemIndex],
    branch,
    hiddenStems: HIDDEN_STEMS[branch],
    nayin: NAYIN[jiaziIndex(STEMS[stemIndex], branch)],
    element: STEM_ELEMENT[STEMS[stemIndex]]
  };
}

function getDayPillar(date: Date): Pillar {
  const base = Date.UTC(1984, 1, 2);
  const diffDays = Math.floor((date.getTime() - base) / 86400000);
  return pillarFromIndex(mod(diffDays, 60));
}

function getHourBranchIndex(time?: string): number | undefined {
  if (!time) return undefined;
  const [hour, minute] = time.split(":").map(Number);
  if (!Number.isFinite(hour) || hour < 0 || hour > 23 || !Number.isFinite(minute) || minute < 0 || minute > 59) {
    throw new Error("出生时间格式应为 HH:mm。");
  }
  return Math.floor(((hour + 1) % 24) / 2);
}

function getHourPillar(dayStem: Stem, branchIndex: number): Pillar {
  const stemIndex = mod(hourStemStart[dayStem] + branchIndex, 10);
  const branch = BRANCHES[branchIndex];
  return {
    stem: STEMS[stemIndex],
    branch,
    tenGod: getTenGod(dayStem, STEMS[stemIndex]),
    hiddenStems: HIDDEN_STEMS[branch],
    nayin: NAYIN[jiaziIndex(STEMS[stemIndex], branch)],
    element: STEM_ELEMENT[STEMS[stemIndex]]
  };
}

export function getTenGod(dayMaster: Stem, targetStem: Stem): string {
  const dmElement = STEM_ELEMENT[dayMaster];
  const targetElement = STEM_ELEMENT[targetStem];
  const samePolarity = STEM_YANG[dayMaster] === STEM_YANG[targetStem];
  if (dmElement === targetElement) return samePolarity ? "比肩" : "劫财";

  const cycle: ElementName[] = ["wood", "fire", "earth", "metal", "water"];
  const dm = cycle.indexOf(dmElement);
  const target = cycle.indexOf(targetElement);
  const relation = mod(target - dm, 5);
  if (relation === 1) return samePolarity ? "食神" : "伤官";
  if (relation === 2) return samePolarity ? "偏财" : "正财";
  if (relation === 3) return samePolarity ? "七杀" : "正官";
  return samePolarity ? "偏印" : "正印";
}

function getVoidBranches(day: Pillar): Branch[] {
  const index = jiaziIndex(day.stem, day.branch);
  const xunStart = Math.floor(index / 10) * 10;
  const used = new Set(Array.from({ length: 10 }, (_, offset) => BRANCHES[(xunStart + offset) % 12]));
  return BRANCHES.filter((branch) => !used.has(branch)).slice(0, 2);
}

function getTwelveStages(dayMaster: Stem): Record<string, string> {
  const startByElement: Record<ElementName, number> = { wood: 11, fire: 2, earth: 2, metal: 5, water: 8 };
  const start = startByElement[STEM_ELEMENT[dayMaster]];
  return Object.fromEntries(BRANCHES.map((branch, index) => [branch, TWELVE_STAGES[mod(index - start, 12)]]));
}

function countFiveElements(pillars: Pillar[]): Record<ElementName, number> {
  const counts: Record<ElementName, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  for (const pillar of pillars) {
    counts[STEM_ELEMENT[pillar.stem]] += 1;
    counts[BRANCH_ELEMENT[pillar.branch]] += 1;
    for (const hidden of pillar.hiddenStems) counts[STEM_ELEMENT[hidden]] += 0.5;
  }
  return counts;
}

function buildLuckCycles(input: BaziInput, year: Pillar, month: Pillar, date: Date): LuckCycle[] {
  if (input.gender === "undisclosed" || input.birthTimePrecision === "unknown_hour") return [];
  const forward = STEM_YANG[year.stem] ? input.gender === "male" : input.gender === "female";
  const monthIndex = jiaziIndex(month.stem, month.branch);
  const startAge = 6;
  const startYear = date.getUTCFullYear() + startAge;
  return Array.from({ length: 8 }, (_, index) => ({
    index: index + 1,
    startAge: startAge + index * 10,
    startYear: startYear + index * 10,
    pillar: `${pillarFromIndex(monthIndex + (forward ? index + 1 : -index - 1)).stem}${pillarFromIndex(
      monthIndex + (forward ? index + 1 : -index - 1)
    ).branch}`
  }));
}

function lifeGuideFactors(counts: Record<ElementName, number>): BaziChart["lifeGuideFactors"] {
  const entries = Object.entries(counts) as [ElementName, number][];
  const sorted = [...entries].sort((a, b) => a[1] - b[1]);
  const favorableElements = sorted.slice(0, 2).map(([element]) => element);
  const unfavorableElements = sorted.slice(-2).map(([element]) => element);
  const seasonHints = favorableElements.map((element) => `可多关注${ELEMENT_LABEL[element]}相关的季节、环境与行动节奏。`);
  return { favorableElements, unfavorableElements, seasonHints };
}

export function calculateBaziChart(input: BaziInput): BaziChart {
  const date = parseDate(input.birthDate);
  if (input.timeCorrectionMode === "true_solar_time" && !input.birthPlaceCode) {
    throw new Error("按出生地校正时间需要先选择出生地点。");
  }

  const year = getYearPillar(date);
  const monthBase = getMonthPillar(date, year.stem);
  const day = getDayPillar(date);
  const month = { ...monthBase, tenGod: getTenGod(day.stem, monthBase.stem) };
  const hourIndex = input.birthTimePrecision === "unknown_hour" ? undefined : getHourBranchIndex(input.birthTime);
  const hour = hourIndex === undefined ? undefined : getHourPillar(day.stem, hourIndex);
  const pillars = [year, month, day, hour].filter(Boolean) as Pillar[];
  const tenGods = Object.fromEntries(
    pillars.map((pillar, index) => [["year", "month", "day", "hour"][index], pillar.tenGod ?? getTenGod(day.stem, pillar.stem)])
  );
  const hiddenStems = Object.fromEntries(pillars.map((pillar, index) => [["year", "month", "day", "hour"][index], pillar.hiddenStems]));
  const nayin = Object.fromEntries(pillars.map((pillar, index) => [["year", "month", "day", "hour"][index], pillar.nayin]));
  const fiveElements = countFiveElements(pillars);

  return {
    pillars: { year: { ...year, tenGod: getTenGod(day.stem, year.stem) }, month, day: { ...day, tenGod: "日主" }, hour },
    dayMaster: day.stem,
    fiveElements,
    tenGods,
    hiddenStems,
    nayin,
    twelveStages: getTwelveStages(day.stem),
    voidBranches: getVoidBranches(day),
    monthOrder: month.branch,
    luckCycles: buildLuckCycles(input, year, month, date),
    lifeGuideFactors: lifeGuideFactors(fiveElements)
  };
}
