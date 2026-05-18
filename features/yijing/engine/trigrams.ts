import type { TrigramName } from "./types";

export const TRIGRAM_BY_NUMBER: Record<number, TrigramName> = {
  1: "乾",
  2: "兑",
  3: "离",
  4: "震",
  5: "巽",
  6: "坎",
  7: "艮",
  8: "坤"
};

export const TRIGRAM_LINES: Record<TrigramName, [0 | 1, 0 | 1, 0 | 1]> = {
  乾: [1, 1, 1],
  兑: [1, 1, 0],
  离: [1, 0, 1],
  震: [1, 0, 0],
  巽: [0, 1, 1],
  坎: [0, 1, 0],
  艮: [0, 0, 1],
  坤: [0, 0, 0]
};

export function normalizeTrigramNumber(value: number): number {
  const remainder = Math.abs(Math.trunc(value)) % 8;
  return remainder === 0 ? 8 : remainder;
}

export function normalizeMovingLine(value: number): 1 | 2 | 3 | 4 | 5 | 6 {
  const remainder = Math.abs(Math.trunc(value)) % 6;
  return (remainder === 0 ? 6 : remainder) as 1 | 2 | 3 | 4 | 5 | 6;
}

export function trigramFromLines(lines: [0 | 1, 0 | 1, 0 | 1]): TrigramName {
  const found = Object.entries(TRIGRAM_LINES).find(([, candidate]) =>
    candidate.every((line, index) => line === lines[index])
  );
  if (!found) {
    throw new Error(`Unknown trigram lines: ${lines.join("")}`);
  }
  return found[0] as TrigramName;
}
