'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './lib/supabaseClient';

const getIframeHtml = (themeObj) => {
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
<body class="${bodyClasses}">
  <div class="tray">
    <div class="tray-bg-animation" style="background: ${themeData['--animation-url'] || 'none'} !important; opacity: ${themeData['--animation-opacity'] || '0'} !important; background-size: ${themeData['--animation-size'] || 'cover'} !important; background-position: ${themeData['--animation-position'] || 'center'} !important;"></div>
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
};

export default function ClientStorefront({ initialThemes = [] }) {
  const router = useRouter();

  // Pricing & Geo State
  const [isMy, setIsMy] = useState(true); 
  const [currency, setCurrency] = useState('RM');
  const [rate, setRate] = useState(1);

  const [activePreviewTheme, setActivePreviewTheme] = useState(initialThemes.length > 0 ? initialThemes[0] : null);
  const [activeCategory, setActiveCategory] = useState('All Categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [storeSettings, setStoreSettings] = useState({ banner_url: '', custom_text: 'get your code here to change s your theme !' });
  const [coffeeDonation, setCoffeeDonation] = useState(5);

  // Customer Reviews Ticker State
  const [reviews, setReviews] = useState([]);
  const [reviewIdx, setReviewIdx] = useState(0);

  const [isNavVisible, setIsNavVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY <= 15) {
        setIsNavVisible(true);
      } else {
        setIsNavVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    fetch('/api/reviews')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.reviews && data.reviews.length > 0) {
          setReviews(data.reviews);
        }
      })
      .catch(err => console.error('Failed to fetch reviews:', err));
  }, []);

  // Filter reviews specifically for active preview theme
  const filteredReviews = useMemo(() => {
    if (!activePreviewTheme) return reviews;
    const themeMatched = reviews.filter(r => 
      r.theme_id === activePreviewTheme.id || 
      (r.theme_name && r.theme_name.toLowerCase() === activePreviewTheme.name.toLowerCase())
    );
    return themeMatched.length > 0 ? themeMatched : reviews;
  }, [reviews, activePreviewTheme]);

  useEffect(() => {
    setReviewIdx(0);
  }, [activePreviewTheme]);

  useEffect(() => {
    if (filteredReviews.length <= 1) return;
    const interval = setInterval(() => {
      setReviewIdx(prev => (prev + 1) % filteredReviews.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [filteredReviews]);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && (data.banner_url !== undefined || data.custom_text !== undefined)) {
          setStoreSettings({
            banner_url: data.banner_url || '',
            custom_text: data.custom_text || 'get your code here to change s your theme !'
          });
        }
      })
      .catch(err => console.error('Failed to load store settings:', err));

    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data.country_code && data.country_code !== 'MY') {
          setIsMy(false);
          setCurrency('USD');
          setRate(0.22);
        } else {
          setIsMy(true);
          setCurrency('RM');
          setRate(1);
        }
      })
      .catch(err => {
        console.error('IP Geolocation failed', err);
      });
  }, []);

  const getPrice = (theme) => {
    const baseMyr = theme && theme.price !== undefined && theme.price !== null 
      ? parseFloat(theme.price) 
      : (theme && theme.price_tier === 'premium' ? 4.0 : 3.0);
    return baseMyr * rate;
  };

  const handleBuyTheme = (theme) => {
    const price = getPrice(theme);
    const isFree = price === 0;
    const currParam = currency === 'USD' ? 'USD' : 'MYR';
    router.push(`/checkout-redirect?theme_id=${theme.id}&currency=${currParam}${isFree ? '&is_free=true' : ''}`);
  };

  const formatPrice = (amount) => `${currency === 'USD' ? '$' : 'RM'}${amount.toFixed(2)}`;

  const filteredThemes = initialThemes.filter((theme) => {
    const matchSearch = theme.name.toLowerCase().includes(searchQuery.toLowerCase());
    let matchCategory = true;
    if (activeCategory === 'Premium') {
      matchCategory = theme.price_tier === 'premium';
    } else if (activeCategory === 'Standard') {
      matchCategory = theme.price_tier === 'standard';
    }
    return matchSearch && matchCategory;
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-color)', fontFamily: 'var(--font-sans)', overflowX: 'hidden' }}>
      
      {/* HEADER SECTION */}
      <header className={`ecommerce-header ${isNavVisible ? 'visible' : 'hidden'}`} style={{
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '16px 40px',
        position: 'fixed', top: 0, width: '100%', zIndex: 100,
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)'
      }}>
        <div className="header-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
          
          {/* Brand & Logo */}
          <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img 
              src="/seeport-logo.svg" 
              alt="Seeport Logo" 
              style={{ width: '40px', height: '40px', objectFit: 'contain' }}
            />
            <span style={{ 
              fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.5px',
              color: 'white', display: 'flex', alignItems: 'baseline', gap: '6px'
            }}>
              Seeport
              <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0' }}>by NasiLemak</span>
            </span>
          </div>

          {/* Search & Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, maxWidth: '800px', margin: '0 auto' }}>
            <div className="search-bar" style={{ flex: 1, position: 'relative' }}>
              <svg style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                type="text" 
                placeholder="Search premium themes..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '12px 16px 12px 42px', borderRadius: '12px', 
                  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)',
                  color: 'white', outline: 'none', fontSize: '0.95rem',
                  transition: 'border-color 0.3s, background 0.3s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
            
            <div className="category-filters" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {['All Categories', 'Premium', 'Standard'].map(cat => (
                <button 
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: activeCategory === cat ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                    background: activeCategory === cat ? 'rgba(244, 63, 94, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: activeCategory === cat ? 'var(--primary)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseOver={(e) => {
                    if (activeCategory !== cat) e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  }}
                  onMouseOut={(e) => {
                    if (activeCategory !== cat) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Actions: Currency Switcher */}
          <div className="header-actions" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
              padding: '4px',
              gap: '4px'
            }}>
              <button
                type="button"
                onClick={() => {
                  setIsMy(true);
                  setCurrency('RM');
                  setRate(1);
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  border: 'none',
                  background: currency === 'RM' ? 'var(--primary, #F43F5E)' : 'transparent',
                  color: currency === 'RM' ? 'white' : 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                🇲🇾 MYR (RM)
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMy(false);
                  setCurrency('USD');
                  setRate(0.22);
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  border: 'none',
                  background: currency === 'USD' ? 'var(--primary, #F43F5E)' : 'transparent',
                  color: currency === 'USD' ? 'white' : 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                🇺🇸 USD ($)
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="store-layout" style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 380px', 
        gap: '24px', 
        padding: '24px', 
        maxWidth: '1600px', 
        margin: '0 auto',
        paddingTop: '90px'
      }}>
        {/* Left Side: Main Content */}
        <div className="main-content">
          <style dangerouslySetInnerHTML={{ __html: `
            .product-card-glass {
              padding: 22px;
              background: rgba(15, 23, 42, 0.4);
              border: 1px solid rgba(255, 255, 255, 0.08);
              border-radius: 20px;
              backdrop-filter: blur(20px);
              -webkit-backdrop-filter: blur(20px);
              box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
              transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
              display: flex;
              flex-direction: column;
              position: relative;
              overflow: hidden;
            }
            .product-card-glass::before {
              content: '';
              position: absolute;
              top: 0; left: 0; right: 0; bottom: 0;
              border-radius: 20px;
              padding: 2px;
              background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 100%);
              -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
              -webkit-mask-composite: xor;
              mask-composite: exclude;
              opacity: 0.5;
              transition: opacity 0.4s ease;
              pointer-events: none;
            }
            .product-card-glass:hover {
              transform: translateY(-8px) scale(1.02);
              background: rgba(15, 23, 42, 0.6);
              border-color: rgba(255, 255, 255, 0.2);
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255,255,255,0.05);
            }
            .product-card-glass:hover::before {
              opacity: 1;
            }
            .product-card-glass.active {
              border-color: var(--primary, #F43F5E);
              box-shadow: 0 12px 30px rgba(244, 63, 94, 0.25), 0 0 0 1px var(--primary, #F43F5E);
            }
          `}} />
          
          {/* Small Horizontal Buy Us A Coffee Section */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '12px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img 
                src="https://qodrnrewzwrcejelcbwl.supabase.co/storage/v1/object/public/assets/nasilemak_1786182796512.svg" 
                alt="Nasi Lemak" 
                style={{ width: '64px', height: '64px', objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))', transform: 'scale(1.1)' }} 
              />
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'white' }}>Support Our Work</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Buy us Nasi Lemak to keep the awesome themes coming!</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, maxWidth: '300px' }}>
              <input 
                type="range" min="5" max="500" step="5" 
                value={coffeeDonation} 
                onChange={(e) => setCoffeeDonation(e.target.value)}
                style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }} 
              />
            </div>

            <button 
              className="btn"
              style={{
                padding: '8px 16px',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
              onClick={() => alert(`Terima kasih belanja Nasi Lemak sebanyak ${currency === 'USD' ? '$' : 'RM'}${coffeeDonation}! 🍛`)}
            >
              Donate {currency === 'USD' ? '$' : 'RM'}{coffeeDonation}
            </button>
          </div>

          <section id="products-section">
            <div className="section-header">
              <h2>Featured Themes</h2>
            </div>

            {filteredThemes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(15,23,42,0.4)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <h3 style={{ color: 'white', margin: '0 0 8px', fontSize: '1.2rem' }}>No Themes Found</h3>
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.92rem' }}>Try clearing your search or selecting another category.</p>
              </div>
            ) : (
              <div className="product-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '24px' }}>
                {filteredThemes.map((theme) => {
                const priceStr = formatPrice(getPrice(theme));
                const colors = theme.theme_data || {};
                const isPremium = theme.price_tier === 'premium';
                const isPreviewActive = activePreviewTheme && activePreviewTheme.id === theme.id;

                const bgVal = colors['--bg-color'] || colors['--bg'] || '#0F172A';
                const surfaceVal = colors['--card-bg'] || colors['--surface'] || '#1E293B';
                const textVal = colors['--text-color'] || colors['--text-primary'] || '#F8FAFC';
                const accentVal = colors['--accent-color'] || colors['--primary'] || '#6366F1';

                return (
                  <div 
                    key={theme.id} 
                    className={`product-card-glass ${isPreviewActive ? 'active' : ''}`} 
                    style={{ '--primary': accentVal }}
                  >
                    {/* Badge */}
                    <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 2 }}>
                      {isPremium ? (
                        <span style={{ 
                          background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', 
                          color: 'white', 
                          fontSize: '0.72rem', 
                          fontWeight: 800, 
                          padding: '4px 10px', 
                          borderRadius: 'var(--radius-full)', 
                          letterSpacing: '0.8px',
                          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                        }}>
                          PREMIUM
                        </span>
                      ) : (
                        <span style={{ 
                          background: 'rgba(255, 255, 255, 0.1)', 
                          color: 'var(--text-muted)', 
                          fontSize: '0.72rem', 
                          fontWeight: 700, 
                          padding: '4px 10px', 
                          borderRadius: 'var(--radius-full)',
                          letterSpacing: '0.8px'
                        }}>
                          STANDARD
                        </span>
                      )}
                    </div>

                    {/* SHOWCASE PRODUCT IMAGE OR MINI MOCK UI PREVIEW */}
                    <div 
                      onClick={() => setActivePreviewTheme(theme)}
                      style={{ 
                        height: '160px', 
                        borderRadius: '12px',
                        background: `linear-gradient(135deg, ${bgVal} 0%, ${surfaceVal} 100%)`,
                        border: `1px solid ${accentVal}44`,
                        boxShadow: `0 8px 24px ${accentVal}25`,
                        marginBottom: '18px',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        position: 'relative',
                        transition: 'transform 0.2s ease, border-color 0.2s ease'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      {theme.theme_data?.product_image ? (
                        <img 
                          src={theme.theme_data.product_image} 
                          alt={`${theme.name} Showcase`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ padding: '12px', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                          {/* Mini Window Controls Header */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }}></div>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }}></div>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }}></div>
                            <div style={{ 
                              marginLeft: 'auto', 
                              height: '6px', 
                              width: '60px', 
                              background: `${textVal}22`, 
                              borderRadius: '4px' 
                            }}></div>
                          </div>

                          {/* Mock Card Content inside Theme Preview */}
                          <div style={{ 
                            background: surfaceVal, 
                            border: `1px solid ${accentVal}33`, 
                            borderRadius: '8px', 
                            padding: '10px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px'
                          }}>
                            <div style={{ height: '8px', width: '70%', background: accentVal, borderRadius: '4px', opacity: 0.9 }}></div>
                            <div style={{ height: '6px', width: '90%', background: textVal, opacity: 0.5, borderRadius: '3px' }}></div>
                            <div style={{ height: '6px', width: '50%', background: textVal, opacity: 0.3, borderRadius: '3px' }}></div>
                          </div>

                          {/* Accent Color Palette Indicator Pills */}
                          <div style={{ position: 'absolute', bottom: '10px', right: '10px', display: 'flex', gap: '4px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: bgVal, border: '1px solid rgba(255,255,255,0.2)' }}></div>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: surfaceVal, border: '1px solid rgba(255,255,255,0.2)' }}></div>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: accentVal }}></div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Title & Price Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
                      <div>
                        <span style={{ 
                          display: 'block',
                          color: 'var(--text-muted)', 
                          fontSize: '0.75rem', 
                          fontWeight: 700, 
                          textTransform: 'uppercase', 
                          letterSpacing: '1px',
                          marginBottom: '4px'
                        }}>
                          {theme.price_tier} Theme
                        </span>
                        <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
                          {theme.name}
                        </h3>
                      </div>
                      <span style={{ 
                        color: 'var(--primary)', 
                        fontSize: '1.25rem', 
                        fontWeight: 800, 
                        fontFamily: 'var(--font-display)',
                        whiteSpace: 'nowrap'
                      }}>
                        {priceStr}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', position: 'relative', zIndex: 10 }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ 
                          flex: 1, 
                          padding: '11px 0', 
                          fontSize: '0.88rem', 
                          fontWeight: 700,
                          borderRadius: 'var(--radius-md)',
                          background: isPreviewActive ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255,255,255,0.06)',
                          borderColor: isPreviewActive ? 'rgba(244, 63, 94, 0.4)' : 'rgba(255,255,255,0.15)',
                          color: isPreviewActive ? 'var(--primary)' : 'white'
                        }}
                        onClick={(e) => { e.stopPropagation(); setActivePreviewTheme(theme); }}
                      >
                        {isPreviewActive ? 'Viewing Demo' : 'Try Demo'}
                      </button>

                      <button 
                        className="btn"
                        style={{ 
                          flex: 1, 
                          padding: '11px 0', 
                          fontSize: '0.88rem', 
                          fontWeight: 800,
                          borderRadius: 'var(--radius-md)',
                          background: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)',
                          color: 'white',
                          border: 'none',
                          boxShadow: '0 4px 15px rgba(244, 63, 94, 0.3)',
                          cursor: 'pointer'
                        }}
                        onClick={(e) => { e.stopPropagation(); handleBuyTheme(theme); }}
                      >
                        {priceStr === '$0.00' || priceStr === 'RM0.00' ? 'Get for Free' : 'Buy Theme'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </section>

        </div>

        {/* Right Side: Sticky Live Preview */}
        <aside className="store-sidebar">
          <div className="sticky-preview-container">
            <div className="sticky-preview-header">
              <span className="sticky-preview-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="3" ry="3"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                  <polygon points="10 8.5 15 10.5 10 12.5 10 8.5" fill="currentColor"></polygon>
                </svg>
                Live Demo
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {activePreviewTheme ? activePreviewTheme.name : 'Select a theme'}
              </span>
            </div>
            
            <div className="sticky-preview-frame-wrapper">
              {activePreviewTheme ? (
                <iframe 
                  key={activePreviewTheme.id}
                  srcDoc={getIframeHtml(activePreviewTheme)} 
                  className="sticky-iframe" 
                  title="Live Seeport Theme Preview" 
                />
              ) : (
                <div style={{ color: 'var(--text-muted)' }}>Click "Try Theme" to preview</div>
              )}
            </div>
          </div>



          {/* Customer Reviews Ticker Filtered for Active Preview Theme */}
          {filteredReviews.length > 0 && (
            <div style={{ 
              marginTop: '16px',
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
              transition: 'all 0.4s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: '28px', 
                    height: '28px', 
                    borderRadius: '50%', 
                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    color: 'white',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {filteredReviews[reviewIdx % filteredReviews.length]?.customer_name?.substring(0, 2).toUpperCase() || 'CU'}
                  </div>
                  <span style={{ color: 'white', fontWeight: 700, fontSize: '0.88rem' }}>
                    {filteredReviews[reviewIdx % filteredReviews.length]?.customer_name}
                  </span>
                </div>

                {/* Rating Stars */}
                <div style={{ color: '#FBBF24', fontSize: '0.85rem', letterSpacing: '2px' }}>
                  {'★'.repeat(filteredReviews[reviewIdx % filteredReviews.length]?.rating || 5)}
                </div>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.4', marginBottom: '6px', fontStyle: 'italic' }}>
                "{filteredReviews[reviewIdx % filteredReviews.length]?.comment}"
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Theme: <strong style={{ color: 'var(--primary)' }}>{filteredReviews[reviewIdx % filteredReviews.length]?.theme_name}</strong></span>
                <span style={{ opacity: 0.7 }}>Verified Buyer</span>
              </div>
            </div>
          )}
        </aside>

      </div>
    </div>
  );
}
