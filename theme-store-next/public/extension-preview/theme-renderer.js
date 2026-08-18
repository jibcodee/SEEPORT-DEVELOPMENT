/**
 * Seeport Unified Theme Renderer & Validator
 * Shared between Chrome Extension, Storefront and Admin Board
 */

// Helper to convert hex colors to RGBA with opacity
function hexToRgba(hex, alpha) {
  if (!hex) return 'transparent';
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  if (c.length !== 6) {
    return 'transparent';
  }
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// 1. Core theme rendering function
function renderTheme(themeConfig, rootElement = document.documentElement) {
  if (!themeConfig) return;

  const colors = themeConfig.colors || {};
  const animation = themeConfig.animation || {};
  const typography = themeConfig.typography || {};
  const layout = themeConfig.layout || {};

  // Clean previous custom styles
  const propertiesToClear = [
    '--bg', '--text-primary', '--surface', '--primary', '--primary-hover',
    '--text-secondary', '--text-muted', '--text-subtle',
    '--border', '--border-hover', '--surface-hover', '--surface-active',
    '--header-bg', '--footer-bg', '--primary-light', '--primary-subtle', '--primary-ring',
    '--font-family', '--border-radius'
  ];
  propertiesToClear.forEach(prop => rootElement.style.removeProperty(prop));

  // Legacy translation mapping compatibility layer
  const bgVal = colors.background || colors['--bg-color'] || colors['--bg'] || '#0F172A';
  const textVal = colors.text || colors['--text-color'] || colors['--text-primary'] || '#F8FAFC';
  let cardVal = colors.cardBackground || colors['--card-bg'] || colors['--surface'] || '#1E293B';
  const cardOpacity = colors['--surface-opacity'];
  if (cardOpacity !== undefined && cardVal.startsWith('#')) {
    cardVal = hexToRgba(cardVal, parseFloat(cardOpacity));
  }
  const accentVal = colors.accent || colors.primary || colors['--accent-color'] || colors['--primary'] || '#8B5CF6';

  // Apply explicit CSS variables
  rootElement.style.setProperty('--bg', bgVal);
  rootElement.style.setProperty('--text-primary', textVal);
  rootElement.style.setProperty('--surface', cardVal);
  rootElement.style.setProperty('--primary', accentVal);
  rootElement.style.setProperty('--primary-hover', accentVal);
  rootElement.style.setProperty('--border-hover', accentVal);

  // Derive cohesive colors
  rootElement.style.setProperty('--text-secondary', hexToRgba(textVal, 0.8));
  rootElement.style.setProperty('--text-muted', hexToRgba(textVal, 0.6));
  rootElement.style.setProperty('--text-subtle', hexToRgba(textVal, 0.4));
  
  const explicitBorder = colors.borderColor || colors['--border-color'] || colors['--border'];
  if (explicitBorder) {
    rootElement.style.setProperty('--border', explicitBorder);
  } else {
    rootElement.style.setProperty('--border', hexToRgba(textVal, 0.15));
  }
  rootElement.style.setProperty('--surface-hover', hexToRgba(accentVal, 0.08));
  rootElement.style.setProperty('--surface-active', hexToRgba(accentVal, 0.15));
  const explicitHeaderBg = colors.headerBg || colors['--header-bg'];
  if (explicitHeaderBg) {
    rootElement.style.setProperty('--header-bg', explicitHeaderBg);
  } else {
    rootElement.style.setProperty('--header-bg', hexToRgba(cardVal, 0.82));
  }
  const explicitHeaderBgImage = colors.headerBgImage || colors['--header-bg-image'];
  if (explicitHeaderBgImage) {
    rootElement.style.setProperty('--header-bg-image', `url("${explicitHeaderBgImage}")`);
  } else {
    rootElement.style.removeProperty('--header-bg-image');
  }
  const explicitHeaderBgOpacity = colors.headerBgOpacity !== undefined ? colors.headerBgOpacity : colors['--header-bg-opacity'];
  if (explicitHeaderBgOpacity !== undefined) {
    rootElement.style.setProperty('--header-bg-opacity', explicitHeaderBgOpacity);
  } else {
    rootElement.style.removeProperty('--header-bg-opacity');
  }
  
  const explicitFooterBg = colors.footerBg || colors['--footer-bg'];
  if (explicitFooterBg) {
    rootElement.style.setProperty('--footer-bg', explicitFooterBg);
  } else {
    rootElement.style.setProperty('--footer-bg', hexToRgba(cardVal, 0.85));
  }
  const explicitFooterBgImage = colors.footerBgImage || colors['--footer-bg-image'];
  if (explicitFooterBgImage) {
    rootElement.style.setProperty('--footer-bg-image', `url("${explicitFooterBgImage}")`);
  } else {
    rootElement.style.removeProperty('--footer-bg-image');
  }
  const explicitFooterBgOpacity = colors.footerBgOpacity !== undefined ? colors.footerBgOpacity : colors['--footer-bg-opacity'];
  if (explicitFooterBgOpacity !== undefined) {
    rootElement.style.setProperty('--footer-bg-opacity', explicitFooterBgOpacity);
  } else {
    rootElement.style.removeProperty('--footer-bg-opacity');
  }
  
  rootElement.style.setProperty('--primary-light', hexToRgba(accentVal, 0.08));
  rootElement.style.setProperty('--primary-subtle', hexToRgba(accentVal, 0.15));
  rootElement.style.setProperty('--primary-ring', hexToRgba(accentVal, 0.22));

  // Layout & Typography
  if (typography.fontFamily) {
    rootElement.style.setProperty('--font-family', typography.fontFamily);
    rootElement.style.setProperty('--font-sans', typography.fontFamily);
  }
  if (layout.borderRadius !== undefined) {
    rootElement.style.setProperty('--border-radius', `${layout.borderRadius}px`);
  }

  // Icons Customization
  const icons = themeConfig.icons || {};
  const iconTypes = ['text', 'image', 'table', 'link'];
  iconTypes.forEach(type => {
    if (icons[type]) {
      rootElement.classList.add(`has-icon-${type}`);
      rootElement.style.setProperty(`--icon-url-${type}`, `url('${icons[type]}')`);
    } else {
      rootElement.classList.remove(`has-icon-${type}`);
      rootElement.style.removeProperty(`--icon-url-${type}`);
    }
  });

  // Manage physical background
  const layoutObj = themeConfig.layout || {};
  const cardMat = layoutObj.cardMaterial || colors.cardMaterial || 'flat';
  if (document && document.body) {
    Array.from(document.body.classList).forEach(cls => {
      if (cls.startsWith('has-material-')) document.body.classList.remove(cls);
    });
    if (cardMat !== 'flat') {
      document.body.classList.add(`has-material-${cardMat}`);
    }
  }

  let animDiv = document.getElementById('theme-background-animation');
  if (!animDiv && rootElement === document.documentElement) {
    animDiv = document.querySelector('.tray-bg-animation');
  }

  if (animDiv) {
    // Reset background styles and animation classes
    animDiv.style.removeProperty('background');
    animDiv.style.removeProperty('background-image');
    animDiv.style.removeProperty('background-size');
    animDiv.style.removeProperty('background-position');
    animDiv.style.removeProperty('opacity');
    animDiv.style.removeProperty('animation');
    
    if (document && document.body) {
      document.body.className.split(' ').forEach(cls => {
        if (cls.startsWith('has-animation-') || cls.startsWith('theme-active-') || cls.startsWith('has-material-')) {
          document.body.classList.remove(cls);
        }
      });
      // Add theme ID helper class
      if (themeConfig.id) {
        document.body.classList.add(`theme-active-${themeConfig.id}`);
      }
    }

    // Determine animation parameters from new or legacy format
    const animType = animation.type || colors['--animation-name'] || 'none';
    const animUrl = animation.assetUrl || colors['--animation-url'] || 'none';
    const animOpacity = animation.opacity !== undefined ? animation.opacity : (colors['--animation-opacity'] || '0');
    const speed = animation.speed || 15000;

    if (animType !== 'none') {
      if (document && document.body) {
        document.body.classList.add(`has-animation-${animType}`);
      }

      if (animType === 'gradient-shift') {
        animDiv.style.setProperty('background', `linear-gradient(270deg, ${bgVal}, ${accentVal})`, 'important');
        animDiv.style.setProperty('background-size', '400% 400%', 'important');
        animDiv.style.setProperty('animation', `moveBg ${speed}ms ease infinite`, 'important');
        animDiv.style.setProperty('opacity', '0.35', 'important');
      } else if (animUrl && animUrl !== 'none') {
        // It's an image-based background (could be gif-loop, moveBg, floatPattern)
        animDiv.style.setProperty('background-color', 'rgba(255, 0, 0, 0.5)', 'important');
        animDiv.style.setProperty('background-image', animUrl.startsWith('url(') ? animUrl : `url("${animUrl}")`, 'important');
        animDiv.style.setProperty('background-size', colors['--animation-size'] || 'cover', 'important');
        animDiv.style.setProperty('background-position', colors['--animation-position'] || 'center', 'important');
        animDiv.style.setProperty('opacity', String(animOpacity), 'important');
        
        // Apply CSS animation if requested
        if (colors['--animation-name'] && colors['--animation-name'] !== 'none') {
          animDiv.style.setProperty('animation', `${colors['--animation-name']} ${colors['--animation-duration'] || '15s'} ${colors['--animation-timing'] || 'linear'} infinite`, 'important');
        } else {
          animDiv.style.removeProperty('animation');
        }

        // DEBUG VISUALIZER
        animDiv.innerHTML = `<div style="position: absolute; top: 10px; left: 10px; background: black; color: lime; padding: 10px; z-index: 9999; font-size: 12px; pointer-events: none; border-radius: 4px; border: 1px solid lime;">
          DEBUG ANIMATION:<br>
          Type: ${animType}<br>
          Opacity: ${animOpacity}<br>
          Name: ${colors['--animation-name']}<br>
          URL length: ${animUrl.length}
        </div>`;
      } else if (animType === 'particle-float') {
        animDiv.style.setProperty('opacity', '0.2', 'important');
      } else if (animType === 'sprite-walk') {
        animDiv.style.setProperty('opacity', '0.6', 'important');
      }
    }
  }
}

// 2. Strict theme validator function
function validateThemeSchema(json) {
  const errors = [];
  
  if (!json || typeof json !== 'object') {
    return { valid: false, errors: ['Theme config must be a valid JSON object.'] };
  }

  // Required root keys
  if (!json.name || typeof json.name !== 'string') {
    errors.push('Required property "name" must be a string.');
  }

  // Enforce tier enum
  if (json.tier && !['standard', 'premium'].includes(json.tier)) {
    errors.push('Property "tier" must be "standard" or "premium".');
  }

  // Validate price range
  if (json.price !== undefined) {
    const priceVal = parseFloat(json.price);
    if (isNaN(priceVal) || priceVal < 3 || priceVal > 100) {
      errors.push('Property "price" must be a number between RM3 and RM100.');
    }
  }

  // Colors validation (allowing legacy keys as valid fallback)
  if (!json.colors || typeof json.colors !== 'object') {
    errors.push('Required property "colors" must be an object.');
  } else {
    const hasNewKeys = ['background', 'text', 'cardBackground', 'primary'].every(k => json.colors[k]);
    const hasLegacyKeys = ['--bg-color', '--text-color', '--card-bg', '--accent-color'].every(k => json.colors[k]);

    if (!hasNewKeys && !hasLegacyKeys) {
      errors.push('Required color keys missing. Must provide "background", "text", "cardBackground", "primary" (or legacy color properties).');
    }

    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    Object.keys(json.colors).forEach(key => {
      const val = json.colors[key];
      if (typeof val === 'string' && val.startsWith('#')) {
        if (!hexRegex.test(val)) {
          errors.push(`Invalid color format for "colors.${key}": must be a valid 6-character hex code like #FFFFFF.`);
        }
      }
    });
  }

  // Animation validation
  if (json.animation) {
    if (typeof json.animation !== 'object') {
      errors.push('Property "animation" must be an object.');
    } else {
      const allowedTypes = ['none', 'gradient-shift', 'particle-float', 'gif-loop', 'sprite-walk'];
      if (!json.animation.type || !allowedTypes.includes(json.animation.type)) {
        errors.push(`Property "animation.type" must be one of: ${allowedTypes.join(', ')}.`);
      }
      if (json.animation.speed !== undefined && (typeof json.animation.speed !== 'number' || json.animation.speed < 100)) {
        errors.push('Property "animation.speed" must be a number greater than 100ms.');
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Global browser export
if (typeof window !== 'undefined') {
  window.renderTheme = renderTheme;
  window.validateThemeSchema = validateThemeSchema;
}

// UMD Export support for Node/CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { renderTheme, validateThemeSchema };
} else if (typeof exports !== 'undefined') {
  exports.renderTheme = renderTheme;
  exports.validateThemeSchema = validateThemeSchema;
}
