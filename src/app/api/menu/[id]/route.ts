import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { menuItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/session";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const updateData: Partial<typeof menuItems.$inferInsert> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.price !== undefined) updateData.price = body.price;
  if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
  if (body.category !== undefined) updateData.category = body.category;
  if (body.available !== undefined) updateData.available = body.available;

  const [item] = await db.update(menuItems).set(updateData).where(eq(menuItems.id, id)).returning();
  return NextResponse.json({ item });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.delete(menuItems).where(eq(menuItems.id, id));
  return NextResponse.json({ success: true });
}
