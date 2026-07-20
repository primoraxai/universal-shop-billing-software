"use client";

import { useState, useEffect, useRef } from "react";
import { useShop } from "@/contexts/ShopContext";
import { useCart } from "@/contexts/CartContext";
import type { MenuItem } from "@/db/schema";
import { ShoppingBag, Search, Plus, Minus, X, QrCode, Banknote, Check, Printer, Receipt } from "lucide-react";
import toast from "react-hot-toast";
import QRCode from "qrcode";

export default function MenuPage() {
  const { shop, tr } = useShop();
  const { cart, addToCart, removeFromCart, updateQty, clearCart, total, itemCount } = useCart();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"gpay" | "cash">("cash");
  const [paying, setPaying] = useState(false);
  const [lastOrder, setLastOrder] = useState<{ id: string; total: string; items: unknown[] } | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const res = await fetch("/api/menu");
      const data = await res.json();
      setMenuItems(data.items || []);
    } catch {
      toast.error("Failed to load menu");
    } finally {
      setLoading(false);
    }
  };

  const generateQR = async (upiId: string, amount: number) => {
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(shop?.shopName ?? "Shop")}&am=${amount.toFixed(2)}&cu=INR&tn=Bill+Payment`;
    const dataUrl = await QRCode.toDataURL(upiUrl, { width: 250, margin: 2, color: { dark: "#1e1b4b", light: "#ffffff" } });
    setQrDataUrl(dataUrl);
  };

  const handleShowPayment = async () => {
    if (cart.length === 0) { toast.error("Cart is empty!"); return; }
    setShowPayment(true);
    if (shop?.gpayUpi) {
      const taxAmount = shop.taxEnabled ? (total * Number(shop.taxPercent)) / 100 : 0;
      await generateQR(shop.gpayUpi, total + taxAmount);
    }
  };

  const taxAmount = shop?.taxEnabled ? (total * Number(shop.taxPercent ?? 0)) / 100 : 0;
  const grandTotal = total + taxAmount;

  const handlePay = async (method: "gpay" | "cash") => {
    setPaying(true);
    try {
      // Create order
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map(item => ({ id: item.id, name: item.name, price: item.price, qty: item.qty })),
          subtotal: total.toFixed(2),
          taxAmount: taxAmount.toFixed(2),
          total: grandTotal.toFixed(2),
          paymentMethod: method,
        }),
      });
      const orderData = await orderRes.json();
      const orderId = orderData.order.id;

      // Mark as paid
      await fetch(`/api/orders/${orderId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod: method }),
      });

      setLastOrder({ id: orderId, total: grandTotal.toFixed(2), items: cart });
      toast.success("Payment successful! ✅");
      setShowPayment(false);
      clearCart();

      if (shop?.printInvoice) {
        setShowInvoice(true);
      }
    } catch {
      toast.error("Payment failed. Try again.");
    } finally {
      setPaying(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filtered = menuItems.filter(
    (item) => item.available && item.name.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(filtered.map((i) => i.category ?? "General"))];

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="sticky top-14 z-30 bg-white border-b border-gray-100 px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tr.search || "Search items..."}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-400 transition-colors"
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Menu Items */}
        <div className={`flex-1 overflow-y-auto p-4 ${cart.length > 0 ? "pb-24" : ""}`}>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-400">
              <ShoppingBag className="w-12 h-12" />
              <p className="text-sm">{tr.noItems}</p>
            </div>
          ) : (
            categories.map((cat) => (
              <div key={cat} className="mb-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{cat}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {filtered.filter((i) => (i.category ?? "General") === cat).map((item) => {
                    const inCart = cart.find((c) => c.id === item.id);
                    return (
                      <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-28 object-cover" />
                        ) : (
                          <div className="w-full h-28 bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                            <span className="text-4xl">🍽️</span>
                          </div>
                        )}
                        <div className="p-3">
                          <p className="font-semibold text-gray-800 text-sm truncate">{item.name}</p>
                          <p className="text-indigo-600 font-bold text-sm">₹{Number(item.price).toFixed(2)}</p>
                          <div className="mt-2 flex items-center justify-between">
                            {inCart ? (
                              <div className="flex items-center gap-2 bg-indigo-50 rounded-lg px-2 py-1">
                                <button onClick={() => updateQty(item.id, inCart.qty - 1)} className="text-indigo-600 hover:text-indigo-800">
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-bold text-indigo-700 w-4 text-center">{inCart.qty}</span>
                                <button onClick={() => addToCart(item)} className="text-indigo-600 hover:text-indigo-800">
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addToCart(item)}
                                className="text-xs bg-indigo-500 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-600 transition-colors font-medium"
                              >
                                + {tr.addToCart || "Add"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 px-4 z-30">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => setShowCart(true)}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl px-6 py-4 flex items-center justify-between shadow-xl"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-lg px-2 py-1">
                  <span className="text-sm font-bold">{itemCount}</span>
                </div>
                <span className="font-semibold">{tr.cart || "Cart"}</span>
              </div>
              <span className="font-bold text-lg">₹{grandTotal.toFixed(2)}</span>
            </button>
          </div>
        </div>
      )}

      {/* Cart Sheet */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-bold text-lg">{tr.cart}</h3>
              <button onClick={() => setShowCart(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-2">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-3 border-b border-gray-50">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{item.name}</p>
                    <p className="text-sm text-gray-500">₹{Number(item.price).toFixed(2)} × {item.qty}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.id, item.qty - 1)} className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold w-6 text-center">{item.qty}</span>
                    <button onClick={() => addToCart(item)} className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200">
                      <Plus className="w-3 h-3" />
                    </button>
                    <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 bg-red-50 rounded-full flex items-center justify-center hover:bg-red-100 ml-1">
                      <X className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                  <span className="font-bold text-gray-800 w-20 text-right">₹{(Number(item.price) * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>
            {/* Totals */}
            <div className="px-6 py-4 bg-gray-50 rounded-t-2xl">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>{tr.subtotal}</span><span>₹{total.toFixed(2)}</span>
              </div>
              {shop?.taxEnabled && (
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>{tr.tax} ({shop.taxPercent}%)</span><span>₹{taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg text-gray-900 pt-2 border-t border-gray-200 mt-1">
                <span>{tr.total}</span><span>₹{grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => { clearCart(); setShowCart(false); }}
                  className="flex-1 py-3 rounded-xl border-2 border-red-200 text-red-500 font-medium hover:bg-red-50 transition-colors"
                >
                  {tr.clearCart}
                </button>
                <button
                  onClick={() => { setShowCart(false); handleShowPayment(); }}
                  className="flex-2 flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold hover:opacity-90 transition-all"
                >
                  {tr.pay} →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-bold text-lg">{tr.pay}</h3>
              <button onClick={() => setShowPayment(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="text-center">
                <p className="text-gray-500 text-sm">{tr.total}</p>
                <p className="text-4xl font-bold text-indigo-600">₹{grandTotal.toFixed(2)}</p>
              </div>

              {/* Payment Methods */}
              <div className="flex gap-3">
                {shop?.gpayUpi && (
                  <button
                    onClick={() => setPaymentMethod("gpay")}
                    className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${paymentMethod === "gpay" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                  >
                    <QrCode className="w-8 h-8 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">GPay/UPI</span>
                  </button>
                )}
                <button
                  onClick={() => setPaymentMethod("cash")}
                  className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${paymentMethod === "cash" ? "border-green-500 bg-green-50" : "border-gray-200"}`}
                >
                  <Banknote className="w-8 h-8 text-green-500" />
                  <span className="text-sm font-medium text-gray-700">Cash</span>
                </button>
              </div>

              {/* QR Code */}
              {paymentMethod === "gpay" && qrDataUrl && (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-sm text-gray-500">{tr.scanQR}</p>
                  <div className="bg-white rounded-2xl p-3 border-2 border-blue-100 shadow-inner">
                    <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
                  </div>
                  <p className="text-xs text-gray-400 font-mono">{shop?.gpayUpi}</p>
                </div>
              )}

              <button
                onClick={() => handlePay(paymentMethod)}
                disabled={paying}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {paying ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><Check className="w-5 h-5" /> {paymentMethod === "gpay" ? tr.payWithGPay : tr.payWithCash}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoice && lastOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-bold text-lg flex items-center gap-2"><Receipt className="w-5 h-5 text-indigo-500" /> {tr.invoice}</h3>
              <button onClick={() => setShowInvoice(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div ref={invoiceRef} className="p-6 print:p-4">
              <div className="text-center mb-4">
                <h2 className="font-bold text-xl">{shop?.shopName}</h2>
                <p className="text-gray-500 text-sm capitalize">{shop?.shopType}</p>
                <p className="text-gray-400 text-xs">{new Date().toLocaleString()}</p>
              </div>
              <div className="border-t border-dashed pt-3 mb-3">
                {(lastOrder.items as Array<{name: string; qty: number; price: string}>).map((item, i) => (
                  <div key={i} className="flex justify-between text-sm py-1">
                    <span>{item.name} × {item.qty}</span>
                    <span className="font-medium">₹{(Number(item.price) * item.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3">
                {shop?.taxEnabled && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tax ({shop.taxPercent}%)</span>
                    <span>₹{(Number(lastOrder.total) - total).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg mt-1">
                  <span>Total</span><span>₹{lastOrder.total}</span>
                </div>
              </div>
              <p className="text-center text-xs text-gray-400 mt-4">Thank you! Visit again 🙏</p>
            </div>
            <div className="px-6 pb-6">
              <button
                onClick={handlePrint}
                className="w-full py-3 rounded-xl bg-indigo-500 text-white font-semibold flex items-center justify-center gap-2 hover:bg-indigo-600 transition-colors"
              >
                <Printer className="w-4 h-4" /> {tr.printInvoiceBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
