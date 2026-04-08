import React, { useEffect, useState, useRef } from 'react';
import { db } from '../../firebase';
import { ref, onValue, update } from 'firebase/database';
import { useAuth } from '../../app/AuthContext';
import { ArrowLeft, Bell, BellOff, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
  customerName: string;
  phone: string;
  address: string;
  notes?: string;
  createdAt: string;
}

const b64Ping = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"; // simple dummy header, won't sound like much without full pcm, so let's use a real public url or beep.
const NOTIFICATION_SOUND = "https://actions.google.com/sounds/v1/alarms/beep_short.ogg";

export default function KitchenDashboard({ onBackHome }: { onBackHome: () => void }) {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'preparing' | 'onWay'>('pending');
  const previousOrdersLengthRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    const ordersRef = ref(db, 'orders');
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const ordersArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); // oldest first
        
        const pendingOrders = ordersArray.filter(o => o.status === 'Pending');
        
        // Play sound if new pending order arrived
        if (soundEnabled && audioRef.current && pendingOrders.length > previousOrdersLengthRef.current) {
          audioRef.current.play().catch(e => console.error("Audio block:", e));
        }
        
        previousOrdersLengthRef.current = pendingOrders.length;
        setOrders(ordersArray);
      } else {
        setOrders([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin, soundEnabled]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await update(ref(db, `orders/${orderId}`), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error("Failed to update status:", e);
      alert("Failed to update status. Check permissions.");
    }
  };

  const enableSound = () => {
    setSoundEnabled(true);
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>;

  if (!isAdmin) return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
      <h1 className="text-2xl mb-4">Access Denied</h1>
      <button onClick={onBackHome} className="bg-red-500 px-6 py-2 rounded-xl text-white">Go Back</button>
    </div>
  );

  const pendingOrders = orders.filter(o => o.status === 'Pending');
  const preparingOrders = orders.filter(o => o.status === 'Preparing');
  const onWayOrders = orders.filter(o => o.status === 'On Way');

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col font-sans">
      <audio ref={audioRef} src={NOTIFICATION_SOUND} preload="auto" />
      
      {/* Top Navigation */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-4">
          <button onClick={onBackHome} className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-black text-red-500">Kitchen Operations</h1>
        </div>

        <div className="flex items-center gap-4">
          {!soundEnabled ? (
            <button 
              onClick={enableSound}
              className="flex items-center gap-2 bg-yellow-500 text-yellow-950 px-4 py-2 rounded-xl font-bold hover:bg-yellow-400 animate-pulse"
            >
              <BellOff size={18} />
              Enable Alerts (Click Me)
            </button>
          ) : (
            <button 
              onClick={() => setSoundEnabled(false)}
              className="flex items-center gap-2 bg-gray-700 text-green-400 px-4 py-2 rounded-xl font-bold"
            >
              <Bell size={18} />
              Alerts Active
            </button>
          )}
          <div className="bg-gray-700 px-4 py-2 rounded-xl font-bold text-gray-300">
            {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="xl:hidden bg-gray-800 border-b border-gray-700 flex overflow-x-auto">
        <button 
          onClick={() => setActiveTab('pending')}
          className={`flex-1 min-w-[120px] py-4 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'pending' ? 'border-yellow-500 text-yellow-500 bg-yellow-500/10' : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'}`}
        >
          NEW ORDERS ({pendingOrders.length})
        </button>
        <button 
          onClick={() => setActiveTab('preparing')}
          className={`flex-1 min-w-[120px] py-4 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'preparing' ? 'border-blue-400 text-blue-400 bg-blue-400/10' : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'}`}
        >
          PREPARING ({preparingOrders.length})
        </button>
        <button 
          onClick={() => setActiveTab('onWay')}
          className={`flex-1 min-w-[120px] py-4 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'onWay' ? 'border-purple-400 text-purple-400 bg-purple-400/10' : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'}`}
        >
          DISPATCHED ({onWayOrders.length})
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex flex-col xl:flex-row gap-6 h-full min-h-max xl:min-w-max">
          
          {/* Column 1: Pending */}
          <div className={`w-full xl:w-[400px] xl:flex-shrink-0 flex-col bg-gray-800/50 rounded-2xl p-4 border border-gray-700 ${activeTab === 'pending' ? 'flex' : 'hidden xl:flex'}`}>
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-xl font-bold text-yellow-500 flex items-center gap-2">
                NEW ORDERS
                <span className="bg-yellow-500 text-yellow-950 text-xs px-2 py-0.5 rounded-full">{pendingOrders.length}</span>
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              <AnimatePresence>
                {pendingOrders.map(order => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    actionText="ACCEPT -> PREPARING" 
                    onAction={() => updateOrderStatus(order.id, 'Preparing')}
                    color="yellow"
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Column 2: Preparing */}
          <div className={`w-full xl:w-[400px] xl:flex-shrink-0 flex-col bg-gray-800/50 rounded-2xl p-4 border border-gray-700 ${activeTab === 'preparing' ? 'flex' : 'hidden xl:flex'}`}>
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2">
                PREPARING
                <span className="bg-blue-400 text-blue-950 text-xs px-2 py-0.5 rounded-full">{preparingOrders.length}</span>
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              <AnimatePresence>
                {preparingOrders.map(order => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    actionText="DISPATCH -> ON WAY" 
                    onAction={() => updateOrderStatus(order.id, 'On Way')}
                    color="blue"
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Column 3: Out for Delivery */}
          <div className={`w-full xl:w-[400px] xl:flex-shrink-0 flex-col bg-gray-800/50 rounded-2xl p-4 border border-gray-700 ${activeTab === 'onWay' ? 'flex' : 'hidden xl:flex'}`}>
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-xl font-bold text-purple-400 flex items-center gap-2">
                OUT FOR DELIVERY
                <span className="bg-purple-400 text-purple-950 text-xs px-2 py-0.5 rounded-full">{onWayOrders.length}</span>
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              <AnimatePresence>
                {onWayOrders.map(order => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    actionText="MARK AS DELIVERED" 
                    onAction={() => updateOrderStatus(order.id, 'Delivered')}
                    color="purple"
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function OrderCard({ order, actionText, onAction, color }: { order: Order, actionText: string, onAction: () => void, color: 'yellow'|'blue'|'purple' }) {
  const bgColors = {
    yellow: 'bg-yellow-500 hover:bg-yellow-400 text-yellow-950',
    blue: 'bg-blue-500 hover:bg-blue-400 text-white',
    purple: 'bg-purple-500 hover:bg-purple-400 text-white',
  };

  const borderColors = {
    yellow: 'border-yellow-500/30',
    blue: 'border-blue-500/30',
    purple: 'border-purple-500/30',
  }

  const timeDiff = Math.floor((new Date().getTime() - new Date(order.createdAt).getTime()) / 60000);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-gray-800 rounded-xl p-5 border-2 ${borderColors[color]} shadow-lg flex flex-col gap-4 relative overflow-hidden`}
    >
      <div className="flex justify-between items-start">
        <div>
          <span className="text-gray-400 text-sm font-bold">#{order.orderNumber}</span>
          <h3 className="text-lg font-black text-white mt-1">{order.customerName}</h3>
        </div>
        <div className="text-right">
          <span className={`text-xl font-black ${timeDiff > 15 && color === 'yellow' ? 'text-red-500 animate-pulse' : 'text-gray-300'}`}>
            {timeDiff}m ago
          </span>
        </div>
      </div>

      <div className="bg-gray-900/50 rounded-lg p-3">
        {order.items.map((item, i) => (
          <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-700/50 last:border-0 font-medium">
            <span className="text-gray-200"><span className="text-white font-bold">{item.quantity}x</span> {item.name}</span>
          </div>
        ))}
      </div>

      <div className="text-sm text-gray-400 space-y-1 bg-gray-900/30 p-3 rounded-lg">
        <p className="flex justify-between"><span className="text-gray-500">Phone:</span> <span className="text-white font-mono">{order.phone}</span></p>
        <p className="flex justify-between"><span className="text-gray-500">Address:</span> <span className="text-gray-300 text-right w-2/3 truncate">{order.address}</span></p>
        {order.notes && <p className="text-yellow-200/80 italic mt-2 text-xs border-t border-gray-700 pt-2">Note: {order.notes}</p>}
      </div>

      <button 
        onClick={onAction}
        className={`w-full py-4 rounded-xl font-black text-sm tracking-wider transition-all transform active:scale-[0.98] ${bgColors[color]}`}
      >
        {actionText}
      </button>
    </motion.div>
  );
}
