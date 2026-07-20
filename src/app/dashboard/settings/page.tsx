"use client";

import { useState, useEffect } from "react";
import { useShop } from "@/contexts/ShopContext";
import { useSession, signOut } from "next-auth/react";
import {
  Store, CreditCard, BarChart3, FileText, Smartphone, Lock,
  Globe, LogOut, Check, ChevronRight, X
} from "lucide-react";
import toast from "react-hot-toast";
import { LANGUAGES } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";

export default function SettingsPage() {
  const { shop, setShop, tr, lang } = useShop();
  const { data: session } = useSession();
  const [saving, setSaving] = useState(false);
  const [showPinChange, setShowPinChange] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);

  // Form state - mirrors shop
  const [shopName, setShopName] = useState(shop?.shopName ?? "");
  const [shopType, setShopType] = useState(shop?.shopType ?? "");
  const [taxEnabled, setTaxEnabled] = useState(shop?.taxEnabled ?? false);
  const [taxPercent, setTaxPercent] = useState(shop?.taxPercent ?? "5");
  const [monthlySalesReport, setMonthlySalesReport] = useState(shop?.monthlySalesReport ?? false);
  const [weeklySalesReport, setWeeklySalesReport] = useState(shop?.weeklySalesReport ?? false);
  const [printInvoice, setPrintInvoice] = useState(shop?.printInvoice ?? false);
  const [gpayUpi, setGpayUpi] = useState(shop?.gpayUpi ?? "");

  // PIN change
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");

  useEffect(() => {
    if (shop) {
      setShopName(shop.shopName);
      setShopType(shop.shopType);
      setTaxEnabled(shop.taxEnabled);
      setTaxPercent(shop.taxPercent ?? "5");
      setMonthlySalesReport(shop.monthlySalesReport);
      setWeeklySalesReport(shop.weeklySalesReport);
      setPrintInvoice(shop.printInvoice);
      setGpayUpi(shop.gpayUpi ?? "");
    }
  }, [shop]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/shop", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopName, shopType, taxEnabled,
          taxPercent: taxEnabled ? taxPercent : "0",
          monthlySalesReport, weeklySalesReport, printInvoice,
          gpayUpi: gpayUpi || null,
        }),
      });
      const data = await res.json();
      setShop(data.shop);
      toast.success("Settings saved!");
    } catch { toast.error("Failed to save settings"); }
    finally { setSaving(false); }
  };

  const handleChangeLanguage = async (newLang: Language) => {
    try {
      const res = await fetch("/api/shop", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: newLang }),
      });
      const data = await res.json();
      setShop(data.shop);
      setShowLanguage(false);
      toast.success("Language updated!");
    } catch { toast.error("Failed to update language"); }
  };

  const handleChangePin = async () => {
    if (shop?.pin) {
      // Verify current PIN first
      const verRes = await fetch("/api/shop/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: currentPin }),
      });
      const verData = await verRes.json();
      if (!verData.valid) { toast.error(tr.wrongPin); return; }
    }
    if (newPin.length !== 4) { toast.error("New PIN must be 4 digits"); return; }
    if (newPin !== confirmNewPin) { toast.error(tr.pinMismatch); return; }

    try {
      const res = await fetch("/api/shop", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: newPin }),
      });
      const data = await res.json();
      setShop(data.shop);
      toast.success(tr.pinSaved);
      setShowPinChange(false);
      setCurrentPin(""); setNewPin(""); setConfirmNewPin("");
    } catch { toast.error("Failed to change PIN"); }
  };

  const SHOP_TYPES = [
    "hotel", "restaurant", "cafe", "departmentStore",
    "supermarket", "bakery", "pharmacy", "electronics", "clothing", "other"
  ];

  return (
    <div className="p-4 pb-8">
      <h2 className="text-lg font-bold text-gray-900 mb-6">{tr.settings}</h2>

      {/* User Info */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 mb-6 flex items-center gap-4">
        <img src={session?.user?.image ?? ""} className="w-12 h-12 rounded-full border-2 border-white" alt="" />
        <div>
          <p className="font-bold text-white">{session?.user?.name}</p>
          <p className="text-indigo-200 text-sm">{session?.user?.email}</p>
        </div>
      </div>

      {/* Shop Settings */}
      <Section title={tr.shopSettings} icon={<Store className="w-5 h-5 text-indigo-500" />}>
        <div>
          <label className="text-sm font-medium text-gray-600 mb-1 block">{tr.shopName}</label>
          <input
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600 mb-1 block">{tr.shopType}</label>
          <select
            value={shopType}
            onChange={(e) => setShopType(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
          >
            {SHOP_TYPES.map((t) => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace(/([A-Z])/g, ' $1')}</option>
            ))}
          </select>
        </div>
      </Section>

      {/* GPay */}
      <Section title="GPay / UPI" icon={<Smartphone className="w-5 h-5 text-blue-500" />}>
        <input
          value={gpayUpi}
          onChange={(e) => setGpayUpi(e.target.value)}
          placeholder="yourname@okaxis"
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
        />
      </Section>

      {/* Tax */}
      <Section title="Tax Settings" icon={<CreditCard className="w-5 h-5 text-green-500" />}>
        <ToggleItem label={tr.taxEnabled} checked={taxEnabled} onChange={setTaxEnabled} />
        {taxEnabled && (
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600">{tr.taxPercent}</label>
            <input
              type="number"
              value={String(taxPercent)}
              onChange={(e) => setTaxPercent(e.target.value)}
              className="w-24 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-500"
              min="0" max="100"
            />
          </div>
        )}
      </Section>

      {/* Reports */}
      <Section title={tr.reports} icon={<BarChart3 className="w-5 h-5 text-purple-500" />}>
        <ToggleItem label={tr.monthlySalesReport} checked={monthlySalesReport} onChange={setMonthlySalesReport} />
        <ToggleItem label={tr.weeklySalesReport} checked={weeklySalesReport} onChange={setWeeklySalesReport} />
      </Section>

      {/* Invoice */}
      <Section title={tr.invoice} icon={<FileText className="w-5 h-5 text-orange-500" />}>
        <ToggleItem label={tr.printInvoice} checked={printInvoice} onChange={setPrintInvoice} />
      </Section>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-2xl hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2 mb-4"
      >
        {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Check className="w-5 h-5" /> {tr.save}</>}
      </button>

      {/* Other Actions */}
      <div className="flex flex-col gap-3">
        <ActionButton
          icon={<Globe className="w-5 h-5 text-indigo-500" />}
          label={`${tr.language}: ${LANGUAGES.find(l => l.code === lang)?.nativeLabel ?? "English"}`}
          onClick={() => setShowLanguage(true)}
        />
        <ActionButton
          icon={<Lock className="w-5 h-5 text-purple-500" />}
          label={tr.changePin}
          onClick={() => setShowPinChange(true)}
        />
        <ActionButton
          icon={<LogOut className="w-5 h-5 text-red-500" />}
          label={tr.signOut}
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          danger
        />
      </div>

      {/* Language Modal */}
      {showLanguage && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
              <h3 className="font-bold text-lg">{tr.language}</h3>
              <button onClick={() => setShowLanguage(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => handleChangeLanguage(l.code)}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    lang === l.code ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-indigo-300"
                  }`}
                >
                  <div className="text-left">
                    <p className="font-bold text-gray-800 text-sm">{l.nativeLabel}</p>
                    <p className="text-xs text-gray-500">{l.label}</p>
                  </div>
                  {lang === l.code && <Check className="w-4 h-4 text-indigo-500" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PIN Change Modal */}
      {showPinChange && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">{tr.changePin}</h3>
              <button onClick={() => setShowPinChange(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            {shop?.pin && (
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">{tr.enterCurrentPin}</label>
                <input
                  type="password"
                  maxLength={4}
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="••••"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-purple-500"
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">{tr.newPin}</label>
              <input
                type="password"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="••••"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">{tr.confirmNewPin}</label>
              <input
                type="password"
                maxLength={4}
                value={confirmNewPin}
                onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="••••"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-purple-500"
              />
            </div>
            <button
              onClick={handleChangePin}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90"
            >
              {tr.save}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="font-bold text-gray-800">{title}</h3>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function ToggleItem({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between cursor-pointer" onClick={() => onChange(!checked)}>
      <span className="text-sm text-gray-700">{label}</span>
      <div className={`w-12 h-6 rounded-full transition-all ${checked ? "bg-indigo-500" : "bg-gray-200"}`}>
        <div className={`w-6 h-6 bg-white rounded-full shadow transition-all ${checked ? "translate-x-6" : "translate-x-0"}`} />
      </div>
    </div>
  );
}

function ActionButton({ icon, label, onClick, danger }: {
  icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all hover:shadow-sm ${
        danger ? "border-red-100 bg-red-50 hover:bg-red-100" : "border-gray-100 bg-white hover:bg-gray-50"
      }`}
    >
      {icon}
      <span className={`flex-1 text-left font-medium ${danger ? "text-red-600" : "text-gray-800"}`}>{label}</span>
      <ChevronRight className={`w-4 h-4 ${danger ? "text-red-400" : "text-gray-400"}`} />
    </button>
  );
}
