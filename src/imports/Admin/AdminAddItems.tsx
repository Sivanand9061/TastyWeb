import { useState } from "react";
import { useAuth } from "../../app/AuthContext";
import { auth } from "../../firebase";
import LoginSignupModal from "../Auth/LoginSignupModal";
import { ref, get, set } from "firebase/database";
import { db } from "../../firebase";

interface MenuItem {
  id?: string;
  name: string;
  description: string;
  price: string;
  category: string;
  available?: boolean;
}

export default function AdminAddItems() {
  const { isAdmin, loading: authLoading, currentUser } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [formData, setFormData] = useState<MenuItem>({
    name: "",
    description: "",
    price: "",
    category: "Pizza",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Management State
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [fetchingMenu, setFetchingMenu] = useState(true);

  const categories = ["Pizza", "Burgers", "Pasta", "Desserts", "Drinks", "Salads"];

  // Store Settings State
  const [deliveryRadius, setDeliveryRadius] = useState<number>(20);
  const [savingSettings, setSavingSettings] = useState(false);

  // Fetch Data on Load
  useState(() => {
    const fetchMenu = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/api/menu`);
        if (response.ok) {
          const items = await response.json();
          setMenuItems(items);
        }
      } catch (err) {
        console.error("Failed to fetch menu:", err);
      } finally {
        setFetchingMenu(false);
      }
    };
    
    const fetchSettings = async () => {
      const snap = await get(ref(db, 'settings/deliveryRadiusKm'));
      if (snap.exists()) {
        setDeliveryRadius(snap.val());
      }
    };

    fetchMenu();
    fetchSettings();
  });

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await set(ref(db, 'settings/deliveryRadiusKm'), deliveryRadius);
      setMessage({ type: "success", text: "Settings saved successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: "Failed to save settings." });
    } finally {
      setSavingSettings(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    if (!item.id) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Not logged in");

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const newStatus = item.available === false ? true : false; 
      
      const res = await fetch(`${apiUrl}/api/menu/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ available: newStatus })
      });

      if (res.ok) {
        setMenuItems(prev => prev.map(m => m.id === item.id ? { ...m, available: newStatus } : m));
      } else {
        alert("Failed to toggle item");
      }
    } catch (err) {
      console.error(err);
      alert("Error toggling item");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.price) {
      setMessage({ type: "error", text: "All fields required!" });
      return;
    }

    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();

      if (!token) {
        throw new Error("You must be logged in to do this");
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const response = await fetch(`${apiUrl}/api/menu`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to add item');

      const newItem = await response.json();
      setMessage({ type: "success", text: `✅ ${formData.name} added to menu!` });
      setFormData({ name: "", description: "", price: "", category: "Pizza" });
      setMenuItems(prev => [newItem, ...prev]);
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: "error", text: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen bg-[#fbf4e8] p-8 flex items-center justify-center"><p>Loading...</p></div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#fbf4e8] p-8 flex flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-6">You must be an administrator to access this page.</p>
        
        {!currentUser && (
          <button 
            onClick={() => setIsLoginModalOpen(true)}
            className="px-6 py-3 bg-[#f51c27] text-white rounded-xl font-medium hover:bg-[#d90429] transition-colors"
          >
            Log In
          </button>
        )}

        <LoginSignupModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbf4e8] p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-[40px] font-black text-[#1c1c1a] mb-8">Admin: Add Menu Item</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-[22px] p-8 shadow-sm border border-[#e0e0e0]">
          {/* Item Name */}
          <div className="mb-6">
            <label className="block text-[16px] font-semibold text-[#1c1c1a] mb-2">Item Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Margherita Pizza"
              className="w-full px-4 py-3 border border-[#d1d1d1] rounded-[12px] text-[16px] focus:outline-none focus:border-[#f51c27]"
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-[16px] font-semibold text-[#1c1c1a] mb-2">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="e.g., Fresh mozzarella, tomato sauce, basil"
              rows={3}
              className="w-full px-4 py-3 border border-[#d1d1d1] rounded-[12px] text-[16px] focus:outline-none focus:border-[#f51c27]"
            />
          </div>

          {/* Price */}
          <div className="mb-6">
            <label className="block text-[16px] font-semibold text-[#1c1c1a] mb-2">Price *</label>
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-semibold">AED</span>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="35"
                step="0.01"
                className="flex-1 px-4 py-3 border border-[#d1d1d1] rounded-[12px] text-[16px] focus:outline-none focus:border-[#f51c27]"
              />
            </div>
          </div>

          {/* Category */}
          <div className="mb-6">
            <label className="block text-[16px] font-semibold text-[#1c1c1a] mb-2">Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-[#d1d1d1] rounded-[12px] text-[16px] focus:outline-none focus:border-[#f51c27]"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-[12px] text-[16px] font-semibold ${
              message.type === 'success' 
                ? 'bg-[#1caa00] text-white' 
                : 'bg-[#ff4444] text-white'
            }`}>
              {message.text}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#f51c27] text-white py-3 rounded-[12px] text-[16px] font-bold hover:bg-[#d90429] transition-colors disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Item"}
          </button>
        </form>

        {/* Info */}
        <p className="text-center text-[#727272] mt-8 text-[14px] mb-12">
          Items added here will appear in the customer menu instantly
        </p>

        {/* Settings Section */}
        <h2 className="text-[32px] font-black text-[#1c1c1a] mb-6">Store Settings</h2>
        <div className="bg-white rounded-[22px] p-8 shadow-sm border border-[#e0e0e0] mb-12">
          <div className="mb-6">
            <label className="block text-[16px] font-semibold text-[#1c1c1a] mb-2">Max Delivery Radius (in km)</label>
            <p className="text-sm text-gray-500 mb-4">Orders outside this radius from the restaurant will be blocked.</p>
            <div className="flex gap-4 items-center">
              <input
                type="number"
                value={deliveryRadius}
                onChange={(e) => setDeliveryRadius(Number(e.target.value))}
                className="w-32 px-4 py-3 border border-[#d1d1d1] rounded-[12px] text-[16px] focus:outline-none focus:border-[#f51c27]"
              />
              <button
                onClick={saveSettings}
                disabled={savingSettings}
                className="bg-[#1c1c1a] text-white px-6 py-3 rounded-[12px] font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {savingSettings ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </div>

        <h2 className="text-[32px] font-black text-[#1c1c1a] mb-6">Manage Menu Items</h2>
        
        <input 
          type="text"
          placeholder="Search items by name..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 mb-6 border border-[#d1d1d1] rounded-[12px] text-[16px] focus:outline-none focus:border-[#f51c27]"
        />

        {fetchingMenu ? (
          <p className="text-center text-gray-500">Loading menu...</p>
        ) : (
          <div className="space-y-4">
            {menuItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())).map(item => (
              <div key={item.id} className="bg-white rounded-[16px] p-4 flex items-center justify-between border border-[#e0e0e0] shadow-sm">
                <div>
                  <h3 className="font-bold text-[18px] text-[#1c1c1a]">{item.name}</h3>
                  <p className="text-gray-500 text-[14px]">AED {item.price} • {item.category}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[14px] font-bold ${item.available !== false ? 'text-green-500' : 'text-red-500'}`}>
                    {item.available !== false ? 'IN STOCK' : 'OUT OF STOCK'}
                  </span>
                  <button 
                    onClick={() => toggleAvailability(item)}
                    className={`w-14 h-8 rounded-full transition-colors relative ${item.available !== false ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all ${item.available !== false ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
