import { query } from '../lib/supabase';
import ClientStorefront from './ClientStorefront';

export const revalidate = 0; // Disable caching to ensure fresh DB themes are displayed

export default async function Page() {
  let themes = [];
  try {
    const result = await query('SELECT * FROM themes ORDER BY price_tier DESC, name ASC');
    themes = result.rows;
  } catch (err) {
    console.error('Failed to load themes from DB:', err);
  }

  return (
    <>
      <ClientStorefront initialThemes={themes} />
    </>
  );
}
