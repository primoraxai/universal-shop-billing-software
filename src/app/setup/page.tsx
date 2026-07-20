"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useShop } from "@/contexts/ShopContext";
import toast from "react-hot-toast";
import {
  Store, ChevronRight, ChevronLeft, Check,
  Hotel, Coffee, ShoppingCart, Utensils, Pill, Tv, Shirt,
  CreditCard, BarChart3, FileText, Lock, Smartphone
} from "lucide-react";

const SHOP_TYPES = [
  { value: "hotel", label: "Hotel", icon: Hotel, emoji: "🏨" },
  { value: "restaurant", label: "Restaurant", icon: Utensils, emoji: "🍽️" },
  { value: "cafe", label: "Café", icon: Coffee, emoji: "☕" },
  { value: "departmentStore", label: "Department Store", icon: ShoppingCart, emoji: "🛒" },
  { value: "supermarket", label: "Supermarket", icon: ShoppingCart, emoji: "🏪" },
  { value: "bakery", label: "Bakery", icon: Coffee, emoji: "🥐" },
  { value: "pharmacy", label: "Pharmacy", icon: Pill, emoji: "💊" },
  { value: "electronics", label: "Electronics", icon: Tv, emoji: "📱" },
  { value: "clothing", label: "Clothing Store", icon: Shirt, emoji: "👗" },
  { value: "other", label: "Other", icon: Store, emoji: "🏬" },
];

const STEPS = ["Welcome", "Shop Name", "Shop Type", "Preferences", "GPay Setup", "Set PIN", "Done"];

