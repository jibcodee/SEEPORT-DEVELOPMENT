const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'themes.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Helper to read themes
function readThemes() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Error reading themes file:', err);
    return [];
  }
}

// Helper to write themes
function writeThemes(themes) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(themes, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing themes file:', err);
    return false;
  }
}

// API Routes
app.get('/api/themes', (req, res) => {
  const themes = readThemes();
  res.json(themes);
});

app.post('/api/themes', (req, res) => {
  const { name, bgColor, textColor, cardBg, accentColor } = req.body;
  
  if (!name || !bgColor || !textColor || !cardBg || !accentColor) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  const id = 'theme_' + Date.now();
  const themeObject = {
    id: id,
    name: name,
    colors: {
      '--bg-color': bgColor,
      '--text-color': textColor,
      '--card-bg': cardBg,
      '--accent-color': accentColor
    }
  };
  
  // Encode base64
  const jsonStr = JSON.stringify(themeObject);
  const base64Code = 'TRAY-' + Buffer.from(jsonStr).toString('base64');
  
  // Store code as part of response & record
  const savedTheme = {
    ...themeObject,
    code: base64Code
  };
  
  const themes = readThemes();
  themes.push(savedTheme);
  writeThemes(themes);
  
  res.status(201).json(savedTheme);
});

// Serve frontend views
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/success', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'success.html'));
});

app.listen(PORT, () => {
  console.log(`Seeport Theme Store listening on http://localhost:${PORT}`);
});
