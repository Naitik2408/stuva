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
  const [orderSummary, setOrderSummary] = useState<CartItem[]>([]);
  const [isReturningUser, setIsReturningUser] = useState(false);

  const placeOrder = () => {
    setOrderSummary([...cart]);
    setCart([]);
    setShowCheckout(false);
    setIsReturningUser(true);
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
                    onCheckout={() => setShowCheckout(true)}
                  />
                } 
              />
              <Route path="/success" element={<SuccessScreen summary={orderSummary} />} />
            </Routes>
          </motion.div>
        </AnimatePresence>

        {/* Checkout Bottom Sheet */}
        <AnimatePresence>
          {showCheckout && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCheckout(false)}
                className="absolute inset-0 bg-black/60 z-40"
              />
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute bottom-0 left-0 right-0 bg-white rounded-t-sheet z-50 p-6 shadow-2xl"
              >
                <div className="sheet-handle" />
                <h2 className="text-xl font-bold mb-1">Verify Order</h2>
                <p className="text-[#666] mb-6 font-medium text-sm">Enter details to confirm delivery</p>
                
                <div className="space-y-4 mb-8">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Phone Number</label>
                    <div className="relative">
                      < Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        defaultValue={isReturningUser ? "+91 91234 56789" : ""}
                        placeholder="+91 98765 43210" 
                        className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 text-sm font-medium"
                      />
                    </div>
                  </div>
                  
                  {!isReturningUser && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="space-y-1.5"
                    >
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="John Doe" 
                          className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 text-sm font-medium"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 mb-8">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold text-primary">Order Total</span>
                    <span className="text-lg font-bold text-slate-900">₹{cartTotal}</span>
                  </div>
                </div>

                <button 
                  onClick={placeOrder}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/30 active:scale-95 transition-transform"
                >
                  Place My Order
                  <ArrowRight className="w-5 h-5" />
                </button>
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

// --- Category Bar ---
function CategoryBar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || 'All';

  const categories = [
    { name: 'All', emoji: '🍽️' },
    { name: 'Soups', emoji: '🥣' },
    { name: 'Salads', emoji: '🥗' },
    { name: 'Noodles', emoji: '🍜' },
    { name: 'Rice', emoji: '🍚' },
    { name: 'Pastry', emoji: '🍰' },
  ];

  return (
    <div className="flex gap-4 overflow-x-auto no-scrollbar px-6 mb-8 mt-2">
      {categories.map(cat => (
        <button 
          key={cat.name} 
          onClick={() => {
            if (cat.name === 'All') {
              searchParams.delete('category');
            } else {
              searchParams.set('category', cat.name);
            }
            setSearchParams(searchParams);
          }}
          className="flex flex-col items-center gap-2 flex-shrink-0 outline-none"
        >
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all shadow-sm ${activeCategory === cat.name ? 'bg-amber-400 rotate-6 scale-110' : 'bg-white border border-slate-50'}`}>
            {cat.emoji}
          </div>
          <span className={`text-[11px] font-bold uppercase tracking-wider ${activeCategory === cat.name ? 'text-primary' : 'text-slate-400'}`}>
            {cat.name}
          </span>
        </button>
      ))}
    </div>
  );
}

// --- Home Screen ---
function HomeScreen() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const category = searchParams.get('category');
  const query = searchParams.get('q')?.toLowerCase() || '';

  const filteredKitchens = KITCHENS.filter(k => {
    const matchesCategory = !category || k.description.toLowerCase().includes(category.toLowerCase()) || category === 'All';
    const matchesQuery = !query || k.name.toLowerCase().includes(query) || k.description.toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
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
      <CategoryBar />

      <main className="px-6 space-y-8 pb-12">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl text-secondary">
              {category ? `${category}` : 'Recommended'}
            </h2>
            <button 
              onClick={() => navigate('/')} 
              className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
            >
              Reset
            </button>
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
        <div className="absolute top-2 left-2 bg-primary text-white font-display text-[11px] px-2 py-1 rounded-lg shadow-sm">
          25$
        </div>
        <button className="absolute top-2 right-2 w-7 h-7 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
          <Heart className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex-1 flex flex-col">
        <div className="p-3 flex-1">
          <h3 className="font-display text-[15px] text-primary group-hover:text-ink transition-colors leading-tight">{kitchen.name}</h3>
          <p className="text-[10px] text-slate-400 font-medium mt-1 line-clamp-1">{kitchen.description}</p>
        </div>
        <div className="bg-secondary flex items-center justify-between px-3 py-2">
           <span className="text-white/60 font-bold text-[10px] uppercase">Details</span>
           <button className="w-6 h-6 bg-primary text-white rounded-lg flex items-center justify-center active:scale-90 transition-transform">
             <Plus className="w-4 h-4" strokeWidth={3} />
           </button>
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
  onCheckout 
}: { 
  onAddToCart: (item: CartItem) => void;
  cart: CartItem[];
  updateQuantity: (id: string, delta: number) => void;
  onCheckout: () => void;
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
        <button className="p-2 bg-white shadow-xl rounded-full text-secondary active:scale-90 transition-transform border border-slate-100">
          <Heart className="w-5 h-5" />
        </button>
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
        <div className="bg-white p-6 rounded-[32px] shadow-xl shadow-ink/5 space-y-4 border-b-4 border-slate-100">
          <div className="flex justify-between items-start">
            <h1 className="st-title text-3xl">{kitchen.name}</h1>
            <div className="bg-primary text-white font-display px-3 py-1 rounded-xl text-lg">25$</div>
          </div>
          <p className="st-subtitle font-bold text-sm">650g</p>
          <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
            Grapes, figs, cheese, eggs, olives, black olives, grapefruit, ham, almonds
          </p>
          
          <div className="pt-4 space-y-4">
            <h3 className="font-display text-lg text-secondary">Nutritional value per 100 g</h3>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Proteins', val: '9 g' },
                { label: 'Carbs', val: '14 g' },
                { label: 'Energy', val: '146 kcal' },
                { label: 'Fats', val: '6 g' },
              ].map(stat => (
                <div key={stat.label}>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter line-clamp-1">{stat.label}</p>
                  <p className="text-[12px] font-black text-secondary">{stat.val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-4">
           <div className="flex-1 bg-white rounded-2xl p-2 flex items-center justify-between border border-slate-100 shadow-sm">
             <button className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-bold active:bg-slate-200">-</button>
             <span className="font-display text-xl text-primary">2</span>
             <button className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-900 font-bold active:bg-slate-200">+</button>
           </div>
           <button 
             onClick={() => onAddToCart({ id: 'sample', name: kitchen.name, price: 25, quantity: 1 })}
             className="flex-[2] funky-btn-primary h-14 flex items-center justify-center"
           >
             Add to cart
           </button>
        </div>

        {/* Section: Simple Thali configuration (Adapted to funky theme) */}
        <div className="space-y-6">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest px-1">Customize</p>
            <h2 className="font-display text-2xl text-secondary">Build your thali</h2>
          </div>
          
          <ThaliCard 
            badge="FUNKY"
            title="House Special" 
            price={120} 
            description="The most energetic combo in the menu."
            image="https://images.unsplash.com/photo-1626777552726-4a6b52c67ad5?auto=format&fit=crop&q=80&w=400"
            onAdd={(options) => onAddToCart({ id: 'thali-p', name: 'House Special', price: 120, quantity: 1, options })}
          />
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
              <div className="flex items-center gap-1 font-display text-md uppercase tracking-widest text-primary">
                GO!
                <span className="text-2xl leading-none">›</span>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- Funky Thali Card ---
function ThaliCard({ 
  badge,
  title, 
  price, 
  description,
  image,
  onAdd 
}: { 
  badge: string;
  title: string; 
  price: number; 
  description: string;
  image: string;
  onAdd: (opt: any) => void 
}) {
  const [withRice, setWithRice] = useState(true);
  const [drySabji, setDrySabji] = useState('Aloo Gobi');

  return (
    <div className="funky-card p-6 space-y-6 relative border-b-8 border-primary/5">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-[28px] overflow-hidden flex-shrink-0 relative border-4 border-bg-app">
          <img src={image} className="w-full h-full object-cover" alt={title} />
          <div className="absolute -top-1 -left-1 bg-amber-400 text-[8px] font-black px-2 py-1 rounded-br-2xl text-ink uppercase rotate-[-5deg]">
            {badge}
          </div>
        </div>
        <div className="flex-1">
          <h3 className="font-display text-xl text-secondary">{title}</h3>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">{description}</p>
          <p className="font-display text-primary text-lg mt-1">₹{price}</p>
        </div>
      </div>

      <div className="space-y-6">
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
             NO RICE
           </button>
        </div>

        <div className="space-y-3">
           <span className="text-[10px] font-black text-secondary tracking-widest uppercase opacity-40 px-1">Curry of the day</span>
           <div className="flex flex-wrap gap-2">
             {['Aloo Gobi', 'Bhindi', 'Special Veg'].map(s => (
               <button 
                 key={s} 
                 onClick={() => setDrySabji(s)}
                 className={`px-5 py-2 rounded-2xl text-[12px] font-bold transition-all ${drySabji === s ? 'bg-primary text-white shadow-lg' : 'bg-white border border-slate-100 text-slate-400 hover:bg-slate-50'}`}
               >
                 {s}
               </button>
             ))}
           </div>
        </div>

        <button 
          onClick={() => onAdd({ withRice, drySabji })}
          className="w-full funky-btn-secondary py-4"
        >
          Add to bag
        </button>
      </div>
    </div>
  );
}

// --- Simple Item Component ---
function SimpleItem({ 
  id, 
  name, 
  price, 
  description,
  image,
  onAdd, 
  onUpdate, 
  cartItem 
}: { 
  id: string; 
  name: string; 
  price: number; 
  description: string;
  image: string;
  onAdd: () => void;
  onUpdate: (id: string, d: number) => void;
  cartItem?: CartItem;
}) {
  return (
    <div className="flex items-center gap-4 py-2">
      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-slate-50 border border-slate-100 transition-transform active:scale-95">
        <img src={image} className="w-full h-full object-cover" alt={name} />
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-[14px] text-slate-800">{name}</h4>
        <p className="text-[11px] text-slate-400 font-medium mb-1">{description}</p>
        <p className="text-[13px] font-bold text-slate-900">₹{price}</p>
      </div>
      
      {cartItem ? (
        <div className="flex items-center gap-3 bg-primary/10 px-2 py-1.5 rounded-xl">
          <button onClick={() => onUpdate(id, -1)} className="p-1 bg-white rounded-lg shadow-sm active:scale-90 transition-transform">
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="font-black text-[12px] w-4 text-center text-primary">{cartItem.quantity}</span>
          <button onClick={() => onUpdate(id, 1)} className="p-1 bg-white rounded-lg shadow-sm active:scale-90 transition-transform">
            <Plus className="w-3.5 h-3.5 text-primary" />
          </button>
        </div>
      ) : (
        <button 
          onClick={onAdd}
          className="px-5 py-2 border border-primary text-primary rounded-xl font-black text-[11px] uppercase tracking-widest active:scale-95 transition-transform"
        >
          Add
        </button>
      )}
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
