import { useState, useEffect } from 'react';
import Categories from '../imports/Categories/CategoriesFixed';
import HomePage from '../imports/HomePage/HomePage';
import CartPage from '../imports/CartPage/CartPage';
import AdminAddItems from '../imports/Admin/AdminAddItems';
import ProfileDashboard from '../imports/Profile/ProfileDashboard';
import KitchenDashboard from '../imports/Admin/KitchenDashboard';
import PwaInstallPrompt from '../components/PwaInstallPrompt';

import { Utensils, ReceiptText, ShoppingBag, User as UserIcon, Home, ChevronLeft } from 'lucide-react';
import { useAuth } from './AuthContext';
import LoginSignupModal from '../imports/Auth/LoginSignupModal';
import { useHomepageSettings } from '../imports/HomePage/useHomepageSettings';

interface CartItem {
  name: string;
  nameAr?: string;
  description: string;
  price: string;
  quantity: number;
  image?: string;
  variant?: string;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'menu' | 'cart' | 'admin' | 'profile' | 'kitchen'>(
    (typeof window !== 'undefined' && localStorage.getItem('currentPage') as 'home' | 'menu' | 'cart' | 'admin' | 'profile' | 'kitchen') || 'home'
  );
  const [orderType, setOrderType] = useState<'delivery' | 'takeaway'>('delivery');
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('cartItems');
    return saved ? JSON.parse(saved) : [];
  });

  const { currentUser, isAdmin } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { settings } = useHomepageSettings();
  const [targetItemName, setTargetItemName] = useState<string | null>(null);

  // Persist current page to localStorage
  useEffect(() => {
    localStorage.setItem('currentPage', currentPage);
  }, [currentPage]);

  // Persist cart items to localStorage
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  const handleExploreMenu = (itemName?: string) => {
    setTargetItemName(typeof itemName === 'string' ? itemName : null);
    setCurrentPage('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeliveryClick = () => {
    setOrderType('delivery');
    setCurrentPage('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTakeawayClick = () => {
    setOrderType('takeaway');
    setCurrentPage('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHome = () => {
    setCurrentPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContinueShopping = () => {
    setCurrentPage('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (item: CartItem) => {
    // Match on name + variant so Half and Full are separate cart lines
    const existingItem = cartItems.find(
      ci => ci.name === item.name && (ci.variant ?? '') === (item.variant ?? '')
    );
    if (existingItem) {
      setCartItems(cartItems.map(ci =>
        ci.name === item.name && (ci.variant ?? '') === (item.variant ?? '')
          ? { ...ci, quantity: ci.quantity + item.quantity }
          : ci
      ));
    } else {
      setCartItems([...cartItems, item]);
    }
  };

  const handleGoToCart = () => {
    setCurrentPage('cart');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleGoToAdmin = () => {
    setCurrentPage('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToProfile = () => {
    setCurrentPage('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isShellPage = currentPage === 'home' || currentPage === 'menu' || currentPage === 'profile';

  return (
    <div className="size-full bg-white relative pb-20">
      {/* Global White Header for App Shell */}
      {isShellPage && currentPage !== 'home' && (
        <div className="sticky top-0 z-50 bg-[#eaeaec] h-[60px] flex items-center justify-between px-4 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)]">
          <div className="flex items-center cursor-pointer h-full py-1" onClick={handleBackToHome}>
            <img
              alt="Tasty Hot Logo"
              src={settings.logoImage}
              className="h-[48px] w-auto max-w-[160px] object-contain"
            />
          </div>
          
          <div className="flex-1" />
          
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={handleGoToAdmin}
                className="text-[10px] font-bold bg-[#f51c27] text-white px-2 py-1 rounded hover:bg-[#d90429] transition-colors shadow-sm"
              >
                ADMIN
              </button>
            )}
            <button 
              onClick={() => currentUser ? handleGoToProfile() : setIsLoginModalOpen(true)} 
              className="w-8 h-8 rounded-full bg-[#1c2938] border-2 border-white flex items-center justify-center overflow-hidden shadow-sm"
            >
               {currentUser ? (
                 <UserIcon size={16} className="text-white" />
               ) : (
                 <UserIcon size={16} className="text-white opacity-50" />
               )}
            </button>
          </div>
        </div>
      )}

      {/* Pages */}
      <main className="w-full">
        {currentPage === 'home' ? (
          <HomePage 
            onExploreClick={handleExploreMenu} 
            onDeliveryClick={handleDeliveryClick} 
            onTakeawayClick={handleTakeawayClick} 
            cartItemsCount={cartItems.length} 
            onNavigateToCart={handleGoToCart} 
            onNavigateToAdmin={handleGoToAdmin} 
            onNavigateToProfile={handleGoToProfile}
            onLoginClick={() => currentUser ? handleGoToProfile() : setIsLoginModalOpen(true)}
            isAdmin={isAdmin}
          />
        ) : currentPage === 'menu' ? (
          <Categories onBackHome={handleBackToHome} onAddToCart={handleAddToCart} cartItemsCount={cartItems.length} onNavigateToCart={handleGoToCart} targetItemName={targetItemName} clearTargetItem={() => setTargetItemName(null)} />
        ) : currentPage === 'cart' ? (
          <CartPage cartItems={cartItems} orderType={orderType} onBackHome={handleBackToHome} onContinueShopping={handleContinueShopping} onClearCart={handleClearCart} onNavigateToProfile={handleGoToProfile} />
        ) : currentPage === 'admin' ? (
          <div className="w-full min-h-screen">
            <button 
              onClick={handleBackToHome}
              className="fixed top-4 left-4 bg-[#f51c27] text-white px-4 py-2 rounded-[12px] font-bold hover:bg-[#d90429] z-50"
            >
              ← Back
            </button>
            <AdminAddItems />
            
            <button 
              onClick={() => setCurrentPage('kitchen')}
              className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 border-[4px] border-white rounded-[12px] font-bold hover:bg-green-600 shadow-xl z-50 flex items-center gap-2"
            >
              Launch Kitchen Dashboard 👨‍🍳
            </button>
          </div>
        ) : currentPage === 'profile' ? (
          <ProfileDashboard onBackHome={handleBackToHome} />
        ) : currentPage === 'kitchen' ? (
          <KitchenDashboard onBackHome={handleBackToHome} />
        ) : null}
      </main>

      {/* Global Sticky Bottom Navigation Tab Bar */}
      {isShellPage && currentPage !== 'cart' && (
        <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-100 flex items-center justify-around py-2 pt-3 pb-6 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] rounded-t-[20px]">
          <button 
            onClick={handleBackToHome}
            className={`flex flex-col items-center gap-1 w-1/4 ${currentPage === 'home' ? 'text-[#f51c27]' : 'text-gray-400'}`}
          >
            <Home size={22} strokeWidth={currentPage === 'home' ? 2.5 : 2} />
            <span className="text-[9px] font-black tracking-widest uppercase">Home</span>
          </button>

          <button 
            onClick={handleExploreMenu}
            className={`flex flex-col items-center gap-1 w-1/4 ${currentPage === 'menu' ? 'text-[#f51c27]' : 'text-gray-400'}`}
          >
            <Utensils size={22} strokeWidth={currentPage === 'menu' ? 2.5 : 2} />
            <span className="text-[9px] font-black tracking-widest uppercase">Discover</span>
          </button>
          
          <button 
            onClick={handleGoToProfile}
            className={`flex flex-col items-center gap-1 w-1/4 ${currentPage === 'profile' ? 'text-[#f51c27]' : 'text-gray-400'}`}
          >
            <ReceiptText size={22} strokeWidth={currentPage === 'profile' ? 2.5 : 2} />
            <span className="text-[9px] font-black tracking-widest uppercase">Orders</span>
          </button>
          
          <button 
            onClick={handleGoToCart}
            className={`flex flex-col items-center gap-1 w-1/4 relative ${currentPage === 'cart' ? 'text-[#f51c27]' : 'text-gray-400'}`}
          >
            <ShoppingBag size={22} strokeWidth={currentPage === 'cart' ? 2.5 : 2} />
            {cartItems.length > 0 && (
              <div className="absolute top-[-4px] right-4 bg-[#f51c27] text-white text-[10px] font-bold w-4 h-4 flex justify-center items-center rounded-full border border-white">
                {cartItems.length}
              </div>
            )}
            <span className="text-[9px] font-black tracking-widest uppercase">Cart</span>
          </button>
        </div>
      )}

      <LoginSignupModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />

      {/* PWA install prompt — shown after sign in */}
      <PwaInstallPrompt />
    </div>
  );
}