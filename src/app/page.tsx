"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useShop } from "@/contexts/ShopContext";
import { Store, Loader2 } from "lucide-react";

export default function HomePage() {
  const { data: session, status } = useSession();
  const { shop, loading } = useShop();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading" || loading) return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (!shop || !shop.setupDone) {
      router.push("/setup");
      return;
    }

    router.push("/dashboard");
  }, [session, status, shop, loading, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700">
      <div className="flex flex-col items-center gap-4 text-white">
        <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
          <Store className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold">ShopBill Pro</h1>
        <Loader2 className="w-8 h-8 animate-spin mt-2 text-white/70" />
      </div>
    </div>
  );
}
