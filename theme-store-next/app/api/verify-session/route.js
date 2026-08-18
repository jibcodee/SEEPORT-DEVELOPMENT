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
    const { session_id } = body;

    if (!session_id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    if (session_id.startsWith('MOCK_')) {
      return NextResponse.json({ error: 'Cannot verify mock session.' }, { status: 400 });
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not successful' }, { status: 400 });
    }

    const theme_id = session.metadata.theme_id;

    // Check if we already generated a code for this session
    const existingResult = await query(
      'SELECT code, theme_ids FROM theme_codes WHERE order_id = $1',
      [session_id]
    );

    if (existingResult.rows.length > 0) {
      let tid = theme_id;
      if (!tid && existingResult.rows[0].theme_ids) {
        try {
          const parsed = JSON.parse(existingResult.rows[0].theme_ids);
          if (Array.isArray(parsed) && parsed.length > 0) tid = parsed[0];
        } catch (e) {}
      }
      return NextResponse.json({
        success: true,
        code: existingResult.rows[0].code,
        theme_id: tid
      });
    }

    // Generate unique code
    let code = '';
    let isUnique = false;
    while (!isUnique) {
      code = generateRandomCode();
      const checkResult = await query('SELECT id FROM theme_codes WHERE code = $1', [code]);
      if (checkResult.rows.length === 0) {
        isUnique = true;
      }
    }

    // Save to database
    const themeIdsJson = JSON.stringify([theme_id]);
    await query(
      `INSERT INTO theme_codes (code, theme_ids, status, order_id) VALUES ($1, $2, 'unused', $3)`,
      [code, themeIdsJson, session_id]
    );

    return NextResponse.json({
      success: true,
      code: code,
      theme_id: theme_id
    });

  } catch (error) {
    console.error('Error verifying session:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
