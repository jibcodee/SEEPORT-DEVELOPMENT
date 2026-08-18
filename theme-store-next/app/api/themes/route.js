import { NextResponse } from 'next/server';
import { query } from '../../../lib/supabase';
import { validateThemeSchema } from '../../../lib/theme-renderer';

export async function GET() {
  try {
    const result = await query('SELECT * FROM themes ORDER BY price_tier DESC, name ASC');
    return NextResponse.json({ themes: result.rows });
  } catch (err) {
    console.error('Failed to load themes:', err);
    return NextResponse.json({ error: 'Failed to load themes' }, { status: 500 });
  }
}

export async function POST(request) {

  try {
    const body = await request.json();
    const { name, theme_data, price_tier, category, price } = body;

    if (!name || !theme_data || !price_tier || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const priceVal = price ? parseFloat(price) : (price_tier === 'premium' ? 5.0 : 3.0);
    const parsedThemeData = typeof theme_data === 'string' ? JSON.parse(theme_data) : theme_data;

    // Strict JSON Schema Validation
    const validationResult = validateThemeSchema({
      name,
      tier: price_tier,
      price: priceVal,
      colors: parsedThemeData.colors || parsedThemeData.theme_data || parsedThemeData,
      animation: parsedThemeData.animation || { type: 'none' }
    });

    if (!validationResult.valid) {
      return NextResponse.json({ 
        error: 'Theme JSON Schema validation failed.', 
        details: validationResult.errors 
      }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO themes (name, theme_data, price_tier, category, price) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [name, JSON.stringify(parsedThemeData), price_tier, category, priceVal]
    );

    return NextResponse.json({ success: true, theme: result.rows[0] });
  } catch (err) {
    console.error('Failed to create theme:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request) {

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Theme ID is required' }, { status: 400 });
    }

    await query('DELETE FROM themes WHERE id = $1', [id]);
    return NextResponse.json({ success: true, message: 'Theme deleted successfully' });
  } catch (err) {
    console.error('Failed to delete theme:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
