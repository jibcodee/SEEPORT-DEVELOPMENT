import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { query } from '../../../lib/supabase';

// Force Node.js runtime — required for Stripe raw body webhook verification
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Disable Next.js body parsing — Stripe MUST receive raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

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
  // Read raw body as text — MUST come before any json() parsing for webhook sig verification
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('❌ Webhook: Missing stripe-signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('❌ Webhook: STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event;

  try {
    // Cryptographically verify that this request truly came from Stripe
    // This prevents anyone from forging a fake payment webhook to get free codes
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  console.log(`✅ Webhook event received: ${event.type}`);

  // Only handle checkout.session.completed events
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Only generate code when payment is confirmed paid
    if (session.payment_status === 'paid') {
      const theme_id = session.metadata?.theme_id;
      const sessionId = session.id;

      if (!theme_id) {
        console.error('❌ Webhook: theme_id missing in metadata for session:', sessionId);
        // Return 200 so Stripe doesn't retry this
        return NextResponse.json({ received: true, warning: 'Missing theme_id in metadata' });
      }

      try {
        // Idempotency check: prevent duplicate code generation for same payment
        const existingResult = await query(
          'SELECT code FROM theme_codes WHERE order_id = $1',
          [sessionId]
        );

        if (existingResult.rows.length > 0) {
          console.log(`ℹ️ Webhook: Code already exists for session ${sessionId}: ${existingResult.rows[0].code}`);
          return NextResponse.json({ received: true, duplicate: true });
        }

        // Generate cryptographically unique theme code
        let code = '';
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 10) {
          code = generateRandomCode();
          const checkResult = await query('SELECT id FROM theme_codes WHERE code = $1', [code]);
          if (checkResult.rows.length === 0) {
            isUnique = true;
          }
          attempts++;
        }

        if (!isUnique) {
          throw new Error('Failed to generate unique code after 10 attempts');
        }

        // Persist the theme code — this is the single source of truth
        const themeIdsJson = JSON.stringify([theme_id]);
        await query(
          `INSERT INTO theme_codes (code, theme_ids, status, order_id) VALUES ($1, $2, 'unused', $3)`,
          [code, themeIdsJson, sessionId]
        );

        console.log(`🎉 Webhook: Code "${code}" generated for session ${sessionId}, theme ${theme_id}`);

      } catch (dbError) {
        console.error('❌ Webhook: Database error:', dbError.message);
        // Return 500 so Stripe will retry (Stripe retries for up to 3 days)
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }
    } else {
      console.log(`ℹ️ Webhook: Session ${session.id} payment_status="${session.payment_status}", skipping.`);
    }
  }

  // Acknowledge all other events
  return NextResponse.json({ received: true });
}
