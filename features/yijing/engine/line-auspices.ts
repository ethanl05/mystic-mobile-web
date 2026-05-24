import { HEXAGRAMS } from "./hexagrams";

export type LineAuspiceMain = "吉" | "凶" | "无咎";

export type LineAuspice = {
  main: LineAuspiceMain;
  classicalLabel: string;
  hint?: string;
};

type LineAuspiceTuple = [LineAuspice, LineAuspice, LineAuspice, LineAuspice, LineAuspice, LineAuspice];

const auspiceKeywords = /元吉|大吉|贞吉|終吉|终吉|征吉|居吉|吉无不利|吉|凶|无大咎|无咎|何其咎|何咎|无悔|悔亡|有悔|悔|吝|厉|眚|灾|不利|无攸利|无不利|有喜|亨/g;
const noFaultPattern = /无大咎|无咎|何其咎|何咎|无悔|悔亡/;
const favorablePattern = /元吉|大吉|贞吉|終吉|终吉|征吉|居吉|吉无不利|吉|无不利|有喜|亨|利有攸往|利见大人|利贞/;
const unfavorablePattern = /凶|吝|厉|有悔|悔|咎|眚|灾|不利|无攸利/;

function stripLineName(lineText: string): string {
  return lineText.replace(/^(初[九六]|[九六][二三四五]|上[九六])[：，]/, "").replace(/[。.]$/, "");
}

function extractClassicalLabel(lineText: string): string {
  const body = stripLineName(lineText);
  const segments = body.split(/[；;]/);
  const keywordParts = segments.flatMap((segment) =>
    segment
      .split(/[，,]/)
      .map((part) => part.trim())
      .filter((part) => {
        auspiceKeywords.lastIndex = 0;
        return auspiceKeywords.test(part);
      })
  );

  if (keywordParts.length) return keywordParts.join("，");
  return body.split(/[，,；;]/)[0]?.trim() || body;
}

function classifyMain(lineText: string): LineAuspiceMain {
  const body = stripLineName(lineText);
  const clauses = body
    .split(/[，,；;]/)
    .map((clause) => clause.trim())
    .filter(Boolean);

  for (const clause of clauses.slice().reverse()) {
    if (favorablePattern.test(clause)) return "吉";
    if (noFaultPattern.test(clause)) return "无咎";

    const withoutNoFault = clause.replace(/无大咎|无咎|何其咎|何咎|无悔|悔亡/g, "");
    const withoutFavorable = withoutNoFault.replace(/无不利|吉无不利/g, "");
    if (unfavorablePattern.test(withoutFavorable)) return "凶";
  }

  if (noFaultPattern.test(body)) return "无咎";
  if (favorablePattern.test(body)) return "吉";

  return "无咎";
}

function buildHint(main: LineAuspiceMain, classicalLabel: string): string {
  if (main === "吉") return `原文见“${classicalLabel}”，偏向顺势可成。`;
  if (main === "凶") return `原文见“${classicalLabel}”，提示宜慎动避险。`;
  return `原文见“${classicalLabel}”，重在守正补过。`;
}

function buildLineAuspice(lineText: string): LineAuspice {
  const main = classifyMain(lineText);
  const classicalLabel = extractClassicalLabel(lineText);
  return {
    main,
    classicalLabel,
    hint: buildHint(main, classicalLabel)
  };
}

export const LINE_AUSPICES: Record<string, LineAuspiceTuple> = Object.fromEntries(
  Object.entries(HEXAGRAMS).map(([key, hexagram]) => [key, hexagram.lines.map(buildLineAuspice) as LineAuspiceTuple])
) as Record<string, LineAuspiceTuple>;

export function getLineAuspice(hexagramKey: string, movingLine: 1 | 2 | 3 | 4 | 5 | 6): LineAuspice {
  const hexagram = LINE_AUSPICES[hexagramKey];
  if (!hexagram) throw new Error(`未找到卦象断语：${hexagramKey}`);
  return hexagram[movingLine - 1];
}
