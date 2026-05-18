import { NextResponse } from "next/server";
import { createOrder } from "@/lib/payment/create-order";

export async function POST(request: Request) {
  try {
    const { productType } = await request.json();
    return NextResponse.json(createOrder(productType));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "创建订单失败。" }, { status: 400 });
  }
}
