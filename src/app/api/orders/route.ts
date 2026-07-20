import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, shops } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/session";

async function getShopId(userId: string): Promise<string | null> {
  const shop = await db.query.shops.findFirst({ where: eq(shops.userId, userId) });
  return shop?.id ?? null;
}

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shopId = await getShopId(userId);
  if (!shopId) return NextResponse.json({ orders: [] });

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter"); // today | week | month | all

  const now = new Date();
  let fromDate: Date | null = null;

  if (filter === "today") {
    fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (filter === "week") {
    fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (filter === "month") {
    fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const conditions = fromDate
    ? and(eq(orders.shopId, shopId), gte(orders.createdAt, fromDate))
    : eq(orders.shopId, shopId);

  const result = await db.query.orders.findMany({
    where: conditions,
    orderBy: (o, { desc }) => [desc(o.createdAt)],
  });

  return NextResponse.json({ orders: result });
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shopId = await getShopId(userId);
  if (!shopId) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const [order] = await db
    .insert(orders)
    .values({
      shopId,
      items: body.items,
      subtotal: body.subtotal,
      taxAmount: body.taxAmount ?? "0",
      total: body.total,
      status: "pending",
      paymentMethod: body.paymentMethod ?? "cash",
    })
    .returning();

  return NextResponse.json({ order });
}
