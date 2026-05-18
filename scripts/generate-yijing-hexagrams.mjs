import { writeFile } from "node:fs/promises";

const upperOrder = ["乾", "兑", "离", "震", "巽", "坎", "艮", "坤"];
const lowerOrder = ["乾", "兑", "离", "震", "巽", "坎", "艮", "坤"];

const names = [
  ["乾为天", "泽天夬", "火天大有", "雷天大壮", "风天小畜", "水天需", "山天大畜", "地天泰"],
  ["天泽履", "兑为泽", "火泽睽", "雷泽归妹", "风泽中孚", "水泽节", "山泽损", "地泽临"],
  ["天火同人", "泽火革", "离为火", "雷火丰", "风火家人", "水火既济", "山火贲", "地火明夷"],
  ["天雷无妄", "泽雷随", "火雷噬嗑", "震为雷", "风雷益", "水雷屯", "山雷颐", "地雷复"],
  ["天风姤", "泽风大过", "火风鼎", "雷风恒", "巽为风", "水风井", "山风蛊", "地风升"],
  ["天水讼", "泽水困", "火水未济", "雷水解", "风水涣", "坎为水", "山水蒙", "地水师"],
  ["天山遁", "泽山咸", "火山旅", "雷山小过", "风山渐", "水山蹇", "艮为山", "地山谦"],
  ["天地否", "泽地萃", "火地晋", "雷地豫", "风地观", "水地比", "山地剥", "坤为地"]
];

const symbols = [
  ["䷀", "䷪", "䷍", "䷡", "䷈", "䷄", "䷙", "䷊"],
  ["䷉", "䷹", "䷥", "䷵", "䷼", "䷻", "䷨", "䷒"],
  ["䷌", "䷰", "䷝", "䷶", "䷤", "䷾", "䷕", "䷣"],
  ["䷘", "䷐", "䷔", "䷲", "䷩", "䷂", "䷚", "䷗"],
  ["䷫", "䷛", "䷱", "䷟", "䷸", "䷯", "䷑", "䷭"],
  ["䷅", "䷮", "䷿", "䷧", "䷺", "䷜", "䷃", "䷆"],
  ["䷠", "䷞", "䷷", "䷽", "䷴", "䷦", "䷳", "䷎"],
  ["䷋", "䷬", "䷢", "䷏", "䷓", "䷇", "䷖", "䷁"]
];

