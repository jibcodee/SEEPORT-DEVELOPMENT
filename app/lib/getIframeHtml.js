'use client';

export function getIframeHtml(themeObj) {
  if (!themeObj) return '';
  const themeData = themeObj.theme_data || themeObj;
  const colors = themeData.colors || themeData;
  
  const bgVal = colors['--bg-color'] || colors['--bg'] || '#0F172A';
  const surfaceVal = colors['--card-bg'] || colors['--surface'] || '#1E293B';
  const textVal = colors['--text-color'] || colors['--text-primary'] || '#F8FAFC';
  const accentVal = colors['--accent-color'] || colors['--primary'] || '#6366F1';
  
  // Detect theme darkness to set muted text and border alphas appropriately
  const isDark = bgVal.toLowerCase() === '#0f172a' || 
                 bgVal.toLowerCase() === '#0b0813' || 
                 bgVal.toLowerCase() === '#0b090f' || 
                 bgVal.toLowerCase() === '#030704' || 
                 bgVal.toLowerCase() === '#161224' || 
                 bgVal.toLowerCase() === '#16131f' || 
                 bgVal.toLowerCase() === '#0b130e';

  const textMutedVal = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(15, 23, 42, 0.6)';
  const textSubtleVal = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(15, 23, 42, 0.4)';
  const borderVal = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';
  const borderHoverVal = accentVal;
  const primaryLightVal = `${accentVal}15`;
  const primarySubtleVal = `${accentVal}25`;
  const primaryRingVal = `${accentVal}33`;
  const surfaceHoverVal = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
  const surfaceActiveVal = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

  // Extract custom animation variables
  let animVars = '';
  if (colors) {
    Object.keys(colors).forEach(key => {
      if (key.startsWith('--animation-')) {
        animVars += `${key}: ${colors[key]};\n`;
      }
    });
  }

  const cssVars = `
    --bg: ${bgVal};
    --surface: ${surfaceVal};
    --surface-hover: ${surfaceHoverVal};
    --surface-active: ${surfaceActiveVal};
    --text-primary: ${textVal};
    --text-secondary: ${textVal};
    --text-muted: ${textMutedVal};
    --text-subtle: ${textSubtleVal};
    --border: ${borderVal};
    --border-hover: ${borderHoverVal};
    --primary: ${accentVal};
    --primary-hover: ${accentVal};
    --primary-light: ${primaryLightVal};
    --primary-subtle: ${primarySubtleVal};
    --primary-ring: ${primaryRingVal};
    --header-bg: ${surfaceVal};
    --footer-bg: ${surfaceVal};
    ${animVars}
  `;

  const str = `${themeObj.name || ''} ${themeObj.id || ''}`.toLowerCase();
  let helperClass = '';
  if (str.includes('pink') || str.includes('love')) helperClass = 'theme_pink_love';
  else if (str.includes('madness') || str.includes('eyes')) helperClass = 'theme_madness_eyes';
  else if (str.includes('matrix') || str.includes('digital')) helperClass = 'theme_matrix_digital';
  else if (str.includes('cyberpunk') || str.includes('neon')) helperClass = 'theme_cyberpunk_neon';
  else if (str.includes('pastel') || str.includes('lavender')) helperClass = 'theme_pastel_lavender';

  const animName = colors['--animation-name'] || themeData.animation?.type || '';
  const animationClass = animName && animName !== 'none' ? `has-animation-${animName}` : '';
  const bodyClasses = `theme-active-${themeObj.id || ''} ${helperClass ? `theme-active-${helperClass}` : ''} ${animationClass}`.trim();

  return `
<!DOCTYPE html>
<html lang="ms">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SEEPORT</title>
  <!-- Google Fonts Inter & JetBrains Mono -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/sidepanel.css" />
  <style>
    :root { ${cssVars} }
    .tray-header, .tray-footer {
      background: var(--bg) !important;
      border-color: var(--border) !important;
    }
    
    /* Generic Dynamic Animation overlay */
    .tray-bg-animation, .tray::before {
      content: "" !important;
      position: absolute !important;
      top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important;
      pointer-events: none !important;
      z-index: 1 !important;
      animation-duration: var(--animation-duration, 15s) !important;
      animation-timing-function: var(--animation-timing, linear) !important;
      animation-iteration-count: infinite !important;
    }

    body.has-animation-moveBg .tray-bg-animation,
    body.has-animation-moveBg .tray::before {
      animation-name: moveBg !important;
    }

    body.has-animation-floatPattern .tray-bg-animation,
    body.has-animation-floatPattern .tray::before {
      animation-name: floatPattern !important;
    }

    @keyframes moveBg {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    @keyframes floatPattern {
      0% { background-position: 0 0; }
      100% { background-position: 80px 80px; }
    }

    body.theme-active-theme_pink_love .tray::before {
      opacity: 0.38 !important;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%23FF1493' d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'/%3E%3C/svg%3E") !important;
      background-size: 40px 40px !important;
      animation: floatHearts 15s linear infinite !important;
    }
    body.theme-active-theme_madness_eyes .tray::before {
      opacity: 0.65 !important;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cpath fill='%23EC4899' d='M24 12C14 12 8 24 8 24s6 12 16 12 16-12 16-12-6-12-16-12zm0 18c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6zm0-10c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4z'/%3E%3C/svg%3E") !important;
      background-size: 80px 80px !important;
      animation: blinkPattern 5s infinite, floatEyes 25s linear infinite !important;
    }
    body.theme-active-theme_matrix_digital .tray::before {
      opacity: 0.75 !important;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='300' viewBox='0 0 80 300'%3E%3Ctext x='10' y='20' fill='%2339FF14' font-family='monospace' font-size='12' opacity='0.8'%3E1%3C/text%3E%3Ctext x='10' y='50' fill='%2339FF14' font-family='monospace' font-size='12' opacity='0.3'%3E0%3C/text%3E%3Ctext x='10' y='80' fill='%2339FF14' font-family='monospace' font-size='12' opacity='0.9'%3E%E7%94%B0%3C/text%3E%3Ctext x='10' y='110' fill='%2339FF14' font-family='monospace' font-size='12' opacity='0.5'%3EA%3C/text%3E%3Ctext x='10' y='150' fill='%2339FF14' font-family='monospace' font-size='12' opacity='0.7'%3E%EF%BD%B7%3C/text%3E%3Ctext x='40' y='30' fill='%2339FF14' font-family='monospace' font-size='12' opacity='0.4'%3E0%3C/text%3E%3Ctext x='40' y='70' fill='%2339FF14' font-family='monospace' font-size='12' opacity='0.8'%3E1%3C/text%3E%3Ctext x='40' y='120' fill='%2339FF14' font-family='monospace' font-size='12' opacity='0.2'%3E%EF%BE%84%3C/text%3E%3Ctext x='40' y='180' fill='%2339FF14' font-family='monospace' font-size='12' opacity='0.9'%3E8%3C/text%3E%3C/svg%3E") !important;
      background-size: 80px 300px !important;
      animation: matrixRain 10s linear infinite !important;
    }

    /* Fix button hover states to strictly follow active theme accent color (NO generic blue!) */
    .btn-primary, .btn-primary:hover, .btn-primary:focus, .btn-copy-refs:hover, #btnCopyRefs:hover {
      background: var(--primary) !important;
      border-color: var(--primary) !important;
      color: #ffffff !important;
      box-shadow: none !important;
      filter: brightness(1.1) !important;
    }
    .btn-secondary:hover {
      background: var(--surface-hover) !important;
      border-color: var(--primary) !important;
      color: var(--primary) !important;
    }
    button:hover, .theme-toggle-btn:hover, .item-copy-btn:hover {
      border-color: var(--primary) !important;
      color: var(--primary) !important;
    }
    .tray-header {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      padding: 10px 14px !important;
      min-height: 56px !important;
    }
    .brand {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }
    .brand-logo {
      height: 36px !important;
      width: auto !important;
      object-fit: contain !important;
      display: block !important;
      margin: 0 !important;
    }
    .header-actions {
      display: flex !important;
      align-items: center !important;
      gap: 6px !important;
    }
    .theme-toggle-btn, .btn-sm, .count {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      vertical-align: middle !important;
      margin: 0 !important;
    }

    /* Hide ONLY the middle text content by default so wallpaper is displayed */
    .tray-content {
      opacity: 0 !important;
      pointer-events: none !important;
      transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }
    
    /* When active, fade it in smoothly */
    body.show-content .tray-content {
      opacity: 1 !important;
      pointer-events: auto !important;
    }

    .brand-logo {
      cursor: pointer !important;
      transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
      position: relative !important;
      z-index: 10 !important;
    }
    .brand-logo:hover {
      transform: scale(1.18) rotate(-6deg) !important;
    }
    .brand-logo:active {
      transform: scale(0.9) !important;
    }

    /* Glowing Pulse Ring around Snail Logo */
    .brand {
      position: relative !important;
      display: flex !important;
      align-items: center !important;
    }

    .snail-pulse-ring {
      position: absolute !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%);
      width: 44px !important;
      height: 44px !important;
      border-radius: 50% !important;
      pointer-events: none !important;
      z-index: 20 !important; /* Floats ON TOP of the brand-logo */
      border: 3px solid var(--primary) !important;
      filter: blur(1.5px) !important;
      animation: snailPulse 1.5s infinite cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
    }

    @keyframes snailPulse {
      0% {
        transform: translate(-50%, -50%) scale(0.85);
        opacity: 0.4;
      }
      100% {
        transform: translate(-50%, -50%) scale(1.6);
        opacity: 0;
      }
    }

    /* Floating Hint Tooltip Box on the Right */
    .snail-hint-popup {
      position: absolute !important;
      left: 50px !important;
      top: 50% !important;
      transform: translateY(-50%);
      background: var(--primary) !important;
      color: #ffffff !important;
      padding: 5px 10px !important;
      font-size: 10px !important;
      font-weight: 800 !important;
      border-radius: 6px !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
      white-space: nowrap !important;
      z-index: 100 !important;
      animation: bounceHorizontal 1.2s infinite ease-in-out !important; /* Continuous bounce */
      pointer-events: none !important;
      display: flex !important;
      align-items: center !important;
      gap: 4px !important;
      text-transform: uppercase !important;
      letter-spacing: 0.5px !important;
      transition: all 0.3s ease !important;
      opacity: 1 !important; /* Solid 100% opacity! */
    }

    .snail-hint-popup::before {
      content: "" !important;
      position: absolute !important;
      right: 100% !important; /* Align to the left edge of the tooltip */
      top: 50% !important;
      transform: translateY(-50%);
      border-width: 5px !important;
      border-style: solid !important;
      border-color: transparent var(--primary) transparent transparent !important; /* Arrow points left towards the logo */
    }

    @keyframes bounceHorizontal {
      0%, 100% {
        transform: translateY(-50%) translateX(0);
      }
      50% {
        transform: translateY(-50%) translateX(-6px); /* Bounces leftwards towards the logo */
      }
    }

    /* Hide glows and tooltips when content is visible */
    body.show-content .snail-hint-popup,
    body.show-content .snail-pulse-ring {
      opacity: 0 !important;
      pointer-events: none !important;
      transform: scale(0.8) !important;
    }
  </style>
</head>
<body class="\${bodyClasses}">
  <div class="tray">
    <div class="tray-bg-animation" style="background: \${themeData['--animation-url'] || 'none'} !important; opacity: \${themeData['--animation-opacity'] || '0'} !important; background-size: \${themeData['--animation-size'] || 'cover'} !important; background-position: \${themeData['--animation-position'] || 'center'} !important;"></div>
    <header class="tray-header">
      <div class="brand">
        <div class="logo-wrapper" style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
          <img src="/SEEPORT_LOGO_A.svg" class="brand-logo" alt="SEEPORT Logo" />
          <div class="snail-pulse-ring"></div>
        </div>
        <div class="snail-hint-popup">
          <span>CLICK HERE</span>
        </div>
      </div>
      <div class="header-actions">
        <button id="btnSettings" class="theme-toggle-btn" title="Tetapan Tema (Settings)">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
        <button id="btnScrape" class="btn btn-secondary btn-sm" title="Scrape table from HTML">
          <svg class="btn-svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 3h18v18H3z"/>
            <path d="M3 9h18"/>
            <path d="M3 15h18"/>
            <path d="M9 3v18"/>
          </svg>
          <span>Table</span>
        </button>
        <button id="btnScreenshot" class="btn btn-secondary btn-sm" title="Crop screenshot">
          <svg class="btn-svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2v14a2 2 0 0 0 2 2h14"/>
            <path d="M18 22V8a2 2 0 0 0-2-2H2"/>
          </svg>
          <span>Capture</span>
        </button>
        <div class="count" id="count">1 / 1</div>
      </div>
    </header>

    <div class="tabs-container">
      <nav class="tray-tabs" id="trayTabs">
        <button class="tray-tab active" data-filter="all">
          <svg class="tab-svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          <span>All</span>
        </button>
        <button class="tray-tab" data-filter="text">
          <svg class="tab-svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          <span>Text</span>
        </button>
        <button class="tray-tab" data-filter="image">
          <svg class="tab-svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          <span>Image</span>
        </button>
        <button class="tray-tab" data-filter="table">
          <svg class="tab-svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18v18H3z"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/></svg>
          <span>Table</span>
        </button>
      </nav>
    </div>

    <main class="tray-content">
      <ul class="items" id="itemsList">
        <!-- EXACT ITEM CARD 1 (TEXT) -->
        <li class="item-card">
          <span class="item-tab text"></span>
          <div class="item-body">
            <div class="item-top">
              <div class="item-actions">
                <span class="item-tag">[TEXT]</span>
                <input class="item-rename" type="text" value="'Saya 76 tahun...'" readonly />
              </div>
              <div class="item-actions">
                <div class="color-picker">
                  <div class="color-dot none" title="Default"></div>
                  <div class="color-dot yellow" title="Yellow highlight"></div>
                  <div class="color-dot green" title="Green highlight"></div>
                  <div class="color-dot pink" title="Pink highlight"></div>
                </div>
                <button class="item-copy-btn" aria-label="Copy Citation">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                </button>
                <button class="item-copy-btn" title="Edit text">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </button>
                <button class="item-copy-btn" title="Copy text">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                </button>
                <button class="item-remove" title="Remove item">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
            <div class="item-content-wrapper">
              <div class="item-content-text">Mustapa berkata, usianya yang sudah mencecah 76 tahun itu tidak sesuai untuk bertanding dan peluang itu perlu diberikan kepada orang muda.</div>
              <div class="item-source">from 'Saya 76 tahun, jalan pun sudah goyang', Tok Pa tak m...</div>
              <div class="item-citation-preview">'Saya 76 tahun, jalan pun sudah goyang', Tok Pa tak minat tanding PRU16. (n.d.). Retrieved August 6, 2026, from https://www.bharian.com.my/berita/nasional/2026/08/1598081/saya-76-tahun-jalan-pun-sudah-goyang-tok-pa-tak-minat-tanding-pru16</div>
            </div>
          </div>
        </li>
      </ul>
    </main>

    <footer class="tray-footer">
      <div class="export-row" style="margin-bottom: 2px;">
        <button id="btnExportMd" class="btn btn-secondary" style="flex: 1; font-size: 11.5px; padding: 8px 10px;">
          <svg class="btn-svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; vertical-align: middle;">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" fill="none"/>
            <path d="M7 15V9l3 3 3-3v6M17 13.5L15 15.5l-2-2M15 8.5v7"/>
          </svg>
          Export Markdown
        </button>
        <button id="btnExportDoc" class="btn btn-secondary" style="flex: 1; font-size: 11.5px; padding: 8px 10px;">
          <svg class="btn-svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; vertical-align: middle;">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <path d="M8 12l1.5 5 1.5-5 1.5 5 1.5-5"/>
          </svg>
          Export Word
        </button>
      </div>
      <div class="export-row citation-row">
        <select id="citationStyle" class="citation-select" aria-label="Citation Style">
          <option value="apa">APA</option>
          <option value="mla">MLA</option>
          <option value="chicago">Chicago</option>
          <option value="ieee">IEEE</option>
          <option value="harvard">Harvard</option>
        </select>
        <button id="copyCitation" class="btn btn-primary citation-btn">
          <svg class="btn-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          Copy References
        </button>
      </div>
      <button id="clearAll" class="btn btn-ghost btn-danger-ghost">
        <svg class="btn-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
        Clear Seeport
      </button>
    </footer>
  </div>
  <script>
    document.querySelector('.brand-logo').addEventListener('click', () => {
      document.body.classList.toggle('show-content');
    });
  </script>
</body>
</html>
  `;
}

export default getIframeHtml;
