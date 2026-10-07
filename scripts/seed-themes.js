require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const { validateThemeSchema } = require('../lib/theme-renderer');

const connectionString = process.env.DATABASE_URL;

async function main() {
  const themesDir = path.join(__dirname, '..', 'public', 'themes');
  if (!fs.existsSync(themesDir)) {
    console.error('Themes directory does not exist:', themesDir);
    process.exit(1);
  }

  const files = fs.readdirSync(themesDir).filter(f => f.endsWith('.json'));
  console.log(`Found ${files.length} themes to seed.`);

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase Postgres.');

    for (const file of files) {
      const filePath = path.join(themesDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      let theme;
      try {
        theme = JSON.parse(content);
      } catch (e) {
        console.error(`❌ Failed to parse JSON file "${file}":`, e.message);
        continue;
      }

      // Validate
      const validation = validateThemeSchema(theme);
      if (!validation.valid) {
        console.error(`❌ Theme "${file}" failed schema validation:`, validation.errors);
        continue;
      }

      console.log(`✅ Theme "${theme.name}" validated successfully.`);

      // Convert colors and animations into theme_data JSONB structure with legacy fallbacks
      const anim = theme.animation || {};
      const themeData = {
        ...theme.colors,
        '--animation-name': anim.type || theme.colors['--animation-name'] || 'none',
        '--animation-duration': anim.speed ? `${anim.speed}ms` : (theme.colors['--animation-duration'] || '15000ms'),
        '--animation-url': anim.assetUrl || theme.colors['--animation-url'] || 'none',
        '--animation-opacity': anim.opacity !== undefined ? String(anim.opacity) : (theme.colors['--animation-opacity'] || '0')
      };

      // Check if theme with same name exists
      const existRes = await client.query('SELECT id FROM themes WHERE name = $1', [theme.name]);
      let dbRow;
      const tierVal = theme.tier || theme.price_tier || 'standard';

      if (existRes.rows.length > 0) {
        // Update
        const updateRes = await client.query(
          `UPDATE themes 
           SET theme_data = $1, price_tier = $2, category = $3, price = $4 
           WHERE name = $5 
           RETURNING *`,
          [JSON.stringify(themeData), tierVal, theme.category || 'Dark Themes', parseFloat(theme.price), theme.name]
        );
        dbRow = updateRes.rows[0];
        console.log(`🚀 Updated theme: "${dbRow.name}"`);
      } else {
        // Insert
        const insertRes = await client.query(
          `INSERT INTO themes (name, theme_data, price_tier, category, price) 
           VALUES ($1, $2, $3, $4, $5) 
           RETURNING *`,
          [theme.name, JSON.stringify(themeData), tierVal, theme.category || 'Dark Themes', parseFloat(theme.price)]
        );
        dbRow = insertRes.rows[0];
        console.log(`🚀 Inserted new theme: "${dbRow.name}"`);
      }
    }

    console.log('Seeding script completed successfully.');

  } catch (err) {
    console.error('Error during seeding:', err);
  } finally {
    await client.end();
  }
}

main();
