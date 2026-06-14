/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Flame, 
  Shield, 
  Target, 
  Zap, 
  Swords, 
  ArrowRight, 
  Star, 
  CheckCircle,
  Award,
  Smartphone,
  Coins,
  Tag,
  Pin,
  X
} from 'lucide-react';
import { GameCategoryDetail, ProductPackage } from '../types';

interface ShopCatalogProps {
  categories: GameCategoryDetail[];
  telegramUser: string;
  onSelectPackage: (category: GameCategoryDetail, pkg: ProductPackage) => void;
  t: Record<string, string>;
  cart: {
    category: GameCategoryDetail;
    pkg: ProductPackage;
    quantity: number;
  }[];
  onAddToCart: (category: GameCategoryDetail, pkg: ProductPackage) => void;
  onUpdateCartQty: (categoryId: string, pkgId: string, delta: number) => void;
  onRemoveFromCart: (categoryId: string, pkgId: string) => void;
  onClearCart: () => void;
  onCheckoutCart: () => void;
}

const iconMap: { [key: string]: React.ComponentType<any> } = {
  Flame: Flame,
  Shield: Shield,
  Target: Target,
  Zap: Zap,
  Sword: Swords
};

export default function ShopCatalog({
  categories,
  telegramUser,
  onSelectPackage,
  t,
  cart,
  onAddToCart,
  onUpdateCartQty,
  onRemoveFromCart,
  onClearCart,
  onCheckoutCart
}: ShopCatalogProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || '');
  const [selectedPkgId, setSelectedPkgId] = useState<string>('');

  // Compact budget finder
  const [budgetInput, setBudgetInput] = useState<string>('');
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'popular' | 'best_value'>('all');

  // Pinned access keys (format "catId:pkgId")
  const [pinnedKeys, setPinnedKeys] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('shwe_coin_pinned_packages');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const togglePin = (catId: string, pkgId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent default package selection behavior
    const key = `${catId}:${pkgId}`;
    let updated: string[];
    if (pinnedKeys.includes(key)) {
      updated = pinnedKeys.filter(k => k !== key);
    } else {
      updated = [...pinnedKeys, key];
    }
    setPinnedKeys(updated);
    try {
      localStorage.setItem('shwe_coin_pinned_packages', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  const pinnedItems = useMemo(() => {
    const list: { category: GameCategoryDetail; pkg: ProductPackage }[] = [];
    pinnedKeys.forEach(key => {
      const parts = key.split(':');
      if (parts.length < 2) return;
      const catId = parts[0];
      const pkgId = parts.slice(1).join(':'); // handle package ids with colons if any
      const cat = categories.find(c => c.id === catId);
      if (cat) {
        const pkg = cat.packages.find(p => p.id === pkgId);
        if (pkg) {
          list.push({ category: cat, pkg });
        }
      }
    });
    return list;
  }, [pinnedKeys, categories]);

  const currentCategory = categories.find(c => c.id === selectedCategoryId);

  const getCategorySymbol = (catId: string) => {
    switch (catId) {
      case 'tiktok_coins':
        return { emoji: '🪙', label: 'Coins' };
      case 'mlbb_diamonds':
        return { emoji: '💎', label: 'Diamonds' };
      case 'pubg_uc':
        return { emoji: '🎟️', label: 'UC' };
      case 'freefire_diamonds':
        return { emoji: '🔥', label: 'Diamonds' };
      case 'hok_tokens':
        return { emoji: '⚔️', label: 'Tokens' };
      default:
        return { emoji: '⭐️', label: 'Credits' };
    }
  };

  const packagesWithAnalytics = useMemo(() => {
    if (!currentCategory) return [];
    
    return currentCategory.packages.map(pkg => {
      const unitRate = pkg.priceMmk / pkg.amount;
      const discountPct = pkg.originalPriceMmk ? Math.round(((pkg.originalPriceMmk - pkg.priceMmk) / pkg.originalPriceMmk) * 100) : 0;
      
      return {
        ...pkg,
        unitRate,
        discountPct
      };
    });
  }, [currentCategory]);

  const userBudget = parseFloat(budgetInput.replace(/,/g, ''));
  
  const filteredAndSortedPackages = useMemo(() => {
    let result = [...packagesWithAnalytics];

    if (activeFilterTab === 'popular') {
      result = result.filter(p => p.popular);
    } else if (activeFilterTab === 'best_value') {
      result = result.filter(p => p.premium);
    }

    if (!isNaN(userBudget) && userBudget > 0) {
      result = result.filter(p => p.priceMmk <= userBudget);
    }

    // Viber-style: Pinned items are sorted to the very top within the category list
    if (currentCategory) {
      result.sort((a, b) => {
        const aPinned = pinnedKeys.includes(`${currentCategory.id}:${a.id}`);
        const bPinned = pinnedKeys.includes(`${currentCategory.id}:${b.id}`);
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        return 0;
      });
    }

    return result;
  }, [packagesWithAnalytics, activeFilterTab, userBudget, pinnedKeys, currentCategory]);

  return (
    <div className="p-2 space-y-4 animate-slide-up w-full max-w-xl mx-auto text-slate-200">
      
      {/* Dynamic Interactive Category Selector Grid */}
      <div className="space-y-2">
        <div className="grid grid-cols-5 gap-1.5">
          {categories.map((cat) => {
            const IconComponent = iconMap[cat.iconName] || Smartphone;
            const isSelected = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategoryId(cat.id);
                  setSelectedPkgId('');
                  setBudgetInput('');
                  setActiveFilterTab('all');
                }}
                className={`relative flex flex-col items-center p-2 rounded-lg border transition-all text-center cursor-pointer focus:outline-none ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500 shadow-md'
                    : 'bg-slate-950 border-slate-900/80 hover:bg-slate-900/45'
                }`}
              >
                {/* Visual Indicators for Hot or Value Categories */}
                {cat.isHot && (
                  <span className="absolute -top-1 -right-0.5 z-20 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-550 flex items-center justify-center text-[5px] text-slate-950 font-black">🔥</span>
                  </span>
                )}
                {cat.isValue && (
                  <span className="absolute -top-1 -right-0.5 z-20 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 flex items-center justify-center text-[5px] text-slate-950 font-black">🏷️</span>
                  </span>
                )}

                <div
                  className={`p-1.5 rounded-lg mb-1 ${
                    isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                </div>
                
                <span className="text-[10px] font-bold text-slate-300 block truncate w-full">
                  {cat.name.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Category Detail Frame */}
      {currentCategory && (
        <div className="bg-slate-950 border border-slate-900 rounded-xl p-3 space-y-3 shadow-xl">
          
          {/* Header Info Banner: Super ultra-compact */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-900">
            <div className="flex items-center gap-2">
              <img
                src={currentCategory.imageUrl}
                alt={currentCategory.name}
                className="w-8 h-8 rounded-lg object-cover border border-slate-800"
              />
              <div>
                <h4 className="font-display font-black text-xs text-white flex items-center gap-1.5 flex-wrap">
                  <span>{currentCategory.name}</span>
                  {currentCategory.isHot && (
                    <span className="bg-amber-500/15 border border-amber-500/30 text-amber-500 text-[8px] font-extrabold px-1.5 py-0.2 rounded uppercase tracking-wider animate-pulse flex items-center gap-0.5">
                      🔥 Hot item
                    </span>
                  )}
                    {currentCategory.isValue && (
                    <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[8px] font-extrabold px-1.5 py-0.2 rounded uppercase tracking-wider flex items-center gap-0.5">
                      🏷️ Best Value
                    </span>
                  )}
                </h4>
              </div>
            </div>
            
            <div className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">
              {t.instantDelivery || "Instant"}
            </div>
          </div>

          {/* Compact Budget Filter */}
          <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-900/50 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1">
                <Coins className="w-3 h-3 text-amber-500" /> {t.budgetLabel || "Max Budget:"}
              </span>
              <input
                type="text"
                value={budgetInput}
                onChange={(e) => {
                  const clean = e.target.value.replace(/[^0-9]/g, '');
                  setBudgetInput(clean ? parseInt(clean).toLocaleString() : '');
                }}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-[11px] text-amber-400 font-bold font-mono focus:outline-none w-28 text-right"
                placeholder={t.budgetPlaceholder || "e.g. 50,000 MMK"}
              />
            </div>

            <div className="flex items-center gap-1 text-[10px]">
              <button
                type="button"
                onClick={() => {
                  setActiveFilterTab('all');
                  setBudgetInput('');
                }}
                className={`px-2 py-0.5 rounded font-bold ${
                  activeFilterTab === 'all' && !budgetInput
                    ? 'bg-amber-505 text-amber-400 border border-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.filterAll || "All"}
              </button>
              <span className="text-slate-700">|</span>
              <button
                type="button"
                onClick={() => {
                  setActiveFilterTab('popular');
                  setBudgetInput('');
                }}
                className={`px-2 py-0.5 rounded font-bold flex items-center gap-0.5 ${
                  activeFilterTab === 'popular'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.filterHot || "Hot"}
              </button>
              <span className="text-slate-705">|</span>
              <button
                type="button"
                onClick={() => {
                  setActiveFilterTab('best_value');
                  setBudgetInput('');
                }}
                className={`px-2 py-0.5 rounded font-bold flex items-center gap-0.5 ${
                  activeFilterTab === 'best_value'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.filterValue || "Value"}
              </button>
            </div>
          </div>

          {/* Packages Catalog: Vertical list/compact cards */}
          <div className="space-y-1.5">
            {filteredAndSortedPackages.length === 0 ? (
              <div className="text-center py-4 bg-slate-900/20 rounded-lg text-slate-505 text-[10px]">
                {t.noMatchClearFilters || "No match. Clear filters."}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-1.5 pb-1">
                {filteredAndSortedPackages.map((pkg) => {
                  const isPkgSelected = selectedPkgId === pkg.id;
                  const meta = getCategorySymbol(currentCategory.id);
                  const isPinned = pinnedKeys.includes(`${currentCategory.id}:${pkg.id}`);
                  const cartItem = cart.find(item => item.category.id === currentCategory.id && item.pkg.id === pkg.id);

                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPkgId(pkg.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setSelectedPkgId(pkg.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className={`relative p-2 rounded-lg border text-left transition-all cursor-pointer focus:outline-none flex items-center justify-between gap-2 overflow-hidden ${
                        isPkgSelected
                          ? 'bg-amber-500/10 border-amber-500'
                          : isPinned
                            ? 'bg-amber-500/5 border-amber-500/30 hover:bg-slate-900/55'
                            : 'bg-slate-900/30 border-slate-900/80 hover:bg-slate-900/50'
                      }`}
                    >
                      {/* Viber style pin - absolutely positioned in the corner, reduced size */}
                      <button
                        type="button"
                        onClick={(e) => togglePin(currentCategory.id, pkg.id, e)}
                        className="absolute top-1 right-1 opacity-70 hover:opacity-100 text-slate-500 hover:text-amber-450 z-20 transition-all p-0.5 cursor-pointer"
                        title={isPinned ? "Unpin configuration" : "Pin this plan to top"}
                      >
                        <Pin className={`w-3 h-3 ${isPinned ? 'text-amber-400 fill-amber-400 rotate-45' : 'text-slate-500'}`} />
                      </button>

                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm shrink-0">{meta.emoji}</span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-bold text-white block leading-tight">
                              {pkg.name}
                            </span>
                            {pkg.popular && (
                              <span className="inline-flex items-center gap-0.5 bg-amber-500/20 border border-amber-500/30 text-amber-500 px-1.2 py-0.5 rounded text-[8px] font-extrabold tracking-tight shrink-0">
                                🔥 Hot
                              </span>
                            )}
                            {pkg.premium && (
                              <span className="inline-flex items-center gap-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-1.2 py-0.5 rounded text-[8px] font-extrabold tracking-tight shrink-0 animate-pulse">
                                💎 Premium
                              </span>
                            )}
                            {pkg.discountPct > 0 && (
                              <span className="inline-flex items-center gap-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-1.2 py-0.5 rounded text-[8.5px] font-extrabold tracking-tight shrink-0" title="Special Discount">
                                {pkg.discountPct}% OFF
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] text-slate-500 font-mono block mt-0.5">
                            {t.rateLabel || "Rate:"} {pkg.unitRate.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-right shrink-0 whitespace-nowrap z-10">
                        <div className="whitespace-nowrap mr-1 font-mono">
                          <span className="text-[8px] text-slate-500 block uppercase leading-none">{t.priceLabel || "Price:"}</span>
                          <span className="text-xs font-black text-amber-400 block">
                            {pkg.priceMmk.toLocaleString()}&nbsp;K
                          </span>
                        </div>

                        {/* Plus Minus Cart Controller */}
                        <div className="flex items-center gap-1">
                          {cartItem ? (
                            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-md p-0.5 text-xs">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateCartQty(currentCategory.id, pkg.id, -1);
                                }}
                                className="w-4.5 h-4.5 flex items-center justify-center text-slate-400 hover:text-rose-450 rounded hover:bg-slate-900 font-bold cursor-pointer select-none transition-all active:scale-95"
                              >
                                -
                              </button>
                              <span className="w-5 text-center font-bold font-mono text-[10px] text-amber-400">
                                {cartItem.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateCartQty(currentCategory.id, pkg.id, 1);
                                }}
                                className="w-4.5 h-4.5 flex items-center justify-center text-slate-400 hover:text-emerald-450 rounded hover:bg-slate-900 font-bold cursor-pointer select-none transition-all active:scale-95"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddToCart(currentCategory, pkg);
                              }}
                              className="bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 hover:border-transparent px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer select-none active:scale-95"
                            >
                              <span>Add</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* CTA Proceed Integration */}
          <div className="pt-1">
            {selectedPkgId && currentCategory.packages.find(pk => pk.id === selectedPkgId) ? (
              <button
                type="button"
                onClick={() => {
                  const p = currentCategory.packages.find(pk => pk.id === selectedPkgId);
                  if (p) onSelectPackage(currentCategory, p);
                }}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 py-2.5 rounded-lg font-black text-xs uppercase flex items-center justify-center gap-1 cursor-pointer transition-all hover:brightness-105 active:scale-95"
              >
                {t.proceedCheckout || "Proceed"} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="text-center py-2 rounded-lg border border-dashed border-slate-900 bg-slate-950 text-[10px] text-slate-500">
                {t.selectPackagePrompt || "Select item"}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Floating checkout cart summary bar */}
      {cart.length > 0 && (
        <div className="bg-slate-950 border border-amber-500/25 rounded-xl p-3 shadow-2xl animate-slide-up sticky bottom-2 z-30 space-y-2 mt-4 bg-opacity-95 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
              </span>
              <span className="text-[9px] font-sans font-black tracking-widest text-amber-400 uppercase">
                SHOPPING CART ({cart.reduce((sum, item) => sum + item.quantity, 0)})
              </span>
            </div>
            <button
              type="button"
              onClick={onClearCart}
              className="text-[9px] text-slate-500 hover:text-rose-450 underline font-mono cursor-pointer uppercase transition-colors"
            >
              Clear All
            </button>
          </div>

          {/* Simple list scroll */}
          <div className="max-h-20 overflow-y-auto space-y-1 pr-1 custom-scrollbar scrollbar-thin">
            {cart.map((item) => {
              const cSym = getCategorySymbol(item.category.id);
              return (
                <div key={`${item.category.id}:${item.pkg.id}`} className="flex items-center justify-between text-[10.5px] bg-slate-900/30 p-1.5 rounded border border-slate-900/60">
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-xs shrink-0">{cSym.emoji}</span>
                    <span className="font-extrabold text-white truncate text-[10.5px]">
                      {item.pkg.name}
                    </span>
                    <span className="text-slate-500 text-[8.5px] font-mono whitespace-nowrap">
                      (x{item.quantity})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-amber-400 font-bold">
                      {(item.pkg.priceMmk * item.quantity).toLocaleString()}&nbsp;MMK
                    </span>
                    {/* Mini inc/dec controls */}
                    <div className="flex items-center bg-slate-950 rounded border border-slate-800 text-[10px] h-4 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => onUpdateCartQty(item.category.id, item.pkg.id, -1)}
                        className="w-3.5 h-full text-slate-500 hover:text-rose-450 font-bold hover:bg-slate-900 cursor-pointer text-center select-none"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateCartQty(item.category.id, item.pkg.id, 1)}
                        className="w-3.5 h-full text-slate-500 hover:text-emerald-450 font-bold hover:bg-slate-900 cursor-pointer text-center select-none"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Check sum and Action button */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-[7.5px] text-slate-500 block uppercase font-mono leading-none font-black">GRAND TOTAL</span>
              <span className="text-xs font-black text-amber-400 font-mono">
                {cart.reduce((sum, item) => sum + (item.pkg.priceMmk * item.quantity), 0).toLocaleString()}&nbsp;MMK
              </span>
            </div>
            
            <button
              type="button"
              onClick={onCheckoutCart}
              className="bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-105 text-slate-950 px-3.5 py-1.5 rounded-lg font-black text-[10px] uppercase flex items-center justify-center gap-1 cursor-pointer transition-all shadow-md shadow-amber-500/10 active:scale-95"
            >
              <span>Cart Summary</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
