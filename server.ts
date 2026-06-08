/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { PRODUCTS_DATA } from './src/productsData';
import { Order, OrderStatus, UserDetail } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

// Allow JSON payloads up to 20MB for mock screenshot files / base64 receipts
app.use(express.json({ limit: '20mb' }));

// In-Memory Database for Users
let dbUsers: UserDetail[] = [
  {
    id: 'usr-1029',
    telegramUsername: 'kyawkyaw_game',
    displayName: 'Kyaw Kyaw',
    contactPhone: '09778239103',
    joinedAt: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
    coinsBalance: 120,
    totalOrdersCount: 2
  },
  {
    id: 'usr-4820',
    telegramUsername: 'lucy_myanmar',
    displayName: 'Lucy Thaw',
    contactPhone: '09420019284',
    joinedAt: new Date(Date.now() - 3600000 * 24 * 15).toISOString(),
    coinsBalance: 350,
    totalOrdersCount: 1
  },
  {
    id: 'usr-9281',
    telegramUsername: 'shwe_thiri_99',
    displayName: 'Shwe Thiri MM',
    contactPhone: '09281938210',
    joinedAt: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
    coinsBalance: 0,
    totalOrdersCount: 0
  },
  {
    id: 'usr-3841',
    telegramUsername: 'mg_mg_topup',
    displayName: 'Mg Mg',
    contactPhone: '09558129033',
    joinedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    coinsBalance: 1450,
    totalOrdersCount: 4
  }
];

// In-Memory Database for Order Persistence
let dbOrders: Order[] = [
  {
    id: 'SC-84920',
    category: 'mlbb_diamonds',
    packageName: '257 Diamonds (231 + 26 Bonus)',
    amount: 257,
    priceMmk: 15150,
    gameId: '293847291',
    serverId: '9281',
    telegramUsername: 'kyawkyaw_game',
    contactPhone: '09778239103',
    paymentMethod: 'kbzpay',
    transactionId: 'KPay-91023948512',
    screenshotUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=200',
    status: 'completed',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    updatedAt: new Date(Date.now() - 3600000 * 1.8).toISOString()
  },
  {
    id: 'SC-29374',
    category: 'tiktok_coins',
    packageName: '350 TikTok Coins',
    amount: 350,
    priceMmk: 19800,
    gameId: '@lucy_tiktok_mm',
    telegramUsername: 'lucy_myanmar',
    contactPhone: '09420019284',
    paymentMethod: 'wavepay',
    transactionId: 'Wave-992019348122',
    status: 'completed',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
    updatedAt: new Date(Date.now() - 3600000 * 4.9).toISOString()
  }
];

// Automatically progress "pending" and "processing" orders for simulation (increased delay for custom interaction)
setInterval(() => {
  let changed = false;
  dbOrders = dbOrders.map(order => {
    const elapsedSec = (Date.now() - new Date(order.updatedAt).getTime()) / 1000;
    if (order.status === 'pending' && elapsedSec >= 60) {
      changed = true;
      return {
        ...order,
        status: 'processing',
        updatedAt: new Date().toISOString()
      };
    }
    if (order.status === 'processing' && elapsedSec >= 60) {
      changed = true;
      return {
        ...order,
        status: 'completed',
        updatedAt: new Date().toISOString()
      };
    }
    return order;
  });
  if (changed) {
    console.log('Simulation: Order statuses progressed.');
  }
}, 5000);

// Simulation and Database Data Feeds for Chatbot
interface DataFeed {
  id: string;
  trigger: string;
  response: string;
  createdAt: string;
}

