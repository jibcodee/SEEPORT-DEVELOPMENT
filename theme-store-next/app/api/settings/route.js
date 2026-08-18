import { NextResponse } from 'next/server';
import { query } from '../../../lib/supabase';


export async function GET() {
  try {
    const result = await query("SELECT * FROM store_settings WHERE id = 'shop_settings'");
    if (result.rows.length === 0) {
      return NextResponse.json({ banner_url: '', custom_text: 'get your code here to change s your theme !' });
    }
    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error('Failed to get settings:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {

  try {
    const body = await request.json();
    const { banner_url, custom_text } = body;

    const result = await query(
      `INSERT INTO store_settings (id, banner_url, custom_text, updated_at)
       VALUES ('shop_settings', $1, $2, timezone('utc'::text, now()))
       ON CONFLICT (id) DO UPDATE 
       SET banner_url = EXCLUDED.banner_url, 
           custom_text = EXCLUDED.custom_text, 
           updated_at = EXCLUDED.updated_at
       RETURNING *`,
      [banner_url || '', custom_text || '']
    );

    return NextResponse.json({ success: true, settings: result.rows[0] });
  } catch (err) {
    console.error('Failed to save settings:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
