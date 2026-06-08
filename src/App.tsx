/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import ShopCatalog from './components/ShopCatalog';
import CheckoutModal from './components/CheckoutModal';
import AiAssistant from './components/AiAssistant';
import OrderHistory from './components/OrderHistory';
import AdminDashboard from './components/AdminDashboard';
import UserAuthModal from './components/UserAuthModal';
import AdminLoginModal from './components/AdminLoginModal';
import { GameCategoryDetail, ProductPackage, Order } from './types';
import { Language, TRANSLATIONS } from './translations';

export default function App() {
  // Localization states
  const [language, setLanguage] = useState<Language>('en');
  const t = TRANSLATIONS[language];

  // Navigation states
  const [activeTab, setActiveTab] = useState<'shop' | 'chat' | 'orders' | 'admin'>('shop');
  const [telegramUser, setTelegramUser] = useState(''); // Empty initially so new users are forced to auth during checkout
  const [telegramAutoUser, setTelegramAutoUser] = useState<string>(''); // Holds detected but unregistered user handle
  const [autoSessionLoaded, setAutoSessionLoaded] = useState<string | null>(null); // Welcomes returning users
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState<boolean>(false);
  const [showUserAuthModal, setShowUserAuthModal] = useState<boolean>(false);
  const [pendingSelection, setPendingSelection] = useState<{
    category: GameCategoryDetail;
    pkg: ProductPackage;
  } | null>(null);
  
  // Data State
  const [catalog, setCatalog] = useState<GameCategoryDetail[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Shopping Cart States
  const [cart, setCart] = useState<{
    category: GameCategoryDetail;
    pkg: ProductPackage;
    quantity: number;
  }[]>([]);
  const [selectedCheckoutCart, setSelectedCheckoutCart] = useState<boolean>(false);

  // Cart actions
  const handleAddToCart = useCallback((category: GameCategoryDetail, pkg: ProductPackage) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.category.id === category.id && item.pkg.id === pkg.id);
      if (existingIndex > -1) {
        const copy = [...prev];
        copy[existingIndex].quantity += 1;
        return copy;
      }
      return [...prev, { category, pkg, quantity: 1 }];
    });
  }, []);

  const handleUpdateCartQty = useCallback((categoryId: string, pkgId: string, delta: number) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.category.id === categoryId && item.pkg.id === pkgId);
      if (existingIndex > -1) {
        const copy = [...prev];
        const newQty = copy[existingIndex].quantity + delta;
        if (newQty <= 0) {
          return copy.filter((_, i) => i !== existingIndex);
        }
        copy[existingIndex].quantity = newQty;
        return copy;
      }
      return prev;
    });
  }, []);

  const handleRemoveFromCart = useCallback((categoryId: string, pkgId: string) => {
    setCart(prev => prev.filter(item => !(item.category.id === categoryId && item.pkg.id === pkgId)));
  }, []);

  const handleClearCart = useCallback(() => {
    setCart([]);
  }, []);

  const handleCheckoutCart = useCallback(() => {
    if (cart.length === 0) return;
    const cleanUser = telegramUser.replace('@', '').trim();
    if (!cleanUser) {
      setShowUserAuthModal(true);
    } else {
      setSelectedCheckoutCart(true);
    }
  }, [cart, telegramUser]);



  // Fetch product catalog from server
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success) {
        setCatalog(data.data);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  // Fetch user order history
  const fetchOrders = useCallback(async () => {
    try {
      // In Admin Dashboard, we want to view and aggregate ALL orders system-wide.
      // Otherwise, users only see their own custom logs.
      const url = telegramUser && telegramUser !== '@' && activeTab !== 'admin'
        ? `/api/orders?telegram=${encodeURIComponent(telegramUser)}`
        : '/api/orders';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setIsLoading(false);
    }
  }, [telegramUser, activeTab]);

  // Auto-detect Telegram Web App environment on startup
  useEffect(() => {
    // 1. Initialize real Telegram WebApp context
    const webApp = (window as any).Telegram?.WebApp;
    if (webApp) {
      try {
        webApp.ready();
        webApp.expand();
        if (typeof webApp.enableClosingConfirmation === 'function') {
          webApp.enableClosingConfirmation();
        }
        // Force slate-950 header color if customizable
        if (typeof webApp.setHeaderColor === 'function') {
          webApp.setHeaderColor('#020617');
        }
        if (typeof webApp.setBackgroundColor === 'function') {
          webApp.setBackgroundColor('#020617');
        }
      } catch (tgErr) {
        console.warn('Telegram WebApp setup warning:', tgErr);
      }
    }

    const detectTelegramUser = async () => {
      let username: string | undefined = undefined;
      if (webApp && webApp.initDataUnsafe?.user) {
        username = webApp.initDataUnsafe.user.username || `tg_${webApp.initDataUnsafe.user.id}`;
      }

      // 2. Allow simulated Query Parameter (e.g. ?tg_username=zawgyi_pro) to verify the behavior in Preview panel
      const params = new URLSearchParams(window.location.search);
      const urlUser = params.get('tg_username') || params.get('tg_user');
      if (urlUser) {
        username = urlUser;
      }

      if (!username) {
        return;
      }

      const cleanName = username.replace('@', '').trim().toLowerCase();
      try {
        const res = await fetch('/api/users/login-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegramUsername: cleanName })
        });
        const data = await res.json();
        
        if (res.ok && data.success) {
          // OLD User: "If for old users, for sign in, it automates the login."
          setTelegramUser(`@${data.data.telegramUsername}`);
          setAutoSessionLoaded(data.data.displayName || `@${data.data.telegramUsername}`);
          console.log(`Telegram Auto-Login Successful for old user: @${data.data.telegramUsername}`);
        } else {
          // NEW User: "if they open in telegram.. signed in /sign up automatically. but just to ask name and phone in the sign up"
          setTelegramAutoUser(cleanName);
          console.log(`Telegram user @${cleanName} detected. New user, waiting for checkout to ask for details.`);
        }
      } catch (err) {
        console.error('Failed to run automatic Telegram login check:', err);
      }
    };

    detectTelegramUser();
  }, []);

  // Initial retrieve of collections
  useEffect(() => {
    fetchProducts();
  }, []);

  // Poll for status progress verification (4.5s intervals)
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => {
      fetchOrders();
    }, 4500);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Handle Checkout form submission
  const handleCheckoutSubmit = async (payload: any): Promise<any> => {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders();
      }
      return data;
    } catch (err: any) {
      console.error('Checkout error:', err);
      return { success: false, error: err.message || 'Checkout failed.' };
    }
  };

  // Chat queries with server agent proxying Google Gemini model
  const handleSendAiMessage = async (textToSend: string, mode: 'auto' | 'manual' = 'auto'): Promise<string> => {
    const queryPayload = {
      messages: [{ sender: 'user', text: textToSend }],
      userTelegram: telegramUser,
      language: language,
      mode
    };

    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(queryPayload)
    });
    
    const data = await res.json();
    if (data.success || data.text) {
      return data.text;
    }
    throw new Error('Gemini API unreachable');
  };

  // Direct Simulated TG Admin Order Approval helper
  const handleApproveOrder = async (orderId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Simulated approval error:', err);
      return false;
    }
  };

  const pendingCount = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col w-full max-w-md md:max-w-3xl lg:max-w-5xl mx-auto md:border-x border-slate-900 shadow-3xl relative pb-8">
      
      {/* Decorative Golden Top Glow Accent for Gamers */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500/0 via-amber-500/80 to-amber-500/0 z-40 pointer-events-none"></div>

      {/* Telegram App Frame Container Header with translate properties */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        telegramUser={telegramUser}
        setTelegramUser={setTelegramUser}
        pendingCount={pendingCount}
        language={language}
        setLanguage={setLanguage}
        t={t}
        isAdminLoggedIn={isAdminLoggedIn}
        onAdminLoginTrigger={() => {
          if (isAdminLoggedIn) {
            setIsAdminLoggedIn(false);
            if (activeTab === 'admin') {
              setActiveTab('shop');
            }
          } else {
            setShowAdminLoginModal(true);
          }
        }}
      />

      {/* Telegram Session Status Banners */}
      {autoSessionLoaded && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-3 py-1.5 flex items-center justify-between text-[11px] text-emerald-400 font-mono animate-slide-up">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
            <span>⚡ TELEGRAM AUTO-LOGIN ACTIVE: <strong className="text-white">{autoSessionLoaded}</strong></span>
          </div>
          <button 
            onClick={() => setAutoSessionLoaded(null)} 
            className="text-slate-400 hover:text-white font-sans text-xs shrink-0 cursor-pointer px-1"
          >
            ×
          </button>
        </div>
      )}

      {telegramAutoUser && !telegramUser && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-3 py-1.5 flex items-center justify-between text-[10.5px] text-amber-400 font-mono animate-slide-up">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
            <span>📱 TG HANDLE SYNCED: <strong className="text-white">@{telegramAutoUser}</strong> (NOT REGISTERED)</span>
          </div>
          <p className="text-[9.5px] text-slate-450 italic hidden sm:block">Onboarding matches at checkout</p>
        </div>
      )}

      {/* Main tab panel body content context */}
      <main className="flex-1 pb-4">
        {activeTab === 'shop' && (
          catalog.length > 0 ? (
            <ShopCatalog
              categories={catalog}
              telegramUser={telegramUser}
              onSelectPackage={(category, pkg) => {
                // Add to cart if not present
                setCart(prev => {
                  const exists = prev.some(item => item.category.id === category.id && item.pkg.id === pkg.id);
                  if (exists) return prev;
                  return [...prev, { category, pkg, quantity: 1 }];
                });
                const cleanUser = telegramUser.replace('@', '').trim();
                if (!cleanUser) {
                  setPendingSelection({ category, pkg });
                  setShowUserAuthModal(true);
                } else {
                  setSelectedCheckoutCart(true);
                }
              }}
              cart={cart}
              onAddToCart={handleAddToCart}
              onUpdateCartQty={handleUpdateCartQty}
              onRemoveFromCart={handleRemoveFromCart}
              onClearCart={handleClearCart}
              onCheckoutCart={handleCheckoutCart}
              t={t}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-slate-500 h-[60vh] space-y-3">
              <span className="w-6 h-6 rounded-full border-2 border-slate-800 border-t-amber-500 animate-spin"></span>
              <span className="text-[11px] font-mono tracking-wider text-slate-400">CONNECTING GATEWAY CORE...</span>
            </div>
          )
        )}

        {activeTab === 'chat' && (
          <AiAssistant
            telegramUser={telegramUser}
            onSendMessage={handleSendAiMessage}
            language={language}
            t={t}
            isAdmin={isAdminLoggedIn}
          />
        )}

        {activeTab === 'orders' && (
          <OrderHistory
            orders={orders}
            telegramUser={telegramUser}
            onApproveOrder={handleApproveOrder}
            t={t}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            orders={orders}
            onRefreshOrders={fetchOrders}
            telegramUser={telegramUser}
            t={t}
            catalog={catalog}
            onRefreshProducts={fetchProducts}
            onAdminLogout={() => {
              setIsAdminLoggedIn(false);
              setActiveTab('shop');
            }}
          />
        )}
      </main>

      {/* Slide-over checkout form modal */}
      {selectedCheckoutCart && cart.length > 0 && (
        <CheckoutModal
          cartItems={cart}
          onClose={() => setSelectedCheckoutCart(false)}
          onSubmit={handleCheckoutSubmit}
          defaultTelegram={telegramUser}
          t={t}
          onClearCart={handleClearCart}
        />
      )}

      {/* Admin Login Modal */}
      {showAdminLoginModal && (
        <AdminLoginModal
          onClose={() => setShowAdminLoginModal(false)}
          onLoginSuccess={() => {
            setIsAdminLoggedIn(true);
            setShowAdminLoginModal(false);
            setActiveTab('admin');
          }}
          t={t}
        />
      )}

      {/* User Signup / Login Modal during checkout */}
      {showUserAuthModal && (
        <UserAuthModal
          onClose={() => {
            setShowUserAuthModal(false);
            setPendingSelection(null);
          }}
          suggestedTelegramUser={telegramAutoUser || undefined}
          onAuthSuccess={(authTelegram) => {
            setTelegramUser(authTelegram);
            setTelegramAutoUser('');
            setShowUserAuthModal(false);
            if (pendingSelection) {
              setCart(prev => {
                const exists = prev.some(item => item.category.id === pendingSelection.category.id && item.pkg.id === pendingSelection.pkg.id);
                if (exists) return prev;
                return [...prev, { ...pendingSelection, quantity: 1 }];
              });
              setSelectedCheckoutCart(true);
              setPendingSelection(null);
            }
          }}
          t={t}
        />
      )}
    </div>
  );
}
