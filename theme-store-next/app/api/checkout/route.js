import { NextResponse } from 'next/server';
import { query } from '../../../lib/supabase';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

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

    // --- Input Validation ---
    if (!theme_id) {
      return NextResponse.json({ error: 'Theme ID is required' }, { status: 400 });
    }

    // Sanitize theme_id to prevent injection
    if (typeof theme_id !== 'string' && typeof theme_id !== 'number') {
      return NextResponse.json({ error: 'Invalid theme_id format' }, { status: 400 });
    }

    // --- Fetch Theme from DB ---
    const themeResult = await query('SELECT * FROM themes WHERE id = $1', [theme_id]);
    if (themeResult.rows.length === 0) {
      return NextResponse.json({ error: 'Theme not found' }, { status: 404 });
    }
    const theme = themeResult.rows[0];
    const price = theme.price !== null ? parseFloat(theme.price) : null;

    // --- FREE Theme (bypass Stripe) ---
    if (price === 0) {
      let code = '';
      let isUnique = false;
      while (!isUnique) {
        code = generateRandomCode();
        const checkResult = await query('SELECT id FROM theme_codes WHERE code = $1', [code]);
        if (checkResult.rows.length === 0) isUnique = true;
      }

      const themeIdsJson = JSON.stringify([theme_id]);
      const mockOrderId = `FREE-${Date.now()}`;
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

    // --- PAID Theme: Determine Currency ---
    let isMY = true;
    if (currency) {
      const cUpper = String(currency).toUpperCase();
      isMY = cUpper === 'MYR' || cUpper === 'RM';
    } else {
      // Fallback: detect from Cloudflare CDN header
      const country = request.headers.get('cf-ipcountry') || 'MY';
      isMY = country === 'MY';
    }

    const isPremium = theme.price_tier === 'premium';

    // --- Select Live or Test Price ID ---
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

    if (!priceId) {
      console.error('❌ Checkout: Missing Stripe Price ID in environment variables.');
      return NextResponse.json({
        error: 'Payment system is not configured. Please contact support.',
        needs_config: true
      }, { status: 500 });
    }

    // --- Build Base URL ---
    // Use NEXT_PUBLIC_BASE_URL in production for reliability
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host');
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;

    // --- Create Stripe Checkout Session ---
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
      // Metadata is passed through to the webhook
      metadata: {
        theme_id: String(theme_id),
        theme_name: theme.name || '',
      },
      // Optional: pre-fill customer email if available
      // customer_email: userEmail,
    });

    return NextResponse.json({
      success: true,
      url: session.url
    });

  } catch (error) {
    console.error('❌ Checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
