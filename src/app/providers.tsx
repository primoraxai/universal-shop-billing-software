"use client";

import { SessionProvider } from "next-auth/react";
import { ShopProvider } from "@/contexts/ShopContext";
import { CartProvider } from "@/contexts/CartContext";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ShopProvider>
        <CartProvider>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: "#1e293b",
                color: "#f1f5f9",
                borderRadius: "12px",
                padding: "12px 20px",
              },
            }}
          />
        </CartProvider>
      </ShopProvider>
    </SessionProvider>
  );
}
