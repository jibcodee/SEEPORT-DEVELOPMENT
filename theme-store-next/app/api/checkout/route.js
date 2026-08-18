import { NextResponse } from 'next/server';
import { query } from '../../../lib/supabase';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

function generateRandomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'SP-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  result += '-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { theme_id, currency } = body;

    if (!theme_id) {
      return NextResponse.json({ error: 'Theme ID is required' }, { status: 400 });
    }

    // 1. Get theme from DB
    const themeResult = await query('SELECT * FROM themes WHERE id = $1', [theme_id]);
    if (themeResult.rows.length === 0) {
      return NextResponse.json({ error: 'Theme not found' }, { status: 404 });
    }
    const theme = themeResult.rows[0];
    const price = theme.price !== null ? parseFloat(theme.price) : null;
    
    // 2. Handle FREE themes (bypass Stripe)
    if (price === 0) {
      let code = '';
      let isUnique = false;
      while (!isUnique) {
        code = generateRandomCode();
        const checkResult = await query('SELECT id FROM theme_codes WHERE code = $1', [code]);
        if (checkResult.rows.length === 0) isUnique = true;
      }
      
      const themeIdsJson = JSON.stringify([theme_id]);
      const mockOrderId = `ORD-${Date.now()}`;
      await query(
        `INSERT INTO theme_codes (code, theme_ids, status, order_id) VALUES ($1, $2, 'unused', $3)`,
        [code, themeIdsJson, mockOrderId]
      );
      
      return NextResponse.json({
        success: true,
        code: code,
        order_id: mockOrderId
      });
    }

    // 3. Handle PAID themes via Currency Preference / Geo-Routing
    let isMY = true;
    if (currency) {
      const cUpper = String(currency).toUpperCase();
      isMY = cUpper === 'MYR' || cUpper === 'RM';
    } else {
      const country = request.headers.get('cf-ipcountry') || 'MY';
      isMY = country === 'MY';
    }

    const isPremium = theme.price_tier === 'premium';
    
    // Select Price ID based on currency
    let priceId = '';
    if (isMY) {
      priceId = isPremium 
        ? process.env.STRIPE_PRICE_ID_MYR_PREM 
        : process.env.STRIPE_PRICE_ID_MYR_STD;
    } else {
      priceId = isPremium 
        ? process.env.STRIPE_PRICE_ID_USD_PREM 
        : process.env.STRIPE_PRICE_ID_USD_STD;
    }

    if (!priceId || priceId.includes('placeholder')) {
       console.error('Missing Stripe Price ID in env vars. Returning error.');
       return NextResponse.json({ 
         error: 'Stripe is not configured. Please add Stripe keys and Price IDs to .env.local',
         needs_config: true
       }, { status: 500 });
    }

    // 4. Create Stripe Checkout Session
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host');
    const baseUrl = `${protocol}://${host}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/`,
      metadata: {
        theme_id: theme_id,
      },
    });

    return NextResponse.json({
      success: true,
      url: session.url
    });

  } catch (error) {
    console.error('Error in checkout API:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
