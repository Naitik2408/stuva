import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  LayoutDashboard, 
  Users, 
  Store, 
  ChevronRight, 
  Search, 
  Settings, 
  LogOut,
  Trash2,
  CheckCircle2,
  User,
  ShoppingBag,
  CreditCard,
  Menu as MenuIcon
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Kitchen {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  adminPhone: string;
  is_active: boolean;
  is_open?: boolean;
  adminCount?: number;
  subscription_expires_at?: string;
}

export default function OwnerPanel({ setKitchens: setGlobalKitchens }: { setKitchens?: any }) {
  const [authStep, setAuthStep] = useState<'PHONE' | 'OTP' | 'DASHBOARD'>('PHONE');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'KITCHENS' | 'ADMINS' | 'STATS' | 'SUBSCRIPTIONS'>('KITCHENS');
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [showAddKitchen, setShowAddKitchen] = useState(false);
  const [newKitchen, setNewKitchen] = useState({ name: '', slug: '', adminPhone: '', description: '', image_url: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [admins, setAdmins] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    todayOrders: 0,
    todayRevenue: 0
  });
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ phone: '', kitchen_id: '' });
  const [selectedKitchenForMenu, setSelectedKitchenForMenu] = useState<Kitchen | null>(null);
  const [kitchenMenu, setKitchenMenu] = useState<any[]>([]);
  const [isMenuLoading, setIsMenuLoading] = useState(false);
  const [showAddMenuItem, setShowAddMenuItem] = useState(false);
  const [newMenuItem, setNewMenuItem] = useState({ name: '', price: '', category: 'others' as any, thali_type: 'both' as 'normal'|'special'|'both' });

  const [showSubDatePicker, setShowSubDatePicker] = useState(false);
  const [selectedKitchenForSub, setSelectedKitchenForSub] = useState<Kitchen | null>(null);
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [isDbFixed, setIsDbFixed] = useState(true);

  const OWNER_PHONE = '9060557296';

  const otpRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  useEffect(() => {
    // Check local session
    const saved = localStorage.getItem('stuva_owner_auth');
    if (saved === OWNER_PHONE) {
      setAuthStep('DASHBOARD');
    }
  }, []);

  useEffect(() => {
    if (authStep === 'DASHBOARD') {
      if (activeTab === 'KITCHENS' || activeTab === 'SUBSCRIPTIONS') fetchKitchens();
      if (activeTab === 'ADMINS') fetchAdmins();
      if (activeTab === 'STATS') fetchStats();
    }
  }, [activeTab, authStep]);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('kitchen_admins')
        .select('*, kitchens(name)');
      if (error) throw error;
      setAdmins(data || []);
    } catch (err) {
      console.error('Error fetching admins:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*');
      if (error) throw error;
      
      const orders = data || [];
      const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
      
      const totalRevenue = orders.reduce((acc, o) => acc + Number(o.total || 0), 0);
      const todayOrdersArr = orders.filter(o => o.created_at.startsWith(today));
      const todayRevenue = todayOrdersArr.reduce((acc, o) => acc + Number(o.total || 0), 0);
      
      setStats({
        totalOrders: orders.length,
        totalRevenue: Math.round(totalRevenue),
        todayOrders: todayOrdersArr.length,
        todayRevenue: Math.round(todayRevenue)
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdmin.phone || !newAdmin.kitchen_id) return;
    try {
      const { error } = await supabase
        .from('kitchen_admins')
        .insert([{ phone: newAdmin.phone, kitchen_id: newAdmin.kitchen_id }]);
      if (error) throw error;
      setShowAddAdmin(false);
      setNewAdmin({ phone: '', kitchen_id: '' });
      fetchAdmins();
    } catch (err) {
      console.error('Error adding admin:', err);
    }
  };

  const deleteAdmin = async (phone: string, kitchen_id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const { error } = await supabase
        .from('kitchen_admins')
        .delete()
        .eq('phone', phone)
        .eq('kitchen_id', kitchen_id);
      if (error) throw error;
      fetchAdmins();
    } catch (err) {
      console.error('Error deleting admin:', err);
    }
  };

  const toggleKitchenStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('kitchens')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      if (setGlobalKitchens) {
        setGlobalKitchens((prev: any[]) => prev.map((k: any) => k.id === id ? { ...k, isOpen: !currentStatus } : k));
      }
      fetchKitchens();
    } catch (err) {
      console.error('Error toggling kitchen status:', err);
    }
  };

  const toggleKitchenOpenStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('kitchens')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      
      if (error) {
        if (error.code === '42703' || error.message.includes('is_active')) {
          alert("Database Error: Status column missing.");
          return;
        }
        throw error;
      };
      if (setGlobalKitchens) {
        setGlobalKitchens((prev: any[]) => prev.map((k: any) => k.id === id ? { ...k, isOpen: !currentStatus } : k));
      }
      fetchKitchens();
    } catch (err) {
      console.error('Error toggling kitchen open status:', err);
    }
  };

  const updateSubscriptionExpiry = async () => {
    if (!selectedKitchenForSub || !newExpiryDate) return;
    try {
      const { error } = await supabase
        .from('kitchens')
        .update({ 
          subscription_expires_at: new Date(newExpiryDate).toISOString(),
          is_active: true 
        })
        .eq('id', selectedKitchenForSub.id);

      if (error) throw error;
      setShowSubDatePicker(false);
      setSelectedKitchenForSub(null);
      setNewExpiryDate('');
      fetchKitchens();
    } catch (err) {
      console.error('Error updating subscription expiry:', err);
    }
  };

  const fetchKitchens = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('kitchens')
        .select(`
          *,
          kitchen_admins (phone)
        `);
      
      if (error) {
        if (error.code === '42703' || error.message.includes('subscription_expires_at')) {
          setIsDbFixed(false);
          // Fallback fetch without failing columns
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('kitchens')
            .select('id, name, slug, description, image_url, is_active, kitchen_admins(phone)');
          
          if (fallbackError) throw fallbackError;
          
          const formatted = (fallbackData || []).map((k: any) => ({
            id: k.id,
            name: k.name,
            slug: k.slug,
            description: k.description,
            image_url: k.image_url,
            adminPhone: k.kitchen_admins?.[0]?.phone || 'No Admin',
            is_active: k.is_active,
            is_open: k.is_active, // Use is_active as fallback for is_open
            adminCount: k.kitchen_admins?.length || 0,
            subscription_expires_at: undefined
          }));
          setKitchens(formatted as any);
          return;
        }
        throw error;
      }
      
      setIsDbFixed(true);
      const formatted = (data || []).map(k => ({
        id: k.id,
        name: k.name,
        slug: k.slug,
        description: k.description,
        image_url: k.image_url,
        adminPhone: k.kitchen_admins?.[0]?.phone || 'No Admin',
        is_active: k.is_active,
        is_open: k.is_active, // Unified status using is_active field from schema
        adminCount: k.kitchen_admins?.length || 0,
        thali_type: k.thali_type || 'both',
        subscription_expires_at: k.subscription_expires_at
      }));
      
      setKitchens(formatted as any);
    } catch (err) {
      console.error('Error fetching kitchens:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneSubmit = () => {
    if (phone !== OWNER_PHONE) {
      setError('Unauthorized access. Only owner can login.');
      return;
    }
    setError('');
    setAuthStep('OTP');
  };

  const handleOtpVerify = () => {
    if (otp.join('') === '1234') {
      localStorage.setItem('stuva_owner_auth', phone);
      setAuthStep('DASHBOARD');
      fetchKitchens();
    } else {
      setError('Invalid OTP');
    }
  };

  const handleAddKitchen = async () => {
    if (!newKitchen.name || !newKitchen.slug || !newKitchen.adminPhone) return;
    
    setIsLoading(true);
    try {
      // 1. Create the kitchen
      const { data: kitchen, error: kError } = await supabase
        .from('kitchens')
        .insert([{
          name: newKitchen.name,
          slug: newKitchen.slug,
          description: newKitchen.description || 'Authentic taste delivered by STUVA.',
          image_url: newKitchen.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800',
          rating: 4.5,
          delivery_time: '25-30 min'
        }])
        .select()
        .single();

      if (kError) throw kError;

      // 2. Link the admin
      const { error: aError } = await supabase
        .from('kitchen_admins')
        .insert([{
          kitchen_id: kitchen.id,
          phone: newKitchen.adminPhone.replace(/\D/g, '')
        }]);

      if (aError) throw aError;

      setNewKitchen({ name: '', slug: '', adminPhone: '', description: '', image_url: '' });
      setShowAddKitchen(false);
      fetchKitchens();
    } catch (err: any) {
      alert(err.message || 'Failed to add kitchen');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchKitchenMenu = async (kitchen: Kitchen) => {
    setIsMenuLoading(true);
    setSelectedKitchenForMenu(kitchen);
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('kitchen_id', kitchen.id);
      
      if (error) throw error;
      setKitchenMenu(data || []);
    } catch (err) {
      console.error('Error fetching menu:', err);
    } finally {
      setIsMenuLoading(false);
    }
  };

  const toggleMenuItem = async (itemId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ available: !currentStatus })
        .eq('id', itemId);
      
      if (error) throw error;
      setKitchenMenu(prev => prev.map(item => item.id === itemId ? { ...item, available: !currentStatus } : item));
    } catch (err) {
      console.error('Error toggling menu item:', err);
    }
  };

  const addMenuItem = async () => {
    if (!newMenuItem.name || !selectedKitchenForMenu) return;
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .insert([{
          kitchen_id: selectedKitchenForMenu.id,
          name: newMenuItem.name,
          price: Number(newMenuItem.price) || 0,
          category: newMenuItem.category,
          thali_type: newMenuItem.thali_type,
          available: true
        }])
        .select()
        .single();
      
      if (error) throw error;
      setKitchenMenu(prev => [...prev, data]);
      setNewMenuItem({ name: '', price: '', category: 'others', thali_type: 'both' });
      setShowAddMenuItem(false);
    } catch (err) {
      console.error('Error adding menu item:', err);
    }
  };

  const deleteMenuItem = async (itemId: string) => {
    if (!confirm('Delete this item?')) return;
    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', itemId);
      if (error) throw error;
      setKitchenMenu(prev => prev.filter(i => i.id !== itemId));
    } catch (err) {
      console.error('Error deleting menu item:', err);
    }
  };

  const deleteKitchen = async (id: string) => {
    if (!confirm('Are you sure you want to delete this kitchen? This action cannot be undone.')) return;
    try {
      const { error } = await supabase.from('kitchens').delete().eq('id', id);
      if (error) throw error;
      setKitchens(prev => prev.filter(k => k.id !== id));
    } catch (err) {
      alert('Failed to delete kitchen');
    }
  };

  if (authStep === 'PHONE') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-[32px] p-10 shadow-2xl shadow-slate-200/50 border border-slate-100"
        >
          <div className="text-center space-y-4 mb-10">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto">
              <Store className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-display text-secondary">Owner Central</h1>
            <p className="text-slate-400 font-bold text-sm">Managing the STUVA empire</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 px-1">Phone Number</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-primary">+91</span>
                <input 
                  type="tel" 
                  value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="9060557296" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-4 focus:ring-2 focus:ring-primary/20 text-sm font-bold outline-none"
                />
              </div>
              {error && <p className="text-xs font-bold text-red-500 px-1">{error}</p>}
            </div>

            <button 
              onClick={handlePhoneSubmit}
              className="w-full funky-btn-primary h-16 flex items-center justify-center gap-2 group"
            >
              Access Dashboard
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (authStep === 'OTP') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-[32px] p-10 shadow-2xl border border-slate-100 text-center"
        >
          <h2 className="text-3xl font-display text-secondary mb-2">Verify Identity</h2>
          <p className="text-slate-400 font-bold text-sm mb-10">Owner confirmation required: <span className="text-primary">1234</span></p>

          <div className="flex gap-4 justify-center mb-10">
            {otp.map((digit, i) => (
              <input 
                key={i} ref={otpRefs[i]}
                type="tel" maxLength={1} value={digit}
                onChange={(e) => {
                  const items = [...otp];
                  items[i] = e.target.value;
                  setOtp(items);
                  if (e.target.value && i < 3) otpRefs[i+1].current?.focus();
                }}
                className="w-14 h-20 bg-slate-50 border-2 border-slate-100 rounded-2xl text-center font-display text-3xl text-primary focus:border-primary outline-none transition-all"
              />
            ))}
          </div>

          <button 
            onClick={handleOtpVerify}
            className="w-full funky-btn-secondary h-16 flex items-center justify-center gap-2"
          >
            Enter Dashboard
            <CheckCircle2 className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      {/* Sidebar - Desktop Layout */}
      <div className="w-72 bg-white border-r border-slate-200 hidden lg:flex flex-col p-8 shrink-0">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-xl shadow-primary/20">
            <Store className="w-6 h-6" />
          </div>
          <span className="font-display text-2xl text-secondary">STUVA Panel</span>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { id: 'KITCHENS', label: 'Kitchens', icon: Store },
            { id: 'ADMINS', label: 'Admins', icon: Users },
            { id: 'SUBSCRIPTIONS', label: 'Subscriptions', icon: CreditCard },
            { id: 'STATS', label: 'Analytics', icon: LayoutDashboard },
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-bold text-sm transition-all ${activeTab === item.id ? 'bg-primary text-white shadow-lg shadow-primary/10 scale-[1.02]' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-slate-400'}`} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="pt-8 border-t border-slate-100">
          <button 
            onClick={() => { localStorage.removeItem('stuva_owner_auth'); setAuthStep('PHONE'); }}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-bold text-sm text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 shrink-0">
          <h2 className="text-xl font-display text-secondary">
            {activeTab === 'KITCHENS' ? 'Kitchen Management' : activeTab === 'ADMINS' ? 'Admin Directory' : 'Global Analytics'}
          </h2>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
              <input 
                type="text" placeholder="Search..." 
                className="bg-slate-50 border border-slate-100 rounded-xl py-2 pl-10 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10 w-64"
              />
            </div>
            <div className="flex items-center gap-3 border-l pl-6 border-slate-200">
              <div className="text-right">
                <p className="text-xs font-bold text-secondary leading-none">Naitik Kumar</p>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">Global Owner</p>
              </div>
              <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-white font-display">N</div>
            </div>
          </div>
        </header>

        {/* Dashboard Area */}
        <main className="flex-1 overflow-y-auto p-10 no-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'KITCHENS' ? (
              <motion.div 
                key="kitchens" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-display text-secondary">Active Kitchens</h3>
                    <p className="text-sm font-bold text-slate-400">Review and manage your store network</p>
                  </div>
                  <button 
                    onClick={() => setShowAddKitchen(true)}
                    className="funky-btn-primary flex items-center gap-2 px-6 h-12 text-sm shadow-xl shadow-primary/20"
                  >
                    <Plus className="w-4 h-4" />
                    Register New Kitchen
                  </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {kitchens.map(k => (
                    <div key={k.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                      <div className="flex gap-6">
                        <div className="w-24 h-24 bg-slate-50 rounded-[24px] overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform shrink-0 border border-slate-100">
                          {k.image_url ? (
                            <img src={k.image_url} alt={k.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <Store className="w-10 h-10 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xl font-display text-secondary">{k.name}</h4>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => toggleKitchenOpenStatus(k.id, k.is_open ?? true)}
                                className={`flex items-center gap-2 px-3 py-1 rounded-full transition-all ${k.is_open !== false ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                                title={k.is_open !== false ? 'Shop is Open' : 'Shop is Closed'}
                              >
                                <Store className={`w-3 h-3 ${k.is_open !== false ? 'text-indigo-500' : 'text-slate-300'}`} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{k.is_open !== false ? 'Open' : 'Closed'}</span>
                              </button>
                              <button 
                                onClick={() => toggleKitchenStatus(k.id, k.is_active)}
                                className={`flex items-center gap-2 px-3 py-1 rounded-full transition-all ${k.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}
                              >
                                <div className={`w-1.5 h-1.5 rounded-full ${k.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{k.is_active ? 'Active' : 'Deactivated'}</span>
                              </button>
                            </div>
                          </div>
                          <p className="text-xs font-bold text-slate-400">/{k.slug}</p>
                          <p className="text-[11px] text-slate-400 line-clamp-1 italic">{k.description}</p>
                          <div className="flex items-center gap-2 pt-2">
                             <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-md">Admin: {k.adminPhone}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => fetchKitchenMenu(k)}
                            className="text-[11px] font-black text-primary uppercase tracking-widest border border-primary/20 px-4 py-2 rounded-xl hover:bg-primary hover:text-white transition-all flex items-center gap-2"
                          >
                            <MenuIcon className="w-3.5 h-3.5" />
                            Manage Menu
                          </button>
                          <button className="text-[11px] font-black text-slate-400 uppercase tracking-widest border border-slate-100 px-4 py-2 rounded-xl hover:bg-slate-50 transition-all font-sans">Settings</button>
                        </div>
                        <button 
                          onClick={() => deleteKitchen(k.id)}
                          className="p-3 text-red-500 rounded-xl hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : activeTab === 'ADMINS' ? (
              <motion.div 
                key="admins" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-display text-secondary">Admin Directory</h3>
                    <p className="text-sm font-bold text-slate-400">Manage kitchen staff and access levels</p>
                  </div>
                  <button 
                    onClick={() => setShowAddAdmin(true)}
                    className="funky-btn-primary flex items-center gap-2 px-6 h-12 text-sm shadow-xl shadow-primary/20"
                  >
                    <Plus className="w-4 h-4" />
                    Register New Admin
                  </button>
                </div>

                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-8 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Administrator</th>
                        <th className="px-8 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Kitchen Assignment</th>
                        <th className="px-8 py-4 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {admins.map(admin => (
                        <tr key={`${admin.phone}-${admin.kitchen_id}`} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                <User className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-bold text-secondary text-sm">{admin.phone}</p>
                                <p className="text-[10px] font-bold text-slate-400">Authorized Personnel</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className="px-4 py-1.5 bg-secondary/5 text-secondary rounded-xl text-[10px] font-black uppercase tracking-widest">
                              {admin.kitchens?.name || 'Unknown Kitchen'}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <button 
                               onClick={() => deleteAdmin(admin.phone, admin.kitchen_id)}
                               className="p-2 text-red-400 hover:text-red-500 transition-colors"
                             >
                                <Trash2 className="w-4 h-4" />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            ) : activeTab === 'SUBSCRIPTIONS' ? (
              <motion.div 
                key="subscriptions" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-end">
                  <div>
                    <h3 className="text-2xl font-display text-secondary">Subscription Control</h3>
                    <p className="text-sm font-bold text-slate-400">Manage kitchen billing and listing status</p>
                  </div>
                  {!isDbFixed && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4 animate-pulse">
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                        <Settings className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-amber-700 uppercase tracking-widest">Database Setup Required</p>
                        <p className="text-[10px] text-amber-600 font-bold">Please run the SQL fix to enable subscription tracking.</p>
                      </div>
                    </div>
                  )}
                </div>

                {!isDbFixed && (
                  <div className="bg-slate-900 rounded-[32px] p-8 text-white space-y-4 shadow-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <h4 className="font-display text-lg">One-Time Database Fix</h4>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      To enable the new subscription feature, you need to add the <code className="text-primary font-mono text-[10px]">subscription_expires_at</code> column to your <code className="text-primary font-mono text-[10px]">kitchens</code> table. 
                      Copy the code below and run it in your <strong>Supabase SQL Editor</strong>.
                    </p>
                    <div className="relative group">
                      <pre className="bg-black/40 rounded-2xl p-6 font-mono text-[11px] text-primary/80 overflow-x-auto border border-white/5">
                        ALTER TABLE kitchens ADD COLUMN subscription_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '1 month');
                      </pre>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText("ALTER TABLE kitchens ADD COLUMN subscription_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '1 month');");
                          alert("SQL Command Copied!");
                        }}
                        className="absolute right-4 top-4 bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-all text-[10px] font-black uppercase tracking-widest"
                      >
                        Copy SQL
                      </button>
                    </div>
                    <button 
                      onClick={fetchKitchens}
                      className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2"
                    >
                      I've run the SQL, check again
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-8 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Kitchen</th>
                        <th className="px-8 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Subscription Status</th>
                        <th className="px-8 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Expiry Date</th>
                        <th className="px-8 py-4 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Billing Operations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {kitchens.map(k => {
                        const isExpired = k.subscription_expires_at ? new Date(k.subscription_expires_at) < new Date() : true;
                        return (
                          <tr key={k.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 flex items-center justify-center">
                                  {k.image_url ? <img src={k.image_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <Store className="w-5 h-5 text-slate-300" />}
                                </div>
                                <div>
                                  <p className="font-bold text-secondary text-sm">{k.name}</p>
                                  <p className="text-[10px] font-bold text-slate-400 italic">/{k.slug}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${(!isExpired && k.is_active) ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${(!isExpired && k.is_active) ? 'text-green-600' : 'text-red-600'}`}>
                                  {(!isExpired && k.is_active) ? 'ACTIVE / LIVE' : 'EXPIRED / HIDDEN'}
                                </span>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div>
                                <p className={`text-xs font-bold ${isExpired ? 'text-red-400' : 'text-secondary'}`}>
                                  {k.subscription_expires_at ? new Date(k.subscription_expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No Record'}
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 tracking-tight">
                                  {isExpired ? 'Expired' : `${Math.ceil((new Date(k.subscription_expires_at!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining`}
                                </p>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => {
                                    setSelectedKitchenForSub(k);
                                    setNewExpiryDate(k.subscription_expires_at ? k.subscription_expires_at.split('T')[0] : '');
                                    setShowSubDatePicker(true);
                                  }}
                                  className="px-6 py-2 bg-primary text-white shadow-lg shadow-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                                >
                                  {isExpired ? 'Activate / Renew' : 'Change Expiry'}
                                </button>
                                <button 
                                  onClick={() => toggleKitchenStatus(k.id, k.is_active)}
                                  className={`p-2 rounded-xl transition-all ${k.is_active ? 'text-red-400 hover:bg-red-50' : 'text-slate-300 hover:bg-slate-100'}`}
                                  title="Emergency Kill Switch"
                                >
                                  <Settings className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            ) : (
                <motion.div 
                  key="stats" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="space-y-10"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { label: 'Total Volume', value: stats.totalOrders, sub: 'Orders Life-time', icon: ShoppingBag, color: 'primary' },
                      { label: 'Network Revenue', value: `₹${stats.totalRevenue}`, sub: 'Net Earnings', icon: Store, color: 'secondary' },
                      { label: 'Daily Traction', value: stats.todayOrders, sub: 'Orders Today', icon: LayoutDashboard, color: 'green-500' },
                      { label: 'Daily Revenue', value: `₹${stats.todayRevenue}`, sub: '24h Performance', icon: CheckCircle2, color: 'blue-500' },
                    ].map(stat => (
                      <div key={stat.label} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-lg transition-all border-b-8 border-b-slate-100">
                        <div className={`w-12 h-12 bg-${stat.color}/10 rounded-2xl flex items-center justify-center mb-6`}>
                           <stat.icon className={`w-6 h-6 text-${stat.color}`} />
                        </div>
                        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">{stat.label}</h4>
                        <p className="text-3xl font-display text-secondary mb-1">{stat.value}</p>
                        <p className="text-[10px] font-bold text-slate-400 italic">{stat.sub}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-8">
                     <div className="col-span-2 bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-secondary to-blue-400" />
                        <h3 className="text-xl font-display text-secondary mb-8">Performance Insights</h3>
                        <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-slate-50 rounded-3xl">
                           <p className="text-xs font-bold text-slate-300">Detailed Chart Visualization coming in v2.0</p>
                        </div>
                     </div>
                     <div className="bg-secondary rounded-[40px] p-10 text-white relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
                        <h3 className="text-xl font-display mb-6">Network Health</h3>
                        <div className="space-y-6">
                           <div className="space-y-2">
                              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/40">
                                 <span>Server Status</span>
                                 <span className="text-green-400">99.9%</span>
                              </div>
                              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                 <div className="h-full w-[99.9%] bg-green-400" />
                              </div>
                           </div>
                           <div className="space-y-2">
                              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/40">
                                 <span>Order Fulfillment</span>
                                 <span className="text-primary">94%</span>
                              </div>
                              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                 <div className="h-full w-[94%] bg-primary" />
                              </div>
                           </div>
                        </div>
                        <div className="mt-12 p-6 bg-white/5 rounded-3xl border border-white/10">
                           <p className="text-[11px] font-black uppercase tracking-widest text-primary mb-2">Pro Tip</p>
                           <p className="text-xs text-white/60 leading-relaxed italic">Monitor the Daily Revenue metric to identify peak kitchen hours across your network.</p>
                        </div>
                     </div>
                  </div>
                </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Add Kitchen Modal */}
      <AnimatePresence>
        {showAddKitchen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddKitchen(false)}
              className="absolute inset-0 bg-secondary/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[40px] p-10 shadow-2xl space-y-8 overflow-y-auto max-h-[90vh]"
            >
              <h3 className="text-3xl font-display text-secondary">Register Kitchen</h3>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 px-1">Kitchen Name</label>
                    <input 
                      type="text" value={newKitchen.name} 
                      onChange={(e) => {
                        const name = e.target.value;
                        const slug = name.toLowerCase()
                          .replace(/[^a-z0-9 ]/g, '')
                          .replace(/\s+/g, '-');
                        setNewKitchen({...newKitchen, name, slug});
                      }}
                      placeholder="Thaat Baat" 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 px-1">URL Slug</label>
                    <input 
                      type="text" value={newKitchen.slug} 
                      onChange={(e) => setNewKitchen({...newKitchen, slug: e.target.value})}
                      placeholder="thaat-baat" 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 px-1">Description</label>
                  <textarea 
                    value={newKitchen.description} 
                    onChange={(e) => setNewKitchen({...newKitchen, description: e.target.value})}
                    placeholder="Describe the kitchen's specialties..." 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20 h-24 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 px-1">Image URL</label>
                    <input 
                      type="text" value={newKitchen.image_url} 
                      onChange={(e) => setNewKitchen({...newKitchen, image_url: e.target.value})}
                      placeholder="https://images.unsplash.com/..." 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 px-1">Primary Admin Phone</label>
                    <input 
                      type="tel" value={newKitchen.adminPhone} 
                      onChange={(e) => setNewKitchen({...newKitchen, adminPhone: e.target.value})}
                      placeholder="90000 00001" 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setShowAddKitchen(false)}
                  className="flex-1 py-4 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-secondary transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddKitchen}
                  className="flex-[2] funky-btn-primary h-16"
                >
                  Confirm Registration
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Menu Management Overlay */}
      <AnimatePresence>
        {selectedKitchenForMenu && (
          <div className="fixed inset-0 z-[110] flex items-center justify-end">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedKitchenForMenu(null)}
              className="absolute inset-0 bg-secondary/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              className="relative w-full max-w-xl h-full bg-white shadow-2xl flex flex-col"
            >
              <header className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                 <div>
                   <h3 className="text-2xl font-display text-secondary">{selectedKitchenForMenu.name}</h3>
                   <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <p className="text-xs font-bold text-slate-400 capitalize">Menu Hub</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-3">
                   <button 
                     onClick={() => setShowAddMenuItem(!showAddMenuItem)}
                     className="px-6 h-12 bg-primary text-white rounded-xl font-display text-xs flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                   >
                     {showAddMenuItem ? 'Close Form' : 'Add New Item'}
                   </button>
                   <button onClick={() => setSelectedKitchenForMenu(null)} className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-secondary transition-colors font-sans font-black">Esc</button>
                 </div>
              </header>

              <div className="flex-1 overflow-y-auto no-scrollbar relative">
                {/* Embedded Add Item Form */}
                <AnimatePresence>
                  {showAddMenuItem && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-slate-50/50 border-b border-slate-100"
                    >
                      <div className="p-8 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                           <div className="w-1.5 h-6 bg-primary rounded-full" />
                           <h4 className="font-display text-lg text-secondary">Quick Item Add</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <input 
                              type="text" placeholder="Item Name (e.g. Matar Paneer)"
                              value={newMenuItem.name} onChange={e => setNewMenuItem({...newMenuItem, name: e.target.value})}
                              className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20"
                           />
                           <select 
                              value={newMenuItem.category} onChange={e => setNewMenuItem({...newMenuItem, category: e.target.value as any})}
                              className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                           >
                              <option value="thali">Thali</option>
                              <option value="dry_sabji">Dry Sabji</option>
                              <option value="gravy_sabji">Gravy Sabji</option>
                              <option value="others">Others / Paratha</option>
                           </select>
                        </div>
                        
                        {(newMenuItem.category === 'dry_sabji' || newMenuItem.category === 'gravy_sabji') && (
                          <div className="space-y-1.5">
                             <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 px-1">Visible In</label>
                             <div className="flex gap-2">
                               {['normal', 'special', 'both'].map(t => (
                                 <button 
                                   key={t}
                                   onClick={() => setNewMenuItem({...newMenuItem, thali_type: t as any})}
                                   className={`flex-1 py-3 rounded-xl font-bold text-[10px] tracking-widest uppercase transition-all border ${newMenuItem.thali_type === t ? 'bg-primary text-white border-primary shadow-lg shadow-primary/10' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                                 >
                                   {t}
                                 </button>
                               ))}
                             </div>
                          </div>
                        )}

                        <div className="flex gap-4">
                           {(newMenuItem.category === 'others' || newMenuItem.category === 'thali') && (
                             <input 
                                type="number" placeholder="Price (₹)"
                                value={newMenuItem.price} onChange={e => setNewMenuItem({...newMenuItem, price: e.target.value})}
                                className="flex-1 bg-white border border-slate-200 rounded-xl py-3 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20"
                             />
                           )}
                           <button 
                              onClick={addMenuItem}
                              className={`funky-btn-primary h-12 text-xs ${
                                (newMenuItem.category === 'others' || newMenuItem.category === 'thali') ? 'flex-[2]' : 'w-full'
                              }`}
                           >
                              Save to Menu
                           </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="p-8 space-y-8">
                  {isMenuLoading ? (
                    <div className="h-64 flex items-center justify-center">
                      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    </div>
                  ) : (
                    ['thali', 'dry_sabji', 'gravy_sabji', 'others'].map(category => (
                      <div key={category} className="space-y-4">
                        <h4 className="text-[10px] font-black text-primary uppercase tracking-widest px-2">{category.replace('_', ' ')}</h4>
                        <div className="space-y-2">
                          {kitchenMenu.filter(item => item.category === category).map(item => (
                            <div key={item.id} className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between group hover:bg-white hover:shadow-lg hover:shadow-ink/5 transition-all">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary border border-slate-100 font-display text-xs shadow-sm">
                                  {item.name[0]}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-secondary">{item.name}</p>
                                    {(item.category === 'dry_sabji' || item.category === 'gravy_sabji') && (
                                      <span className="text-[8px] font-black uppercase bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded leading-none">{item.thali_type}</span>
                                    )}
                                  </div>
                                  <p className="text-sm font-display text-primary">₹{item.price}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => toggleMenuItem(item.id, item.available)}
                                  className={`w-12 h-6 rounded-full transition-all relative shadow-inner shrink-0 ${item.available ? 'bg-primary' : 'bg-slate-200'}`}
                                >
                                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${item.available ? 'left-7' : 'left-1'}`} />
                                </button>
                                <button 
                                   onClick={() => deleteMenuItem(item.id)}
                                   className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-100 transition-all shrink-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                          {kitchenMenu.filter(item => item.category === category).length === 0 && (
                            <p className="text-xs text-slate-300 italic px-2">No items in this category</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/50">
                 <p className="text-[10px] text-slate-400 font-bold mb-4">Note: All changes are synced in real-time to the customer app and kitchen admin dashboard.</p>
                 <button onClick={() => setSelectedKitchenForMenu(null)} className="w-full funky-btn-secondary h-16">Close Dashboard</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Add Admin Modal */}
      <AnimatePresence>
        {showAddAdmin && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddAdmin(false)}
              className="absolute inset-0 bg-secondary/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl space-y-6"
            >
              <h3 className="text-2xl font-display text-secondary">Assign New Admin</h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 px-1">Phone Number</label>
                  <input 
                    type="tel" value={newAdmin.phone} 
                    onChange={e => setNewAdmin({...newAdmin, phone: e.target.value})}
                    placeholder="90000 00001" 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 px-1">Assign Kitchen</label>
                  <select 
                    value={newAdmin.kitchen_id} 
                    onChange={e => setNewAdmin({...newAdmin, kitchen_id: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                  >
                    <option value="">Select Kitchen...</option>
                    {kitchens.map(k => (
                      <option key={k.id} value={k.id}>{k.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                 <button onClick={() => setShowAddAdmin(false)} className="flex-1 font-bold text-slate-400 hover:text-secondary uppercase text-[10px] tracking-widest">Cancel</button>
                 <button onClick={handleAddAdmin} className="flex-[2] funky-btn-primary py-4">Register Admin</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Subscription Date Picker Modal */}
      <AnimatePresence>
        {showSubDatePicker && selectedKitchenForSub && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowSubDatePicker(false)}
              className="absolute inset-0 bg-secondary/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl space-y-6"
            >
              <div>
                <h3 className="text-2xl font-display text-secondary">Set Subscription Expiry</h3>
                <p className="text-xs font-bold text-slate-400 mt-1">Kitchen: {selectedKitchenForSub.name}</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 px-1">Expiry Date</label>
                  <input 
                    type="date" value={newExpiryDate} 
                    onChange={e => setNewExpiryDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                 <button onClick={() => setShowSubDatePicker(false)} className="flex-1 font-bold text-slate-400 hover:text-secondary uppercase text-[10px] tracking-widest">Cancel</button>
                 <button onClick={updateSubscriptionExpiry} className="flex-[2] funky-btn-primary py-4">Update Expiry</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
