import { useState, useEffect } from "react";
import { useAuth } from "../../app/AuthContext";
import { auth } from "../../firebase";
import LoginSignupModal from "../Auth/LoginSignupModal";
import { ref, get, set } from "firebase/database";
import { db } from "../../firebase";
import { toast } from "sonner";
import { Trash2, Plus, AlertTriangle, ImagePlus, X, Palette } from "lucide-react";
import { themes, getThemeById, applyTheme, DEFAULT_THEME } from "../../themes";

// ─── Image helpers ────────────────────────────────────────────────
const resizeImage = (file: File, maxWidth = 900): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('Resize failed')), 'image/jpeg', 0.85);
    };
    img.onerror = () => reject(new Error('Load failed'));
    img.src = url;
  });

const uploadToCloudinary = async (file: File): Promise<string> => {
  const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  console.log('[Cloudinary] cloud:', cloud, '| preset:', preset);
  if (!cloud || !preset) throw new Error(`Cloudinary env vars missing (cloud="${cloud}", preset="${preset}")`);
  const blob = await resizeImage(file);
  const fd = new FormData();
  fd.append('file', blob, 'menu-item.jpg');
  fd.append('upload_preset', preset);
  const url = `https://api.cloudinary.com/v1_1/${cloud}/image/upload`;
  console.log('[Cloudinary] uploading to:', url);
  let res: Response;
  try {
    res = await fetch(url, { method: 'POST', body: fd });
  } catch (netErr) {
    throw new Error(`Network error hitting Cloudinary (cloud="${cloud}"): ${netErr}`);
  }
  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`Cloudinary rejected upload (${res.status}): ${errBody.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.secure_url as string;
};


interface MenuItem {
  id?: string;
  name: string;
  description: string;
  price: string;
  category: string;
  available?: boolean;
}

const DEFAULT_CATEGORIES = ["Pizza", "Burgers", "Pasta", "Desserts", "Drinks", "Salads"];
const API_URL = () => import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AdminAddItems() {
  const { isAdmin, loading: authLoading, currentUser } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<MenuItem>({ name: "", description: "", price: "", category: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Menu state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [fetchingMenu, setFetchingMenu] = useState(true);

  // Category state
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<string | null>(null);

  // Settings state
  const [deliveryRadius, setDeliveryRadius] = useState<number>(20);
  const [savingSettings, setSavingSettings] = useState(false);

  // Image upload
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Danger zone
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [resetting, setResetting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Theme
  const [activeTheme, setActiveTheme] = useState(DEFAULT_THEME);
  const [switchingTheme, setSwitchingTheme] = useState(false);

  // Load everything on mount
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [menuRes, radSnap, catSnap, themeSnap] = await Promise.all([
          fetch(`${API_URL()}/api/menu`),
          get(ref(db, 'settings/deliveryRadiusKm')),
          get(ref(db, 'settings/categories')),
          get(ref(db, 'settings/activeTheme')),
        ]);

        if (menuRes.ok) {
          const items = await menuRes.json();
          setMenuItems(items);
        }
        if (radSnap.exists()) setDeliveryRadius(radSnap.val());
        if (catSnap.exists()) {
          const saved = catSnap.val();
          setCategories(Array.isArray(saved) ? saved : DEFAULT_CATEGORIES);
        }
        if (themeSnap.exists()) setActiveTheme(themeSnap.val());
      } catch (err) {
        console.error("Failed to load admin data:", err);
      } finally {
        setFetchingMenu(false);
      }
    };
    fetchAll();
  }, []);

  // Sync form category to first available category whenever categories change
  useEffect(() => {
    if (categories.length > 0) {
      setFormData(prev => {
        // If current category isn't in the list, reset to first
        if (!categories.includes(prev.category)) {
          return { ...prev, category: categories[0] };
        }
        return prev;
      });
    }
  }, [categories]);

  const getToken = async () => {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error("Not authenticated");
    return token;
  };

  // ─── Save delivery radius ───────────────────────────────────────
  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await set(ref(db, 'settings/deliveryRadiusKm'), deliveryRadius);
      toast.success("Delivery radius saved!");
    } catch {
      toast.error("Failed to save settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  // ─── Toggle availability ────────────────────────────────────────
  const toggleAvailability = async (item: MenuItem) => {
    if (!item.id) return;
    try {
      const token = await getToken();
      const newStatus = item.available === false ? true : false;
      const res = await fetch(`${API_URL()}/api/menu/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ available: newStatus }),
      });
      if (res.ok) {
        setMenuItems(prev => prev.map(m => m.id === item.id ? { ...m, available: newStatus } : m));
      } else {
        toast.error("Failed to update availability.");
      }
    } catch {
      toast.error("Connection error.");
    }
  };

  // ─── Delete single item ─────────────────────────────────────────
  const deleteItem = async (item: MenuItem) => {
    if (!item.id) return;
    setDeletingId(item.id);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL()}/api/menu/${item.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (res.ok) {
        setMenuItems(prev => prev.filter(m => m.id !== item.id));
        toast.success(`"${item.name}" deleted.`);
      } else {
        toast.error("Failed to delete item.");
      }
    } catch {
      toast.error("Connection error.");
    } finally {
      setDeletingId(null);
    }
  };

  // ─── Reset entire menu ──────────────────────────────────────────
  const resetMenu = async () => {
    if (resetConfirmText !== "RESET") return;
    setResetting(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL()}/api/menu/reset`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (res.ok) {
        setMenuItems([]);
        toast.success("All menu items deleted.");
        setShowResetModal(false);
        setResetConfirmText("");
      } else {
        toast.error("Reset failed.");
      }
    } catch {
      toast.error("Connection error.");
    } finally {
      setResetting(false);
    }
  };

  // ─── Add category ───────────────────────────────────────────────
  const addCategory = async () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    if (categories.map(c => c.toLowerCase()).includes(trimmed.toLowerCase())) {
      toast.error("Category already exists.");
      return;
    }
    setSavingCategory(true);
    try {
      const updated = [...categories, trimmed];
      await set(ref(db, 'settings/categories'), updated);
      setCategories(updated);
      setNewCategory("");
      toast.success(`"${trimmed}" category added!`);
    } catch {
      toast.error("Failed to save category.");
    } finally {
      setSavingCategory(false);
    }
  };

  // ─── Delete category ────────────────────────────────────────────
  const deleteCategory = async (cat: string) => {
    const itemsInCat = menuItems.filter(m => m.category === cat);
    if (itemsInCat.length > 0) {
      toast.error(`Can't delete "${cat}" — it has ${itemsInCat.length} item(s). Remove them first.`);
      setConfirmDeleteCategory(null);
      return;
    }
    try {
      const updated = categories.filter(c => c !== cat);
      await set(ref(db, 'settings/categories'), updated);
      setCategories(updated);
      toast.success(`"${cat}" deleted.`);
    } catch {
      toast.error("Failed to delete category.");
    } finally {
      setConfirmDeleteCategory(null);
    }
  };

  // ─── Add item form ──────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description || !formData.price) {
      setMessage({ type: "error", text: "All fields are required!" });
      return;
    }
    setLoading(true);
    try {
      const token = await getToken();

      // Upload image to Cloudinary first (if selected)
      let imageUrl: string | null = null;
      if (imageFile) {
        setUploadingImage(true);
        imageUrl = await uploadToCloudinary(imageFile);
        setUploadingImage(false);
      }

      const res = await fetch(`${API_URL()}/api/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...formData, image: imageUrl }),
      });
      if (!res.ok) throw new Error('Failed to add item');
      const newItem = await res.json();
      setMessage({ type: "success", text: `✅ ${formData.name} added!` });
      setFormData({ name: "", description: "", price: "", category: categories[0] || "" });
      setImageFile(null);
      setImagePreview(null);
      setMenuItems(prev => [newItem, ...prev]);
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setUploadingImage(false);
      setMessage({ type: "error", text: `❌ ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setLoading(false);
    }
  };

  // ─── Guard ───────────────────────────────────────────────────────
  if (authLoading) {
    return <div className="min-h-screen bg-[#fbf4e8] flex items-center justify-center"><p>Loading...</p></div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#fbf4e8] p-8 flex flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-6">You must be an administrator to access this page.</p>
        {!currentUser && (
          <button onClick={() => setIsLoginModalOpen(true)} className="px-6 py-3 bg-[#f51c27] text-white rounded-xl font-medium hover:bg-[#d90429]">
            Log In
          </button>
        )}
        <LoginSignupModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      </div>
    );
  }

  const filteredItems = menuItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#fbf4e8] p-6 pt-20">
      <div className="max-w-2xl mx-auto space-y-10">

        {/* ── ADD ITEM ── */}
        <section>
          <h1 className="text-[36px] font-black text-[#1c1c1a] mb-6">Add Menu Item</h1>
          <form onSubmit={handleSubmit} className="bg-white rounded-[22px] p-8 shadow-sm border border-[#e0e0e0]">
            <div className="mb-5">
              <label className="block text-[15px] font-semibold text-[#1c1c1a] mb-2">Item Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., Chicken Shawarma" className="w-full px-4 py-3 border border-[#d1d1d1] rounded-[12px] text-[16px] focus:outline-none focus:border-[#f51c27]" />
            </div>
            <div className="mb-5">
              <label className="block text-[15px] font-semibold text-[#1c1c1a] mb-2">Description *</label>
              <textarea name="description" value={formData.description} onChange={handleChange} placeholder="e.g., Grilled chicken with garlic sauce, fresh veggies" rows={3} className="w-full px-4 py-3 border border-[#d1d1d1] rounded-[12px] text-[16px] focus:outline-none focus:border-[#f51c27]" />
            </div>
            <div className="mb-5">
              <label className="block text-[15px] font-semibold text-[#1c1c1a] mb-2">Price *</label>
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-semibold">AED</span>
                <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="35" step="0.01" className="flex-1 px-4 py-3 border border-[#d1d1d1] rounded-[12px] text-[16px] focus:outline-none focus:border-[#f51c27]" />
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-[15px] font-semibold text-[#1c1c1a] mb-2">Category *</label>
              <select name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-3 border border-[#d1d1d1] rounded-[12px] text-[16px] focus:outline-none focus:border-[#f51c27]">
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            {/* Image Upload */}
            <div className="mb-6">
              <label className="block text-[15px] font-semibold text-[#1c1c1a] mb-2">Item Photo <span className="text-gray-400 font-normal">(optional)</span></label>
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-full h-[180px] object-cover rounded-[16px] border border-[#e0e0e0]" />
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-md hover:bg-red-50 transition-colors"
                  >
                    <X size={16} className="text-red-500" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 w-full h-[140px] border-2 border-dashed border-[#d1d1d1] rounded-[16px] cursor-pointer hover:border-[#f51c27] transition-colors text-gray-400 hover:text-[#f51c27]">
                  <ImagePlus size={32} />
                  <span className="text-[14px] font-medium">Tap to pick a photo</span>
                  <span className="text-[12px]">JPG, PNG, WEBP up to 10MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImageFile(file);
                        setImagePreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </label>
              )}
            </div>

            {message && (
              <div className={`mb-5 p-4 rounded-[12px] text-[15px] font-semibold ${message.type === 'success' ? 'bg-[#1caa00] text-white' : 'bg-[#ff4444] text-white'}`}>{message.text}</div>
            )}
            <button type="submit" disabled={loading || uploadingImage} className="w-full bg-[#f51c27] text-white py-3 rounded-[12px] text-[16px] font-bold hover:bg-[#d90429] transition-colors disabled:opacity-50">
              {uploadingImage ? "Uploading photo..." : loading ? "Adding..." : "Add Item"}
            </button>
          </form>
        </section>

        {/* ── CATEGORIES ── */}
        <section>
          <h2 className="text-[28px] font-black text-[#1c1c1a] mb-5">Manage Categories</h2>
          <div className="bg-white rounded-[22px] p-6 shadow-sm border border-[#e0e0e0]">

            {/* Add new category */}
            <div className="flex gap-3 mb-6">
              <input
                type="text"
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                placeholder="New category name..."
                className="flex-1 px-4 py-3 border border-[#d1d1d1] rounded-[12px] text-[16px] focus:outline-none focus:border-[#f51c27]"
              />
              <button onClick={addCategory} disabled={savingCategory || !newCategory.trim()} className="flex items-center gap-2 bg-[#1c1c1a] text-white px-5 py-3 rounded-[12px] font-bold hover:bg-gray-800 disabled:opacity-40 transition-colors">
                <Plus size={18} /> Add
              </button>
            </div>

            {/* Category list */}
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <div key={cat} className="flex items-center gap-2 bg-[#fbf4e8] border border-[#e0e0e0] rounded-full px-4 py-2">
                  <span className="font-semibold text-[14px] text-[#1c1c1a]">{cat}</span>
                  {confirmDeleteCategory === cat ? (
                    <div className="flex items-center gap-1 ml-1">
                      <button onClick={() => deleteCategory(cat)} className="text-[12px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold hover:bg-red-600">Confirm</button>
                      <button onClick={() => setConfirmDeleteCategory(null)} className="text-[12px] text-gray-500 hover:text-gray-700">✕</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDeleteCategory(cat)} className="text-gray-400 hover:text-red-500 transition-colors ml-1">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[13px] text-gray-400 mt-4">⚠️ You can only delete a category if it has no items.</p>
          </div>
        </section>

        {/* ── STORE SETTINGS ── */}
        <section>
          <h2 className="text-[28px] font-black text-[#1c1c1a] mb-5">Store Settings</h2>
          <div className="bg-white rounded-[22px] p-6 shadow-sm border border-[#e0e0e0]">
            <label className="block text-[15px] font-semibold text-[#1c1c1a] mb-1">Max Delivery Radius (km)</label>
            <p className="text-sm text-gray-500 mb-4">Orders outside this range from the restaurant will be blocked.</p>
            <div className="flex gap-4 items-center">
              <input type="number" value={deliveryRadius} onChange={e => setDeliveryRadius(Number(e.target.value))} className="w-32 px-4 py-3 border border-[#d1d1d1] rounded-[12px] text-[16px] focus:outline-none focus:border-[#f51c27]" />
              <button onClick={saveSettings} disabled={savingSettings} className="bg-[#1c1c1a] text-white px-6 py-3 rounded-[12px] font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors">
                {savingSettings ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </section>

        {/* ── THEME PICKER ── */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <Palette size={24} className="text-[#1c1c1a]" />
            <h2 className="text-[28px] font-black text-[#1c1c1a]">Site Theme</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">Switch your restaurant's look instantly. Customers see the change in real time.</p>
          <div className="grid grid-cols-3 gap-3">
            {themes.map(theme => {
              const isActive = activeTheme === theme.id;
              const colors = theme.colors;
              return (
                <button
                  key={theme.id}
                  disabled={switchingTheme}
                  onClick={async () => {
                    setSwitchingTheme(true);
                    try {
                      await set(ref(db, 'settings/activeTheme'), theme.id);
                      setActiveTheme(theme.id);
                      applyTheme(theme.id);
                      toast.success(`Switched to ${theme.name}`);
                    } catch {
                      toast.error('Failed to switch theme');
                    } finally {
                      setSwitchingTheme(false);
                    }
                  }}
                  className={`relative rounded-[16px] p-3 border-2 transition-all ${
                    isActive ? 'border-[#f51c27] shadow-lg scale-[1.02]' : 'border-[#e0e0e0] hover:border-gray-400'
                  } disabled:opacity-60`}
                >
                  {/* Mini preview */}
                  <div
                    className="rounded-[10px] h-[80px] mb-2 flex flex-col items-center justify-center gap-1 overflow-hidden"
                    style={{ background: colors['--bg-primary'] }}
                  >
                    <div className="text-[18px] font-black" style={{ color: colors['--accent'] }}>Tasty</div>
                    <div className="flex gap-1">
                      <div className="w-6 h-3 rounded-full" style={{ background: colors['--accent'] }} />
                      <div className="w-6 h-3 rounded-full" style={{ background: colors['--text-price'] }} />
                      <div className="w-6 h-3 rounded-full" style={{ background: colors['--category-underline'] }} />
                    </div>
                  </div>
                  <span className="text-[12px] font-bold text-[#1c1c1a] block">{theme.emoji} {theme.name}</span>
                  {isActive && (
                    <div className="absolute top-1.5 right-1.5 bg-[#1caa00] rounded-full w-5 h-5 flex items-center justify-center">
                      <span className="text-white text-[11px]">✓</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── MANAGE ITEMS ── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[28px] font-black text-[#1c1c1a]">Menu Items ({menuItems.length})</h2>
            <button
              onClick={() => setShowResetModal(true)}
              className="flex items-center gap-2 bg-red-50 border border-red-300 text-red-600 px-4 py-2 rounded-[12px] font-bold text-[14px] hover:bg-red-100 transition-colors"
            >
              <AlertTriangle size={16} /> Reset Menu
            </button>
          </div>

          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 mb-5 border border-[#d1d1d1] rounded-[12px] text-[16px] focus:outline-none focus:border-[#f51c27]"
          />

          {fetchingMenu ? (
            <p className="text-center text-gray-500 py-8">Loading menu...</p>
          ) : filteredItems.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No items found.</p>
          ) : (
            <div className="space-y-3">
              {filteredItems.map(item => (
                <div key={item.id} className="bg-white rounded-[16px] p-4 flex items-center justify-between border border-[#e0e0e0] shadow-sm">
                  <div className="min-w-0 flex-1 mr-4">
                    <h3 className="font-bold text-[17px] text-[#1c1c1a] truncate">{item.name}</h3>
                    <p className="text-gray-500 text-[13px]">AED {item.price} · {item.category}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-[12px] font-bold ${item.available !== false ? 'text-green-500' : 'text-red-500'}`}>
                      {item.available !== false ? 'IN STOCK' : 'OUT'}
                    </span>
                    <button
                      onClick={() => toggleAvailability(item)}
                      className={`w-12 h-7 rounded-full transition-colors relative ${item.available !== false ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${item.available !== false ? 'right-1' : 'left-1'}`} />
                    </button>
                    <button
                      onClick={() => deleteItem(item)}
                      disabled={deletingId === item.id}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                      title="Delete item"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Bottom padding */}
        <div className="h-24" />
      </div>

      {/* ── RESET CONFIRMATION MODAL ── */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[24px] p-8 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-[20px] font-black text-[#1c1c1a]">Reset Entire Menu</h3>
                <p className="text-[13px] text-gray-500">This cannot be undone.</p>
              </div>
            </div>
            <p className="text-[14px] text-gray-600 mb-5">
              This will permanently delete all <strong>{menuItems.length} menu items</strong>. Type <strong>RESET</strong> to confirm.
            </p>
            <input
              type="text"
              value={resetConfirmText}
              onChange={e => setResetConfirmText(e.target.value)}
              placeholder='Type "RESET" to confirm'
              className="w-full px-4 py-3 border border-[#d1d1d1] rounded-[12px] text-[16px] mb-5 focus:outline-none focus:border-red-500"
            />
            <div className="flex gap-3">
              <button onClick={() => { setShowResetModal(false); setResetConfirmText(""); }} className="flex-1 py-3 border-2 border-gray-200 rounded-[12px] font-bold text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={resetMenu}
                disabled={resetConfirmText !== "RESET" || resetting}
                className="flex-1 py-3 bg-red-600 text-white rounded-[12px] font-bold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {resetting ? "Deleting..." : "Delete All"}
              </button>
            </div>
          </div>
        </div>
      )}

      <LoginSignupModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  );
}
