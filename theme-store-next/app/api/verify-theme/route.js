import { NextResponse } from 'next/server';
import { query } from '../../../lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      );
    }

    // 1. Query the code details
    const codeResult = await query(
      'SELECT status, theme_ids FROM theme_codes WHERE code = $1',
      [code]
    );

    if (codeResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid theme code' },
        { status: 400 }
      );
    }

    const { status, theme_ids } = codeResult.rows[0];

    // 2. Check if already used
    if (status === 'used') {
      return NextResponse.json(
        { error: 'This theme code has already been used' },
        { status: 400 }
      );
    }

    // 3. Retrieve all associated themes from database
    // theme_ids is a JSONB array, we convert it to UUID array for ANY query
    const themeIdsArray = typeof theme_ids === 'string' ? JSON.parse(theme_ids) : theme_ids;
    
    if (!Array.isArray(themeIdsArray) || themeIdsArray.length === 0) {
      return NextResponse.json(
        { error: 'No themes associated with this code' },
        { status: 400 }
      );
    }

    const themesResult = await query(
      'SELECT id, name, theme_data, price_tier FROM themes WHERE id = ANY($1::uuid[])',
      [themeIdsArray]
    );

    // Check if user already owns all these themes (by name)
    const { owned_theme_names = [] } = body;
    const allThemesOwned = themesResult.rows.every(theme => 
      owned_theme_names.includes(theme.name)
    );

    if (allThemesOwned && themesResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'You already own all themes in this code!' },
        { status: 400 }
      );
    }

    // Filter out already owned themes to return only new ones (optional, but returning all is fine since extension handles it)
    // Actually, just returning the list is fine, extension will deduplicate by name.

    // 4. Mark code as used
    await query(
      "UPDATE theme_codes SET status = 'used' WHERE code = $1",
      [code]
    );

    // 5. Return the list of themes
    return NextResponse.json({
      themes: themesResult.rows
    });
  } catch (err) {
    console.error('Error in verify-theme API:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
