import { useState } from "react";
import { motion } from "motion/react";
import imgLogoPng from "../Categories/fe9439b0b5b8f4134a87490c14dd926f577a90d9.png";
import imgWhatsApp from "../Categories/ed00f9add7cd5cb0ff88532464058a5e59bc4497.png";
import imgImage1 from "../Categories/99fddedb4828ce247ec845e7f4b3ade3c1715928.png";
import { useAuth } from '../../app/AuthContext';
import { User, LogIn } from 'lucide-react';
import LoginSignupModal from "../Auth/LoginSignupModal";

const svgPaths = {
  path_2: "M19.9815 5.5556H16.6667L13.8889 1.1111H6.1111L3.3333 5.5556H0V7.7778H1.6667L3.3333 18.8889H16.6667L18.3333 7.7778H19.9815V5.5556ZM7.7778 2.7778H12.2222L13.6111 5.5556H6.3889L7.7778 2.7778ZM15.2778 16.6667H4.7222L3.3333 7.7778H16.6667L15.2778 16.6667Z"
};

function TopBar({ cartItemsCount = 0, onNavigateToCart, onNavigateToAdmin, onNavigateToProfile }: { cartItemsCount?: number; onNavigateToCart?: () => void; onNavigateToAdmin?: () => void; onNavigateToProfile?: () => void }) {
  const { currentUser, isAdmin } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <>
      <div className="sticky top-0 z-[100] bg-[rgba(157,157,157,0.26)] backdrop-blur-sm shadow-[0px_2px_9.7px_0px_rgba(0,0,0,0.25)] rounded-[35px] mx-2 mt-5 mb-4 h-[70px]">
        <div className="flex items-center justify-between px-6 py-3 max-w-[1280px] mx-auto h-full">
          <div className="w-[49px] h-[46px] ml-[-0.3rem]">
            <img alt="Tasty Hot Logo" className="w-full h-full object-cover" src={imgLogoPng} />
          </div>

          <div className="flex items-center gap-3 relative mr-[-1.5rem]">
            {isAdmin && (
              <button
                onClick={onNavigateToAdmin}
                className="text-[10px] font-bold bg-[#f51c27] text-white px-2 py-1 rounded hover:bg-[#d90429] transition-colors"
                title="Admin Dashboard"
              >
                ADMIN
              </button>
            )}

            {currentUser ? (
              <button onClick={onNavigateToProfile} className="p-2 -mr-1">
                <User size={20} className="text-gray-800" />
              </button>
            ) : (
              <button onClick={() => setIsLoginModalOpen(true)} className="p-2 -mr-1">
                <LogIn size={20} className="text-gray-800" />
              </button>
            )}

            <button onClick={onNavigateToCart} className="relative p-2 ml-1">
              <svg className="w-5 h-5 -mt-0.5" fill="none" viewBox="0 0 19.9815 20">
                <path d={svgPaths.path_2} fill="#1C1C1A" />
              </svg>
              {cartItemsCount > 0 && (
                <div className="absolute top-0 right-0 bg-[#d90429] rounded-full w-4 h-4 flex items-center justify-center border-2 border-white">
                  <span className="text-white text-[9px] font-bold leading-none">{cartItemsCount}</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
      <LoginSignupModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </>
  );
}

function HeroSection({ onExploreClick }: { onExploreClick: () => void }) {
  return (
    <div className="relative h-screen flex flex-col items-center justify-end pb-20 overflow-hidden">
      {/* Full-screen background image */}
      <img
        src="/images/hero.jpeg"
        alt="Tasty Hot — Fresh Delicious Food"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />

      {/* Gradient overlay: light at top (for topbar), dark at bottom (for text readability) */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/80" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 w-full max-w-lg">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-6xl font-black text-white mb-2 drop-shadow-2xl tracking-tight"
        >
          Tasty Hot
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-base text-white/80 mb-8 font-medium tracking-wide drop-shadow-lg"
        >
          Fresh. Bold. Delivered to your door.
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onExploreClick}
          className="bg-[rgba(157,157,157,0.26)] backdrop-blur-sm shadow-[0px_2px_9.7px_0px_rgba(0,0,0,0.25)] rounded-[35px] px-12 py-4 text-[20px] font-bold text-white hover:bg-[rgba(157,157,157,0.4)] transition-all border border-white/20"
        >
          Explore Menu
        </motion.button>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-white/50"
      >
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>
    </div>
  );
}


function HighlightsSection() {
  const highlights = [
    {
      category: "Pizza",
      items: 3,
      description: "Authentic Italian pizzas with fresh ingredients",
      icon: "🍕",
    },
    {
      category: "Burgers",
      items: 3,
      description: "Juicy burgers prepared fresh to order",
      icon: "🍔",
    },
    {
      category: "Pasta",
      items: 3,
      description: "Creamy and savory pasta dishes",
      icon: "🍝",
    },
    {
      category: "Desserts",
      items: 3,
      description: "Sweet treats and desserts",
      icon: "🍰",
    },
  ];

  return (
    <div className="bg-[#fbf4e8] py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-[48px] font-black text-[#1c1c1a] text-center mb-4">Our Highlights</h2>
        <p className="text-[18px] text-[#727272] text-center mb-16 max-w-2xl mx-auto">
          Discover our most popular dishes and categories, crafted with love and the finest ingredients
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {highlights.map((highlight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-[32px] p-8 shadow-md hover:shadow-lg transition-shadow text-center"
            >
              <div className="text-[64px] mb-4">{highlight.icon}</div>
              <h3 className="text-[24px] font-bold text-[#1c1c1a] mb-3">{highlight.category}</h3>
              <p className="text-[14px] text-[#727272] mb-4">{highlight.description}</p>
              <p className="text-[16px] font-semibold text-[#f51c27]">{highlight.items} Items</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AboutUsSection() {
  return (
    <div className="py-20 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="h-[400px] bg-gradient-to-br from-[#fbf4e8] to-[#f0e8dc] rounded-[32px] flex items-center justify-center"
          >
            <div className="text-center">
              <div className="text-[96px] mb-4">👨‍🍳</div>
              <p className="text-[#727272] text-[16px]">Expert Chefs</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-[48px] font-black text-[#1c1c1a] mb-6">About Tasty Hot</h2>
            <p className="text-[16px] text-[#727272] mb-6 leading-relaxed">
              Welcome to Tasty Hot, your favorite destination for delicious food and great vibes. Located in the heart of Al Rawda, Ajman, we bring you authentic recipes combined with modern culinary techniques.
            </p>
            <p className="text-[16px] text-[#727272] mb-6 leading-relaxed">
              Our team of passionate chefs works tirelessly to prepare fresh, high-quality meals using only the finest ingredients. From traditional pizzas to gourmet burgers, every dish is crafted with care and attention to detail.
            </p>
            <p className="text-[16px] text-[#727272] mb-8 leading-relaxed">
              Whether you're looking for a quick bite or a complete dining experience, Tasty Hot has something special for everyone. We believe in delivering excellence in every plate.
            </p>
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <h4 className="text-[20px] font-bold text-[#1caa00] mb-2">Fresh Quality</h4>
                <p className="text-[14px] text-[#727272]">Only the freshest ingredients in every meal</p>
              </div>
              <div className="flex-1 min-w-[200px]">
                <h4 className="text-[20px] font-bold text-[#1caa00] mb-2">Fast Delivery</h4>
                <p className="text-[14px] text-[#727272]">Quick service without compromising quality</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div className="relative bg-gradient-to-b from-[#f51c27] to-[#8f1017] text-white overflow-hidden">
      <div className="relative z-10 py-16 px-6">
        <div className="max-w-md mx-auto">
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

          <div className="text-center mb-8">
            <p className="text-[10px] leading-relaxed">
              Near Al Hamdiya Police Station, Opp. KENZ Hyper Market, Al Rawda 1, Ajman UAE
            </p>
          </div>

          <div className="space-y-8">
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

          <div className="text-center space-y-2">
            <p className="text-[10px]">© 2026 TASTY HOT. ALL RIGHTS RESERVED.</p>
            <p className="text-[8px]">PRIVACY | NO-FLUFF POLICY</p>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute -left-20 top-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}

export default function HomePage({ onExploreClick, cartItemsCount, onNavigateToCart, onNavigateToAdmin, onNavigateToProfile }: { onExploreClick: () => void; cartItemsCount?: number; onNavigateToCart?: () => void; onNavigateToAdmin?: () => void; onNavigateToProfile?: () => void }) {
  return (
    <div className="min-h-screen bg-[#fbf4e8]">
      {/* TopBar — sticky, glassmorphic, sits on top of the hero image */}
      <div className="w-full relative z-[100] px-2 lg:px-4">
        <TopBar cartItemsCount={cartItemsCount} onNavigateToCart={onNavigateToCart} onNavigateToAdmin={onNavigateToAdmin} onNavigateToProfile={onNavigateToProfile} />
      </div>

      {/* Hero — pulled up behind the TopBar so image is truly full-screen */}
      <div className="-mt-[110px]">
        <HeroSection onExploreClick={onExploreClick} />
      </div>

      {/* Below-fold content */}
      <HighlightsSection />
      <AboutUsSection />
      <Footer />
    </div>
  );
}

