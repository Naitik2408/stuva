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
  adminCount?: number;
}

export default function OwnerPanel() {
  const [authStep, setAuthStep] = useState<'PHONE' | 'OTP' | 'DASHBOARD'>('PHONE');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'KITCHENS' | 'ADMINS' | 'STATS'>('KITCHENS');
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [showAddKitchen, setShowAddKitchen] = useState(false);
  const [newKitchen, setNewKitchen] = useState({ name: '', slug: '', adminPhone: '', description: '', image_url: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedKitchenForMenu, setSelectedKitchenForMenu] = useState<Kitchen | null>(null);
  const [kitchenMenu, setKitchenMenu] = useState<any[]>([]);
  const [isMenuLoading, setIsMenuLoading] = useState(false);
  const [showAddMenuItem, setShowAddMenuItem] = useState(false);
  const [newMenuItem, setNewMenuItem] = useState({ name: '', price: '', category: 'others' as any, thali_type: 'both' as 'normal'|'special'|'both' });

  const OWNER_PHONE = '9060557296';

  const otpRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  useEffect(() => {
    // Check local session
    const saved = localStorage.getItem('stuva_owner_auth');
    if (saved === OWNER_PHONE) {
      setAuthStep('DASHBOARD');
      fetchKitchens();
    }
  }, []);

  const fetchKitchens = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('kitchens')
        .select(`
          *,
          kitchen_admins (phone)
        `);
      
      if (error) throw error;
      
      const formatted = (data || []).map(k => ({
        id: k.id,
        name: k.name,
        slug: k.slug,
        description: k.description,
        image_url: k.image_url,
        adminPhone: k.kitchen_admins[0]?.phone || 'No Admin',
        is_active: k.is_active,
        adminCount: k.kitchen_admins.length,
        thali_type: k.thali_type || 'both'
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
                            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                              <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Active</span>
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
            ) : (
               <div className="h-full flex items-center justify-center flex-col text-center opacity-40">
                  <LayoutDashboard className="w-16 h-16 mb-4 text-slate-300" />
                  <p className="text-sm font-bold text-slate-400">Implementation in progress...</p>
               </div>
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
                      onChange={(e) => setNewKitchen({...newKitchen, name: e.target.value})}
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
                                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${item.available ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
                                 >
                                   {item.available ? 'Available' : 'Disabled'}
                                 </button>
                                 <button 
                                    onClick={() => deleteMenuItem(item.id)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-red-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
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
    </div>
  );
}
