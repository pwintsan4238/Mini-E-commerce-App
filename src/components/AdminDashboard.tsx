/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Coins, 
  Users, 
  CheckCircle2, 
  X, 
  XCircle, 
  Trash2, 
  Edit, 
  Plus, 
  Search, 
  ShoppingBag, 
  Phone, 
  ShieldAlert, 
  Filter, 
  UserPlus, 
  Check, 
  DollarSign,
  Gamepad2,
  Tag,
  Percent,
  Star,
  RefreshCw,
  Receipt,
  ExternalLink,
  LogOut,
  Upload,
  Flame,
  Shield,
  Target,
  Zap,
  Swords,
  Trophy,
  Gem,
  Sparkles,
  Heart,
  Crown,
  Gift,
  Play,
  Smartphone
} from 'lucide-react';
import { Order, OrderStatus, UserDetail, GameCategoryDetail, ProductPackage } from '../types';

interface AdminDashboardProps {
  orders: Order[];
  onRefreshOrders: () => void;
  telegramUser: string;
  t: Record<string, string>;
  catalog: GameCategoryDetail[];
  onRefreshProducts: () => void;
  onAdminLogout: () => void;
}

export default function AdminDashboard({
  orders,
  onRefreshOrders,
  telegramUser,
  t,
  catalog,
  onRefreshProducts,
  onAdminLogout
}: AdminDashboardProps) {
  // Navigation inside Admin tab
  const [adminSubTab, setAdminSubTab] = useState<'metrics' | 'orders' | 'users' | 'products'>('metrics');
  
  // Data lists
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersSearch, setUsersSearch] = useState('');
  const [ordersSearch, setOrdersSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState<string>('all');

  // Product search filter
  const [productsSearch, setProductsSearch] = useState('');

  // Interactive user editor states
  const [editingUser, setEditingUser] = useState<UserDetail | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  
  // New user form state
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newBalance, setNewBalance] = useState<number>(0);

  // Edit user form state
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBalance, setEditBalance] = useState<number>(0);

  // Status/Notifications
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<{
    url: string;
    orderId: string;
    transactionId: string;
    packageName: string;
    gameId: string;
    priceMmk: number;
    status: string;
  } | null>(null);

  // Product management state:
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<GameCategoryDetail | null>(null);

  // Form states for new/editing product basics:
  const [prodName, setProdName] = useState('');
  const [prodTagline, setProdTagline] = useState('');
  const [prodHelpText, setProdHelpText] = useState('');
  const [prodIconName, setProdIconName] = useState('Smartphone');
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [prodRequiresServerId, setProdRequiresServerId] = useState(false);
  const [prodIsHot, setProdIsHot] = useState(false);
  const [prodIsValue, setProdIsValue] = useState(false);

  // Map of icons for administration configuration choice selection rendering
  const iconChooserMap: Record<string, React.ComponentType<any>> = {
    Flame,
    Shield,
    Target,
    Zap,
    Sword: Swords,
    Swords,
    Gamepad2,
    Trophy,
    Gem,
    Sparkles,
    Coins,
    ShoppingBag,
    Smartphone,
    Play,
    Heart,
    Crown,
    Gift,
    Star
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64Data = uploadEvent.target?.result as string;
        setProdImageUrl(base64Data);
        triggerToast("Cover image successfully converted & uploaded!", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  const renderIconSelector = (currentValue: string, onChangeHandler: (val: string) => void) => {
    return (
      <div className="space-y-1.5 col-span-2 bg-slate-950 p-3 rounded-lg border border-slate-900">
        <div className="flex items-center justify-between">
          <label className="text-[9px] text-slate-405 block uppercase font-mono font-bold tracking-wider">
            Choose Category Icon
          </label>
          <div className="flex items-center gap-1.5 text-[9px] text-amber-500 font-mono">
            <span>Current:</span>
            <span className="font-bold underline">{currentValue}</span>
          </div>
        </div>
        
        {/* Visual selectable icons grid */}
        <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-900/30 rounded border border-slate-900/50">
          {Object.keys(iconChooserMap).map((iconKey) => {
            if (iconKey === 'Swords') return null; // Avoid duplicates with Swords alias
            const IconComp = iconChooserMap[iconKey] || Smartphone;
            const isSelected = currentValue === iconKey;
            return (
              <button
                key={iconKey}
                type="button"
                onClick={() => onChangeHandler(iconKey)}
                className={`p-1.5 rounded border flex items-center justify-center transition cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500/80 text-amber-400 shadow'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-100'
                }`}
                title={iconKey}
              >
                <IconComp className="w-3.5 h-3.5" />
              </button>
            );
          })}
        </div>

        {/* Dynamic add/custom type input */}
        <div className="pt-1.5 flex items-center gap-2 border-t border-slate-900/60">
          <span className="text-[8.5px] text-slate-500 uppercase font-mono whitespace-nowrap">
            Custom Icon Search / Name:
          </span>
          <input
            type="text"
            value={currentValue}
            onChange={(e) => onChangeHandler(e.target.value)}
            placeholder="e.g. Swords, Gamepad2, Coins..."
            className="flex-1 bg-slate-950 border border-slate-850 rounded px-2.5 py-1 text-[10px] text-white font-mono placeholder-slate-700 focus:outline-none focus:border-amber-500/30"
          />
        </div>
      </div>
    );
  };

  // Packages local state being edited for chosen product:
  const [editedPackages, setEditedPackages] = useState<ProductPackage[]>([]);

  // Package editor sub-states (for adding/updating a single package within the current product)
  const [isAddingPackage, setIsAddingPackage] = useState(false);
  const [pkgName, setPkgName] = useState('');
  const [pkgAmount, setPkgAmount] = useState<number>(100);
  const [pkgPriceMmk, setPkgPriceMmk] = useState<number>(5000);
  const [pkgOriginalPriceMmk, setPkgOriginalPriceMmk] = useState<number>(0);
  const [pkgPopular, setPkgPopular] = useState(false);
  const [pkgPremium, setPkgPremium] = useState(false);
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null); // if editing an existing package

  const handleStartEditingProduct = (product: GameCategoryDetail) => {
    setEditingProduct(product);
    setProdName(product.name);
    setProdTagline(product.tagline);
    setProdHelpText(product.helpText);
    setProdIconName(product.iconName);
    setProdImageUrl(product.imageUrl);
    setProdRequiresServerId(product.requiresServerId);
    setProdIsHot(!!product.isHot);
    setProdIsValue(!!product.isValue);
    setEditedPackages((product.packages || []).map((pkg, idx) => ({
      ...pkg,
      id: pkg.id || `pkg_${product.id}_${idx}_${Date.now()}`
    })));
    setIsAddingPackage(false);
    setEditingPkgId(null);
  };

  const handleUpdateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: prodName,
          tagline: prodTagline,
          iconName: prodIconName,
          imageUrl: prodImageUrl,
          helpText: prodHelpText,
          requiresServerId: prodRequiresServerId,
          isHot: prodIsHot,
          isValue: prodIsValue,
          packages: editedPackages
        })
      });
      const data = await res.json();
      if (data.success) {
        onRefreshProducts();
        setEditingProduct(null);
        triggerToast(`Product "${prodName}" details and packages saved!`, 'success');
      } else {
        triggerToast(data.error || 'Failed to update product specs.', 'error');
      }
    } catch (err: any) {
      triggerToast(err.message || 'Network sync error updating product', 'error');
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}"? This removes all associated packages and can affect active user shops.`)) return;
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        onRefreshProducts();
        triggerToast(`Product "${name}" deleted successfully.`, 'success');
      } else {
        triggerToast(data.error || 'Failed to delete product details.', 'error');
      }
    } catch (err: any) {
      triggerToast(err.message || 'Network sync error deleting product', 'error');
    }
  };

  const handleSavePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgName.trim()) {
      triggerToast('Package name label is required (e.g. 70 TikTok Coins)', 'error');
      return;
    }
    if (pkgAmount <= 0 || pkgPriceMmk <= 0) {
      triggerToast('Coin amount and pricing MMK must be positive numbers!', 'error');
      return;
    }

    if (editingPkgId) {
      setEditedPackages(prev => prev.map(pkg => {
        if (pkg.id === editingPkgId) {
          return {
            id: pkg.id,
            name: pkgName,
            amount: Number(pkgAmount),
            priceMmk: Number(pkgPriceMmk),
            originalPriceMmk: pkgOriginalPriceMmk ? Number(pkgOriginalPriceMmk) : undefined,
            popular: pkgPopular,
            premium: pkgPremium
          };
        }
        return pkg;
      }));
      setEditingPkgId(null);
      triggerToast('Package bundle updated inside draft specs successfully.', 'success');
    } else {
      const generatedId = `${editingProduct?.id || 'pkg'}_${Date.now()}`;
      const newPkg: ProductPackage = {
        id: generatedId,
        name: pkgName,
        amount: Number(pkgAmount),
        priceMmk: Number(pkgPriceMmk),
        originalPriceMmk: pkgOriginalPriceMmk ? Number(pkgOriginalPriceMmk) : undefined,
        popular: pkgPopular,
        premium: pkgPremium
      };
      setEditedPackages(prev => [...prev, newPkg]);
      triggerToast('Bundle package added to draft specs successfully.', 'success');
    }

    setIsAddingPackage(false);
    setPkgName('');
    setPkgAmount(100);
    setPkgPriceMmk(5000);
    setPkgOriginalPriceMmk(0);
    setPkgPopular(false);
    setPkgPremium(false);
    setEditingPkgId(null);
  };

  const handleStartEditingPackage = (pkg: ProductPackage) => {
    setEditingPkgId(pkg.id);
    setPkgName(pkg.name);
    setPkgAmount(pkg.amount);
    setPkgPriceMmk(pkg.priceMmk);
    setPkgOriginalPriceMmk(pkg.originalPriceMmk || 0);
    setPkgPopular(!!pkg.popular);
    setPkgPremium(!!pkg.premium);
    setIsAddingPackage(true);
  };

  const handleDeletePackageLocal = (pkgIdToRemove: string) => {
    setEditedPackages(prev => prev.filter(p => p.id !== pkgIdToRemove));
    triggerToast('Package bundle removed from local draft specs.', 'success');
  };

  // Load registered users from API
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const triggerToast = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ text, type });
    setTimeout(() => {
      setActionMessage(null);
    }, 4000);
  };

  // Order management actions
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        onRefreshOrders();
        triggerToast(`Order ${orderId} status set to "${status}" successfully!`, 'success');
        // Refresh users list too since balances or counters might updated
        fetchUsers();
      } else {
        triggerToast(data.error || 'Failed to update order', 'error');
      }
    } catch (err: any) {
      triggerToast(err.message || 'Network error updating order status', 'error');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete order ${orderId}?`)) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        onRefreshOrders();
        triggerToast(`Order ${orderId} deleted permanently from memory`, 'success');
      } else {
        triggerToast(data.error || 'Could not delete order', 'error');
      }
    } catch (err: any) {
      triggerToast(err.message || 'Network failure', 'error');
    }
  };

  // User management actions
  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) {
      triggerToast('Telegram username is required!', 'error');
      return;
    }
    
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramUsername: newUsername,
          displayName: newDisplayName,
          contactPhone: newPhone,
          coinsBalance: newBalance
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
        setIsAddingUser(false);
        // Reset form
        setNewUsername('');
        setNewDisplayName('');
        setNewPhone('');
        setNewBalance(0);
        triggerToast(`New user @${data.data.telegramUsername} registered successfully!`, 'success');
      } else {
        triggerToast(data.error || 'Failed to register traveler', 'error');
      }
    } catch (err: any) {
      triggerToast(err.message || 'Registry server crash', 'error');
    }
  };

  const handleStartEditingRole = (user: UserDetail) => {
    setEditingUser(user);
    setEditDisplayName(user.displayName);
    setEditPhone(user.contactPhone);
    setEditBalance(user.coinsBalance);
  };

  const handleUpdateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: editDisplayName,
          contactPhone: editPhone,
          coinsBalance: editBalance
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
        setEditingUser(null);
        triggerToast(`User @${data.data.telegramUsername} updated successfully!`, 'success');
      } else {
        triggerToast(data.error || 'Failed to update user metrics', 'error');
      }
    } catch (err: any) {
      triggerToast(err.message || 'Update server sync error', 'error');
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete user @${username}?`)) return;
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
        triggerToast(`User @${username} removed from the system`, 'success');
      } else {
        triggerToast(data.error || 'Could not delete worker', 'error');
      }
    } catch (err: any) {
      triggerToast(err.message || 'Delete sync error', 'error');
    }
  };

  // Calculations for Metrics / Revenue dashboard
  const completedOrders = orders.filter(o => o.status === 'completed');
  const revenueMmk = completedOrders.reduce((sum, o) => sum + o.priceMmk, 0);
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  const processingOrdersCount = orders.filter(o => o.status === 'processing').length;
  
  // Categorical Revenue calculation
  const categoryRevenue: Record<string, number> = {};
  const paymentRevenue: Record<string, number> = {};
  
  completedOrders.forEach(o => {
    categoryRevenue[o.category] = (categoryRevenue[o.category] || 0) + o.priceMmk;
    const method = (o.paymentMethod || 'kbzpay').toLowerCase();
    paymentRevenue[method] = (paymentRevenue[method] || 0) + o.priceMmk;
  });

  const getCategoryLabel = (id: string) => {
    const map: Record<string, string> = {
      tiktok_coins: 'TikTok Coins',
      mlbb_diamonds: 'MLBB Diamonds',
      pubg_uc: 'PUBG UC',
      freefire_diamonds: 'Free Fire Diamonds',
      hok_tokens: 'HOK Tokens'
    };
    return map[id] || id.toUpperCase();
  };

  // Filter lists
  const filteredOrders = orders.filter(order => {
    const term = ordersSearch.toLowerCase().trim();
    const matchesSearch = 
      order.id.toLowerCase().includes(term) ||
      order.telegramUsername.toLowerCase().includes(term) ||
      order.gameId.toLowerCase().includes(term) ||
      order.transactionId.toLowerCase().includes(term);
    
    if (orderFilter === 'all') return matchesSearch;
    return matchesSearch && order.status === orderFilter;
  });

  const filteredUsers = users.filter(user => {
    const term = usersSearch.toLowerCase().trim();
    return (
      user.telegramUsername.toLowerCase().includes(term) ||
      user.displayName.toLowerCase().includes(term) ||
      user.contactPhone.toLowerCase().includes(term) ||
      user.id.toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-3.5 space-y-4 text-slate-200" id="admin-hub">
      
      {/* Toast Alert Feedback */}
      {actionMessage && (
        <div className={`fixed bottom-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-xl border text-[11px] font-bold flex items-center gap-1.5 animate-bounce ${
          actionMessage.type === 'success' 
            ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-400' 
            : 'bg-rose-950/95 border-rose-500/50 text-rose-400'
        }`}>
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : (
            <ShieldAlert className="w-3.5 h-3.5" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Minimal Header Control Bar */}
      <div className="flex justify-between items-center px-1 py-1 text-slate-200">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-505"></span>
          </span>
          <span className="text-[10px] font-sans font-black tracking-wider text-slate-400 uppercase">
            ADMIN WORKSPACE
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              fetchUsers();
              onRefreshOrders();
              onRefreshProducts();
              triggerToast('Synchronized statistics updated!', 'success');
            }}
            className="flex items-center gap-1 bg-slate-900/50 hover:bg-slate-900 text-slate-400 hover:text-amber-400 font-bold text-[9px] px-2.5 py-1 rounded-md border border-slate-800/80 transition-all active:scale-95 cursor-pointer font-sans"
            title="Force refresh raw data"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            <span>SYNC DATA</span>
          </button>
          
          <button
            type="button"
            onClick={onAdminLogout}
            className="flex items-center gap-1 bg-rose-950/15 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 font-bold text-[9px] px-2.5 py-1 rounded-md border border-slate-900 transition-all active:scale-95 cursor-pointer font-sans"
          >
            <LogOut className="w-2.5 h-2.5" />
            <span>LOGOUT</span>
          </button>
        </div>
      </div>

      {/* Improved UI/UIX Menu Bar */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 p-1 rounded-lg border border-slate-900 text-[10px]" id="admin-navbar">
        {/* Tab: Metrics */}
        <button
          onClick={() => setAdminSubTab('metrics')}
          className={`relative group py-2.5 text-center font-bold uppercase tracking-wider rounded-md transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
            adminSubTab === 'metrics'
              ? 'bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/25 text-amber-400 shadow-[0_2px_12px_-3px_rgba(245,158,11,0.15)] font-black'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/20'
          }`}
        >
          <TrendingUp className={`w-3.5 h-3.5 transition-transform duration-200 ${adminSubTab === 'metrics' ? 'scale-110 text-amber-400 font-bold' : 'text-slate-400 group-hover:text-slate-300'}`} />
          <span className="text-[10px] tracking-wide font-sans">{t.adminTabMetrics || "Metrics"}</span>
          {adminSubTab === 'metrics' && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-amber-500 rounded-full"></span>
          )}
        </button>

        {/* Tab: Orders */}
        <button
          onClick={() => setAdminSubTab('orders')}
          className={`relative group py-2.5 text-center font-bold uppercase tracking-wider rounded-md transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
            adminSubTab === 'orders'
              ? 'bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/25 text-amber-400 shadow-[0_2px_12px_-3px_rgba(245,158,11,0.15)] font-black'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/20'
          }`}
        >
          <ShoppingBag className={`w-3.5 h-3.5 transition-transform duration-200 ${adminSubTab === 'orders' ? 'scale-110 text-amber-400 font-bold' : 'text-slate-400 group-hover:text-slate-300'}`} />
          <span className="text-[10px] tracking-wide font-sans">{t.adminTabOrders || "Orders"}</span>
          <span className={`text-[8.5px] px-1.5 py-0.5 rounded-full font-mono transition-all duration-200 border ${
            adminSubTab === 'orders'
              ? 'bg-amber-450/10 border-amber-500/30 text-amber-400 font-bold'
              : 'bg-slate-950 border-slate-900 text-slate-500 group-hover:text-slate-400'
          }`}>
            {orders.length}
          </span>
          {adminSubTab === 'orders' && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-amber-500 rounded-full"></span>
          )}
        </button>

        {/* Tab: Users */}
        <button
          onClick={() => setAdminSubTab('users')}
          className={`relative group py-2.5 text-center font-bold uppercase tracking-wider rounded-md transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
            adminSubTab === 'users'
              ? 'bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/25 text-amber-400 shadow-[0_2px_12px_-3px_rgba(245,158,11,0.15)] font-black'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/20'
          }`}
        >
          <Users className={`w-3.5 h-3.5 transition-transform duration-200 ${adminSubTab === 'users' ? 'scale-110 text-amber-400 font-bold' : 'text-slate-400 group-hover:text-slate-300'}`} />
          <span className="text-[10px] tracking-wide font-sans">{t.adminTabUsers || "Users"}</span>
          <span className={`text-[8.5px] px-1.5 py-0.5 rounded-full font-mono transition-all duration-200 border ${
            adminSubTab === 'users'
              ? 'bg-amber-450/10 border-amber-500/30 text-amber-400 font-bold'
              : 'bg-slate-950 border-slate-900 text-slate-500 group-hover:text-slate-400'
          }`}>
            {users.length}
          </span>
          {adminSubTab === 'users' && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-amber-500 rounded-full"></span>
          )}
        </button>

        {/* Tab: Products */}
        <button
          onClick={() => setAdminSubTab('products')}
          className={`relative group py-2.5 text-center font-bold uppercase tracking-wider rounded-md transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
            adminSubTab === 'products'
              ? 'bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/25 text-amber-400 shadow-[0_2px_12px_-3px_rgba(245,158,11,0.15)] font-black'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/20'
          }`}
        >
          <Gamepad2 className={`w-3.5 h-3.5 transition-transform duration-200 ${adminSubTab === 'products' ? 'scale-110 text-amber-400' : 'text-slate-400 group-hover:text-slate-300'}`} />
          <span className="text-[10px] tracking-wide font-sans">{t.adminTabProducts || "Products"}</span>
          <span className={`text-[8.5px] px-1.5 py-0.5 rounded-full font-mono transition-all duration-200 border ${
            adminSubTab === 'products'
              ? 'bg-amber-450/10 border-amber-500/30 text-amber-400 font-bold'
              : 'bg-slate-950 border-slate-900 text-slate-500 group-hover:text-slate-400'
          }`}>
            {catalog.length}
          </span>
          {adminSubTab === 'products' && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-amber-500 rounded-full"></span>
          )}
        </button>
      </div>

      {/* 1. METRICS SUB-TAB VIEW */}
      {adminSubTab === 'metrics' && (
        <div className="space-y-4 animate-fade-in">
          
          {/* Key Indicators Bento Widgets */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 p-3 rounded-xl border border-slate-900 space-y-1">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black block">
                {t.adminRevenueTitle || "Total Revenue"}
              </span>
              <div className="text-xl font-display font-black text-amber-400 leading-none">
                {revenueMmk.toLocaleString()} 
                <span className="text-[10px] font-mono text-slate-500 block">MMK Kyats</span>
              </div>
              <div className="flex items-center gap-1 text-[8.5px] text-emerald-400 font-bold pt-1">
                <span>{completedOrders.length} Completed Sales</span>
              </div>
            </div>

            <div className="bg-gradient-to-b from-slate-900 to-slate-950 p-3 rounded-xl border border-slate-900 space-y-1">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black block">
                {t.adminTicketAverage || "Ticket Average"}
              </span>
              <div className="text-xl font-display font-black text-white leading-none">
                {completedOrders.length > 0 
                  ? Math.round(revenueMmk / completedOrders.length).toLocaleString() 
                  : '0'
                }
                <span className="text-[10px] font-mono text-slate-500 block">MMK per Order</span>
              </div>
              <div className="flex items-center gap-1 text-[8.5px] text-amber-500 font-medium pt-1">
                <span>{pendingOrdersCount} Pending Verification</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-900/30 p-2 rounded-lg border border-slate-900/60 text-center">
              <span className="text-[8px] text-slate-500 block uppercase font-bold">{t.adminPendingLabel || "PENDING"}</span>
              <span className="text-xs font-bold text-amber-400 font-mono">{pendingOrdersCount}</span>
            </div>
            <div className="bg-slate-900/30 p-2 rounded-lg border border-slate-900/60 text-center">
              <span className="text-[8px] text-slate-500 block uppercase font-bold">{t.adminProcessingLabel || "PROCESSING"}</span>
              <span className="text-xs font-bold text-sky-400 font-mono">{processingOrdersCount}</span>
            </div>
            <div className="bg-slate-900/30 p-2 rounded-lg border border-slate-900/60 text-center">
              <span className="text-[8px] text-slate-500 block uppercase font-bold">{t.adminAllTickets || "ALL TICKETS"}</span>
              <span className="text-xs font-bold text-slate-300 font-mono">{orders.length}</span>
            </div>
          </div>

          {/* Revenue Breakdown charts by Category */}
          <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-900 space-y-3.5">
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                {t.adminRevenuesByCategory || "Revenues by Game Category"}
              </h3>
              <p className="text-[9px] text-slate-500 font-mono">Completed itemized transaction share</p>
            </div>
            
            {/* Visual Bar Lists */}
            <div className="space-y-2.5">
              {['tiktok_coins', 'mlbb_diamonds', 'pubg_uc', 'freefire_diamonds', 'hok_tokens'].map(cat => {
                const value = categoryRevenue[cat] || 0;
                const percentage = revenueMmk > 0 ? Math.round((value / revenueMmk) * 100) : 0;
                return (
                  <div key={cat} className="space-y-1">
                     <div className="flex justify-between text-[10px]">
                      <span className="text-slate-350 font-bold">{getCategoryLabel(cat)}</span>
                      <span className="text-amber-400 font-bold font-mono">
                        {value.toLocaleString()} MMK ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-900">
                      <div 
                        className="bg-amber-500 h-full rounded-full transition-all duration-700" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Revenue Breakdown by Payment Method */}
          <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-900 space-y-3.5">
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                {t.adminVolumeByBank || "Volume by Bank/Wallet Method"}
              </h3>
              <p className="text-[9px] text-slate-500 font-mono">Voucher payment gateway share</p>
            </div>

            <div className="space-y-2.5">
              {['kbzpay', 'wavepay'].map(method => {
                const value = paymentRevenue[method] || 0;
                const percentage = revenueMmk > 0 ? Math.round((value / revenueMmk) * 100) : 0;
                const label = method === 'kbzpay' ? 'KBZPay' : 'WavePay/Money';
                return (
                  <div key={method} className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-350 font-bold">{label}</span>
                      <span className="text-emerald-405 font-bold font-mono">
                        {value.toLocaleString()} MMK ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-900">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${method === 'kbzpay' ? 'bg-sky-500' : 'bg-amber-500'}`} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* 2. ORDERS SUB-TAB VIEW */}
      {adminSubTab === 'orders' && (
        <div className="space-y-3 animate-fade-in">
          
          {/* Filter, Search & Helpers */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search TxID, Username, Game ID or Order ID..."
                value={ordersSearch}
                onChange={(e) => setOrdersSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-900 rounded-lg pl-8 pr-3.5 py-2 text-xs focus:outline-none focus:border-amber-500 font-mono"
              />
              {ordersSearch && (
                <button
                  type="button"
                  onClick={() => setOrdersSearch('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick status sliders filter */}
            <div className="flex gap-1 overflow-x-auto pb-1 text-[10px] font-bold">
              {[
                { id: 'all', label: 'All Orders' },
                { id: 'pending', label: '⏳ Pending' },
                { id: 'processing', label: '⚡ Processing' },
                { id: 'completed', label: '✓ Completed' },
                { id: 'cancelled', label: '❌ Cancelled' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setOrderFilter(f.id)}
                  className={`px-2.5 py-1 rounded-md border whitespace-nowrap transition-all duration-150 cursor-pointer ${
                    orderFilter === f.id
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black border-amber-500'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Orders output database cards */}
          {filteredOrders.length === 0 ? (
            <div className="bg-slate-900/20 rounded-xl p-8 text-center text-slate-500 border border-dashed border-slate-900">
              <Filter className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <span className="text-[11px]">No orders found matching parameters.</span>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredOrders.map(order => {
                const createdTime = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const statusBorder = order.status === 'completed'
                  ? 'border-l-emerald-500'
                  : order.status === 'cancelled'
                  ? 'border-l-rose-500'
                  : order.status === 'processing'
                  ? 'border-l-sky-500'
                  : 'border-l-amber-500';

                return (
                  <div 
                    key={order.id} 
                    className={`bg-slate-900/40 border-y border-r border-slate-900 border-l-4 ${statusBorder} rounded-lg p-2.5 space-y-2 text-xs transition duration-200 hover:bg-slate-900/60`}
                  >
                    {/* Header info row */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-[#ffffff] text-[8.5px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850 tracking-wider font-mono">
                            {order.id.slice(-6).toUpperCase()}
                          </span>
                          <span className="text-amber-350 font-bold font-mono">@{order.telegramUsername}</span>
                          <span className="text-slate-500 font-mono text-[9px] shrink-0">• {createdTime}</span>
                        </div>

                        {/* Order info details */}
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-400">
                          <div>
                            <span className="text-slate-500 text-[8px] uppercase font-mono mr-1">Package:</span>
                            <span className="text-white font-bold">{order.packageName}</span>
                          </div>
                          <span className="text-slate-850 font-bold">|</span>
                          <div>
                            <span className="text-slate-505 text-[8px] uppercase font-mono mr-1">Game ID:</span>
                            <span className="text-slate-200 font-mono select-all font-bold">{order.gameId} {order.serverId ? `(${order.serverId})` : ''}</span>
                          </div>
                          <span className="text-slate-850 font-bold">|</span>
                          <div>
                            <span className="text-slate-505 text-[8px] uppercase font-mono mr-1">Bank:</span>
                            <span className="text-sky-305 font-bold uppercase font-mono">{order.paymentMethod}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right column: price and status indicators */}
                      <div className="text-right shrink-0">
                        <div className="text-xs font-black text-amber-400 font-mono leading-none">
                          {order.priceMmk.toLocaleString()}&nbsp;K
                        </div>
                        <div className="mt-1.5 flex justify-end">
                          <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider font-mono ${
                            order.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : order.status === 'cancelled'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : order.status === 'processing'
                              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Voucher, screenshot, TXID and actions bar */}
                    <div className="flex flex-col gap-2 pt-1.5 border-t border-slate-900/40">
                      
                      {/* TXID & screenshot links */}
                      <div className="flex items-center justify-between text-[8px] text-slate-500 font-mono flex-wrap gap-1">
                        <div className="text-slate-500">
                          <span className="text-slate-650 uppercase font-black mr-1">TXID:</span>
                          <span className="text-slate-350 select-all font-bold">{order.transactionId}</span>
                        </div>

                        {order.screenshotUrl && (
                          <button 
                            type="button"
                            onClick={() => setActiveReceipt({
                              url: order.screenshotUrl || '',
                              orderId: order.id,
                              transactionId: order.transactionId,
                              packageName: order.packageName,
                              gameId: order.gameId,
                              priceMmk: order.priceMmk,
                              status: order.status
                            })}
                            className="inline-flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-md border border-slate-900 hover:border-amber-500/40 transition-colors cursor-pointer text-amber-400 font-extrabold text-[8px] font-mono hover:underline"
                          >
                            <span>VIEW RECEIPT</span>
                          </button>
                        )}
                      </div>

                      {/* OCR Details block */}
                      {order.ocrVerified !== undefined && (
                        <div className={`p-1.5 rounded border text-[9px] font-mono leading-tight ${
                          order.ocrVerified 
                            ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' 
                            : 'bg-rose-955/20 border-rose-500/20 text-rose-300'
                        }`}>
                          <strong className="font-extrabold text-[8px] uppercase tracking-wide mr-1.5">OCR Status:</strong>
                          <span>{order.ocrStatusText || (order.ocrVerified ? 'Voucher matched successfully' : 'Receipt mismatch verification')}</span>
                        </div>
                      )}

                      {/* Action buttons list in one line */}
                      <div className="flex justify-end items-center gap-1.5 pt-1">
                        {order.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(order.id, 'processing')}
                            className="bg-sky-600 hover:bg-sky-500 text-slate-950 font-black px-2 py-0.5 rounded text-[8.5px] uppercase tracking-wider transition cursor-pointer"
                          >
                            Process
                          </button>
                        )}
                        
                        {(order.status === 'pending' || order.status === 'processing') && (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-2 py-0.5 rounded text-[8.5px] uppercase tracking-wider transition cursor-pointer"
                          >
                            Approve
                          </button>
                        )}

                        {order.status !== 'cancelled' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                            className="bg-slate-950 hover:bg-rose-950 hover:text-rose-450 border border-slate-850 text-slate-400 font-bold px-1.5 py-0.5 rounded text-[8.5px] transition cursor-pointer"
                            title="Decline/Cancel order"
                          >
                            Cancel
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteOrder(order.id)}
                          className="bg-slate-950 hover:bg-rose-950 text-slate-550 hover:text-rose-400 border border-slate-850 p-1.5 rounded transition cursor-pointer"
                          title="Delete order record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. USERS SUB-TAB VIEW */}
      {adminSubTab === 'users' && (
        <div className="space-y-3.5 animate-fade-in">
          
          {/* User management actions topbar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search by name, @username or phone..."
                value={usersSearch}
                onChange={(e) => setUsersSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-900 rounded-lg pl-8 pr-4 py-2 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
            
            <button
              onClick={() => {
                setEditingUser(null);
                setIsAddingUser(!isAddingUser);
              }}
              className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black px-3 rounded-lg text-xs flex items-center gap-1 transition active:scale-95 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Gamer</span>
            </button>
          </div>

          {/* User addition overlay form */}
          {isAddingUser && (
            <form onSubmit={handleCreateUserSubmit} className="bg-slate-900 p-3 rounded-xl border border-slate-850 space-y-3 animate-fade-in text-xs">
              <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                <span className="font-bold text-white uppercase text-[10px]">Create Custom Myanmar User Account</span>
                <button type="button" onClick={() => setIsAddingUser(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block uppercase">Telegram Handle *</label>
                  <input
                    type="text"
                    required
                    placeholder="kyawkyaw_game"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block uppercase">Display Nickname</label>
                  <input
                    type="text"
                    placeholder="Kyaw Kyaw"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block uppercase">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="09778239103"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block uppercase">Initial Coins Balance</label>
                  <input
                    type="number"
                    value={newBalance}
                    onChange={(e) => setNewBalance(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingUser(false)}
                  className="bg-slate-950 hover:bg-slate-800 text-slate-400 px-3 py-1 rounded text-[11px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4.5 py-1 rounded text-[11px]"
                >
                  Confirm Registry
                </button>
              </div>
            </form>
          )}

          {/* User editing overlay form */}
          {editingUser && (
            <form onSubmit={handleUpdateUserSubmit} className="bg-slate-900 border border-amber-500/40 p-3 rounded-xl space-y-3 animate-fade-in text-xs">
              <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                <div className="flex items-center gap-1 text-[10px]">
                  <Edit className="w-3.5 h-3.5 text-amber-500" />
                  <span className="font-black text-amber-400 uppercase">
                    EDIT USER: @{editingUser.telegramUsername}
                  </span>
                </div>
                <button type="button" onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block uppercase">Display Nickname</label>
                  <input
                    type="text"
                    required
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block uppercase">Contact Phone</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] text-slate-400 block uppercase">Credit/Adjust Coins Balance</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={editBalance}
                      onChange={(e) => setEditBalance(parseInt(e.target.value) || 0)}
                      className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white font-mono flex-1"
                    />
                    <div className="flex gap-1 text-[9px]">
                      <button
                        type="button"
                        onClick={() => setEditBalance(prev => prev + 100)}
                        className="bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 px-1.5 rounded"
                      >
                        +100
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditBalance(prev => prev + 500)}
                        className="bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 px-1.5 rounded"
                      >
                        +500
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditBalance(0)}
                        className="bg-slate-950 border border-slate-850 hover:bg-rose-950 text-rose-450 px-1.5 rounded"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="bg-slate-950 hover:bg-slate-800 text-slate-400 px-3 py-1 rounded text-[11px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4.5 py-1 rounded text-[11px]"
                >
                  Save Metrics Changes
                </button>
              </div>
            </form>
          )}

          {/* User cards list */}
          {usersLoading ? (
            <div className="flex justify-center p-8 text-slate-500 font-mono text-[10px]">
              Retrieving users roster details...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-slate-900/20 rounded-xl p-8 border border-dashed border-slate-900 text-center text-slate-505">
              No registered user records match search parameters.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map(user => (
                <div 
                  key={user.id}
                  className="bg-gradient-to-b from-slate-900/50 to-slate-950 p-3 rounded-xl border border-slate-900 flex justify-between items-center text-[10.5px]"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-white text-[11px]">
                        {user.displayName}
                      </span>
                      <span className="text-[9.5px] text-amber-400 font-mono font-bold">
                        @{user.telegramUsername}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-[9px] text-slate-500">
                      <div className="flex items-center gap-0.5">
                        <Coins className="w-3 h-3 text-amber-500/70" />
                        <span>Balance: <strong className="text-slate-300">{user.coinsBalance} Coins</strong></span>
                      </div>
                      <div>
                        <span>Orders Tracked: <strong className="text-slate-300">{user.totalOrdersCount}</strong></span>
                      </div>
                    </div>

                    {user.contactPhone && (
                      <div className="flex items-center gap-1 text-[9px] text-slate-400">
                        <Phone className="w-3 h-3 text-slate-550" />
                        <span>{user.contactPhone}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartEditingRole(user)}
                      className="bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800/85 p-1.5 rounded-lg transition"
                      title="Edit customer account metadata"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(user.id, user.telegramUsername)}
                      className="bg-slate-900 hover:bg-rose-950 text-slate-500 hover:text-rose-405 border border-slate-800/85 p-1.5 rounded-lg transition"
                      title="Permanently erase customer record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. PRODUCTS & PACKAGES MANAGEMENT SYSTEM */}
      {adminSubTab === 'products' && (
        <div className="space-y-4 animate-fade-in text-xs">
          
          {/* Top Actions & Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search products by name or description..."
                value={productsSearch}
                onChange={(e) => setProductsSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-900 rounded-lg pl-8 pr-4 py-2 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
            
            <button
              onClick={() => {
                setEditingProduct(null);
                setProdName('');
                setProdTagline('');
                setProdHelpText('');
                setProdIconName('Smartphone');
                setProdImageUrl('');
                setProdRequiresServerId(false);
                setEditedPackages([]);
                setIsAddingProduct(!isAddingProduct);
              }}
              className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black px-3.5 rounded-lg text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer font-sans"
            >
              <Plus className="w-4 h-4" />
              <span>New Product</span>
            </button>
          </div>

          {/* Form: Create Brand New Product Category Catalog */}
          {isAddingProduct && (
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                if (!prodName.trim()) {
                  triggerToast('Product name is required!', 'error');
                  return;
                }
                try {
                  const res = await fetch('/api/products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: prodName,
                      tagline: prodTagline,
                      iconName: prodIconName,
                      imageUrl: prodImageUrl,
                      helpText: prodHelpText,
                      requiresServerId: prodRequiresServerId,
                      isHot: prodIsHot,
                      isValue: prodIsValue
                    })
                  });
                  const data = await res.json();
                  if (data.success) {
                    onRefreshProducts();
                    setIsAddingProduct(false);
                    setProdName('');
                    setProdTagline('');
                    setProdHelpText('');
                    setProdIconName('Smartphone');
                    setProdImageUrl('');
                    setProdRequiresServerId(false);
                    setProdIsHot(false);
                    setProdIsValue(false);
                    triggerToast(`New product "${data.data.name}" catalog added! Edit details to append bundles.`, 'success');
                  } else {
                    triggerToast(data.error || 'Failed to add product.', 'error');
                  }
                } catch (err: any) {
                  triggerToast(err.message || 'Registry server sync error', 'error');
                }
              }} 
              className="bg-slate-900 p-3.5 rounded-xl border border-slate-850 space-y-3.5 animate-slide-up"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="font-extrabold text-white uppercase text-[10px] tracking-wider">
                  Create New Top-up Product Category
                </span>
                <button type="button" onClick={() => setIsAddingProduct(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block uppercase font-mono">{t.adminProductNameLabel || "Product Name *"}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Clash of Clans Coins"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block uppercase font-mono font-bold">{t.adminTaglineLabel || "Tagline (Store slogan)"}</label>
                  <input
                    type="text"
                    placeholder="Direct player ID top-up. Delivery 5 mins"
                    value={prodTagline}
                    onChange={(e) => setProdTagline(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                {renderIconSelector(prodIconName, setProdIconName)}

                {/* Professional Cover Image File Drag & Drop + URL Input */}
                <div className="space-y-1.5 col-span-2 pt-1 border-t border-slate-800/40">
                  <label className="text-[9px] text-slate-400 block uppercase font-mono font-bold">
                    Category Cover Image Target
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 items-center">
                    <div className="md:col-span-2">
                      <div className="relative border-2 border-dashed border-slate-800 hover:border-amber-500/40 rounded-lg p-3 bg-slate-950/40 text-center transition duration-150">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex flex-col items-center justify-center gap-1">
                          <Upload className="w-5 h-5 text-amber-500/80 hover:scale-105 transition-all" />
                          <span className="text-[10px] font-bold text-slate-300">
                            Drag & drop or Click to upload cover image
                          </span>
                          <span className="text-[8px] text-slate-500">
                            PNG, JPG, WebP, GIF (Saves offline in Base64 string format)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center bg-slate-950 rounded-lg p-1.5 border border-slate-900 h-24 relative overflow-hidden">
                      {prodImageUrl ? (
                        <>
                          <img
                            src={prodImageUrl}
                            alt="Cover preview"
                            className="w-full h-full object-cover rounded-md"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => setProdImageUrl('')}
                            className="absolute top-1 right-1 bg-slate-950/80 hover:bg-rose-950 border border-slate-800 text-slate-400 hover:text-white p-1 rounded-full text-[9px] transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className="text-[9px] text-slate-500 block text-center font-mono py-8">
                          No Preview
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-1 pt-1.5">
                    <span className="text-[8.5px] text-slate-500 uppercase font-mono">Or paste custom image URL:</span>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/..."
                      value={prodImageUrl}
                      onChange={(e) => setProdImageUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1 text-[11px] text-white font-mono"
                    />
                  </div>
                </div>

                <div className="col-span-2 space-y-1 pt-1.5 border-t border-slate-800/40">
                  <label className="text-[9px] text-slate-400 block uppercase font-mono">{t.adminInstructionsHelpLabel || "Instructions Helptext"}</label>
                  <textarea
                    rows={2}
                    placeholder="Specify player identification requirements (e.g. Provide CoC Player Tag e.g. #9PUYCG)."
                    value={prodHelpText}
                    onChange={(e) => setProdHelpText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div className="col-span-2 space-y-1.5 border-t border-slate-800/40 pt-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="req-srv-chk"
                      checked={prodRequiresServerId}
                      onChange={(e) => setProdRequiresServerId(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-800 accent-amber-500 text-slate-950"
                    />
                    <label htmlFor="req-srv-chk" className="text-[10px] text-slate-300 font-bold select-none cursor-pointer">
                      {t.adminRequiresServerIdLabel || "Requires Server/Zone ID during form top-up checkout?"}
                    </label>
                  </div>
                </div>

                {/* Hot and Value configuration switches */}
                <div className="col-span-2 grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-800/40">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="cat-hot-chk"
                      checked={prodIsHot}
                      onChange={(e) => setProdIsHot(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-800 accent-amber-500 text-slate-950 cursor-pointer"
                    />
                    <label htmlFor="cat-hot-chk" className="text-[10px] text-slate-300 font-bold select-none cursor-pointer flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" /> Is Hot Category / Hot Item?
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="cat-value-chk"
                      checked={prodIsValue}
                      onChange={(e) => setProdIsValue(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-800 accent-emerald-500 text-slate-950 cursor-pointer"
                    />
                    <label htmlFor="cat-value-chk" className="text-[10px] text-slate-300 font-bold select-none cursor-pointer flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-emerald-400" /> Is Value Category / Value Item?
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-1.5 pt-1.5 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingProduct(false)}
                  className="bg-slate-950 hover:bg-slate-800 text-slate-400 px-4.5 py-1.5 rounded text-[11px]"
                >
                  {t.adminCancelButton || "Cancel"}
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black px-5 py-1.5 rounded text-[11px] hover:brightness-105 transition"
                >
                  {t.adminSaveCategoryButton || "Save Product Category"}
                </button>
              </div>
            </form>
          )}

          {/* Form: Edit Existing Product & Child Packages Bundles (Rendered Inline inside catalog map loop below) */}
          {false && editingProduct && (
            <div className="bg-slate-900 border border-amber-500/30 p-4 rounded-xl space-y-4 animate-fade-in">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <Edit className="w-4 h-4 text-amber-500" />
                  <span className="font-extrabold text-amber-400 uppercase tracking-wider text-[10px]">
                    {t.adminConfigureProductHeader || "Configure"}: {editingProduct.name}
                  </span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setEditingProduct(null)} 
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Product Basics Fields Row */}
              <form onSubmit={handleUpdateProductSubmit} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 block uppercase font-mono">{t.adminProductNameLabel || "Product Name *"}</label>
                    <input
                      type="text"
                      required
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 block uppercase font-mono">{t.adminTaglineLabel || "Tagline (Store slogan)"}</label>
                    <input
                      type="text"
                      value={prodTagline}
                      onChange={(e) => setProdTagline(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 block uppercase font-mono">{t.adminChooseIconLabel || "Choose Icon"}</label>
                    <select
                      value={prodIconName}
                      onChange={(e) => setProdIconName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white"
                    >
                      <option value="Flame">Flame 🔥</option>
                      <option value="Shield">Shield 🛡️</option>
                      <option value="Target">Target 🎯</option>
                      <option value="Zap">Zap ⚡</option>
                      <option value="Sword">Sword ⚔️</option>
                      <option value="Smartphone">Smartphone 📱</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 block uppercase font-mono">{t.adminCoverImageUrlLabel || "Cover Image URL"}</label>
                    <input
                      type="text"
                      value={prodImageUrl}
                      onChange={(e) => setProdImageUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>

                  <div className="col-span-2 space-y-1">
                    <label className="text-[9px] text-slate-400 block uppercase font-mono">{t.adminInstructionsHelpLabel || "Instructions Helptext"}</label>
                    <textarea
                      rows={2}
                      value={prodHelpText}
                      onChange={(e) => setProdHelpText(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div className="col-span-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="edit-req-srv-chk"
                      checked={prodRequiresServerId}
                      onChange={(e) => setProdRequiresServerId(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-800 accent-amber-500 text-slate-950"
                    />
                    <label htmlFor="edit-req-srv-chk" className="text-[10px] text-slate-300 font-bold select-none cursor-pointer">
                      {t.adminRequiresServerIdLabel || "Requires Server/Zone ID during form top-up checkout?"}
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="bg-slate-950 hover:bg-slate-800 text-slate-400 px-4 py-1.5 rounded text-[11px]"
                  >
                    {t.adminCancelButton || "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="bg-[#22c55e] text-[#000000] font-black px-4.5 py-1.5 rounded text-[11px] hover:brightness-105"
                  >
                    {t.adminSaveCategorySpecsButton || "Save Category Specs"}
                  </button>
                </div>
              </form>

              {/* CHILD PACKAGES OR TOP-UP DENOMINATIONS MANAGER */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 space-y-3 pt-3">
                <div className="flex justify-between items-center border-b border-slate-900 pb-1.5">
                  <div className="flex items-center gap-1 font-bold text-white uppercase text-[9.5px]">
                    <Tag className="w-3.5 h-3.5 text-amber-500" />
                    <span>{t.adminPricingDiscountHeader || "Configure Pricing & Discount Bundles"} ({editedPackages.length})</span>
                  </div>

                  {!isAddingPackage && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPkgId(null);
                        setPkgName('');
                        setPkgAmount(100);
                        setPkgPriceMmk(5000);
                        setPkgOriginalPriceMmk(0);
                        setPkgPopular(false);
                        setIsAddingPackage(true);
                      }}
                      className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-[9px] px-2 py-0.5 rounded flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      {t.adminAddBundleButton || "Add Bundle"}
                    </button>
                  )}
                </div>

                {/* Inline Mini Package Creator / Editor Form */}
                {isAddingPackage && (
                  <form onSubmit={handleSavePackage} className="bg-slate-900/60 p-2.5 rounded border border-slate-900 space-y-2.5 animate-fade-in text-[11px]">
                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase">
                      <span>{editingPkgId ? (t.adminEditBundleHeader || '✏️ Edit Bundle Package') : (t.adminCreateBundleHeader || '➕ Create New Bundle Package')}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 block">{t.adminPackageNameLabel || "Package Name (Store Label) *"}</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 70 TikTok Coins"
                          value={pkgName}
                          onChange={(e) => setPkgName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-[11px]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 block">{t.adminNumericAmountLabel || "Numeric Coin Amount *"}</label>
                        <input
                          type="number"
                          required
                          value={pkgAmount}
                          onChange={(e) => setPkgAmount(parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-[11px] font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 block">{t.adminDiscountedPriceLabel || "Discounted Price (MMK) *"}</label>
                        <input
                          type="number"
                          required
                          value={pkgPriceMmk}
                          onChange={(e) => setPkgPriceMmk(parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-[11px] font-mono text-amber-400 font-bold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 block">{t.adminOriginalPriceLabel || "Original Standard Price (MMK) - (Optional)"}</label>
                        <input
                          type="number"
                          value={pkgOriginalPriceMmk}
                          onChange={(e) => setPkgOriginalPriceMmk(parseInt(e.target.value) || 0)}
                          placeholder="e.g. 6000 (shows discount %)"
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-[11px] font-mono"
                        />
                      </div>

                      <div className="col-span-2 flex flex-wrap items-center gap-4 py-0.5">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            id="pkg-pop-chk"
                            checked={pkgPopular}
                            onChange={(e) => setPkgPopular(e.target.checked)}
                            className="w-3.5 h-3.5 accent-amber-500 rounded border-slate-850"
                          />
                          <label htmlFor="pkg-pop-chk" className="text-[10px] text-slate-300 font-medium select-none cursor-pointer">
                            {t.adminHotPopularLabel || "Mark as Hot Popular Badge?"}
                          </label>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            id="pkg-prem-chk"
                            checked={pkgPremium}
                            onChange={(e) => setPkgPremium(e.target.checked)}
                            className="w-3.5 h-3.5 accent-emerald-500 rounded border-slate-850"
                          />
                          <label htmlFor="pkg-prem-chk" className="text-[10px] text-slate-300 font-medium select-none cursor-pointer">
                            {t.adminPremiumLabel || "Mark as Premium Badge?"}
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-1 font-bold pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingPackage(false)}
                        className="bg-slate-950 hover:bg-slate-800 text-slate-400 px-3 py-1 rounded text-[10px] cursor-pointer"
                      >
                        {t.adminCancelButton || "Cancel"}
                      </button>
                      <button
                        type="submit"
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1 rounded text-[10px] cursor-pointer"
                      >
                        {t.adminKeepPackageButton || "OK, Keep Package"}
                      </button>
                    </div>
                  </form>
                )}

                {/* List edited draft packages */}
                {editedPackages.length === 0 ? (
                  <div className="text-center py-4 text-slate-600 italic text-[10px]">
                    {t.adminNoPackagesLabel || "No product packages defined yet. Add some items for Myanmar players to purchase."}
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {editedPackages.map((pkg, idx) => {
                      const discountPct = pkg.originalPriceMmk && pkg.originalPriceMmk > pkg.priceMmk 
                        ? Math.round(((pkg.originalPriceMmk - pkg.priceMmk)/pkg.originalPriceMmk)*100) 
                        : 0;

                      return (
                        <div 
                          key={pkg.id || idx} 
                          className="bg-slate-900/50 p-2 rounded border border-slate-900 flex justify-between items-center text-[10.5px] font-mono hover:bg-slate-900 hover:border-amber-500/30 transition-all select-none"
                        >
                          {/* Inner Left area - Click to edit */}
                          <div 
                            onClick={() => handleStartEditingPackage(pkg)}
                            className="flex-1 cursor-pointer pr-3"
                            title="Click to modify this package"
                          >
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="font-bold text-slate-200 font-sans">{pkg.name}</span>
                              {pkg.popular && (
                                <span className="bg-amber-500/10 text-amber-400 text-[8px] font-bold font-sans px-1 rounded-sm flex items-center gap-0.5">
                                  <Star className="w-2 h-2 fill-amber-400" /> Hot
                                </span>
                              )}
                              {pkg.premium && (
                                <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-bold font-sans px-1 rounded-sm flex items-center gap-0.5">
                                  💎 Premium
                                </span>
                              )}
                            </div>
                            <div className="text-[9px] text-slate-500 flex items-center gap-2 font-mono">
                              <span>Amount: {pkg.amount}</span>
                              <span>•</span>
                              <span>Price: <strong className="text-amber-400">{pkg.priceMmk.toLocaleString()} MMK</strong></span>
                              {discountPct > 0 && (
                                <span>• <strong className="text-emerald-400">-{discountPct}% Off</strong></span>
                              )}
                            </div>
                          </div>

                          {/* Inner Right area - Separate Action Buttons */}
                          <div className="flex items-center gap-1 shrink-0 z-10">
                            <button
                              type="button"
                              onClick={() => handleStartEditingPackage(pkg)}
                              className="bg-slate-950 hover:bg-slate-800 text-amber-400 p-1.5 rounded border border-slate-800 hover:border-amber-500/30 cursor-pointer flex items-center justify-center min-w-[28px] min-h-[28px] transition active:scale-95"
                              title="Modify package pricing"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePackageLocal(pkg.id)}
                              className="bg-slate-955 hover:bg-rose-950 text-slate-400 hover:text-rose-400 p-1.5 rounded border border-slate-800 hover:border-rose-900/30 cursor-pointer flex items-center justify-center min-w-[28px] min-h-[28px] transition active:scale-95"
                              title="Delete package"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Product Cards Catalog Roster Grid */}
          <div className="space-y-2.5">
            {catalog.filter(p => {
              const term = productsSearch.toLowerCase().trim();
              return p.name.toLowerCase().includes(term) || p.tagline.toLowerCase().includes(term);
            }).map((product) => {
              if (editingProduct && editingProduct.id === product.id) {
                return (
                  <div 
                    key={product.id} 
                    className="bg-slate-900 border-2 border-amber-500 p-4 rounded-xl space-y-4 animate-fade-in text-xs shadow-xl shadow-amber-500/10"
                  >
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-1.5 font-sans">
                        <Edit className="w-4 h-4 text-amber-500 animate-pulse" />
                        <span className="font-extrabold text-amber-400 uppercase tracking-wider text-[10px]">
                          {t.adminConfigureProductHeader || "Configure"}: {editingProduct.name}
                        </span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setEditingProduct(null)} 
                        className="text-slate-400 hover:text-white cursor-pointer p-1"
                        title="Close editor"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Product Basics Fields Row */}
                    <form onSubmit={handleUpdateProductSubmit} className="space-y-3.5">
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-400 block uppercase font-mono">{t.adminProductNameLabel || "Product Name *"}</label>
                          <input
                            type="text"
                            required
                            value={prodName}
                            onChange={(e) => setProdName(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:border-amber-500/55 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-400 block uppercase font-mono">{t.adminTaglineLabel || "Tagline (Store slogan)"}</label>
                          <input
                            type="text"
                            value={prodTagline}
                            onChange={(e) => setProdTagline(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:border-amber-500/55 focus:outline-none"
                          />
                        </div>

                        {renderIconSelector(prodIconName, setProdIconName)}

                        {/* Professional Cover Image File Drag & Drop + URL Input */}
                        <div className="space-y-1.5 col-span-2 pt-1 border-t border-slate-800/40">
                          <label className="text-[9px] text-slate-400 block uppercase font-mono font-bold">
                            Category Cover Image Target
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 items-center">
                            <div className="md:col-span-2">
                              <div className="relative border-2 border-dashed border-slate-800 hover:border-amber-500/40 rounded-lg p-3 bg-slate-950/40 text-center transition duration-150">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleCoverFileChange}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="flex flex-col items-center justify-center gap-1">
                                  <Upload className="w-5 h-5 text-amber-500/80 hover:scale-105 transition-all" />
                                  <span className="text-[10px] font-bold text-slate-300">
                                    Drag & drop or Click to upload cover image
                                  </span>
                                  <span className="text-[8px] text-slate-500">
                                    PNG, JPG, WebP, GIF (Saves offline in Base64 string format)
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-center justify-center bg-slate-950 rounded-lg p-1.5 border border-slate-900 h-24 relative overflow-hidden">
                              {prodImageUrl ? (
                                <>
                                  <img
                                    src={prodImageUrl}
                                    alt="Cover preview"
                                    className="w-full h-full object-cover rounded-md"
                                    referrerPolicy="no-referrer"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setProdImageUrl('')}
                                    className="absolute top-1 right-1 bg-slate-950/80 hover:bg-rose-950 border border-slate-800 text-slate-400 hover:text-white p-1 rounded-full text-[9px] transition-colors"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <span className="text-[9px] text-slate-550 block text-center font-mono py-8">
                                  No Preview
                                  </span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-1 pt-1.5">
                            <span className="text-[8.5px] text-slate-500 uppercase font-mono">Or paste custom image URL:</span>
                            <input
                              type="text"
                              placeholder="https://images.unsplash.com/..."
                              value={prodImageUrl}
                              onChange={(e) => setProdImageUrl(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1 text-[11px] text-white font-mono focus:border-amber-500/55 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="col-span-2 space-y-1 pt-1.5 border-t border-slate-800/40">
                          <label className="text-[9px] text-slate-400 block uppercase font-mono">{t.adminInstructionsHelpLabel || "Instructions Helptext"}</label>
                          <textarea
                            rows={2}
                            value={prodHelpText}
                            onChange={(e) => setProdHelpText(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:border-amber-500/55 focus:outline-none"
                          />
                        </div>

                        <div className="col-span-2 space-y-1.5 border-t border-slate-800/40 pt-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="edit-req-srv-chk"
                              checked={prodRequiresServerId}
                              onChange={(e) => setProdRequiresServerId(e.target.checked)}
                              className="w-4 h-4 rounded border-slate-800 accent-amber-500 text-slate-950 cursor-pointer"
                            />
                            <label htmlFor="edit-req-srv-chk" className="text-[10px] text-slate-350 font-bold select-none cursor-pointer">
                              {t.adminRequiresServerIdLabel || "Requires Server/Zone ID during form top-up checkout?"}
                            </label>
                          </div>
                        </div>

                        {/* Hot and Value configuration switches */}
                        <div className="col-span-2 grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-800/40">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="edit-cat-hot-chk"
                              checked={prodIsHot}
                              onChange={(e) => setProdIsHot(e.target.checked)}
                              className="w-4 h-4 rounded border-slate-800 accent-amber-500 text-slate-950 cursor-pointer"
                            />
                            <label htmlFor="edit-cat-hot-chk" className="text-[10px] text-slate-350 font-bold select-none cursor-pointer flex items-center gap-1">
                              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" /> Is Hot Category / Hot Item?
                            </label>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="edit-cat-value-chk"
                              checked={prodIsValue}
                              onChange={(e) => setProdIsValue(e.target.checked)}
                              className="w-4 h-4 rounded border-slate-800 accent-emerald-500 text-slate-950 cursor-pointer"
                            />
                            <label htmlFor="edit-cat-value-chk" className="text-[10px] text-slate-350 font-bold select-none cursor-pointer flex items-center gap-1">
                              <Tag className="w-3.5 h-3.5 text-emerald-400" /> Is Value Category / Value Item?
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => setEditingProduct(null)}
                          className="bg-slate-950 hover:bg-slate-800 text-slate-400 px-4 py-1.5 rounded text-[11px] cursor-pointer"
                        >
                          {t.adminCancelButton || "Cancel"}
                        </button>
                        <button
                          type="submit"
                          className="bg-[#22c55e] text-[#000000] font-black px-4.5 py-1.5 rounded text-[11px] hover:brightness-105 cursor-pointer"
                        >
                          {t.adminSaveCategorySpecsButton || "Save Category Specs"}
                        </button>
                      </div>
                    </form>

                    {/* CHILD PACKAGES OR TOP-UP DENOMINATIONS MANAGER */}
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 space-y-3 pt-3">
                      <div className="flex justify-between items-center border-b border-slate-900 pb-1.5">
                        <div className="flex items-center gap-1 font-bold text-white uppercase text-[9.5px]">
                          <Tag className="w-3.5 h-3.5 text-amber-500" />
                          <span>{t.adminPricingDiscountHeader || "Configure Pricing & Discount Bundles"} ({editedPackages.length})</span>
                        </div>

                        {!isAddingPackage && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPkgId(null);
                              setPkgName('');
                              setPkgAmount(100);
                              setPkgPriceMmk(5000);
                              setPkgOriginalPriceMmk(0);
                              setPkgPopular(false);
                              setIsAddingPackage(true);
                            }}
                            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-[9px] px-2 py-0.5 rounded flex items-center gap-0.5 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            {t.adminAddBundleButton || "Add Bundle"}
                          </button>
                        )}
                      </div>

                      {/* Inline Mini Package Creator / Editor Form */}
                      {isAddingPackage && (
                        <form onSubmit={handleSavePackage} className="bg-slate-905 p-2.5 rounded border border-slate-900 space-y-2.5 animate-fade-in text-[11px]">
                          <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase">
                            <span>{editingPkgId ? (t.adminEditBundleHeader || '✏️ Edit Bundle Package') : (t.adminCreateBundleHeader || '➕ Create New Bundle Package')}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[9px] text-slate-400 block">{t.adminPackageNameLabel || "Package Name (Store Label) *"}</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. 70 TikTok Coins"
                                value={pkgName}
                                onChange={(e) => setPkgName(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-[11px] focus:outline-none focus:border-amber-500/55"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] text-slate-400 block">{t.adminNumericAmountLabel || "Numeric Coin Amount *"}</label>
                              <input
                                type="number"
                                required
                                value={pkgAmount}
                                onChange={(e) => setPkgAmount(parseInt(e.target.value) || 0)}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-[11px] font-mono focus:outline-none focus:border-amber-500/55"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] text-slate-400 block">{t.adminDiscountedPriceLabel || "Discounted Price (MMK) *"}</label>
                              <input
                                type="number"
                                required
                                value={pkgPriceMmk}
                                onChange={(e) => setPkgPriceMmk(parseInt(e.target.value) || 0)}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-[11px] font-mono text-amber-400 font-bold focus:outline-none focus:border-amber-500/55"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] text-slate-400 block">{t.adminOriginalPriceLabel || "Original Standard Price (MMK) - (Optional)"}</label>
                              <input
                                type="number"
                                value={pkgOriginalPriceMmk}
                                onChange={(e) => setPkgOriginalPriceMmk(parseInt(e.target.value) || 0)}
                                placeholder="e.g. 6000 (shows discount %)"
                                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-[11px] font-mono focus:outline-none focus:border-amber-500/55"
                              />
                            </div>

                            <div className="col-span-2 flex flex-wrap items-center gap-4 py-0.5">
                              <div className="flex items-center gap-1.5 col-span-2 md:col-span-1">
                                <input
                                  type="checkbox"
                                  id="pkg-pop-chk"
                                  checked={pkgPopular}
                                  onChange={(e) => setPkgPopular(e.target.checked)}
                                  className="w-3.5 h-3.5 accent-amber-500 rounded border-slate-850 cursor-pointer"
                                />
                                <label htmlFor="pkg-pop-chk" className="text-[10px] text-slate-300 font-medium select-none cursor-pointer">
                                  {t.adminHotPopularLabel || "Mark as Hot Popular Badge?"}
                                </label>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="checkbox"
                                  id="pkg-prem-chk"
                                  checked={pkgPremium}
                                  onChange={(e) => setPkgPremium(e.target.checked)}
                                  className="w-3.5 h-3.5 accent-emerald-500 rounded border-slate-850 cursor-pointer"
                                />
                                <label htmlFor="pkg-prem-chk" className="text-[10px] text-slate-300 font-medium select-none cursor-pointer">
                                  {t.adminPremiumLabel || "Mark as Premium Badge?"}
                                </label>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end gap-1 font-bold pt-1">
                            <button
                              type="button"
                              onClick={() => setIsAddingPackage(false)}
                              className="bg-slate-950 hover:bg-slate-800 text-slate-400 px-3 py-1 rounded text-[10px] cursor-pointer"
                            >
                              {t.adminCancelButton || "Cancel"}
                            </button>
                            <button
                              type="submit"
                              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1 rounded text-[10px] cursor-pointer"
                            >
                              {t.adminKeepPackageButton || "OK, Keep Package"}
                            </button>
                          </div>
                        </form>
                      )}

                      {/* List edited draft packages */}
                      {editedPackages.length === 0 ? (
                        <div className="text-center py-4 text-slate-600 italic text-[10px]">
                          {t.adminNoPackagesLabel || "No product packages defined yet. Add some items for Myanmar players to purchase."}
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                          {editedPackages.map((pkg, idx) => {
                            const discountPct = pkg.originalPriceMmk && pkg.originalPriceMmk > pkg.priceMmk 
                              ? Math.round(((pkg.originalPriceMmk - pkg.priceMmk)/pkg.originalPriceMmk)*100) 
                              : 0;

                            return (
                              <div 
                                key={pkg.id || idx} 
                                className="bg-slate-900/50 p-2 rounded border border-slate-900 flex justify-between items-center text-[10.5px] font-mono hover:bg-slate-900 hover:border-amber-500/30 transition-all select-none"
                              >
                                {/* Inner Left area - Click to edit */}
                                <div 
                                  onClick={() => handleStartEditingPackage(pkg)}
                                  className="flex-1 cursor-pointer pr-3"
                                  title="Click to modify this package"
                                >
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <span className="font-bold text-slate-200 font-sans">{pkg.name}</span>
                                    {pkg.popular && (
                                      <span className="bg-amber-500/10 text-amber-400 text-[8px] font-bold font-sans px-1 rounded-sm flex items-center gap-0.5">
                                        <Star className="w-2 h-2 fill-amber-400" /> Hot
                                      </span>
                                    )}
                                    {pkg.premium && (
                                      <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-bold font-sans px-1 rounded-sm flex items-center gap-0.5">
                                        💎 Premium
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[9px] text-slate-500 flex items-center gap-2 font-mono">
                                    <span>Amount: {pkg.amount}</span>
                                    <span>•</span>
                                    <span>Price: <strong className="text-amber-400">{pkg.priceMmk.toLocaleString()} MMK</strong></span>
                                    {discountPct > 0 && (
                                      <span>• <strong className="text-emerald-400">-{discountPct}% Off</strong></span>
                                    )}
                                  </div>
                                </div>

                                {/* Inner Right area - Separate Action Buttons */}
                                <div className="flex items-center gap-1 shrink-0 z-10">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditingPackage(pkg)}
                                    className="bg-slate-950 hover:bg-slate-800 text-amber-400 p-1.5 rounded border border-slate-800 hover:border-amber-500/30 cursor-pointer flex items-center justify-center min-w-[28px] min-h-[28px] transition active:scale-95"
                                    title="Modify package pricing"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePackageLocal(pkg.id)}
                                    className="bg-slate-955 hover:bg-rose-950 text-slate-400 hover:text-rose-400 p-1.5 rounded border border-slate-800 hover:border-rose-900/30 cursor-pointer flex items-center justify-center min-w-[28px] min-h-[28px] transition active:scale-95"
                                    title="Delete package"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <div 
                  key={product.id}
                  className="bg-slate-900/90 bg-gradient-to-b from-slate-900 to-slate-950 rounded-xl p-3 border border-slate-800/80 hover:border-amber-500/40 space-y-3 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-200 group select-none relative"
                >
                <div className="flex items-start justify-between gap-3">
                  {/* Left part - Clickable to enter product edit spec form */}
                  <div 
                    onClick={() => handleStartEditingProduct(product)}
                    className="flex items-center gap-2.5 flex-1 cursor-pointer group-hover:opacity-95"
                    title="Click to view or edit product specs"
                  >
                    <img 
                      src={product.imageUrl} 
                      alt={product.name}
                      className="w-10 h-10 rounded-lg object-cover border border-slate-800 group-hover:border-amber-550/35 transition"
                    />
                    <div>
                      <h4 className="font-display font-black text-white text-xs flex items-center gap-1.5 flex-wrap group-hover:text-amber-400 transition">
                        <span>{product.name}</span>
                        <span className="text-[9px] text-slate-500 font-mono font-normal">({product.id})</span>
                        {product.isHot && (
                          <span className="bg-amber-500/20 border border-amber-500/30 text-amber-500 text-[8px] font-extrabold px-1.5 py-0.2 rounded uppercase">
                            🔥 Hot Category
                          </span>
                        )}
                        {product.isValue && (
                          <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[8px] font-extrabold px-1.5 py-0.2 rounded uppercase">
                            🏷️ Best Value
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-sans tracking-wide mt-0.5">{product.tagline}</p>
                    </div>
                  </div>

                  {/* Right part - Explicit separate action buttons */}
                  <div className="flex items-center gap-1.5 shrink-0 z-10">
                    <button
                      type="button"
                      onClick={() => handleStartEditingProduct(product)}
                      className="bg-slate-900 hover:bg-slate-800 text-amber-500 hover:text-amber-450 border border-slate-800 hover:border-amber-500/30 p-2 rounded-lg transition cursor-pointer flex items-center justify-center min-w-[32px] min-h-[32px] active:scale-95"
                      title="Edit basic specs and packages list"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(product.id, product.name)}
                      className="bg-slate-900 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900/45 p-2 rounded-lg transition cursor-pointer flex items-center justify-center min-w-[32px] min-h-[32px] active:scale-95"
                      title="Permanently remove entire category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Clickable bottom specifications panel */}
                <div 
                  onClick={() => handleStartEditingProduct(product)}
                  className="grid grid-cols-3 gap-1.5 text-[9px] font-mono text-slate-500 border-t border-slate-900 pt-2 bg-slate-950/20 p-1 px-2 rounded-md cursor-pointer hover:bg-slate-950/50 transition-colors"
                >
                  <div>
                    <span className="text-slate-600 uppercase font-black mr-1">Icon:</span>
                    <span className="text-slate-300 font-bold">{product.iconName}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 uppercase font-black mr-1">ServerID Required:</span>
                    <span className="text-slate-300 font-bold">{product.requiresServerId ? 'TRUE' : 'FALSE'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-600 uppercase font-black mr-1">Bundles:</span>
                    <span className="text-amber-405 font-black">{product.packages.length} Packages</span>
                  </div>
                </div>

                {/* Quick horizontal preview of current denominations in store */}
                {product.packages.length > 0 && (
                  <div 
                    onClick={() => handleStartEditingProduct(product)}
                    className="flex flex-wrap gap-1 text-[8.5px] font-mono pt-1 cursor-pointer"
                  >
                    {product.packages.map((pkg, pIdx) => (
                      <span key={pkg.id || pIdx} className="bg-slate-950 text-slate-400 px-1.5 py-0.5 rounded border border-slate-900">
                        {pkg.name} ({pkg.priceMmk.toLocaleString()} K)
                      </span>
                    ))}
                  </div>
                )}
                </div>
              );
            })}

            {catalog.length === 0 && (
              <div className="bg-slate-900/30 rounded-xl p-8 text-center text-slate-500 border border-dashed border-slate-900">
                <Gamepad2 className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <span className="text-[11px]">No products loaded in the top-up shop database.</span>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Admin screen overlay lightbox for receipts/screenshots. Fixes non-clickable base64 URLs / iframe blocks */}
      {activeReceipt && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-3 animate-fade-in"
          onClick={() => setActiveReceipt(null)}
        >
          <div 
            className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full overflow-hidden text-slate-200 relative shadow-2xl animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-3 bg-slate-950 border-b border-slate-900 flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-amber-500 animate-pulse" />
                <span className="font-display font-black text-xs text-white uppercase tracking-wider">
                  Admin Voucher Review
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                className="w-10 h-10 -mr-2 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-850 rounded-full transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-slate-300 hover:text-white" />
              </button>
            </div>

            {/* Receipt Image Box */}
            <div className="p-3 bg-slate-950 flex justify-center items-center h-80 border-b border-slate-900 overflow-hidden relative group">
              <img
                src={activeReceipt.url}
                alt="Payment proof screenshot"
                className="max-h-full max-w-full object-contain rounded-md shadow-lg"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Metadata Parameters Grid */}
            <div className="p-3.5 bg-slate-900 space-y-2 text-xs font-mono">
              <div className="grid grid-cols-2 gap-1 text-[10px] sm:text-[10.5px] border-b border-slate-800/40 pb-1.5">
                <span className="text-slate-500 uppercase font-bold">Ticket ID:</span>
                <span className="text-slate-200 font-extrabold text-right select-all">{activeReceipt.orderId.toUpperCase()}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-1 text-[10px] sm:text-[10.5px] border-b border-slate-800/40 pb-1.5">
                <span className="text-slate-500 uppercase font-bold text-slate-400">TXID:</span>
                <span className="text-slate-250 font-bold select-all text-right break-all">{activeReceipt.transactionId}</span>
              </div>

              <div className="grid grid-cols-2 gap-1 text-[10px] sm:text-[10.5px] border-b border-slate-800/40 pb-1.5">
                <span className="text-slate-500 uppercase font-bold">Item & Package:</span>
                <span className="text-amber-400 font-extrabold text-right truncate" title={activeReceipt.packageName}>{activeReceipt.packageName}</span>
              </div>

              <div className="grid grid-cols-2 gap-1 text-[10px] sm:text-[10.5px] border-b border-slate-800/40 pb-1.5">
                <span className="text-slate-500 uppercase font-bold">Price MMK:</span>
                <span className="text-emerald-400 font-black text-right">{activeReceipt.priceMmk.toLocaleString()}&nbsp;MMK</span>
              </div>

              <div className="grid grid-cols-2 gap-1 text-[10px] sm:text-[10.5px]">
                <span className="text-slate-500 uppercase font-bold">Status:</span>
                <span className="text-right">
                  <span className={`inline-block font-extrabold px-1.5 py-0.5 rounded text-[9px] ${
                    activeReceipt.status === 'completed'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : activeReceipt.status === 'cancelled'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {activeReceipt.status.toUpperCase()}
                  </span>
                </span>
              </div>
            </div>

            {/* Bottom Button Rows with minimum 44px hit sizes for high-usability tap response */}
            <div className="p-3 bg-slate-950 border-t border-slate-900 flex gap-2">
              <a
                href={activeReceipt.url}
                download={`admin-ticket-${activeReceipt.orderId.slice(-6).toUpperCase()}.png`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-slate-900 hover:bg-slate-850 hover:text-white border border-slate-800 hover:border-slate-750 text-slate-300 text-center rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                <span>Save Offline</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </a>

              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 hover:scale-[1.01] rounded-lg font-black text-[10px] sm:text-[11px] uppercase tracking-wider transition-all duration-150 cursor-pointer min-h-[44px]"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
