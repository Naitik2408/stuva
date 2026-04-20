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
  name: string;
  price: number;
  available: boolean;
  category: 'thali' | 'addon';
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
  customerName: string;
  customerPhone: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'preparing' | 'on-the-way' | 'delivered';
  time: string;
  timestamp: number; // Added for history filtering
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
      { id: 'a1', name: "Extra Roti", price: 7, available: true, category: 'addon' },
      { id: 'a2', name: "Fresh Dahi", price: 20, available: true, category: 'addon' },
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
    customerName: 'History Test',
    customerPhone: '+91 00000 00000',
    total: 150,
    status: 'delivered',
    time: 'Yesterday',
    timestamp: Date.now() - (36 * 60 * 60 * 1000), // 36 hours ago (within 2 days)
    items: [{ id: 't1', name: 'Normal Thali', price: 80, quantity: 2 }]
  },
  {
    id: 'X001',
    customerName: 'Old Order',
    customerPhone: '+91 00000 00000',
    total: 200,
    status: 'delivered',
    time: '3 Days Ago',
    timestamp: Date.now() - (4 * 24 * 60 * 60 * 1000), // 4 days ago (should be hidden in history)
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
  const [checkoutStep, setCheckoutStep] = useState<'AUTH' | 'OTP'>('AUTH');
  const [orderSummary, setOrderSummary] = useState<CartItem[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);

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

  const handleCheckoutClick = () => {
    if (isLoggedIn) {
      setOrderSummary([...cart]);
      setCart([]);
      navigate('/success');
    } else {
      setCheckoutStep('AUTH');
      setShowCheckout(true);
    }
  };

  const proceedToOtp = () => {
    setCheckoutStep('OTP');
  };

  const confirmLoginAndOrder = () => {
    setIsLoggedIn(true);
    setIsReturningUser(true);
    setOrderSummary([...cart]);
    setCart([]);
    setShowCheckout(false);
    navigate('/success');
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
              <Route path="/" element={<HomeScreen isLoggedIn={isLoggedIn} />} />
              <Route path="/admin" element={<AdminScreen />} />
                <Route 
                  path="/kitchen/:slug" 
                  element={
                    <MenuScreen 
                      onAddToCart={addToCart}
                      cart={cart}
                      updateQuantity={updateQuantity}
                      onCheckout={handleCheckoutClick}
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
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                            <input 
                              type="text" 
                              defaultValue={isReturningUser ? "+91 91234 56789" : ""}
                              placeholder="+91 98765 43210" 
                              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 text-sm font-bold outline-none"
                            />
                          </div>
                        </div>
                        
                        {!isReturningUser && (
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 px-1">Full Name</label>
                            <div className="relative">
                              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                              <input 
                                type="text" 
                                placeholder="Zesan" 
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 text-sm font-bold outline-none"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <button 
                        onClick={proceedToOtp}
                        className="w-full funky-btn-primary h-14 flex items-center justify-center gap-2"
                      >
                        Send OTP
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="otp-step"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div>
                        <h2 className="text-2xl font-display text-secondary">Verification Tag</h2>
                        <p className="text-slate-400 font-bold text-sm">We sent a 4-digit code to your phone</p>
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

                      <div className="text-center">
                        <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">
                          Resend Code in 00:29
                        </button>
                      </div>

                      <button 
                        onClick={confirmLoginAndOrder}
                        className="w-full funky-btn-secondary h-14 flex items-center justify-center gap-2"
                      >
                        Confirm & Order
                        <ShoppingBag className="w-5 h-5" />
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
function HomeScreen({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q')?.toLowerCase() || '';

  const filteredKitchens = KITCHENS.filter(k => {
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
  onAddToCart, 
  cart, 
  updateQuantity,
  onCheckout,
  isLoggedIn
}: { 
  onAddToCart: (item: CartItem) => void;
  cart: CartItem[];
  updateQuantity: (id: string, delta: number) => void;
  onCheckout: () => void;
  isLoggedIn: boolean;
}) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const kitchen = useMemo(() => KITCHENS.find(k => k.slug === slug), [slug]);
  const [isSticky, setIsSticky] = useState(false);

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
              price={80} 
              description="3 Roti, 1 Dry Sabji, 1 Gravy Sabji, Rice"
              onAdd={(item) => onAddToCart(item)}
            />
            <ThaliCard 
              type="Special"
              price={120} 
              description="3 Roti, 1 Dry Sabji, 1 Gravy Sabji, Rice, Extra Item"
              onAdd={(item) => onAddToCart(item)}
            />
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="font-display text-xl text-secondary px-1">Add-ons</h3>
            <div className="space-y-3">
              <AddOnItem name="Extra Roti" price={7} onAdd={(item) => onAddToCart(item)} />
              <AddOnItem name="Fresh Dahi" price={20} onAdd={(item) => onAddToCart(item)} />
              <AddOnItem name="Extra Rice" price={30} onAdd={(item) => onAddToCart(item)} />
              <AddOnItem name="Aloo Paratha" price={30} onAdd={(item) => onAddToCart(item)} />
              <AddOnItem name="Onion Paratha" price={25} onAdd={(item) => onAddToCart(item)} />
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
  onAdd 
}: { 
  type: 'Normal' | 'Special';
  price: number; 
  description: string;
  onAdd: (item: CartItem) => void 
}) {
  const [withRice, setWithRice] = useState(true);
  const [drySabji, setDrySabji] = useState('Aloo Gobi');
  const [gravySabji, setGravySabji] = useState('Paneer');
  const [extraRoti, setExtraRoti] = useState(0);

  const totalPrice = price + (extraRoti * 7);
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
              {rotiCount + extraRoti} Roti {withRice && "+ Rice"}
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
             {['Aloo Gobi', 'Bhindi', 'Mix Veg'].map(s => (
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
             {['Paneer', 'Dal Fry', 'Chole'].map(s => (
               <button 
                 key={s} 
                 onClick={() => setGravySabji(s)}
                 className={`px-4 py-2 rounded-xl text-[12px] font-bold transition-all ${gravySabji === s ? 'bg-primary text-white shadow-md' : 'bg-white border border-slate-100 text-slate-400 hover:bg-slate-50'}`}
               >
                 {s}
               </button>
             ))}
           </div>
        </div>

        {/* Extra Roti */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 font-bold">
           <div className="flex flex-col">
             <span className="text-[11px] text-slate-800">Extra Roti</span>
             <span className="text-[9px] text-slate-400 uppercase tracking-tighter">₹7 per piece</span>
           </div>
           <div className="flex items-center gap-4 bg-white px-3 py-1.5 rounded-xl text-ink">
             <button onClick={() => setExtraRoti(Math.max(0, extraRoti - 1))} className="text-slate-300 active:text-primary transition-colors cursor-pointer">
               <Minus className="w-4 h-4" />
             </button>
             <span className="font-display text-lg w-4 text-center">{extraRoti}</span>
             <button onClick={() => setExtraRoti(extraRoti + 1)} className="text-primary active:scale-110 transition-all cursor-pointer">
               <Plus className="w-4 h-4" />
             </button>
           </div>
        </div>

        <button 
          onClick={() => onAdd({ 
            id: `${type.toLowerCase()}-thali-${Date.now()}`, 
            name: `${type} Thali`, 
            price: totalPrice, 
            quantity: 1, 
            options: { withRice, drySabji, gravySabji, extraRoti } 
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
  onAdd: (item: CartItem) => void 
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
  const [adminOtp, setAdminOtp] = useState(['', '', '', '']);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'history' | 'stats'>('orders');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(KITCHENS[0].menu || []);
  const [showAdminMenu, setShowAdminMenu] = useState(false);

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

  const toggleMenuItem = (id: string) => {
    setMenuItems(prev => prev.map(item => item.id === id ? { ...item, available: !item.available } : item));
  };

  const updatePrice = (id: string, newPrice: number) => {
    setMenuItems(prev => prev.map(item => item.id === id ? { ...item, price: newPrice } : item));
  };

  const twoDaysAgo = Date.now() - (2 * 24 * 60 * 60 * 1000);
  const historyOrders = orders.filter(o => o.status === 'delivered' && o.timestamp >= twoDaysAgo);
  const activeOrders = orders.filter(o => o.status !== 'delivered');

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
                <input 
                  type="tel" 
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  placeholder="+91 99999 88888" 
                  className="w-full bg-white border-2 border-slate-50 shadow-sm rounded-2xl py-4 px-6 focus:ring-4 focus:ring-primary/10 text-sm font-bold outline-none transition-all" 
                />
              </div>
              <button 
                onClick={() => setAdminStep('OTP')}
                disabled={!adminPhone}
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
        <div className="h-[60%] w-full relative">
          <img 
            src="https://images.unsplash.com/photo-1590577976322-3d2d6e2133de?auto=format&fit=crop&q=80&w=1000" 
            alt="OTP Illustration" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-app via-transparent to-transparent" />
        </div>

        <div className="flex-1 px-8 pt-6 pb-12 flex flex-col justify-between -mt-12 relative z-10 bg-bg-app rounded-t-[40px] shadow-2xl">
          <div className="space-y-6">
            <div className="text-center px-4">
              <h1 className="font-display text-4xl text-secondary leading-tight">
                Verify <span className="text-primary underline decoration-wavy underline-offset-8">Admin</span>
              </h1>
              <p className="text-slate-400 font-bold text-sm mt-3">We've sent a 4-digit code to {adminPhone}</p>
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
            <div className="p-3 bg-primary/5 rounded-2xl border border-primary/10 mb-4">
               <p className="text-[10px] font-black text-primary uppercase text-center tracking-widest">Showing orders from last 2 days</p>
            </div>
            {historyOrders.map(order => (
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
            ))}
            {historyOrders.length === 0 && <div className="py-20 text-center opacity-40 font-display">History is clear</div>}
          </div>
        ) : activeTab === 'menu' ? (
          <div className="space-y-6 pb-4">
             {/* Menu Management UI (same as before but integrated) */}
             <section className="space-y-3">
              <h3 className="font-display text-xl text-secondary">Main Thalis</h3>
              <div className="space-y-2">
                {menuItems.filter(i => i.category === 'thali').map(item => (
                  <div key={item.id} className="bg-white border-2 border-slate-50 p-4 rounded-2xl flex items-center justify-between shadow-sm">
                    <div>
                      <h4 className="font-display text-sm text-secondary">{item.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-slate-400">Price:</span>
                        <input 
                          type="number" 
                          value={item.price} 
                          onChange={(e) => updatePrice(item.id, Number(e.target.value))}
                          className="w-16 bg-slate-50 rounded-lg px-2 py-1 text-xs font-display text-primary outline-none"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={() => toggleMenuItem(item.id)}
                      className={`w-12 h-6 rounded-full transition-all relative ${item.available ? 'bg-primary' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${item.available ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
            <section className="space-y-3">
              <h3 className="font-display text-xl text-secondary">Add-ons</h3>
              <div className="grid grid-cols-2 gap-3">
                {menuItems.filter(i => i.category === 'addon').map(item => (
                  <button 
                    key={item.id}
                    onClick={() => toggleMenuItem(item.id)}
                    className={`p-4 rounded-2xl border-2 transition-all text-left ${item.available ? 'border-primary/20 bg-primary/5' : 'border-slate-100 bg-slate-50 grayscale'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-xs">🥘</div>
                      {item.available && <CheckCircle2 className="w-4 h-4 text-primary" />}
                    </div>
                    <div className="font-display text-sm text-secondary truncate">{item.name}</div>
                    <div className="font-display text-xs text-primary">₹{item.price}</div>
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="py-10 space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white p-6 rounded-3xl border-b-8 border-primary/10 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Orders</p>
                  <p className="text-4xl font-display text-primary">{orders.length}</p>
               </div>
               <div className="bg-white p-6 rounded-3xl border-b-8 border-secondary/10 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Revenue</p>
                  <p className="text-4xl font-display text-secondary">₹{orders.reduce((a,b) => a+b.total, 0)}</p>
               </div>
            </div>
            <div className="bg-white p-6 rounded-3xl space-y-4">
               <h4 className="font-display text-xl text-secondary">Kitchen Health</h4>
               <div className="space-y-3">
                 <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-slate-400">Customer Satisfaction</span>
                    <span className="text-primary">98%</span>
                 </div>
                 <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-primary w-[98%] h-full rounded-full" />
                 </div>
                 <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-slate-400">Avg Preparation Time</span>
                    <span className="text-secondary">12 mins</span>
                 </div>
               </div>
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
