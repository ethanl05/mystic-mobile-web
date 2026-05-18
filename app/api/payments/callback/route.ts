import { NextResponse } from "next/server";
import { handlePaymentCallback } from "@/lib/payment/handle-callback";

export async function POST(request: Request) {
  try {
    const { orderNo, transactionId } = await request.json();
    return NextResponse.json(handlePaymentCallback(orderNo, transactionId));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "支付回调处理失败。" }, { status: 400 });
  }
}
