import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/session";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const [order] = await db
    .update(orders)
    .set({
      status: "paid",
      paymentMethod: body.paymentMethod ?? "cash",
      paidAt: new Date(),
    })
    .where(eq(orders.id, id))
    .returning();

  return NextResponse.json({ order });
}
