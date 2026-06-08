/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameCategoryDetail } from './types';

export const EXCH_RATE_USD_MMK = 4800; // Realistic market conversion rate for Myanmar Kyat in June 2026

export const PRODUCTS_DATA: GameCategoryDetail[] = [
  {
    id: 'tiktok_coins',
    name: 'TikTok Coins',
    tagline: 'Ideal for gifting, live streams, and boosting TikTok videos',
    iconName: 'Flame',
    imageUrl: 'https://images.unsplash.com/photo-1611272526047-0190fd427d54?auto=format&fit=crop&q=80&w=400',
    helpText: 'Provide your TikTok Username (e.g. @shwecoin_shop). Order completed within 5-15 mins.',
    requiresServerId: false,
    packages: [
      { id: 'tt_70', name: '70 TikTok Coins', amount: 70, priceMmk: 4200, originalPriceMmk: 4800 },
      { id: 'tt_350', name: '350 TikTok Coins', amount: 350, priceMmk: 19800, originalPriceMmk: 22000, popular: true },
      { id: 'tt_700', name: '700 TikTok Coins', amount: 700, priceMmk: 38500, originalPriceMmk: 44000 },
      { id: 'tt_1400', name: '1400 TikTok Coins', amount: 1400, priceMmk: 74900, originalPriceMmk: 88000 },
      { id: 'tt_3500', name: '3500 TikTok Coins', amount: 3500, priceMmk: 184500, originalPriceMmk: 210000, popular: true },
      { id: 'tt_7000', name: '7000 TikTok Coins', amount: 7000, priceMmk: 359000, originalPriceMmk: 410000 }
    ]
  },
  {
    id: 'mlbb_diamonds',
    name: 'MLBB Diamonds',
    tagline: 'Mobile Legends direct ID reload. Best rates in Myanmar!',
    iconName: 'Shield',
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=400',
    helpText: 'Provide your User ID and Zone ID (e.g. ID: 12345678, Zone: 1234). Direct automatic delivery.',
    requiresServerId: true,
    packages: [
      { id: 'ml_86', name: '86 Diamonds (80 + 6 Bonus)', amount: 86, priceMmk: 5200, originalPriceMmk: 6000 },
      { id: 'ml_172', name: '172 Diamonds (154 + 18 Bonus)', amount: 172, priceMmk: 10200, originalPriceMmk: 12000 },
      { id: 'ml_257', name: '257 Diamonds (231 + 26 Bonus)', amount: 257, priceMmk: 15150, originalPriceMmk: 18000, popular: true },
      { id: 'ml_706', name: '706 Diamonds (636 + 70 Bonus)', amount: 706, priceMmk: 41000, originalPriceMmk: 48000 },
      { id: 'ml_1412', name: '1412 Diamonds (1272 + 140 Bonus)', amount: 1412, priceMmk: 81000, originalPriceMmk: 95000, popular: true },
      { id: 'ml_2195', name: '2195 Diamonds (1975 + 220 Bonus)', amount: 2195, priceMmk: 121000, originalPriceMmk: 140000 }
    ]
  },
  {
    id: 'pubg_uc',
    name: 'PUBG Mobile UC',
    tagline: 'Get Unknown Cash instantly for Royal Pass & Skins',
    iconName: 'Target',
    imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=400',
    helpText: 'Provide your Character ID (numeric, e.g. 512345678). Deliver within 10 minutes.',
    requiresServerId: false,
    packages: [
      { id: 'pubg_60', name: '60 UC', amount: 60, priceMmk: 3500, originalPriceMmk: 4000 },
      { id: 'pubg_325', name: '325 UC', amount: 325, priceMmk: 17900, originalPriceMmk: 21000, popular: true },
      { id: 'pubg_660', name: '660 UC', amount: 660, priceMmk: 34500, originalPriceMmk: 41000 },
      { id: 'pubg_1800', name: '1800 UC', amount: 1800, priceMmk: 89500, originalPriceMmk: 105000 },
      { id: 'pubg_3850', name: '3850 UC', amount: 3850, priceMmk: 189000, originalPriceMmk: 220000, popular: true }
    ]
  },
  {
    id: 'freefire_diamonds',
    name: 'Free Fire Diamonds',
    tagline: 'Equip Elite Pass, Character skins, and weapons',
    iconName: 'Zap',
    imageUrl: 'https://images.unsplash.com/photo-1553481187-be93c21490a9?auto=format&fit=crop&q=80&w=400',
    helpText: 'Provide your Player UID (e.g. 84729103). Restock weapon crates and vouchers now.',
    requiresServerId: false,
    packages: [
      { id: 'ff_110', name: '110 Diamonds', amount: 110, priceMmk: 3950, originalPriceMmk: 4500 },
      { id: 'ff_341', name: '341 Diamonds', amount: 341, priceMmk: 11900, originalPriceMmk: 14000, popular: true },
      { id: 'ff_572', name: '572 Diamonds', amount: 572, priceMmk: 19500, originalPriceMmk: 23000 },
      { id: 'ff_1166', name: '1166 Diamonds', amount: 1166, priceMmk: 38900, originalPriceMmk: 46000 },
      { id: 'ff_2312', name: '2312 Diamonds', amount: 2312, priceMmk: 74900, originalPriceMmk: 90000 }
    ]
  },
  {
    id: 'hok_tokens',
    name: 'Honor of Kings Tokens',
    tagline: 'Brand new official tokens for top skins and heroes!',
    iconName: 'Sword',
    imageUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80&w=400',
    helpText: 'Provide your Player ID (UID found in Profile settings). Processed within 5-15 mins.',
    requiresServerId: false,
    packages: [
      { id: 'hok_88', name: '88 Tokens', amount: 88, priceMmk: 4200, originalPriceMmk: 4800 },
      { id: 'hok_264', name: '264 Tokens (240 + 24)', amount: 264, priceMmk: 12200, originalPriceMmk: 14000 },
      { id: 'hok_528', name: '528 Tokens (480 + 48)', amount: 528, priceMmk: 23900, originalPriceMmk: 28000, popular: true },
      { id: 'hok_1056', name: '1056 Tokens (960 + 96)', amount: 1056, priceMmk: 46900, originalPriceMmk: 55000 },
      { id: 'hok_2112', name: '2112 Tokens (1920 + 192)', amount: 2112, priceMmk: 91900, originalPriceMmk: 108000 }
    ]
  }
];

