import React, { useEffect, useState } from 'react';
import { useAuth } from '../../app/AuthContext';
import { db } from '../../firebase';
import { ref, query, orderByChild, equalTo, onValue } from 'firebase/database';
import { Package, Clock, CheckCircle2, ChevronRight, LogOut, ArrowLeft } from 'lucide-react';
import { auth } from '../../firebase';
import { useHomepageSettings } from '../HomePage/useHomepageSettings';

interface OrderItem {
  name: string;
  quantity: number;
  price: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
}

export default function ProfileDashboard({ onBackHome }: { onBackHome: () => void }) {
  const { currentUser } = useAuth();
  const { settings } = useHomepageSettings();
  const currency = settings.currency || 'AED';
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // Set up a real-time listener for the user's orders
    const ordersRef = query(ref(db, 'orders'), orderByChild('userId'), equalTo(currentUser.uid));
    
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const ordersArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(ordersArray);
      } else {
        setOrders([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching orders:", error);
      setOrders([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleLogout = () => {
    auth.signOut();
    onBackHome();
  };

  if (loading) {
    return <div className="min-h-screen bg-[#fbf4e8] p-8 flex items-center justify-center">Loading...</div>;
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#fbf4e8] p-8 flex flex-col items-center justify-center">
        <p className="mb-4">Please log in to view your profile.</p>
        <button onClick={onBackHome} className="bg-[#f51c27] text-white px-6 py-2 rounded-xl">Go Home</button>
      </div>
    );
  }

  const activeOrders = orders.filter(o => !['Delivered', 'Cancelled'].includes(o.status));
  const pastOrders = orders.filter(o => ['Delivered', 'Cancelled'].includes(o.status));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Preparing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'On Way': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'Pending': return 'Awaiting kitchen confirmation...';
      case 'Preparing': return 'The kitchen is preparing your meal!';
      case 'On Way': return 'Your order is out for delivery!';
      case 'Delivered': return 'Enjoy your meal!';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf4e8]">
      <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 h-[70px] flex items-center justify-between">
          <button onClick={onBackHome} className="p-2 -ml-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold text-gray-900">My Profile</h1>
          <button onClick={handleLogout} className="p-2 -mr-2 text-red-500 hover:text-red-700 transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        
        {/* Active Orders Widget */}
        {activeOrders.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-black text-[#1c1c1a] mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#f51c27] animate-pulse"></span>
              Live Tracking
            </h2>
            <div className="space-y-4">
              {activeOrders.map(order => (
                <div key={order.id} className="bg-white rounded-[22px] p-6 shadow-xl border-2 border-[#1caa00]/20 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-[#1caa00]/10">
                    <div className="h-full bg-[#1caa00] transition-all duration-1000" style={{ 
                      width: order.status === 'Pending' ? '25%' : 
                             order.status === 'Preparing' ? '50%' : 
                             order.status === 'On Way' ? '75%' : '100%' 
                    }}></div>
                  </div>
                  
                  <div className="flex justify-between items-start mb-4 mt-2">
                    <div>
                      <span className="text-sm font-bold text-gray-500">{order.orderNumber}</span>
                      <h3 className="text-lg font-black text-gray-900 mt-1">{getStatusMessage(order.status)}</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm py-1">
                        <span className="text-gray-600">{item.quantity}x {item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order History */}
        <div>
           <h2 className="text-xl font-black text-[#1c1c1a] mb-4">Past Orders</h2>
           {pastOrders.length === 0 ? (
             <div className="text-center py-12 text-gray-500 bg-white rounded-[22px]">
               No past orders found.
             </div>
           ) : (
             <div className="space-y-4">
               {pastOrders.map(order => (
                 <div key={order.id} className="bg-white rounded-[22px] p-5 border border-[#e0e0e0] shadow-sm">
                   <div className="flex justify-between items-center mb-3">
                     <span className="font-bold text-gray-900">{order.orderNumber}</span>
                     <span className="text-sm font-semibold text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</span>
                   </div>
                   <div className="text-sm text-gray-600 mb-3 truncate">
                     {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                   </div>
                   <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                     <span className={`px-2 py-1 rounded-md text-xs font-bold border ${getStatusColor(order.status)}`}>
                       {order.status}
                     </span>
                     <span className="font-bold text-[#1caa00]">{currency} {order.totalAmount}</span>
                   </div>
                 </div>
               ))}
             </div>
           )}
        </div>
        
      </div>
    </div>
  );
}
