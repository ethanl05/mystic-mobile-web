import { store } from "@/lib/store/memory";

export function deductYijingCredit(): void {
  if (store.entitlement.yijingCredits <= 0) {
    throw new Error("易经次数不足，请先购买次数包。");
  }
  store.entitlement.yijingCredits -= 1;
}

export function refundYijingCredit(): void {
  store.entitlement.yijingCredits += 1;
}
