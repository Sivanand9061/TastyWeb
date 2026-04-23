import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Plus, Instagram, Facebook, MessageCircle, MapPin, Search, ChevronRight, X, Navigation, Utensils, User as UserIcon } from "lucide-react";
import { useHomepageSettings } from "./useHomepageSettings";
import { ref, onValue } from "firebase/database";
import { db } from "../../firebase";
import { isAvailable } from "../Categories/CategoriesFixed";

// ────────────────────────────────────────────────────────────
// Address Location Modal
// ────────────────────────────────────────────────────────────
function AddressModal({
  isOpen,
  onClose,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (address: string) => void;
}) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!isOpen) { setInput(""); setSuggestions([]); }
  }, [isOpen]);

  const search = async (q: string) => {
    setInput(q);
    if (q.trim().length < 3) { setSuggestions([]); return; }
    setIsSearching(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5`;
      const res = await fetch(url, { headers: { "Accept-Language": "en" } });
      const data = await res.json();
      setSuggestions(data.map((d: { display_name: string }) => d.display_name));
    } catch { /* ignore */ }
    setIsSearching(false);
  };

  const handleGPS = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
        const res = await fetch(url, { headers: { "Accept-Language": "en" } });
        const data = await res.json();
        onSelect(data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        onClose();
      } catch { onSelect(`${lat.toFixed(5)}, ${lng.toFixed(5)}`); onClose(); }
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[80]"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[28px] z-[90] max-h-[80vh] flex flex-col"
          >
            <div className="flex justify-center pt-3"><div className="w-10 h-1 bg-gray-200 rounded-full" /></div>
            <div className="px-5 pt-4 pb-2 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[18px] font-black text-gray-900">Set Delivery Location</h2>
                <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700"><X size={20} /></button>
              </div>
              <div className="relative flex items-center bg-[#f6f6f6] rounded-[12px] h-[48px] px-4 gap-3">
                <Search size={16} className="text-gray-400 shrink-0" />
                <input
                  autoFocus
                  value={input}
                  onChange={(e) => search(e.target.value)}
                  placeholder="Search your area, building…"
                  className="flex-1 bg-transparent text-[14px] text-gray-800 placeholder-gray-400 focus:outline-none"
                />
                {isSearching && <div className="w-4 h-4 border-2 border-[#f51c27] border-t-transparent rounded-full animate-spin shrink-0" />}
              </div>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-3 space-y-1">
              {/* GPS Option */}
              <button
                onClick={handleGPS}
                className="w-full flex items-center gap-3 p-3 rounded-[12px] hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <Navigation size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-blue-600">Use my current location</p>
                  <p className="text-[12px] text-gray-400">GPS auto-detect</p>
                </div>
              </button>

              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { onSelect(s); onClose(); }}
                  className="w-full flex items-center gap-3 p-3 rounded-[12px] hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <MapPin size={16} className="text-gray-500" />
                  </div>
                  <p className="text-[13px] text-gray-800 leading-snug line-clamp-2">{s}</p>
                </button>
              ))}

              {input.length >= 3 && suggestions.length === 0 && !isSearching && (
                <div className="text-center py-8 text-gray-400 text-[13px]">No results found. Try a different search.</div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ────────────────────────────────────────────────────────────
// Main HomePage
// ────────────────────────────────────────────────────────────
export default function HomePage({
  onExploreClick,
  onDeliveryClick: _onDeliveryClick,
  onTakeawayClick: _onTakeawayClick,
  onLoginClick,
  onNavigateToAdmin,
  isAdmin,
}: {
  onExploreClick: (itemName?: string) => void;
  onDeliveryClick?: () => void;
  onTakeawayClick?: () => void;
  cartItemsCount?: number;
  onNavigateToCart?: () => void;
  onNavigateToAdmin?: () => void;
  onNavigateToProfile?: () => void;
  onLoginClick?: () => void;
  isAdmin?: boolean | null;
}) {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const { settings, loading } = useHomepageSettings();

  const [rawMenuItems, setRawMenuItems] = useState<any[]>([]);
  const [categorySchedules, setCategorySchedules] = useState<any>({});
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("Tap to set delivery location");
  const [searchQuery, setSearchQuery] = useState("");
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  // Fetch menu items and schedules
  useEffect(() => {
    const menuRef = ref(db, "menu_items");
    const unsub1 = onValue(menuRef, (snap) => {
      if (snap.exists()) {
        const map = snap.val();
        setRawMenuItems(Object.keys(map).map((k) => ({ id: k, ...map[k] })));
      } else setRawMenuItems([]);
    });

    const schedsRef = ref(db, "settings/categorySchedules");
    const unsub2 = onValue(schedsRef, (snap) => {
      setCategorySchedules(snap.exists() ? snap.val() : {});
    });

    // Recent orders from localStorage
    try {
      const saved = localStorage.getItem("recentOrders");
      if (saved) setRecentOrders(JSON.parse(saved).slice(0, 6));
    } catch { /* ignore */ }

    return () => { unsub1(); unsub2(); };
  }, []);

  const isItemCurrentlyAvailable = (itemTitle: string) => {
    if (rawMenuItems.length === 0) return true;
    const menuItem = rawMenuItems.find((m) => m.name === itemTitle);
    if (!menuItem) return false;
    if (menuItem.available === false) return false;
    const catSched = categorySchedules[menuItem.category];
    if (catSched && catSched.active && !isAvailable(catSched)) return false;
    if (menuItem.schedule && menuItem.schedule.active && !isAvailable(menuItem.schedule)) return false;
    return true;
  };

  const activeCrowdFavorites = settings.crowdFavorites.filter((item) =>
    isItemCurrentlyAvailable(item.title)
  );

  // Card intersection reveal
  useEffect(() => {
    const tid = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("card-visible"); }),
        { threshold: 0.05 }
      );
      cardRefs.current.forEach((el) => el && observer.observe(el));
      cardRefs.current.forEach((el) => {
        if (el && el.getBoundingClientRect().top < window.innerHeight) el.classList.add("card-visible");
      });
      return () => observer.disconnect();
    }, 100);
    return () => clearTimeout(tid);
  }, [activeCrowdFavorites.length]);

  // Filter crowd favorites by search
  const filteredFavorites = activeCrowdFavorites.filter((item) =>
    searchQuery.trim() === "" ||
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* ── HERO BANNER — scrolls away naturally, NOT sticky ── */}
      <div className="relative w-full overflow-hidden" style={{ height: 220 }}>
        <img
          src={settings.heroImage}
          alt="Tasty Hot Banner"
          className="w-full h-full object-cover"
          style={{ filter: "brightness(0.75)" }}
        />
        {/* Gradient for legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

        {/* ── Top Header inside Banner ── */}
        <div className="absolute top-0 left-0 right-0 z-20 px-5 pt-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center h-[40px]">
            <img 
              src={settings.logoImage} 
              alt="Tasty Hot Logo" 
              className="h-full w-auto max-w-[140px] object-contain brightness-0 invert" 
            />
          </div>
          {/* Profile / Admin Actions */}
          <div className="flex items-center gap-3">
            {isAdmin && onNavigateToAdmin && (
              <button
                onClick={onNavigateToAdmin}
                className="text-[10px] font-bold bg-[#f51c27] text-white px-2 py-1 rounded shadow-lg shadow-black/20 hover:scale-105 transition-transform"
              >
                ADMIN
              </button>
            )}
            <button 
              onClick={onLoginClick} 
              className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white/20 transition-colors shadow-lg shadow-black/20"
            >
              <UserIcon size={18} className="text-white" />
            </button>
          </div>
        </div>

        <div className="absolute inset-0 z-10 px-5 flex flex-col justify-end pb-4">
          {/* Address row — bottom of banner */}
          <button
            onClick={() => setAddressModalOpen(true)}
            className="flex items-center gap-2.5 bg-black/30 backdrop-blur-md border border-white/20 rounded-[14px] px-4 py-3 text-left w-full active:scale-[.98] transition-transform"
          >
            <MapPin size={16} className="text-white shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white/60 text-[10px] font-black uppercase tracking-widest leading-none mb-0.5">Tap to set location</p>
              <p className="text-white text-[13px] font-semibold truncate">{deliveryAddress}</p>
            </div>
            <ChevronRight size={15} className="text-white/50 shrink-0" />
          </button>
        </div>
      </div>{/* end banner */}

      {/* ── STICKY SEARCH BAR ONLY ── */}
      <div
        className="sticky z-20 bg-white px-4 pt-3 pb-2 shadow-[0_4px_10px_rgba(0,0,0,0.06)] border-b border-gray-100"
        style={{ top: 0 }}
      >
        <div className="flex items-center gap-3 bg-[#f2f2f2] rounded-[14px] h-[46px] px-4">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your cravings…"
            className="flex-1 bg-transparent text-[15px] text-gray-800 placeholder-gray-400 focus:outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-700 p-1">
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* ── SCROLLABLE CONTENT ── */}
      <div className="bg-white min-h-screen">

        {/* ── Order Again ── */}
        {recentOrders.length > 0 && (
          <div className="pt-6 pb-2">
            <div className="flex items-center justify-between px-5 mb-3">
              <div>
                <p className="text-[#f51c27] text-[10px] font-bold tracking-[0.2em] mb-0.5">QUICK REORDER</p>
                <h2 className="font-heading text-[22px] font-black uppercase text-gray-900 leading-tight">Order Again</h2>
              </div>
              <button onClick={() => onExploreClick()} className="flex items-center gap-1 text-[12px] font-bold text-[#f51c27]">
                See Menu <ChevronRight size={14} />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar px-5 pb-2">
              {recentOrders.map((order, i) => (
                <button
                  key={i}
                  onClick={() => onExploreClick(order.name)}
                  className="flex-shrink-0 w-[120px] bg-white rounded-[16px] border border-gray-100 shadow-sm overflow-hidden flex flex-col items-center p-3 active:scale-95 transition-transform"
                >
                  <div className="w-[80px] h-[80px] mb-2 flex items-center justify-center">
                    {order.image ? (
                      <img src={order.image} alt={order.name} className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 rounded-[12px] flex items-center justify-center text-2xl">🍽️</div>
                    )}
                  </div>
                  <p className="text-[11px] font-bold text-gray-800 text-center line-clamp-2 leading-snug">{order.name}</p>
                  <p className="text-[10px] text-[#f51c27] font-semibold mt-1">AED {order.price}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Crowd Favourites (horizontal) ── */}
        <div className={`${recentOrders.length > 0 ? "pt-4" : "pt-6"} pb-2`}>
          <div className="flex items-center justify-between px-5 mb-3">
            <div>
              <p className="text-[#f51c27] text-[10px] font-bold tracking-[0.2em] mb-0.5">CROWD FAVORITES</p>
              <h2 className="font-heading text-[22px] font-black uppercase text-gray-900 leading-tight">
                Must-Tries
              </h2>
            </div>
            <button onClick={() => onExploreClick()} className="flex items-center gap-1 text-[12px] font-bold text-[#f51c27]">
              See All <ChevronRight size={14} />
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar px-5 pb-2">
            {loading
              ? [1, 2, 3].map((i) => (
                  <div key={i} className="flex-shrink-0 w-[160px] h-[200px] bg-gray-100 rounded-[16px] animate-pulse" />
                ))
              : filteredFavorites.map((item, i) => (
                  <motion.div
                    key={item.id}
                    ref={(el: HTMLDivElement | null) => { cardRefs.current[i] = el; }}
                    onClick={() => onExploreClick(item.title)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="flex-shrink-0 w-[165px] h-[210px] rounded-[18px] overflow-hidden relative cursor-pointer shadow-md active:scale-[.97] transition-transform"
                  >
                    <img src={item.image} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="font-heading text-white text-[15px] font-black italic leading-tight mb-0.5">
                        {item.title}
                      </h3>
                      <p className="text-white/70 text-[11px] leading-snug">{item.subtitle}</p>
                    </div>
                    <div className="absolute top-2.5 right-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg
                        ${item.action === "add" ? "bg-[#f51c27] text-white" : "bg-white text-[#f51c27]"}`}>
                        {item.action === "add" ? <Plus size={16} strokeWidth={3} /> : <ArrowRight size={16} strokeWidth={3} />}
                      </div>
                    </div>
                  </motion.div>
                ))}
          </div>
        </div>



        {/* ── Explore Full Menu CTA ── */}
        <div className="px-5 pt-2 pb-6">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onExploreClick()}
            className="w-full bg-[#f51c27] text-white rounded-[16px] py-4 text-[16px] font-black shadow-[0_6px_20px_rgba(245,28,39,0.25)] hover:bg-[#d90429] transition-all flex items-center justify-center gap-2"
          >
            <Utensils size={18} />
            Explore Full Menu
          </motion.button>
        </div>

        {/* ── About Section — compact ── */}
        {(settings.aboutHeading || settings.aboutSubheading) && (
          <div className="px-5 pb-8">
            <div className="bg-[#1c1c1a] rounded-[20px] px-6 py-5 flex items-center gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#f51c27] opacity-20 rounded-bl-full" />
              <div className="w-1 self-stretch bg-[#f51c27] rounded-full shrink-0" />
              <div className="flex-1">
                {settings.aboutHeading && (
                  <p className="font-heading text-[15px] font-black uppercase text-white leading-snug">
                    {settings.aboutHeading}
                  </p>
                )}
                {settings.aboutSubheading && (
                  <p className="text-gray-400 text-[12px] leading-relaxed mt-1 line-clamp-2">
                    {settings.aboutSubheading}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <footer className="w-full py-12 flex flex-col items-center bg-white border-t border-gray-100">
          <div className="w-[140px] h-[50px] mb-8 grayscale hover:grayscale-0 transition-all duration-300">
            <img src={settings.logoImage} alt="Tasty Hot Logo" className="h-full w-full object-contain" />
          </div>
          <div className="flex justify-center gap-8 text-[11px] font-bold tracking-widest text-black mb-6 px-4 flex-wrap">
            <a href={settings.footer?.locationUrl} target="_blank" rel="noreferrer" className="uppercase hover:text-[#f51c27] transition-colors flex items-center gap-1.5">
              <MapPin size={14} /> LOCATIONS
            </a>
          </div>
          <div className="flex justify-center gap-5 text-gray-400 mb-8">
            <a href={settings.footer?.whatsappUrl} target="_blank" rel="noreferrer" className="hover:text-[#25D366] transition-colors bg-gray-50 p-3 rounded-full hover:bg-green-50 shadow-sm border border-gray-100">
              <MessageCircle size={20} />
            </a>
            <a href={settings.footer?.instagramUrl} target="_blank" rel="noreferrer" className="hover:text-[#E1306C] transition-colors bg-gray-50 p-3 rounded-full hover:bg-pink-50 shadow-sm border border-gray-100">
              <Instagram size={20} />
            </a>
            <a href={settings.footer?.facebookUrl} target="_blank" rel="noreferrer" className="hover:text-[#1877F2] transition-colors bg-gray-50 p-3 rounded-full hover:bg-blue-50 shadow-sm border border-gray-100">
              <Facebook size={20} />
            </a>
          </div>
          <p className="text-[10px] text-gray-400 mb-2">© 2026 Tasty Hot. All rights reserved.</p>
          <div className="flex gap-4 text-[10px] text-gray-400">
            <a href="#" className="hover:text-gray-800">Privacy Policy</a>
            <a href="#" className="hover:text-gray-800">Terms of Service</a>
          </div>
        </footer>
      </div>

      {/* Address Modal */}
      <AddressModal
        isOpen={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        onSelect={(addr) => setDeliveryAddress(addr)}
      />

      {/* Card reveal styles */}
      <style>{`
        .food-reveal-card {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .food-reveal-card.card-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}
