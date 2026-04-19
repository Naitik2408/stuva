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
  Menu as MenuIcon
} from "lucide-react";
import { useState, useMemo, useEffect, Key } from "react";

// Types
type Screen = 'home' | 'menu' | 'success';

interface Kitchen {
  id: string;
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
    name: "Thaat Baat", 
    rating: 4.6, 
    deliveryTime: "25-30 min",
    description: "Authentic Rajasthani Thalis & Desi Ghee preparations",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800"
  },
  { 
    id: '2', 
    name: "Arab Kitchen", 
    rating: 4.3, 
    deliveryTime: "35-40 min",
    description: "Lebanese delights, Mandi & Middle Eastern platters",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800"
  },
  { 
    id: '3', 
    name: "Guri Kripas", 
    rating: 4.5, 
    deliveryTime: "20-25 min",
    description: "Piping hot Parathas & North Indian comfort food",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=800"
  }
];

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [selectedKitchen, setSelectedKitchen] = useState<Kitchen | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderSummary, setOrderSummary] = useState<CartItem[]>([]);
  const [isReturningUser, setIsReturningUser] = useState(false);

  // Navigation helpers
  const goToMenu = (kitchen: Kitchen) => {
    setSelectedKitchen(kitchen);
    setScreen('menu');
  };

  const goHome = () => {
    setScreen('home');
    setSelectedKitchen(null);
  };

  const placeOrder = () => {
    setOrderSummary([...cart]);
    setCart([]);
    setShowCheckout(false);
    setIsReturningUser(true); // Simulate becoming a returning user after first order
    setScreen('success');
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
  const cartCount = useMemo(() => cart.reduce((acc, curr) => acc + curr.quantity, 0), [cart]);

  return (
    <div className="min-h-screen sm:bg-gray-200 flex justify-center items-center">
      {/* Mobile Frame */}
      <div className="w-full h-screen bg-white relative overflow-hidden flex flex-col sm:w-[375px] sm:rounded-[40px] sm:border-[8px] sm:border-ink sm:shadow-2xl sm:my-0">
        
        <AnimatePresence mode="wait">
          {screen === 'home' && (
            <HomeScreen key="home" onSelectKitchen={goToMenu} />
          )}

          {screen === 'menu' && selectedKitchen && (
            <MenuScreen 
              key="menu" 
              kitchen={selectedKitchen} 
              onBack={goHome} 
              onAddToCart={addToCart}
              cart={cart}
              updateQuantity={updateQuantity}
              onCheckout={() => setShowCheckout(true)}
            />
          )}

          {screen === 'success' && (
            <SuccessScreen key="success" summary={orderSummary} onHome={goHome} />
          )}
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
                    <span className="text-sm font-semibold text-primary">Ordering from</span>
                    <span className="text-sm font-bold">{selectedKitchen?.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-600">Total Price</span>
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

// --- Home Screen ---
function HomeScreen({ onSelectKitchen }: { onSelectKitchen: (k: Kitchen) => void, key?: Key }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-20 bg-color-bg-app"
    >
      <header className="px-5 py-6 bg-white border-b border-[#f0f0f0]">
        <h1 className="st-title">STUVA</h1>
        <p className="st-subtitle">Home kitchens near you</p>
      </header>

      <div className="px-4 space-y-4">
        {KITCHENS.map((kitchen) => (
          <motion.div 
            key={kitchen.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectKitchen(kitchen)}
            className="bg-white rounded-card overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.05)] cursor-pointer"
          >
            <div className="h-[140px] w-full relative">
              <img 
                src={kitchen.image} 
                alt={kitchen.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-4">
              <div className="flex justify-between items-center">
                <span className="font-[700] text-[16px] text-ink">{kitchen.name}</span>
                <div className="rating-badge">
                  ⭐ <span className="mt-[1px]">{kitchen.rating}</span>
                </div>
              </div>
              <p className="text-[12px] text-[#777] mt-1 font-medium italic">
                {kitchen.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// --- Menu Screen ---
function MenuScreen({ 
  kitchen, 
  onBack, 
  onAddToCart, 
  cart, 
  updateQuantity,
  onCheckout 
}: { 
  kitchen: Kitchen; 
  onBack: () => void;
  onAddToCart: (item: CartItem) => void;
  cart: CartItem[];
  updateQuantity: (id: string, delta: number) => void;
  onCheckout: () => void;
  key?: Key;
}) {
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = (e: any) => {
      setIsSticky(e.target.scrollTop > 100);
    };
    const div = document.getElementById('menu-scroll-container');
    div?.addEventListener('scroll', handleScroll);
    return () => div?.removeEventListener('scroll', handleScroll);
  }, []);

  const cartTotal = useMemo(() => cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((acc, curr) => acc + curr.quantity, 0), [cart]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      id="menu-scroll-container"
      className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col"
    >
      <header className={`sticky top-0 z-10 transition-all duration-300 px-6 py-4 flex items-center justify-between ${isSticky ? 'bg-white/90 backdrop-blur-xl shadow-sm' : 'bg-transparent'}`}>
        <button onClick={onBack} className="p-2.5 bg-white shadow-md rounded-2xl text-slate-900 active:scale-95 transition-transform">
          <ChevronLeft className="w-6 h-6" />
        </button>
        {isSticky && (
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-lg font-bold"
          >
            {kitchen.name}
          </motion.h2>
        )}
        <div className="w-10" /> {/* Spacer */}
      </header>

      <div className="px-6 py-4 space-y-1 mb-6">
        <h1 className="text-4xl font-extrabold tracking-tight">{kitchen.name}</h1>
        <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
          <MapPin className="w-3.5 h-3.5 text-primary" />
          <span>Home Kitchen • 3.2 km away</span>
        </div>
      </div>

      <div className="px-6 space-y-8 pb-32">
        {/* Section: Today's Menu */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            Today's Menu
            <div className="h-1 flex-1 bg-primary/10 rounded-full" />
          </h2>
          
          <ThaliCard 
            title="Normal Thali" 
            price={80} 
            onAdd={(options) => onAddToCart({ id: 'thali-normal', name: 'Normal Thali', price: 80, quantity: 1, options })}
          />

          <ThaliCard 
            title="Special Thali" 
            price={120} 
            isSpecial
            onAdd={(options) => onAddToCart({ id: 'thali-special', name: 'Special Thali', price: 120, quantity: 1, options })}
          />
        </div>

        {/* Section: Parathas */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            Parathas
            <div className="h-1 flex-1 bg-primary/10 rounded-full" />
          </h2>
          
          <div className="space-y-4">
            <SimpleItem 
              id="p1" 
              name="Aloo Paratha" 
              price={40} 
              onUpdate={(id, d) => updateQuantity(id, d)}
              cartItem={cart.find(i => i.id === 'p1')}
              onAdd={() => onAddToCart({ id: 'p1', name: 'Aloo Paratha', price: 40, quantity: 1 })}
            />
            <SimpleItem 
              id="p2" 
              name="Onion Paratha" 
              price={45} 
              onUpdate={(id, d) => updateQuantity(id, d)}
              cartItem={cart.find(i => i.id === 'p2')}
              onAdd={() => onAddToCart({ id: 'p2', name: 'Onion Paratha', price: 45, quantity: 1 })}
            />
          </div>
        </div>

        {/* Section: Add-ons */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            Add-ons
            <div className="h-1 flex-1 bg-primary/10 rounded-full" />
          </h2>
          
          <div className="space-y-4">
            <SimpleItem 
              id="add1" 
              name="Extra Roti" 
              price={7} 
              onUpdate={(id, d) => updateQuantity(id, d)}
              cartItem={cart.find(i => i.id === 'add1')}
              onAdd={() => onAddToCart({ id: 'add1', name: 'Extra Roti', price: 7, quantity: 1 })}
            />
            <SimpleItem 
              id="add2" 
              name="Fresh Curd" 
              price={15} 
              onUpdate={(id, d) => updateQuantity(id, d)}
              cartItem={cart.find(i => i.id === 'add2')}
              onAdd={() => onAddToCart({ id: 'add2', name: 'Fresh Curd', price: 15, quantity: 1 })}
            />
          </div>
        </div>
      </div>

      {/* Sticky Cart Bar */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-5 left-4 right-4 z-30"
          >
            <button 
              onClick={onCheckout}
              className="w-full cart-bar-style group active:scale-95 transition-transform"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-white/20 border border-white/10 rounded-[6px] flex items-center justify-center font-bold text-[12px]">
                  {cartCount}
                </div>
                <div className="text-sm font-semibold">₹{cartTotal}</div>
              </div>
              <div className="flex items-center gap-1 font-bold text-sm uppercase tracking-wider">
                Place Order
                <span className="text-lg leading-none mb-0.5">›</span>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- Thali Card Component ---
function ThaliCard({ 
  title, 
  price, 
  isSpecial, 
  onAdd 
}: { 
  title: string; 
  price: number; 
  isSpecial?: boolean; 
  onAdd: (opt: any) => void 
}) {
  const [riceOn, setRiceOn] = useState(false);
  const [drySabji, setDrySabji] = useState('Aloo Gobi');
  const [gravySabji, setGravySabji] = useState('Paneer');

  return (
    <div className={`p-6 bg-white rounded-card transition-all relative overflow-hidden shadow-sm`}>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="text-lg font-bold text-ink">{title}</h3>
          <p className="text-[#666] font-semibold text-sm">₹{price}</p>
        </div>
        <div className="stepper-bg">
          <button className="stepper-btn-style active:scale-90 transition-transform">
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold">1</span>
          <button className="stepper-btn-style active:scale-90 transition-transform">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Toggle Option */}
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-[#444]">Rice</span>
          <button 
            onClick={() => setRiceOn(!riceOn)}
            className={`w-[40px] h-[22px] rounded-full relative transition-colors p-[2px] ${riceOn ? 'bg-primary' : 'bg-[#E5E5E5]'}`}
          >
            <motion.div 
              animate={{ x: riceOn ? 18 : 0 }}
              className="w-[18px] h-[18px] bg-white rounded-full shadow-sm"
            />
          </button>
        </div>
        
        <p className="text-[12px] font-semibold text-primary m-0">👉 {riceOn ? "3 Roti + Rice" : "5 Roti instead of 3"}</p>

        {/* Chips UI for Sabjis */}
        <div className="space-y-3">
          <label className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#999]">Select Dry Sabji</label>
          <div className="flex flex-wrap gap-2">
            {['Aloo Gobi', 'Bhindi', 'Mix Veg'].map(s => (
              <Chip key={s} selected={drySabji === s} onClick={() => setDrySabji(s)} label={s} />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#999]">Select Gravy Sabji</label>
          <div className="flex flex-wrap gap-2">
            {['Paneer', 'Dal Fry', 'Chole'].map(s => (
              <Chip key={s} selected={gravySabji === s} onClick={() => setGravySabji(s)} label={s} />
            ))}
          </div>
        </div>

        <button 
          onClick={() => onAdd({ riceOn, drySabji, gravySabji })}
          className="w-full py-4 mt-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-transform"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}

function Chip({ selected, onClick, label }: { selected: boolean; onClick: () => void; label: string, key?: Key }) {
  return (
    <button 
      onClick={onClick}
      className={`pill-style ${selected ? 'pill-style-active shadow-sm' : ''}`}
    >
      {label}
    </button>
  );
}

// --- Simple Item Component ---
function SimpleItem({ 
  id, 
  name, 
  price, 
  onAdd, 
  onUpdate, 
  cartItem 
}: { 
  id: string; 
  name: string; 
  price: number; 
  onAdd: () => void;
  onUpdate: (id: string, d: number) => void;
  cartItem?: CartItem;
}) {
  return (
    <div className="bg-white p-5 rounded-card flex items-center justify-between border border-white transition-all hover:border-[#f0f0f0]">
      <div>
        <h4 className="font-bold text-sm text-ink">{name}</h4>
        <p className="text-primary font-bold text-xs">₹{price}</p>
      </div>
      
      {cartItem ? (
        <div className="stepper-bg">
          <button onClick={() => onUpdate(id, -1)} className="stepper-btn-style active:scale-90 transition-transform">
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="font-bold text-xs w-4 text-center">{cartItem.quantity}</span>
          <button onClick={() => onUpdate(id, 1)} className="stepper-btn-style active:scale-90 transition-transform">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button 
          onClick={onAdd}
          className="w-[28px] h-[28px] bg-primary/10 text-primary rounded-[8px] flex items-center justify-center active:scale-90 transition-transform font-bold"
        >
          +
        </button>
      )}
    </div>
  );
}

// --- Success Screen ---
function SuccessScreen({ summary, onHome }: { summary: CartItem[]; onHome: () => void, key?: Key }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-8"
    >
      <div className="relative">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
          className="w-28 h-28 bg-primary rounded-full flex items-center justify-center shadow-xl shadow-primary/30"
        >
          <CheckCircle2 className="w-16 h-16 text-white" />
        </motion.div>
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-primary rounded-full -z-10"
        />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-ink">Order Placed!</h1>
        <p className="st-subtitle text-lg">Your kitchen is already<br/>on the clock.</p>
      </div>

      <div className="w-full bg-white p-6 rounded-card shadow-sm space-y-4">
        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-[#999]">
          <span>Order Summary</span>
          <span>#STV-{Math.floor(Math.random() * 10000)}</span>
        </div>
        <div className="space-y-3">
          {summary.map(item => (
            <div key={item.id} className="flex justify-between items-center text-sm font-medium">
              <div className="flex items-center gap-2">
                <span className="font-bold text-primary">{item.quantity}x</span>
                <span className="text-ink">{item.name}</span>
              </div>
              <span className="font-bold">₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>
        <div className="pt-4 border-t border-dashed border-[#E5E5E5] flex justify-between items-center">
          <span className="font-bold text-ink">Total Paid</span>
          <span className="text-xl font-black text-primary">₹{summary.reduce((a, c) => a + (c.price * c.quantity), 0)}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 bg-[#FFF9E6] rounded-2xl w-full">
        <Clock className="w-5 h-5 text-primary" />
        <div className="text-left">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Status</p>
          <p className="text-sm font-bold text-slate-700">Preparing and packing...</p>
        </div>
      </div>

      <button 
        onClick={onHome}
        className="w-full py-5 bg-ink text-white rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-transform"
      >
        Take Me Home
      </button>
    </motion.div>
  );
}
