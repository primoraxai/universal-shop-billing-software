"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useShop } from "@/contexts/ShopContext";
import { useCart } from "@/contexts/CartContext";
import { Store, UtensilsCrossed, BarChart3, Settings, PlusCircle, ShoppingBag, Lock } from "lucide-react";
import Link from "next/link";
import { PinGate } from "@/components/PinGate";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { shop, loading } = useShop();
  const router = useRouter();
  const pathname = usePathname();
  const { itemCount } = useCart();
  const [pinVerified, setPinVerified] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/signin"); return; }
    if (!loading && !shop?.setupDone) { router.push("/setup"); return; }
    setChecking(false);
  }, [status, shop, loading, router]);

  if (status === "loading" || loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Store className="w-12 h-12 text-indigo-500 animate-pulse" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // PIN gate for settings page
  const isSettings = pathname === "/dashboard/settings";
  if (isSettings && shop?.pin && !pinVerified) {
    return <PinGate onVerified={() => setPinVerified(true)} />;
  }

  const navItems = [
    { href: "/dashboard", label: "Menu", icon: UtensilsCrossed },
    { href: "/dashboard/add-item", label: "Add Item", icon: PlusCircle },
    { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-sm leading-none">{shop?.shopName}</h1>
              <p className="text-xs text-gray-400 capitalize">{shop?.shopType}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {itemCount > 0 && (
              <Link href="/dashboard" className="relative">
                <ShoppingBag className="w-6 h-6 text-indigo-500" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {itemCount}
                </span>
              </Link>
            )}
            <img
              src={session?.user?.image ?? ""}
              className="w-8 h-8 rounded-full border-2 border-indigo-200"
              alt={session?.user?.name ?? ""}
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg z-40">
        <div className="max-w-4xl mx-auto flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (item.href === "/dashboard/settings") setPinVerified(false);
                }}
                className={`flex-1 flex flex-col items-center gap-1 py-2 transition-all ${
                  isActive ? "text-indigo-600" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? "text-indigo-600" : ""}`} />
                <span className="text-xs font-medium">{item.label}</span>
                {isActive && <div className="absolute bottom-0 w-8 h-0.5 bg-indigo-500 rounded-t" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
