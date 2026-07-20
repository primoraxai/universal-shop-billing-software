"use client";

import { useState, useRef } from "react";
import { useShop } from "@/contexts/ShopContext";
import { Camera, Upload, X, Check, Package, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import type { MenuItem } from "@/db/schema";
import { useEffect } from "react";

export default function AddItemPage() {
  const { tr } = useShop();
  const fileRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Form
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("General");
  const [imageUrl, setImageUrl] = useState("");
  const [available, setAvailable] = useState(true);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/menu");
      const data = await res.json();
      setItems(data.items || []);
    } catch { toast.error("Failed to load items"); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setName(""); setPrice(""); setCategory("General"); setImageUrl(""); setAvailable(true);
    setEditingItem(null);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setPrice(String(item.price));
    setCategory(item.category ?? "General");
    setImageUrl(item.imageUrl ?? "");
    setAvailable(item.available);
    setShowForm(true);
  };

  const handleImageUpload = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setImageUrl(data.url);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Enter item name"); return; }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) { toast.error("Enter valid price"); return; }
    setSaving(true);
    try {
      if (editingItem) {
        await fetch(`/api/menu/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, price, category, imageUrl: imageUrl || null, available }),
        });
        toast.success("Item updated!");
      } else {
        await fetch("/api/menu", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, price, category, imageUrl: imageUrl || null, available }),
        });
        toast.success("Item added!");
      }
      resetForm();
      setShowForm(false);
      await fetchItems();
    } catch { toast.error("Failed to save item"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/menu/${id}`, { method: "DELETE" });
      toast.success("Item deleted");
      setConfirmDelete(null);
      await fetchItems();
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">{tr.addItem}</h2>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors"
        >
          <Package className="w-4 h-4" /> {tr.addItem}
        </button>
      </div>

      {/* Item List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-gray-400">
          <Package className="w-16 h-16" />
          <p className="text-center">{tr.noItems}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-16 h-16 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Package className="w-8 h-8 text-indigo-300" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">{item.name}</p>
                <p className="text-indigo-600 font-bold">₹{Number(item.price).toFixed(2)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{item.category}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${item.available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {item.available ? tr.available : tr.unavailable}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => handleEdit(item)} className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center hover:bg-indigo-100 transition-colors">
                  <Pencil className="w-4 h-4 text-indigo-500" />
                </button>
                <button onClick={() => setConfirmDelete(item.id)} className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Form Sheet */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
              <h3 className="font-bold text-lg">{editingItem ? tr.editItem : tr.addItem}</h3>
              <button onClick={() => { setShowForm(false); resetForm(); }}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              {/* Image */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">{tr.image}</label>
                <div className="flex gap-3">
                  {imageUrl ? (
                    <div className="relative w-24 h-24">
                      <img src={imageUrl} alt="item" className="w-24 h-24 rounded-xl object-cover" />
                      <button
                        onClick={() => setImageUrl("")}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="flex flex-col items-center gap-2 w-24 h-24 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all"
                      >
                        <Upload className="w-5 h-5 text-gray-400 mt-3" />
                        <span className="text-xs text-gray-400">{tr.upload}</span>
                      </button>
                      <button
                        onClick={() => { fileRef.current && (fileRef.current.capture = "environment"); fileRef.current?.click(); }}
                        className="flex flex-col items-center gap-2 w-24 h-24 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all"
                      >
                        <Camera className="w-5 h-5 text-gray-400 mt-3" />
                        <span className="text-xs text-gray-400">{tr.takePhoto}</span>
                      </button>
                    </>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
                  />
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">{tr.itemName} *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Masala Chai"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Price */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">{tr.price} *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full border-2 border-gray-200 rounded-xl pl-8 pr-4 py-3 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">{tr.category}</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., Beverages, Snacks, Main Course"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Available Toggle */}
              <div
                className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer ${available ? "border-green-300 bg-green-50" : "border-gray-200"}`}
                onClick={() => setAvailable(!available)}
              >
                <span className="font-medium text-gray-800">{available ? tr.available : tr.unavailable}</span>
                <div className={`w-12 h-6 rounded-full transition-all ${available ? "bg-green-500" : "bg-gray-300"}`}>
                  <div className={`w-6 h-6 bg-white rounded-full shadow transition-all ${available ? "translate-x-6" : "translate-x-0"}`} />
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-2xl hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><Check className="w-5 h-5" /> {editingItem ? tr.update : tr.save}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-center font-medium text-gray-800">{tr.confirmDelete}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-medium hover:bg-gray-50">{tr.no}</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600">{tr.yes}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