let dbDataFeeds: DataFeed[] = [
  {
    id: 'df-1',
    trigger: 'exchange rate dollar rate mmk usd ငွေလဲနှုန်း',
    response: 'Current exchange rate is ~4,800 MMK per USD. (ယနေ့ ကမ္ဘာ့ဒေါ်လာပေါက်ဈေး ငွေလဲနှုန်းမှာ တစ်ဒေါ်လာလျှင် ၄,၈၀၀ ကျပ် ဝန်းကျင်ဖြစ်ပါသည်။)',
    createdAt: new Date().toISOString()
  },
  {
    id: 'df-2',
    trigger: 'payment safe kpay wavepay wavemoney gp cb aya ပေးချေမှု',
    response: 'We accept KBZPay and WavePay. Send payments to "U KO SHWE COIN TOPUP" at 09 798 123 456. Make sure to capture a clear screenshot of the receipt.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'df-3',
    trigger: 'delivery time duration wait long speed စောင့်ဆိုင်းချိန်',
    response: 'Orders are processed fast! Delivery typically takes between 5 to 15 minutes after our system/admin validates your payment screenshot.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'df-4',
    trigger: 'how to buy topup order diamond coin mlbb tiktok ဝယ်ယူနည်း',
    response: 'Simply go to our Shop, select a package, enter your Game/TikTok ID, upload the payment screenshot, input the transaction ID, and check out!',
    createdAt: new Date().toISOString()
  }
];

// API Endpoints for Data Feeds
app.get('/api/data-feeds', (req, res) => {
  res.json({ success: true, data: dbDataFeeds });
});

