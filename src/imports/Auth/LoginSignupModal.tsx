import React, { useState, useEffect, useRef } from 'react';
import { signInWithPhoneNumber, RecaptchaVerifier, signInWithEmailAndPassword } from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, db } from '../../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, Phone, KeyRound, Mail, Lock } from 'lucide-react';

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

const getFriendlyErrorMessage = (err: any): string => {
  if (!err) return "An unknown error occurred.";
  const code = err.code || err.message || "";
  
  if (code.includes('invalid-verification-code')) return "The code you entered is incorrect. Please try again.";
  if (code.includes('invalid-phone-number') || code.includes('missing-phone-number')) return "Please enter a valid phone number including country code (e.g. +971).";
  if (code.includes('too-many-requests')) return "Too many attempts. To protect your account, please try again later.";
  if (code.includes('network-request-failed')) return "Network error. Please check your internet connection.";
  if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')) return "Invalid email or password.";

  return err.message?.replace('Firebase: ', '') || "An error occurred. Please try again.";
};

interface LoginSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginSignupModal({ isOpen, onClose }: LoginSignupModalProps) {
  // Option toggle — hidden, activated by 5 rapid clicks on the modal title
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const headerClickCountRef = useRef(0);
  const headerClickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTitleSecretClick = () => {
    headerClickCountRef.current += 1;
    if (headerClickTimerRef.current) clearTimeout(headerClickTimerRef.current);
    headerClickTimerRef.current = setTimeout(() => {
      headerClickCountRef.current = 0;
    }, 1500);
    if (headerClickCountRef.current >= 5) {
      headerClickCountRef.current = 0;
      setIsAdminLogin(prev => !prev);
    }
  };

  // Phone state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  
  // Admin state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Reset state on close
    if (!isOpen) {
      setError('');
      setPhoneNumber('');
      setOtp('');
      setEmail('');
      setPassword('');
      setIsAdminLogin(false);
      setConfirmationResult(null);
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    }
  }, [isOpen]);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible'
      });
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      // Make sure phone starts with +
      const formattingNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      
      const confirmation = await signInWithPhoneNumber(auth, formattingNumber, appVerifier);
      setConfirmationResult(confirmation);
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err));
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    
    setError('');
    setLoading(true);

    try {
      const result = await confirmationResult.confirm(otp);
      
      // Check if user exists in DB to prevent overwriting roles
      const userRef = ref(db, `users/${result.user.uid}`);
      const snapshot = await get(userRef);
      
      if (!snapshot.exists()) {
        await set(userRef, {
          phone: result.user.phoneNumber,
          role: 'user',
          createdAt: new Date().toISOString()
        });
      }
      onClose();
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      onClose();
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden relative"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            <div className="p-8">
              <div className="text-center mb-8">
                <h2
                  className="text-2xl font-bold text-gray-900 mb-2 cursor-default select-none"
                  onClick={handleTitleSecretClick}
                  title=""
                >
                  {isAdminLogin ? 'Restaurant Login' : 'Verify Phone Number'}
                </h2>
                <p className="text-gray-500 text-sm">
                  {isAdminLogin ? 'Enter your staff credentials.' : "We'll send you a short code to verify your account securely."}
                </p>
              </div>

              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl text-center">
                  {error}
                </div>
              )}

              {/* Invisible Recaptcha */}
              <div id="recaptcha-container"></div>

              {isAdminLogin ? (
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#f51c27]/20 focus:border-[#f51c27] outline-none transition-all"
                        placeholder="admin@restaurant.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#f51c27]/20 focus:border-[#f51c27] outline-none transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#f51c27] text-white rounded-xl font-medium hover:bg-[#d90429] transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>Sign In</span>
                    )}
                    {!loading && <CheckCircle2 size={18} />}
                  </button>
                </form>
              ) : (
                <form onSubmit={confirmationResult ? handleVerifyOTP : handlePhoneSubmit} className="space-y-4">
                  {!confirmationResult ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                          type="tel" 
                          required
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#f51c27]/20 focus:border-[#f51c27] outline-none transition-all"
                          placeholder="+971501234567"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Include country code (e.g., +971 for UAE).</p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                          type="text" 
                          required
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#f51c27]/20 focus:border-[#f51c27] outline-none transition-all tracking-widest"
                          placeholder="000 000"
                        />
                      </div>
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={loading || (!confirmationResult && phoneNumber.length < 8)}
                    className="w-full py-3 bg-[#f51c27] text-white rounded-xl font-medium hover:bg-[#d90429] transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>{confirmationResult ? 'Verify Code' : 'Send Verification Code'}</span>
                    )}
                    {!loading && <CheckCircle2 size={18} />}
                  </button>
                  
                  {confirmationResult && (
                    <button 
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        setConfirmationResult(null);
                        setOtp('');
                        setError('');
                      }}
                      className="w-full mt-2 py-2 bg-transparent text-gray-500 text-sm hover:text-gray-700 transition-colors"
                    >
                      Use a different number
                    </button>
                  )}
                </form>
              )}

              {/* Admin mode indicator — only visible when already in admin mode */}
              {isAdminLogin && (
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => setIsAdminLogin(false)}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Return to customer login
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
