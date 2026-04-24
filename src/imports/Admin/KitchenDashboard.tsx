import React, { useEffect, useState, useRef } from 'react';
import { db } from '../../firebase';
import { ref, onValue, update } from 'firebase/database';
import { useAuth } from '../../app/AuthContext';
import { ArrowLeft, Bell, BellOff, Settings, X, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { auth } from '../../firebase';

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
  orderType?: string;
  tableNumber?: string;
}

// Removed external audio assets. Using Web Audio API synthesizer instead.

export default function KitchenDashboard({ onBackHome }: { onBackHome: () => void }) {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'preparing' | 'onWay'>('pending');
  const [typeFilter, setTypeFilter] = useState<'all' | 'delivery' | 'takeaway' | 'dinein'>('all');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetting, setResetting] = useState(false);
  const previousOrdersLengthRef = useRef(0);
  const activePlaybackRef = useRef<HTMLAudioElement | null>(null);
  const [customAudioBase64, setCustomAudioBase64] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    const audioSettingRef = ref(db, 'settings/notificationSoundBase64');
    const unsub = onValue(audioSettingRef, (snap) => {
      if (snap.exists()) setCustomAudioBase64(snap.val());
      else setCustomAudioBase64(null);
    });
    return () => unsub();
  }, [isAdmin]);

  const stopAudio = () => {
    if (activePlaybackRef.current) {
      activePlaybackRef.current.pause();
      activePlaybackRef.current.currentTime = 0;
      activePlaybackRef.current = null;
    }
  };

  const playBeep = () => {
    stopAudio(); // Stop any currently ringing alarm before starting a new one
    if (customAudioBase64) {
      try {
        const audio = new Audio(customAudioBase64);
        activePlaybackRef.current = audio;
        audio.play().catch(e => console.error("Custom Audio playback error:", e));
        return;
      } catch (err) {
        console.error("Custom audio load failed, falling back to synth:", err);
      }
    }
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // First beep
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain1.gain.setValueAtTime(0.8, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc1.start(audioCtx.currentTime);
      osc1.stop(audioCtx.currentTime + 0.15);

      // Second beep
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1108.73, audioCtx.currentTime + 0.2); // C#6 note
      gain2.gain.setValueAtTime(0.8, audioCtx.currentTime + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc2.start(audioCtx.currentTime + 0.2);
      osc2.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.error("Audio API error:", e);
    }
  };

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
        if (soundEnabled && pendingOrders.length > previousOrdersLengthRef.current) {
          playBeep();
        }
        
        previousOrdersLengthRef.current = pendingOrders.length;
        setOrders(ordersArray);
      } else {
        setOrders([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Kitchen orders error:", error);
      toast.error(`Database error: ${error.message}. Check Realtime Database Rules.`);
      setOrders([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin, soundEnabled, customAudioBase64]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    stopAudio(); // Shut down the alarm when they accept an order
    try {
      await update(ref(db, `orders/${orderId}`), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error("Failed to update status:", e);
      toast.error("Failed to update order status. Check your permissions.");
    }
  };

  const enableSound = () => {
    setSoundEnabled(true);
    playBeep(); // Test beep so they know it works
  };

  const resetOrders = async () => {
    if (resetConfirmText !== 'RESET') return;
    setResetting(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');
      const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/orders/reset`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Server rejected request');
      toast.success('All orders cleared.');
      setShowResetModal(false);
      setResetConfirmText('');
    } catch (e) {
      console.error('Reset failed:', e);
      toast.error('Failed to reset orders.');
    } finally {
      setResetting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>;

  if (!isAdmin) return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
      <h1 className="text-2xl mb-4">Access Denied</h1>
      <button onClick={onBackHome} className="bg-red-500 px-6 py-2 rounded-xl text-white">Go Back</button>
    </div>
  );

  const onWayOrders = orders.filter(o => o.status === 'On Way' && (typeFilter === 'all' || o.orderType === typeFilter));
  const preparingOrders = orders.filter(o => o.status === 'Preparing' && (typeFilter === 'all' || o.orderType === typeFilter));
  const pendingOrders = orders.filter(o => o.status === 'Pending' && (typeFilter === 'all' || o.orderType === typeFilter));

  const getBadgesCount = (type: string) => orders.filter(o => o.status === 'Pending' && (type === 'all' || o.orderType === type)).length;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col font-sans">
      {/* Top Navigation */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-4">
          <button onClick={onBackHome} className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-black text-red-500">Kitchen Operations</h1>
        </div>

        <div className="flex items-center gap-3">
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
          {/* Settings Button */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 bg-gray-700 text-gray-300 hover:text-white rounded-xl transition-colors"
          >
            <Settings size={20} />
          </button>
          <button
            onClick={() => { setShowResetModal(true); setResetConfirmText(''); }}
            className="flex items-center gap-2 bg-red-600/20 border border-red-600 text-red-400 px-4 py-2 rounded-xl font-bold hover:bg-red-600/30 transition-colors text-sm"
          >
            🗑️ Reset Orders
          </button>
          <div className="bg-gray-700 px-4 py-2 rounded-xl font-bold text-gray-300">
            {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <button onClick={() => setShowSettingsModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                <X size={24} />
              </button>
              <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                <Settings size={24} className="text-blue-400" />
                Alert Settings
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Custom Notification Sound
                  </label>
                  <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                    Upload a short .mp3 or .wav file (max 500KB) to replace the default synth beep.
                  </p>
                  
                  <div className="relative border-2 border-dashed border-gray-600 rounded-xl p-8 hover:border-blue-500 hover:bg-gray-700/30 transition-all text-center cursor-pointer">
                    <input 
                      type="file" 
                      accept="audio/mp3, audio/wav, audio/ogg, audio/mpeg" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 500 * 1024) {
                          toast.error("File is too large! Please keep it under 500KB.");
                          return;
                        }
                        const reader = new FileReader();
                        setUploadingAudio(true);
                        reader.onloadend = async () => {
                          const base64String = reader.result as string;
                          try {
                            await update(ref(db, 'settings'), { notificationSoundBase64: base64String });
                            toast.success("Custom audio saved successfully!");
                          } catch (err) {
                            console.error("Save error:", err);
                            toast.error("Failed to save audio.");
                          } finally {
                            setUploadingAudio(false);
                            // Auto-play the newly uploaded sound as a preview!
                            try {
                                const tempAudio = new Audio(base64String);
                                tempAudio.play().catch(() => {});
                            } catch (e) {}
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      disabled={uploadingAudio}
                    />
                    <Upload size={32} className={`mx-auto mb-3 ${uploadingAudio ? 'text-gray-500 animate-bounce' : 'text-blue-400'}`} />
                    <span className="text-sm font-semibold text-gray-300">
                      {uploadingAudio ? 'Uploading & Processing...' : (customAudioBase64 ? 'Replace current custom sound' : 'Click to select audio file')}
                    </span>
                  </div>
                </div>

                {customAudioBase64 && (
                  <div className="flex justify-between items-center bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                     <span className="text-sm text-green-400 font-medium flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                       Custom Sound Active
                     </span>
                     <button 
                       onClick={async () => {
                          try {
                            await update(ref(db, 'settings'), { notificationSoundBase64: null });
                            toast.success("Reverted back to default synthetic beep.");
                          } catch (err) {
                            toast.error("Failed to revert sound.");
                          }
                       }}
                       className="text-xs bg-red-500/20 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-500/30 transition-colors font-bold"
                     >
                       Remove
                     </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Type Filter Navigation */}
      <div className="bg-gray-900 border-b border-gray-700 px-6 py-3 flex gap-3 overflow-x-auto">
        <button
          onClick={() => setTypeFilter('all')}
          className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors ${typeFilter === 'all' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
        >
          All Orders {getBadgesCount('all') > 0 && <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">{getBadgesCount('all')}</span>}
        </button>
        <button
          onClick={() => setTypeFilter('delivery')}
          className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors ${typeFilter === 'delivery' ? 'bg-[#1caa00]/20 text-[#1caa00] border border-[#1caa00]/30' : 'text-gray-400 hover:bg-gray-800'}`}
        >
          🛵 Delivery {getBadgesCount('delivery') > 0 && <span className="bg-[#1caa00] text-white px-2 py-0.5 rounded-full text-xs">{getBadgesCount('delivery')}</span>}
        </button>
        <button
          onClick={() => setTypeFilter('takeaway')}
          className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors ${typeFilter === 'takeaway' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 hover:bg-gray-800'}`}
        >
          📦 Takeaway {getBadgesCount('takeaway') > 0 && <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs">{getBadgesCount('takeaway')}</span>}
        </button>
        <button
          onClick={() => setTypeFilter('dinein')}
          className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors ${typeFilter === 'dinein' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'text-gray-400 hover:bg-gray-800'}`}
        >
          🍽️ Dine In {getBadgesCount('dinein') > 0 && <span className="bg-orange-500 text-white px-2 py-0.5 rounded-full text-xs">{getBadgesCount('dinein')}</span>}
        </button>
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

      {/* ── RESET ORDERS MODAL ── */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6">
          <div className="bg-gray-800 border border-gray-700 rounded-[24px] p-8 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">🗑️</span>
              </div>
              <div>
                <h3 className="text-[20px] font-black text-white">Reset All Orders</h3>
                <p className="text-[13px] text-gray-400">This cannot be undone.</p>
              </div>
            </div>
            <p className="text-[14px] text-gray-300 mb-5">
              This will permanently delete all <strong className="text-white">{orders.length} orders</strong> from the dashboard. Type <strong className="text-red-400">RESET</strong> to confirm.
            </p>
            <input
              type="text"
              value={resetConfirmText}
              onChange={e => setResetConfirmText(e.target.value)}
              placeholder='Type "RESET" to confirm'
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-[12px] text-[16px] text-white mb-5 focus:outline-none focus:border-red-500 placeholder-gray-500"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowResetModal(false); setResetConfirmText(''); }}
                className="flex-1 py-3 border-2 border-gray-600 rounded-[12px] font-bold text-gray-300 hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={resetOrders}
                disabled={resetConfirmText !== 'RESET' || resetting}
                className="flex-1 py-3 bg-red-600 text-white rounded-[12px] font-bold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {resetting ? 'Deleting...' : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}
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
          <div className="flex items-center gap-2 mb-1">
            <span className="text-gray-400 text-sm font-bold">#{order.orderNumber}</span>
            <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${
              order.orderType === 'takeaway' ? 'bg-blue-500/20 text-blue-400' :
              order.orderType === 'dinein' ? 'bg-orange-500/20 text-orange-400' :
              'bg-[#1caa00]/20 text-[#1caa00]'
            }`}>
              {order.orderType === 'takeaway' ? '📦 Takeaway' : order.orderType === 'dinein' ? '🍽️ Dine In' : '🛵 Delivery'}
            </span>
          </div>
          <h3 className="text-lg font-black text-white">{order.customerName}</h3>
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

      <div className="text-sm text-gray-400 space-y-2 bg-gray-900/30 p-3 rounded-lg border border-gray-700/50">
        <div className="flex justify-between items-center bg-gray-800 p-2 rounded-lg border border-gray-700">
          <span className="text-gray-400 font-medium">Phone:</span> 
          <span className="text-green-400 font-bold text-[16px] tracking-wider font-mono">{order.phone || "Not Provided"}</span>
        </div>
        {order.orderType === 'delivery' && (
          <p className="flex justify-between pt-1"><span className="text-gray-500">Address:</span> <span className="text-gray-300 text-right w-2/3 truncate">{order.address}</span></p>
        )}
        {order.orderType === 'takeaway' && (
          <p className="flex justify-between pt-1"><span className="text-gray-500">Pickup:</span> <span className="text-gray-300 font-bold">Takeaway / Collection</span></p>
        )}
        {order.orderType === 'dinein' && (
          <div className="flex justify-between items-center bg-orange-500/10 p-2 mt-1 rounded-lg border border-orange-500/20">
            <span className="text-orange-400 font-medium">Table Number:</span> 
            <span className="text-orange-400 font-black text-[18px] tracking-wider">{order.tableNumber || "N/A"}</span>
          </div>
        )}
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