app.post('/api/data-feeds', (req, res) => {
  try {
    const { trigger, response } = req.body;
    if (!trigger || !response) {
      res.status(400).json({ success: false, error: 'Trigger keywords and Response are both required.' });
      return;
    }
    const newItem: DataFeed = {
      id: `df-${Math.floor(1000 + Math.random() * 9000)}`,
      trigger,
      response,
      createdAt: new Date().toISOString()
    };
    dbDataFeeds.push(newItem);
    res.status(201).json({ success: true, data: newItem });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/data-feeds/:id', (req, res) => {
  try {
    const { id } = req.params;
    const initialLength = dbDataFeeds.length;
    dbDataFeeds = dbDataFeeds.filter(i => i.id !== id);
    if (dbDataFeeds.length === initialLength) {
      res.status(404).json({ success: false, error: 'Data feed item not found.' });
      return;
    }
    res.json({ success: true, message: 'Data feed item removed successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Dynamic Products Database in Memory (loaded from productsData initially)
let dbProducts = JSON.parse(JSON.stringify(PRODUCTS_DATA));

// API Endpoints for Products
app.get('/api/products', (req, res) => {
  res.json({ success: true, data: dbProducts });
});

app.post('/api/products', (req, res) => {
  try {
    const { name, tagline, iconName, imageUrl, helpText, requiresServerId } = req.body;
    if (!name) {
      res.status(400).json({ success: false, error: 'Product name is required.' });
      return;
    }
    const cleanId = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_+|_+$)/g, '');
    if (dbProducts.some((p: any) => p.id === cleanId)) {
      res.status(400).json({ success: false, error: 'A product with this name already exists.' });
      return;
    }
    const newProduct = {
      id: cleanId,
      name,
      tagline: tagline || '',
      iconName: iconName || 'Smartphone',
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=400',
      helpText: helpText || '',
      requiresServerId: !!requiresServerId,
      packages: []
    };
    dbProducts.push(newProduct);
    res.status(201).json({ success: true, data: newProduct });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, tagline, iconName, imageUrl, helpText, requiresServerId, packages } = req.body;
    const prodIndex = dbProducts.findIndex((p: any) => p.id === id);
    if (prodIndex === -1) {
      res.status(404).json({ success: false, error: 'Product not found.' });
      return;
    }

    if (name !== undefined) dbProducts[prodIndex].name = name;
    if (tagline !== undefined) dbProducts[prodIndex].tagline = tagline;
    if (iconName !== undefined) dbProducts[prodIndex].iconName = iconName;
    if (imageUrl !== undefined) dbProducts[prodIndex].imageUrl = imageUrl;
    if (helpText !== undefined) dbProducts[prodIndex].helpText = helpText;
    if (requiresServerId !== undefined) dbProducts[prodIndex].requiresServerId = !!requiresServerId;
    if (packages !== undefined) dbProducts[prodIndex].packages = packages;

    res.json({ success: true, data: dbProducts[prodIndex] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const initialLength = dbProducts.length;
    dbProducts = dbProducts.filter((p: any) => p.id !== id);
    if (dbProducts.length === initialLength) {
      res.status(404).json({ success: false, error: 'Product not found.' });
      return;
    }
    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// OCR Helper function to verify transfer receipt screenshots using Gemini
async function runGeminiOCR(
  screenshotUrl: string | undefined,
  expectedTxId: string,
  expectedAmount: number
): Promise<{
  matched: boolean;
  detectedTxId?: string;
  detectedAmount?: number;
  rejectionReason?: string;
}> {
  if (!screenshotUrl) {
    return {
      matched: false,
      rejectionReason: 'Receipt voucher attachment is required to verify the transfer.'
    };
  }

  const isBase64 = screenshotUrl.startsWith('data:image/');
  
  // If it's a mock Unsplash URL or we are in offline / fake receipt mode, trigger simulated OCR
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const isOffline = !geminiApiKey || geminiApiKey === 'MY_GEMINI_API_KEY';

  if (!isBase64 || isOffline) {
    // Elegant simulation check
    const code = expectedTxId.toUpperCase().trim();
    if (code.includes('FAIL') || code.includes('REJECT') || code.includes('WRONG') || expectedTxId === '1111' || expectedTxId === '1234') {
      return {
        matched: false,
        detectedTxId: 'KBZ-999281313',
        detectedAmount: 0,
        rejectionReason: `[AUTOMATIC OCR REJECTION] Voucher verification failed. Reference Code "${expectedTxId}" was not found on receipt image, and expected digit amount (${expectedAmount.toLocaleString()} MMK) does not match the voucher.`
      };
    }
    if (expectedTxId.length < 5) {
      return {
        matched: false,
        detectedTxId: 'UNKNOWN',
        detectedAmount: 0,
        rejectionReason: `[AUTOMATIC OCR REJECTION] Reference code "${expectedTxId}" is too short or invalid. It could not be matched securely to the voucher screenshot.`
      };
    }
    return {
      matched: true,
      detectedTxId: expectedTxId,
      detectedAmount: expectedAmount
    };
  }

  // Real Multimodal Gemini-based Receipt verification
  try {
    const match = screenshotUrl.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) {
      return {
        matched: false,
        rejectionReason: 'Invalid image format uploaded.'
      };
    }

    const mimeType = match[1];
    const base64Data = match[2];

    const ai = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const imagePart = {
      inlineData: {
        mimeType,
        data: base64Data,
      },
    };

    const textPart = {
      text: `Analyze this Myanmar bank/payment transfer receipt. 
We need to verify if this receipt is valid proof of a successful transfer.
Check the image text for:
1. Transaction Reference ID / Reference Number matching or similar to: "${expectedTxId}".
2. The transfer amount in digits of: ${expectedAmount} (may be formatted like "${expectedAmount.toLocaleString()}").

Analyze carefully. You MUST return a JSON format with 'foundReferenceId', 'foundAmount', 'detectedReferenceId', 'detectedAmount' and 'explanation' keys.`,
    };

    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            foundReferenceId: {
              type: Type.BOOLEAN,
              description: "True if the requested Reference ID/Code is detected on the receipt."
            },
            foundAmount: {
              type: Type.BOOLEAN,
              description: "True if the transfer amount is detected on the receipt."
            },
            detectedReferenceId: {
              type: Type.STRING,
              description: "The reference ID or code number text detected on the statement/receipt image."
            },
            detectedAmount: {
              type: Type.NUMBER,
              description: "The payment amount digits parsed on the screenshot."
            },
            explanation: {
              type: Type.STRING,
              description: "Brief rationale of matches found or mismatch details."
            }
          },
          required: ["foundReferenceId", "foundAmount", "detectedReferenceId", "detectedAmount", "explanation"]
        }
      }
    });

    const bodyText = result.text;
    if (!bodyText) {
      throw new Error('Gemini returned an empty response during OCR receipt verification.');
    }

    const parseOcr = JSON.parse(bodyText.trim());
    const matched = parseOcr.foundReferenceId && parseOcr.foundAmount;

    return {
      matched: !!matched,
      detectedTxId: parseOcr.detectedReferenceId,
      detectedAmount: parseOcr.detectedAmount,
      rejectionReason: matched ? undefined : (
        !parseOcr.foundReferenceId && !parseOcr.foundAmount
          ? `Receipt does not contain Reference Code "${expectedTxId}" nor Amount ${expectedAmount.toLocaleString()} MMK.`
          : !parseOcr.foundReferenceId
          ? `Transaction Reference code "${expectedTxId}" was not detected on the receipt image (Extracted: "${parseOcr.detectedReferenceId || 'None'}").`
          : `Payment amount (${expectedAmount.toLocaleString()} MMK) does not match the digits detected in the payment voucher image (Found: "${parseOcr.detectedAmount?.toLocaleString() || 'None'}").`
      )
    };

  } catch (error: any) {
    console.error('Gemini OCR runtime exception:', error);
    return {
      matched: false,
      rejectionReason: `Automatic OCR verification crashed: ${error.message || 'Server timeout error'}`
    };
  }
}

// Create Order
app.post('/api/orders', async (req, res) => {
  try {
    const {
      category,
      packageName,
      amount,
      priceMmk,
      gameId,
      serverId,
      telegramUsername,
      contactPhone,
      paymentMethod,
      transactionId,
      screenshotUrl
    } = req.body;

    if (!category || !packageName || !amount || !priceMmk || !gameId || !telegramUsername || !contactPhone || !paymentMethod || !transactionId) {
      res.status(400).json({ success: false, error: 'Missing required checkout fields.' });
      return;
    }

    // Call OCR Validation Check
    const ocrResult = await runGeminiOCR(screenshotUrl, transactionId, priceMmk);

    const newOrder: Order = {
      id: `SC-${Math.floor(10000 + Math.random() * 90000)}`,
      category,
      packageName,
      amount,
      priceMmk,
      gameId,
      serverId,
      telegramUsername,
      contactPhone,
      paymentMethod,
      transactionId,
      screenshotUrl,
      status: ocrResult.matched ? 'pending' : 'cancelled', // Automatically denies proceeding with compilation if OCR fails
      ocrVerified: ocrResult.matched,
      ocrStatusText: ocrResult.matched ? 'Verified successfully' : ocrResult.rejectionReason,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    dbOrders.unshift(newOrder);

    // Auto update or register user in dbUsers
    try {
      const cleanUser = telegramUsername.replace('@', '').trim();
      let userObj = dbUsers.find(u => u.telegramUsername.toLowerCase() === cleanUser.toLowerCase());
      if (!userObj) {
        userObj = {
          id: `usr-${Math.floor(1000 + Math.random() * 9000)}`,
          telegramUsername: cleanUser,
          displayName: cleanUser,
          contactPhone: contactPhone || '',
          joinedAt: new Date().toISOString(),
          coinsBalance: 0,
          totalOrdersCount: 1
        };
        dbUsers.push(userObj);
      } else {
        userObj.totalOrdersCount += 1;
        if (contactPhone && !userObj.contactPhone) {
          userObj.contactPhone = contactPhone;
        }
      }
    } catch (uErr) {
      console.error('Error auto-syncing user details:', uErr);
    }

    res.status(201).json({ 
      success: true, 
      data: newOrder,
      ocrPassed: ocrResult.matched,
      ocrReason: ocrResult.rejectionReason
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get orders (optionally filter by telegramUsername)
app.get('/api/orders', (req, res) => {
  const { telegram } = req.query;
  if (telegram) {
    const filtered = dbOrders.filter(o => 
      o.telegramUsername.toLowerCase().trim() === (telegram as string).toLowerCase().trim()
    );
    res.json({ success: true, data: filtered });
    return;
  }
  res.json({ success: true, data: dbOrders });
});

// Update order status explicitly (for simulation / admin mock demo)
app.patch('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const orderIndex = dbOrders.findIndex(o => o.id === id);
  if (orderIndex === -1) {
    res.status(404).json({ success: false, error: 'Order not found' });
    return;
  }

  dbOrders[orderIndex].status = status as OrderStatus;
  dbOrders[orderIndex].updatedAt = new Date().toISOString();
  res.json({ success: true, data: dbOrders[orderIndex] });
});

// Delete an Order explicitly (Admin Dashboard deletion capability)
app.delete('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const initialLength = dbOrders.length;
  dbOrders = dbOrders.filter(o => o.id !== id);
  if (dbOrders.length === initialLength) {
    res.status(404).json({ success: false, error: 'Order not found' });
    return;
  }
  res.json({ success: true, message: 'Order deleted successfully' });
});

// --- USER MANAGEMENT ENDPOINTS ---

// Get all users
app.get('/api/users', (req, res) => {
  res.json({ success: true, data: dbUsers });
});

// Login check endpoint
app.post('/api/users/login-check', (req, res) => {
  try {
    const { telegramUsername } = req.body;
    if (!telegramUsername) {
      res.status(400).json({ success: false, error: 'Telegram username is required' });
      return;
    }
    const cleanUsername = telegramUsername.replace('@', '').trim().toLowerCase();
    const user = dbUsers.find(u => u.telegramUsername.toLowerCase() === cleanUsername);
    if (user) {
      res.json({ success: true, data: user });
    } else {
      res.status(404).json({ success: false, error: 'User does not exist in registry. Please Toggle "Sign Up" to register!' });
    }
  } catch (error: any) {
    res.status(550).json({ success: false, error: error.message });
  }
});

// Create a new user
app.post('/api/users', (req, res) => {
  try {
    const { telegramUsername, displayName, contactPhone, coinsBalance } = req.body;
    if (!telegramUsername) {
      res.status(400).json({ success: false, error: 'Telegram username is required' });
      return;
    }
    const cleanUsername = telegramUsername.replace('@', '').trim();
    if (dbUsers.some(u => u.telegramUsername.toLowerCase() === cleanUsername.toLowerCase())) {
      res.status(400).json({ success: false, error: 'User with this Telegram username already exists' });
      return;
    }
    const newUser: UserDetail = {
      id: `usr-${Math.floor(1000 + Math.random() * 9000)}`,
      telegramUsername: cleanUsername,
      displayName: displayName || cleanUsername,
      contactPhone: contactPhone || '',
      joinedAt: new Date().toISOString(),
      coinsBalance: Number(coinsBalance) || 0,
      totalOrdersCount: 0
    };
    dbUsers.push(newUser);
    res.status(201).json({ success: true, data: newUser });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update an existing user's details or balance
app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { displayName, contactPhone, coinsBalance, telegramUsername } = req.body;
  
  const user = dbUsers.find(u => u.id === id);
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  if (telegramUsername !== undefined) {
    user.telegramUsername = telegramUsername.replace('@', '').trim();
  }
  if (displayName !== undefined) {
    user.displayName = displayName;
  }
  if (contactPhone !== undefined) {
    user.contactPhone = contactPhone;
  }
  if (coinsBalance !== undefined) {
    user.coinsBalance = Number(coinsBalance) || 0;
  }

  res.json({ success: true, data: user });
});

// Delete a user
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const initialLength = dbUsers.length;
  dbUsers = dbUsers.filter(u => u.id !== id);
  if (dbUsers.length === initialLength) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }
  res.json({ success: true, message: 'User deleted successfully' });
});

// AI Chatbot - Gemini 3.5 Assistant with Myanmar localized system instruction
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages, userTelegram, language } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ success: false, error: 'Invalid messages body' });
      return;
    }

    const lastMsgOriginal = messages[messages.length - 1]?.text || '';
    const lastMsgLower = lastMsgOriginal.toLowerCase().trim();

    // INTERCEPT ADMIN TELEGRAM APPROVAL COMMANDS
    if (lastMsgLower.includes('approve') || lastMsgLower === 'completed' || lastMsgLower === 'complete') {
      let targetOrder: Order | undefined;
      const orderIdMatch = lastMsgOriginal.match(/SC-\d+/i) || lastMsgOriginal.match(/\d{5}/);

      if (orderIdMatch) {
         const matchedText = orderIdMatch[0].toUpperCase();
         const extractedId = matchedText.startsWith('SC-') ? matchedText : `SC-${matchedText}`;
         targetOrder = dbOrders.find(o => o.id === extractedId);
      } else {
         // Auto find latest pending or processing order for current user
         const sorted = [...dbOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
         targetOrder = sorted.find(o => 
           (o.status === 'pending' || o.status === 'processing') &&
           (!userTelegram || o.telegramUsername.toLowerCase().trim() === String(userTelegram).toLowerCase().trim())
         );
         // Systemwide fallback
         if (!targetOrder) {
           targetOrder = sorted.find(o => o.status === 'pending' || o.status === 'processing');
         }
      }

      if (targetOrder) {
         targetOrder.status = 'completed';
         targetOrder.updatedAt = new Date().toISOString();

         const burmeseResponse = `🟢 [ADMIN APPROVAL DETECTED]\n\nအော်ဒါ **${targetOrder.id}** ကို Shwe Coin အက်ဒမင်မှ တယ်လီဂရမ်တစ်ခုဆင့် "Approve" ဖြင့် အတည်ပြုပြီးပါပြီ။\n\n- အခြေအနေ: အောင်မြင်ပါသည် (Completed)\n- အမျိုးအစား: ${targetOrder.category.toUpperCase()}\n- ပမာဏ: ${targetOrder.packageName}\n- အကောင့် ID: ${targetOrder.gameId}\n\nလူကြီးမင်းအကောင့်ထဲသို့ ဒင်္ဂါး/ဒိုင်းမွန်းများ ချက်ချင်းရောက်ပါမည်။ ကျေးဇူးတင်ပါသည်! 🇲🇲`;
         const englishResponse = `🟢 [ADMIN APPROVAL SIMULATED]\n\nOrder **${targetOrder.id}** has been manually APPROVED by Admin on Telegram!\n\n- Status: Completed\n- Item: ${targetOrder.packageName}\n- Game/TikTok Account ID: ${targetOrder.gameId}\n\nCoins/Diamonds have been credited. Thank you for your purchase! 🇲🇲`;

         res.json({
           success: true,
           text: language === 'mm' ? burmeseResponse : englishResponse
         });
         return;
      } else {
         const burmeseNoOrder = `❌ [APPROVED ERROR]\n\nမင်္ဂလာပါ။ "approve" ပြုလုပ်ရန် ဆိုင်းငံ့စောင့်ဆိုင်းနေသော (Pending) အော်ဒါ မတွေ့ရှိပါ။ ကျေးဇူးပြု၍ Coins ဆိုင်မှ အော်ဒါတစ်ခု အရင်တင်ပါ။ 🙏`;
         const englishNoOrder = `❌ [APPROVAL ERROR]\n\nI couldn't find any pending/processing orders to approve right now. Please place a buy order in the Coins Shop first! 🙏`;
         res.json({
           success: true,
           text: language === 'mm' ? burmeseNoOrder : englishNoOrder
         });
         return;
      }
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    const { mode } = req.body;

    // Helper search manual bot inside the endpoint
    function runManualMatchingBot(userMsg: string): string {
      const q = userMsg.toLowerCase().trim();
      if (!q) {
        return "Please type a message to start chatting! I am here to help you. 🙏 (မြန်မာလို သို့မဟုတ် အင်္ဂလိပ်လို မေးမြန်းနိုင်ပါသည်။)";
      }

      // Split user queries into words / tokens
      const queryWords = q.split(/[\s,.\-/?!_()+]+/g).filter(w => w.length >= 2 || (w >= "\u1000" && w <= "\u109F"));

      let bestFeed: DataFeed | null = null;
      let bestScore = 0;

      for (const feed of dbDataFeeds) {
        const triggerLower = feed.trigger.toLowerCase();
        // Calculate keyword hits
        const triggerWords = triggerLower.split(/[\s,.\-/?!_()+]+/g).filter(Boolean);
        let matchCount = 0;

        for (const qWord of queryWords) {
          if (triggerWords.includes(qWord)) {
            matchCount += 3; // exact keyword match
          } else {
            for (const tWord of triggerWords) {
              if (tWord.includes(qWord) || qWord.includes(tWord)) {
                matchCount += 1;
                break;
              }
            }
          }
        }

        if (matchCount > bestScore) {
          bestScore = matchCount;
          bestFeed = feed;
        }
      }

      if (bestFeed && bestScore > 0) {
        return `${bestFeed.response}`;
      }

      // Build a nice default help answer using all active feed items
      const bullets = dbDataFeeds.slice(0, 6).map(f => `• ${f.trigger.split(' ').slice(0, 3).join(', ')}...`).join('\n');
      return `Hello! I am operating in Local Manual matching mode.\n\nCould you please ask about one of these topics:\n${bullets}\n\n(e.g. try typing "payment", "rate", "how to buy", "delivery duration")`;
    }

    if (mode === 'manual' || !geminiApiKey || geminiApiKey === 'MY_GEMINI_API_KEY') {
      const fallbackAnswer = runManualMatchingBot(lastMsgOriginal);
      res.json({
        success: true,
        text: fallbackAnswer,
        isManualMode: true
      });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: geminiApiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const userOrders = dbOrders.filter(o => 
        userTelegram && o.telegramUsername.toLowerCase().trim() === String(userTelegram).toLowerCase().trim()
      );

      const ordersContext = userOrders.map(o => 
        `- Order ${o.id}: Category=${o.category}, Plan="${o.packageName}", MMK=${o.priceMmk}, Status="${o.status}", TxID=${o.transactionId}, UpdatedAt=${o.updatedAt}`
      ).join('\n');

      const customFeedContext = dbDataFeeds.map(f =>
        `[Topic: ${f.trigger}]: ${f.response}`
      ).join('\n');

      const systemPrompt = `You are "Shwe Coin AI" (ရွှေကွန်း AI), a professional and friendly e-commerce Support Bot integrated in a Telegram Mini App for Myanmar users.
Your goal is to assist users in buying TikTok Coins and Game Coins (Mobile Legends Diamonds, PUBG Mobile UC, Free Fire, Honor of Kings) using Myanmar local payments (KBZPay, WavePay, CBPay, AYA Pay).

Key Information & General Guidelines:
- Current Market Exchange Rate: ~4,800 MMK per USD.
- Available Products of Game Coins are:
  - TikTok Coins: 70 coins (4,200 MMK) up to 7,000 coins (359,000 MMK).
  - MLBB Diamonds: 86 Diamonds (5,200 MMK) up to 2195 Diamonds (121,000 MMK).
  - PUBG Mobile UC: 60 UC (3,500 MMK) up to 3850 UC (189,000 MMK).
  - Free Fire Diamonds: 110 Diamonds (3,950 MMK) up to 2312 Diamonds (74,900 MMK).
  - Honor of Kings Tokens: 88 Tokens (4,200 MMK) up to 2112 Tokens (91,900 MMK).
- Payment Details:
  - KBZPay (U KO SHWE COIN TOPUP - 09 798 123 456)
  - WavePay (U KO SHWE COIN TOPUP - 09 798 123 456)
- Delivery Speed: 5 to 15 minutes after screenshot validation.
- User's Telegram username is currently: "${userTelegram || 'Guest User'}".
- Current orders related to this user:\n${ordersContext || 'No orders found yet for this username.'}

Custom Dynamic Knowledgebase Feeds (USE THIS DATA FIRST IF THE USER ASKS ABOUT IT):
${customFeedContext || 'No additional custom data feed available.'}

Behavioral Guidelines:
1. Speak warmly and respectfully. You should speak in both Burmese (Myanmar Unicode) and English naturally depending on what the user uses (or mix beautifully!), welcoming them with "Mingalabar!" (မင်္ဂလာပါ).
2. Help users select the best bundle according to their budget in Myanmar Kyat.
3. If they ask about their order status (or ask to check an order), refer to the orders state provided in current context. Let them know whether it is "pending" (စောင့်ဆိုင်းဆဲ), "processing" (ဆောင်ရွက်ဆဲ), or "completed" (အောင်မြင်သည်) and explain helpful next steps with full politeness.
4. Keep answers brief, conversational, and format list items beautifully.

Do NOT mention internal variables or code paths. Say "ရွှေကွန်း AI" with pride and helpfulness!`;

      // Map conversation array to Gemini contents parts
      // We only take the last 8 messages to stay within size quotas gracefully
      const history = messages.slice(-8).map((msg: any) => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: history,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7
        }
      });

      res.json({ success: true, text: response.text });
    } catch (apiErr: any) {
      console.warn('Gemini AI failed, switching to local manual matcher:', apiErr);
      const fallbackAnswer = runManualMatchingBot(lastMsgOriginal);
      res.json({
        success: true,
        text: `⚠️ [Auto-Switched to Manual Bot: AI Unreachable]\n\n${fallbackAnswer}`,
        isManualMode: true,
        error: apiErr.message
      });
    }
  } catch (error: any) {
    console.error('Gemini Chat API Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Vite & Static assets mounting
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
