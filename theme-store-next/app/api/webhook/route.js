import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { query } from '../../../lib/supabase';

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

// Stripe webhook memerlukan raw body untuk signature verification
// Next.js App Router secara default baca body sebagai text bila kita guna request.text()
export async function POST(request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('❌ Webhook: Missing stripe-signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event;

  try {
    // Verify signature — pastikan request betul-betul dari Stripe, bukan forged request
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

  // Handle event jenis checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Pastikan payment memang berjaya (bukan sekadar sesi terbuka)
    if (session.payment_status === 'paid') {
      const theme_id = session.metadata?.theme_id;
      const sessionId = session.id;

      if (!theme_id) {
        console.error('❌ Webhook: theme_id missing in session metadata for session:', sessionId);
        // Return 200 supaya Stripe tak cuba hantar semula
        return NextResponse.json({ received: true, warning: 'Missing theme_id in metadata' });
      }

      try {
        // Semak jika kod sudah dijanakan sebelum ini (elak duplikasi)
        const existingResult = await query(
          'SELECT code FROM theme_codes WHERE order_id = $1',
          [sessionId]
        );

        if (existingResult.rows.length > 0) {
          console.log(`ℹ️ Webhook: Code already exists for session ${sessionId}: ${existingResult.rows[0].code}`);
          return NextResponse.json({ received: true, duplicate: true });
        }

        // Jana kod unik
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

        // Simpan kod ke database
        const themeIdsJson = JSON.stringify([theme_id]);
        await query(
          `INSERT INTO theme_codes (code, theme_ids, status, order_id) VALUES ($1, $2, 'unused', $3)`,
          [code, themeIdsJson, sessionId]
        );

        console.log(`🎉 Webhook: Code "${code}" successfully generated for session ${sessionId}, theme ${theme_id}`);

      } catch (dbError) {
        console.error('❌ Webhook: Database error:', dbError.message);
        // Return 500 supaya Stripe akan cuba hantar semula (Stripe ada retry policy)
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }
    } else {
      console.log(`ℹ️ Webhook: Session ${session.id} payment_status is "${session.payment_status}", skipping code generation.`);
    }
  }

  // Untuk event lain, acknowledge sahaja
  return NextResponse.json({ received: true });
}
