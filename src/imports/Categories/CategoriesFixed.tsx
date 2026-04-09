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
    <div className="sticky top-0 z-50 bg-[rgba(157,157,157,0.26)] backdrop-blur-sm shadow-[0px_2px_9.7px_0px_rgba(0,0,0,0.25)] rounded-[35px] mx-4 mt-5 mb-4 h-[70px]">
      <div className="flex items-center justify-between px-6 py-3 max-w-[1280px] mx-auto">
        <button onClick={onBackHome} className="w-[46px] h-[46px] relative hover:opacity-80 transition-opacity">
          <img alt="Tasty Hot Logo" className="w-full h-full object-cover" src={imgLogoPng} />
        </button>
        <button onClick={onNavigateToCart} className="relative hover:opacity-80 transition-opacity">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 19.9815 20">
            <path d={svgPaths.pb5c2400} fill="#1C1C1A" />
          </svg>
          {cartItemsCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-[#d90429] rounded-full w-4 h-4 flex items-center justify-center">
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
      <h1 className="text-[56px] font-black text-[#f51c27] leading-tight">Tasty Hot</h1>
    </div>
  );
}

function InfoCard() {
  return (
    <div className="mx-4 mb-6">
      <div className="border border-[#d1d1d1] rounded-[22px] p-4">
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
          className="w-full h-[51px] px-12 border border-[#d1d1d1] rounded-[32px] text-[#727272] text-[21px] placeholder:text-[#727272] focus:outline-none focus:border-[#f51c27]"
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px]">
          <svg className="w-full h-full" fill="none" viewBox="0 0 18 18">
            <path d={svgPaths.p8a35e00} fill="#1C1C1A" />
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

  const handleCategoryClick = (index: number) => {
    setActiveCategory(index);
    onCategoryClick(index);
    // Scroll the tab into view
    const btn = buttonRefs.current[index];
    btn?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    // Delay underline update to let scroll finish
    setTimeout(() => updateUnderline(index), 320);
  };

  const updateUnderline = (index: number) => {
    const button = buttonRefs.current[index];
    const container = containerRef.current;
    if (button && container) {
      const containerRect = container.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      setUnderlineStyle({
        width: buttonRect.width,
        left: buttonRect.left - containerRect.left + container.scrollLeft,
      });
    }
  };

  useEffect(() => {
    updateUnderline(activeCategory);
    const handleResize = () => updateUnderline(activeCategory);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeCategory, categories]);

  return (
    <div className="sticky top-[105px] z-40 bg-[#fbf4e8] border-t border-b border-[#c1c1c1] py-3 mb-6">
      <div className="px-4">
        <div ref={containerRef} className="flex items-center gap-6 overflow-x-auto scrollbar-hide relative">
          {categories.map((category, index) => (
            <button
              key={category}
              ref={(el) => {
                buttonRefs.current[index] = el;
              }}
              onClick={() => handleCategoryClick(index)}
              className={`whitespace-nowrap transition-all ${
                activeCategory === index
                  ? "text-[#727272] text-[21px] font-medium"
                  : "text-[#727272] text-[15.5px] opacity-50 hover:opacity-75"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        <div 
          className="h-1 bg-[#626262] rounded mt-3 transition-all duration-300 ease-out"
          style={{ width: `${underlineStyle.width}px`, transform: `translateX(${underlineStyle.left}px)` }}
        ></div>
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
            <h2 className="text-[24px] font-bold text-[#1c1c1a] mb-6 mt-8">{category}</h2>
            {filtered[category as keyof typeof filtered].map((item, itemIndex) => (
            <div 
              key={itemIndex} 
              className={`pb-9 mb-9 border-b border-[#d0d0d0] ${item.available !== false ? 'cursor-pointer hover:bg-gray-50' : 'opacity-60 grayscale-[50%]'} -mx-4 px-4 rounded-lg transition-colors`}
              onClick={() => {
                if (item.available !== false) onItemClick(item);
              }}
            >
              <div className="flex gap-4">
                <div className="flex-1">
                  <h3 className="text-[15.5px] font-semibold mb-2">{item.name}</h3>
                  <p className="text-[12.8px] text-gray-700 mb-6">{item.description}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <p className={`text-[15.5px] font-semibold ${item.available === false ? 'text-gray-400' : 'text-[#1caa00]'}`}>
                      {item.price}
                    </p>
                    {item.available === false ? (
                      <span className="text-red-500 text-[12px] font-bold px-4 py-2 border border-red-500 rounded-[35px]">
                        OUT OF STOCK
                      </span>
                    ) : (
                      <button
                        onClick={(e) => handleAddToCart(e, item)}
                        className="bg-[rgba(157,157,157,0.26)] backdrop-blur-sm shadow-[0px_2px_9.7px_0px_rgba(0,0,0,0.25)] rounded-[35px] px-4 py-2 text-[12px] font-medium text-[#f51c27] hover:bg-[rgba(157,157,157,0.35)] transition-all"
                      >
                        Add
                      </button>
                    )}
                  </div>
                </div>
                <div className="w-[120px] h-[110px] rounded-[24px] flex-shrink-0 overflow-hidden bg-gradient-to-br from-[#ffe8e8] to-[#ffd0d0]">
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
              <div className="w-full h-[260px] rounded-[28px] overflow-hidden bg-gradient-to-br from-[#ffe8e8] to-[#ffd0d0] mb-6">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-7xl">🍽️</div>
                )}
              </div>

              {/* Product Name */}
              <h2 className="text-[28px] font-bold text-[#1c1c1a] mb-3">{item.name}</h2>

              {/* Description */}
              <p className="text-[16px] text-gray-700 mb-6 leading-relaxed">{item.description}</p>

              {/* Price */}
              <p className="text-[32px] font-bold text-[#1caa00] mb-8">{item.price}</p>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                className="w-full bg-[rgba(157,157,157,0.26)] backdrop-blur-sm shadow-[0px_2px_9.7px_0px_rgba(0,0,0,0.25)] rounded-[35px] py-4 text-[18px] font-semibold text-[#f51c27] hover:bg-[rgba(157,157,157,0.35)] transition-all"
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
          <div className="text-center mb-2">
            <h2 className="text-[28px] font-bold mb-1">Tasty Hot</h2>
            <p className="text-[9px] font-medium">Restaurant & Cafeteria</p>
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
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [menuData, setMenuData] = useState<Record<string, MenuItem[]>>({});
  const [loading, setLoading] = useState(true);
  const categoryRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Fetch categories from Firebase + menu items from API
  useEffect(() => {
    const fetchAll = async () => {
      try {
        // Fetch categories from Firebase
        const catSnap = await get(ref(db, 'settings/categories'));
        let cats = DEFAULT_CATEGORIES;
        if (catSnap.exists()) {
          const saved = catSnap.val();
          if (Array.isArray(saved) && saved.length > 0) cats = saved;
        }
        setCategories(cats);

        // Fetch menu items from API
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/api/menu`);
        const items = await response.json();

        // Build organized object dynamically based on saved categories
        const organized: Record<string, MenuItem[]> = {};
        cats.forEach(cat => { organized[cat] = []; });

        if (items && items.length > 0) {
          items.forEach((item: MenuItem & { category: string }) => {
            if (!organized[item.category]) organized[item.category] = [];
            organized[item.category].push(item);
          });
        }

        setMenuData(organized);
      } catch (error) {
        console.error('Failed to fetch menu:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const handleCategoryClick = (index: number) => {
    categoryRefs.current[index]?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
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
    <div className="min-h-screen bg-[#fbf4e8] flex flex-col">
      <TopBar onBackHome={onBackHome} cartItemsCount={cartItemsCount} onNavigateToCart={onNavigateToCart} />
      <div className="flex-1">
        <HeroSection />
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <InfoCard />
        <CategoryTabs categories={categories} onCategoryClick={handleCategoryClick} />
        <MenuList categories={categories} categoryRefs={categoryRefs.current.map((r, i) => ({ current: r }) as React.RefObject<HTMLDivElement>)} onItemClick={openProductDetail} searchQuery={searchQuery} menuData={menuData} onAddToCart={handleAddItemToCart} />
      </div>
      <ProductDetail item={selectedItem} isOpen={isProductDetailOpen} onClose={closeProductDetail} onAddToCart={handleAddItemToCart} />
      
      {/* Toast Notification */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#1caa00] text-white px-6 py-4 rounded-[35px] shadow-lg z-50 font-medium"
        >
          {toastMessage}
        </motion.div>
      )}
    </div>
  );
}