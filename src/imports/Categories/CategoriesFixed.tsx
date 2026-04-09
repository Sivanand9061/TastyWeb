import svgPaths from "./svg-k7l7daq8c2";
import imgLogoPng from "./fe9439b0b5b8f4134a87490c14dd926f577a90d9.png";
import imgWhatsApp from "./ed00f9add7cd5cb0ff88532464058a5e59bc4497.png";
import imgImage1 from "./99fddedb4828ce247ec845e7f4b3ade3c1715928.png";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ref, get } from "firebase/database";
import { db } from "../../firebase";

const DEFAULT_CATEGORIES = ["Pizza", "Burgers", "Pasta", "Desserts", "Drinks", "Salads"];

function TopBar({ onBackHome, cartItemsCount = 0, onNavigateToCart }: { onBackHome?: () => void; cartItemsCount?: number; onNavigateToCart?: () => void }) {
  return (
    <div className="sticky top-0 z-50 bg-[var(--topbar-bg)] backdrop-blur-sm shadow-[var(--topbar-shadow)] rounded-[35px] mx-4 mt-5 mb-4 h-[70px]">
      <div className="flex items-center justify-between px-6 py-3 max-w-[1280px] mx-auto">
        <button onClick={onBackHome} className="w-[46px] h-[46px] relative hover:opacity-80 transition-opacity">
          <img alt="Tasty Hot Logo" className="w-full h-full object-cover" src={imgLogoPng} />
        </button>
        <button onClick={onNavigateToCart} className="relative hover:opacity-80 transition-opacity">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 19.9815 20">
            <path d={svgPaths.pb5c2400} fill="var(--text-primary)" />
          </svg>
          {cartItemsCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-[var(--accent-hover)] rounded-full w-4 h-4 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold leading-none">{cartItemsCount}</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}

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
    <div className="mx-4 mb-6">
      <div className="relative">
        <input
          type="text"
          placeholder="Search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-[51px] px-12 border border-[var(--bg-input-border)] rounded-[32px] text-[var(--text-secondary)] text-[21px] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] bg-transparent"
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px]">
          <svg className="w-full h-full" fill="none" viewBox="0 0 18 18">
            <path d={svgPaths.p8a35e00} fill="var(--text-primary)" />
          </svg>
        </div>
      </div>
    </div>
  );
}

interface CategoryTabsProps {
  categories: string[];
  onCategoryClick: (index: number) => void;
}

