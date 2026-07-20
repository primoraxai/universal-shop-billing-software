import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core";

// ─── NextAuth required tables ─────────────────────────────────────────────────

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: integer("expires_at"),
  tokenType: text("token_type"),
  scope: text("scope"),
  idToken: text("id_token"),
  sessionState: text("session_state"),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionToken: text("session_token").unique().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").unique().notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

// ─── Shop / Business ──────────────────────────────────────────────────────────

export const shops = pgTable("shops", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  shopName: text("shop_name").notNull(),
  shopType: text("shop_type").notNull(), // hotel, cafe, department, etc.
  language: text("language").notNull().default("en"),
  pin: text("pin"), // hashed 4-digit PIN
  gpayUpi: text("gpay_upi"), // UPI ID for GPay QR
  // Checklist flags
  taxEnabled: boolean("tax_enabled").notNull().default(false),
  taxPercent: numeric("tax_percent", { precision: 5, scale: 2 }).default("0"),
  monthlySalesReport: boolean("monthly_sales_report").notNull().default(false),
  weeklySalesReport: boolean("weekly_sales_report").notNull().default(false),
  printInvoice: boolean("print_invoice").notNull().default(false),
  // Setup complete
  setupDone: boolean("setup_done").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

// ─── Menu Items ───────────────────────────────────────────────────────────────

export const menuItems = pgTable("menu_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  shopId: uuid("shop_id")
    .notNull()
    .references(() => shops.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  category: text("category").default("General"),
  available: boolean("available").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// ─── Orders ───────────────────────────────────────────────────────────────────

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  shopId: uuid("shop_id")
    .notNull()
    .references(() => shops.id, { onDelete: "cascade" }),
  items: jsonb("items").notNull(), // [{id, name, price, qty}]
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: numeric("tax_amount", { precision: 10, scale: 2 }).default("0"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending | paid
  paymentMethod: text("payment_method").default("cash"), // cash | gpay
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  paidAt: timestamp("paid_at", { mode: "date" }),
});

export type User = typeof users.$inferSelect;
export type Shop = typeof shops.$inferSelect;
export type MenuItem = typeof menuItems.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type NewMenuItem = typeof menuItems.$inferInsert;
export type NewOrder = typeof orders.$inferInsert;
