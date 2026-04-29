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
  Store,
  RefreshCw,
  Trash2,
  LogOut,
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
  isOpen?: boolean;
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
  dailyOrderNo?: string;
  kitchen_id: string;
  customerName: string;
  customerPhone: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'preparing' | 'on-the-way' | 'delivered' | 'cancelled';
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
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('stuva_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeKitchenId, setActiveKitchenId] = useState<string | null>(() => {
    return localStorage.getItem('stuva_cart_kitchen_id');
  });

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('stuva_cart', JSON.stringify(cart));
    if (cart.length === 0) {
      setActiveKitchenId(null);
      localStorage.removeItem('stuva_cart_kitchen_id');
    }
  }, [cart]);

  useEffect(() => {
    if (activeKitchenId) {
      localStorage.setItem('stuva_cart_kitchen_id', activeKitchenId);
    } else {
      localStorage.removeItem('stuva_cart_kitchen_id');
    }
  }, [activeKitchenId]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'AUTH' | 'OTP' | 'NAME' | 'ADDRESS' | 'SUMMARY'>('AUTH');
  const [userAddress, setUserAddress] = useState<UserAddress | null>(null);
  const [tempAddress, setTempAddress] = useState<UserAddress>({ apartment: '', area: 'Law Gate' });
  const [orderSummary, setOrderSummary] = useState<CartItem[]>([]);
  const [placedOrderId, setPlacedOrderId] = useState<string>('');
  const [placedOrderNo, setPlacedOrderNo] = useState<string>('');
  const [showOrders, setShowOrders] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [phone, setPhone] = useState('');
  const [userName, setUserName] = useState('');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isLoadingKitchens, setIsLoadingKitchens] = useState(true);
  const [authError, setAuthError] = useState('');
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const activeKitchen = useMemo(() => kitchens.find(k => k.id === activeKitchenId), [kitchens, activeKitchenId]);

  // Fetch kitchens globally
  useEffect(() => {
    fetchKitchens();
  }, []);

  const fetchKitchens = async () => {
    setIsLoadingKitchens(true);
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
          image: k.image_url,
          isOpen: k.is_active ?? true // Use is_active as the master status
        })));
      }
    } catch (err) {
      console.error('Failed to load kitchens:', err);
    } finally {
      setIsLoadingKitchens(false);
    }
  };

  // Security: Rate limiting & Expiry
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [lastOtpRequestAt, setLastOtpRequestAt] = useState(0);
  const [otpExpiry, setOtpExpiry] = useState(0);

  // Load session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const savedPhone = localStorage.getItem('stuva_auth_phone');
        if (savedPhone) {
          setPhone(savedPhone);
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('phone', savedPhone)
            .maybeSingle();
          
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
              .maybeSingle();
            
            if (addrData) {
              setUserAddress({
                apartment: addrData.apartment,
                area: addrData.area
              });
            }
          }
        }
      } catch (err) {
        console.error('Session check failed:', err);
      } finally {
        setIsLoadingSession(false);
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
    console.log("handleCheckoutClick", { kitchenId, isLoggedIn });
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
    console.log("finalPlaceOrder triggered", { activeKitchenId, currentUser, cartTotal, userAddress, cart });
    if (!activeKitchenId || !currentUser) {
      console.warn("Early return: missing kitchen or user", { activeKitchenId, currentUser });
      setAuthError('Session error. Please try again.');
      return;
    }
    
    setIsProcessing(true);
    setAuthError('');
    try {
      // Get the next order number for today
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('kitchen_id', activeKitchenId)
        .gte('created_at', startOfToday.toISOString());

      const nextNo = (count || 0) + 1;
      const formattedNo = nextNo.toString().padStart(4, '0');

      const { data: newOrder, error } = await supabase
        .from('orders')
        .insert([{
          kitchen_id: activeKitchenId,
          daily_order_no: formattedNo,
          customer_name: currentUser.name,
          customer_phone: currentUser.phone,
          total: cartTotal,
          items: cart,
          status: 'pending',
          address: userAddress
        }])
        .select()
        .single();

      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }

      console.log("Order placed successfully:", newOrder);
      if (newOrder) {
        setPlacedOrderId(newOrder.id);
        setPlacedOrderNo(newOrder.daily_order_no);
      }
      setOrderSummary([...cart]);
      setCart([]);
      setActiveKitchenId(null);
      localStorage.removeItem('stuva_cart');
      localStorage.removeItem('stuva_cart_kitchen_id');
      setShowCheckout(false);
      navigate('/success');
    } catch (err: any) {
      console.error("Catch block error:", err);
      setAuthError(err.message || 'Failed to place order.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem('stuva_auth_phone');
      setIsLoggedIn(false);
      setCurrentUser(null);
      setUserAddress(null);
      // Optional: Clear cart on logout
      setCart([]);
      setActiveKitchenId(null);
      localStorage.removeItem('stuva_cart');
      localStorage.removeItem('stuva_cart_kitchen_id');
      navigate('/');
    }
  };

  const addToCart = (item: CartItem, kitchenId: string) => {
    setCart(prev => {
      // If adding from a different kitchen, we could either clear and add, or reject
      // For best UX, if it's the first item, we set the activeKitchenId
      if (prev.length === 0) {
        setActiveKitchenId(kitchenId);
      } else if (activeKitchenId && activeKitchenId !== kitchenId) {
        // This shouldn't happen if we add UI guards, but as a fallback:
        // We warn or just clear. Let's stick with the single kitchen rule.
        if (window.confirm("Your cart contains items from another kitchen. Clear cart to add this item?")) {
          setActiveKitchenId(kitchenId);
          return [item];
        }
        return prev;
      }

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
          {isLoadingSession ? (
            <div className="flex-1 flex flex-col bg-bg-app overflow-hidden">
               <header className="px-6 py-8 flex items-center justify-between opacity-50">
                <div className="space-y-2">
                  <div className="w-20 h-3 skeleton" />
                  <div className="w-40 h-6 skeleton" />
                </div>
                <div className="w-12 h-12 skeleton rounded-2xl" />
              </header>
              <div className="px-6 space-y-4">
                <div className="w-full h-14 skeleton rounded-[24px]" />
                <div className="w-48 h-8 skeleton" />
                <div className="grid grid-cols-2 gap-4">
                  {[1,2,3,4].map(i => <KitchenSkeleton key={i} />)}
                </div>
              </div>
              <div className="mt-auto p-10 flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin opacity-20" />
                <p className="font-display text-secondary/30 animate-pulse text-sm uppercase tracking-widest">Waking up STUVA...</p>
              </div>
            </div>
          ) : (
            <motion.div 
              key={location.pathname}
              className={`flex-1 flex flex-col ${location.pathname === '/admin' ? 'overflow-y-auto' : 'overflow-hidden'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Routes location={location}>
                <Route path="/" element={<HomeScreen isLoggedIn={isLoggedIn} kitchens={kitchens} currentUser={currentUser} isLoading={isLoadingKitchens} onLogout={handleLogout} />} />
                <Route path="/admin" element={<AdminScreen />} />
                  <Route path="/kitchen/:slug" 
                    element={
                      <MenuScreen 
                        kitchens={kitchens}
                        onAddToCart={addToCart}
                        cart={cart}
                        updateQuantity={updateQuantity}
                        onCheckout={(kitchenId) => handleCheckoutClick(kitchenId)}
                        isLoggedIn={isLoggedIn}
                        onLogout={handleLogout}
                        currentUser={currentUser}
                      />
                    } 
                  />
                <Route path="/orders" element={<UserOrdersScreen currentUser={currentUser} kitchens={kitchens} onLogout={handleLogout} />} />
                <Route path="/success" element={<SuccessScreen summary={orderSummary} orderId={placedOrderId} orderNo={placedOrderNo} />} />
              </Routes>
            </motion.div>
          )}
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
              
              {authError && (
                <div className="mx-2 mb-4 p-3 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-red-500 shadow-sm shrink-0">!</div>
                  <p className="text-xs font-bold text-red-600">{authError}</p>
                </div>
              )}
              
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

                      {/* Global error handled at top */}
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
                      <p className="text-slate-400 font-bold text-sm">Review your order from <span className="text-primary uppercase tracking-wider">{activeKitchen?.name || 'Kitchen'}</span></p>
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

                      {/* Item List for Review */}
                      <div className="pt-4 border-t-2 border-dashed border-primary/10 space-y-3 max-h-[220px] overflow-y-auto no-scrollbar">
                        <div className="flex justify-between items-center px-1">
                          <p className="text-[9px] font-black text-primary/40 uppercase tracking-widest">Your Selection</p>
                          <button 
                            onClick={() => {
                              setCart([]);
                              setActiveKitchenId(null);
                              localStorage.removeItem('stuva_cart');
                              localStorage.removeItem('stuva_cart_kitchen_id');
                              setShowCheckout(false);
                            }}
                            className="text-[9px] font-black text-red-400 uppercase tracking-widest hover:text-red-500"
                          >
                            Clear All
                          </button>
                        </div>
                        {cart.map(item => (
                          <div key={item.id} className="flex items-center justify-between bg-white/50 p-3 rounded-2xl border border-primary/5">
                            <div className="flex-1 min-w-0 pr-4">
                              <p className="text-sm font-bold text-secondary truncate">{item.name}</p>
                              {item.options && (
                                <p className="text-[9px] text-slate-400 font-bold leading-tight">
                                  {[
                                    item.options.withRice ? 'Rice' : 'No Rice',
                                    item.options.drySabji,
                                    item.options.gravySabji
                                  ].filter(Boolean).join(' • ')}
                                </p>
                              )}
                              <p className="text-xs font-display text-primary">₹{item.price * item.quantity}</p>
                            </div>
                            <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm border border-slate-100">
                              <button 
                                onClick={() => updateQuantity(item.id, -1)}
                                className="w-7 h-7 flex items-center justify-center text-secondary active:scale-90"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="font-display text-xs min-w-[15px] text-center">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.id, 1)}
                                className="w-7 h-7 flex items-center justify-center text-secondary active:scale-90"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
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
                      disabled={isProcessing}
                      className="w-full funky-btn-secondary h-16 text-lg flex items-center justify-center gap-2 group disabled:opacity-50 disabled:grayscale"
                    >
                      {isProcessing ? 'Placing Order...' : (
                        <>
                          Place Order
                          <ShoppingBag className="w-6 h-6 animate-bounce" />
                        </>
                      )}
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
function HomeScreen({ isLoggedIn, kitchens, currentUser, isLoading, onLogout }: { isLoggedIn: boolean, kitchens: Kitchen[], currentUser: UserProfile | null, isLoading: boolean, onLogout: () => void }) {
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

            <div 
              className="w-12 h-12 bg-white shadow-xl shadow-ink/5 rounded-2xl flex items-center justify-center border border-slate-50"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
            </div>
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
              {isLoading ? (
                [1,2,3,4,5,6].map(i => <KitchenSkeleton key={i} />)
              ) : filteredKitchens.length > 0 ? (
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
              <h1 className="text-secondary font-display text-4xl leading-none capitalize">Hi, {currentUser?.name?.split(' ')[0] || 'Zesan'}</h1>
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin className="w-4 h-4 text-primary" strokeWidth={3} />
                <span className="text-[12px] font-bold text-slate-400 uppercase tracking-tight">Law Gate near LPU</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div 
                onClick={() => navigate('/orders')}
                className="w-12 h-12 rounded-2xl bg-white border-2 border-primary/20 p-1 shadow-sm cursor-pointer active:scale-95 transition-transform group relative"
              >
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.name || 'Felix'}`} className="w-full h-full rounded-xl" alt="profile" />
              </div>
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
                {isLoading ? (
                  [1,2,3,4].map(i => <KitchenSkeleton key={i} />)
                ) : filteredKitchens.length > 0 ? (
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

// --- Skeleton Components ---
function KitchenSkeleton() {
  return (
    <div className="funky-card overflow-hidden flex flex-col">
      <div className="h-40 skeleton rounded-none" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-3/4 skeleton" />
        <div className="h-2 w-1/2 skeleton" />
      </div>
    </div>
  );
}

function MenuItemSkeleton() {
  return (
    <div className="funky-card p-4 flex gap-4">
      <div className="w-24 h-24 skeleton shrink-0" />
      <div className="flex-1 space-y-3 py-1">
        <div className="h-5 w-2/3 skeleton" />
        <div className="h-3 w-1/3 skeleton" />
        <div className="h-8 w-1/2 skeleton rounded-xl mt-2" />
      </div>
    </div>
  );
}

function OrderCardSkeleton() {
  return (
    <div className="bg-white p-5 rounded-[28px] border-2 border-slate-50 space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <div className="h-4 w-20 skeleton" />
          <div className="h-6 w-32 skeleton" />
          <div className="h-3 w-40 skeleton" />
        </div>
        <div className="w-16 h-6 skeleton rounded-full" />
      </div>
      <div className="h-[2px] w-full bg-slate-50 border-t-2 border-dashed border-slate-100" />
      <div className="flex gap-2">
        <div className="flex-1 h-10 skeleton rounded-xl" />
        <div className="flex-[2] h-10 skeleton rounded-xl" />
      </div>
    </div>
  );
}

// --- Kitchen Card ---
function KitchenCard({ kitchen, onClick }: { kitchen: Kitchen, onClick: () => void, key?: any }) {
  const isClosed = kitchen.isOpen === false;
  
  return (
    <motion.div 
      whileTap={isClosed ? {} : { scale: 0.96 }}
      onClick={isClosed ? undefined : onClick}
      className={`funky-card overflow-hidden flex flex-col group transition-all duration-300 ${isClosed ? 'opacity-70 grayscale-[0.3] cursor-not-allowed shadow-none border-slate-100' : 'cursor-pointer'}`}
    >
      <div className="relative h-40 overflow-hidden">
        <img 
          src={kitchen.image} 
          alt={kitchen.name} 
          className={`w-full h-full object-cover transition-transform duration-500 ${!isClosed && 'group-hover:scale-110'}`}
          referrerPolicy="no-referrer"
        />
        {isClosed && (
          <div className="absolute inset-0 bg-secondary/20 backdrop-blur-[2px] flex items-center justify-center">
            <div className="bg-red-500 text-white px-4 py-1.5 rounded-full font-display text-[10px] tracking-widest uppercase shadow-lg shadow-red-500/20 -rotate-6">
              Shop Closed
            </div>
          </div>
        )}
      </div>
      
      <div className="flex-1 flex flex-col">
        <div className="p-3 flex-1 pb-4">
          <div className="flex justify-between items-start gap-2">
            <h3 className={`font-display text-[15px] transition-colors leading-tight ${isClosed ? 'text-slate-400' : 'text-primary group-hover:text-ink'}`}>{kitchen.name}</h3>
          </div>
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
  isLoggedIn,
  onLogout,
  currentUser
}: { 
  kitchens: Kitchen[];
  onAddToCart: (item: CartItem, kitchenId: string) => void;
  cart: CartItem[];
  updateQuantity: (id: string, delta: number) => void;
  onCheckout: (kitchenId: string) => void;
  isLoggedIn: boolean;
  onLogout: () => void;
  currentUser: UserProfile | null;
}) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const kitchen = useMemo(() => kitchens.find(k => k.slug === slug), [slug, kitchens]);
  const [isSticky, setIsSticky] = useState(false);
  const [localMenu, setLocalMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (kitchen) {
      document.title = `${kitchen.name} | Order Online with STUVA`;
      fetchMenu();
    }
    return () => {
      document.title = 'STUVA | Homemade Food Delivered with Love';
    };
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
  const isClosed = kitchen.isOpen === false;

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
        {isLoggedIn ? (
          <div className="flex items-center gap-2">
            <div 
              onClick={() => navigate('/orders')}
              className="w-10 h-10 rounded-xl bg-white border-2 border-primary/20 p-0.5 shadow-sm cursor-pointer active:scale-95 transition-transform group relative"
            >
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.name || 'Felix'}`} className="w-full h-full rounded-lg" alt="profile" />
            </div>
          </div>
        ) : (
          <div className="w-10" />
        )}
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
        <div className="bg-white p-6 rounded-[32px] shadow-xl shadow-ink/5 space-y-2 border-b-4 border-slate-100 relative overflow-hidden">
          {isClosed && (
            <div className="absolute top-0 right-0 p-4">
              <span className="bg-red-50 text-red-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100">Offline</span>
            </div>
          )}
          <h1 className="st-title text-3xl">{kitchen.name}</h1>
          <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
            {kitchen.description}
          </p>
        </div>

        {isClosed && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 bg-red-50 border-2 border-red-100 rounded-[32px] flex flex-col items-center text-center gap-2"
          >
            <Clock className="w-8 h-8 text-red-400 mb-2" />
            <h3 className="font-display text-xl text-red-600">Kitchen is Closed</h3>
            <p className="text-red-400 font-bold text-xs uppercase tracking-widest leading-relaxed">We apologize, but this kitchen isn't taking orders right now. Please check back later!</p>
          </motion.div>
        )}

        {/* Section: Menu Items */}
        <div className={`space-y-6 ${isClosed ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest px-1">Menu</p>
            <h2 className="font-display text-2xl text-secondary">Our Specialties</h2>
          </div>
          
          <div className="space-y-4">
            {loading ? (
              [1, 2].map(i => <MenuItemSkeleton key={i} />)
            ) : (
              <>
                <ThaliCard 
                  type="Normal"
                  price={localMenu.find(i => i.name.toLowerCase().trim() === 'normal thali')?.price || 70} 
                  description="3 Roti, 1 Dry Sabji, 1 Gravy Sabji, Rice"
                  dryOptions={localMenu.filter(i => i.category === 'dry_sabji' && i.available && (i.thali_type === 'normal' || i.thali_type === 'both')).map(i => i.name) || []}
                  gravyOptions={localMenu.filter(i => i.category === 'gravy_sabji' && i.available && (i.thali_type === 'normal' || i.thali_type === 'both')).map(i => i.name) || []}
                  onAdd={(item) => onAddToCart(item, kitchen.id)}
                  onUpdateQuantity={updateQuantity}
                  cart={cart}
                  kitchenId={kitchen.id}
                />
                <ThaliCard 
                  type="Special"
                  price={localMenu.find(i => i.name.toLowerCase().trim() === 'special thali')?.price || 80} 
                  description="3 Roti, 1 Dry Sabji, 1 Gravy Sabji, Rice, Extra Item"
                  dryOptions={localMenu.filter(i => i.category === 'dry_sabji' && i.available && (i.thali_type === 'special' || i.thali_type === 'both')).map(i => i.name) || []}
                  gravyOptions={localMenu.filter(i => i.category === 'gravy_sabji' && i.available && (i.thali_type === 'special' || i.thali_type === 'both')).map(i => i.name) || []}
                  onAdd={(item) => onAddToCart(item, kitchen.id)}
                  onUpdateQuantity={updateQuantity}
                  cart={cart}
                  kitchenId={kitchen.id}
                />
              </>
            )}
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="font-display text-xl text-secondary px-1">More Goodies</h3>
            <div className="space-y-3">
              {loading ? (
                [1, 2, 3].map(i => <div key={i} className="h-16 skeleton w-full rounded-2xl" />)
              ) : localMenu.filter(i => i.category === 'others' && i.available).length > 0 ? (
                localMenu.filter(i => i.category === 'others' && i.available).map(item => {
                  const cartItemId = `addon-${kitchen.id}-${item.id}`;
                  const existingItem = cart.find(ci => ci.id === cartItemId);
                  return (
                    <AddOnItem 
                      key={item.id} 
                      name={item.name} 
                      price={item.price} 
                      onAdd={(item) => onAddToCart(item, kitchen.id)}
                      onUpdateQuantity={updateQuantity}
                      quantity={existingItem?.quantity || 0}
                      cartItemId={cartItemId}
                    />
                  );
                })
              ) : (
                <div className="py-4 text-center opacity-30 font-bold uppercase text-[10px] tracking-widest italic">No extras available today</div>
              )}
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
              onClick={() => kitchen && onCheckout(kitchen.id)}
              className="w-full cart-bar-style group active:scale-95 transition-all active:rotate-1"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/20 border border-white/20 rounded-xl flex items-center justify-center font-display text-lg text-white">
                  {cartCount}
                </div>
                <div>
                  <div className="font-display text-lg tracking-wider leading-none text-white">₹{cartTotal}</div>
                  <div className="text-[8px] font-black uppercase text-white/50 tracking-widest mt-0.5 truncate max-w-[120px]">{kitchen.name}</div>
                </div>
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
  onAdd,
  onUpdateQuantity,
  cart,
  kitchenId
}: { 
  type: 'Normal' | 'Special';
  price: number; 
  description: string;
  dryOptions: string[];
  gravyOptions: string[];
  onAdd: (item: CartItem) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  cart: CartItem[];
  kitchenId: string;
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

  // Deterministic ID for this specific thali configuration
  const cartItemId = `${type.toLowerCase()}-thali-${kitchenId}-${drySabji.toLowerCase().replace(/\s+/g, '-')}-${gravySabji.toLowerCase().replace(/\s+/g, '-')}-${withRice ? 'rice' : 'no-rice'}`;
  const existingItem = cart.find(i => i.id === cartItemId);
  const quantity = existingItem?.quantity || 0;

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

        {quantity > 0 ? (
          <div className="flex items-center justify-between bg-secondary text-white rounded-2xl p-1 shadow-lg h-[56px]">
            <button 
              onClick={() => onUpdateQuantity(cartItemId, -1)}
              className="w-14 h-full flex items-center justify-center font-black text-2xl active:scale-90"
            >
              -
            </button>
            <div className="flex flex-col items-center justify-center">
              <span className="font-display text-xl leading-none">{quantity}</span>
              <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">In Bag</span>
            </div>
            <button 
              onClick={() => onUpdateQuantity(cartItemId, 1)}
              className="w-14 h-full flex items-center justify-center font-black text-2xl active:scale-90"
            >
              +
            </button>
          </div>
        ) : (
          <button 
            onClick={() => onAdd({ 
              id: cartItemId, 
              name: `${type} Thali`, 
              price: totalPrice, 
              quantity: 1, 
              options: { withRice, drySabji, gravySabji } 
            })}
            className="w-full funky-btn-secondary py-4"
          >
            Add to Bag
          </button>
        )}
      </div>
    </div>
  );
}

// --- Add-on Item ---
function AddOnItem({ 
  name, 
  price, 
  onAdd,
  onUpdateQuantity,
  quantity,
  cartItemId
}: { 
  name: string; 
  price: number; 
  onAdd: (item: CartItem) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  quantity: number;
  cartItemId: string;
  key?: React.Key;
}) {
  return (
    <div className="funky-card p-4 flex items-center justify-between border-b-4 border-slate-50">
      <div className="flex flex-col">
        <span className="font-display text-lg text-secondary">{name}</span>
        <span className="font-display text-primary">₹{price}</span>
      </div>

      {quantity > 0 ? (
        <div className="flex items-center gap-4 bg-secondary text-white rounded-xl px-4 py-2 shadow-md">
          <button 
            onClick={() => onUpdateQuantity(cartItemId, -1)}
            className="w-6 h-6 flex items-center justify-center font-black text-lg active:scale-90"
          >
            -
          </button>
          <span className="font-display text-md min-w-[20px] text-center">{quantity}</span>
          <button 
            onClick={() => onUpdateQuantity(cartItemId, 1)}
            className="w-6 h-6 flex items-center justify-center font-black text-lg active:scale-90"
          >
            +
          </button>
        </div>
      ) : (
        <button 
          onClick={() => onAdd({ id: cartItemId, name, price, quantity: 1 })}
          className="px-6 py-2 bg-secondary text-white rounded-xl font-display text-sm active:scale-95 transition-transform"
        >
          ADD
        </button>
      )}
    </div>
  );
}

// --- Success Screen ---
function SuccessScreen({ summary, orderId, orderNo }: { summary: CartItem[], orderId: string, orderNo?: string }) {
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
        <p className="font-bold text-slate-500 bg-white/50 px-4 py-1 rounded-full inline-block">
          Order {orderNo ? `#${orderNo}` : orderId ? `#${orderId.slice(0, 8)}` : '#0001'}
        </p>
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

      <div className="w-full space-y-3">
        <button 
          onClick={() => navigate('/orders')}
          className="w-full funky-btn-primary h-14 flex items-center justify-center gap-2"
        >
          Track My Order
          <Clock className="w-5 h-5" />
        </button>
        <button 
          onClick={() => navigate('/')}
          className="w-full h-14 rounded-2xl font-display text-secondary tracking-wider active:scale-95 transition-transform"
        >
          Back to Home
        </button>
      </div>

    </motion.div>
  );
}

// --- User Orders Screen ---
function UserOrdersScreen({ currentUser, kitchens, onLogout }: { currentUser: UserProfile | null, kitchens: Kitchen[], onLogout: () => void }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }

    fetchOrders();

    // Subscribe to real-time updates for user's orders
    const channel = supabase
      .channel('user-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `customer_phone=eq.${currentUser.phone}`
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  const fetchOrders = async () => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_phone', currentUser.phone)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setOrders(data.map(o => ({
          id: o.id,
          dailyOrderNo: o.daily_order_no,
          kitchen_id: o.kitchen_id,
          customerName: o.customer_name,
          customerPhone: o.customer_phone,
          items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
          total: o.total,
          status: o.status,
          time: new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date(o.created_at).getTime(),
          address: o.address
        })));
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'text-yellow-500 bg-yellow-50';
      case 'preparing': return 'text-blue-500 bg-blue-50';
      case 'on-the-way': return 'text-purple-500 bg-purple-50';
      case 'delivered': return 'text-green-500 bg-green-50';
      case 'cancelled': return 'text-red-500 bg-red-50';
      default: return 'text-slate-400 bg-slate-50';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 overflow-y-auto no-scrollbar bg-bg-app flex flex-col"
    >
      <header className="px-6 pt-8 pb-4 flex items-center gap-4 sticky top-0 bg-bg-app z-10">
        <button onClick={() => navigate('/')} className="p-2 bg-white shadow-lg rounded-full text-secondary active:scale-90 transition-transform">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="font-display text-2xl text-secondary">My Orders</h1>
      </header>

      <div className="flex-1 px-6 pb-20">
        {loading ? (
          <div className="space-y-4 pt-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 skeleton rounded-[32px] w-full" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-slate-300">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <div>
              <p className="font-display text-xl text-secondary">No orders yet</p>
              <p className="text-slate-400 font-bold text-sm">Delicious food is just a few clicks away!</p>
            </div>
            <button 
              onClick={() => navigate('/')}
              className="px-8 py-3 bg-primary text-white rounded-2xl font-display tracking-wider active:scale-95 transition-transform"
            >
              Order Now
            </button>
          </div>
        ) : (
          <div className="space-y-4 pt-4 pb-10">
            {orders.map(order => {
              const kitchen = kitchens.find(k => k.id === order.kitchen_id);
              return (
                <div key={order.id} className="bg-white rounded-[32px] p-6 shadow-xl shadow-ink/5 border border-slate-100 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div 
                      onClick={() => kitchen && navigate(`/kitchen/${kitchen.slug}`)}
                      className="flex gap-3 cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-2xl overflow-hidden border border-slate-100 group-active:scale-95 transition-transform">
                        <img src={kitchen?.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'} className="w-full h-full object-cover" alt="kitchen" />
                      </div>
                      <div>
                        <h3 className="font-display text-lg text-secondary leading-none mb-1 group-hover:text-primary transition-colors">{kitchen?.name || 'Kitchen'}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                          {order.dailyOrderNo ? `#${order.dailyOrderNo}` : `#${order.id.slice(0, 8)}`} • {order.time}
                        </p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                      {order.status.replace('-', ' ')}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start text-sm">
                        <div className="flex flex-col">
                          <span className="text-slate-700 font-bold">{item.quantity} × {item.name}</span>
                          {item.options && (
                            <span className="text-[10px] font-medium text-slate-400 leading-tight mt-0.5">
                              {[item.options.drySabji, item.options.gravySabji, item.options.withRice ? 'With Rice' : 'No Rice']
                                .filter(Boolean)
                                .join(' • ')}
                            </span>
                          )}
                        </div>
                        <span className="text-secondary font-display shrink-0 ml-4">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-dashed border-slate-100 flex justify-between items-center">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Amount Paid</span>
                      <span className="text-xl font-display text-secondary leading-none">₹{order.total}</span>
                   </div>
                   {order.status === 'on-the-way' && (
                     <div className="flex items-center gap-2 text-primary font-bold text-xs animate-pulse">
                       <Clock className="w-4 h-4" />
                       Arriving Soon
                     </div>
                   )}
                  </div>
                </div>
              );
            })}

            <button 
              onClick={onLogout}
              className="w-full py-4 mt-4 bg-white border-2 border-red-50 text-red-500 rounded-[28px] font-display tracking-widest text-sm active:scale-95 transition-transform shadow-sm"
            >
              LOGOUT ACCOUNT
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// --- Admin Section ---
// Helper Components for Admin Screen
interface HistoryOrderCardProps {
  order: Order;
  onView: (order: Order) => void;
  key?: React.Key;
}

function HistoryOrderCard({ order, onView }: HistoryOrderCardProps) {
  return (
    <div className="bg-white border-2 border-slate-50 p-4 rounded-2xl opacity-80 grayscale-[0.3] hover:grayscale-0 transition-all">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1 mb-1">
            <Clock className="w-2.5 h-2.5" /> {order.time}
          </p>
          <h4 className="font-display text-lg text-secondary leading-tight">
            {order.dailyOrderNo ? `#${order.dailyOrderNo}` : `#${order.id.slice(0, 8)}`}
          </h4>
          <p className="text-[10px] font-bold text-slate-500">{order.customerName}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-primary text-xl leading-none mb-1 text-slate-400">₹{order.total}</p>
          <button 
            onClick={() => onView(order)} 
            className="text-[9px] font-black text-secondary uppercase tracking-widest hover:underline px-2 py-1 bg-slate-50 rounded-lg"
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminScreen() {
  const navigate = useNavigate();
  const [adminStep, setAdminStep] = useState<'PHONE' | 'OTP' | 'DASHBOARD'>(() => {
    const saved = localStorage.getItem('kitchen_admin_authenticated');
    return saved === 'true' ? 'DASHBOARD' : 'PHONE';
  });
  const [adminPhone, setAdminPhone] = useState(() => localStorage.getItem('kitchen_admin_phone') || '');
  const [error, setError] = useState('');
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [adminOtp, setAdminOtp] = useState(['', '', '', '']);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'history' | 'stats'>('orders');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [currentKitchenId, setCurrentKitchenId] = useState<string | null>(null);
  const [currentKitchenName, setCurrentKitchenName] = useState('My Kitchen');
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [isMenuLoading, setIsMenuLoading] = useState(false);
  const [isKitchenOpen, setIsKitchenOpen] = useState(true);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  useEffect(() => {
    if (adminStep === 'DASHBOARD') {
      document.title = `${currentKitchenName} Dashboard | STUVA Admin`;
    } else {
      document.title = 'Kitchen Admin | STUVA';
    }
  }, [adminStep, currentKitchenName]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
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

  const handleAdminAuthSuccess = () => {
    localStorage.setItem('kitchen_admin_authenticated', 'true');
    localStorage.setItem('kitchen_admin_phone', adminPhone);
    setAdminStep('DASHBOARD');
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('kitchen_admin_authenticated');
    localStorage.removeItem('kitchen_admin_phone');
    setAdminStep('PHONE');
    setShowAdminMenu(false);
  };

  const handlePhoneSubmit = async () => {
    if (adminPhone.length !== 10) return;
    setIsCheckingPhone(true);
    setError('');
    
    try {
      const { data, error } = await supabase
        .from('kitchen_admins')
        .select('phone, kitchens(name)')
        .eq('phone', adminPhone)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        if (data.kitchens) {
          setCurrentKitchenName((data.kitchens as any).name);
        }
        setAdminStep('OTP');
      } else {
        setError('Unauthorized! This number is not registered as a Kitchen Admin.');
      }
    } catch (err) {
      console.error('Error checking admin:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsCheckingPhone(false);
    }
  };

  const updateOrderStatus = async (orderId: string, nextStatus: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: nextStatus })
        .eq('id', orderId);
      
      if (error) throw error;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  useEffect(() => {
    let channel: any;
    
    if (adminStep === 'DASHBOARD' && currentKitchenId) {
      // One-time cleanup for old orders (older than 2 days) to keep DB clean and performance high
      const cleanupOldOrders = async () => {
        try {
          const twoDaysAgoIso = new Date(Date.now() - (2 * 24 * 60 * 60 * 1000)).toISOString();
          await supabase
            .from('orders')
            .delete()
            .eq('kitchen_id', currentKitchenId)
            .lt('created_at', twoDaysAgoIso);
        } catch (e) {
          console.warn("Minor cleanup error:", e);
        }
      };
      
      cleanupOldOrders();
      fetchAdminOrders(currentKitchenId);
      
      // Real-time subscription for new orders
      channel = supabase
        .channel('public:orders')
        .on(
          'postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'orders',
            filter: `kitchen_id=eq.${currentKitchenId}`
          }, 
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newOrder = mapOrder(payload.new);
              setOrders(prev => {
                // Prevent duplicate orders from race conditions
                if (prev.some(o => o.id === newOrder.id)) return prev;
                return [newOrder, ...prev];
              });
              // Play a subtle notification sound for new orders if needed
            } else if (payload.eventType === 'UPDATE') {
              setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...mapOrder(payload.new) } : o));
            } else if (payload.eventType === 'DELETE') {
              setOrders(prev => prev.filter(o => o.id !== payload.old.id));
            }
          }
        )
        .subscribe((status) => {
          setIsRealtimeConnected(status === 'SUBSCRIBED');
        });
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [adminStep, currentKitchenId]);

  const mapOrder = (dbOrder: any): Order => ({
    id: dbOrder.id,
    dailyOrderNo: dbOrder.daily_order_no,
    kitchen_id: dbOrder.kitchen_id,
    customerName: dbOrder.customer_name,
    customerPhone: dbOrder.customer_phone,
    total: dbOrder.total,
    status: dbOrder.status,
    time: new Date(dbOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: new Date(dbOrder.created_at).getTime(),
    items: dbOrder.items,
    address: dbOrder.address
  });

  const fetchAdminOrders = async (kitchenId: string) => {
    setIsOrdersLoading(true);
    try {
      // Fetch current orders - cleanup is now handled in useEffect for better performance
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('kitchen_id', kitchenId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) {
        setOrders(data.map(mapOrder));
      }
    } catch (err) {
      console.error('Error fetching admin orders:', err);
    } finally {
      setIsOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (adminStep === 'DASHBOARD') {
      fetchAdminContext();
    }
  }, [adminStep]);

  const fetchAdminContext = async () => {
    if (!adminPhone) return;
    try {
      const cleanPhone = adminPhone.slice(-10);
      
      // 1. Try to get kitchen ID for this phone with is_active
      let data: any[] | null = null;
      let error: any = null;
      
      const result = await supabase
        .from('kitchen_admins')
        .select('kitchen_id, phone, kitchens(name, is_active)');
      
      if (result.error && (result.error.code === '42703' || result.error.message.includes('is_active'))) {
        // Fallback fetch without status if column is missing (though is_active should exist)
        const fallback = await supabase
          .from('kitchen_admins')
          .select('kitchen_id, phone, kitchens(name)');
        data = fallback.data;
        error = fallback.error;
      } else {
        data = result.data;
        error = result.error;
      }
      
      if (error) throw error;
      
      // Manual filter for phone to handle different storage formats (+91 prefix etc)
      const adminData = data?.find(a => {
        const dbPhone = String(a.phone || '').replace(/\D/g, '');
        return dbPhone.endsWith(cleanPhone);
      });
      
      if (adminData) {
        setCurrentKitchenId(adminData.kitchen_id);
        if (adminData.kitchens) {
          const k = Array.isArray(adminData.kitchens) ? adminData.kitchens[0] : adminData.kitchens;
          if (k) {
            setCurrentKitchenName(k.name);
            setIsKitchenOpen((k as any).is_active ?? true);
          }
        }
        // Use Promise.all for parallel fetching to improve performance
        await Promise.all([
          fetchAdminMenuItems(adminData.kitchen_id),
          fetchAdminOrders(adminData.kitchen_id)
        ]);
      } else {
        console.error('No admin found for matched phone');
        setError("Admin access failed. Please re-login.");
      }
    } catch (err: any) {
      // Only log if it's not a common expected error we handled
      if (err.code !== '42703') {
        console.error('Error fetching admin context:', err);
      }
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

  const toggleKitchenStatus = async () => {
    if (!currentKitchenId || isStatusUpdating) return;
    setIsStatusUpdating(true);
    try {
      const newStatus = !isKitchenOpen;
      const { error } = await supabase
        .from('kitchens')
        .update({ is_active: newStatus })
        .eq('id', currentKitchenId);
      
      if (error) {
        if (error.code === '42703' || error.message.includes('is_active')) {
          setError("Feature unavailable: Database status column error.");
          return;
        }
        throw error;
      }
      setIsKitchenOpen(newStatus);
    } catch (err) {
      console.error('Error toggling kitchen status:', err);
    } finally {
      setIsStatusUpdating(false);
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

  const isToday = (timestamp: number) => {
    const d = new Date(timestamp);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  };

  const isYesterday = (timestamp: number) => {
    const d = new Date(timestamp);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return d.getDate() === yesterday.getDate() &&
           d.getMonth() === yesterday.getMonth() &&
           d.getFullYear() === yesterday.getFullYear();
  };

  const activeOrders = orders.filter(o => 
    o.status !== 'delivered' && 
    o.status !== 'cancelled' && 
    isToday(o.timestamp)
  );

  const historyOrders = orders.filter(o => {
    const isRelevant = (o.status === 'delivered' || o.status === 'cancelled' || !isToday(o.timestamp));
    if (!isRelevant) return false;
    
    // Only last 2 days
    const isRecent = isToday(o.timestamp) || isYesterday(o.timestamp);
    if (!isRecent) return false;

    if (!historySearch) return true;
    const searchMatch = o.id.includes(historySearch) || o.customerPhone.includes(historySearch) || o.customerName.toLowerCase().includes(historySearch.toLowerCase());
    return searchMatch;
  });

  const groupedHistory = useMemo(() => {
    return {
      today: historyOrders.filter(o => isToday(o.timestamp)),
      yesterday: historyOrders.filter(o => isYesterday(o.timestamp))
    };
  }, [historyOrders]);

  const stats = useMemo(() => {
    const todayOrders = orders.filter(o => isToday(o.timestamp));
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
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center"
                >
                  <p className="text-red-500 text-xs font-bold leading-relaxed">{error}</p>
                </motion.div>
              )}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 px-1">Admin Number</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">+91</span>
                  <input 
                    type="tel" 
                    maxLength={10}
                    value={adminPhone}
                    onChange={(e) => {
                      setAdminPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                      setError('');
                    }}
                    placeholder="9060557296" 
                    className="w-full bg-white border-2 border-slate-50 shadow-sm rounded-2xl py-4 pl-14 pr-6 focus:ring-4 focus:ring-primary/10 text-sm font-bold outline-none transition-all" 
                  />
                </div>
              </div>
              <button 
                onClick={handlePhoneSubmit}
                disabled={adminPhone.length !== 10 || isCheckingPhone}
                className="w-full funky-btn-primary h-16 text-lg disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-2"
              >
                {isCheckingPhone ? (
                  <>
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Verifying...
                  </>
                ) : (
                  <>
                    Send Secret Code
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
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
                onClick={handleAdminAuthSuccess}
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
          <button 
            onClick={toggleKitchenStatus}
            disabled={isStatusUpdating}
            className={`flex items-center gap-2 group transition-opacity ${isStatusUpdating ? 'opacity-50' : 'opacity-100'}`}
          >
            <span className="font-display text-lg text-secondary">{currentKitchenName}</span>
            <div className={`w-2 h-2 rounded-full ${isKitchenOpen ? 'bg-green-500 animate-pulse' : 'bg-red-50'}`} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${isKitchenOpen ? 'text-green-600' : 'text-slate-400'}`}>
              {isKitchenOpen ? 'Open' : 'Closed'}
            </span>
          </button>
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
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Shop Status</span>
                  <span className={`text-[9px] font-black uppercase ${isKitchenOpen ? 'text-green-500' : 'text-red-500'}`}>
                    {isKitchenOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
                <button 
                  onClick={toggleKitchenStatus}
                  disabled={isStatusUpdating}
                  className={`w-full h-10 rounded-xl transition-all relative flex items-center px-1 ${isKitchenOpen ? 'bg-green-500 shadow-lg shadow-green-500/20' : 'bg-slate-200'}`}
                >
                  <div className={`w-8 h-8 rounded-lg bg-white shadow-sm transition-all flex items-center justify-center ${isKitchenOpen ? 'ml-auto' : 'ml-0'}`}>
                    <Store className={`w-4 h-4 ${isKitchenOpen ? 'text-green-500' : 'text-slate-400'}`} />
                  </div>
                </button>
              </div>

              <div className="h-px bg-slate-100 my-1" />
              <button 
                onClick={handleAdminLogout}
                className="w-full px-4 py-3 flex items-center gap-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
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
            <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-green-50 px-2 py-0.5 rounded-full z-10">
              <div className={`w-1.5 h-1.5 rounded-full ${isRealtimeConnected ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
              <span className={`text-[7px] font-black uppercase ${isRealtimeConnected ? 'text-green-600' : 'text-slate-400'} tracking-widest`}>
                {isRealtimeConnected ? 'Live Sync' : 'Connecting...'}
              </span>
            </div>
            <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
              <ShoppingBag className="w-12 h-12" />
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Now</p>
            <p className="text-2xl font-display text-secondary">{activeOrders.length}</p>
            <div className="mt-2 w-full bg-slate-50 h-1 rounded-full overflow-hidden">
              <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (activeOrders.length / 5) * 100)}%` }} />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-3xl border-2 border-slate-50 min-w-[140px] shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Delivered</p>
            <p className="text-2xl font-display text-green-600">{orders.filter(o => o.status === 'delivered' && isToday(o.timestamp)).length}</p>
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
                {isOrdersLoading ? (
                  [1, 2].map(i => <OrderCardSkeleton key={i} />)
                ) : activeOrders.filter(o => o.status === 'pending').length > 0 ? (
                  activeOrders.filter(o => o.status === 'pending').map(order => (
                    <div key={order.id}>
                      <AdminOrderCard order={order} onUpdate={updateOrderStatus} onView={setSelectedOrder} />
                    </div>
                  ))
                ) : (
                  <p className="text-center py-4 text-xs font-bold text-slate-300 italic">No new arrivals today</p>
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
                {isOrdersLoading ? (
                  [1].map(i => <OrderCardSkeleton key={i} />)
                ) : activeOrders.filter(o => o.status === 'preparing').length > 0 ? (
                  activeOrders.filter(o => o.status === 'preparing').map(order => (
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
                {activeOrders.filter(o => o.status === 'on-the-way').length > 0 ? (
                  activeOrders.filter(o => o.status === 'on-the-way').map(order => (
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
              <div className="flex items-center gap-1.5 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] whitespace-nowrap">delivered today</span>
                <div className="flex-1 h-px border-t-2 border-dashed border-slate-100" />
              </div>
              <div className="space-y-4">
                {isOrdersLoading ? (
                  [1, 2].map(i => <OrderCardSkeleton key={i} />)
                ) : groupedHistory.today.length > 0 ? (
                  groupedHistory.today.map(order => (
                    <div key={order.id}>
                      <AdminOrderCard order={order} onUpdate={updateOrderStatus} onView={setSelectedOrder} />
                    </div>
                  ))
                ) : (
                  <p className="text-center py-4 text-xs font-bold text-slate-300 italic">No completions today yet</p>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === 'history' ? (
          <div className="space-y-6 pb-20">
            <div className="relative group">
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

            {/* Today's History */}
            {groupedHistory.today.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Today</span>
                  <div className="flex-1 h-px bg-primary/10" />
                </div>
                <div className="space-y-3">
                  {groupedHistory.today.map(order => (
                    <HistoryOrderCard key={order.id} order={order} onView={setSelectedOrder} />
                  ))}
                </div>
              </div>
            )}

            {/* Yesterday's History */}
            {groupedHistory.yesterday.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Yesterday</span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>
                <div className="space-y-3">
                  {groupedHistory.yesterday.map(order => (
                    <HistoryOrderCard key={order.id} order={order} onView={setSelectedOrder} />
                  ))}
                </div>
              </div>
            )}

            {historyOrders.length === 0 && (
              <div className="py-20 text-center flex flex-col items-center gap-4">
                 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                    <Clock className="w-8 h-8" />
                 </div>
                 <p className="text-sm font-bold text-slate-300 italic">No order history for last 2 days</p>
              </div>
            )}
          </div>
        ) : activeTab === 'menu' ? (
          <div className="space-y-6 pb-20">
             {/* Header */}
             <div className="flex justify-between items-center mb-6 px-1">
               <div>
                  <h2 className="font-display text-2xl text-secondary">Kitchen Menu</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Manage items & availability</p>
               </div>
             </div>

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
                     [1, 2].map(i => (
                       <div key={i} className="funky-card p-5 flex justify-between items-center bg-white">
                          <div className="space-y-2 flex-1">
                            <div className="h-4 w-32 skeleton" />
                            <div className="h-3 w-16 skeleton" />
                          </div>
                          <div className="w-12 h-6 skeleton rounded-full" />
                       </div>
                     ))
                   ) : (
                     <>
                        {menuItems.filter(i => i.category === section.cat).map(item => (
                          <div key={item.id} className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-50 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0 mr-4">
                                <div className="flex items-center gap-2">
                                  <input 
                                     type="text" value={item.name} 
                                     onChange={e => updateItemName(item.id, e.target.value)}
                                     className="font-display text-base text-secondary bg-transparent outline-none w-full truncate"
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
                              <div className="flex items-center gap-3 shrink-0">
                                {section.cat !== 'thali' && (
                                  <button 
                                    onClick={() => deleteItem(item.id)}
                                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-50 text-red-500 active:scale-95 transition-all hover:bg-red-100"
                                  >
                                     <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                                <button 
                                  onClick={() => toggleMenuItem(item.id)}
                                  className={`w-12 h-6 rounded-full transition-all relative shadow-inner ${item.available ? 'bg-primary' : 'bg-slate-200'}`}
                                >
                                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${item.available ? 'left-7' : 'left-1'}`} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        {menuItems.filter(i => i.category === section.cat).length === 0 && (
                          <div className="py-10 text-center border-2 border-dashed border-slate-50 rounded-[28px] opacity-40">
                             <p className="text-[10px] font-black uppercase tracking-[0.2em]">No items in {section.title}</p>
                          </div>
                        )}
                     </>
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

      <OrderDetailsSheet 
        order={selectedOrder} 
        onClose={() => setSelectedOrder(null)} 
        onUpdate={updateOrderStatus}
      />
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
             <span className="font-display text-xl text-secondary">
               {order.dailyOrderNo ? `#${order.dailyOrderNo}` : `#${order.id.slice(0, 8)}`}
             </span>
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
        {order.status === 'pending' && (
          <button 
            onClick={() => {
              if (window.confirm("Cancel this order?")) onUpdate(order.id, 'cancelled');
            }} 
            className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-100 transition-colors shrink-0"
            title="Cancel Order"
          >
            <Trash2 className="w-5 h-5" />
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
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700'
  };
  return (
    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${styles[status]}`}>
      {status.replace('-', ' ')}
    </span>
  );
}

function OrderDetailsSheet({ order, onClose, onUpdate }: { order: Order | null, onClose: () => void, onUpdate: (id: string, status: Order['status']) => void }) {
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
                 <p className="text-slate-400 font-bold">
                  {order.dailyOrderNo ? `#${order.dailyOrderNo}` : `#${order.id.slice(0, 8)}`} • {order.time}
                </p>
               </div>
               <button onClick={onClose} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center transition-transform active:scale-95"><Plus className="rotate-45 text-slate-400" /></button>
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

             <div className="flex gap-4">
               <button 
                 className="flex-1 bg-slate-100 text-slate-500 h-16 rounded-3xl font-display text-lg active:scale-95 transition-transform"
                 onClick={onClose}
               >
                 Back
               </button>
               {order.status === 'pending' && (
                 <button 
                   onClick={() => { onUpdate(order.id, 'preparing'); onClose(); }} 
                   className="flex-[2] bg-primary text-white h-16 rounded-3xl font-display text-lg shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center text-center"
                 >
                   Accept Order
                 </button>
               )}
               {order.status === 'preparing' && (
                 <button 
                   onClick={() => { onUpdate(order.id, 'on-the-way'); onClose(); }} 
                   className="flex-[2] bg-blue-600 text-white h-16 rounded-3xl font-display text-lg shadow-xl shadow-blue/20 active:scale-95 transition-all flex items-center justify-center text-center"
                 >
                   Send Out
                 </button>
               )}
               {order.status === 'on-the-way' && (
                 <button 
                   onClick={() => { onUpdate(order.id, 'delivered'); onClose(); }} 
                   className="flex-[2] bg-secondary text-white h-16 rounded-3xl font-display text-lg shadow-xl shadow-secondary/20 active:scale-95 transition-all flex items-center justify-center text-center"
                 >
                   Delivered
                 </button>
               )}
             </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
