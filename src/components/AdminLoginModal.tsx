/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Lock, Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface AdminLoginModalProps {
  onClose: () => void;
  onLoginSuccess: () => void;
  t: Record<string, string>;
}

export default function AdminLoginModal({
  onClose,
  onLoginSuccess,
  t
}: AdminLoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [regUsername, setRegUsername] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Simple, clean delay for professional feeling
    setTimeout(() => {
      const cleanUser = username.trim().toLowerCase();
      const cleanPass = password.trim();
      // Check stored demo admin accounts from localStorage
      let storedAccounts: Array<{username: string; phone?: string; password: string}> = [];
      try {
        storedAccounts = JSON.parse(localStorage.getItem('demoAdminAccounts') || '[]');
      } catch (e) {
        storedAccounts = [];
      }

      const matchStored = storedAccounts.find(a => a.username === cleanUser && a.password === cleanPass);

      if (matchStored || (cleanUser === 'admin' && cleanPass === 'admin@4238') || (cleanUser === 'adminstar' && cleanPass === 'admin@660252')) {
        // Success
        onLoginSuccess();
      } else {
        setError('Unauthorized: Invalid credentials. Use registered admin credentials or the demo pairs listed below.');
        setLoading(false);
      }
    }, 600);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUser = regUsername.trim().toLowerCase();
    const cleanPhone = regPhone.trim();
    const cleanPass = regPassword.trim();

    if (!cleanUser || !cleanPhone || !cleanPass) {
      setError('Please provide username, phone and password to register.');
      return;
    }

    // Save to localStorage demo accounts
    let stored: Array<{username:string; phone:string; password:string}> = [];
    try {
      stored = JSON.parse(localStorage.getItem('demoAdminAccounts') || '[]');
    } catch (e) {
      stored = [];
    }

    // Prevent duplicate username
    if (stored.find(a => a.username === cleanUser)) {
      setError('An admin with that username already exists.');
      return;
    }

    stored.push({ username: cleanUser, phone: cleanPhone, password: cleanPass });
    localStorage.setItem('demoAdminAccounts', JSON.stringify(stored));

    // Prefill login and switch back to login view
    setUsername(cleanUser);
    setPassword(cleanPass);
    setRegUsername('');
    setRegPhone('');
    setRegPassword('');
    setIsRegistering(false);
    setError(null);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full shadow-2xl relative overflow-hidden text-slate-200">
        
        {/* Glow red/amber security line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500/0 via-red-500/80 to-red-500/0"></div>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-850 bg-slate-950/20">
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-red-500" />
            <h3 className="font-display font-black text-xs text-white uppercase tracking-wider">
              {t.adminLoginTitle || "Admin Gateway Secure Login"}
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/60 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          
          <div className="text-center pb-2">
            <div className="w-10 h-10 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2 border border-red-500/20">
              <Lock className="w-4 h-4" />
            </div>
            <p className="text-[10px] text-slate-455 leading-normal px-4">
              {t.adminLoginDesc || "Access is restricted to authorized Shwe Coin admins. Please log in with system credentials."}
            </p>
          </div>

          {error && (
            <div className="bg-red-500/15 border border-red-500/10 p-2.5 rounded-lg text-[10.5px] text-red-400 flex items-center gap-1.5 animate-bounce">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{t.adminInvalidCredentials || "Unauthorized: Invalid credentials."} Use "admin" & "admin@4238" or "adminstar" & "admin@660252"!</span>
            </div>
          )}

          <div className="space-y-3.5">
            
            {/* Username Input */}
            {!isRegistering && (
            <div className="space-y-1">
              <label htmlFor="admin-login-username" className="block text-[10px] uppercase font-bold text-slate-400">
                {t.adminUsernameLabel || "Admin Username"}
              </label>
              <input
                id="admin-login-username"
                type="text"
                required
                autoFocus
                placeholder="e.g. admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-red-500 font-mono"
              />
            </div>
            )}

            {/* Registration Inputs */}
            {isRegistering && (
              <div className="space-y-3">
                <div>
                  <label htmlFor="reg-username" className="block text-[10px] uppercase font-bold text-slate-400">Username</label>
                  <input id="reg-username" type="text" required placeholder="username" value={regUsername} onChange={(e)=>setRegUsername(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-red-500 font-mono" />
                </div>
                <div>
                  <label htmlFor="reg-phone" className="block text-[10px] uppercase font-bold text-slate-400">Phone</label>
                  <input id="reg-phone" type="tel" required placeholder="e.g. +959xxxxxxxx" value={regPhone} onChange={(e)=>setRegPhone(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-red-500 font-mono" />
                </div>
                <div>
                  <label htmlFor="reg-password" className="block text-[10px] uppercase font-bold text-slate-400">Password</label>
                  <input id="reg-password" type="password" required placeholder="password" value={regPassword} onChange={(e)=>setRegPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-red-500 font-mono" />
                </div>
              </div>
            )}

            {/* Password Input */}
            <div className="space-y-1">
              <label htmlFor="admin-login-password" className="block text-[10px] uppercase font-bold text-slate-400">
                {t.adminPasswordLabel || "Access Token / Password"}
              </label>
              <div className="relative">
                <input
                  id="admin-login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-9 py-1.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-red-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

          </div>

          {/* Tips for Sandbox */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1">
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-900 text-[9.5px] text-slate-500 font-mono leading-relaxed select-none">
                {t.adminDemoDetails || "Demo Details"}: <strong className="text-slate-300 font-sans">admin</strong> & <strong className="text-slate-300 font-sans">admin@4238</strong> — <strong className="text-slate-300 font-sans">adminstar</strong> & <strong className="text-slate-300 font-sans">admin@660252</strong>
                <div className="text-[10px] text-slate-400 mt-1">Or register a demo admin below.</div>
              </div>
            </div>
            <div className="w-1/3">
              {!isRegistering ? (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-red-650 to-red-500 bg-red-600 hover:bg-red-500 disabled:opacity-55 text-slate-950 py-2 rounded-lg font-black text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer"
                >
                  {loading ? (t.adminDecryptingToken || 'Decrypting Security...') : (t.adminUnlockConsole || 'Unlock Console')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRegister}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 text-slate-950 py-2 rounded-lg font-black text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer"
                >
                  Register Admin
                </button>
              )}
            </div>
          </div>

          <div className="pt-2 text-center text-[11px]">
            {!isRegistering ? (
              <button type="button" onClick={() => setIsRegistering(true)} className="text-emerald-400 underline">Create admin account</button>
            ) : (
              <button type="button" onClick={() => setIsRegistering(false)} className="text-slate-400 underline">Back to login</button>
            )}
          </div>

        </form>

      </div>
    </div>
  );
}
