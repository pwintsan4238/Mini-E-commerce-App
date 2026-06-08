/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, Brain, MessageSquare, Plus, Trash2, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { ChatMessage } from '../types';
import { Language } from '../translations';

interface AiAssistantProps {
  telegramUser: string;
  onSendMessage: (text: string, mode: 'auto' | 'manual') => Promise<string>;
  language: Language;
  t: Record<string, string>;
  isAdmin?: boolean;
}

interface DataFeedItem {
  id: string;
  trigger: string;
  response: string;
  createdAt: string;
}

const GET_CHIPS_FOR_LANG = (lang: Language) => {
  if (lang === 'mm') {
    return [
      { text: 'MLBB ဒိုင်းမွန်း တွက်ပေးပါ', icon: '💎' },
      { text: 'TikTok Coins အစီအစဉ်', icon: '🪙' },
      { text: 'ငွေလဲနှုန်း ဘယ်လောက်လဲ', icon: '💵' },
      { text: 'ဝယ်ယူနည်း ပြောပြပေးပါ', icon: 'ℹ️' }
    ];
  }
  return [
    { text: 'MLBB rates in MMK', icon: '💎' },
    { text: 'TikTok Coins list', icon: '🪙' },
    { text: 'What is the exchange rate', icon: '💵' },
    { text: 'How do I buy coins', icon: 'ℹ️' }
  ];
};

