/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameCategory = string;

export interface ProductPackage {
  id: string;
  name: string; // e.g., "70 Coins" or "86 Diamonds"
  amount: number;
  priceMmk: number;
  originalPriceMmk?: number; // for showing discount
  popular?: boolean;
  premium?: boolean;
}

export interface GameCategoryDetail {
  id: GameCategory;
  name: string;
  tagline: string;
  iconName: string;
  imageUrl: string;
  packages: ProductPackage[];
  helpText: string;
  requiresServerId: boolean; // True for MLBB, false for TikTok/PUBG (who use TikTok ID, Player ID)
}

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  category: GameCategory;
  packageName: string;
  amount: number;
  priceMmk: number;
  gameId: string;
  serverId?: string;
  telegramUsername: string;
  contactPhone: string;
  paymentMethod: string;
  transactionId: string;
  screenshotUrl?: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  ocrVerified?: boolean;
  ocrStatusText?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  createdAt: string;
}

export interface UserDetail {
  id: string;
  telegramUsername: string;
  displayName: string;
  contactPhone: string;
  joinedAt: string;
  coinsBalance: number;
  totalOrdersCount: number;
}

