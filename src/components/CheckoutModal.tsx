/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  X, 
  Smartphone, 
  Copy, 
  Upload, 
  Check, 
  AlertCircle, 
  Gamepad, 
  MessageSquare, 
  Phone,
  FileCheck,
  Zap,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { GameCategoryDetail, ProductPackage } from '../types';
import { MYANMAR_PAYMENTS } from '../productsData';

interface CheckoutModalProps {
  cartItems: {
    category: GameCategoryDetail;
    pkg: ProductPackage;
    quantity: number;
  }[];
  onClose: () => void;
  onSubmit: (formData: any) => Promise<any>;
  defaultTelegram: string;
  t: Record<string, string>;
  onClearCart?: () => void;
}

export default function CheckoutModal({
  cartItems,
  onClose,
  onSubmit,
  defaultTelegram,
  t,
  onClearCart
}: CheckoutModalProps) {
  // Aggregate Price calculation
  const aggregatePrice = cartItems.reduce((acc, item) => acc + (item.pkg.priceMmk * item.quantity), 0);
  const totalAmount = cartItems.reduce((acc, item) => acc + (item.pkg.amount * item.quantity), 0);
  const packageNameCombined = cartItems.map(item => `${item.quantity}x ${item.pkg.name}`).join(' + ');

  // Get unique categories for entering player IDs
  const uniqueCategories = React.useMemo(() => {
    const cats: GameCategoryDetail[] = [];
    cartItems.forEach(item => {
      if (!cats.some(c => c.id === item.category.id)) {
        cats.push(item.category);
      }
    });
    return cats;
  }, [cartItems]);

  // Initial map of account IDs per category
  const [accountDetails, setAccountDetails] = useState<Record<string, { gameId: string; serverId?: string }>>(() => {
    const initial: Record<string, { gameId: string; serverId?: string }> = {};
    uniqueCategories.forEach(cat => {
      initial[cat.id] = { gameId: '', serverId: '' };
    });
    return initial;
  });

  const [telegramUsername, setTelegramUsername] = useState(defaultTelegram);
  const [contactPhone, setContactPhone] = useState('');
  const [selectedPaymentId, setSelectedPaymentId] = useState('kbzpay');
  const [transactionId, setTransactionId] = useState('');
  
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<any | null>(null);
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activePayment = MYANMAR_PAYMENTS.find(p => p.id === selectedPaymentId) || MYANMAR_PAYMENTS[0];

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setToastMessage(t.copiedToast || "Copied!");
    setTimeout(() => {
      setCopiedField(null);
      setToastMessage(null);
    }, 1500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setScreenshotPreview(uploadEvent.target?.result as string);
      setToastMessage("Voucher uploaded!");
      setTimeout(() => setToastMessage(null), 1500);
    };
    reader.readAsDataURL(file);
  };

  const handleSimulateScreenshot = () => {
    setScreenshotPreview('https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=150');
    setTransactionId(`${selectedPaymentId.toUpperCase()}-${Math.floor(10000000 + Math.random() * 90000000)}`);
    setToastMessage("Demo receipt added");
    setTimeout(() => setToastMessage(null), 1500);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate account info per category
    const gameIdSegments: string[] = [];
    const serverIdSegments: string[] = [];
    let validationFailed = false;

    uniqueCategories.forEach(cat => {
      const details = accountDetails[cat.id];
      if (!details || !details.gameId.trim()) {
        setFormError(`Enter Account ID for ${cat.name}`);
        validationFailed = true;
        return;
      }
      if (cat.requiresServerId && (!details.serverId || !details.serverId.trim())) {
        setFormError(`Enter Server ID for ${cat.name}`);
        validationFailed = true;
        return;
      }
      
      const gameLabel = uniqueCategories.length === 1 ? '' : `${cat.name.split(' ')[0]}: `;
      gameIdSegments.push(`${gameLabel}${details.gameId.trim()}`);
      if (details.serverId && details.serverId.trim()) {
        const serverLabel = uniqueCategories.length === 1 ? '' : `${cat.name.split(' ')[0]}: `;
        serverIdSegments.push(`${serverLabel}${details.serverId.trim()}`);
      }
    });

    if (validationFailed) return;

    if (!telegramUsername.trim() || telegramUsername === '@') {
      setFormError('Telegram Username required');
      return;
    }

    if (!contactPhone.trim()) {
      setFormError('Phone number required');
      return;
    }

    setIsSubmitLoading(true);

    const gameIdCombined = gameIdSegments.join(', ');
    const serverIdCombined = serverIdSegments.length > 0 ? serverIdSegments.join(', ') : undefined;

    const payload = {
      category: cartItems[0]?.category.id || 'mixed',
      packageName: packageNameCombined,
      amount: totalAmount,
      priceMmk: aggregatePrice,
      gameId: gameIdCombined,
      serverId: serverIdCombined,
      telegramUsername: telegramUsername.trim(),
      contactPhone: contactPhone.trim(),
      paymentMethod: selectedPaymentId,
      transactionId: transactionId.trim() || `TX-${Math.floor(Math.random() * 900000)}`,
      screenshotUrl: screenshotPreview || undefined
    };

    try {
      const resp = await onSubmit(payload);
      if (resp && resp.success) {
        setSuccessOrder({
          ...payload,
          id: resp.data?.id,
          ocrPassed: resp.ocrPassed,
          ocrReason: resp.ocrReason
        });
        if (resp.ocrPassed !== false && onClearCart) {
          onClearCart();
        }
      } else {
        setFormError(resp?.error || 'Order submission failed.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Routing error.');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  if (successOrder) {
    const passed = successOrder.ocrPassed !== false;
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in animate-duration-150">
        <div className={`bg-slate-900 border ${passed ? 'border-slate-800' : 'border-rose-500/40'} rounded-xl max-w-xs w-full shadow-2xl overflow-hidden text-slate-200 p-4 space-y-3`}>
          <div className="text-center space-y-1">
            {passed ? (
              <>
                <div className="w-10 h-10 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-6 h-6 text-slate-950" />
                </div>
                <h3 className="font-extrabold text-[13px] text-white">
                  {t.placedSuccess || "Order Placed!"}
                </h3>
                <p className="text-[10px] text-emerald-400 font-mono">
                  Receipt OCR Passed ✓
                </p>
              </>
            ) : (
              <>
                <div className="w-10 h-10 bg-rose-500 text-slate-950 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-rose-500/20">
                  <X className="w-6 h-6 text-slate-950" />
                </div>
                <h3 className="font-extrabold text-[13px] text-rose-500 uppercase tracking-wider">
                  Payment Denied
                </h3>
                <p className="text-[9px] text-rose-400 font-mono italic">
                  Automatic OCR Verification Failed
                </p>
              </>
            )}
          </div>

          <div className="bg-slate-950 rounded-lg p-2.5 border border-slate-900 text-[10px] font-mono space-y-1.5 pb-2">
            <div className="flex justify-between">
              <span className="text-slate-500">ID / USER</span>
              <span className="text-white font-bold select-all break-all text-right max-w-[60%]">{successOrder.gameId}</span>
            </div>
            {successOrder.serverId && (
              <div className="flex justify-between">
                <span className="text-slate-500">SERVER</span>
                <span className="text-white break-all text-right max-w-[60%]">{successOrder.serverId}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">ITEMS</span>
              <span className="text-amber-400 font-bold text-right max-w-[60%] break-words">{successOrder.packageName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">TOTAL COST</span>
              <span className="text-emerald-400 font-bold">{successOrder.priceMmk.toLocaleString()}&nbsp;MMK</span>
            </div>
            <div className="flex justify-between border-t border-slate-900 pt-1.5 mt-1.5">
              <span className="text-slate-500">OCR SCAN</span>
              <span className={passed ? "text-emerald-400 font-bold" : "text-rose-500 font-bold"}>
                {passed ? "PASSED" : "DENIED"}
              </span>
            </div>
          </div>

          {!passed && successOrder.ocrReason && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-200 text-[9.5px] rounded-lg p-2 leading-relaxed max-h-[80px] overflow-y-auto">
              <strong className="text-rose-400 font-bold block mb-0.5">REJECTION REASON:</strong>
              {successOrder.ocrReason}
            </div>
          )}

          {passed ? (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 space-y-1.5 text-center text-[10px]">
              <span className="font-black text-amber-400 block uppercase tracking-wider text-[9px]">
                📱 Admin Verification Simulator
              </span>
              <p className="text-slate-300 leading-relaxed text-[9.5px]">
                Type <strong className="text-white font-bold">"approve"</strong> inside the <strong className="text-amber-400 font-bold">Shwe AI</strong> chat tab, or check the <strong className="text-amber-400 font-bold">Orders</strong> list to simulate automated instant processing!
              </p>
            </div>
          ) : (
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-2.5 text-center text-[9px] text-slate-400">
              This order has been automatically cancelled. Please try again with the correct transaction reference code and amount!
            </div>
          )}

          <button
            onClick={onClose}
            className={`w-full ${passed ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-rose-600 hover:bg-rose-500'} text-slate-950 py-2 rounded-lg font-bold text-xs transition-colors`}
          >
            {t.gotitButton || "Ok"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full shadow-2xl relative flex flex-col max-h-[96vh] animate-scale-up">
        
        {toastMessage && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-slate-950 font-bold text-[10px] px-3 py-1 rounded-full shadow-md">
            {toastMessage}
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-900">
          <div>
            <h3 className="font-extrabold text-[12px] text-white">
              Checkout Cart - {cartItems.reduce((sum, i) => sum + i.quantity, 0)} Items
            </h3>
            <p className="text-[10px] text-amber-400 font-bold font-mono">
              Total MMK: {aggregatePrice.toLocaleString()}&nbsp;K
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded bg-slate-800 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleFormSubmit} className="overflow-y-auto p-3 space-y-3 text-slate-200">
          {formError && (
            <div className="bg-red-500/15 border border-red-500/10 p-2 rounded text-[10px] text-red-400 flex items-center gap-1.5 animate-pulse">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Cart items list in the modal */}
          <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-850/60 max-h-24 overflow-y-auto space-y-1">
            <span className="text-[8px] font-black tracking-widest text-slate-500 uppercase block mb-1">🛒 Items Checklist</span>
            {cartItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-[10px] border-b border-slate-900/60 pb-1 last:border-0 last:pb-0">
                <span className="text-white font-bold">{item.pkg.name} <span className="text-slate-500 text-[9px] font-mono">(x{item.quantity})</span></span>
                <span className="font-mono text-amber-400 font-bold">{(item.pkg.priceMmk * item.quantity).toLocaleString()}&nbsp;K</span>
              </div>
            ))}
          </div>

          {/* Step 1 Account details per category */}
          <div className="space-y-2">
            <span className="text-[9px] font-black uppercase text-amber-500 tracking-wider block">
              1. Destination Accounts
            </span>

            <div className="space-y-2.5">
              {uniqueCategories.map(cat => {
                const isTiktok = cat.id === 'tiktok_coins';
                return (
                  <div key={cat.id} className="bg-slate-950 p-2 rounded-lg border border-slate-850/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest block">
                        🕹️ {cat.name} Acc
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[8px] text-slate-500 uppercase font-bold mb-0.5">
                          {isTiktok ? 'TikTok Username' : 'Player / Character ID'}
                        </label>
                        <input
                          type="text"
                          required
                          value={accountDetails[cat.id]?.gameId || ''}
                          onChange={(e) => {
                            setAccountDetails(prev => ({
                              ...prev,
                              [cat.id]: {
                                ...prev[cat.id],
                                gameId: e.target.value
                              }
                            }));
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500/70"
                          placeholder={isTiktok ? "@username" : "UID / Login ID"}
                        />
                      </div>

                      {cat.requiresServerId ? (
                        <div>
                          <label className="block text-[8px] text-slate-500 uppercase font-bold mb-0.5">Server / Zone ID</label>
                          <input
                            type="text"
                            required
                            value={accountDetails[cat.id]?.serverId || ''}
                            onChange={(e) => {
                              setAccountDetails(prev => ({
                                ...prev,
                                [cat.id]: {
                                  ...prev[cat.id],
                                  serverId: e.target.value
                                }
                              }));
                            }}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500/70"
                            placeholder="Server ID"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[8px] text-slate-500 uppercase font-bold mb-0.5">Category Type</label>
                          <div className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-400 select-none">
                            {cat.id === 'tiktok_coins' ? 'TikTok Portal' : 'Instant Topup'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Combined User Meta details */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-[9px] text-slate-450 mb-0.5">Telegram Username</label>
                <input
                  type="text"
                  required
                  value={telegramUsername}
                  onChange={(e) => setTelegramUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500/50"
                  placeholder="@username"
                />
              </div>
              <div>
                <label className="block text-[9px] text-slate-450 mb-0.5">Contact Phone</label>
                <input
                  type="text"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500/50"
                  placeholder="09..."
                />
              </div>
            </div>
          </div>

          {/* Step 2 Myanmar Banks Detail */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <span className="text-[9px] font-black uppercase text-amber-500 tracking-wider">
              2. Transfer to Bank
            </span>

            <div className="flex bg-slate-950 p-0.5 rounded border border-slate-800">
              {MYANMAR_PAYMENTS.map((payment) => (
                <button
                  type="button"
                  key={payment.id}
                  onClick={() => setSelectedPaymentId(payment.id)}
                  className={`flex-1 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                    selectedPaymentId === payment.id
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {payment.id === 'kbzpay' ? 'KPay' : payment.id === 'wavepay' ? 'Wave' : 'CB'}
                </button>
              ))}
            </div>

            {/* Quick Bank Details Block */}
            <div className="bg-slate-950 p-1.5 rounded border border-slate-850 flex justify-between items-center text-[10px] font-mono leading-none">
              <div>
                <span className="text-slate-500 text-[8px] block uppercase">No / Account</span>
                <span className="text-white font-bold block mt-1">{activePayment.accountNo}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopyText(activePayment.accountNo, 'no')}
                className="bg-slate-900 border border-slate-800 p-1.5 rounded cursor-pointer hover:border-slate-705"
              >
                {copiedField === 'no' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
              </button>
            </div>
            
            <div className="bg-slate-950 p-1.5 rounded border border-slate-850 flex justify-between items-center text-[10px] font-mono leading-none">
              <div>
                <span className="text-slate-500 text-[8px] block uppercase">Name / Receiver</span>
                <span className="text-white block mt-1">{activePayment.accountName}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopyText(activePayment.accountName, 'name')}
                className="bg-slate-900 border border-slate-800 p-1.5 rounded cursor-pointer hover:border-slate-705"
              >
                {copiedField === 'name' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
              </button>
            </div>
          </div>

          {/* Step 3 Screenshot Receipt */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase text-amber-500 tracking-wider">
                3. Receipt / Voucher
              </span>
              <button
                type="button"
                onClick={handleSimulateScreenshot}
                className="text-[8px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-0.5 cursor-pointer hover:bg-amber-500/20 active:scale-95"
              >
                <Zap className="w-2.5 h-2.5 text-amber-400" /> Fast Fill (Demo)
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-slate-800 bg-slate-950 p-2 rounded text-center cursor-pointer hover:border-slate-700 min-h-[50px] flex flex-col items-center justify-center space-y-1"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <Upload className="w-3 h-3 text-amber-500 animate-bounce" />
                <span className="text-[9px] text-slate-300 font-bold block">{t.uploadScreenshot || "Voucher Image"}</span>
              </button>

              <div className="space-y-1.5">
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Reference TXID Code"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-white font-mono focus:outline-none placeholder-slate-700 focus:border-amber-500/50"
                />
                
                {screenshotPreview ? (
                  <div className="bg-slate-950 font-mono text-[8px] p-1 border border-emerald-500/25 rounded flex items-center justify-between text-emerald-400 animate-slide-up">
                    <span>Attached ✔</span>
                    <button type="button" onClick={() => setScreenshotPreview(null)} className="text-red-400 hover:underline">Del</button>
                  </div>
                ) : (
                  <div className="text-[8.5px] text-slate-550 italic text-center text-slate-500 font-mono">Attachment Optional</div>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Modal Actions Footer */}
        <div className="p-2 border-t border-slate-800 bg-slate-900 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 py-1.5 rounded-lg font-bold text-xs cursor-pointer active:scale-95 transition-all"
          >
            {t.cancelButton || "Back"}
          </button>
          
          <button
            type="button"
            onClick={handleFormSubmit}
            disabled={isSubmitLoading}
            className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 py-1.5 rounded-lg font-black text-xs uppercase cursor-pointer active:scale-95 transition-all"
          >
            {isSubmitLoading ? 'Saving...' : `Pay Total (${aggregatePrice.toLocaleString()} K)`}
          </button>
        </div>

      </div>
    </div>
  );
}
