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
import { useState, useMemo, useEffect, Key, ChangeEvent } from "react";
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
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  options?: any;
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
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800"
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

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
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
            className="flex-1 flex flex-col overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Routes location={location}>
              <Route path="/" element={<HomeScreen />} />
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
                        {[1, 2, 3, 4].map(i => (
                          <input 
                            key={i}
                            type="text"
                            maxLength={1}
                            className="w-14 h-16 bg-slate-50 border-2 border-slate-100 rounded-2xl text-center font-display text-2xl text-primary focus:border-primary focus:bg-white outline-none"
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
function HomeScreen() {
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
      <header className="px-6 pt-8 pb-4 flex justify-between items-start">
        <div>
          <h1 className="text-primary font-display text-4xl leading-none">Hi, Zesan</h1>
          <div className="flex items-center gap-1.5 mt-1 opacity-80">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-[12px] font-bold text-secondary uppercase tracking-tight">Riggs Road Northeast, 220</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-white border-2 border-primary/20 p-1">
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
        <p className="font-bold text-slate-500 bg-white/50 px-4 py-1 rounded-full inline-block">Order #STV-{Math.floor(Math.random() * 10000)}</p>
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

      <div className="w-full space-y-4">
        <button 
          onClick={() => navigate('/')}
          className="w-full funky-btn-secondary h-16 text-xl"
        >
          TAKE ME HOME
        </button>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Thank you for choosing STUVA</p>
      </div>
    </motion.div>
  );
}
