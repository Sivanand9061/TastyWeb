import svgPaths from "./svg-k7l7daq8c2";
import imgLogoPng from "./fe9439b0b5b8f4134a87490c14dd926f577a90d9.png";
import imgWhatsApp from "./ed00f9add7cd5cb0ff88532464058a5e59bc4497.png";
import imgImage1 from "./99fddedb4828ce247ec845e7f4b3ade3c1715928.png";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, ArrowLeft } from "lucide-react";
import { ref, get, onValue } from "firebase/database";
import { db } from "../../firebase";


interface MenuItem {
  id?: string;
  name: string;
  nameAr?: string;
  description: string;
  price: string;
  category: string;
  available?: boolean;
  schedule?: { start: string; end: string; active: boolean };
  image?: string;
  variants?: { label: string; price: string }[];
}

const DEFAULT_CATEGORIES = ["Pizza", "Burgers", "Pasta", "Desserts", "Drinks", "Salads"];

const getDubaiTime = () => {
  try {
    const dubaiDate = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Dubai" }));
    return `${String(dubaiDate.getHours()).padStart(2, '0')}:${String(dubaiDate.getMinutes()).padStart(2, '0')}`;
  } catch (e) {
    // Fallback to local time if Dubai time zone fails
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
};

export const isAvailable = (schedule?: { start?: string; end?: string; active?: boolean }) => {
  if (!schedule || !schedule.active) return true;
  if (!schedule.start || !schedule.end) return true;

  const current = getDubaiTime();
  const { start, end } = schedule;

  // Normalize formats to ensure HH:mm (e.g. "9:00" -> "09:00")
  const norm = (s: string) => s.split(':').map(p => p.padStart(2, '0')).join(':');
  const c = norm(current);
  const s = norm(start);
  const e = norm(end);

  if (s <= e) return c >= s && c <= e;
  return c >= s || c <= e; // Over midnight support
};

function HeroSection() {
  return (
    <div className="text-center py-6">
      <h1 className="text-[56px] font-black text-[var(--accent)] leading-tight">Tasty Hot</h1>
    </div>
  );
}

function InfoCard() {
  return (
    <div className="mx-4 mb-6">
      <div className="border border-[var(--info-border)] rounded-[22px] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4">
              <svg className="w-full h-full" fill="none" viewBox="0 0 15.2169 14.4721">
                <path d={svgPaths.p2adb7280} fill="#1EB200" />
              </svg>
            </div>
            <span className="text-[#747373] text-[9.4px]">4.0</span>
          </div>
          <span className="text-[#1caa00] text-[9.5px]">25 - 30 mins</span>
          <span className="text-[#1caa00] text-[12px] font-medium">Free</span>
        </div>
        <div className="flex items-center justify-between text-[#747373] text-[9.8px]">
          <span>200+ Ratings</span>
          <span>Distance Depends</span>
          <span>Home Delivery</span>
        </div>
      </div>
    </div>
  );
}

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="mx-4 mb-3">
      <div className="relative flex items-center bg-[#f6f6f6] rounded-[10px] h-[44px] px-4">
        <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search for flavors..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent text-[14px] text-gray-800 placeholder-gray-400 focus:outline-none"
        />
      </div>
    </div>
  );
}

interface CategoryTabsProps {
  categories: string[];
  sortedCategories: string[];
  onCategoryClick: (index: number) => void;
}

