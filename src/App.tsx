/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { 
  Star, 
  MapPin, 
  ChevronLeft, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight,
  CheckCircle2,
  Clock,
  Phone,
  User,
  Search,
  Heart,
  Menu as MenuIcon
} from "lucide-react";
import { useState, useMemo, useEffect, useRef, Key, ChangeEvent } from "react";
import React from "react";
import { supabase } from "./lib/supabase";
import OwnerPanel from "./components/OwnerPanel";
import { 
  BrowserRouter, 
  Routes, 
  Route, 
  useNavigate, 
  useParams, 
  useSearchParams, 
  useLocation 
} from "react-router-dom";

// Types
interface Kitchen {
  id: string;
  slug: string;
  name: string;
  rating: number;
  deliveryTime: string;
  description: string;
  image: string;
  menu?: MenuItem[];
}

interface MenuItem {
  id: string;
  kitchen_id?: string;
  name: string;
  price: number;
  available: boolean;
  category: 'thali' | 'dry_sabji' | 'gravy_sabji' | 'others';
  thali_type?: 'normal' | 'special' | 'both';
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  options?: any;
}

interface Order {
  id: string;
  kitchen_id: string;
  customerName: string;
  customerPhone: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'preparing' | 'on-the-way' | 'delivered';
  time: string;
  timestamp: number; 
  address?: UserAddress;
}

interface UserProfile {
  id: string;
  phone: string;
  name: string;
}

interface UserAddress {
  id?: string;
  user_id?: string;
  apartment: string;
  area: string;
  landmark?: string;
}

// Mock Data
const KITCHENS: Kitchen[] = [
  { 
    id: '1', 
    slug: 'thaat-baat',
    name: "Thaat Baat", 
    rating: 4.6, 
    deliveryTime: "25-30 min",
    description: "Authentic Rajasthani Thalis & Desi Ghee preparations",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800",
    menu: [
      { id: 't1', name: "Normal Thali", price: 80, available: true, category: 'thali' },
      { id: 't2', name: "Special Thali", price: 120, available: true, category: 'thali' },
      
      // Dry Sabji Options
      { id: 'd1', name: "Aloo Gobi", price: 0, available: true, category: 'dry_sabji' },
      { id: 'd2', name: "Bhindi Masala", price: 0, available: true, category: 'dry_sabji' },
      { id: 'd3', name: "Mix Veg", price: 0, available: true, category: 'dry_sabji' },
      { id: 'd4', name: "Aloo Bhujiya", price: 0, available: false, category: 'dry_sabji' },
      
      // Gravy Sabji Options
      { id: 'g1', name: "Paneer Butter Masala", price: 0, available: true, category: 'gravy_sabji' },
      { id: 'g2', name: "Dal Fry", price: 0, available: true, category: 'gravy_sabji' },
      { id: 'g3', name: "Chole Masala", price: 0, available: true, category: 'gravy_sabji' },
      { id: 'g4', name: "Kadhi Pakoda", price: 0, available: false, category: 'gravy_sabji' },

      // Parathas & Others
      { id: 'p1', name: "Aloo Paratha", price: 30, available: true, category: 'others' },
      { id: 'p2', name: "Onion Paratha", price: 25, available: true, category: 'others' },
      { id: 'p3', name: "Plain Paratha", price: 15, available: true, category: 'others' },
      
      // Other Addons
      { id: 'a1', name: "Extra Roti", price: 7, available: true, category: 'others' },
      { id: 'a2', name: "Fresh Dahi", price: 20, available: true, category: 'others' },
    ]
  },
  { 
    id: '2', 
    slug: 'arab-kitchen',
    name: "Arab Kitchen", 
    rating: 4.3, 
    deliveryTime: "35-40 min",
    description: "Lebanese delights, Mandi & Middle Eastern platters",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800"
  },
  { 
    id: '3', 
    slug: 'guri-kripas',
    name: "Guri Kripas", 
    rating: 4.5, 
    deliveryTime: "20-25 min",
    description: "Piping hot Parathas & North Indian comfort food",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=800"
  }
];

