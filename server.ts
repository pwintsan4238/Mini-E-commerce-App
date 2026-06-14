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
import { supabase } from './src/supabaseClient';

dotenv.config();

const app = express();
const PORT = 3000;

// Allow JSON payloads up to 20MB for mock screenshot files / base64 receipts
app.use(express.json({ limit: '20mb' }));

// NOTE: In-memory arrays replaced by Supabase persistence. When Supabase is not configured,
// the API will return helpful errors. Use .env SUPABASE_URL and SUPABASE_ANON_KEY.

// Orders are persisted in Supabase 'orders' table.

// Automatically progress "pending" and "processing" orders for simulation (increased delay for custom interaction)
// Periodic simulation job: progress pending -> processing -> completed for older orders
setInterval(async () => {
  try {
    const { data: pendingOrders } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['pending', 'processing']);

    if (!pendingOrders) return;

    const now = Date.now();
    for (const order of pendingOrders) {
      const elapsedSec = (now - new Date(order.updatedAt).getTime()) / 1000;
      if (order.status === 'pending' && elapsedSec >= 60) {
        await supabase.from('orders').update({ status: 'processing', updatedAt: new Date().toISOString() }).eq('id', order.id);
        console.log(`Simulation: Order ${order.id} -> processing`);
      } else if (order.status === 'processing' && elapsedSec >= 60) {
        await supabase.from('orders').update({ status: 'completed', updatedAt: new Date().toISOString() }).eq('id', order.id);
        console.log(`Simulation: Order ${order.id} -> completed`);
      }
    }
  } catch (e) {
    console.warn('Simulation job error:', e);
  }
}, 5000);

// Data feeds are persisted in Supabase 'data_feeds' table.

