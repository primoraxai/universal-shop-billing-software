"use client";

import { useState, useEffect } from "react";
import { useShop } from "@/contexts/ShopContext";
import { BarChart3, TrendingUp, ShoppingBag, IndianRupee, Calendar, Clock } from "lucide-react";
import toast from "react-hot-toast";
import type { Order } from "@/db/schema";
import { format } from "date-fns";

type FilterType = "today" | "week" | "month" | "all";

export default function ReportsPage() {
  const { shop, tr } = useShop();
  const [filter, setFilter] = useState<FilterType>("today");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchOrders(filter); }, [filter]);

  const fetchOrders = async (f: FilterType) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders?filter=${f}`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch { toast.error("Failed to load reports"); }
    finally { setLoading(false); }
  };

  const paidOrders = orders.filter(o => o.status === "paid");
  const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const avgOrder = paidOrders.length ? totalRevenue / paidOrders.length : 0;

  const filters: { key: FilterType; label: string; icon: React.ReactNode; enabled: boolean }[] = [
    { key: "today", label: tr.todaySales, icon: <Clock className="w-4 h-4" />, enabled: true },
    { key: "week", label: tr.weeklySales, icon: <Calendar className="w-4 h-4" />, enabled: shop?.weeklySalesReport ?? false },
    { key: "month", label: tr.monthlySales, icon: <BarChart3 className="w-4 h-4" />, enabled: shop?.monthlySalesReport ?? false },
    { key: "all", label: "All Time", icon: <TrendingUp className="w-4 h-4" />, enabled: true },
  ];

  type OrderItem = { name: string; qty: number; price: string };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold text-gray-900 mb-4">{tr.reports}</h2>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => f.enabled && setFilter(f.key)}
            disabled={!f.enabled}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              filter === f.key
                ? "bg-indigo-500 text-white shadow"
                : f.enabled
                ? "bg-white text-gray-600 border border-gray-200 hover:border-indigo-300"
                : "bg-gray-100 text-gray-300 cursor-not-allowed opacity-50"
            }`}
          >
            {f.icon} {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <StatCard
              icon={<ShoppingBag className="w-6 h-6 text-indigo-500" />}
              label={tr.totalOrders}
              value={String(paidOrders.length)}
              bg="bg-indigo-50"
            />
            <StatCard
              icon={<IndianRupee className="w-6 h-6 text-green-500" />}
              label={tr.totalRevenue}
              value={`₹${totalRevenue.toFixed(2)}`}
              bg="bg-green-50"
            />
            <StatCard
              icon={<TrendingUp className="w-6 h-6 text-purple-500" />}
              label={tr.averageOrder}
              value={`₹${avgOrder.toFixed(2)}`}
              bg="bg-purple-50"
            />
            <StatCard
              icon={<BarChart3 className="w-6 h-6 text-orange-500" />}
              label="Pending"
              value={String(orders.filter(o => o.status === "pending").length)}
              bg="bg-orange-50"
            />
          </div>

          {/* Order List */}
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">{tr.items}</h3>
          {paidOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
              <BarChart3 className="w-12 h-12" />
              <p>{tr.noOrders}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {paidOrders.map((order) => {
                const items = order.items as OrderItem[];
                return (
                  <div key={order.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400 font-mono">#{order.id.slice(-8).toUpperCase()}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        order.paymentMethod === "gpay" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                      }`}>
                        {order.paymentMethod === "gpay" ? "GPay" : "Cash"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      {order.paidAt ? format(new Date(order.paidAt), "dd MMM yyyy, hh:mm a") : ""}
                    </div>
                    <div className="space-y-1 mb-2">
                      {items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm text-gray-700">
                          <span>{item.name} × {item.qty}</span>
                          <span>₹{(Number(item.price) * item.qty).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 border-t pt-2">
                      <span>Total</span>
                      <span>₹{Number(order.total).toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: string; bg: string }) {
  return (
    <div className={`${bg} rounded-2xl p-4`}>
      <div className="mb-2">{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
