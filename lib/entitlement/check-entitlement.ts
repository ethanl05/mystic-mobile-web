import { store } from "@/lib/store/memory";

export function hasBaziMembership(): boolean {
  return new Date(store.entitlement.baziMembershipExpiresAt).getTime() > Date.now();
}

export function getYijingCredits(): number {
  return store.entitlement.yijingCredits;
}