export default function SetupPage() {
  const { data: session, status } = useSession();
  const { shop, refreshShop } = useShop();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Form state
  const [shopName, setShopName] = useState("");
  const [shopType, setShopType] = useState("");
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxPercent, setTaxPercent] = useState("5");
  const [monthlySalesReport, setMonthlySalesReport] = useState(true);
  const [weeklySalesReport, setWeeklySalesReport] = useState(false);
  const [printInvoice, setPrintInvoice] = useState(false);
  const [gpayUpi, setGpayUpi] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
    if (shop?.setupDone) router.push("/dashboard");
  }, [status, shop, router]);

  const handleNext = () => {
    if (step === 1 && !shopName.trim()) {
      toast.error("Please enter your shop name");
      return;
    }
    if (step === 2 && !shopType) {
      toast.error("Please select your shop type");
      return;
    }
    if (step === 5) {
      if (pin && pin.length !== 4) { toast.error("PIN must be 4 digits"); return; }
      if (pin && pin !== confirmPin) { toast.error("PINs do not match"); return; }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleFinish = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopName, shopType, language, taxEnabled,
          taxPercent: taxEnabled ? taxPercent : "0",
          monthlySalesReport, weeklySalesReport, printInvoice,
          gpayUpi: gpayUpi || null,
          pin: pin || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to save shop");
      await refreshShop();
      setStep(6);
    } catch {
      toast.error("Failed to save shop settings");
    } finally {
      setLoading(false);
    }
  };

  const progressPercent = ((step) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Progress Bar */}
        <div className="h-2 bg-gray-100">
          <div
            className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Step Indicator */}
        <div className="px-8 pt-6 pb-2">
          <p className="text-xs text-gray-400 font-medium tracking-widest uppercase">
            Step {Math.min(step + 1, STEPS.length)} of {STEPS.length}
          </p>
        </div>

        <div className="px-8 pb-8">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="flex flex-col items-center text-center gap-6 py-4">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl">
                <Store className="w-12 h-12 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Welcome to ShopBill Pro!</h2>
                <p className="text-gray-500 mt-2">Hi {session?.user?.name?.split(" ")[0]}! Let&apos;s set up your shop in just a few steps.</p>
              </div>
              <div className="flex items-center gap-2 bg-indigo-50 rounded-xl px-4 py-3 w-full">
                <img src={session?.user?.image ?? ""} className="w-8 h-8 rounded-full" alt="" />
                <span className="text-sm text-indigo-700 font-medium">{session?.user?.email}</span>
              </div>
            </div>
          )}

          {/* Step 1: Shop Name */}
          {step === 1 && (
            <div className="flex flex-col gap-4 py-4">
              <h2 className="text-2xl font-bold text-gray-900">What&apos;s your shop name?</h2>
              <p className="text-gray-500">This will appear on invoices and reports.</p>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g., Kumar's Café, ABC Department Store"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg focus:outline-none focus:border-indigo-500 transition-colors"
                autoFocus
              />
            </div>
          )}

          {/* Step 2: Shop Type */}
          {step === 2 && (
            <div className="flex flex-col gap-4 py-4">
              <h2 className="text-2xl font-bold text-gray-900">What type of shop?</h2>
              <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                {SHOP_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setShopType(type.value)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                      shopType === type.value
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 hover:border-indigo-300 text-gray-700"
                    }`}
                  >
                    <span className="text-2xl">{type.emoji}</span>
                    <span className="text-sm font-medium">{type.label}</span>
                    {shopType === type.value && <Check className="w-4 h-4 ml-auto text-indigo-500" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {step === 3 && (
            <div className="flex flex-col gap-5 py-4">
              <h2 className="text-2xl font-bold text-gray-900">Preferences</h2>
              <p className="text-gray-500 -mt-2">Choose what features you need (can be changed later).</p>

              {/* Tax */}
              <div className="flex flex-col gap-3">
                <ToggleItem
                  icon={<CreditCard className="w-5 h-5 text-indigo-500" />}
                  label="Enable Tax"
                  sublabel="Add tax percentage to bills"
                  checked={taxEnabled}
                  onChange={setTaxEnabled}
                />
                {taxEnabled && (
                  <div className="ml-4 flex items-center gap-3">
                    <label className="text-sm text-gray-600 font-medium">Tax %</label>
                    <input
                      type="number"
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(e.target.value)}
                      className="w-24 border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                      min="0" max="100"
                    />
                  </div>
                )}
              </div>

              <ToggleItem
                icon={<BarChart3 className="w-5 h-5 text-green-500" />}
                label="Monthly Sales Report"
                sublabel="View monthly revenue summary"
                checked={monthlySalesReport}
                onChange={setMonthlySalesReport}
              />
              <ToggleItem
                icon={<BarChart3 className="w-5 h-5 text-blue-500" />}
                label="Weekly Sales Report"
                sublabel="View weekly revenue summary"
                checked={weeklySalesReport}
                onChange={setWeeklySalesReport}
              />
              <ToggleItem
                icon={<FileText className="w-5 h-5 text-orange-500" />}
                label="Print Invoice"
                sublabel="Print invoice after each payment"
                checked={printInvoice}
                onChange={setPrintInvoice}
              />
            </div>
          )}

          {/* Step 4: GPay Setup */}
          {step === 4 && (
            <div className="flex flex-col gap-4 py-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">GPay / UPI Setup</h2>
                  <p className="text-gray-500 text-sm">For QR code payments</p>
                </div>
              </div>
              <p className="text-gray-500 text-sm">Enter your UPI ID or phone number registered with GPay to generate payment QR codes.</p>
              <input
                type="text"
                value={gpayUpi}
                onChange={(e) => setGpayUpi(e.target.value)}
                placeholder="e.g., 9876543210@paytm or yourname@okicici"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <p className="text-xs text-gray-400">You can skip this and add later in Settings.</p>
            </div>
          )}

          {/* Step 5: Set PIN */}
          {step === 5 && (
            <div className="flex flex-col gap-4 py-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Lock className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Set Security PIN</h2>
                  <p className="text-gray-500 text-sm">Protect access to the app</p>
                </div>
              </div>
              <p className="text-gray-500 text-sm">Set a 4-digit PIN to secure access to your billing software, even after login.</p>
              <div className="flex flex-col gap-3">
                <PinInput label="Enter 4-digit PIN" value={pin} onChange={setPin} />
                <PinInput label="Confirm PIN" value={confirmPin} onChange={setConfirmPin} />
              </div>
              <p className="text-xs text-gray-400">Skip to not set a PIN (not recommended).</p>
            </div>
          )}

          {/* Step 6: Done */}
          {step === 6 && (
            <div className="flex flex-col items-center text-center gap-6 py-4">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-12 h-12 text-green-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">You&apos;re all set!</h2>
                <p className="text-gray-500 mt-2">
                  <strong>{shopName}</strong> is ready to go. Start adding items to your menu!
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-6">
            {step > 0 && step < 6 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-medium hover:border-gray-300 transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            {step < 5 && (
              <button
                onClick={handleNext}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-all"
              >
                {step === 0 ? "Get Started" : "Next"} <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {step === 5 && (
              <button
                onClick={handleFinish}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-60"
              >
                {loading ? "Saving..." : "Finish Setup"} <Check className="w-4 h-4" />
              </button>
            )}
            {step === 6 && (
              <button
                onClick={() => router.push("/dashboard")}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-all"
              >
                Go to Dashboard <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleItem({
  icon, label, sublabel, checked, onChange,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
        checked ? "border-indigo-300 bg-indigo-50" : "border-gray-200 hover:border-gray-300"
      }`}
      onClick={() => onChange(!checked)}
    >
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-1">
        <p className="font-medium text-gray-800 text-sm">{label}</p>
        <p className="text-xs text-gray-500">{sublabel}</p>
      </div>
      <div className={`w-12 h-6 rounded-full transition-all ${checked ? "bg-indigo-500" : "bg-gray-200"}`}>
        <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-all ${checked ? "translate-x-6" : "translate-x-0"}`} />
      </div>
    </div>
  );
}

function PinInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-600 mb-1 block">{label}</label>
      <input
        type="password"
        maxLength={4}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
        placeholder="••••"
        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-purple-500 transition-colors"
      />
    </div>
  );
}
