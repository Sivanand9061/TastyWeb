import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { useAuth } from '../app/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export default function PwaInstallPrompt() {
  const { currentUser } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isPwa = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(!!isPwa);

    // Detect iOS
    const iosNode = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iosNode);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault(); // Prevent automatic prompt
      setDeferredPrompt(e);
      // We don't show it here immediately, because we wait for user login.
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    // Only show if: user is logged in, NOT already installed, and hasn't dismissed it this session
    if (currentUser && !isStandalone) {
      const hasDismissed = sessionStorage.getItem('pwa_prompt_dismissed');
      
      // If we have the Android/Chrome prompt ready, OR if it's iOS (which doesn't have the event natively)
      if ((deferredPrompt || isIOS) && !hasDismissed) {
        // slightly delay the popup so it doesn't fight with login UI instantly
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [currentUser, deferredPrompt, isStandalone, isIOS]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      // Just visually close it for iOS since we show manual instructions
      setShowPrompt(false);
    }
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  const handleClose = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-24 left-4 right-4 z-[999]"
        >
          <div className="bg-white rounded-[24px] shadow-[0_10px_40px_rgba(0,0,0,0.15)] p-5 border border-gray-100 flex items-start gap-4 mx-auto max-w-sm">
            
            <div className="w-14 h-14 shrink-0 rounded-[14px] overflow-hidden shadow-sm border border-gray-100 bg-[#f51c27] flex items-center justify-center">
              <Download size={24} className="text-white" strokeWidth={2.5} />
            </div>

            <div className="flex-1 pt-0.5">
              <h4 className="font-heading font-black text-gray-900 text-[16px] leading-tight mb-1">
                Install Tasty Hot App
              </h4>
              <p className="text-gray-500 text-[12px] leading-relaxed mb-3 pr-2">
                {isIOS 
                  ? "Tap the Share button below and select 'Add to Home Screen' for the best ordering experience."
                  : "Add our app to your home screen for quick access and faster ordering!"}
              </p>
              
              <div className="flex gap-2">
                {!isIOS && (
                  <button 
                    onClick={handleInstallClick}
                    className="bg-[#f51c27] text-white text-[12px] font-bold px-4 py-2 rounded-full hover:bg-black transition-colors"
                  >
                    Add App
                  </button>
                )}
                <button 
                  onClick={handleClose}
                  className="bg-gray-100 text-gray-600 text-[12px] font-bold px-4 py-2 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {isIOS ? "Okay, got it!" : "Not now"}
                </button>
              </div>
            </div>

            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-black absolute p-1"
            >
              <X size={16} strokeWidth={3} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
