import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { query } from '../../../lib/supabase';

// MUST be nodejs runtime to access raw body for Stripe signature verification
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    console.error('Missing Stripe environment variables');
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

  // Read raw body as text for signature verification
  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ received: true, skipped: 'not paid' });
    }

    const theme_id = session.metadata?.theme_id;
    const sessionId = session.id;

    if (!theme_id) {
      console.error('No theme_id in session metadata');
      return NextResponse.json({ error: 'No theme_id in metadata' }, { status: 400 });
    }

    try {
      // Check if code already exists for this session (idempotency)
      const existing = await query(
        'SELECT code FROM theme_codes WHERE order_id = $1',
        [sessionId]
      );

      if (existing.rows.length > 0) {
        console.log('Code already generated for session:', sessionId);
        return NextResponse.json({ received: true, code: existing.rows[0].code });
      }

      // Generate unique claim code
      let code = '';
      let isUnique = false;
      while (!isUnique) {
        code = generateRandomCode();
        const check = await query('SELECT id FROM theme_codes WHERE code = $1', [code]);
        if (check.rows.length === 0) isUnique = true;
      }

      // Save to database
      const themeIdsJson = JSON.stringify([theme_id]);
      await query(
        `INSERT INTO theme_codes (code, theme_ids, status, order_id) VALUES ($1, $2, 'unused', $3)`,
        [code, themeIdsJson, sessionId]
      );

      console.log(`Generated code ${code} for theme ${theme_id}, session ${sessionId}`);
      return NextResponse.json({ received: true, code });

    } catch (dbErr) {
      console.error('Database error in webhook:', dbErr);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
  }

  // Acknowledge other event types
  return NextResponse.json({ received: true });
}
