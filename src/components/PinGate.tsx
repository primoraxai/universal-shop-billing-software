"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { useShop } from "@/contexts/ShopContext";
import toast from "react-hot-toast";

interface PinGateProps {
  onVerified: () => void;
}

export function PinGate({ onVerified }: PinGateProps) {
  const { tr, shop } = useShop();
  const [pin, setPin] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    if (!pin || pin.length !== 4) { setError("Enter 4-digit PIN"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/shop/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (data.valid) {
        onVerified();
      } else {
        setError(tr.wrongPin || "Wrong PIN. Try again.");
        setPin("");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm flex flex-col items-center gap-6">
        <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center">
          <Lock className="w-8 h-8 text-indigo-600" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">{tr.pinRequired || "PIN Required"}</h2>
          <p className="text-gray-500 text-sm mt-1">{shop?.shopName} — {tr.enterPin || "Enter PIN to continue"}</p>
        </div>

        <div className="w-full relative">
          <input
            type={show ? "text" : "password"}
            maxLength={4}
            value={pin}
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 4)); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            placeholder="••••"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-4 text-center text-3xl tracking-[1em] focus:outline-none focus:border-indigo-500 transition-colors pr-12"
            autoFocus
          />
          <button
            onClick={() => setShow(!show)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {error && <p className="text-red-500 text-sm font-medium -mt-2">{error}</p>}

        {/* PIN Pad */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((k, i) => (
            <button
              key={i}
              onClick={() => {
                if (k === "⌫") { setPin(p => p.slice(0,-1)); setError(""); }
                else if (k !== "") { setPin(p => p.length < 4 ? p + String(k) : p); setError(""); }
              }}
              className={`h-14 rounded-xl text-xl font-bold transition-all ${
                k === "" ? "invisible" :
                k === "⌫" ? "bg-red-50 text-red-500 hover:bg-red-100" :
                "bg-gray-50 text-gray-800 hover:bg-indigo-50 hover:text-indigo-600 active:scale-95"
              }`}
            >
              {k}
            </button>
          ))}
        </div>

        <button
          onClick={handleVerify}
          disabled={loading || pin.length !== 4}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Unlock"}
        </button>
      </div>
    </div>
  );
}
