import { useState, useEffect } from "react";
import { useAuth } from "../../app/AuthContext";
import { auth } from "../../firebase";
import LoginSignupModal from "../Auth/LoginSignupModal";
import { ref, get, set } from "firebase/database";
import { db } from "../../firebase";
import { toast } from "sonner";
import { Trash2, Plus, AlertTriangle, ImagePlus, X, Palette, Pencil, Clock } from "lucide-react";
import { themes, getThemeById, applyTheme, DEFAULT_THEME } from "../../themes";
import { defaultHomepageSettings, type HomepageSettings } from "../HomePage/useHomepageSettings";

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
      const isPng = file.type === 'image/png';
      canvas.toBlob(
        b => b ? resolve(b) : reject(new Error('Resize failed')),
        isPng ? 'image/png' : 'image/jpeg',
        isPng ? undefined : 0.85
      );
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
  const fileExt = file.type === 'image/png' ? 'png' : 'jpg';
  fd.append('file', blob, `upload.${fileExt}`);
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
  nameAr?: string;
  description: string;
  price: string;
  category: string;
  available?: boolean;
  schedule?: {
    start: string;
    end: string;
    active: boolean;
  };
  image?: string;
  variants?: { label: string; price: string }[];
}

const DEFAULT_CATEGORIES = ["Pizza", "Burgers", "Pasta", "Desserts", "Drinks", "Salads"];
const API_URL = () => import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AdminAddItems() {
  const { isAdmin, loading: authLoading, currentUser } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<MenuItem>({ 
    name: "", 
    nameAr: "", 
    description: "", 
    price: "", 
    category: "",
    schedule: { start: "00:00", end: "23:59", active: false }
  });
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

  // Category Schedules state
  const [categorySchedules, setCategorySchedules] = useState<Record<string, { start: string; end: string; active: boolean }>>({});
  const [savingSchedule, setSavingSchedule] = useState<string | null>(null);

  const getToken = async () => {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error("Not authenticated");
    return token;
  };

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

  // Edit item
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [editForm, setEditForm] = useState<MenuItem>({ 
    name: "", 
    nameAr: "", 
    description: "", 
    price: "", 
    category: "",
    schedule: { start: "00:00", end: "23:59", active: false }
  });
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Variants state
  const [variants, setVariants] = useState<{ label: string; price: string }[]>([]);
  const [newVariantLabel, setNewVariantLabel] = useState("");
  const [newVariantPrice, setNewVariantPrice] = useState("");
  const [editVariants, setEditVariants] = useState<{ label: string; price: string }[]>([]);
  const [editVariantLabel, setEditVariantLabel] = useState("");
  const [editVariantPrice, setEditVariantPrice] = useState("");

  // Homepage Settings state
  const [homepageSettings, setHomepageSettings] = useState<HomepageSettings>(defaultHomepageSettings);
  const [savingHomepageSettings, setSavingHomepageSettings] = useState(false);
  const [homepageLogoPreview, setHomepageLogoPreview] = useState<string | null>(null);
  const [homepageLogoFile, setHomepageLogoFile] = useState<File | null>(null);
  const [homepageHeroPreview, setHomepageHeroPreview] = useState<string | null>(null);
  const [homepageHeroFile, setHomepageHeroFile] = useState<File | null>(null);
  const [homepageSplashPreview, setHomepageSplashPreview] = useState<string | null>(null);
  const [homepageSplashFile, setHomepageSplashFile] = useState<File | null>(null);
  const [homepageFaviconPreview, setHomepageFaviconPreview] = useState<string | null>(null);
  const [homepageFaviconFile, setHomepageFaviconFile] = useState<File | null>(null);
  const [homepageOgPreview, setHomepageOgPreview] = useState<string | null>(null);
  const [homepageOgFile, setHomepageOgFile] = useState<File | null>(null);
  // Per-card file map: key = card index, value = File
  const [crowdFavoriteFiles, setCrowdFavoriteFiles] = useState<Record<number, File>>({});

  // Card editor modal state
  const [cardEditorOpen, setCardEditorOpen] = useState(false);
  const [cardEditorIndex, setCardEditorIndex] = useState<number | null>(null); // null = new card
  const [cardEditorForm, setCardEditorForm] = useState<{ title: string; subtitle: string; action: 'add' | 'arrow'; image: string }>({ title: '', subtitle: '', action: 'add', image: '' });
  const [cardEditorFile, setCardEditorFile] = useState<File | null>(null);
  const [cardEditorPreview, setCardEditorPreview] = useState<string | null>(null);
  const [savingCard, setSavingCard] = useState(false);

  // Load everything on mount
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [menuRes, radSnap, catSnap, themeSnap, homeSnap, schedSnap] = await Promise.all([
          fetch(`${API_URL()}/api/menu`),
          get(ref(db, 'settings/deliveryRadiusKm')),
          get(ref(db, 'settings/categories')),
          get(ref(db, 'settings/activeTheme')),
          get(ref(db, 'settings/homepage')),
          get(ref(db, 'settings/categorySchedules')),
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
        if (homeSnap.exists()) {
          const homeData = homeSnap.val();
          // Normalise crowdFavorites: Firebase may return an object with numeric keys
          let crowdFavs = homeData.crowdFavorites || defaultHomepageSettings.crowdFavorites;
          if (crowdFavs && !Array.isArray(crowdFavs)) {
            crowdFavs = Object.values(crowdFavs);
          }
          setHomepageSettings({
            logoImage: homeData.logoImage || defaultHomepageSettings.logoImage,
            heroImage: homeData.heroImage || defaultHomepageSettings.heroImage,
            splashScreenImage: homeData.splashScreenImage || defaultHomepageSettings.splashScreenImage,
            faviconImage: homeData.faviconImage || defaultHomepageSettings.faviconImage,
            ogImage: homeData.ogImage || defaultHomepageSettings.ogImage,
            crowdFavorites: crowdFavs,
            aboutHeading: homeData.aboutHeading !== undefined ? homeData.aboutHeading : defaultHomepageSettings.aboutHeading,
            aboutSubheading: homeData.aboutSubheading !== undefined ? homeData.aboutSubheading : defaultHomepageSettings.aboutSubheading,
            footer: homeData.footer || defaultHomepageSettings.footer,
          });
        }
        if (schedSnap.exists()) {
          setCategorySchedules(schedSnap.val());
        }
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



  const updateCategorySchedule = async (cat: string, sched: { start: string; end: string; active: boolean }) => {
    setSavingSchedule(cat);
    try {
      await set(ref(db, `settings/categorySchedules/${cat}`), sched);
      setCategorySchedules(prev => ({ ...prev, [cat]: sched }));
      toast.success(`Schedule for ${cat} updated!`);
    } catch {
      toast.error("Failed to save category schedule.");
    } finally {
      setSavingSchedule(null);
    }
  };
  const saveHomepageSettings = async () => {
    setSavingHomepageSettings(true);
    const newSettings = structuredClone(homepageSettings);
    try {
      if (homepageLogoFile) {
        newSettings.logoImage = await uploadToCloudinary(homepageLogoFile);
      }
      if (homepageHeroFile) {
        newSettings.heroImage = await uploadToCloudinary(homepageHeroFile);
      }
      if (homepageSplashFile) {
        newSettings.splashScreenImage = await uploadToCloudinary(homepageSplashFile);
      }
      if (homepageFaviconFile) {
        newSettings.faviconImage = await uploadToCloudinary(homepageFaviconFile);
      }
      if (homepageOgFile) {
        newSettings.ogImage = await uploadToCloudinary(homepageOgFile);
      }
      // Upload any staged card images
      for (const [idxStr, file] of Object.entries(crowdFavoriteFiles)) {
        const idx = Number(idxStr);
        if (file && newSettings.crowdFavorites[idx]) {
          newSettings.crowdFavorites[idx].image = await uploadToCloudinary(file);
        }
      }

      await set(ref(db, 'settings/homepage'), newSettings);
      setHomepageSettings(newSettings);

      setHomepageLogoFile(null);
      setHomepageLogoPreview(null);
      setHomepageHeroFile(null);
      setHomepageHeroPreview(null);
      setHomepageSplashFile(null);
      setHomepageSplashPreview(null);
      setHomepageFaviconFile(null);
      setHomepageFaviconPreview(null);
      setHomepageOgFile(null);
      setHomepageOgPreview(null);
      setCrowdFavoriteFiles({});

      toast.success("Homepage settings saved!");
    } catch {
      toast.error("Failed to save homepage settings.");
    } finally {
      setSavingHomepageSettings(false);
    }
  };

  // ─── Open card editor ───────────────────────────────────────────
  const openCardEditor = (idx: number | null) => {
    if (idx === null) {
      // New card
      setCardEditorForm({ title: '', subtitle: '', action: 'add', image: '' });
      setCardEditorFile(null);
      setCardEditorPreview(null);
    } else {
      const card = homepageSettings.crowdFavorites[idx];
      setCardEditorForm({ title: card.title, subtitle: card.subtitle, action: card.action, image: card.image });
      setCardEditorFile(null);
      setCardEditorPreview(card.image);
    }
    setCardEditorIndex(idx);
    setCardEditorOpen(true);
  };

  // ─── Save card from modal ───────────────────────────────────────
  const saveCard = async () => {
    setSavingCard(true);
    try {
      const newSettings = structuredClone(homepageSettings);

      // cardEditorForm.image holds the current URL (may be auto-filled from menu item)
      // Only upload to Cloudinary if the admin picked a new local file
      let imageUrl = cardEditorForm.image;
      if (cardEditorFile) {
        imageUrl = await uploadToCloudinary(cardEditorFile);
      }

      const cardData = { ...cardEditorForm, image: imageUrl };

      if (cardEditorIndex === null) {
        // Add new card
        const newId = Date.now();
        newSettings.crowdFavorites.push({ id: newId, ...cardData });
      } else {
        // Update existing
        newSettings.crowdFavorites[cardEditorIndex] = {
          ...newSettings.crowdFavorites[cardEditorIndex],
          ...cardData,
        };
      }

      await set(ref(db, 'settings/homepage'), newSettings);
      setHomepageSettings(newSettings);
      setCardEditorOpen(false);
      toast.success(cardEditorIndex === null ? 'Card added!' : 'Card updated!');
    } catch {
      toast.error('Failed to save card.');
    } finally {
      setSavingCard(false);
    }
  };

  // ─── Delete a crowd favorite card ──────────────────────────────
  const deleteCard = async (idx: number) => {
    const newSettings = structuredClone(homepageSettings);
    newSettings.crowdFavorites.splice(idx, 1);
    try {
      await set(ref(db, 'settings/homepage'), newSettings);
      setHomepageSettings(newSettings);
      toast.success('Card removed.');
    } catch {
      toast.error('Failed to remove card.');
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
    if (!formData.name || !formData.description || (!formData.price && variants.length === 0)) {
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

      const payload = {
        ...formData,
        image: imageUrl,
        ...(variants.length > 0 ? { variants, price: variants[0].price } : {}),
      };

      const res = await fetch(`${API_URL()}/api/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to add item');
      const newItem = await res.json();
      setMessage({ type: "success", text: `✅ ${formData.name} added!` });
      setFormData({ name: "", nameAr: "", description: "", price: "", category: categories[0] || "", schedule: { start: "00:00", end: "23:59", active: false } });
      setImageFile(null);
      setImagePreview(null);
      setVariants([]);
      setNewVariantLabel("");
      setNewVariantPrice("");
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
    return <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center"><p>Loading...</p></div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] p-8 flex flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-6">You must be an administrator to access this page.</p>
        {!currentUser && (
          <button onClick={() => setIsLoginModalOpen(true)} className="px-6 py-3 bg-[var(--accent)] text-white rounded-xl font-medium hover:bg-[var(--accent-hover)]">
            Log In
          </button>
        )}
        <LoginSignupModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      </div>
    );
  }

  const filteredItems = menuItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-6 pt-20">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── LEFT COLUMN ── */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-8">

        {/* ── ADD ITEM ── */}
        <section>
          <h1 className="text-[36px] font-black text-[var(--text-primary)] mb-6">Add Menu Item</h1>
          <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] rounded-[22px] p-8 shadow-sm border border-[var(--bg-card-border)]">
            <div className="mb-5">
              <label className="block text-[15px] font-semibold text-[var(--text-primary)] mb-2">Item Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., Chicken Shawarma" className="w-full px-4 py-3 border border-[var(--bg-input-border)] rounded-[12px] text-[16px] focus:outline-none focus:border-[var(--accent)]" />
            </div>
            <div className="mb-5">
              <label className="block text-[15px] font-semibold text-[var(--text-primary)] mb-2">Arabic Name <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="text" name="nameAr" value={formData.nameAr || ""} onChange={handleChange} placeholder="e.g., شاورما دجاج" dir="rtl" className="w-full px-4 py-3 border border-[var(--bg-input-border)] rounded-[12px] text-[16px] focus:outline-none focus:border-[var(--accent)] text-right" />
            </div>
            <div className="mb-5">
              <label className="block text-[15px] font-semibold text-[var(--text-primary)] mb-2">Description *</label>
              <textarea name="description" value={formData.description} onChange={handleChange} placeholder="e.g., Grilled chicken with garlic sauce, fresh veggies" rows={3} className="w-full px-4 py-3 border border-[var(--bg-input-border)] rounded-[12px] text-[16px] focus:outline-none focus:border-[var(--accent)]" />
            </div>
            <div className="mb-5">
              <label className="block text-[15px] font-semibold text-[var(--text-primary)] mb-2">Price * <span className="text-gray-400 font-normal">(leave blank if using variants)</span></label>
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-semibold">AED</span>
                <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="35" step="0.01" className="flex-1 px-4 py-3 border border-[var(--bg-input-border)] rounded-[12px] text-[16px] focus:outline-none focus:border-[var(--accent)]" disabled={variants.length > 0} />
              </div>
            </div>

            {/* ── VARIANTS BUILDER ── */}
            <div className="mb-6">
              <label className="block text-[15px] font-semibold text-[var(--text-primary)] mb-1">Size Variants <span className="text-gray-400 font-normal">(optional — e.g. Half / Full)</span></label>
              <p className="text-[12px] text-gray-400 mb-3">Add variants when the item has multiple sizes at different prices. If variants are added, the Price field above is ignored.</p>
              {variants.length > 0 && (
                <div className="flex flex-col gap-2 mb-3">
                  {variants.map((v, i) => (
                    <div key={i} className="flex items-center justify-between bg-[var(--bg-primary)] border border-[var(--bg-card-border)] rounded-[10px] px-4 py-2">
                      <span className="font-semibold text-[14px] text-[var(--text-primary)]">{v.label}</span>
                      <span className="text-[14px] text-[var(--text-price)]">AED {v.price}</span>
                      <button type="button" onClick={() => setVariants(prev => prev.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500 ml-3"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text" placeholder="Label (e.g. Half)" value={newVariantLabel}
                  onChange={e => setNewVariantLabel(e.target.value)}
                  className="flex-1 px-3 py-2 border border-[var(--bg-input-border)] rounded-[10px] text-[14px] focus:outline-none focus:border-[var(--accent)]"
                />
                <input
                  type="number" placeholder="Price" value={newVariantPrice}
                  onChange={e => setNewVariantPrice(e.target.value)} step="0.01"
                  className="w-28 px-3 py-2 border border-[var(--bg-input-border)] rounded-[10px] text-[14px] focus:outline-none focus:border-[var(--accent)]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newVariantLabel.trim() || !newVariantPrice.trim()) return;
                    setVariants(prev => [...prev, { label: newVariantLabel.trim(), price: newVariantPrice.trim() }]);
                    setNewVariantLabel(""); setNewVariantPrice("");
                  }}
                  className="px-4 py-2 bg-[#1c1c1a] text-white rounded-[10px] font-bold text-[13px] hover:bg-gray-800 flex items-center gap-1"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-[15px] font-semibold text-[var(--text-primary)] mb-2">Category *</label>
              <select name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-3 border border-[var(--bg-input-border)] rounded-[12px] text-[16px] focus:outline-none focus:border-[var(--accent)]">
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            {/* ── AUTOMATED SCHEDULE ── */}
            <div className="mb-6 bg-[var(--bg-primary)] p-5 rounded-[16px] border border-[var(--bg-card-border)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <label className="block text-[15px] font-bold text-[var(--text-primary)]">Automated Stock-Out</label>
                  <p className="text-[12px] text-gray-500">Automatically mark as "Sold Out" outside these hours.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, schedule: { ...p.schedule!, active: !p.schedule?.active } }))}
                  className={`w-12 h-7 rounded-full transition-colors relative ${formData.schedule?.active ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${formData.schedule?.active ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              {formData.schedule?.active && (
                <div className="flex gap-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Available From</label>
                    <input 
                      type="time" 
                      value={formData.schedule.start} 
                      onChange={e => setFormData(p => ({ ...p, schedule: { ...p.schedule!, start: e.target.value } }))}
                      className="w-full px-3 py-2 border border-[var(--bg-input-border)] rounded-[8px] focus:outline-none focus:border-[var(--accent)]" 
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Available Until</label>
                    <input 
                      type="time" 
                      value={formData.schedule.end} 
                      onChange={e => setFormData(p => ({ ...p, schedule: { ...p.schedule!, end: e.target.value } }))}
                      className="w-full px-3 py-2 border border-[var(--bg-input-border)] rounded-[8px] focus:outline-none focus:border-[var(--accent)]" 
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Image Upload */}
            <div className="mb-6">
              <label className="block text-[15px] font-semibold text-[var(--text-primary)] mb-2">Item Photo <span className="text-gray-400 font-normal">(optional)</span></label>
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-full h-[180px] object-cover rounded-[16px] border border-[var(--bg-card-border)]" />
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    className="absolute top-2 right-2 bg-[var(--bg-card)] rounded-full p-1.5 shadow-md hover:bg-red-50 transition-colors"
                  >
                    <X size={16} className="text-red-500" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 w-full h-[140px] border-2 border-dashed border-[var(--bg-input-border)] rounded-[16px] cursor-pointer hover:border-[var(--accent)] transition-colors text-gray-400 hover:text-[var(--accent)]">
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
            <button type="submit" disabled={loading || uploadingImage} className="w-full bg-[var(--accent)] text-white py-3 rounded-[12px] text-[16px] font-bold hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50">
              {uploadingImage ? "Uploading photo..." : loading ? "Adding..." : "Add Item"}
            </button>
          </form>
        </section>

        
        {/* ── MANAGE ITEMS ── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[28px] font-black text-[var(--text-primary)]">Menu Items ({menuItems.length})</h2>
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
            className="w-full px-4 py-3 mb-5 border border-[var(--bg-input-border)] rounded-[12px] text-[16px] focus:outline-none focus:border-[var(--accent)]"
          />

          {fetchingMenu ? (
            <p className="text-center text-gray-500 py-8">Loading menu...</p>
          ) : filteredItems.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No items found.</p>
          ) : (
            <div className="space-y-3">
              {filteredItems.map(item => (
                <div key={item.id} className="bg-[var(--bg-card)] rounded-[16px] p-4 flex items-center justify-between border border-[var(--bg-card-border)] shadow-sm">
                  <div className="min-w-0 flex-1 mr-4">
                    <h3 className="font-bold text-[17px] text-[var(--text-primary)] truncate">{item.name}</h3>
                    <p className="text-gray-500 text-[13px]">AED {item.price} · {item.category}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[12px] font-bold ${item.available !== false ? 'text-green-500' : 'text-red-500'}`}>
                      {item.available !== false ? 'IN STOCK' : 'OUT'}
                    </span>
                    <button
                      onClick={() => toggleAvailability(item)}
                      className={`w-12 h-7 rounded-full transition-colors relative ${item.available !== false ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <div className={`w-5 h-5 bg-[var(--bg-card)] rounded-full absolute top-1 transition-all ${item.available !== false ? 'right-1' : 'left-1'}`} />
                    </button>
                    <button
                      onClick={() => {
                        setEditItem(item);
                        setEditForm({ 
                          ...item, 
                          schedule: item.schedule || { start: "00:00", end: "23:59", active: false } 
                        });
                        setEditImagePreview(item.image || null);
                        setEditImageFile(null);
                        setEditVariants(item.variants || []);
                        setEditVariantLabel("");
                        setEditVariantPrice("");
                      }}
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit item"
                    >
                      <Pencil size={18} />
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

        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-8">

        {/* ── CATEGORIES ── */}
        <section>
          <h2 className="text-[28px] font-black text-[var(--text-primary)] mb-5">Manage Categories</h2>
          <div className="bg-[var(--bg-card)] rounded-[22px] p-6 shadow-sm border border-[var(--bg-card-border)]">

            {/* Add new category */}
            <div className="flex gap-3 mb-6">
              <input
                type="text"
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                placeholder="New category name..."
                className="flex-1 px-4 py-3 border border-[var(--bg-input-border)] rounded-[12px] text-[16px] focus:outline-none focus:border-[var(--accent)]"
              />
              <button onClick={addCategory} disabled={savingCategory || !newCategory.trim()} className="flex items-center gap-2 bg-[#1c1c1a] text-white px-5 py-3 rounded-[12px] font-bold hover:bg-gray-800 disabled:opacity-40 transition-colors">
                <Plus size={18} /> Add
              </button>
            </div>

            {/* Category list */}
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <div key={cat} className="flex items-center gap-2 bg-[var(--bg-primary)] border border-[var(--bg-card-border)] rounded-full px-4 py-2">
                  <span className="font-semibold text-[14px] text-[var(--text-primary)]">{cat}</span>
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

          {/* ────── CATEGORY SCHEDULES ────── */}
          <div className="mt-8">
            <h3 className="text-[20px] font-black text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Clock size={20} /> Automated Category Schedules
            </h3>
            <p className="text-[13px] text-gray-500 mb-6">
              Set "Open" and "Close" times for entire categories. Items will automatically appear as "Sold Out" outside these hours.
            </p>
            
            <div className="space-y-4">
              {categories.map(cat => {
                const sched = categorySchedules[cat] || { start: "00:00", end: "23:59", active: false };
                const isSaving = savingSchedule === cat;
                
                return (
                  <div key={cat} className="bg-[var(--bg-card)] rounded-[18px] p-5 shadow-sm border border-[var(--bg-card-border)] flex flex-col xl:flex-row xl:items-center gap-4 xl:gap-6">
                    <div className="flex-1 min-w-[120px]">
                      <h4 className="font-bold text-[16px] text-[var(--text-primary)] mb-1">{cat}</h4>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sched.active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                          {sched.active ? 'AUTO-SCHEDULING ACTIVE' : 'MANUAL CONTROL'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 w-full mt-2 xl:mt-0">
                      <div className="flex flex-wrap gap-2 flex-1 min-w-[200px]">
                        <div className="flex-1 min-w-[130px]">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Start</label>
                          <input 
                            type="time" 
                            value={sched.start}
                            disabled={!sched.active}
                            onChange={e => {
                              const newSched = { ...sched, start: e.target.value };
                              updateCategorySchedule(cat, newSched);
                            }}
                            className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--bg-input-border)] rounded-[8px] text-[14px] disabled:opacity-50 focus:outline-none focus:border-[var(--accent)]"
                          />
                        </div>
                        <div className="flex-1 min-w-[130px]">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">End</label>
                          <input 
                            type="time" 
                            value={sched.end}
                            disabled={!sched.active}
                            onChange={e => {
                              const newSched = { ...sched, end: e.target.value };
                              updateCategorySchedule(cat, newSched);
                            }}
                            className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--bg-input-border)] rounded-[8px] text-[14px] disabled:opacity-50 focus:outline-none focus:border-[var(--accent)]"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col items-center">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Status</label>
                        <button
                          onClick={() => {
                            const newSched = { ...sched, active: !sched.active };
                            updateCategorySchedule(cat, newSched);
                          }}
                          disabled={isSaving}
                          className={`w-12 h-7 rounded-full transition-colors relative ${sched.active ? 'bg-green-500' : 'bg-gray-300'} ${isSaving ? 'opacity-50 cursor-wait' : ''}`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${sched.active ? 'right-1' : 'left-1'}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── STORE SETTINGS ── */}
        <section>
          <h2 className="text-[28px] font-black text-[var(--text-primary)] mb-5">Store Settings</h2>
          <div className="bg-[var(--bg-card)] rounded-[22px] p-6 shadow-sm border border-[var(--bg-card-border)]">
            <label className="block text-[15px] font-semibold text-[var(--text-primary)] mb-1">Max Delivery Radius (km)</label>
            <p className="text-sm text-gray-500 mb-4">Orders outside this range from the restaurant will be blocked.</p>
            <div className="flex gap-4 items-center">
              <input type="number" value={deliveryRadius} onChange={e => setDeliveryRadius(Number(e.target.value))} className="w-32 px-4 py-3 border border-[var(--bg-input-border)] rounded-[12px] text-[16px] focus:outline-none focus:border-[var(--accent)]" />
              <button onClick={saveSettings} disabled={savingSettings} className="bg-[#1c1c1a] text-white px-6 py-3 rounded-[12px] font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors">
                {savingSettings ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </section>

        {/* ── HOMEPAGE SETTINGS ── */}
        <section>
          <h2 className="text-[28px] font-black text-[var(--text-primary)] mb-5">Homepage Settings</h2>
          <div className="bg-[var(--bg-card)] rounded-[22px] p-6 shadow-sm border border-[var(--bg-card-border)] flex flex-col gap-6">
            
            {/* Top Bar Logo */}
            <div>
              <label className="block text-[15px] font-semibold text-[var(--text-primary)] mb-2">Top Bar Logo</label>
              <div className="flex gap-4 items-center">
                <div className="w-24 h-24 bg-[var(--bg-primary)] rounded-[12px] border border-[var(--bg-card-border)] overflow-hidden flex items-center justify-center p-2">
                   <img src={homepageLogoPreview || homepageSettings.logoImage} className="max-w-full max-h-full object-contain" alt="Logo preview" />
                </div>
                <label className="bg-[#1c1c1a] text-white px-5 py-2.5 rounded-[12px] font-bold text-[14px] hover:bg-gray-800 cursor-pointer transition-colors shadow-sm">
                  Change Logo
                  <input type="file" accept="image/*" className="hidden" onChange={e => {
                    if (e.target.files?.[0]) {
                      setHomepageLogoFile(e.target.files[0]);
                      setHomepageLogoPreview(URL.createObjectURL(e.target.files[0]));
                    }
                  }} />
                </label>
              </div>
            </div>

            {/* Hero Image */}
            <div>
              <label className="block text-[15px] font-semibold text-[var(--text-primary)] mb-2">Hero Background Image</label>
              <div className="flex gap-4 items-start flex-col">
                <div className="w-full h-40 bg-[var(--bg-primary)] rounded-[16px] border border-[var(--bg-card-border)] overflow-hidden relative shadow-inner">
                   <img src={homepageHeroPreview || homepageSettings.heroImage} className="w-full h-full object-cover" alt="Hero preview" />
                </div>
                <label className="bg-[#1c1c1a] text-white px-5 py-2.5 rounded-[12px] font-bold text-[14px] hover:bg-gray-800 cursor-pointer transition-colors shadow-sm">
                  Change Hero Image
                  <input type="file" accept="image/*" className="hidden" onChange={e => {
                    if (e.target.files?.[0]) {
                      setHomepageHeroFile(e.target.files[0]);
                      setHomepageHeroPreview(URL.createObjectURL(e.target.files[0]));
                    }
                  }} />
                </label>
              </div>
            </div>

            {/* Splash Screen */}
            <div>
              <label className="block text-[15px] font-semibold text-[var(--text-primary)] mb-2">Splash Screen Image <span className="text-gray-400 font-normal">(Shown while app loads)</span></label>
              <div className="flex gap-4 items-center">
                <div className="w-20 h-20 bg-[var(--bg-primary)] rounded-[12px] border border-[var(--bg-card-border)] overflow-hidden flex items-center justify-center p-2">
                   {homepageSplashPreview || homepageSettings.splashScreenImage ? (
                     <img src={homepageSplashPreview || homepageSettings.splashScreenImage} className="max-w-full max-h-full object-contain" alt="Splash preview" />
                   ) : (
                     <span className="text-gray-400 text-[10px]">None</span>
                   )}
                </div>
                <label className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-[12px] font-bold text-[14px] hover:bg-gray-200 cursor-pointer transition-colors shadow-sm border border-gray-200">
                  Select Splash Image
                  <input type="file" accept="image/*" className="hidden" onChange={e => {
                    if (e.target.files?.[0]) {
                      setHomepageSplashFile(e.target.files[0]);
                      setHomepageSplashPreview(URL.createObjectURL(e.target.files[0]));
                    }
                  }} />
                </label>
              </div>
            </div>

            {/* Favicon */}
            <div>
              <label className="block text-[15px] font-semibold text-[var(--text-primary)] mb-2">App Icon (Favicon) <span className="text-gray-400 font-normal">(Used when adding to Home Screen & Browser tab)</span></label>
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 bg-[var(--bg-primary)] rounded-full border border-[var(--bg-card-border)] overflow-hidden flex items-center justify-center p-2">
                   {homepageFaviconPreview || homepageSettings.faviconImage ? (
                     <img src={homepageFaviconPreview || homepageSettings.faviconImage} className="w-full h-full object-cover" alt="Favicon preview" />
                   ) : (
                     <span className="text-gray-400 text-[10px]">None</span>
                   )}
                </div>
                <label className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-[12px] font-bold text-[14px] hover:bg-gray-200 cursor-pointer transition-colors shadow-sm border border-gray-200">
                  Select App Icon
                  <input type="file" accept="image/*" className="hidden" onChange={e => {
                    if (e.target.files?.[0]) {
                      setHomepageFaviconFile(e.target.files[0]);
                      setHomepageFaviconPreview(URL.createObjectURL(e.target.files[0]));
                    }
                  }} />
                </label>
              </div>
            </div>

            {/* OG Image */}
            <div>
              <label className="block text-[15px] font-semibold text-[var(--text-primary)] mb-2">Link Preview Image <span className="text-gray-400 font-normal">(Shown on WhatsApp, iMessage, etc)</span></label>
              <div className="flex gap-4 items-start flex-col">
                <div className="w-64 h-36 bg-[var(--bg-primary)] rounded-[12px] border border-[var(--bg-card-border)] overflow-hidden flex items-center justify-center relative shadow-inner">
                   {homepageOgPreview || homepageSettings.ogImage ? (
                     <img src={homepageOgPreview || homepageSettings.ogImage} className="w-full h-full object-cover" alt="OG Image preview" />
                   ) : (
                     <span className="text-gray-400 text-[12px]">No image</span>
                   )}
                </div>
                <label className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-[12px] font-bold text-[14px] hover:bg-gray-200 cursor-pointer transition-colors shadow-sm border border-gray-200">
                  Select Preview Image
                  <input type="file" accept="image/*" className="hidden" onChange={e => {
                    if (e.target.files?.[0]) {
                      setHomepageOgFile(e.target.files[0]);
                      setHomepageOgPreview(URL.createObjectURL(e.target.files[0]));
                    }
                  }} />
                </label>
              </div>
            </div>

            {/* Crowd Favorites */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[15px] font-semibold text-[var(--text-primary)]">Crowd Favorite Cards</label>
                <button
                  type="button"
                  onClick={() => openCardEditor(null)}
                  className="flex items-center gap-1.5 bg-[#1c1c1a] text-white px-4 py-2 rounded-[10px] font-bold text-[13px] hover:bg-gray-800 transition-colors"
                >
                  <Plus size={15} /> Add Card
                </button>
              </div>
              <p className="text-[13px] text-gray-500 mb-4">These cards appear below the hero section. Tap the pencil to edit or trash to remove. We recommend 4:5 aspect ratio images.</p>

              {homepageSettings.crowdFavorites.length === 0 && (
                <p className="text-center text-gray-400 text-[14px] py-6">No cards yet. Click "Add Card" to create one.</p>
              )}

              <div className="flex flex-col gap-3">
                {homepageSettings.crowdFavorites.map((card, idx) => (
                  <div key={card.id} className="bg-[var(--bg-primary)] border border-[var(--bg-card-border)] rounded-[16px] p-4 flex items-center gap-4 shadow-sm">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-[10px] overflow-hidden flex-shrink-0 bg-gray-100">
                      <img src={card.image} className="w-full h-full object-cover" alt={card.title} />
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[15px] text-[var(--text-primary)] truncate">{card.title || <span className="text-gray-400 italic">Untitled</span>}</p>
                      <p className="text-[12px] text-gray-500 truncate">{card.subtitle}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        {card.action === 'add' ? '+ ADD BUTTON' : '→ ARROW BUTTON'}
                      </span>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => openCardEditor(idx)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit card"
                      >
                        <Pencil size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCard(idx)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove card"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* About Info */}
            <div>
              <label className="block text-[15px] font-semibold text-[var(--text-primary)] mb-2">About Section</label>
              <p className="text-[13px] text-gray-500 mb-4">Edit the about content that appears on the homepage.</p>
              <div className="flex flex-col gap-4">
                <div>
                     <label className="text-[11px] font-bold text-gray-500 tracking-wider uppercase mb-1 block">Heading</label>
                     <input type="text" className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--bg-input-border)] rounded-[12px] text-[15px] font-semibold focus:outline-none focus:border-[var(--accent)] transition-colors" value={homepageSettings.aboutHeading} onChange={e => {
                        const newSettings = structuredClone(homepageSettings);
                        newSettings.aboutHeading = e.target.value;
                        setHomepageSettings(newSettings);
                     }} />
                </div>
                <div>
                     <label className="text-[11px] font-bold text-gray-500 tracking-wider uppercase mb-1 block">Subheading</label>
                     <textarea rows={3} className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--bg-input-border)] rounded-[12px] text-[14px] text-gray-600 focus:outline-none focus:border-[var(--accent)] transition-colors" value={homepageSettings.aboutSubheading} onChange={e => {
                        const newSettings = structuredClone(homepageSettings);
                        newSettings.aboutSubheading = e.target.value;
                        setHomepageSettings(newSettings);
                     }} />
                </div>
              </div>
            </div>

            {/* Footer Settings */}
            <div>
              <label className="block text-[15px] font-semibold text-[var(--text-primary)] mb-2">Footer Links</label>
              <p className="text-[13px] text-gray-500 mb-4">Manage the links in the footer of the homepage.</p>
              <div className="grid grid-cols-1 gap-4">
                <div>
                     <label className="text-[11px] font-bold text-gray-500 tracking-wider uppercase mb-1 block">Location / Google Maps Link</label>
                     <input type="text" className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--bg-input-border)] rounded-[12px] text-[15px] font-semibold focus:outline-none focus:border-[var(--accent)] transition-colors" value={homepageSettings.footer?.locationUrl || ''} onChange={e => {
                        const newSettings = structuredClone(homepageSettings);
                        if (!newSettings.footer) newSettings.footer = defaultHomepageSettings.footer;
                        newSettings.footer.locationUrl = e.target.value;
                        setHomepageSettings(newSettings);
                     }} />
                </div>
                <div>
                     <label className="text-[11px] font-bold text-gray-500 tracking-wider uppercase mb-1 block">WhatsApp Link (wa.me/...)</label>
                     <input type="text" className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--bg-input-border)] rounded-[12px] text-[15px] font-semibold focus:outline-none focus:border-[var(--accent)] transition-colors" value={homepageSettings.footer?.whatsappUrl || ''} onChange={e => {
                        const newSettings = structuredClone(homepageSettings);
                        if (!newSettings.footer) newSettings.footer = defaultHomepageSettings.footer;
                        newSettings.footer.whatsappUrl = e.target.value;
                        setHomepageSettings(newSettings);
                     }} />
                </div>
                <div>
                     <label className="text-[11px] font-bold text-gray-500 tracking-wider uppercase mb-1 block">Instagram Link</label>
                     <input type="text" className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--bg-input-border)] rounded-[12px] text-[15px] font-semibold focus:outline-none focus:border-[var(--accent)] transition-colors" value={homepageSettings.footer?.instagramUrl || ''} onChange={e => {
                        const newSettings = structuredClone(homepageSettings);
                        if (!newSettings.footer) newSettings.footer = defaultHomepageSettings.footer;
                        newSettings.footer.instagramUrl = e.target.value;
                        setHomepageSettings(newSettings);
                     }} />
                </div>
                <div>
                     <label className="text-[11px] font-bold text-gray-500 tracking-wider uppercase mb-1 block">Facebook Link</label>
                     <input type="text" className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--bg-input-border)] rounded-[12px] text-[15px] font-semibold focus:outline-none focus:border-[var(--accent)] transition-colors" value={homepageSettings.footer?.facebookUrl || ''} onChange={e => {
                        const newSettings = structuredClone(homepageSettings);
                        if (!newSettings.footer) newSettings.footer = defaultHomepageSettings.footer;
                        newSettings.footer.facebookUrl = e.target.value;
                        setHomepageSettings(newSettings);
                     }} />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button 
                onClick={saveHomepageSettings} 
                disabled={savingHomepageSettings} 
                className="bg-[var(--accent)] text-white px-6 py-4 rounded-[14px] font-black tracking-wide text-[16px] hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-all w-full shadow-md active:scale-[0.98]"
              >
                {savingHomepageSettings ? "SAVING SETTINGS..." : "SAVE HOMEPAGE SETTINGS"}
              </button>
            </div>
          </div>
        </section>

        {/* ── THEME PICKER ── */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <Palette size={24} className="text-[var(--text-primary)]" />
            <h2 className="text-[28px] font-black text-[var(--text-primary)]">Site Theme</h2>
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
                    isActive ? 'border-[var(--accent)] shadow-lg scale-[1.02]' : 'border-[var(--bg-card-border)] hover:border-gray-400'
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
                  <span className="text-[12px] font-bold text-[var(--text-primary)] block">{theme.emoji} {theme.name}</span>
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

        </div>

        {/* Bottom padding */}
        <div className="h-24" />
      </div>

      {/* ── CARD EDITOR MODAL ── */}
      {cardEditorOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-[var(--bg-card)] rounded-t-[24px] sm:rounded-[24px] p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[22px] font-black text-[var(--text-primary)]">
                {cardEditorIndex === null ? 'Add New Card' : 'Edit Card'}
              </h3>
              <button onClick={() => setCardEditorOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              {/* Image */}
              <div>
                <label className="block text-[14px] font-semibold text-[var(--text-primary)] mb-2">Card Image</label>
                {cardEditorPreview ? (
                  <div className="relative">
                    <img src={cardEditorPreview} alt="Preview" className="w-full h-[200px] object-cover rounded-[14px] border border-[var(--bg-card-border)]" />
                    <button
                      type="button"
                      onClick={() => { setCardEditorFile(null); setCardEditorPreview(null); setCardEditorForm(p => ({ ...p, image: '' })); }}
                      className="absolute top-2 right-2 bg-[var(--bg-card)] rounded-full p-1.5 shadow-md hover:bg-red-50"
                    >
                      <X size={14} className="text-red-500" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 w-full h-[160px] border-2 border-dashed border-[var(--bg-input-border)] rounded-[14px] cursor-pointer hover:border-[var(--accent)] transition-colors text-gray-400 hover:text-[var(--accent)]">
                    <ImagePlus size={28} />
                    <span className="text-[14px] font-medium">Tap to pick an image</span>
                    <span className="text-[12px]">JPG, PNG, WEBP up to 10MB</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setCardEditorFile(file);
                        setCardEditorPreview(URL.createObjectURL(file));
                      }
                    }} />
                  </label>
                )}
              </div>

              {/* Menu Item picker — title must match a real menu item */}
              <div>
                <label className="block text-[14px] font-semibold text-[var(--text-primary)] mb-1">Menu Item *</label>
                <p className="text-[12px] text-gray-400 mb-2">Cards are linked to a menu item. The card hides automatically when that item is stocked out.</p>
                <select
                  value={cardEditorForm.title}
                  onChange={e => {
                    const selectedName = e.target.value;
                    const matched = menuItems.find(m => m.name === selectedName);
                    setCardEditorForm(p => ({
                      ...p,
                      title: selectedName,
                      // Auto-fill image from menu item if no custom image set yet
                      image: (p.image || !matched?.image) ? p.image : matched?.image || '',
                    }));
                    // Auto-fill image preview from menu item if no file chosen yet
                    if (matched?.image && !cardEditorFile) {
                      setCardEditorPreview(matched.image);
                      setCardEditorForm(p => ({ ...p, title: selectedName, image: matched.image || '' }));
                    }
                  }}
                  className="w-full px-4 py-3 border border-[var(--bg-input-border)] rounded-[12px] text-[15px] font-semibold focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="">— Select a menu item —</option>
                  {menuItems.map(item => (
                    <option key={item.id} value={item.name}>
                      {item.name} {item.available === false ? '(Out of Stock)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-[14px] font-semibold text-[var(--text-primary)] mb-1">Subtitle / Description</label>
                <input
                  type="text"
                  value={cardEditorForm.subtitle}
                  onChange={e => setCardEditorForm(p => ({ ...p, subtitle: e.target.value }))}
                  placeholder="e.g., Original or Spicy Bone-in"
                  className="w-full px-4 py-3 border border-[var(--bg-input-border)] rounded-[12px] text-[14px] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              {/* Button style */}
              <div>
                <label className="block text-[14px] font-semibold text-[var(--text-primary)] mb-2">Card Button Style</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCardEditorForm(p => ({ ...p, action: 'add' }))}
                    className={`flex-1 py-3 rounded-[12px] font-bold text-[14px] border-2 transition-all ${
                      cardEditorForm.action === 'add'
                        ? 'border-[var(--accent)] bg-red-50 text-[var(--accent)]'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    + Add Button
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardEditorForm(p => ({ ...p, action: 'arrow' }))}
                    className={`flex-1 py-3 rounded-[12px] font-bold text-[14px] border-2 transition-all ${
                      cardEditorForm.action === 'arrow'
                        ? 'border-[var(--accent)] bg-red-50 text-[var(--accent)]'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    → Arrow Button
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setCardEditorOpen(false)} className="flex-1 py-3 border-2 border-gray-200 rounded-[12px] font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button
                disabled={savingCard || !cardEditorForm.title.trim()}
                onClick={saveCard}
                className="flex-1 py-3 bg-[var(--accent)] text-white rounded-[12px] font-bold hover:bg-[var(--accent-hover)] disabled:opacity-40 transition-colors"
              >
                {savingCard ? 'Saving...' : (cardEditorIndex === null ? 'Add Card' : 'Save Changes')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT ITEM MODAL ── */}
      {editItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-[var(--bg-card)] rounded-t-[24px] sm:rounded-[24px] p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[22px] font-black text-[var(--text-primary)]">Edit Item</h3>
              <button onClick={() => setEditItem(null)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[14px] font-semibold text-[var(--text-primary)] mb-1">Name</label>
                <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-3 border border-[var(--bg-input-border)] rounded-[12px] text-[16px] focus:outline-none focus:border-[var(--accent)]" />
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-[var(--text-primary)] mb-1">Arabic Name <span className="text-gray-400 font-normal text-[12px]">(optional)</span></label>
                <input value={editForm.nameAr || ""} onChange={e => setEditForm(p => ({ ...p, nameAr: e.target.value }))} placeholder="e.g., شاورما دجاج" dir="rtl" className="w-full px-4 py-3 border border-[var(--bg-input-border)] rounded-[12px] text-[16px] focus:outline-none focus:border-[var(--accent)] text-right" />
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-[var(--text-primary)] mb-1">Description</label>
                <textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full px-4 py-3 border border-[var(--bg-input-border)] rounded-[12px] text-[16px] focus:outline-none focus:border-[var(--accent)]" />
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-[var(--text-primary)] mb-1">Price <span className="text-gray-400 font-normal text-[12px]">(ignored if variants set)</span></label>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">AED</span>
                  <input type="number" step="0.01" value={editForm.price} onChange={e => setEditForm(p => ({ ...p, price: e.target.value }))} disabled={editVariants.length > 0} className="flex-1 px-4 py-3 border border-[var(--bg-input-border)] rounded-[12px] text-[16px] focus:outline-none focus:border-[var(--accent)] disabled:opacity-50" />
                </div>
              </div>

              {/* ── EDIT VARIANTS ── */}
              <div>
                <label className="block text-[14px] font-semibold text-[var(--text-primary)] mb-1">Size Variants <span className="text-gray-400 font-normal text-[12px]">(optional)</span></label>
                {editVariants.length > 0 && (
                  <div className="flex flex-col gap-2 mb-3">
                    {editVariants.map((v, i) => (
                      <div key={i} className="flex items-center justify-between bg-[var(--bg-primary)] border border-[var(--bg-card-border)] rounded-[10px] px-4 py-2">
                        <span className="font-semibold text-[14px] text-[var(--text-primary)]">{v.label}</span>
                        <span className="text-[14px] text-[var(--text-price)]">AED {v.price}</span>
                        <button type="button" onClick={() => setEditVariants(prev => prev.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500 ml-3"><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input type="text" placeholder="Label" value={editVariantLabel} onChange={e => setEditVariantLabel(e.target.value)} className="flex-1 px-3 py-2 border border-[var(--bg-input-border)] rounded-[10px] text-[14px] focus:outline-none focus:border-[var(--accent)]" />
                  <input type="number" placeholder="Price" value={editVariantPrice} onChange={e => setEditVariantPrice(e.target.value)} step="0.01" className="w-28 px-3 py-2 border border-[var(--bg-input-border)] rounded-[10px] text-[14px] focus:outline-none focus:border-[var(--accent)]" />
                  <button type="button" onClick={() => {
                    if (!editVariantLabel.trim() || !editVariantPrice.trim()) return;
                    setEditVariants(prev => [...prev, { label: editVariantLabel.trim(), price: editVariantPrice.trim() }]);
                    setEditVariantLabel(""); setEditVariantPrice("");
                  }} className="px-3 py-2 bg-[#1c1c1a] text-white rounded-[10px] font-bold text-[12px] hover:bg-gray-800 flex items-center gap-1"><Plus size={13} /> Add</button>
                </div>
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-[var(--text-primary)] mb-1">Category</label>
                <select value={editForm.category} onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))} className="w-full px-4 py-3 border border-[var(--bg-input-border)] rounded-[12px] text-[16px] focus:outline-none focus:border-[var(--accent)]">
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              {/* Edit Schedule */}
              <div className="bg-[var(--bg-primary)] p-4 rounded-[12px] border border-[var(--bg-card-border)]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="block text-[14px] font-bold text-[var(--text-primary)]">Automated Stock-Out</label>
                    <p className="text-[11px] text-gray-500">Auto-hide outside these hours.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditForm(p => ({ ...p, schedule: { ...p.schedule!, active: !p.schedule?.active } }))}
                    className={`w-10 h-6 rounded-full transition-colors relative ${editForm.schedule?.active ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${editForm.schedule?.active ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                {editForm.schedule?.active && (
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 text-center">From</label>
                      <input 
                        type="time" 
                        value={editForm.schedule?.start} 
                        onChange={e => setEditForm(p => ({ ...p, schedule: { ...p.schedule!, start: e.target.value } }))}
                        className="w-full px-2 py-1.5 border border-[var(--bg-input-border)] rounded-[8px] text-[13px] focus:outline-none focus:border-[var(--accent)]" 
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 text-center">Until</label>
                      <input 
                        type="time" 
                        value={editForm.schedule?.end} 
                        onChange={e => setEditForm(p => ({ ...p, schedule: { ...p.schedule!, end: e.target.value } }))}
                        className="w-full px-2 py-1.5 border border-[var(--bg-input-border)] rounded-[8px] text-[13px] focus:outline-none focus:border-[var(--accent)]" 
                      />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-[var(--text-primary)] mb-1">Photo</label>
                {editImagePreview ? (
                  <div className="relative">
                    <img src={editImagePreview} alt="Preview" className="w-full h-[140px] object-cover rounded-[12px] border border-[var(--bg-card-border)]" />
                    <button type="button" onClick={() => { setEditImageFile(null); setEditImagePreview(null); }} className="absolute top-2 right-2 bg-[var(--bg-card)] rounded-full p-1.5 shadow-md hover:bg-red-50">
                      <X size={14} className="text-red-500" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-1 w-full h-[100px] border-2 border-dashed border-[var(--bg-input-border)] rounded-[12px] cursor-pointer hover:border-[var(--accent)] transition-colors text-gray-400 hover:text-[var(--accent)]">
                    <ImagePlus size={24} />
                    <span className="text-[12px] font-medium">Pick a photo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) { setEditImageFile(file); setEditImagePreview(URL.createObjectURL(file)); }
                    }} />
                  </label>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditItem(null)} className="flex-1 py-3 border-2 border-gray-200 rounded-[12px] font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button
                disabled={savingEdit || !editForm.name.trim() || !editForm.price.trim()}
                onClick={async () => {
                  if (!editItem?.id) return;
                  setSavingEdit(true);
                  try {
                    const token = await getToken();
                    let imageUrl = editImagePreview;

                    // Upload new image if a file was selected
                    if (editImageFile) {
                      imageUrl = await uploadToCloudinary(editImageFile);
                    }

                    const res = await fetch(`${API_URL()}/api/menu/${editItem.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                      body: JSON.stringify({
                        ...editForm,
                        image: imageUrl,
                        schedule: editForm.schedule, // Include schedule
                        ...(editVariants.length > 0 ? { variants: editVariants, price: editVariants[0].price } : { variants: [] }),
                      }),
                    });
                    if (!res.ok) throw new Error('Failed to update');
                    const updated = await res.json();
                    setMenuItems(prev => prev.map(m => m.id === editItem.id ? updated : m));
                    toast.success(`"${editForm.name}" updated!`);
                    setEditItem(null);
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : 'Update failed');
                  } finally {
                    setSavingEdit(false);
                  }
                }}
                className="flex-1 py-3 bg-[var(--accent)] text-white rounded-[12px] font-bold hover:bg-[var(--accent-hover)] disabled:opacity-40 transition-colors"
              >
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RESET CONFIRMATION MODAL ── */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6">
          <div className="bg-[var(--bg-card)] rounded-[24px] p-8 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-[20px] font-black text-[var(--text-primary)]">Reset Entire Menu</h3>
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
              className="w-full px-4 py-3 border border-[var(--bg-input-border)] rounded-[12px] text-[16px] mb-5 focus:outline-none focus:border-red-500"
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
