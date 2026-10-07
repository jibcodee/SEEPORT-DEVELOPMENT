import { NextResponse } from 'next/server';
import { Client } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.qodrnrewzwrcejelcbwl:akiosukaawak232@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres';

export async function GET() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const res = await client.query(
      `SELECT id, theme_id, theme_name, customer_name, rating, comment, created_at FROM theme_reviews ORDER BY created_at DESC LIMIT 20`
    );
    return NextResponse.json({ success: true, reviews: res.rows });
  } catch (err) {
    console.error('API Error in GET /api/reviews:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  } finally {
    await client.end();
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { theme_id, theme_name, rating, comment, user_id, user_email } = body;

    if (!comment || !theme_name) {
      return NextResponse.json({ success: false, error: 'Missing required review fields' }, { status: 400 });
    }

    // Mask customer name (e.g. akiosuka -> ak***)
    let rawName = user_email ? user_email.split('@')[0] : 'anonymous';
    let customer_name = rawName.length >= 2 ? `${rawName.substring(0, 2)}***` : `${rawName}***`;

    const client = new Client({ connectionString });
    await client.connect();

    await client.query(
      `INSERT INTO theme_reviews (theme_id, theme_name, user_id, user_email, customer_name, rating, comment)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [theme_id || null, theme_name, user_id || null, user_email || null, customer_name, rating || 5, comment]
    );

    await client.end();
    return NextResponse.json({ success: true, message: 'Review submitted successfully!' });
  } catch (err) {
    console.error('API Error in POST /api/reviews:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