function CategoryTabs({ categories, sortedCategories, onCategoryClick }: CategoryTabsProps) {
  const [activeCategory, setActiveCategory] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 250;
      let currentActiveIndex = 0;

      sortedCategories.forEach((_, index) => {
        const el = document.querySelector(`[data-cat="${index}"]`) as HTMLElement | null;
        if (el && el.offsetTop <= scrollPosition) {
          currentActiveIndex = index;
        }
      });

      if (currentActiveIndex !== activeCategory) {
        setActiveCategory(currentActiveIndex);
        const container = document.getElementById('category-tabs-container');
        const btn = document.querySelector(`[data-cat-btn="${currentActiveIndex}"]`) as HTMLElement | null;
        if (btn && container) {
          const scrollLeft = btn.offsetLeft - container.offsetWidth / 2 + btn.offsetWidth / 2;
          container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sortedCategories, activeCategory]);

  return (
    <div id="category-tabs-container" className="overflow-x-auto no-scrollbar scroll-smooth pl-4 pr-4 relative">
      <div className="flex gap-2 min-w-max pb-1">
        {sortedCategories.map((category, index) => {
          const isActive = activeCategory === index;
          return (
            <button
              key={category}
              data-cat-btn={index}
              onClick={() => {
                setActiveCategory(index);
                onCategoryClick(index);
                const container = document.getElementById('category-tabs-container');
                const btn = document.querySelector(`[data-cat-btn="${index}"]`) as HTMLElement | null;
                if (btn && container) {
                  const scrollLeft = btn.offsetLeft - container.offsetWidth / 2 + btn.offsetWidth / 2;
                  container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
                }
              }}
              className={`px-5 py-2.5 rounded-[12px] text-[13px] font-bold transition-all relative ${isActive
                ? 'bg-[#f51c27] text-white shadow-sm'
                : 'bg-[#f6f6f6] text-gray-600 hover:bg-gray-200'
                }`}
            >
              {category === "Pizza" && index === 0 ? "All Menu" : category}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface MenuItemCardProps {
  item: MenuItem;
  onClick: (item: MenuItem) => void;
  isAvailable: boolean;
  onAddToCart?: (item: MenuItem & { quantity: number }) => void;
}

function MenuItemCard({ item, onClick, isAvailable, onAddToCart }: MenuItemCardProps) {
  const hasVariants = item.variants && item.variants.length > 0;

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart({ ...item, quantity: 1 });
    }
  };

  return (
    <div
      id={`menu-item-${item.name.replace(/\s+/g, '-')}`}
      className={`pb-6 mb-6 border-b border-gray-100 ${isAvailable && !hasVariants ? 'cursor-pointer' : ''} transition-colors ${!isAvailable ? 'opacity-70' : ''}`}
      onClick={() => {
        onClick(item);
      }}
    >
      <div className="flex gap-4">
        <div className={`w-[84px] h-[84px] rounded-[14px] flex-shrink-0 overflow-hidden bg-gray-100 shadow-sm border border-black/5 ${!isAvailable ? 'grayscale opacity-60' : ''}`}>
          {item.image ? (
            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl opacity-50">🍽️</div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`text-[15.5px] font-bold leading-tight ${!isAvailable ? 'text-gray-400' : 'text-gray-900'}`}>{item.name}</h3>
            {isAvailable ? (
              <p className="text-[#f51c27] font-black text-[15px] shrink-0">
                AED {!hasVariants ? item.price : Math.min(...item.variants!.map(v => parseFloat(v.price))).toFixed(0)}
              </p>
            ) : (
              <span className="text-red-500 text-[9px] font-bold px-2 py-1 bg-red-50 rounded-full shrink-0 uppercase tracking-tighter">OUT OF STOCK</span>
            )}
          </div>

          {item.schedule?.active && !isAvailable && (
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-tight">Available: {item.schedule.start} - {item.schedule.end}</p>
          )}

          <p className="text-[13px] text-gray-500 mt-1 line-clamp-2 leading-snug pr-2">{item.description}</p>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Dynamic Tags */}
              {item.name.toLowerCase().includes('signature') && (
                <span className="bg-red-50 text-[#f51c27] text-[9px] font-bold px-2 py-0.5 rounded-[4px] tracking-widest uppercase">
                  MOST POPULAR
                </span>
              )}
              {item.name.toLowerCase().includes('spicy') || item.name.toLowerCase().includes('inferno') ? (
                <span className="text-[10px]">🔥 🔥</span>
              ) : null}
              {item.category === "Sides" && (
                <span className="text-gray-400 text-[9px] font-bold uppercase tracking-widest">SIDE ITEM</span>
              )}
              {item.category === "Drinks" && (
                <span className="text-gray-400 text-[9px] font-bold uppercase tracking-widest">BEVERAGE</span>
              )}
            </div>

            {isAvailable && !hasVariants && (
              <button
                onClick={handleAddToCartClick}
                className="bg-[#f51c27] w-7 h-7 rounded-full flex items-center justify-center text-white shadow-md active:scale-95 transition-transform shrink-0"
              >
                <Plus size={16} strokeWidth={3} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Variant size selector row */}
      {hasVariants && isAvailable && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex gap-2 flex-wrap mt-3 pl-[100px]"
        >
          {item.variants!.map(v => (
            <button
              key={v.label}
              onClick={(e) => {
                e.stopPropagation();
                if (onAddToCart) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onAddToCart({ ...item, price: v.price, quantity: 1, variant: v.label } as any);
                }
              }}
              className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5 hover:bg-[#f51c27] hover:text-white hover:border-[#f51c27] transition-all duration-200 group"
            >
              <span className="text-[11px] font-bold text-gray-700 group-hover:text-white">{v.label}</span>
              <span className="text-[10px] text-gray-500 group-hover:text-white/90">· ${v.price}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface MenuListProps {
  categories: string[];
  sortedCategories: string[];
  setCategoryRef: (index: number) => (el: HTMLDivElement | null) => void;
  onItemClick: (item: MenuItem) => void;
  searchQuery: string;
  menuData: Record<string, MenuItem[]>;
  onAddToCart?: (item: MenuItem & { quantity: number }) => void;
  isItemAvailable: (item: MenuItem) => boolean;
}

function MenuList({ categories, sortedCategories, setCategoryRef, onItemClick, searchQuery, menuData, onAddToCart, isItemAvailable }: MenuListProps) {

  const filteredMenuData = () => {
    if (!searchQuery.trim()) return menuData;

    const filtered: Record<string, MenuItem[]> = {};
    const query = searchQuery.toLowerCase();

    Object.entries(menuData).forEach(([category, items]) => {
      const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
      if (filteredItems.length > 0) {
        filtered[category] = filteredItems;
      }
    });

    return filtered;
  };

  const filtered = filteredMenuData();
  const visibleCategories = sortedCategories.filter(cat => cat in filtered);

  return (
    <div className="px-4 pb-20 pt-2">
      <div className="mb-6">
        <h1 className="font-heading text-[32px] font-black uppercase text-[#1c2938] leading-none mb-1">
          CRAFTED WITH <span className="text-[#f51c27] italic">FIRE</span>
        </h1>
        <p className="text-gray-500 text-[13px] leading-snug max-w-[280px]">
          Our signature recipes are built to perfection with premium ingredients.
        </p>
      </div>

      {visibleCategories.length === 0 && searchQuery ? (
        <div className="py-12 text-center">
          <p className="text-[#727272] text-[18px]">No items found for "{searchQuery}"</p>
        </div>
      ) : null}
      {visibleCategories.map((category) => {
        const categoryIndex = categories.indexOf(category);
        const sortedIndex = sortedCategories.indexOf(category);
        return (
          <div key={category} ref={setCategoryRef(categoryIndex)} data-cat={sortedIndex} className="scroll-mt-[140px]">
            <h2 className="text-[22px] font-heading font-black text-[#1c2938] uppercase tracking-wide mb-4 mt-8">{category}</h2>
            {(filtered[category] || []).map((item, itemIndex) => (
              <MenuItemCard
                key={item.id || itemIndex}
                item={item}
                onClick={onItemClick}
                isAvailable={isItemAvailable(item)}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

interface ProductDetailProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (item: MenuItem & { quantity: number }) => void;
  isAvailable: boolean;
}

function ProductDetail({ item, isOpen, onClose, onAddToCart, isAvailable }: ProductDetailProps) {
  const [selectedVariant, setSelectedVariant] = useState<{ label: string; price: string } | null>(null);

  // Reset variant selection each time a new item opens
  useEffect(() => {
    if (item?.variants && item.variants.length > 0) {
      setSelectedVariant(item.variants[0]);
    } else {
      setSelectedVariant(null);
    }
  }, [item]);

  if (!item) return null;

  const hasVariants = item.variants && item.variants.length > 0;
  const displayPrice = hasVariants && selectedVariant ? selectedVariant.price : item.price;

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart({
        ...item,
        price: displayPrice,
        quantity: 1,
        ...(hasVariants && selectedVariant ? { variant: selectedVariant.label } : {}),
      } as MenuItem & { quantity: number; variant?: string });
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[60]"
          />

          {/* Modal */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] z-[70] max-h-[90vh] overflow-y-auto"
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-4 pb-2">
              <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
            </div>

            <div className="px-6 pb-8">
              {/* Large Image */}
              <div className="w-full h-[260px] rounded-[28px] overflow-hidden bg-gradient-to-br from-[var(--img-placeholder-from)] to-[var(--img-placeholder-to)] mb-6">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-7xl">🍽️</div>
                )}
              </div>

              {/* Product Name */}
              <h2 className="text-[28px] font-bold text-[var(--text-primary)] mb-1">{item.name}</h2>
              {item.nameAr && (
                <p className="text-[18px] font-light text-[var(--text-secondary)] mb-3">{item.nameAr}</p>
              )}

              {/* Description */}
              <p className="text-[16px] text-[var(--text-secondary)] mb-6 leading-relaxed">{item.description}</p>

              {/* Variant selector */}
              {hasVariants && (
                <div className="mb-6">
                  <p className="text-[13px] font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-wide">Choose size</p>
                  <div className="flex flex-wrap gap-3">
                    {item.variants!.map(v => {
                      const isSelected = selectedVariant?.label === v.label;
                      return (
                        <button
                          key={v.label}
                          onClick={() => setSelectedVariant(v)}
                          className={`px-5 py-2.5 rounded-[35px] text-[15px] font-semibold border-2 transition-all duration-200 ${isSelected
                            ? 'bg-[var(--accent)] border-[var(--accent)] text-white shadow-md scale-[1.04]'
                            : 'bg-transparent border-[var(--bg-card-border)] text-[var(--text-secondary)] hover:border-[var(--accent)]'
                            }`}
                        >
                          {v.label} &nbsp;·&nbsp; AED {v.price}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Price */}
              <p className="text-[32px] font-bold text-[var(--text-price)] mb-8">AED {displayPrice}</p>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={!isAvailable}
                className={`w-full backdrop-blur-sm shadow-[var(--topbar-shadow)] rounded-[35px] py-4 text-[18px] font-semibold transition-all ${isAvailable
                    ? 'bg-[var(--btn-add-bg)] text-[var(--accent)] hover:bg-[var(--btn-add-hover)]'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
              >
                {isAvailable ? "Add to Cart" : "Currently Unavailable"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Footer() {
  return (
    <div className="relative bg-gradient-to-b from-[#f51c27] to-[#8f1017] text-white overflow-hidden">
      <div className="relative z-10 py-16 px-6">
        <div className="max-w-md mx-auto">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-[103px] h-[104px]">
              <img alt="Tasty Hot Logo" className="w-full h-full object-cover" src={imgImage1} />
            </div>
          </div>

          {/* Brand */}
          <div className="flex justify-center mb-2">
            <img
              src="/images/footerth.png"
              alt="Tasty Hot"
              className="h-[220px] w-auto object-contain"
              style={{ filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.35))' }}
            />
          </div>

          {/* Address */}
          <div className="text-center mb-8">
            <p className="text-[10px] leading-relaxed">
              Near Al Hamdiya Police Station, Opp. KENZ Hyper Market, Al Rawda 1, Ajman UAE
            </p>
          </div>

          {/* Contact Us & Favorites Layout */}
          <div className="space-y-8">
            {/* Contact Us - Large screen first */}
            <div className="text-center">
              <h3 className="text-[24px] font-bold mb-4">Contact Us</h3>
              <div className="space-y-3">
                <div className="space-y-2 text-[12px]">
                  <p>06 749 4505</p>
                  <p>056 889 0341</p>
                  <div className="flex items-center gap-1 justify-center">
                    <div className="w-[15px] h-[20px]">
                      <img alt="WhatsApp" className="w-full h-full object-contain" src={imgWhatsApp} />
                    </div>
                    <p>050 320 7324</p>
                  </div>
                </div>
                <div>
                  <a
                    href="mailto:HOLLER@TASTYHOT.COM"
                    className="text-[10px] underline hover:opacity-80 transition-opacity inline-block"
                  >
                    HOLLER@TASTYHOT.COM
                  </a>
                </div>
              </div>
            </div>

            {/* Favorites */}
            <div className="text-center">
              <h3 className="text-[16px] font-bold mb-3">Favorites</h3>
              <ul className="space-y-2 text-[8.8px]">
                <li>Menu Items</li>
                <li>Menu Items</li>
                <li>Menu Items</li>
                <li>Menu Items</li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center space-y-2">
            <p className="text-[10px]">© 2026 TASTY HOT. ALL RIGHTS RESERVED.</p>
            <p className="text-[8px]">PRIVACY | NO-FLUFF POLICY</p>
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute -left-20 top-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}

export default function Categories({ 
  onBackHome, 
  onAddToCart, 
  cartItemsCount = 0, 
  onNavigateToCart,
  targetItemName,
  clearTargetItem 
}: { 
  onBackHome?: () => void; 
  onAddToCart?: (item: MenuItem & { quantity: number }) => void; 
  cartItemsCount?: number; 
  onNavigateToCart?: () => void;
  targetItemName?: string | null;
  clearTargetItem?: () => void;
}) {
  const CACHE_CATS_KEY = 'tasty_categories_v1';
  const CACHE_MENU_KEY = 'tasty_menu_v1';

  // Restore from cache immediately so the page renders without waiting for the network
  const getCachedCategories = (): string[] => {
    try {
      const raw = localStorage.getItem(CACHE_CATS_KEY);
      if (raw) { const parsed = JSON.parse(raw); if (Array.isArray(parsed) && parsed.length > 0) return parsed; }
    } catch { }
    return DEFAULT_CATEGORIES;
  };

  const buildOrganized = (cats: string[], items: (MenuItem & { category: string })[]): Record<string, MenuItem[]> => {
    const organized: Record<string, MenuItem[]> = {};
    cats.forEach(cat => { organized[cat] = []; });
    items.forEach(item => {
      if (!organized[item.category]) organized[item.category] = [];
      organized[item.category].push(item);
    });
    return organized;
  };

  const getCachedMenuData = (cats: string[]): Record<string, MenuItem[]> | null => {
    try {
      const raw = localStorage.getItem(CACHE_MENU_KEY);
      if (raw) {
        const items = JSON.parse(raw) as (MenuItem & { category: string })[];
        if (Array.isArray(items) && items.length > 0) return buildOrganized(cats, items);
      }
    } catch { }
    return null;
  };

  const cachedCats = getCachedCategories();
  const cachedMenu = getCachedMenuData(cachedCats);

  const [categories, setCategories] = useState<string[]>(cachedCats);
  const [categorySchedules, setCategorySchedules] = useState<Record<string, { start: string; end: string; active: boolean }>>({});
  const [rawMenuItems, setRawMenuItems] = useState<MenuItem[]>([]);
  const [menuData, setMenuData] = useState<Record<string, MenuItem[]>>(cachedMenu ?? {});
  // Only show loading spinner if there is no cached data yet (true first-time visitor)
  const [loading, setLoading] = useState<boolean>(cachedMenu === null);
  const categoryRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Re-group menu data whenever raw items or categories change
  useEffect(() => {
    if (rawMenuItems.length > 0 || categories.length > 0) {
      const organized = buildOrganized(categories, rawMenuItems);
      setMenuData(organized);
    }
  }, [categories, rawMenuItems]);

  useEffect(() => {
    setLoading(true);

    // 1. Listen for Categories
    const categoriesRef = ref(db, 'settings/categories');
    const unsubscribeCats = onValue(categoriesRef, (snapshot) => {
      const saved = snapshot.val();
      const cats = (Array.isArray(saved) && saved.length > 0) ? saved : DEFAULT_CATEGORIES;
      setCategories(cats);
      localStorage.setItem(CACHE_CATS_KEY, JSON.stringify(cats));
    });

    // 2. Listen for Category Schedules
    const schedulesRef = ref(db, 'settings/categorySchedules');
    const unsubscribeScheds = onValue(schedulesRef, (snapshot) => {
      if (snapshot.exists()) {
        setCategorySchedules(snapshot.val());
      }
    });

    // 3. Listen for Menu Items
    const menuRef = ref(db, 'menu_items');
    const unsubscribeMenu = onValue(menuRef, (snapshot) => {
      const items = snapshot.val() ? Object.values(snapshot.val()) as MenuItem[] : [];
      setRawMenuItems(items);
      localStorage.setItem(CACHE_MENU_KEY, JSON.stringify(items));
      setLoading(false);
    }, (error) => {
      console.error("Firebase Menu error:", error);
      setLoading(false);
    });

    return () => {
      unsubscribeCats();
      unsubscribeScheds();
      unsubscribeMenu();
    };
  }, []); // Mount only - listeners handle updates

  // Handle auto-scroll parameter
  useEffect(() => {
    if (targetItemName && !loading) {
      setTimeout(() => {
        const el = document.getElementById(`menu-item-${targetItemName.replace(/\s+/g, '-')}`);
        if (el) {
          // Scroll it into view with some top offset due to sticky header
          const y = el.getBoundingClientRect().top + window.scrollY - 100;
          window.scrollTo({ top: y, behavior: 'smooth' });
          
          // Briefly highlight
          el.classList.add('bg-red-50/50');
          setTimeout(() => el.classList.remove('bg-red-50/50'), 1500);
          
          if (clearTargetItem) clearTargetItem();
        }
      }, 300); // Wait for render
    }
  }, [targetItemName, loading, clearTargetItem]);

  // Compute availability and sorted categories
  const getCategoryStatus = (cat: string) => {
    const sched = categorySchedules[cat];
    return isAvailable(sched);
  };

  const sortedCategories = [...categories].sort((a, b) => {
    const aOpen = getCategoryStatus(a);
    const bOpen = getCategoryStatus(b);
    if (aOpen === bOpen) return 0;
    return aOpen ? -1 : 1; // Open comes first
  });

  const isItemCurrentlyAvailable = (item: MenuItem) => {
    // Manual override
    if (item.available === false) return false;
    // Category schedule
    if (!getCategoryStatus(item.category)) return false;
    // Item schedule
    if (item.schedule && item.schedule.active) {
      if (!isAvailable(item.schedule)) return false;
    }
    return true;
  };

  const handleCategoryClick = (index: number) => {
    // Use data-cat attribute so the scroll is always reliable regardless of
    // how React manages the ref array across renders.
    const el = document.querySelector(`[data-cat="${index}"]`) as HTMLElement | null;
    if (!el) return;
    // Offset = topbar (~105px) + search container (~60px) + category strip (~58px) + gaps
    const STICKY_OFFSET = 240;
    const top = el.getBoundingClientRect().top + window.scrollY - STICKY_OFFSET;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  };

  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const openProductDetail = (item: MenuItem) => {
    setSelectedItem(item);
    setIsProductDetailOpen(true);
  };

  const closeProductDetail = () => {
    setSelectedItem(null);
    setIsProductDetailOpen(false);
  };

  const handleAddItemToCart = (item: MenuItem & { quantity: number }) => {
    if (onAddToCart) {
      onAddToCart(item);
    }
    setToastMessage(`${item.name} added to cart!`);
    setTimeout(() => setToastMessage(null), 2000);
  };

  // Build refs array for categories
  const setCategoryRef = (index: number) => (el: HTMLDivElement | null) => {
    categoryRefs.current[index] = el;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col pt-4">
      <div className="flex-1">
        {/* Challenge Accepted: The Mega Sticky Strip (Integrated with TopBar) */}
        <div
          className="sticky z-[45] bg-white pt-2 pb-3 shadow-[0_4px_10px_rgba(0,0,0,0.03)] border-b border-gray-100 mb-6"
          style={{ top: '60px', position: 'sticky', width: '100%' }}
        >
          <div className="flex items-center px-4 mb-2">
            <button
              onClick={onBackHome}
              className="p-2 -ml-2 text-gray-600 hover:text-gray-900 transition-colors"
              title="Go Back"
            >
              <ArrowLeft size={24} />
            </button>
            <span className="ml-2 font-bold text-gray-400 text-sm uppercase tracking-widest">Menu</span>
          </div>
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <CategoryTabs categories={categories} sortedCategories={sortedCategories} onCategoryClick={handleCategoryClick} />
        </div>

        {/* Skeleton — only shown to true first-time visitors with no cache */}
        {loading ? (
          <div className="px-4 pb-20">
            {[1, 2, 3].map(i => (
              <div key={i} className="mb-10">
                {/* Category heading skeleton */}
                <div className="h-6 w-32 bg-gray-200 rounded-full mb-6 mt-8 animate-pulse" />
                {[1, 2].map(j => (
                  <div key={j} className="flex gap-4 pb-9 mb-9 border-b border-[var(--item-border)]">
                    <div className="flex-1 space-y-3">
                      <div className="h-4 w-3/4 bg-gray-200 rounded-full animate-pulse" />
                      <div className="h-3 w-full bg-gray-100 rounded-full animate-pulse" />
                      <div className="h-3 w-2/3 bg-gray-100 rounded-full animate-pulse" />
                      <div className="h-4 w-16 bg-gray-200 rounded-full animate-pulse mt-4" />
                    </div>
                    <div className="w-[120px] h-[110px] rounded-[24px] bg-gray-200 animate-pulse flex-shrink-0" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 pb-20">
            {searchQuery ? (
              <div className="space-y-6">
                {sortedCategories.map((cat, idx) => {
                  const filteredItems = (menuData[cat] || []).filter(item =>
                    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (item.nameAr && item.nameAr.toLowerCase().includes(searchQuery.toLowerCase()))
                  );
                  if (filteredItems.length === 0) return null;

                  return (
                    <div key={cat} data-cat={idx}>
                      <h3 className="text-[20px] font-bold text-[var(--text-primary)] mb-4">{cat}</h3>
                      <div className="space-y-4">
                        {filteredItems.map((item, itemIdx) => (
                          <MenuItemCard
                            key={item.id || itemIdx}
                            item={item}
                            onClick={openProductDetail}
                            isAvailable={isItemCurrentlyAvailable(item)}
                            onAddToCart={handleAddItemToCart}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <MenuList
                categories={categories}
                sortedCategories={sortedCategories}
                setCategoryRef={setCategoryRef}
                onItemClick={openProductDetail}
                searchQuery={searchQuery}
                menuData={menuData}
                onAddToCart={handleAddItemToCart}
                isItemAvailable={isItemCurrentlyAvailable}
              />
            )}
          </div>
        )}
      </div>
      <ProductDetail
        item={selectedItem}
        isOpen={isProductDetailOpen}
        onClose={closeProductDetail}
        onAddToCart={handleAddItemToCart}
        isAvailable={selectedItem ? isItemCurrentlyAvailable(selectedItem) : true}
      />

      {/* Floating Cart Capsule */}
      <AnimatePresence>
        {cartItemsCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-[60]"
          >
            <button
              onClick={onNavigateToCart}
              className="w-full bg-[var(--accent)] text-white rounded-full p-4 flex items-center justify-between shadow-[0_8px_30px_rgb(245,28,39,0.3)] active:scale-95 transition-transform"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                  {cartItemsCount}
                </div>
                <span className="font-bold text-[18px]">View Cart</span>
              </div>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-[180px] left-1/2 -translate-x-1/2 bg-[var(--toast-bg)] text-white px-6 py-4 rounded-[35px] shadow-lg z-50 font-medium"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}