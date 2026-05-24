import type { BaziChart, BaziInput } from "@/features/bazi/engine/types";
import type { YijingResult } from "@/features/yijing/engine/types";
import type { InterpretationReport } from "@/lib/ai/schemas";

export type EntitlementState = {
  baziMembershipExpiresAt: string;
  yijingCredits: number;
};

export type BaziProfileRecord = {
  id: string;
  userId: string;
  input: BaziInput;
  chart: BaziChart;
  fateSummary?: string;
  report?: InterpretationReport;
  createdAt: string;
  deletedAt?: string;
};

export type YijingCastRecord = {
  id: string;
  userId: string;
  numbers: [number, number, number];
  focusArea?: string;
  questionText?: string;
  result: YijingResult;
  report?: InterpretationReport;
  createdAt: string;
  deletedAt?: string;
};

export type OrderRecord = {
  orderNo: string;
  userId: string;
  productType: string;
  amountCents: number;
  status: "created" | "paid" | "granted";
  createdAt: string;
};

type MemoryStore = {
  entitlement: EntitlementState;
  baziProfiles: Map<string, BaziProfileRecord>;
  yijingCasts: Map<string, YijingCastRecord>;
  orders: Map<string, OrderRecord>;
  processedCallbacks: Set<string>;
};

const globalStore = globalThis as typeof globalThis & { __mysticStore?: MemoryStore };

export const store: MemoryStore =
  globalStore.__mysticStore ??
  (globalStore.__mysticStore = {
    entitlement: {
      baziMembershipExpiresAt: new Date(Date.now() + 90 * 86400000).toISOString(),
      yijingCredits: 9
    },
    baziProfiles: new Map(),
    yijingCasts: new Map(),
    orders: new Map(),
    processedCallbacks: new Set()
  });

export const MOCK_USER_ID = "user_mock";