const INITIAL_ORDERS: Order[] = [
  {
    id: '0001',
    kitchen_id: '1',
    customerName: 'Aman Deep',
    customerPhone: '+91 98888 77777',
    total: 167,
    status: 'pending',
    time: '12:45 PM',
    timestamp: Date.now(),
    items: [
      { id: 't1', name: 'Normal Thali', price: 80, quantity: 1, options: { gravy: 'Paneer', dry: 'Bhindi', extraRoti: 2 } },
      { id: 'a1', name: 'Extra Roti', price: 7, quantity: 1 }
    ]
  },
  {
    id: '0002',
    kitchen_id: '1',
    customerName: 'Rahul Sharma',
    customerPhone: '+91 70000 11111',
    total: 120,
    status: 'preparing',
    time: '01:15 PM',
    timestamp: Date.now(),
    items: [
      { id: 't2', name: 'Special Thali', price: 120, quantity: 1 }
    ]
  },
  {
    id: '0000',
    kitchen_id: '1',
    customerName: 'History Test',
    customerPhone: '+91 00000 00000',
    total: 150,
    status: 'delivered',
    time: 'Yesterday',
    timestamp: Date.now() - (36 * 60 * 60 * 1000), 
    items: [{ id: 't1', name: 'Normal Thali', price: 80, quantity: 2 }]
  },
  {
    id: 'X001',
    kitchen_id: '1',
    customerName: 'Old Order',
    customerPhone: '+91 00000 00000',
    total: 200,
    status: 'delivered',
    time: '3 Days Ago',
    timestamp: Date.now() - (4 * 24 * 60 * 60 * 1000), 
    items: [{ id: 't1', name: 'Special Thali', price: 100, quantity: 2 }]
  }
];

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppContent />
    </BrowserRouter>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Reset window scroll
    window.scrollTo(0, 0);
    // Reset mobile frame internal scrollables
    const scrollables = document.querySelectorAll('.overflow-y-auto');
    scrollables.forEach(el => {
      el.scrollTo(0, 0);
    });
  }, [pathname]);

  return null;
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'AUTH' | 'OTP' | 'NAME' | 'ADDRESS' | 'SUMMARY'>('AUTH');
  const [userAddress, setUserAddress] = useState<UserAddress | null>(null);
  const [tempAddress, setTempAddress] = useState<UserAddress>({ building: '', area: 'Law Gate' });
  const [orderSummary, setOrderSummary] = useState<CartItem[]>([]);
  const [activeKitchenId, setActiveKitchenId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [phone, setPhone] = useState('');
  const [userName, setUserName] = useState('');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [authError, setAuthError] = useState('');
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);

  // Fetch kitchens globally
  useEffect(() => {
    fetchKitchens();
  }, []);

  const fetchKitchens = async () => {
    try {
      const { data, error } = await supabase
        .from('kitchens')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      
      if (data) {
        const now = new Date();
        // Filter in-memory if the column exists, otherwise just show active ones
        const filteredData = data.filter(k => {
          if (!k.subscription_expires_at) return true;
          return new Date(k.subscription_expires_at) > now;
        });

        setKitchens(filteredData.map(k => ({
          id: k.id,
          slug: k.slug,
          name: k.name,
          rating: k.rating,
          deliveryTime: k.delivery_time,
          description: k.description,
          image: k.image_url
        })));
      }
    } catch (err) {
      console.error('Failed to load kitchens:', err);
    }
  };

  // Security: Rate limiting & Expiry
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [lastOtpRequestAt, setLastOtpRequestAt] = useState(0);
  const [otpExpiry, setOtpExpiry] = useState(0);

  // Load session on mount
  useEffect(() => {
    const checkSession = async () => {
      const savedPhone = localStorage.getItem('stuva_auth_phone');
      if (savedPhone) {
        setPhone(savedPhone);
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('phone', savedPhone)
          .single();
        
        if (userData) {
          setCurrentUser(userData);
          setIsLoggedIn(true);
          setIsReturningUser(true);
          
          // Fetch address
          const { data: addrData } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', userData.id)
            .order('id', { ascending: false })
            .limit(1)
            .single();
          
          if (addrData) {
            setUserAddress({
              apartment: addrData.apartment,
              area: addrData.area
            });
          }
        }
      }
    };
    checkSession();
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto focus next
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleCheckoutClick = (kitchenId?: string) => {
    setAuthError('');
    if (kitchenId) setActiveKitchenId(kitchenId);
    
    if (isLoggedIn) {
      setCheckoutStep('SUMMARY');
      setShowCheckout(true);
    } else {
      setCheckoutStep('AUTH');
      setShowCheckout(true);
    }
  };

  const proceedToOtp = () => {
    if (phone.length !== 10) {
      setAuthError('Please enter a valid 10-digit number');
      return;
    }
    
    // Rate limiting check
    const now = Date.now();
    if (now - lastOtpRequestAt < 60000 && otpAttempts >= 3) {
      setAuthError('Too many requests. Please wait a minute.');
      return;
    }

    setOtpAttempts(prev => prev + 1);
    setLastOtpRequestAt(now);
    setOtpExpiry(now + 300000); // 5 minutes validity
    setAuthError('');
    setCheckoutStep('OTP');
  };

  const confirmLoginAndOrder = async () => {
    const enteredOtp = otp.join('');
    
    // Fake OTP validation
    if (enteredOtp !== '1234') {
      setAuthError('Invalid OTP. Please try 1234 for demo.');
      return;
    }

    if (Date.now() > otpExpiry) {
      setAuthError('OTP expired. Please request a new one.');
      return;
    }

    setIsProcessing(true);
    setAuthError('');

    try {
      // Check if user exists in Supabase
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phone)
        .maybeSingle();

      if (userData) {
        setCurrentUser(userData);
        setIsLoggedIn(true);
        setIsReturningUser(true);
        localStorage.setItem('stuva_auth_phone', phone);
        
        // Fetch existing address
        const { data: addrData } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', userData.id)
          .order('id', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (addrData) {
          setUserAddress({
            apartment: addrData.apartment,
            area: addrData.area
          });
          setCheckoutStep('SUMMARY');
        } else {
          setCheckoutStep('ADDRESS');
        }
      } else {
        // New user
        setCheckoutStep('NAME');
      }
    } catch (err) {
      setAuthError('Authentication failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const saveNameAndContinue = async () => {
    if (!userName.trim()) return;
    
    setIsProcessing(true);
    try {
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([{ phone, name: userName }])
        .select()
        .single();

      if (newUser) {
        setCurrentUser(newUser);
        setIsLoggedIn(true);
        localStorage.setItem('stuva_auth_phone', phone);
        setCheckoutStep('ADDRESS');
      }
    } catch (err) {
      setAuthError('Failed to save name.');
    } finally {
      setIsProcessing(false);
    }
  };

  const saveAddressAndContinue = async () => {
    if (!tempAddress.apartment || !currentUser) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('addresses')
        .insert([{
          user_id: currentUser.id,
          apartment: tempAddress.apartment,
          area: tempAddress.area
        }]);

      if (!error) {
        setUserAddress(tempAddress);
        setCheckoutStep('SUMMARY');
      }
    } catch (err) {
      setAuthError('Failed to save address.');
    } finally {
      setIsProcessing(false);
    }
  };

  const editAddress = () => {
    if (userAddress) {
      setTempAddress(userAddress);
    }
    setCheckoutStep('ADDRESS');
  };

  const finalPlaceOrder = async () => {
    if (!activeKitchenId || !currentUser) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('orders')
        .insert([{
          kitchen_id: activeKitchenId,
          customer_name: currentUser.name,
          customer_phone: currentUser.phone,
          total: cartTotal,
          items: cart,
          status: 'pending',
          address: userAddress
        }]);

      if (error) throw error;

      setOrderSummary([...cart]);
      setCart([]);
      setShowCheckout(false);
      navigate('/success');
    } catch (err) {
      setAuthError('Failed to place order.');
    } finally {
      setIsProcessing(false);
    }
  };

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i);
      }
      return [...prev, item];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      return prev.map(i => {
        if (i.id === id) {
          const newQty = Math.max(0, i.quantity + delta);
          return { ...i, quantity: newQty };
        }
        return i;
      }).filter(i => i.quantity > 0);
    });
  };

  const cartTotal = useMemo(() => cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0), [cart]);

  const handleCheckoutPhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    e.target.value = val;
    setPhone(val);
  };

  if (location.pathname.startsWith('/owner')) {
    return <OwnerPanel />;
  }

  return (
    <div className="min-h-screen sm:bg-gray-200 flex justify-center items-center">
      {/* Mobile Frame */}
      <div className="w-full h-screen bg-white relative overflow-hidden flex flex-col sm:w-[375px] sm:rounded-[40px] sm:border-[8px] sm:border-ink sm:shadow-2xl sm:my-0">
        
        <AnimatePresence mode="wait">
          <motion.div 
            key={location.pathname}
            className={`flex-1 flex flex-col ${location.pathname === '/admin' ? 'overflow-y-auto' : 'overflow-hidden'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Routes location={location}>
              <Route path="/" element={<HomeScreen isLoggedIn={isLoggedIn} kitchens={kitchens} />} />
              <Route path="/admin" element={<AdminScreen />} />
                <Route 
                  path="/kitchen/:slug" 
                  element={
                    <MenuScreen 
                      kitchens={kitchens}
                      onAddToCart={addToCart}
                      cart={cart}
                      updateQuantity={updateQuantity}
                      onCheckout={(kitchenId) => handleCheckoutClick(kitchenId)}
                      isLoggedIn={isLoggedIn}
                    />
                  } 
                />
              <Route path="/success" element={<SuccessScreen summary={orderSummary} />} />
            </Routes>
          </motion.div>
        </AnimatePresence>

      {/* Login & Checkout Bottom Sheet */}
      <AnimatePresence>
        {showCheckout && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCheckout(false)}
              className="absolute inset-0 bg-black/60 z-[110]"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-sheet z-[120] p-6 pt-2 shadow-2xl"
            >
              <div className="sheet-handle mb-6" />
              
              <AnimatePresence mode="wait">
                {checkoutStep === 'AUTH' ? (
                  <motion.div 
                    key="auth-step"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-2xl font-display text-secondary">Join STUVA</h2>
                      <p className="text-slate-400 font-bold text-sm">Verify your number to place order</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 px-1">Phone Number</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-primary">+91</span>
                          <input 
                            type="tel" 
                            maxLength={10}
                            value={phone}
                            onChange={handleCheckoutPhoneChange}
                            placeholder="9060557296" 
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-4 focus:ring-2 focus:ring-primary/20 text-sm font-bold outline-none"
                          />
                        </div>
                      </div>

                      {authError && <p className="text-xs font-bold text-red-500 px-1">{authError}</p>}
                    </div>

                    <button 
                      onClick={proceedToOtp}
                      className="w-full funky-btn-primary h-14 flex items-center justify-center gap-2"
                    >
                      Send OTP
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </motion.div>
                ) : checkoutStep === 'OTP' ? (
                  <motion.div 
                    key="otp-step"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-2xl font-display text-secondary">Verification</h2>
                      <p className="text-slate-400 font-bold text-sm">Use demo code: <span className="text-primary font-black">1234</span></p>
                    </div>

                    <div className="flex gap-3 justify-center py-4">
                      {otp.map((digit, i) => (
                          <input 
                            key={i}
                            id={`otp-${i}`}
                            type="tel"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(e.target.value, i)}
                            onKeyDown={(e) => handleOtpKeyDown(e, i)}
                            className="w-14 h-16 bg-slate-50 border-2 border-slate-100 rounded-2xl text-center font-display text-2xl text-primary focus:border-primary focus:bg-white outline-none transition-all"
                            placeholder="-"
                          />
                      ))}
                    </div>

                    {authError && <p className="text-center text-xs font-bold text-red-500">{authError}</p>}

                    <div className="text-center">
                      <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">
                        Resend Code in 00:29
                      </button>
                    </div>

                    <button 
                      onClick={confirmLoginAndOrder}
                      disabled={isProcessing}
                      className="w-full funky-btn-secondary h-14 flex items-center justify-center gap-2"
                    >
                      {isProcessing ? 'Verifying...' : 'Verify OTP'}
                      {!isProcessing && <ShoppingBag className="w-5 h-5" />}
                    </button>
                  </motion.div>
                ) : checkoutStep === 'NAME' ? (
                  <motion.div 
                    key="name-step"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-2xl font-display text-secondary">Welcome!</h2>
                      <p className="text-slate-400 font-bold text-sm">Tell us your name to get started</p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 px-1">Full Name</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                          <input 
                            autoFocus
                            type="text" 
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            placeholder="Enter your name" 
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 text-sm font-bold outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={saveNameAndContinue}
                      disabled={!userName.trim() || isProcessing}
                      className="w-full funky-btn-primary h-14"
                    >
                      {isProcessing ? 'Saving...' : 'Next'}
                    </button>
                  </motion.div>
                ) : checkoutStep === 'ADDRESS' ? (
                  <motion.div 
                    key="address-step"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-2xl font-display text-secondary">Delivery Address</h2>
                      <p className="text-slate-400 font-bold text-sm">Where should we bring your food?</p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 px-1">Building / Hostel Name & Landmark</label>
                        <input 
                          autoFocus
                          type="text" 
                          value={tempAddress.apartment}
                          onChange={(e) => setTempAddress({ ...tempAddress, apartment: e.target.value })}
                          placeholder="e.g. Fragnance appartment, near red apple tower" 
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 focus:ring-2 focus:ring-primary/20 text-sm font-bold outline-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 px-1">Select Area</label>
                        <div className="flex flex-wrap gap-2">
                          {['Law Gate', 'Green Valley', 'Bhutani Colony', 'Other'].map(area => (
                            <button 
                              key={area}
                              onClick={() => setTempAddress({ ...tempAddress, area })}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${tempAddress.area === area ? 'bg-secondary text-white border-secondary shadow-md' : 'bg-white text-slate-400 border-slate-50 hover:bg-slate-50'}`}
                            >
                              {area}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={saveAddressAndContinue}
                      disabled={!tempAddress.apartment || isProcessing}
                      className="w-full funky-btn-primary h-14 disabled:opacity-50 disabled:grayscale"
                    >
                      {isProcessing ? 'Saving...' : 'Save & Continue'}
                    </button>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="summary-step"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-2xl font-display text-secondary">Checkout</h2>
                      <p className="text-slate-400 font-bold text-sm">Review your order details</p>
                    </div>

                    <div className="bg-primary/5 rounded-[32px] p-6 border-2 border-primary/20 space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest mb-1">Deliver to</p>
                          <p className="text-sm font-bold text-secondary leading-tight">{userAddress?.apartment}</p>
                          <p className="text-[12px] font-bold text-slate-400 mt-0.5">{userAddress?.area}</p>
                        </div>
                        <button 
                          onClick={editAddress}
                          className="px-3 py-1.5 bg-white text-[10px] font-black text-primary rounded-xl shadow-sm active:scale-95 transition-transform"
                        >
                          EDIT
                        </button>
                      </div>

                      <div className="pt-4 border-t-2 border-dashed border-primary/10 flex justify-between items-center">
                        <div>
                          <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest mb-1">Pay on Delivery</p>
                          <p className="text-lg font-display text-secondary">{cart.length} Items</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-display text-primary">₹{cartTotal}</p>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={finalPlaceOrder}
                      className="w-full funky-btn-secondary h-16 text-lg flex items-center justify-center gap-2 group"
                    >
                      Place Order
                      <ShoppingBag className="w-6 h-6 animate-bounce" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
                <div className="h-4" />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- Mini Search Bar ---
function SearchBar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      searchParams.set('q', val);
    } else {
      searchParams.delete('q');
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="px-6 mb-6">
      <div className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-secondary/30 group-focus-within:text-primary transition-colors" />
        </div>
        <input 
          type="text" 
          value={query}
          onChange={handleSearch}
          placeholder="What do you want eat?" 
          className="w-full bg-slate-100/50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-[20px] py-4 pl-12 pr-4 text-sm font-medium transition-all outline-none text-ink placeholder:text-slate-400"
        />
      </div>
    </div>
  );
}

