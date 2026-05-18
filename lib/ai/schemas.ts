export type InterpretationReport = {
  title: string;
  summary: string;
  sections: Array<{ heading: string; body: string }>;
  actionSuggestions: string[];
  disclaimer: string;
};

export type InterpretationRequest = {
  mode: "bazi" | "yijing";
  computedResult: unknown;
  userContext: {
    focusArea: string;
    questionText?: string;
  };
  safetyPolicy: {
    noDeterministicPrediction: true;
    noMedicalLegalFinancialDirective: true;
    tone: "traditional_culture_reflective";
  };
};