export default function AiAssistant({
  telegramUser,
  onSendMessage,
  language,
  t,
  isAdmin = false
}: AiAssistantProps) {
  
  const getInitialWelcomeText = () => {
    if (language === 'mm') {
      return `မင်္ဂလာပါ။ Shwe Coin AI မှ ကြိုဆိုပါသည်။ ငွေလဲနှုန်းတွက်ချက်မှုနှင့် ပက်ကေ့ဂျ်အကြောင်း မေးနိုင်ပါသည်။ 🙏`;
    }
    return `Welcome! Ask me anything about TikTok & Gaming coins or order statuses. 🙏`;
  };

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiMode, setAiMode] = useState<'auto' | 'manual'>('auto');

  // Knowledge base feed states
  const [feeds, setFeeds] = useState<DataFeedItem[]>([]);
  const [isFeedPanelOpen, setIsFeedPanelOpen] = useState(false);
  const [newTrigger, setNewTrigger] = useState('');
  const [newResponse, setNewResponse] = useState('');
  const [feedError, setFeedError] = useState('');
  const [feedSuccess, setFeedSuccess] = useState('');

  const listEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      {
        id: 'welcome-msg',
        sender: 'ai',
        text: getInitialWelcomeText(),
        createdAt: new Date().toISOString()
      }
    ]);
  }, [language]);

  // Load feeds on mount
  useEffect(() => {
    fetchFeeds();
  }, []);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const fetchFeeds = async () => {
    try {
      const res = await fetch('/api/data-feeds');
      const data = await res.json();
      if (data.success) {
        setFeeds(data.data);
      }
    } catch (err) {
      console.warn('Failed to fetch data feeds:', err);
    }
  };

  const handleAddFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedError('');
    setFeedSuccess('');
    
    if (!newTrigger.trim() || !newResponse.trim()) {
      setFeedError('Please enter both trigger keywords and response.');
      return;
    }

    try {
      const res = await fetch('/api/data-feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: newTrigger, response: newResponse })
      });
      const data = await res.json();
      if (data.success) {
        setFeedSuccess('Custom data feed added successfully! Try typing keywords.');
        setNewTrigger('');
        setNewResponse('');
        fetchFeeds();
        // Add a prompt status update
        const botMsg: ChatMessage = {
          id: `feed-status-${Date.now()}`,
          sender: 'ai',
          text: `💡 System Notification: Data Feed added! Active triggers: "${data.data.trigger}". Bot knowledge updated.`,
          createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        setFeedError(data.error || 'Failed to add feed.');
      }
    } catch (err: any) {
      setFeedError(err.message || 'Network error.');
    }
  };

  const handleDeleteFeed = async (id: string, trigger: string) => {
    try {
      const res = await fetch(`/api/data-feeds/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchFeeds();
        const botMsg: ChatMessage = {
          id: `feed-delete-${Date.now()}`,
          sender: 'ai',
          text: `🗑️ System Notification: Deleted Knowledge Feed trigger: "${trigger}".`,
          createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, botMsg]);
      }
    } catch (err) {
      console.warn('Failed to delete feed:', err);
    }
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const responseText = await onSendMessage(textToSend, aiMode);
      
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: responseText,
        createdAt: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, aiMsg]);

      // If the response indicates fallback mode, sync state
      if (responseText.includes('Local Manual matching mode') || responseText.includes('Offline/Manual Match') || responseText.includes('[Offline/Manual Bot]')) {
        // Fallback or explicit warning auto-triggers state sync
      }
    } catch (error: any) {
      const aiErrorMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: `Error connecting to AI server. Attempting local manual matching bot...`,
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiErrorMsg]);

      // Attempt immediate offline fallback client-side
      setTimeout(() => {
        let matchedResponse = "I could not connect to our bot. Please try asking about 'payment' or 'rates'.";
        const q = textToSend.toLowerCase().trim();
        const words = q.split(/[\s,.\-/?!_()+]+/g).filter(w => w.length >= 2 || (w >= "\u1000" && w <= "\u109F"));
        
        let bestFeed: DataFeedItem | null = null;
        let bestScore = 0;

        for (const feed of feeds) {
          const triggerWords = feed.trigger.toLowerCase().split(/[\s,.\-/?!_()+]+/g);
          let hits = 0;
          for (const w of words) {
            if (triggerWords.includes(w)) hits += 3;
            else {
              for (const tw of triggerWords) {
                if (tw.includes(w) || w.includes(tw)) hits += 1;
              }
            }
          }
          if (hits > bestScore) {
            bestScore = hits;
            bestFeed = feed;
          }
        }

        if (bestFeed && bestScore > 0) {
          matchedResponse = `📝 [Offline Fallback Match]\n\n${bestFeed.response}`;
        } else {
          matchedResponse = `📝 [Offline Fallback Mode]\n\nUnreachable... No direct match found in data feeds. Triggers available:\n${feeds.map(f => `• ${f.trigger.split(' ')[0]}`).join('\n')}`;
        }

        const fallbackMsg: ChatMessage = {
          id: `ai-fallback-${Date.now()}`,
          sender: 'ai',
          text: matchedResponse,
          createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, fallbackMsg]);
      }, 800);
    } finally {
      setIsLoading(false);
    }
  };

  const CHIP_SUGGESTIONS = GET_CHIPS_FOR_LANG(language);

  return (
    <div className="flex flex-col bg-slate-950/40 rounded-xl border border-slate-900 overflow-hidden text-slate-200">
      
      {/* Bot Mode Switcher Header */}
      <div className="bg-slate-900/90 px-3 py-2 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-slate-900">
        <div className="flex items-center gap-1.5 min-w-0">
          <Bot className="w-4 h-4 text-amber-500" />
          <div className="min-w-0">
            <span className="font-bold text-white text-[11px] block truncate">Shwe Chatbot Support</span>
            <span className="text-[9px] text-slate-400 block truncate">
              {aiMode === 'auto' ? '⚡ Active: Gemini 3.5 Assistant' : '📝 Local Rule-Based Mode'}
            </span>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-1.5 shrink-0 font-sans">
            <button
              type="button"
              onClick={() => setAiMode('auto')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                aiMode === 'auto'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Use live Google Gemini AI Model"
            >
              <Brain className="w-2.5 h-2.5 inline mr-1" />
              AI Bot
            </button>
            <button
              type="button"
              onClick={() => setAiMode('manual')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                aiMode === 'manual'
                  ? 'bg-emerald-500 text-slate-950 animate-pulse'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Translate/match utilizing manually input feeds"
            >
              <MessageSquare className="w-2.5 h-2.5 inline mr-1" />
              Manual Bot
            </button>
          </div>
        )}
      </div>

      {/* Main Collapsible Data Feed Management Module */}
      {isAdmin && (
        <div className="border-b border-slate-900 bg-slate-950/80">
          <button
            type="button"
            onClick={() => setIsFeedPanelOpen(!isFeedPanelOpen)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] text-slate-400 hover:bg-slate-900/40 font-mono tracking-tight transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Plus className={`w-3 h-3 text-emerald-400 transition-transform ${isFeedPanelOpen ? 'rotate-45' : ''}`} />
              <span>Manage Bot Data Feeds & Custom Q&A ({feeds.length})</span>
            </span>
            {isFeedPanelOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {isFeedPanelOpen && (
            <div className="p-3 bg-slate-900/30 border-t border-slate-900 space-y-3 font-sans">
              <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/60">
                <span className="text-[10px] font-bold text-emerald-400 block mb-2 flex items-center gap-1">
                  <Plus className="w-3 h-3 text-emerald-400" />
                  Add Raw Data/Text Manual Feed
                </span>
                <form onSubmit={handleAddFeed} className="space-y-2">
                  <div>
                    <label className="text-[9px] text-slate-400 block mb-1">Trigger Keywords (space-separated, e.g. "discount refund kbzpay")</label>
                    <input
                      type="text"
                      value={newTrigger}
                      onChange={(e) => setNewTrigger(e.target.value)}
                      placeholder="e.g. rate usd update"
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 block mb-1">Bot Answer/Response (the raw text response when typed)</label>
                    <textarea
                      rows={2}
                      value={newResponse}
                      onChange={(e) => setNewResponse(e.target.value)}
                      placeholder="e.g. We have a special promotion going on today!"
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>
                  
                  {feedError && (
                    <span className="text-[9px] text-rose-400 block font-mono">{feedError}</span>
                  )}
                  {feedSuccess && (
                    <span className="text-[9px] text-emerald-400 block font-mono">{feedSuccess}</span>
                  )}

                  <button
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] px-3 py-1 rounded transition-colors"
                  >
                    Save to AI Feed
                  </button>
                </form>
              </div>

              {/* Existing Feeds List */}
              <div className="space-y-1.5">
                <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wide">Active Knowledge Feeds</span>
                {feeds.length === 0 ? (
                  <span className="text-[10px] text-slate-600 block italic">No manual data feeds yet. Add one above!</span>
                ) : (
                  <div className="max-h-[140px] overflow-y-auto space-y-1 divide-y divide-slate-900/50 pr-1">
                    {feeds.map((f) => (
                      <div key={f.id} className="flex items-start justify-between gap-2.5 py-1 text-[10px]">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-mono text-[9px] bg-slate-900 border border-slate-800 text-amber-500 px-1 py-0.1 rounded font-bold">
                              {f.trigger}
                            </span>
                          </div>
                          <p className="text-slate-300 text-[10px] mt-0.5 leading-tight break-words">{f.response}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteFeed(f.id, f.trigger)}
                          className="text-slate-600 hover:text-rose-400 p-0.5 shrink-0"
                          title="Delete this data feed"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className={`overflow-y-auto p-2.5 space-y-2.5 bg-slate-950/20 ${isAdmin ? 'h-[280px]' : 'h-[390px]'}`}>
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-1.5 max-w-[90%] ${
                isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              <div
                className={`rounded-xl px-2.5 py-1.5 text-[11px] inline-block leading-relaxed whitespace-pre-wrap shadow-md ${
                  isUser
                    ? 'bg-amber-500 text-slate-950 font-bold rounded-tr-none font-sans'
                    : 'bg-slate-900 text-slate-100 rounded-tl-none font-sans'
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-1 mr-auto animate-pulse">
            <div className="bg-slate-900 rounded-lg px-2 text-[10px] py-1 text-slate-400">
              Typing...
            </div>
          </div>
        )}
        <div ref={listEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="bg-slate-950 px-2 py-1 border-t border-slate-900 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none shrink-0">
        {CHIP_SUGGESTIONS.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(chip.text)}
            className="bg-slate-900 border border-slate-805 text-slate-300 text-[10px] px-2.5 py-1 rounded-full hover:bg-slate-800 transition-all flex items-center gap-1 cursor-pointer flex-shrink-0"
          >
            <span>{chip.icon}</span>
            <span>{chip.text}</span>
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-2 bg-slate-900 border-t border-slate-900 flex gap-1.5 shrink-0">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend(inputValue);
          }}
          placeholder={language === 'mm' ? "မေးမြန်းပါ..." : "Ask Shwe AI..."}
          className="flex-1 bg-slate-950 border border-slate-900 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
        />
        <button
          type="button"
          onClick={() => handleSend(inputValue)}
          disabled={!inputValue.trim() || isLoading}
          className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0"
        >
          Send
        </button>
      </div>

    </div>
  );
}
