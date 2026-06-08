/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DollarSign, User, Globe2, Lock } from 'lucide-react';
import { EXCH_RATE_USD_MMK } from '../productsData';
import { Language } from '../translations';

interface HeaderProps {
  activeTab: 'shop' | 'chat' | 'orders' | 'admin';
  setActiveTab: (tab: 'shop' | 'chat' | 'orders' | 'admin') => void;
  telegramUser: string;
  setTelegramUser: (user: string) => void;
  pendingCount: number;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Record<string, string>;
  isAdminLoggedIn: boolean;
  onAdminLoginTrigger: () => void;
}

export default function Header({
  activeTab,
  setActiveTab,
  telegramUser,
  setTelegramUser,
  pendingCount,
  language,
  setLanguage,
  t,
  isAdminLoggedIn,
  onAdminLoginTrigger
}: HeaderProps) {
  return (
    <header className="bg-slate-950/80 border-b border-slate-900 px-3 py-1.5 shadow-md">
      
      {/* Telegram status topbar */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
        <div className="flex items-center gap-1 matches-telegram">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          <span className="font-mono text-[8px] text-slate-500">SHWE PORTAL</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Real-time Language Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-md p-0.5 text-[9px] font-bold">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('mm')}
              className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                language === 'mm'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              မြန်မာ
            </button>
          </div>

          {/* Admin Lock Toggle Button */}
          <button
            type="button"
            onClick={onAdminLoginTrigger}
            className={`p-1 px-1.5 rounded bg-slate-900 border transition-all cursor-pointer flex items-center gap-1 text-[9px] font-bold ${
              isAdminLoggedIn 
                ? 'border-red-500/50 text-red-400 hover:bg-slate-850' 
                : 'border-slate-800 text-slate-400 hover:text-amber-500 hover:border-slate-700'
            }`}
            title={isAdminLoggedIn ? "Admin Session Active - Click to Logout" : "Protected Admin Portal"}
          >
            <Lock className="w-2.5 h-2.5" />
            <span>{isAdminLoggedIn ? 'Logout' : 'Admin'}</span>
          </button>
        </div>
      </div>

      {/* Main Title branding */}
      <div className="flex items-center justify-between gap-2 my-1">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 p-1.5 rounded-lg shadow">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
          </div>
          <div>
            <h1 className="font-display font-black text-sm text-white tracking-tight leading-none">
              {t.appTitle || "Shwe Coin AI"}
            </h1>
            <span className="text-[9px] text-slate-500 font-medium block mt-0.5">
              {t.subTitle || "Coins Hub"}
            </span>
          </div>
        </div>

        {/* Telegram Username Input simulation */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2 py-0.5 max-w-[125px]">
          <div className="flex flex-col">
            <span className="text-[7px] text-slate-500 font-bold leading-none uppercase">{t.tgUserLabel}</span>
            <input
              type="text"
              value={telegramUser}
              onChange={(e) => {
                let val = e.target.value.trim();
                if (val && !val.startsWith('@')) val = '@' + val;
                setTelegramUser(val || '@');
              }}
              className="bg-transparent text-[11px] text-amber-200 font-bold focus:outline-none w-16 p-0 leading-tight mt-0.5"
              placeholder="@username"
            />
          </div>
        </div>
      </div>

      {/* Primary Tab Switches - TG Style */}
      <div className="flex bg-slate-950 p-0.5 rounded-lg mt-2 mb-0.5 border border-slate-900">
        <button
          onClick={() => setActiveTab('shop')}
          className={`flex-1 py-1 text-center rounded-md text-[11px] font-bold transition-all duration-300 ${
            activeTab === 'shop'
              ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {t.tabShop}
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-1 text-center rounded-md text-[11px] font-bold transition-all duration-300 flex items-center justify-center gap-0.5 ${
            activeTab === 'chat'
              ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {t.tabChat}
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 py-1 text-center rounded-md text-[11px] font-bold transition-all duration-300 flex items-center justify-center gap-0.5 ${
            activeTab === 'orders'
              ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {t.tabOrders}
          {pendingCount > 0 && (
            <span className="bg-red-500 text-white text-[8px] px-1 rounded-full flex items-center justify-center font-black animate-pulse scale-90">
              {pendingCount}
            </span>
          )}
        </button>
        {isAdminLoggedIn && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex-1 py-1 text-center rounded-md text-[11px] font-bold transition-all duration-300 ${
              activeTab === 'admin'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.tabAdmin || "👑 Admin"}
          </button>
        )}
      </div>

    </header>
  );
}
