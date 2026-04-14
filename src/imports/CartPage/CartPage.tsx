import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, LogIn, ArrowLeft } from "lucide-react";
import LoginSignupModal from "../Auth/LoginSignupModal";
import { ref, get, update } from "firebase/database";
import { db } from "../../firebase";
import { toast } from "sonner";
import AddressAutocomplete from "./AddressAutocomplete";
import { calculateDistance } from "../../utils/distance";

// Ajman Restaurant coordinates
const RESTAURANT_LAT = 25.3908;
const RESTAURANT_LNG = 55.4859;

interface CartItem {
  name: string;
  nameAr?: string;
  description: string;
  price: string;
  quantity: number;
  image?: string;
  variant?: string;
}

interface OrderFormData {
  name: string;
  email: string;
  address: string;
  lat?: number;
  lng?: number;
  phone: string;
  notes: string;
}

function CartItemCard({ item, onRemove, onQuantityChange }: { item: CartItem & { id: string }; onRemove: () => void; onQuantityChange: (qty: number) => void }) {
  const priceNum = parseFloat(item.price.replace("AED ", ""));
  const total = (priceNum * item.quantity).toFixed(2);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-[22px] p-6 mb-4 shadow-sm border border-[#e0e0e0]"
    >
      <div className="flex gap-4 items-start">
        <div className="w-[100px] h-[80px] rounded-[16px] flex-shrink-0 overflow-hidden bg-gradient-to-br from-[var(--img-placeholder-from)] to-[var(--img-placeholder-to)]">
          {item.image ? (
            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="text-[18px] font-bold text-[#1c1c1a] mb-0.5">{item.name}</h3>
          {item.nameAr && (
            <p className="text-[13px] font-light text-[#727272] mb-0.5">{item.nameAr}</p>
          )}
          {item.variant && (
            <p className="text-[12px] font-semibold text-[var(--accent)] mb-1">{item.variant}</p>
          )}
          <p className="text-[12px] text-[#727272] mb-4">{item.description}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onQuantityChange(Math.max(1, item.quantity - 1))}
                className="w-6 h-6 rounded-full border border-[#d1d1d1] flex items-center justify-center text-[14px] hover:bg-[#f0f0f0] transition-colors"
              >
                −
              </button>
              <span className="text-[14px] font-medium w-4 text-center">{item.quantity}</span>
              <button
                onClick={() => onQuantityChange(item.quantity + 1)}
                className="w-6 h-6 rounded-full border border-[#d1d1d1] flex items-center justify-center text-[14px] hover:bg-[#f0f0f0] transition-colors"
              >
                +
              </button>
            </div>
            
            <div className="text-right">
              <p className="text-[16px] font-bold text-[#1caa00] mb-2">AED {total}</p>
              <button
                onClick={onRemove}
                className="text-[12px] text-[#d90429] hover:text-[#f51c27] font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function OrderForm({ isOpen, onClose, onSubmit, cartTotal }: { isOpen: boolean; onClose: () => void; onSubmit: (data: OrderFormData) => void; cartTotal: string }) {
  const { currentUser } = useAuth();
  
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState(20);
  const [distanceError, setDistanceError] = useState("");

  const [formData, setFormData] = useState<OrderFormData>({
    name: "",
    email: "",
    address: "",
    phone: "",
    notes: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clear form when modal opens, and auto-fill if user logged in
  useEffect(() => {
    if (isOpen) {
      // Fetch dynamic delivery radius from db
      get(ref(db, 'settings/deliveryRadiusKm')).then(snap => {
        if (snap.exists()) setDeliveryRadiusKm(snap.val());
      });

      if (currentUser) {
        get(ref(db, `users/${currentUser.uid}`)).then(snapshot => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            setFormData({ 
              name: currentUser.displayName || data.name || "", 
              email: currentUser.email || "",
              address: data.address || "", 
              lat: data.lat,
              lng: data.lng,
              phone: data.phone || "", 
              notes: "" 
            });
          } else {
             setFormData({ name: currentUser.displayName || "", email: currentUser.email || "", address: "", phone: "", notes: "" });
          }
        });
      } else {
        setFormData({ name: "", email: "", address: "", phone: "", notes: "" });
      }
      setErrors({});
      setDistanceError("");
      setIsSubmitting(false);
    }
  }, [isOpen, currentUser]);

  // Validation functions
  const validateName = (name: string): string => {
    if (!name.trim()) return "Name is required";
    if (name.trim().length < 2) return "Name must be at least 2 characters";
    if (!/^[a-zA-Z\s]+$/.test(name)) return "Name can only contain letters and spaces";
    return "";
  };

  const validateEmail = (email: string): string => {
    if (!email.trim()) return "";
    if (!/^\S+@\S+\.\S+$/.test(email)) return "Please enter a valid email address";
    return "";
  };

  const validateAddress = (address: string): string => {
    if (!address.trim()) return "Address is required";
    if (address.trim().length < 5) return "Address must be at least 5 characters";
    if (!formData.lat || !formData.lng) return "Please select a specific address from the dropdown suggestions";
    return "";
  };

  const validatePhone = (phone: string): string => {
    if (!phone.trim()) return "Phone number is required";
    // Only digits, 7-15 characters
    const phoneDigits = phone.replace(/\D/g, "");
    if (!phoneDigits) return "Please enter a phone number";
    if (!/^\d{7,15}$/.test(phoneDigits)) return "Phone must be 7-15 digits";
    return "";
  };

  const validateNotes = (notes: string): string => {
    if (notes.trim() && !/^[a-zA-Z0-9\s,.\-'!?()]+$/.test(notes)) {
      return "Notes can only contain letters, numbers, and basic punctuation";
    }
    return "";
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    const nameError = validateName(formData.name);
    if (nameError) newErrors.name = nameError;

    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    const addressError = validateAddress(formData.address);
    if (addressError) newErrors.address = addressError;

    const phoneError = validatePhone(formData.phone);
    if (phoneError) newErrors.phone = phoneError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, name: value });
    if (errors.name) setErrors({ ...errors, name: "" });
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, email: value });
    if (errors.email) setErrors({ ...errors, email: "" });
  };

  const handleAddressChange = (address: string, lat?: number, lng?: number) => {
    setDistanceError('');
    const newErrors = { ...errors };
    delete newErrors.address;
    setErrors(newErrors);
    
    setFormData((prev) => ({ ...prev, address, lat, lng }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Only allow digits
    value = value.replace(/\D/g, "");
    setFormData({ ...formData, phone: value });
    if (errors.phone) setErrors({ ...errors, phone: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (validateForm()) {
      if (formData.lat && formData.lng) {
        const distance = calculateDistance(RESTAURANT_LAT, RESTAURANT_LNG, formData.lat, formData.lng);
        if (distance > deliveryRadiusKm) {
          setDistanceError(`Sorry, this location is ${distance.toFixed(1)}km away. We only deliver within ${deliveryRadiusKm}km of our restaurant.`);
          return;
        }
      }

      setIsSubmitting(true);
      try {
        if (currentUser) {
          // Save these details as the user's default for next time
          await update(ref(db, `users/${currentUser.uid}`), {
            name: formData.name,
            address: formData.address,
            lat: formData.lat || null,
            lng: formData.lng || null,
            phone: formData.phone
          });
        }
        await onSubmit(formData);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[60]"
          />
          
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] z-[70] max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-center pt-4 pb-2">
              <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
            </div>

            <div className="px-6 pb-8">
              <h2 className="text-[28px] font-bold text-[#1c1c1a] mb-6">Order Details</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Field */}
                <div>
                  <label className="text-[14px] font-medium text-[#1c1c1a] mb-2 block">Full Name * <span className="text-[12px] text-[#727272]">(Letters only)</span></label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={handleNameChange}
                    onBlur={() => {
                      const error = validateName(formData.name);
                      if (error) setErrors({ ...errors, name: error });
                    }}
                    placeholder="John Doe"
                    className={`w-full px-4 py-3 border rounded-[22px] text-[14px] placeholder:text-[#ccc] focus:outline-none transition-colors ${
                      errors.name ? "border-[#d90429] focus:border-[#d90429]" : "border-[#d1d1d1] focus:border-[#f51c27]"
                    }`}
                  />
                  {errors.name && <p className="text-[12px] text-[#d90429] mt-1">{errors.name}</p>}
                </div>

                {/* Email Field */}
                <div>
                  <label className="text-[14px] font-medium text-[#1c1c1a] mb-2 block">Email Address <span className="text-[12px] text-[#727272]">(Optional)</span></label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={handleEmailChange}
                    onBlur={() => {
                      const error = validateEmail(formData.email);
                      if (error) setErrors({ ...errors, email: error });
                    }}
                    placeholder="you@email.com"
                    className={`w-full px-4 py-3 border rounded-[22px] text-[14px] placeholder:text-[#ccc] focus:outline-none transition-colors ${
                      errors.email ? "border-[#d90429] focus:border-[#d90429]" : "border-[#d1d1d1] focus:border-[#f51c27]"
                    }`}
                  />
                  {errors.email && <p className="text-[12px] text-[#d90429] mt-1">{errors.email}</p>}
                </div>

                {/* Address Field */}
                <div>
                  <label className="text-[14px] font-medium text-[#1c1c1a] mb-2 block">Delivery Address * <span className="text-[12px] text-[#727272]">(Search precisely)</span></label>
                  <AddressAutocomplete 
                    value={formData.address}
                    onChange={handleAddressChange}
                    error={errors.address}
                    onBlur={() => {
                      const error = validateAddress(formData.address);
                      if (error) setErrors((prev) => ({ ...prev, address: error }));
                    }}
                  />
                  {errors.address && <p className="text-[12px] text-[#d90429] mt-1">{errors.address}</p>}
                </div>

                {/* Phone Number Field */}
                <div>
                  <label className="text-[14px] font-medium text-[#1c1c1a] mb-2 block">Phone Number * <span className="text-[12px] text-[#727272]">(Numbers only, 7-15 digits)</span></label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    onBlur={() => {
                      const error = validatePhone(formData.phone);
                      if (error) setErrors({ ...errors, phone: error });
                    }}
                    placeholder="5012345678"
                    className={`w-full px-4 py-3 border rounded-[22px] text-[14px] placeholder:text-[#ccc] focus:outline-none transition-colors ${
                      errors.phone ? "border-[#d90429] focus:border-[#d90429]" : "border-[#d1d1d1] focus:border-[#f51c27]"
                    }`}
                  />
                  {errors.phone && <p className="text-[12px] text-[#d90429] mt-1">{errors.phone}</p>}
                </div>

                {/* Additional Notes Field */}
                <div>
                  <label className="text-[14px] font-medium text-[#1c1c1a] mb-2 block">Additional Notes <span className="text-[12px] text-[#727272]">(Optional)</span></label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, notes: value });
                      if (errors.notes) setErrors({ ...errors, notes: "" });
                    }}
                    onBlur={() => {
                      const error = validateNotes(formData.notes);
                      if (error) setErrors({ ...errors, notes: error });
                    }}
                    placeholder="Any special requests (letters and numbers only)..."
                    rows={3}
                    className={`w-full px-4 py-3 border rounded-[22px] text-[14px] placeholder:text-[#ccc] focus:outline-none resize-none transition-colors ${
                      errors.notes ? "border-[#d90429] focus:border-[#d90429]" : "border-[#d1d1d1] focus:border-[#f51c27]"
                    }`}
                  />
                  {errors.notes && <p className="text-[12px] text-[#d90429] mt-1">{errors.notes}</p>}
                </div>

                {/* Order Total / Error */}
                <div className="bg-[#fbf4e8] rounded-[22px] p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[16px] font-medium text-[#1c1c1a]">Total Amount:</span>
                    <span className="text-[24px] font-bold text-[#1caa00]">{cartTotal}</span>
                  </div>
                  {distanceError && (
                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mt-2 font-medium">
                      {distanceError}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || Object.values(errors).some(err => err.length > 0) || !formData.name.trim() || !formData.address.trim() || !!distanceError}
                  className="w-full bg-[rgba(157,157,157,0.26)] backdrop-blur-sm shadow-[0px_2px_9.7px_0px_rgba(0,0,0,0.25)] rounded-[35px] py-4 text-[18px] font-semibold text-[#f51c27] hover:bg-[rgba(157,157,157,0.35)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="w-5 h-5 animate-spin text-[#f51c27]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    "Confirm Order"
                  )}
                </button>
              </form>
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

function SuccessModal({ isOpen, total, onContinueShopping, onBackHome }: { isOpen: boolean; total: string; onContinueShopping?: () => void; onBackHome?: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60]"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-[70] px-4"
          >
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl"
            >
              {/* Success Icon */}
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                className="w-20 h-20 bg-[#1caa00] rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>

              {/* Success Message */}
              <h2 className="text-[32px] font-black text-[#1c1c1a] mb-3">Order Confirmed!</h2>
              
              <p className="text-[16px] text-[#727272] mb-8 leading-relaxed">
                Your order has been confirmed. We will deliver it soon.
              </p>

              {/* Order Total */}
              <div className="bg-[#fbf4e8] rounded-[22px] p-6 mb-8">
                <p className="text-[14px] text-[#727272] mb-2">Order Total</p>
                <p className="text-[36px] font-black text-[#1caa00]">{total}</p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onContinueShopping}
                  className="w-full bg-[rgba(157,157,157,0.26)] backdrop-blur-sm shadow-[0px_2px_9.7px_0px_rgba(0,0,0,0.25)] rounded-[35px] py-4 text-[16px] font-semibold text-[#f51c27] hover:bg-[rgba(157,157,157,0.35)] transition-all"
                >
                  Continue Shopping
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onBackHome}
                  className="w-full bg-[#fbf4e8] rounded-[35px] py-4 text-[16px] font-semibold text-[#727272] hover:bg-[#f0ebe0] transition-all"
                >
                  Back to Home
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function CartPage({ cartItems, onBackHome, onContinueShopping, onClearCart, onNavigateToProfile }: { cartItems: CartItem[]; onBackHome?: () => void; onContinueShopping?: () => void; onClearCart?: () => void; onNavigateToProfile?: () => void; }) {
  const { currentUser, isAdmin } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [items, setItems] = useState(cartItems);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [successTotal, setSuccessTotal] = useState("0");
  const [pendingCheckout, setPendingCheckout] = useState(false);

  useEffect(() => {
    if (pendingCheckout && currentUser && currentUser.phoneNumber) {
      setIsLoginModalOpen(false);
      setIsFormOpen(true);
      setPendingCheckout(false);
    }
  }, [currentUser, pendingCheckout]);

  const cartTotal = items
    .reduce((sum, item) => sum + parseFloat(item.price.replace("AED ", "")) * item.quantity, 0)
    .toFixed(2);

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const newItems = [...items];
    newItems[index].quantity = quantity;
    setItems(newItems);
  };

  const handleOrderSubmit = async (formData: OrderFormData) => {
    try {
      const isLocalhost = window.location.hostname === 'localhost';
      const defaultApi = isLocalhost ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;
      const apiUrl = import.meta.env.VITE_API_URL || defaultApi;
      
      const orderData = {
        customerName: formData.name,
        email: formData.email,
        address: formData.address,
        lat: formData.lat,
        lng: formData.lng,
        phone: formData.phone,
        notes: formData.notes,
        items: items.map(item => ({
          name: item.name,
          description: item.description,
          price: item.price,
          quantity: item.quantity,
        })),
        totalAmount: parseFloat(cartTotal.replace("AED ", "")),
        userId: currentUser?.uid,
      };

      const response = await fetch(`${apiUrl}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        // Attempt to parse server-provided error message
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to place order');
      }

      const result = await response.json();
      console.log("✅ Order placed successfully:", result);
      
      setSuccessTotal(cartTotal); // Save the total before clearing items
      setIsFormOpen(false);
      setIsSuccessOpen(true);
      setItems([]);
      
      // Clear cart from parent component
      if (onClearCart) {
        onClearCart();
      }
    } catch (error) {
      console.error("❌ Order error:", error);
      if (!window.navigator.onLine) {
        toast.error('You are offline. Please check your network connection and try again.');
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to place order. Our servers might be busy.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf4e8]">
      {/* Simple Sticky Header matching Profile Page */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 h-[70px] flex items-center">
          <button 
            onClick={onBackHome} 
            className="p-2 -ml-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="ml-4 text-lg font-bold text-gray-900">Your Cart</h1>
        </div>
      </div>

      <div className="w-full max-w-[1280px] flex flex-col relative z-10 px-2 lg:px-4">
      
      {!currentUser && (
        <div className="mx-4 mt-2 mb-4 bg-white p-4 rounded-2xl flex items-center justify-between border border-[#e0e0e0] shadow-sm max-w-2xl sm:mx-auto w-[calc(100%-2rem)]">
          <div>
            <h3 className="text-[14px] font-bold text-gray-900">Want faster checkout?</h3>
            <p className="text-[12px] text-gray-500">Log in to safely save your address and phone.</p>
          </div>
          <button 
            onClick={() => setIsLoginModalOpen(true)}
            className="px-4 py-2 bg-gray-900 text-white text-[12px] font-semibold rounded-xl hover:bg-gray-800 transition-colors"
          >
            Log In
          </button>
        </div>
      )}

      <div className="flex-1 px-4 max-w-2xl mx-auto w-full py-6">
        <h1 className="text-[40px] font-black text-[#1c1c1a] mb-8">Your Cart</h1>

        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-[20px] text-[#727272] mb-6">Your cart is empty</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onContinueShopping}
              className="bg-[rgba(157,157,157,0.26)] backdrop-blur-sm shadow-[0px_2px_9.7px_0px_rgba(0,0,0,0.25)] rounded-[35px] px-8 py-3 text-[16px] font-bold text-[#f51c27] hover:bg-[rgba(157,157,157,0.35)] transition-all"
            >
              Continue Shopping
            </motion.button>
          </motion.div>
        ) : (
          <>
            <div className="mb-8">
              {items.map((item, index) => (
                <CartItemCard
                  key={index}
                  item={{ ...item, id: index.toString() }}
                  onRemove={() => handleRemoveItem(index)}
                  onQuantityChange={(qty) => handleQuantityChange(index, qty)}
                />
              ))}
            </div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[22px] p-6 mb-8 border border-[#e0e0e0] shadow-sm"
            >
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-[14px]">
                  <span className="text-[#727272]">Subtotal</span>
                  <span className="text-[#1c1c1a] font-medium">AED {cartTotal}</span>
                </div>
                <div className="flex justify-between text-[14px]">
                  <span className="text-[#727272]">Delivery Fee</span>
                  <span className="text-[#1caa00] font-medium">Free</span>
                </div>
              </div>
              <div className="border-t border-[#e0e0e0] pt-4 flex justify-between">
                <span className="text-[18px] font-bold text-[#1c1c1a]">Total</span>
                <span className="text-[24px] font-bold text-[#1caa00]">AED {cartTotal}</span>
              </div>
            </motion.div>

            {/* Place Order Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (!currentUser || !currentUser.phoneNumber) {
                  setPendingCheckout(true);
                  setIsLoginModalOpen(true);
                } else {
                  setIsFormOpen(true);
                }
              }}
              className="w-full bg-[#f51c27] shadow-lg shadow-red-500/20 rounded-[35px] py-4 text-[18px] font-black text-white hover:bg-[#d90429] transition-all mb-4"
            >
              Place Order
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onContinueShopping}
              className="w-full border-2 border-[#d1d1d1] rounded-[35px] py-4 text-[18px] font-bold text-[#727272] hover:border-[#f51c27] transition-colors"
            >
              Continue Shopping
            </motion.button>
          </>
        )}
      </div>

      <OrderForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSubmit={handleOrderSubmit}
        cartTotal={`AED ${cartTotal}`}
      />

      <SuccessModal 
        isOpen={isSuccessOpen}
        total={`AED ${successTotal}`}
        onContinueShopping={() => {
          setIsSuccessOpen(false);
          onContinueShopping?.();
        }}
        onBackHome={() => {
          setIsSuccessOpen(false);
          onBackHome?.();
        }}
      />

      <LoginSignupModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />

      </div>
    </div>
  );
}