// API Endpoints for Data Feeds
app.get('/api/data-feeds', async (req, res) => {
  try {
    const { data, error } = await supabase.from('data_feeds').select('*').order('createdAt', { ascending: false });
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/data-feeds', async (req, res) => {
  try {
    const { trigger, response } = req.body;
    if (!trigger || !response) {
      res.status(400).json({ success: false, error: 'Trigger keywords and Response are both required.' });
      return;
    }
    const createdAt = new Date().toISOString();
    const { data, error } = await supabase.from('data_feeds').insert([{ trigger, response, createdAt }]).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/data-feeds/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('data_feeds').delete().eq('id', id).select().single();
    if (error) {
      if ((error as any).code === 'PGRST116') {
        res.status(404).json({ success: false, error: 'Data feed item not found.' });
        return;
      }
      throw error;
    }
    res.json({ success: true, message: 'Data feed item removed successfully.', data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Dynamic Products Database in Memory (loaded from productsData initially)
// Seed products from PRODUCTS_DATA if DB missing rows — handled by a server-side helper when needed.

// API Endpoints for Products
app.get('/api/products', async (req, res) => {
  try {
    const { data, error } = await supabase.from('products').select('*').order('id', { ascending: true });
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, tagline, iconName, imageUrl, helpText, requiresServerId, isHot, isValue, packages } = req.body;
    if (!name) {
      res.status(400).json({ success: false, error: 'Product name is required.' });
      return;
    }
    const cleanId = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_+|_+$)/g, '');
    const { data: existing } = await supabase.from('products').select('id').eq('id', cleanId).single();
    if (existing) {
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
      isHot: !!isHot,
      isValue: !!isValue,
      packages: packages || []
    };
    const { data, error } = await supabase.from('products').insert([newProduct]).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    updates.updatedAt = new Date().toISOString();
    const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single();
    if (error) {
      res.status(404).json({ success: false, error: error.message });
      return;
    }
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('products').delete().eq('id', id).select().single();
    if (error) {
      res.status(404).json({ success: false, error: error.message });
      return;
    }
    res.json({ success: true, message: 'Product deleted successfully.', data });
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
      text: `Analyze this Myanmar bank transfer receipt. 
We need to verify if this receipt is valid proof of a successful transfer.
Check the image text for:
1. Reference ID / Reference Number matching or similar to: "${expectedTxId}".
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
              description: "The amount digits parsed on the screenshot."
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
          ? `Reference code "${expectedTxId}" was not detected on the receipt image (Extracted: "${parseOcr.detectedReferenceId || 'None'}").`
          : `Amount (${expectedAmount.toLocaleString()} MMK) does not match the digits detected in the voucher image (Found: "${parseOcr.detectedAmount?.toLocaleString() || 'None'}").`
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
      res.status(400).json({ success: false, error: 'Missing required order fields.' });
      return;
    }

    // Call OCR Validation Check
    const ocrResult = await runGeminiOCR(screenshotUrl, transactionId, priceMmk);

    const orderId = `SC-${Math.floor(10000 + Math.random() * 90000)}`;
    const createdAt = new Date().toISOString();
    const orderRow = {
      id: orderId,
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
      status: ocrResult.matched ? 'pending' : 'cancelled',
      ocrVerified: ocrResult.matched,
      ocrStatusText: ocrResult.matched ? 'Verified successfully' : ocrResult.rejectionReason,
      createdAt,
      updatedAt: createdAt
    };

    const { data: insertedOrder, error: insertErr } = await supabase.from('orders').insert([orderRow]).select().single();
    if (insertErr) throw insertErr;

    // Auto update or register user in users table (new users created with approved=false)
    try {
      const cleanUser = telegramUsername.replace('@', '').trim();
      const { data: existingUser } = await supabase.from('users').select('*').eq('telegramUsername', cleanUser).maybeSingle();
      if (!existingUser) {
        await supabase.from('users').insert([{ telegramUsername: cleanUser, displayName: cleanUser, contactPhone: contactPhone || '', joinedAt: new Date().toISOString(), coinsBalance: 0, totalOrdersCount: 1, approved: false }]);
      } else {
        await supabase.from('users').update({ totalOrdersCount: (existingUser.totalOrdersCount || 0) + 1, contactPhone: existingUser.contactPhone || contactPhone || existingUser.contactPhone }).eq('id', existingUser.id);
      }
    } catch (uErr) {
      console.error('Error auto-syncing user details:', uErr);
    }

    res.status(201).json({
      success: true,
      data: insertedOrder,
      ocrPassed: ocrResult.matched,
      ocrReason: ocrResult.rejectionReason
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get orders (optionally filter by telegramUsername)
app.get('/api/orders', async (req, res) => {
  try {
    const { telegram } = req.query;
    let query = supabase.from('orders').select('*').order('createdAt', { ascending: false });
    if (telegram) {
      const clean = String(telegram).replace('@', '').trim().toLowerCase();
      query = query.eq('telegramUsername', clean);
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update order status explicitly (for simulation / admin mock demo)
app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedAt = new Date().toISOString();
    const { data, error } = await supabase.from('orders').update({ status, updatedAt }).eq('id', id).select().single();
    if (error) {
      res.status(404).json({ success: false, error: error.message });
      return;
    }
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete an Order explicitly (Admin Dashboard deletion capability)
app.delete('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('orders').delete().eq('id', id).select().single();
    if (error) {
      res.status(404).json({ success: false, error: error.message });
      return;
    }
    res.json({ success: true, message: 'Order deleted successfully', data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- USER MANAGEMENT ENDPOINTS ---

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('*').order('joinedAt', { ascending: false });
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Login check endpoint
app.post('/api/users/login-check', async (req, res) => {
  try {
    const { telegramUsername } = req.body;
    if (!telegramUsername) {
      res.status(400).json({ success: false, error: 'Telegram username is required' });
      return;
    }
    const cleanUsername = telegramUsername.replace('@', '').trim();
    const { data: user, error } = await supabase.from('users').select('*').eq('telegramUsername', cleanUsername).maybeSingle();
    if (error) throw error;
    if (!user) {
      res.status(404).json({ success: false, error: 'User does not exist in registry. Please Toggle "Sign Up" to register!' });
      return;
    }
    if (!user.approved) {
      res.status(403).json({ success: false, error: 'Account not approved by admin yet. Please wait for approval.' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(550).json({ success: false, error: error.message });
  }
});

// Create a new user (registrations default to approved = false)
app.post('/api/users', async (req, res) => {
  try {
    const { telegramUsername, displayName, contactPhone, coinsBalance } = req.body;
    if (!telegramUsername) {
      res.status(400).json({ success: false, error: 'Telegram username is required' });
      return;
    }
    const cleanUsername = telegramUsername.replace('@', '').trim();
    const { data: existing } = await supabase.from('users').select('id').eq('telegramUsername', cleanUsername).maybeSingle();
    if (existing) {
      res.status(400).json({ success: false, error: 'User with this Telegram username already exists' });
      return;
    }
    const newUser = {
      telegramUsername: cleanUsername,
      displayName: displayName || cleanUsername,
      contactPhone: contactPhone || '',
      joinedAt: new Date().toISOString(),
      coinsBalance: Number(coinsBalance) || 0,
      totalOrdersCount: 0,
      approved: false
    };
    const { data, error } = await supabase.from('users').insert([newUser]).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update an existing user's details or balance
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { displayName, contactPhone, coinsBalance, telegramUsername } = req.body;
    const updates: any = {};
    if (telegramUsername !== undefined) updates.telegramUsername = telegramUsername.replace('@', '').trim();
    if (displayName !== undefined) updates.displayName = displayName;
    if (contactPhone !== undefined) updates.contactPhone = contactPhone;
    if (coinsBalance !== undefined) updates.coinsBalance = Number(coinsBalance) || 0;
    updates.updatedAt = new Date().toISOString();
    const { data, error } = await supabase.from('users').update(updates).eq('id', id).select().single();
    if (error) {
      res.status(404).json({ success: false, error: error.message });
      return;
    }
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete a user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('users').delete().eq('id', id).select().single();
    if (error) {
      res.status(404).json({ success: false, error: error.message });
      return;
    }
    res.json({ success: true, message: 'User deleted successfully', data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: approve a user
app.post('/api/admin/users/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('users').update({ approved: true, updatedAt: new Date().toISOString() }).eq('id', id).select().single();
    if (error) {
      res.status(404).json({ success: false, error: error.message });
      return;
    }
    res.json({ success: true, message: 'User approved successfully', data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
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
         const { data: found } = await supabase.from('orders').select('*').eq('id', extractedId).maybeSingle();
         targetOrder = found;
      } else {
         // Auto find latest pending or processing order for current user using Supabase
         try {
           const clean = userTelegram ? String(userTelegram).replace('@','').trim() : null;
           const q = clean ? supabase.from('orders').select('*').in('status', ['pending','processing']).eq('telegramUsername', clean).order('createdAt', { ascending: false }).limit(1) : supabase.from('orders').select('*').in('status', ['pending','processing']).order('createdAt', { ascending: false }).limit(1);
           const { data } = await q;
           if (data && data.length) targetOrder = data[0];
         } catch (e) {
           console.warn('Failed to query orders for approval matching:', e);
         }
      }

      if (targetOrder) {
         await supabase.from('orders').update({ status: 'completed', updatedAt: new Date().toISOString() }).eq('id', targetOrder.id);

         const burmeseResponse = `🟢 [ADMIN APPROVAL DETECTED]\n\nအော်ဒါ **${targetOrder.id}** ကို Shwe Coin အက်ဒမင်မှ တယ်လီဂရမ်တစ်ခုဆင့် "Approve" ဖြင့် အတည်ပြုပြီးပါပြီ။\n\n- အခြေအနေ: အောင်မြင်ပါသည် (Completed)\n- အမျိုးအစား: ${targetOrder.category.toUpperCase()}\n- ပမာဏ: ${targetOrder.packageName}\n- အကောင့် ID: ${targetOrder.gameId}\n\nလူကြီးမင်းအကောင့်ထဲသို့ ဒင်္ဂါး/ဒိုင်းမွန်းများ ချက်ချင်းရောက်ပါမည်။ ကျေးဇူးတင်ပါသည်! 🇲🇲`;
         const englishResponse = `🟢 [ADMIN APPROVAL SIMULATED]\n\nOrder **${targetOrder.id}** has been manually APPROVED by Admin on Telegram!\n\n- Status: Completed\n- Item: ${targetOrder.packageName}\n- Game/TikTok Account ID: ${targetOrder.gameId}\n\nCoins/Diamonds have been credited. Thank you! 🇲🇲`;

         res.json({
           success: true,
           text: language === 'mm' ? burmeseResponse : englishResponse
         });
         return;
      } else {
         const burmeseNoOrder = `❌ [APPROVED ERROR]\n\nမင်္ဂလာပါ။ "approve" ပြုလုပ်ရန် ဆိုင်းငံ့စောင့်ဆိုင်းနေသော (Pending) အော်ဒါ မတွေ့ရှိပါ။ ကျေးဇူးပြု၍ Coins ဆိုင်မှ အော်ဒါတစ်ခု အရင်တင်ပါ။ 🙏`;
         const englishNoOrder = `❌ [APPROVAL ERROR]\n\nI couldn't find any pending/processing orders to approve right now. Please place an order in the Coins Shop first! 🙏`;
         res.json({
           success: true,
           text: language === 'mm' ? burmeseNoOrder : englishNoOrder
         });
         return;
      }
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    const { mode } = req.body;

    // Helper search manual bot inside the endpoint (async, uses DB)
    async function runManualMatchingBot(userMsg: string) {
      const q = userMsg.toLowerCase().trim();
      if (!q) {
        return "Please type a message to start chatting! I am here to help you. 🙏 (မြန်မာလို သို့မဟုတ် အင်္ဂလိပ်လို မေးမြန်းနိုင်ပါသည်။)";
      }

      // Split user queries into words / tokens
      const queryWords = q.split(/[\s,\.\-/?!_()+]+/g).filter(w => w.length >= 2 || (w >= "\u1000" && w <= "\u109F"));

      let bestFeed: any = null;
      let bestScore = 0;

      const { data: feeds } = await supabase.from('data_feeds').select('*').order('createdAt', { ascending: false });
      for (const feed of feeds || []) {
        const triggerLower = (feed.trigger || '').toLowerCase();
        // Calculate keyword hits
        const triggerWords = triggerLower.split(/[\s,\.\-/?!_()+]+/g).filter(Boolean);
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
      const bullets = (feeds || []).slice(0, 6).map((f:any) => `• ${String(f.trigger).split(' ').slice(0, 3).join(', ')}...`).join('\n');
      return `Hello! I am operating in Local Manual matching mode.\n\nCould you please ask about one of these topics:\n${bullets}\n\n(e.g. try typing "rate", "how to order", "delivery duration")`;
    }

    if (mode === 'manual' || !geminiApiKey || geminiApiKey === 'MY_GEMINI_API_KEY') {
      const fallbackAnswer = await runManualMatchingBot(lastMsgOriginal);
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

      let userOrders: any[] = [];
      try {
        if (userTelegram) {
          const clean = String(userTelegram).replace('@','').trim();
          const { data } = await supabase.from('orders').select('*').eq('telegramUsername', clean).order('createdAt', { ascending: false }).limit(10);
          userOrders = data || [];
        } else {
          const { data } = await supabase.from('orders').select('*').order('createdAt', { ascending: false }).limit(10);
          userOrders = data || [];
        }
      } catch (e) {
        console.warn('Failed to load orders for chat context:', e);
      }

      const ordersContext = userOrders.map(o => 
        `- Order ${o.id}: Category=${o.category}, Plan="${o.packageName}", MMK=${o.priceMmk}, Status="${o.status}", TxID=${o.transactionId}, UpdatedAt=${o.updatedAt}`
      ).join('\n');

      let customFeedContext = '';
      try {
        const { data: feeds } = await supabase.from('data_feeds').select('*').order('createdAt', { ascending: false });
        customFeedContext = (feeds || []).map((f:any) => `[Topic: ${f.trigger}]: ${f.response}`).join('\n');
      } catch (e) {
        console.warn('Failed to load data feeds for chat context', e);
      }

      const systemPrompt = `You are "Shwe Coin AI" (ရွှေကွန်း AI), a professional and friendly e-commerce Support Bot integrated in a Telegram Mini App for Myanmar users.
Your goal is to assist users with orders for TikTok Coins and Game Coins (Mobile Legends Diamonds, PUBG Mobile UC, Free Fire, Honor of Kings) using local provider methods.

Key Information & General Guidelines:
- Current Market Exchange Rate: ~4,800 MMK per USD.
- Available Products of Game Coins are:
  - TikTok Coins: 70 coins (4,200 MMK) up to 7,000 coins (359,000 MMK).
  - MLBB Diamonds: 86 Diamonds (5,200 MMK) up to 2195 Diamonds (121,000 MMK).
  - PUBG Mobile UC: 60 UC (3,500 MMK) up to 3850 UC (189,000 MMK).
  - Free Fire Diamonds: 110 Diamonds (3,950 MMK) up to 2312 Diamonds (74,900 MMK).
  - Honor of Kings Tokens: 88 Tokens (4,200 MMK) up to 2112 Tokens (91,900 MMK).
- Provider Details:
  - KBZ (U KO SHWE COIN TOPUP - 09 798 123 456)
  - Wave (U KO SHWE COIN TOPUP - 09 798 123 456)
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
      const fallbackAnswer = await runManualMatchingBot(lastMsgOriginal);
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

  // Seed products and sample data feeds if the DB is empty (helpful for first-run)
  async function seedIfEmpty() {
    try {
      const { data: prodRows, error: prodErr } = await supabase.from('products').select('id').limit(1);
      if (prodErr) {
        console.warn('Seed check: products table error', prodErr.message || prodErr);
      } else if (!prodRows || prodRows.length === 0) {
        console.log('Seeding products table from PRODUCTS_DATA...');
        const toInsert = PRODUCTS_DATA.map(p => ({
          id: p.id,
          name: p.name,
          tagline: p.tagline,
          iconName: p.iconName,
          imageUrl: p.imageUrl,
          helpText: p.helpText,
          requiresServerId: p.requiresServerId,
          isHot: !!p.isHot,
          isValue: !!p.isValue,
          packages: JSON.stringify(p.packages),
          createdAt: new Date().toISOString()
        }));
        const { error: insertErr } = await supabase.from('products').insert(toInsert);
        if (insertErr) console.warn('Seeding products failed:', insertErr.message || insertErr);
      }

      const { data: feedRows, error: feedErr } = await supabase.from('data_feeds').select('id').limit(1);
      if (feedErr) {
        console.warn('Seed check: data_feeds table error', feedErr.message || feedErr);
      } else if (!feedRows || feedRows.length === 0) {
        console.log('Seeding sample data_feeds...');
        const sample = [{ trigger: 'how to order', response: 'To place an order, select a product and provide your game ID or username.', createdAt: new Date().toISOString() }];
        const { error: insertFeedErr } = await supabase.from('data_feeds').insert(sample);
        if (insertFeedErr) console.warn('Seeding data_feeds failed:', insertFeedErr.message || insertFeedErr);
      }
    } catch (e) {
      console.warn('Seeding error:', e);
    }
  }

  await seedIfEmpty();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
