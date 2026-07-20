import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/session";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { pin } = await req.json();
  const shop = await db.query.shops.findFirst({ where: eq(shops.userId, userId) });
  if (!shop || !shop.pin) return NextResponse.json({ valid: true }); // No PIN set

  const valid = await bcrypt.compare(String(pin), shop.pin);
  return NextResponse.json({ valid });
}
