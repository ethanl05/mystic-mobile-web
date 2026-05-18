import { store } from "@/lib/store/memory";

export function grantEntitlement(productType: string): void {
  if (productType === "bazi_30d" || productType === "bazi_90d") {
    const days = productType === "bazi_30d" ? 30 : 90;
    const current = new Date(store.entitlement.baziMembershipExpiresAt).getTime();
    const start = Math.max(current, Date.now());
    store.entitlement.baziMembershipExpiresAt = new Date(start + days * 86400000).toISOString();
    return;
  }
  const credits: Record<string, number> = { yijing_1: 1, yijing_3: 3, yijing_9: 9 };
  store.entitlement.yijingCredits += credits[productType] ?? 0;
}