const summaries = {
  乾: "乾卦重在主动、开创与自强。适合把握方向、建立信心，但也提醒不要过度刚强。",
  坤: "坤卦重在承载、包容与顺势。适合稳住基础、配合环境，以柔韧方式推进。",
  屯: "屯卦象征初始艰难。事情刚开始时阻力较多，宜先打基础，不急于求成。",
  蒙: "蒙卦重在启蒙与学习。面对不明朗局面，先求教、明规则，再行动。",
  需: "需卦提示等待时机。条件未足时不宜强推，应积蓄资源、保持耐心。",
  讼: "讼卦提示争执与分歧。宜止争、求证据、留余地，避免把矛盾推到极端。",
  师: "师卦重在组织与纪律。适合整合团队、明确规则，但用力要有节制。",
  比: "比卦重在亲附与合作。寻找可靠同伴比单打独斗更重要，也要辨别关系质量。",
  小畜: "小畜卦提示小有积蓄但未到大成。适合微调、蓄力、等待更成熟的机会。",
  履: "履卦重在谨慎行事。处在压力或礼法边界中，宜守分寸、重礼节。",
  泰: "泰卦象征通达与交流。上下相通时适合推进计划，但也要防盛极转衰。",
  否: "否卦象征闭塞不通。当前宜收敛、守正、保存力量，等待气机转变。",
  同人: "同人卦重在公开合作与同道相应。适合走出小圈子，寻求共同目标。",
  大有: "大有卦象征资源丰盛。机会较多时更要守正用明，避免自满。",
  谦: "谦卦重在谦逊与低位蓄德。越有能力越宜收敛锋芒，反而更容易获得支持。",
  豫: "豫卦提示顺势而动、振奋人心。适合动员和规划，但忌沉溺安逸。",
  随: "随卦重在顺应变化。跟随不是盲从，而是在变化中选择合适节奏。",
  蛊: "蛊卦提示旧弊待整。适合清理积压问题，先修复根基再谈扩张。",
  临: "临卦象征接近与督导。机会渐近，宜主动承担，也要保持敬慎。",
  观: "观卦重在观察与示范。先看清趋势与人心，再决定如何表达立场。",
  噬嗑: "噬嗑卦提示有阻隔需决断。适合处理规则、边界和问题核心。",
  贲: "贲卦重在修饰与文采。外在呈现有帮助，但不可让形式盖过实质。",
  剥: "剥卦象征剥落与消退。宜保守、止损、护住根基，不宜冒进。",
  复: "复卦象征回转与新生。适合从小处恢复秩序，慢慢回到正轨。",
  无妄: "无妄卦重在真实与不妄动。保持本分、减少投机，反而更稳。",
  大畜: "大畜卦提示大积蓄与自我约束。适合深造、储备、等待大用。",
  颐: "颐卦重在滋养与言行。注意输入什么、说出什么，养正比求快重要。",
  大过: "大过卦提示压力过重、结构失衡。要敢于承担，也要及时卸载风险。",
  坎: "坎卦象征险中求通。处在反复压力中，宜守信、稳步穿越。",
  离: "离卦重在依附与明察。需要找到可依托的结构，也要保持清明判断。",
  咸: "咸卦重在感应与互动。关系和合作可被触动，但要真诚而不过度用力。",
  恒: "恒卦重在长久与稳定。方向确定后贵在持续，不宜频繁摇摆。",
  遁: "遁卦提示适时退避。退不是失败，而是保存主动权与空间。",
  大壮: "大壮卦象征力量增长。气势足时更要守正，避免强行压人。",
  晋: "晋卦象征上升与显明。适合展示成果、争取认可，但要光明正大。",
  明夷: "明夷卦提示光明受伤。环境不利时宜内敛、守心、避免锋芒太露。",
  家人: "家人卦重在内部秩序。先理顺身边关系和分工，再向外扩展。",
  睽: "睽卦提示差异与分离。观点不同未必不可合作，宜求小同存大异。",
  蹇: "蹇卦象征行路艰难。遇阻时宜转向求助，不要硬闯。",
  解: "解卦象征松解与释放。紧张局面开始化开，宜及时处理遗留问题。",
  损: "损卦重在减损与取舍。主动减少不必要消耗，反而利于长期平衡。",
  益: "益卦象征增益与助人。适合投入、成长、互惠，但要用在正处。",
  夬: "夬卦提示决断。需要公开、清楚地处理问题，但忌情绪化决裂。",
  姤: "姤卦象征相遇与突发。新机会来得快，宜先辨别其性质。",
  萃: "萃卦重在聚合。适合聚人、聚资源，也要有中心和规则。",
  升: "升卦象征渐进上升。循序累积、借助贵人与平台，比急进更好。",
  困: "困卦象征受限。外部条件不畅时，守住内在原则和表达很重要。",
  井: "井卦重在稳定供养。基础资源一直存在，关键在于制度和使用方式。",
  革: "革卦象征变革。改变要有时机和公信力，不能只凭情绪推动。",
  鼎: "鼎卦重在更新与承载。适合重组资源、建立新秩序，让能力被看见。",
  震: "震卦象征震动与警醒。突发变化会带来压力，也能唤醒行动力。",
  艮: "艮卦重在停止与边界。该停时停，先稳住身心和位置。",
  渐: "渐卦象征渐进。关系、事业或计划都适合按步骤推进。",
  归妹: "归妹卦提示关系位置不正。宜谨慎承诺，先理清角色与期待。",
  丰: "丰卦象征盛大与明亮。机会和信息很多，要抓重点，防盛后转衰。",
  旅: "旅卦象征在外与暂居。宜谨慎、守礼、少依赖不稳定环境。",
  巽: "巽卦重在进入与顺势。柔和渗透比强硬推进更有效。",
  兑: "兑卦象征喜悦与沟通。适合表达、协商，但不可只求表面愉快。",
  涣: "涣卦提示涣散后重聚。先化解隔阂，再重新建立共同方向。",
  节: "节卦重在节制与规则。适度限制带来自由，过度限制则成压力。",
  中孚: "中孚卦重在诚信。真诚和信任是推进关系与计划的核心。",
  小过: "小过卦提示小事可行、大事宜慎。适合低姿态处理细节。",
  既济: "既济卦象征已成。事情看似完成，仍要防止后续失衡。",
  未济: "未济卦象征未完成。局面仍在过渡，宜调整节奏，谨慎收尾。"
};

