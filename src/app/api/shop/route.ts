import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/session";
import bcrypt from "bcryptjs";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await db.query.shops.findFirst({ where: eq(shops.userId, userId) });
  return NextResponse.json({ shop: shop ?? null });
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const existing = await db.query.shops.findFirst({ where: eq(shops.userId, userId) });

  if (existing) {
    return NextResponse.json({ error: "Shop already exists" }, { status: 400 });
  }

  // Hash PIN if provided
  let hashedPin: string | undefined;
  if (body.pin) {
    hashedPin = await bcrypt.hash(body.pin, 10);
  }

  const [shop] = await db
    .insert(shops)
    .values({
      userId,
      shopName: body.shopName,
      shopType: body.shopType,
      language: body.language ?? "en",
      pin: hashedPin,
      gpayUpi: body.gpayUpi ?? null,
      taxEnabled: body.taxEnabled ?? false,
      taxPercent: body.taxPercent ?? "0",
      monthlySalesReport: body.monthlySalesReport ?? false,
      weeklySalesReport: body.weeklySalesReport ?? false,
      printInvoice: body.printInvoice ?? false,
      setupDone: true,
    })
    .returning();

  return NextResponse.json({ shop });
}

export async function PUT(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const existing = await db.query.shops.findFirst({ where: eq(shops.userId, userId) });
  if (!existing) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const updateData: Partial<typeof shops.$inferInsert> = {};
  if (body.shopName !== undefined) updateData.shopName = body.shopName;
  if (body.shopType !== undefined) updateData.shopType = body.shopType;
  if (body.language !== undefined) updateData.language = body.language;
  if (body.gpayUpi !== undefined) updateData.gpayUpi = body.gpayUpi;
  if (body.taxEnabled !== undefined) updateData.taxEnabled = body.taxEnabled;
  if (body.taxPercent !== undefined) updateData.taxPercent = body.taxPercent;
  if (body.monthlySalesReport !== undefined) updateData.monthlySalesReport = body.monthlySalesReport;
  if (body.weeklySalesReport !== undefined) updateData.weeklySalesReport = body.weeklySalesReport;
  if (body.printInvoice !== undefined) updateData.printInvoice = body.printInvoice;
  if (body.pin !== undefined && body.pin !== "") {
    updateData.pin = await bcrypt.hash(body.pin, 10);
  }
  updateData.updatedAt = new Date();

  const [updated] = await db.update(shops).set(updateData).where(eq(shops.userId, userId)).returning();
  return NextResponse.json({ shop: updated });
}
