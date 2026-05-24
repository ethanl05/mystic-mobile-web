import { getHexagram } from "./hexagrams";
import { getLineAuspice } from "./line-auspices";
import {
  normalizeMovingLine,
  normalizeTrigramNumber,
  trigramFromLines,
  TRIGRAM_BY_NUMBER,
  TRIGRAM_LINES
} from "./trigrams";
import type { YijingInput, YijingResult } from "./types";

function assertYijingInput(input: YijingInput) {
  if (!Array.isArray(input.numbers) || input.numbers.length !== 3) {
    throw new Error("请输入三个数字。");
  }
  for (const value of input.numbers) {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error("数字必须是 0 或正整数，并且不能超过安全整数范围。");
    }
  }
}

export function calculateHexagram(input: YijingInput): YijingResult {
  assertYijingInput(input);

  const upperNumber = normalizeTrigramNumber(input.numbers[0]);
  const lowerNumber = normalizeTrigramNumber(input.numbers[1]);
  const movingLine = normalizeMovingLine(input.numbers[2]);
  const upperTrigram = TRIGRAM_BY_NUMBER[upperNumber];
  const lowerTrigram = TRIGRAM_BY_NUMBER[lowerNumber];
  const primaryKey = `${upperTrigram}-${lowerTrigram}`;
  const primary = getHexagram(upperTrigram, lowerTrigram);

  const lines = [...TRIGRAM_LINES[lowerTrigram], ...TRIGRAM_LINES[upperTrigram]] as [
    0 | 1,
    0 | 1,
    0 | 1,
    0 | 1,
    0 | 1,
    0 | 1
  ];
  const changedLines = [...lines] as [0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1];
  changedLines[movingLine - 1] = changedLines[movingLine - 1] === 1 ? 0 : 1;
  const changedLower = trigramFromLines(changedLines.slice(0, 3) as [0 | 1, 0 | 1, 0 | 1]);
  const changedUpper = trigramFromLines(changedLines.slice(3, 6) as [0 | 1, 0 | 1, 0 | 1]);
  const changed = getHexagram(changedUpper, changedLower);

  const mutualLower = trigramFromLines(lines.slice(1, 4) as [0 | 1, 0 | 1, 0 | 1]);
  const mutualUpper = trigramFromLines(lines.slice(2, 5) as [0 | 1, 0 | 1, 0 | 1]);
  const mutual = getHexagram(mutualUpper, mutualLower);

  return {
    upperTrigram,
    lowerTrigram,
    primaryHexagram: primary.name,
    primarySymbol: primary.symbol,
    movingLine,
    changedHexagram: changed.name,
    changedSymbol: changed.symbol,
    mutualHexagram: mutual.name,
    mutualSymbol: mutual.symbol,
    judgement: primary.judgement,
    lineText: primary.lines[movingLine - 1],
    lineAuspice: getLineAuspice(primaryKey, movingLine),
    analysis: primary.analysis,
    classicalNote: primary.classicalNote,
    lineAnalysis: primary.lineAnalyses[movingLine - 1],
    calculationTrace: {
      upperNumber,
      lowerNumber,
      movingLineNumber: movingLine
    }
  };
}