function CategoryTabs({ categories, onCategoryClick }: CategoryTabsProps) {
  const [activeCategory, setActiveCategory] = useState(0);
  const [underlineStyle, setUnderlineStyle] = useState({ width: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Use offsetLeft (layout position) minus scrollLeft so the underline tracks
  // correctly whether or not the tab strip is mid-scroll animation.
  const calcUnderline = (index: number) => {
    const btn = buttonRefs.current[index];
    const container = containerRef.current;
    if (!btn || !container) return;
    setUnderlineStyle({
      width: btn.offsetWidth,
      left: btn.offsetLeft - container.scrollLeft,
    });
  };

  // Keep underline in sync while the tab strip pans (animated scroll).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onScroll = () => calcUnderline(activeCategory);
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, [activeCategory]);

  // Recalculate on category change or resize.
  useEffect(() => {
    calcUnderline(activeCategory);
    const onResize = () => calcUnderline(activeCategory);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [activeCategory, categories]);

  const handleCategoryClick = (index: number) => {
    setActiveCategory(index);
    onCategoryClick(index);

    // Pan the tab strip to centre the active tab — using scrollTo on the
    // container so it does NOT trigger a full-page scroll.
    const btn = buttonRefs.current[index];
    const container = containerRef.current;
    if (btn && container) {
      const targetScroll = btn.offsetLeft - container.clientWidth / 2 + btn.offsetWidth / 2;
      container.scrollTo({ left: Math.max(0, targetScroll), behavior: 'smooth' });
    }
  };

  return (
    <div className="sticky top-[105px] z-40 bg-[var(--bg-primary)] border-t border-b border-[var(--item-border)] py-3 mb-6">
      <div className="px-4">
        <div ref={containerRef} className="flex items-center gap-6 overflow-x-auto scrollbar-hide">
          {categories.map((category, index) => (
            <button
              key={category}
              ref={(el) => { buttonRefs.current[index] = el; }}
              onClick={() => handleCategoryClick(index)}
              // Fixed font size on ALL tabs — no size change = no layout shift / page jump
              className={`whitespace-nowrap text-[17px] transition-opacity duration-200 ${
                activeCategory === index
                  ? 'text-[var(--text-secondary)] font-semibold opacity-100'
                  : 'text-[var(--text-secondary)] font-normal opacity-45 hover:opacity-70'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        <div
          className="h-[3px] bg-[var(--category-underline)] rounded-full mt-3 transition-all duration-250 ease-out"
          style={{ width: `${underlineStyle.width}px`, transform: `translateX(${underlineStyle.left}px)` }}
        />
      </div>
    </div>
  );
}

interface MenuListProps {
  categories: string[];
  categoryRefs: React.RefObject<HTMLDivElement>[];
  onItemClick: (item: MenuItem) => void;
  searchQuery: string;
  menuData: Record<string, MenuItem[]>;
  onAddToCart?: (item: MenuItem & { quantity: number }) => void;
}

interface MenuItem {
  name: string;
  description: string;
  price: string;
  available?: boolean;
  image?: string;
}

function MenuList({ categories, categoryRefs, onItemClick, searchQuery, menuData, onAddToCart }: MenuListProps) {
  
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

  const handleAddToCart = (e: React.MouseEvent, item: MenuItem) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart({ ...item, quantity: 1 });
    }
    console.log("Added to cart:", item.name);
  };

  const filtered = filteredMenuData();
  const visibleCategories = categories.filter(cat => cat in filtered);

  return (
    <div className="px-4 pb-20">
      {visibleCategories.length === 0 && searchQuery ? (
        <div className="py-12 text-center">
          <p className="text-[#727272] text-[18px]">No items found for "{searchQuery}"</p>
        </div>
      ) : null}
      {visibleCategories.map((category) => {
        const categoryIndex = categories.indexOf(category);
        return (
          <div key={category} ref={categoryRefs[categoryIndex]} className="scroll-mt-[140px]">
            <h2 className="text-[24px] font-bold text-[var(--text-primary)] mb-6 mt-8">{category}</h2>
            {filtered[category as keyof typeof filtered].map((item, itemIndex) => (
            <div 
              key={itemIndex} 
              className={`pb-9 mb-9 border-b border-[var(--item-border)] ${item.available !== false ? 'cursor-pointer' : 'opacity-60 grayscale-[50%]'} -mx-4 px-4 rounded-lg transition-colors`}
              onClick={() => {
                if (item.available !== false) onItemClick(item);
              }}
            >
              <div className="flex gap-4">
                <div className="flex-1">
                  <h3 className="text-[15.5px] font-semibold mb-2">{item.name}</h3>
                  <p className="text-[12.8px] text-gray-700 mb-6">{item.description}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <p className={`text-[15.5px] font-semibold ${item.available === false ? 'text-gray-400' : 'text-[var(--text-price)]'}`}>
                      AED {item.price}
                    </p>
                    {item.available === false ? (
                      <span className="text-red-500 text-[12px] font-bold px-4 py-2 border border-red-500 rounded-[35px]">
                        OUT OF STOCK
                      </span>
                    ) : (
                      <button
                        onClick={(e) => handleAddToCart(e, item)}
                        className="bg-[var(--btn-add-bg)] backdrop-blur-sm shadow-[var(--topbar-shadow)] rounded-[35px] px-4 py-2 text-[12px] font-medium text-[var(--accent)] hover:bg-[var(--btn-add-hover)] transition-all"
                      >
                        Add
                      </button>
                    )}
                  </div>
                </div>
                <div className="w-[120px] h-[110px] rounded-[24px] flex-shrink-0 overflow-hidden bg-gradient-to-br from-[var(--img-placeholder-from)] to-[var(--img-placeholder-to)]">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🍽️</div>
                  )}
                </div>
              </div>
            </div>
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
}

function ProductDetail({ item, isOpen, onClose, onAddToCart }: ProductDetailProps) {
  if (!item) return null;

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart({ ...item, quantity: 1 });
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
              <h2 className="text-[28px] font-bold text-[var(--text-primary)] mb-3">{item.name}</h2>

              {/* Description */}
              <p className="text-[16px] text-[var(--text-secondary)] mb-6 leading-relaxed">{item.description}</p>

              {/* Price */}
              <p className="text-[32px] font-bold text-[var(--text-price)] mb-8">AED {item.price}</p>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                className="w-full bg-[var(--btn-add-bg)] backdrop-blur-sm shadow-[var(--topbar-shadow)] rounded-[35px] py-4 text-[18px] font-semibold text-[var(--accent)] hover:bg-[var(--btn-add-hover)] transition-all"
              >
                Add to Cart
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

export default function Categories({ onBackHome, onAddToCart, cartItemsCount = 0, onNavigateToCart }: { onBackHome?: () => void; onAddToCart?: (item: MenuItem & { quantity: number }) => void; cartItemsCount?: number; onNavigateToCart?: () => void }) {
  const CACHE_CATS_KEY = 'tasty_categories_v1';
  const CACHE_MENU_KEY = 'tasty_menu_v1';

  // Restore from cache immediately so the page renders without waiting for the network
  const getCachedCategories = (): string[] => {
    try {
      const raw = localStorage.getItem(CACHE_CATS_KEY);
      if (raw) { const parsed = JSON.parse(raw); if (Array.isArray(parsed) && parsed.length > 0) return parsed; }
    } catch {}
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
    } catch {}
    return null;
  };

  const cachedCats = getCachedCategories();
  const cachedMenu = getCachedMenuData(cachedCats);

  const [categories, setCategories] = useState<string[]>(cachedCats);
  const [menuData, setMenuData] = useState<Record<string, MenuItem[]>>(cachedMenu ?? {});
  // Only show loading spinner if there is no cached data yet (true first-time visitor)
  const [loading, setLoading] = useState<boolean>(cachedMenu === null);
  const categoryRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

        // Fetch both sources in parallel
        const [catSnap, response] = await Promise.all([
          get(ref(db, 'settings/categories')),
          fetch(`${apiUrl}/api/menu`),
        ]);

        // Resolve categories
        let cats = DEFAULT_CATEGORIES;
        if (catSnap.exists()) {
          const saved = catSnap.val();
          if (Array.isArray(saved) && saved.length > 0) cats = saved;
        }

        // Resolve menu items
        const items: (MenuItem & { category: string })[] = await response.json();
        const organized = buildOrganized(cats, Array.isArray(items) ? items : []);

        // Update UI (background refresh — user may already be browsing cached data)
        setCategories(cats);
        setMenuData(organized);

        // Persist fresh data to cache
        localStorage.setItem(CACHE_CATS_KEY, JSON.stringify(cats));
        localStorage.setItem(CACHE_MENU_KEY, JSON.stringify(items));
      } catch (error) {
        console.error('Failed to fetch menu:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const handleCategoryClick = (index: number) => {
    const el = categoryRefs.current[index];
    if (!el) return;
    // Scroll the page section into view, offset by the combined sticky header height
    // (topbar ~105px + category strip ~60px = 165px total)
    const STICKY_OFFSET = 168;
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
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <TopBar onBackHome={onBackHome} cartItemsCount={cartItemsCount} onNavigateToCart={onNavigateToCart} />
      <div className="flex-1">
        <HeroSection />
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <InfoCard />
        <CategoryTabs categories={categories} onCategoryClick={handleCategoryClick} />

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
          <MenuList categories={categories} categoryRefs={categoryRefs.current.map((r) => ({ current: r }) as React.RefObject<HTMLDivElement>)} onItemClick={openProductDetail} searchQuery={searchQuery} menuData={menuData} onAddToCart={handleAddItemToCart} />
        )}
      </div>
      <ProductDetail item={selectedItem} isOpen={isProductDetailOpen} onClose={closeProductDetail} onAddToCart={handleAddItemToCart} />
      
      {/* Toast Notification */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[var(--toast-bg)] text-white px-6 py-4 rounded-[35px] shadow-lg z-50 font-medium"
        >
          {toastMessage}
        </motion.div>
      )}
    </div>
  );
}