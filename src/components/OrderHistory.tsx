/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  History, 
  HelpCircle, 
  ShieldCheck, 
  Clock, 
  ExternalLink,
  AlertTriangle,
  Receipt
} from 'lucide-react';
import { Order } from '../types';

interface OrderHistoryProps {
  orders: Order[];
  telegramUser: string;
  onCheckStatus?: (orderId: string) => void;
  onApproveOrder?: (orderId: string) => void;
  t: Record<string, string>;
}

export default function OrderHistory({
  orders,
  telegramUser,
  onApproveOrder,
  t
}: OrderHistoryProps) {
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="bg-amber-500/10 text-amber-400 text-[8px] sm:text-[9.5px] font-bold px-1.5 py-0.5 rounded border border-amber-500/20 flex items-center gap-0.5 whitespace-nowrap">
            <Clock className="w-2.5 h-2.5 animate-spin" /> VERIFYING
          </span>
        );
      case 'processing':
        return (
          <span className="bg-sky-500/10 text-sky-400 text-[8px] sm:text-[9.5px] font-bold px-1.5 py-0.5 rounded border border-sky-500/20 flex items-center gap-0.5 whitespace-nowrap">
            <Clock className="w-2.5 h-2.5" /> PROCESSING
          </span>
        );
      case 'completed':
        return (
          <span className="bg-emerald-500/10 text-emerald-400 text-[8px] sm:text-[9.5px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-0.5 whitespace-nowrap">
            <ShieldCheck className="w-2.5 h-2.5" /> COMPLETED
          </span>
        );
      default:
        return (
          <span className="bg-rose-500/10 text-rose-400 text-[8px] sm:text-[9.5px] font-bold px-1.5 py-0.5 rounded border border-rose-500/20 flex items-center gap-0.5 whitespace-nowrap">
            <AlertTriangle className="w-2.5 h-2.5 px-0.5" /> CANCELLED
          </span>
        );
    }
  };

  const getCategoryTitle = (cat: string) => {
    switch (cat) {
      case 'tiktok_coins': return 'TikTok';
      case 'mlbb_diamonds': return 'MLBB';
      case 'pubg_uc': return 'PUBG';
      case 'freefire_diamonds': return 'Free Fire';
      case 'hok_tokens': return 'HOK';
      default: return cat.toUpperCase();
    }
  };

  return (
    <div className="p-2 space-y-3 animate-slide-up text-slate-200">
      
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
        <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
          <History className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> {t.ordersHeader || "Orders History"}
        </h3>
        <span className="text-[9px] text-slate-500 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-900">
          {telegramUser}
        </span>
      </div>

      {/* Orders list */}
      {orders.length === 0 ? (
        <div className="text-center py-8 bg-slate-950 border border-slate-900 rounded-xl space-y-1 shadow-inner">
          <HelpCircle className="w-4 h-4 text-slate-600 mx-auto" />
          <p className="text-[11px] font-bold text-slate-400">{t.noOrdersTitle || "No Orders Yet"}</p>
          <p className="text-[9.5px] text-slate-600 max-w-[200px] mx-auto leading-relaxed">
            {t.noOrdersDesc || "Your orders show up here."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => {
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
                {/* Header Information Row */}
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-[#ffffff] text-[9.5px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 tracking-wide">
                        {getCategoryTitle(order.category)}
                      </span>
                      <span className="text-amber-400 font-extrabold text-[11.5px] truncate">{order.packageName}</span>
                    </div>
                    
                    {/* Target Information row */}
                    <div className="mt-1 flex items-center gap-1.5 text-[9.5px] text-slate-400 font-mono">
                      <span className="text-slate-500 uppercase tracking-tight text-[8px]">ID:</span>
                      <span className="text-slate-200 font-bold bg-slate-950/40 px-1 rounded truncate max-w-[130px] inline-block font-mono" title={order.gameId}>
                        {order.gameId}
                      </span>
                      {order.serverId && (
                        <span className="text-slate-500">({order.serverId})</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Right Column: Price and Status Badges */}
                  <div className="text-right shrink-0">
                    <div className="text-[12px] font-black text-white font-mono leading-none">
                      {order.priceMmk.toLocaleString()}&nbsp;K
                    </div>
                    <div className="mt-1.5 flex justify-end">
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                </div>

                {/* Bottom detail parameters bar */}
                <div className="flex items-center justify-between text-[8px] text-slate-505 font-mono pt-1.5 border-t border-slate-900/40 flex-wrap gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-600 font-bold uppercase">Ticket: {order.id.slice(-6).toUpperCase()}</span>
                    <span className="text-slate-750 font-black">•</span>
                    <span className="truncate max-w-[130px] text-slate-500 hover:text-slate-400 select-all" title={order.transactionId}>TXID: {order.transactionId}</span>
                  </div>
                  
                  {order.screenshotUrl && (
                    <a 
                      href={order.screenshotUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-amber-400 flex items-center gap-0.5 hover:underline bg-slate-950 px-1.5 py-0.5 rounded border border-slate-900 transition-colors hover:text-amber-300"
                    >
                      <Receipt className="w-2.5 h-2.5 text-amber-500" /> 
                      <span>{t.viewReceipt || "Voucher"}</span>
                      <ExternalLink className="w-2 h-2 text-slate-500" />
                    </a>
                  )}
                </div>

                {/* OCR Scan Status logs */}
                {order.ocrVerified === false && order.ocrStatusText && (
                  <div className="mt-1.5 p-1.5 bg-rose-500/5 border border-rose-500/20 rounded text-[9px] text-rose-350 leading-normal flex items-start gap-1 w-full box-border font-mono">
                    <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <strong className="text-rose-400 font-bold text-[8px] uppercase tracking-wide block">OCR Verification Failure:</strong>
                      <p className="mt-0.5 text-slate-350">{order.ocrStatusText}</p>
                    </div>
                  </div>
                )}

                {/* Admin Telegram Simulation Control */}
                {onApproveOrder && (order.status === 'pending' || order.status === 'processing') && (
                  <div className="mt-1.5 pt-1.5 border-t border-slate-900/40 flex justify-between items-center gap-1.5 bg-amber-500/5 px-2 py-1 rounded border border-amber-500/10 text-[9px]">
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping shrink-0" />
                      <span className="text-[8px] uppercase tracking-wider">Demo Command:</span>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => onApproveOrder(order.id)}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-black text-[8px] uppercase tracking-wider transition-all shadow cursor-pointer"
                    >
                      Instant Approve
                    </button>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
