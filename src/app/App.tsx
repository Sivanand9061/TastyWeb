import { useState, useEffect } from 'react';
import Categories from '../imports/Categories/CategoriesFixed';
import HomePage from '../imports/HomePage/HomePage';
import CartPage from '../imports/CartPage/CartPage';
import AdminAddItems from '../imports/Admin/AdminAddItems';
import ProfileDashboard from '../imports/Profile/ProfileDashboard';
import KitchenDashboard from '../imports/Admin/KitchenDashboard';

interface CartItem {
  name: string;
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
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('cartItems');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist current page to localStorage
  useEffect(() => {
    localStorage.setItem('currentPage', currentPage);
  }, [currentPage]);

  // Persist cart items to localStorage
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  const handleExploreMenu = () => {
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

  return (
    <div className="size-full">
      {currentPage === 'home' ? (
        <HomePage onExploreClick={handleExploreMenu} cartItemsCount={cartItems.length} onNavigateToCart={handleGoToCart} onNavigateToAdmin={handleGoToAdmin} onNavigateToProfile={handleGoToProfile} />
      ) : currentPage === 'menu' ? (
        <Categories onBackHome={handleBackToHome} onAddToCart={handleAddToCart} cartItemsCount={cartItems.length} onNavigateToCart={handleGoToCart} />
      ) : currentPage === 'cart' ? (
        <CartPage cartItems={cartItems} onBackHome={handleBackToHome} onContinueShopping={handleContinueShopping} onClearCart={handleClearCart} onNavigateToProfile={handleGoToProfile} />
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
    </div>
  );
}