const pageNameOverrides = {
  遁: "遯"
};

const judgementNameOverrides = {
  坎: "习坎"
};

function shortName(name) {
  if (name.includes("为")) return name.split("为")[0];
  return name.slice(2);
}

function decodeHtml(text) {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchHexagram(name) {
  const briefName = shortName(name);
  const pageName = pageNameOverrides[briefName] ?? briefName;
  const judgementName = judgementNameOverrides[briefName] ?? briefName;
  const url = `https://zh.wikisource.org/zh-hans/${encodeURIComponent(`周易/${pageName}`)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${name}: ${response.status}`);
  const html = await response.text();
  const blueTexts = [...html.matchAll(/<span style="color:blue">([\s\S]*?)<\/span>/g)]
    .map((match) => decodeHtml(match[1]))
    .filter((text) => text && text !== "易经：");
  const judgement =
    blueTexts.find((text) => text.startsWith(`${judgementName}：`)) ??
    blueTexts.find((text) => text.startsWith(judgementName) && !/^(初|九|六|上)/.test(text)) ??
    blueTexts.find((text) => text.startsWith(briefName) && !/^(初|九|六|上)/.test(text));
  const lines = blueTexts.filter((text) => /^(初|九|六|上)/.test(text)).slice(0, 6);
  if (!judgement || lines.length !== 6) {
    throw new Error(`Missing text for ${name}: judgement=${judgement}, lines=${lines.length}`);
  }

  const tuan = decodeHtml(html.match(/<b>彖曰：<\/b>[\s\S]*?<ul><li>([\s\S]*?)<\/li><\/ul>/)?.[1] ?? "");
  const imageBlock = html.match(/<b>象曰：<\/b>[\s\S]*?<ul><li>([\s\S]*?)<\/li><\/ul>\s*<ol>([\s\S]*?)<\/ol>/);
  const image = decodeHtml(imageBlock?.[1] ?? "");
  const lineAnalyses = [...(imageBlock?.[2] ?? "").matchAll(/<li>([\s\S]*?)<\/li>/g)]
    .map((match) => decodeHtml(match[1]))
    .slice(0, 6);

  return {
    judgement,
    lines,
    analysis: summaries[briefName] ?? `${name}提示观察变化中的主次关系，宜审时度势、稳妥推进。`,
    classicalNote: [tuan, image].filter(Boolean).join(" "),
    lineAnalyses: lineAnalyses.length === 6 ? lineAnalyses : lines.map((line) => `${line} 此爻提示结合所处位置，谨慎观察当前变化。`)
  };
}

const entries = [];
for (const [upperIndex, upper] of upperOrder.entries()) {
  for (const [lowerIndex, lower] of lowerOrder.entries()) {
    const name = names[lowerIndex][upperIndex];
    const fetched = await fetchHexagram(name);
    entries.push({
      key: `${upper}-${lower}`,
      name,
      symbol: symbols[lowerIndex][upperIndex],
      ...fetched
    });
  }
}

const source = `import type { HexagramText, TrigramName } from "./types";

export const HEXAGRAMS: Record<string, HexagramText> = ${JSON.stringify(
  Object.fromEntries(entries.map(({ key, ...value }) => [key, value])),
  null,
  2
)};

export function getHexagram(upper: TrigramName, lower: TrigramName): HexagramText {
  const hexagram = HEXAGRAMS[\`\${upper}-\${lower}\`];
  if (!hexagram) {
    throw new Error(\`Missing hexagram for \${upper}-\${lower}\`);
  }
  return hexagram;
}
`;

await writeFile("features/yijing/engine/hexagrams.ts", source);
