"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Shop } from "@/db/schema";
import type { Language } from "@/lib/i18n";
import { getTranslations } from "@/lib/i18n";

interface ShopContextValue {
  shop: Shop | null;
  setShop: (shop: Shop | null) => void;
  refreshShop: () => Promise<void>;
  lang: Language;
  tr: Record<string, string>;
  loading: boolean;
}

const ShopContext = createContext<ShopContextValue>({
  shop: null,
  setShop: () => {},
  refreshShop: async () => {},
  lang: "en",
  tr: {},
  loading: true,
});

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [shop, setShopState] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshShop = useCallback(async () => {
    try {
      const res = await fetch("/api/shop");
      const data = await res.json();
      setShopState(data.shop ?? null);
    } catch {
      setShopState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshShop();
  }, [refreshShop]);

  const setShop = (s: Shop | null) => setShopState(s);

  const lang = (shop?.language as Language) ?? "en";
  const tr = getTranslations(lang);

  return (
    <ShopContext.Provider value={{ shop, setShop, refreshShop, lang, tr, loading }}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  return useContext(ShopContext);
}
