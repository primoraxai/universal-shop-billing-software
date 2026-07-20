import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { menuItems, shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/session";

async function getShopId(userId: string): Promise<string | null> {
  const shop = await db.query.shops.findFirst({ where: eq(shops.userId, userId) });
  return shop?.id ?? null;
}

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shopId = await getShopId(userId);
  if (!shopId) return NextResponse.json({ items: [] });

  const items = await db.query.menuItems.findMany({ where: eq(menuItems.shopId, shopId) });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shopId = await getShopId(userId);
  if (!shopId) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const [item] = await db
    .insert(menuItems)
    .values({
      shopId,
      name: body.name,
      price: body.price,
      imageUrl: body.imageUrl ?? null,
      category: body.category ?? "General",
      available: body.available ?? true,
    })
    .returning();

  return NextResponse.json({ item });
}
