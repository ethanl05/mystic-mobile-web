export type Stem = "甲" | "乙" | "丙" | "丁" | "戊" | "己" | "庚" | "辛" | "壬" | "癸";
export type Branch = "子" | "丑" | "寅" | "卯" | "辰" | "巳" | "午" | "未" | "申" | "酉" | "戌" | "亥";
export type ElementName = "wood" | "fire" | "earth" | "metal" | "water";

export type BaziInput = {
  birthDate: string;
  birthTime?: string;
  birthTimePrecision: "exact" | "unknown_minute" | "unknown_hour";
  birthPlaceCode?: string;
  gender: "male" | "female" | "undisclosed";
  timeCorrectionMode: "beijing_time" | "true_solar_time";
};

export type Pillar = {
  stem: Stem;
  branch: Branch;
  tenGod?: string;
  hiddenStems: Stem[];
  nayin: string;
  element: ElementName;
};

export type LuckCycle = {
  index: number;
  startAge: number;
  startYear: number;
  pillar: string;
};

export type BaziChart = {
  pillars: {
    year: Pillar;
    month: Pillar;
    day: Pillar;
    hour?: Pillar;
  };
  dayMaster: Stem;
  fiveElements: Record<ElementName, number>;
  tenGods: Record<string, string>;
  hiddenStems: Record<string, Stem[]>;
  nayin: Record<string, string>;
  twelveStages: Record<string, string>;
  voidBranches: Branch[];
  monthOrder: Branch;
  luckCycles: LuckCycle[];
  lifeGuideFactors: {
    favorableElements: ElementName[];
    unfavorableElements: ElementName[];
    seasonHints: string[];
  };
};