// --- Home Screen ---
function HomeScreen({ isLoggedIn, kitchens }: { isLoggedIn: boolean, kitchens: Kitchen[] }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q')?.toLowerCase() || '';

  const filteredKitchens = kitchens.filter(k => {
    const matchesQuery = !query || k.name.toLowerCase().includes(query) || k.description.toLowerCase().includes(query);
    return matchesQuery;
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 overflow-y-auto no-scrollbar bg-bg-app"
    >
      {!isLoggedIn ? (
        // Guest Home View (Clean, Reverted Header)
        <div className="space-y-6 pt-0">
          <header className="px-6 py-8 flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <MapPin className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Delivering to</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-display text-lg text-secondary">Law Gate near LPU</span>
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              </div>
            </div>

            <button 
              onClick={() => navigate('/admin')}
              className="w-12 h-12 bg-white shadow-xl shadow-ink/5 rounded-2xl flex items-center justify-center border border-slate-50 active:scale-90 transition-transform"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
            </button>
          </header>

          <div className="px-6 space-y-2 mb-2">
            <h1 className="font-display text-4xl text-secondary leading-tight">
              Homemade magic, <br />
              delivered to <span className="text-primary underline decoration-wavy underline-offset-8">you.</span>
            </h1>
            <p className="text-slate-400 font-bold text-sm">Authentic kitchens from your neighborhood.</p>
          </div>

          <SearchBar />

          <section className="space-y-4">
            <div className="px-6">
              <h2 className="font-display text-2xl text-secondary">Explore Kitchens</h2>
            </div>
            <div className="px-6 grid grid-cols-2 gap-4 pb-12">
              {filteredKitchens.length > 0 ? (
                filteredKitchens.map(kitchen => (
                  <KitchenCard 
                    key={kitchen.id} 
                    kitchen={kitchen} 
                    onClick={() => navigate(`/kitchen/${kitchen.slug}`)} 
                  />
                ))
              ) : (
                <div className="col-span-2 py-10 text-center opacity-50 font-bold">No kitchens found...</div>
              )}
            </div>
          </section>
        </div>
      ) : (
        // Logged-in Home View (Current perfect UI)
        <div className="space-y-0">
          <header className="px-6 pt-8 pb-4 flex justify-between items-start">
            <div>
              <h1 className="text-secondary font-display text-4xl leading-none">Hi, Zesan</h1>
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin className="w-4 h-4 text-primary" strokeWidth={3} />
                <span className="text-[12px] font-bold text-slate-400 uppercase tracking-tight">Law Gate near LPU</span>
              </div>
            </div>
            <div 
              onClick={() => navigate('/admin')}
              className="w-12 h-12 rounded-2xl bg-white border-2 border-primary/20 p-1 shadow-sm cursor-pointer active:scale-95 transition-transform"
            >
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" className="w-full h-full rounded-xl" alt="profile" />
            </div>
          </header>

          <SearchBar />

          <main className="px-6 space-y-8 pb-12">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl text-secondary">
                  Top Kitchens
                </h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {filteredKitchens.length > 0 ? (
                  filteredKitchens.map(kitchen => (
                    <KitchenCard key={kitchen.id} kitchen={kitchen} onClick={() => navigate(`/kitchen/${kitchen.slug}`)} />
                  ))
                ) : (
                  <div className="col-span-2 py-10 text-center opacity-50 font-bold">No kitchens found...</div>
                )}
              </div>
            </section>
          </main>
        </div>
      )}
    </motion.div>
  );
}

// --- Kitchen Card ---
function KitchenCard({ kitchen, onClick }: { kitchen: Kitchen, onClick: () => void, key?: any }) {
  return (
    <motion.div 
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="funky-card overflow-hidden flex flex-col group cursor-pointer"
    >
      <div className="relative h-40 overflow-hidden">
        <img 
          src={kitchen.image} 
          alt={kitchen.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
      </div>
      
      <div className="flex-1 flex flex-col">
        <div className="p-3 flex-1 pb-4">
          <h3 className="font-display text-[15px] text-primary group-hover:text-ink transition-colors leading-tight">{kitchen.name}</h3>
          <p className="text-[10px] text-slate-400 font-medium mt-1 line-clamp-1">{kitchen.description}</p>
        </div>
      </div>
    </motion.div>
  );
}

// --- Menu Screen ---
function MenuScreen({ 
  kitchens,
  onAddToCart, 
  cart, 
  updateQuantity,
  onCheckout,
  isLoggedIn
}: { 
  kitchens: Kitchen[];
  onAddToCart: (item: CartItem) => void;
  cart: CartItem[];
  updateQuantity: (id: string, delta: number) => void;
  onCheckout: (kitchenId: string) => void;
  isLoggedIn: boolean;
}) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const kitchen = useMemo(() => kitchens.find(k => k.slug === slug), [slug, kitchens]);
  const [isSticky, setIsSticky] = useState(false);
  const [localMenu, setLocalMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (kitchen) {
      fetchMenu();
    }
  }, [kitchen]);

  const fetchMenu = async () => {
    if (!kitchen) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('kitchen_id', kitchen.id);
      
      if (error) throw error;
      if (data) {
        setLocalMenu(data.map(m => ({
          id: m.id,
          name: m.name,
          price: Number(m.price),
          available: m.available,
          category: m.category,
          thali_type: m.thali_type
        })));
      }
    } catch (err) {
      console.error('Error loading menu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleScroll = (e: any) => {
      setIsSticky(e.target.scrollTop > 200);
    };
    const div = document.getElementById('menu-scroll-container');
    div?.addEventListener('scroll', handleScroll);
    return () => div?.removeEventListener('scroll', handleScroll);
  }, []);

  const cartTotal = useMemo(() => cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((acc, curr) => acc + curr.quantity, 0), [cart]);

  if (!kitchen) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-bg-app">
        <h2 className="font-display text-2xl text-secondary">Kitchen not found</h2>
        <button onClick={() => navigate('/')} className="mt-4 text-primary font-bold">Back to Home</button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      id="menu-scroll-container"
      className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col bg-bg-app"
    >
      {/* Dynamic Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4 flex items-center justify-between ${isSticky ? 'bg-white shadow-md' : 'bg-transparent'}`}>
        <button onClick={() => navigate('/')} className="p-2 bg-white shadow-xl rounded-full text-secondary active:scale-90 transition-transform border border-slate-100">
          <ChevronLeft className="w-6 h-6" />
        </button>
        {isSticky && (
          <motion.h2 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="font-display text-primary uppercase text-lg"
          >
            {kitchen.name}
          </motion.h2>
        )}
        <div className="w-10" /> {/* Spacer instead of Heart */}
      </header>

      {/* Hero Section */}
      <div className="relative h-[45vh] flex-shrink-0">
        <img 
          src={kitchen.image} 
          alt={kitchen.name} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-app via-transparent to-black/10" />
      </div>

      <div className="px-6 -mt-16 relative z-10 space-y-8 pb-32">
        <div className="bg-white p-6 rounded-[32px] shadow-xl shadow-ink/5 space-y-2 border-b-4 border-slate-100">
          <h1 className="st-title text-3xl">{kitchen.name}</h1>
          <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
            {kitchen.description}
          </p>
        </div>

        {/* Section: Menu Items */}
        <div className="space-y-6">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest px-1">Menu</p>
            <h2 className="font-display text-2xl text-secondary">Our Specialties</h2>
          </div>
          
          <div className="space-y-4">
            <ThaliCard 
              type="Normal"
              price={localMenu.find(i => i.name.toLowerCase().trim() === 'normal thali')?.price || 70} 
              description="3 Roti, 1 Dry Sabji, 1 Gravy Sabji, Rice"
              dryOptions={localMenu.filter(i => i.category === 'dry_sabji' && i.available && (i.thali_type === 'normal' || i.thali_type === 'both')).map(i => i.name) || []}
              gravyOptions={localMenu.filter(i => i.category === 'gravy_sabji' && i.available && (i.thali_type === 'normal' || i.thali_type === 'both')).map(i => i.name) || []}
              onAdd={(item) => onAddToCart(item)}
            />
            <ThaliCard 
              type="Special"
              price={localMenu.find(i => i.name.toLowerCase().trim() === 'special thali')?.price || 80} 
              description="3 Roti, 1 Dry Sabji, 1 Gravy Sabji, Rice, Extra Item"
              dryOptions={localMenu.filter(i => i.category === 'dry_sabji' && i.available && (i.thali_type === 'special' || i.thali_type === 'both')).map(i => i.name) || []}
              gravyOptions={localMenu.filter(i => i.category === 'gravy_sabji' && i.available && (i.thali_type === 'special' || i.thali_type === 'both')).map(i => i.name) || []}
              onAdd={(item) => onAddToCart(item)}
            />
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="font-display text-xl text-secondary px-1">More Goodies</h3>
            <div className="space-y-3">
              {localMenu.filter(i => i.category === 'others' && i.available).map(item => (
                <AddOnItem key={item.id} name={item.name} price={item.price} onAdd={(item) => onAddToCart(item)} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cart Bar */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div 
            initial={{ y: 100, scale: 0.9, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 100, scale: 0.9, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[340px] z-[100]"
          >
            <button 
              onClick={onCheckout}
              className="w-full cart-bar-style group active:scale-95 transition-all active:rotate-1"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/20 border border-white/20 rounded-xl flex items-center justify-center font-display text-lg text-white">
                  {cartCount}
                </div>
                <div className="font-display text-lg tracking-wider">₹{cartTotal}</div>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                {!isLoggedIn && (
                  <span className="text-[8px] font-black text-white/50 uppercase tracking-tighter mr-1">
                    Login required to place order
                  </span>
                )}
                <div className="flex items-center gap-1 font-display text-md uppercase tracking-widest text-primary">
                  GO!
                  <span className="text-2xl leading-none">›</span>
                </div>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- Updated Thali Card ---
function ThaliCard({ 
  type, 
  price, 
  description,
  dryOptions,
  gravyOptions,
  onAdd 
}: { 
  type: 'Normal' | 'Special';
  price: number; 
  description: string;
  dryOptions: string[];
  gravyOptions: string[];
  onAdd: (item: CartItem) => void 
}) {
  const [withRice, setWithRice] = useState(true);
  const [drySabji, setDrySabji] = useState(dryOptions[0] || 'Aloo Gobi');
  const [gravySabji, setGravySabji] = useState(gravyOptions[0] || 'Paneer');

  useEffect(() => {
    if (dryOptions.length > 0 && !dryOptions.includes(drySabji)) setDrySabji(dryOptions[0]);
    if (gravyOptions.length > 0 && !gravyOptions.includes(gravySabji)) setGravySabji(gravyOptions[0]);
  }, [dryOptions, gravyOptions]);

  const totalPrice = price;
  const rotiCount = withRice ? 3 : 5;

  return (
    <div className="funky-card p-6 space-y-6 relative border-b-8 border-primary/5">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-display text-2xl text-secondary">{type} Thali</h3>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight mb-2">{description}</p>
          <div className="flex items-center gap-2">
            <span className="font-display text-primary text-xl">₹{totalPrice}</span>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
              {rotiCount} Roti {withRice && "+ Rice"}
            </span>
          </div>
        </div>
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
          <ShoppingBag className="w-6 h-6 text-primary" />
        </div>
      </div>

      <div className="space-y-5">
        {/* Rice Toggle */}
        <div className="space-y-2">
          <span className="text-[10px] font-black text-secondary tracking-widest uppercase opacity-40 px-1">Base</span>
          <div className="segmented-control">
             <button 
               onClick={() => setWithRice(true)} 
               className={`segmented-item ${withRice ? 'segmented-item-active' : 'segmented-item-inactive'}`}
             >
               WITH RICE
             </button>
             <button 
               onClick={() => setWithRice(false)} 
               className={`segmented-item ${!withRice ? 'segmented-item-active' : 'segmented-item-inactive'}`}
             >
               NO RICE (+2 Roti)
             </button>
          </div>
        </div>

        {/* Dry Sabji */}
        <div className="space-y-2">
           <span className="text-[10px] font-black text-secondary tracking-widest uppercase opacity-40 px-1">Dry Sabji</span>
           <div className="flex flex-wrap gap-2">
             {dryOptions.map(s => (
               <button 
                 key={s} 
                 onClick={() => setDrySabji(s)}
                 className={`px-4 py-2 rounded-xl text-[12px] font-bold transition-all ${drySabji === s ? 'bg-primary text-white shadow-md' : 'bg-white border border-slate-100 text-slate-400 hover:bg-slate-50'}`}
               >
                 {s}
               </button>
             ))}
           </div>
        </div>

        {/* Gravy Sabji */}
        <div className="space-y-2">
           <span className="text-[10px] font-black text-secondary tracking-widest uppercase opacity-40 px-1">Gravy Sabji</span>
           <div className="flex flex-wrap gap-2">
             {gravyOptions.map(s => (
               <button 
                 key={s} 
                 onClick={() => setGravySabji(s)}
                 className={`px-4 py-2 rounded-xl text-[12px] font-bold transition-all ${gravySabji === s ? 'bg-secondary text-white shadow-md' : 'bg-white border border-slate-100 text-slate-400 hover:bg-slate-50'}`}
               >
                 {s}
               </button>
             ))}
           </div>
        </div>

        <button 
          onClick={() => onAdd({ 
            id: `${type.toLowerCase()}-thali-${Date.now()}`, 
            name: `${type} Thali`, 
            price: totalPrice, 
            quantity: 1, 
            options: { withRice, drySabji, gravySabji } 
          })}
          className="w-full funky-btn-secondary py-4"
        >
          Add to Bag
        </button>
      </div>
    </div>
  );
}

// --- Add-on Item ---
function AddOnItem({ 
  name, 
  price, 
  onAdd 
}: { 
  name: string; 
  price: number; 
  onAdd: (item: CartItem) => void;
  key?: React.Key;
}) {
  return (
    <div className="funky-card p-4 flex items-center justify-between border-b-4 border-slate-50">
      <div className="flex flex-col">
        <span className="font-display text-lg text-secondary">{name}</span>
        <span className="font-display text-primary">₹{price}</span>
      </div>
      <button 
        onClick={() => onAdd({ id: `addon-${name.toLowerCase().replace(' ', '-')}`, name, price, quantity: 1 })}
        className="px-6 py-2 bg-secondary text-white rounded-xl font-display text-sm active:scale-95 transition-transform"
      >
        ADD
      </button>
    </div>
  );
}

// --- Success Screen ---
function SuccessScreen({ summary }: { summary: CartItem[] }) {
  const navigate = useNavigate();
  const total = useMemo(() => summary.reduce((a, c) => a + (c.price * c.quantity), 0), [summary]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-8 bg-bg-app"
    >
      <div className="relative">
        <motion.div 
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
          className="w-32 h-32 bg-primary rounded-[40px] flex items-center justify-center shadow-2xl shadow-primary/40 rotate-3 border-4 border-white"
        >
          <CheckCircle2 className="w-16 h-16 text-white" strokeWidth={3} />
        </motion.div>
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-4 border-4 border-dashed border-primary/20 rounded-full -z-10"
        />
      </div>

      <div className="space-y-2">
        <h1 className="text-4xl font-display tracking-tight text-secondary">Aww Yeah!</h1>
        <p className="font-bold text-slate-500 bg-white/50 px-4 py-1 rounded-full inline-block">Order #0003</p>
      </div>

      <div className="w-full funky-card p-6 space-y-4">
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-primary opacity-50">
          <span>Your goodies</span>
          <span>Delivering now</span>
        </div>
        <div className="space-y-3">
          {summary.map(item => (
            <div key={item.id} className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-3">
                <span className="font-display text-primary text-lg">{item.quantity}×</span>
                <span className="font-bold text-secondary">{item.name}</span>
              </div>
              <span className="font-display text-secondary">₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>
        <div className="pt-4 border-t-2 border-dashed border-bg-app flex justify-between items-center">
          <span className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Total Energy</span>
          <span className="text-2xl font-display text-primary">₹{total}</span>
        </div>
      </div>

    </motion.div>
  );
}

// --- Admin Section ---
function AdminScreen() {
  const navigate = useNavigate();
  const [adminStep, setAdminStep] = useState<'PHONE' | 'OTP' | 'DASHBOARD'>('PHONE');
  const [adminPhone, setAdminPhone] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [adminOtp, setAdminOtp] = useState(['', '', '', '']);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'history' | 'stats'>('orders');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [currentKitchenId, setCurrentKitchenId] = useState<string | null>(null);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [isMenuLoading, setIsMenuLoading] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<MenuItem['category']>('dry_sabji');
  const [newItemThaliType, setNewItemThaliType] = useState<'normal' | 'special' | 'both'>('both');

  const otpRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1]; // Only take last char
    const newOtp = [...adminOtp];
    newOtp[index] = value;
    setAdminOtp(newOtp);

    if (value && index < 3) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !adminOtp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const updateOrderStatus = (orderId: string, nextStatus: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
  };

  useEffect(() => {
    if (adminStep === 'DASHBOARD') {
      fetchAdminContext();
    }
  }, [adminStep]);

  const fetchAdminContext = async () => {
    try {
      // 1. Get kitchen ID for this phone
      const { data: adminData } = await supabase
        .from('kitchen_admins')
        .select('kitchen_id')
        .eq('phone', adminPhone)
        .single();
      
      if (adminData) {
        setCurrentKitchenId(adminData.kitchen_id);
        fetchAdminMenuItems(adminData.kitchen_id);
      }
    } catch (err) {
      console.error('Error fetching admin context:', err);
    }
  };

  const fetchAdminMenuItems = async (kitchenId: string) => {
    setIsMenuLoading(true);
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('kitchen_id', kitchenId);
      if (error) throw error;
      setMenuItems(data.map(m => ({
        id: m.id,
        kitchen_id: m.kitchen_id,
        name: m.name,
        price: Number(m.price),
        available: m.available,
        category: m.category,
        thali_type: m.thali_type
      })));
    } catch (err) {
      console.error('Error fetching menu:', err);
    } finally {
      setIsMenuLoading(false);
    }
  };

  const toggleMenuItem = async (id: string) => {
    const item = menuItems.find(i => i.id === id);
    if (!item) return;
    try {
      const { error } = await supabase.from('menu_items').update({ available: !item.available }).eq('id', id);
      if (error) throw error;
      setMenuItems(prev => prev.map(item => item.id === id ? { ...item, available: !item.available } : item));
    } catch (err) {
      console.error('Error toggling menu item:', err);
    }
  };

  const updatePrice = async (id: string, newPrice: number) => {
    try {
      const { error } = await supabase.from('menu_items').update({ price: newPrice }).eq('id', id);
      if (error) throw error;
      setMenuItems(prev => prev.map(item => item.id === id ? { ...item, price: newPrice } : item));
    } catch (err) {
      console.error('Error updating price:', err);
    }
  };

  const updateItemName = async (id: string, newName: string) => {
    try {
      const { error } = await supabase.from('menu_items').update({ name: newName }).eq('id', id);
      if (error) throw error;
      setMenuItems(prev => prev.map(item => item.id === id ? { ...item, name: newName } : item));
    } catch (err) {
      console.error('Error updating name:', err);
    }
  };

  const addNewItem = async () => {
    if (!newItemName || !currentKitchenId) return;
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .insert([{
          kitchen_id: currentKitchenId,
          name: newItemName,
          price: Number(newItemPrice) || 0,
          category: newItemCategory,
          thali_type: newItemThaliType,
          available: true
        }])
        .select()
        .single();
      
      if (error) throw error;
      setMenuItems(prev => [...prev, {
        id: data.id,
        name: data.name,
        price: data.price,
        available: data.available,
        category: data.category,
        thali_type: data.thali_type
      }]);
      setNewItemName('');
      setNewItemPrice('');
      setShowAddItemForm(false);
    } catch (err) {
      console.error('Error adding new item:', err);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) throw error;
      setMenuItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  const twoDaysAgo = Date.now() - (2 * 24 * 60 * 60 * 1000);
  const historyOrders = orders.filter(o => {
    const isHistory = o.status === 'delivered' && o.timestamp >= twoDaysAgo;
    if (!historySearch) return isHistory;
    const searchMatch = o.id.includes(historySearch) || o.customerPhone.includes(historySearch);
    return isHistory && searchMatch;
  });
  const activeOrders = orders.filter(o => o.status !== 'delivered');

  const stats = useMemo(() => {
    const today = new Date().setHours(0,0,0,0);
    const todayOrders = orders.filter(o => o.timestamp >= today);
    return {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((a, b) => a + b.total, 0),
      todayOrders: todayOrders.length,
      todayRevenue: todayOrders.reduce((a, b) => a + b.total, 0)
    };
  }, [orders]);

  if (adminStep === 'PHONE') {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-bg-app relative">
        {/* Top Section - 60% Image */}
        <div className="h-[60%] w-full relative">
          <img 
            src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=1000" 
            alt="Kitchen Illustration" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-app via-transparent to-transparent" />
          
          {/* Funky Decorations */}
          <motion.div 
            animate={{ rotate: [0, 10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-10 right-10 w-24 h-24 bg-primary/20 rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ rotate: [0, -15, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-20 left-10 w-32 h-32 bg-secondary/10 rounded-full blur-2xl"
          />
        </div>

        {/* Bottom Section - 40% Form */}
        <div className="flex-1 px-8 pt-6 pb-12 flex flex-col justify-between -mt-12 relative z-10 bg-bg-app rounded-t-[40px] shadow-2xl">
          <div className="space-y-6">
            <div className="text-center px-4">
              <h1 className="font-display text-4xl text-secondary leading-tight">
                Kitchen <span className="text-primary underline decoration-wavy underline-offset-8">Log</span>
              </h1>
              <p className="text-slate-400 font-bold text-sm mt-3">Welcome back, Chef! Time to manage your kitchen magic.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 px-1">Admin Number</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">+91</span>
                  <input 
                    type="tel" 
                    maxLength={10}
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9060557296" 
                    className="w-full bg-white border-2 border-slate-50 shadow-sm rounded-2xl py-4 pl-14 pr-6 focus:ring-4 focus:ring-primary/10 text-sm font-bold outline-none transition-all" 
                  />
                </div>
              </div>
              <button 
                onClick={() => setAdminStep('OTP')}
                disabled={adminPhone.length !== 10}
                className="w-full funky-btn-primary h-16 text-lg disabled:opacity-50 disabled:grayscale transition-all"
              >
                Send Secret Code
              </button>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Powered by Stuva Admin</p>
          </div>
        </div>
      </div>
    );
  }

  if (adminStep === 'OTP') {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-bg-app relative">
        {/* Top Section - Consistent with Login */}
        <div className="h-[60%] w-full relative">
          <img 
            src="https://images.unsplash.com/photo-1590577976322-3d2d6e2133de?auto=format&fit=crop&q=80&w=1000" 
            alt="OTP Illustration" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-app via-transparent to-transparent" />
          
          {/* Funky Decorations - Consistent with Login */}
          <motion.div 
            animate={{ rotate: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-10 left-10 w-24 h-24 bg-primary/20 rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ rotate: [0, 15, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-20 right-10 w-32 h-32 bg-secondary/10 rounded-full blur-2xl"
          />
        </div>

        <div className="flex-1 px-8 pt-6 pb-12 flex flex-col justify-between -mt-12 relative z-10 bg-bg-app rounded-t-[40px] shadow-2xl">
          <div className="space-y-6">
            <div className="text-center px-4">
              <h1 className="font-display text-4xl text-secondary leading-tight">
                Verify <span className="text-primary underline decoration-wavy underline-offset-8">Admin</span>
              </h1>
              <p className="text-slate-400 font-bold text-sm mt-3">We've sent magic code to <span className="text-secondary font-black">+91 {adminPhone}</span></p>
            </div>

            <div className="space-y-8">
              <div className="flex justify-between gap-3 px-4">
                {adminOtp.map((digit, i) => (
                  <input
                    key={i}
                    ref={otpRefs[i]}
                    type="number"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-14 h-16 bg-white border-2 border-slate-50 shadow-sm rounded-2xl text-center text-2xl font-display text-primary outline-none focus:ring-4 focus:ring-primary/10 transition-all no-scrollbar"
                  />
                ))}
              </div>

              <button 
                onClick={() => setAdminStep('DASHBOARD')}
                disabled={adminOtp.some(d => !d)}
                className="w-full funky-btn-primary h-16 text-lg disabled:opacity-50 disabled:grayscale transition-all"
              >
                Enter Dashboard
              </button>
            </div>
          </div>

          <div className="text-center">
            <button onClick={() => setAdminStep('PHONE')} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline decoration-wavy underline-offset-4">Change Number</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-bg-app relative">
      {/* Admin Header - Home Inspired */}
      <header className="px-6 pt-8 pb-4 flex items-center justify-between shrink-0">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-slate-400 mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Kitchen Status</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-display text-lg text-secondary">Thaat Baat</span>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Open</span>
          </div>
        </div>

        <button 
          onClick={() => setShowAdminMenu(!showAdminMenu)}
          className="w-12 h-12 bg-white shadow-xl shadow-ink/5 rounded-2xl flex items-center justify-center border border-slate-50 transition-transform active:scale-95"
        >
          <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
            <MenuIcon className="w-5 h-5 text-secondary" />
          </div>
        </button>
      </header>

      {/* Hero-like Title */}
      <div className="px-6 space-y-2 mb-6">
        <h1 className="font-display text-3xl text-secondary leading-tight">
          Manage magic, <br />
          delivered by <span className="text-primary underline decoration-wavy underline-offset-8">you.</span>
        </h1>
      </div>

      {/* Admin Menu Dropdown */}
      <AnimatePresence>
        {showAdminMenu && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAdminMenu(false)}
              className="absolute inset-0 bg-secondary/20 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute top-24 right-6 w-48 bg-white rounded-2xl shadow-2xl z-[60] py-2 border border-slate-100"
            >
              {[
                { id: 'orders', label: 'Orders Dashboard', icon: ShoppingBag },
                { id: 'menu', label: 'Menu Controls', icon: MenuIcon },
                { id: 'history', label: 'Order History', icon: Clock },
                { id: 'stats', label: 'Store Stats', icon: Star },
              ].map(item => (
                <button 
                  key={item.id}
                  onClick={() => { setActiveTab(item.id as any); setShowAdminMenu(false); }}
                  className={`w-full px-4 py-3 flex items-center gap-3 text-sm font-bold transition-colors ${activeTab === item.id ? 'text-primary bg-primary/5' : 'text-secondary hover:bg-slate-50'}`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
              <div className="h-px bg-slate-100 my-1" />
              <button 
                onClick={() => { setAdminStep('AUTH'); setShowAdminMenu(false); }}
                className="w-full px-4 py-3 flex items-center gap-3 text-sm font-bold text-red-500 hover:bg-red-50"
              >
                <Plus className="w-4 h-4 rotate-45" />
                Logout
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Enhanced Stats Cards */}
      {activeTab === 'orders' && (
        <div className="px-6 py-4 flex gap-4 overflow-x-auto no-scrollbar shrink-0">
          <div className="bg-white p-4 rounded-3xl border-2 border-slate-50 min-w-[140px] shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <ShoppingBag className="w-12 h-12" />
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Now</p>
            <p className="text-2xl font-display text-secondary">{activeOrders.length}</p>
            <div className="mt-2 w-full bg-slate-50 h-1 rounded-full overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: '65%' }} />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-3xl border-2 border-slate-50 min-w-[140px] shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Delivered</p>
            <p className="text-2xl font-display text-green-600">{orders.filter(o => o.status === 'delivered').length}</p>
            <div className="mt-2 text-[8px] font-bold text-slate-300">Great job today!</div>
          </div>
        </div>
      )}

    <div className="flex-1 px-6 pb-20 no-scrollbar">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="font-display text-2xl text-secondary">
          {activeTab === 'orders' ? 'Live Command' : activeTab === 'history' ? 'Order History' : activeTab === 'menu' ? 'Menu Controls' : 'Store Performance'}
        </h3>
        <div className="w-12 h-1.5 bg-primary/10 rounded-full" />
      </div>

      {activeTab === 'orders' ? (
          <div className="space-y-10 pb-8">
            {/* New Orders Section */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] whitespace-nowrap">new order</span>
                <div className="flex-1 h-px border-t-2 border-dashed border-slate-100" />
              </div>
              <div className="space-y-4">
                {orders.filter(o => o.status === 'pending').length > 0 ? (
                  orders.filter(o => o.status === 'pending').map(order => (
                    <div key={order.id}>
                      <AdminOrderCard order={order} onUpdate={updateOrderStatus} onView={setSelectedOrder} />
                    </div>
                  ))
                ) : (
                  <p className="text-center py-4 text-xs font-bold text-slate-300 italic">No new arrivals</p>
                )}
              </div>
            </div>

            {/* Preparing Section */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] whitespace-nowrap">cooking now</span>
                <div className="flex-1 h-px border-t-2 border-dashed border-slate-100" />
              </div>
              <div className="space-y-4">
                {orders.filter(o => o.status === 'preparing').length > 0 ? (
                  orders.filter(o => o.status === 'preparing').map(order => (
                    <div key={order.id}>
                      <AdminOrderCard order={order} onUpdate={updateOrderStatus} onView={setSelectedOrder} />
                    </div>
                  ))
                ) : (
                  <p className="text-center py-4 text-xs font-bold text-slate-300 italic">Kitchen is idle</p>
                )}
              </div>
            </div>

            {/* On the Way Section */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] whitespace-nowrap">out for delivery</span>
                <div className="flex-1 h-px border-t-2 border-dashed border-slate-100" />
              </div>
              <div className="space-y-4">
                {orders.filter(o => o.status === 'on-the-way').length > 0 ? (
                  orders.filter(o => o.status === 'on-the-way').map(order => (
                    <div key={order.id}>
                      <AdminOrderCard order={order} onUpdate={updateOrderStatus} onView={setSelectedOrder} />
                    </div>
                  ))
                ) : (
                  <p className="text-center py-4 text-xs font-bold text-slate-300 italic">None on the road</p>
                )}
              </div>
            </div>

            {/* Recently Delivered Section */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] whitespace-nowrap">delivered</span>
                <div className="flex-1 h-px border-t-2 border-dashed border-slate-100" />
              </div>
              <div className="space-y-4">
                {historyOrders.length > 0 ? (
                  historyOrders.map(order => (
                    <div key={order.id}>
                      <AdminOrderCard order={order} onUpdate={updateOrderStatus} onView={setSelectedOrder} />
                    </div>
                  ))
                ) : (
                  <p className="text-center py-4 text-xs font-bold text-slate-300 italic">No completions in last 2 days</p>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === 'history' ? (
          <div className="space-y-4 pb-4">
            <div className="relative group mb-6">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-secondary/30 group-focus-within:text-primary transition-colors" />
              </div>
              <input 
                type="text" 
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search Order # or Phone" 
                className="w-full bg-white border-2 border-slate-50 focus:border-primary/20 rounded-2xl py-3 pl-10 pr-4 text-xs font-bold transition-all outline-none text-ink placeholder:text-slate-400"
              />
            </div>
            
            <div className="p-3 bg-primary/5 rounded-2xl border border-primary/10 mb-4 text-center">
               <p className="text-[10px] font-black text-primary uppercase tracking-widest">Showing orders from last 2 days</p>
            </div>
            
            {historyOrders.length > 0 ? historyOrders.map(order => (
              <div key={order.id} className="bg-white border-2 border-slate-50 p-4 rounded-2xl opacity-80 grayscale-[0.5]">
                 <div className="flex justify-between items-center">
                   <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {order.time}
                     </p>
                     <h4 className="font-display text-lg text-secondary">#{order.id}</h4>
                     <p className="text-xs font-bold text-slate-500">{order.customerName}</p>
                   </div>
                   <div className="text-right">
                     <p className="font-display text-primary text-xl">₹{order.total}</p>
                     <button onClick={() => setSelectedOrder(order)} className="text-[10px] font-black text-secondary uppercase tracking-widest mt-1 hover:underline">Details</button>
                   </div>
                 </div>
              </div>
            )) : (
              historyOrders.length === 0 && <div className="py-20 text-center opacity-40 font-display">History is clear</div>
            )}
          </div>
        ) : activeTab === 'menu' ? (
          <div className="space-y-6 pb-20">
             {/* Add Item Trigger */}
             <button 
               onClick={() => setShowAddItemForm(true)}
               className="w-full h-16 border-2 border-dashed border-primary/20 rounded-[28px] flex items-center justify-center gap-2 text-primary font-display hover:bg-primary/5 transition-all mb-4"
             >
               <Plus className="w-5 h-5" />
               New Daily Magic Item
             </button>

             {/* Add Item Modal */}
             <AnimatePresence>
               {showAddItemForm && (
                 <>
                   <motion.div 
                     initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                     onClick={() => setShowAddItemForm(false)}
                     className="fixed inset-0 bg-secondary/40 backdrop-blur-sm z-[100]"
                   />
                   <motion.div 
                     initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
                     className="fixed bottom-10 left-6 right-6 bg-white p-8 rounded-[40px] shadow-2xl z-[110] space-y-6"
                   >
                     <h2 className="font-display text-2xl text-secondary">Add New Item</h2>
                     <div className="space-y-4">
                       <input 
                         type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)}
                         placeholder="Item Name (e.g. Aloo Bhujiya)"
                         className="w-full bg-slate-50 rounded-2xl p-4 font-bold outline-none border-2 border-transparent focus:border-primary/20"
                       />
                       <div className="grid grid-cols-1 gap-3">
                         {(newItemCategory === 'others' || newItemCategory === 'thali') && (
                           <input 
                             type="text" 
                             inputMode="numeric"
                             value={newItemPrice} 
                             onChange={e => setNewItemPrice(e.target.value.replace(/\D/g, ''))}
                             placeholder="Price (₹)"
                             className="w-full bg-slate-50 rounded-2xl p-4 font-bold outline-none border-2 border-transparent focus:border-primary/20"
                           />
                         )}
                         <select 
                           value={newItemCategory} onChange={e => setNewItemCategory(e.target.value as any)}
                           className="w-full bg-slate-50 rounded-2xl p-4 font-bold outline-none border-2 border-transparent focus:border-primary/20"
                         >
                           <option value="dry_sabji">Dry Sabji (Included in Thali)</option>
                           <option value="gravy_sabji">Gravy Sabji (Included in Thali)</option>
                           <option value="others">Others (Paratha, Addons)</option>
                         </select>
                         
                         {(newItemCategory === 'dry_sabji' || newItemCategory === 'gravy_sabji') && (
                           <div className="space-y-2">
                             <p className="text-[10px] font-black uppercase tracking-widest text-primary/40 px-1">Visible In</p>
                             <div className="flex gap-2">
                               {['normal', 'special', 'both'].map(t => (
                                 <button 
                                   key={t}
                                   onClick={() => setNewItemThaliType(t as any)}
                                   type="button"
                                   className={`flex-1 py-3 rounded-xl font-bold text-[10px] tracking-widest uppercase transition-all border ${newItemThaliType === t ? 'bg-primary text-white border-primary shadow-lg shadow-primary/10' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                                 >
                                   {t}
                                 </button>
                               ))}
                             </div>
                           </div>
                         )}
                       </div>
                     </div>
                     <button onClick={addNewItem} className="w-full funky-btn-primary h-16 text-lg">Save Item</button>
                   </motion.div>
                 </>
               )}
             </AnimatePresence>

             {/* Sections */}
             {[
               { title: 'Main Thalis', cat: 'thali' },
               { title: 'Daily Dry Sabjis', cat: 'dry_sabji' },
               { title: 'Daily Gravy Sabjis', cat: 'gravy_sabji' },
               { title: 'Others (Paratha, Addons)', cat: 'others' }
             ].map(section => (
               <section key={section.title} className="space-y-4">
                 <div className="flex items-center gap-2">
                   <h3 className="font-display text-xl text-secondary">{section.title}</h3>
                   <div className="flex-1 h-px bg-slate-100" />
                 </div>
                 <div className="space-y-3">
                   {isMenuLoading ? (
                     <div className="py-20 text-center opacity-40 font-display">Loading menu magic...</div>
                   ) : (
                     menuItems.filter(i => i.category === section.cat).map(item => (
                       <div key={item.id} className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-50 flex flex-col gap-4">
                         <div className="flex items-center justify-between">
                           <div className="flex-1 mr-4">
                             <div className="flex items-center gap-2">
                               <input 
                                  type="text" value={item.name} 
                                  onChange={e => updateItemName(item.id, e.target.value)}
                                  className="font-display text-base text-secondary bg-transparent outline-none flex-1"
                               />
                               {(item.category === 'dry_sabji' || item.category === 'gravy_sabji') && (
                                 <span className="text-[8px] font-black uppercase bg-slate-50 text-slate-300 px-1.5 py-0.5 rounded leading-none shrink-0">{item.thali_type}</span>
                               )}
                             </div>
                             {section.cat !== 'dry_sabji' && section.cat !== 'gravy_sabji' && (
                               <div className="flex items-center gap-1.5 mt-1">
                                 <span className="text-[10px] font-bold text-slate-300">₹</span>
                                 <input 
                                   type="text" 
                                   inputMode="numeric"
                                   value={item.price === 0 ? '' : item.price} 
                                   onChange={e => {
                                     const val = e.target.value.replace(/\D/g, '');
                                     updatePrice(item.id, val === '' ? 0 : Number(val));
                                   }}
                                   placeholder="0"
                                   className="bg-transparent text-sm font-black text-primary outline-none w-16"
                                 />
                               </div>
                             )}
                           </div>
                           <div className="flex items-center gap-3">
                             {section.cat !== 'thali' && (
                               <button 
                                 onClick={() => deleteItem(item.id)}
                                 className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-50 text-red-400 active:scale-90 transition-transform"
                               >
                                  <Plus className="w-4 h-4 rotate-45" />
                               </button>
                             )}
                             <button 
                               onClick={() => toggleMenuItem(item.id)}
                               className={`w-12 h-6 rounded-full transition-all relative ${item.available ? 'bg-primary' : 'bg-slate-200'}`}
                             >
                               <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${item.available ? 'left-7' : 'left-1'}`} />
                             </button>
                           </div>
                         </div>
                       </div>
                     ))
                   )}
                 </div>
               </section>
             ))}
          </div>
        ) : (
          <div className="space-y-6 pb-20 mt-4">
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white p-6 rounded-[32px] border-b-8 border-primary/20 shadow-sm">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Total Orders</p>
                  <p className="text-3xl font-display text-secondary">{stats.totalOrders}</p>
               </div>
               <div className="bg-white p-6 rounded-[32px] border-b-8 border-secondary/20 shadow-sm">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Total Revenue</p>
                  <p className="text-3xl font-display text-primary leading-none">₹{stats.totalRevenue}</p>
               </div>
               <div className="bg-white p-6 rounded-[32px] border-b-8 border-bg-app shadow-sm">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Today Orders</p>
                  <p className="text-3xl font-display text-secondary">{stats.todayOrders}</p>
               </div>
               <div className="bg-white p-6 rounded-[32px] border-b-8 border-green-200 shadow-sm">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Today Revenue</p>
                  <p className="text-3xl font-display text-green-600 leading-none">₹{stats.todayRevenue}</p>
               </div>
            </div>
            
            <div className="bg-white p-6 rounded-[32px] border border-slate-50 relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/40" />
               <h4 className="font-display text-xl text-secondary mb-4">Sales Insight</h4>
               <p className="text-xs font-bold text-slate-400 leading-relaxed">
                 You've processed {stats.todayOrders} orders today. Average value is ₹{Math.round(stats.todayRevenue / stats.todayOrders) || 0} per order.
               </p>
            </div>
          </div>
        )}
      </div>

      <OrderDetailsSheet order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </div>
  );
}

// Helper Components for Admin Screen
function AdminOrderCard({ order, onUpdate, onView }: { order: Order, onUpdate: any, onView: any }) {
  return (
    <div className="bg-white rounded-[32px] p-5 shadow-xl shadow-ink/5 border border-slate-50 relative overflow-hidden group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <span className="font-display text-xl text-secondary">#{order.id}</span>
             <StatusBadge status={order.status} />
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <User className="w-3 h-3" />
            <p className="text-xs font-bold">{order.customerName}</p>
            <span className="text-slate-200">•</span>
            <Clock className="w-3 h-3" />
            <p className="text-xs font-bold">{order.time}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Total</p>
          <div className="font-display text-2xl text-primary leading-none">₹{order.total}</div>
        </div>
      </div>

      <div className="flex gap-3">
        <button 
          onClick={() => onView(order)}
          className="flex-1 bg-slate-50 text-slate-500 py-3 rounded-2xl font-display text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-colors"
        >
          Details
        </button>
        {order.status === 'pending' && (
          <button 
            onClick={() => onUpdate(order.id, 'preparing')} 
            className="flex-[2] bg-primary text-white py-3 rounded-2xl font-display text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            Accept Order
          </button>
        )}
        {order.status === 'preparing' && (
          <button 
            onClick={() => onUpdate(order.id, 'on-the-way')} 
            className="flex-[2] bg-blue-600 text-white py-3 rounded-2xl font-display text-[10px] uppercase tracking-widest shadow-lg shadow-blue/20 transition-all active:scale-95"
          >
            Out for Delivery
          </button>
        )}
        {order.status === 'on-the-way' && (
          <button 
            onClick={() => onUpdate(order.id, 'delivered')} 
            className="flex-[2] bg-secondary text-white py-3 rounded-2xl font-display text-[10px] uppercase tracking-widest shadow-lg shadow-secondary/20 transition-all active:scale-95"
          >
            Mark Delivered
          </button>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Order['status'] }) {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-700',
    preparing: 'bg-blue-100 text-blue-700',
    'on-the-way': 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700'
  };
  return (
    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${styles[status]}`}>
      {status.replace('-', ' ')}
    </span>
  );
}

function OrderDetailsSheet({ order, onClose }: { order: Order | null, onClose: () => void }) {
  return (
    <AnimatePresence>
      {order && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-secondary/80 z-[200] backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[40px] p-8 z-[210] shadow-2xl space-y-6">
             <div className="sheet-handle mb-4" />
             <div className="flex justify-between items-start">
               <div>
                 <h2 className="font-display text-3xl text-secondary">Order Details</h2>
                 <p className="text-slate-400 font-bold">#{order.id} • {order.time}</p>
               </div>
               <button onClick={onClose} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center"><Plus className="rotate-45 text-slate-400" /></button>
             </div>

             <div className="space-y-4">
               <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl">
                 <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm"><User /></div>
                 <div>
                   <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Customer</p>
                   <p className="font-display text-lg text-secondary leading-none">{order.customerName}</p>
                 </div>
                 <a href={`tel:${order.customerPhone}`} className="ml-auto w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 active:scale-90 transition-transform"><Phone /></a>
               </div>

               <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar py-2">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Order Summary</p>
                 {order.items.map((item, i) => (
                   <div key={i} className="flex justify-between items-start p-2 border-b border-slate-50 last:border-0">
                     <div>
                       <div className="flex items-center gap-2">
                         <span className="font-display text-primary">{item.quantity}×</span>
                         <span className="font-bold text-secondary">{item.name}</span>
                       </div>
                       {item.options && (
                         <div className="text-[10px] text-slate-400 font-bold ml-6 mt-1 space-y-0.5">
                           {item.options.gravy && <div>• {item.options.gravy} Gravy</div>}
                           {item.options.dry && <div>• {item.options.dry} Dry</div>}
                           {item.options.extraRoti > 0 && <div>• +{item.options.extraRoti} Extra Roti</div>}
                           {item.options.withRice !== undefined && <div>• {item.options.withRice ? 'With Rice' : '5 Roti instead of rice'}</div>}
                         </div>
                       )}
                     </div>
                     <span className="font-display text-secondary">₹{item.price * item.quantity}</span>
                   </div>
                 ))}
               </div>
               
               <div className="pt-4 border-t-2 border-dashed border-slate-100 flex justify-between items-center px-2">
                 <span className="font-display text-xl text-secondary">Total Amount</span>
                 <span className="font-display text-3xl text-primary">₹{order.total}</span>
               </div>
             </div>

             <button 
                className="w-full funky-btn-secondary h-16 text-lg"
                onClick={onClose}
             >
               Close Summary
             </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
