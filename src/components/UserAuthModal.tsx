/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, User, Phone, UserPlus, AlertCircle, Sparkles, LogIn } from 'lucide-react';
import { UserDetail } from '../types';

interface UserAuthModalProps {
  onClose: () => void;
  onAuthSuccess: (telegramUsername: string) => void;
  t: Record<string, string>;
  suggestedTelegramUser?: string;
}

export default function UserAuthModal({
  onClose,
  onAuthSuccess,
  t,
  suggestedTelegramUser
}: UserAuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('signup');
  const [telegramUsername, setTelegramUsername] = useState(suggestedTelegramUser || '');
  const [displayName, setDisplayName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Validate and submit Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const cleanUsername = telegramUsername.replace('@', '').trim();
    if (!cleanUsername) {
      setError('Please input your Telegram username!');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/users/login-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramUsername: cleanUsername })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Success
        onAuthSuccess(`@${data.data.telegramUsername}`);
      } else {
        setError(data.error || 'Login lookup failed. Double check your handle or Sign Up!');
      }
    } catch (err: any) {
      setError('Connection failure. Please try again!');
    } finally {
      setLoading(false);
    }
  };

  // Validate and submit Registration/Sign-up
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = telegramUsername.replace('@', '').trim();
    if (!cleanUsername) {
      setError('Telegram username is required to register!');
      return;
    }
    if (!displayName.trim()) {
      setError('A display name/nickname is required!');
      return;
    }
    if (!contactPhone.trim()) {
      setError('Valid Myanmar mobile phone number is required!');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramUsername: cleanUsername,
          displayName: displayName.trim(),
          contactPhone: contactPhone.trim(),
          coinsBalance: 0
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onAuthSuccess(`@${data.data.telegramUsername}`);
      } else {
        setError(data.error || 'Registration failed. Try a different Telegram handle!');
      }
    } catch (err: any) {
      setError('Failed to connect to gateway: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full shadow-2xl relative overflow-hidden text-slate-200">
        
        {/* Glow decorative banner */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500/0 via-amber-500/90 to-amber-500/0"></div>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-850">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="font-display font-black text-xs text-white uppercase tracking-wider">
              {activeTab === 'signup' ? 'Create Account' : 'Customer Sign In'}
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/80 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Sign-in requirement notice */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-start gap-2 text-[10.5px] text-amber-200 leading-normal">
          <LogIn className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
          <span>
            Please register or sign in using your Telegram username to proceed with your Coins securely.
          </span>
        </div>

        {/* Tab Toggle */}
        {!suggestedTelegramUser ? (
          <div className="flex bg-slate-950 p-1 rounded-lg m-4 border border-slate-850 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('signup');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-center rounded-md transition-all duration-200 ${
                activeTab === 'signup'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-450 hover:text-slate-200'
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-center rounded-md transition-all duration-200 ${
                activeTab === 'login'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-450 hover:text-slate-200'
              }`}
            >
              Signed Users (Login)
            </button>
          </div>
        ) : (
          <div className="mx-4 my-3 px-3 py-2 bg-gradient-to-r from-amber-500/10 to-amber-500/0 border-l-2 border-amber-500 rounded-r text-[11px] text-amber-200 font-bold flex items-center justify-between">
            <span>✨ TELEGRAM PROFILE DETECTED</span>
            <span className="font-mono bg-amber-500/20 px-1.5 py-0.5 rounded text-[9px] text-amber-400">AUTO</span>
          </div>
        )}

        {/* Card Body Forms */}
        <div className="px-4 pb-4">
          {error && (
            <div className="bg-rose-500/15 border border-rose-500/10 p-2.5 rounded-lg text-[10.5px] text-rose-300 flex items-center gap-1.5 mb-3 animate-pulse">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'login' ? (
            /* LOGIN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="user-auth-login-tg" className="block text-[10px] uppercase font-bold text-slate-400">
                  Telegram Username
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 py-0.5 font-bold text-xs text-slate-500">@</span>
                  <input
                    id="user-auth-login-tg"
                    type="text"
                    required
                    placeholder="kyawkyaw_game"
                    value={telegramUsername.replace('@', '')}
                    onChange={(e) => setTelegramUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-6 pr-3.5 py-1.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <p className="text-[9px] text-slate-500">
                  Ex: @kyawkyaw_game (Input username to load balance and logs)
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-55 text-slate-950 py-2 rounded-lg font-black text-xs uppercase tracking-wider transition active:scale-95"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>
          ) : (
            /* SIGN UP FORM */
            <form onSubmit={handleSignUpSubmit} className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="user-auth-signup-tg" className="block text-[10px] uppercase font-bold text-slate-400">
                  Telegram Handle *
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 py-0.5 font-bold text-xs text-slate-500">@</span>
                  <input
                    id="user-auth-signup-tg"
                    type="text"
                    required
                    readOnly={!!suggestedTelegramUser}
                    placeholder="shwe_thiri_99"
                    value={telegramUsername.replace('@', '')}
                    onChange={(e) => {
                      if (!suggestedTelegramUser) {
                        setTelegramUsername(e.target.value);
                      }
                    }}
                    className={`w-full bg-slate-950 border border-slate-800 rounded-lg pl-6 pr-3.5 py-1.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-amber-500 font-mono ${
                      suggestedTelegramUser ? 'opacity-65 cursor-not-allowed border-amber-500/40 text-amber-300' : ''
                    }`}
                  />
                  {suggestedTelegramUser && (
                    <span className="absolute right-2.5 top-2 text-[8px] bg-amber-500/20 text-amber-400 px-1 rounded-sm uppercase font-mono tracking-tight font-black select-none">
                      LOCKED
                    </span>
                  )}
                </div>
                {suggestedTelegramUser && (
                  <p className="text-[9px] text-slate-500 leading-normal">
                    Verified from your Telegram Mini App session handle. Only fill your nickname and phone below.
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="user-auth-signup-name" className="block text-[10px] uppercase font-bold text-slate-400">
                  Display Nickname (Gamer) *
                </label>
                <input
                  id="user-auth-signup-name"
                  type="text"
                  required
                  placeholder="Shwe Thiri"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="user-auth-signup-phone" className="block text-[10px] uppercase font-bold text-slate-400">
                  Myanmar Contact Phone *
                </label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    id="user-auth-signup-phone"
                    type="text"
                    required
                    placeholder="09778239103"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3.5 py-1.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-105 disabled:opacity-55 text-slate-950 py-2 rounded-lg font-black text-xs uppercase tracking-wider transition active:scale-95"
              >
                {loading ? 'Creating Account...' : 'Register & Get'}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