export const MYANMAR_PAYMENTS = [
  {
    id: 'kbzpay',
    name: 'KBZPay (KPay)',
    accountNo: '09 798 123 456',
    accountName: 'U KO SHWE COIN TOPUP',
    instructions: 'Please transfer the exact MMK amount to our KBZPay merchant/personal wallet. Upload the screenshot with visible transaction ID/Time.',
    qrCodePlaceholderLetter: 'K'
  },
  {
    id: 'wavepay',
    name: 'WaveMoney (WavePay)',
    accountNo: '09 798 123 456',
    accountName: 'U KO SHWE COIN TOPUP',
    instructions: 'Send money to Wave account mobile number. Keep the transaction ID safe and take a full screenshot.',
    qrCodePlaceholderLetter: 'W'
  },
  {
    id: 'cbpay',
    name: 'CB Pay (CB Bank)',
    accountNo: '0085 6005 0124 9912',
    accountName: 'U KO SHWE COIN TOPUP',
    instructions: 'Transfer via CB bank or CB Pay app. Enter "Game Topup" as transfer remarks.',
    qrCodePlaceholderLetter: 'C'
  },
  {
    id: 'ayapay',
    name: 'AYA Pay',
    accountNo: '09 798 123 456',
    accountName: 'U KO SHWE COIN TOPUP',
    instructions: 'Transfer through AYA Pay wallet. Processing times are instant.',
    qrCodePlaceholderLetter: 'A'
  }
];
