export type TrigramName = "乾" | "兑" | "离" | "震" | "巽" | "坎" | "艮" | "坤";

export type YijingInput = {
  numbers: [number, number, number];
};

export type HexagramText = {
  name: string;
  symbol: string;
  judgement: string;
  lines: [string, string, string, string, string, string];
  analysis: string;
  classicalNote: string;
  lineAnalyses: [string, string, string, string, string, string];
};

export type YijingResult = {
  upperTrigram: TrigramName;
  lowerTrigram: TrigramName;
  primaryHexagram: string;
  primarySymbol: string;
  movingLine: 1 | 2 | 3 | 4 | 5 | 6;
  changedHexagram: string;
  changedSymbol: string;
  mutualHexagram: string;
  mutualSymbol: string;
  judgement: string;
  lineText: string;
  analysis: string;
  classicalNote: string;
  lineAnalysis: string;
  calculationTrace: {
    upperNumber: number;
    lowerNumber: number;
    movingLineNumber: number;
  };
};
