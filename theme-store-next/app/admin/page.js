'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

export default function AdminContent() {
  const router = useRouter();

  const [themeName, setThemeName] = useState('');
  const [priceTier, setPriceTier] = useState('standard');
  const [price, setPrice] = useState(3.00);
  const [category, setCategory] = useState('Dark Themes');
  const [themeData, setThemeData] = useState({
    '--bg-color': '#F3F0FA',
    '--text-color': '#4A3E56',
    '--card-bg': '#EAE3F2',
    '--accent-color': '#8B5CF6'
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [bgUrl, setBgUrl] = useState('');
  const [bgOpacity, setBgOpacity] = useState(1.0);
  const [bgColor, setBgColor] = useState('');
  const [cardColor, setCardColor] = useState('');
  const [cardOpacity, setCardOpacity] = useState(1.0);
  const [cardMaterial, setCardMaterial] = useState('flat');
  const [accentColor, setAccentColor] = useState('');
  const [textColor, setTextColor] = useState('');
  const [borderColor, setBorderColor] = useState('');
  const [topBarColor, setTopBarColor] = useState('');
  const [topBarImage, setTopBarImage] = useState('');
  const [topBarOpacity, setTopBarOpacity] = useState(1.0);
  const [bottomBarColor, setBottomBarColor] = useState('');
  const [bottomBarImage, setBottomBarImage] = useState('');
  const [bottomBarOpacity, setBottomBarOpacity] = useState(1.0);
  const [fontFamily, setFontFamily] = useState('');
  const [productImage, setProductImage] = useState('');
  const [productImageName, setProductImageName] = useState('');
  

  
  const [previewClicked, setPreviewClicked] = useState(false);
  const [iframeSrc, setIframeSrc] = useState('/extension-preview/sidepanel.html');

  useEffect(() => {
    setIframeSrc(`/extension-preview/sidepanel.html?v=${Date.now()}`);
  }, []);

  const iframeRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        setThemeData(parsed);
        if (parsed.name) setThemeName(parsed.name);
        if (parsed.price_tier || parsed.tier) setPriceTier(parsed.price_tier || parsed.tier);
        if (parsed.price) setPrice(parsed.price);
        if (parsed.category) setCategory(parsed.category);
        
        // Extract initial colors
        if (parsed.colors) {
          const bgCol = parsed.colors['--bg-color'] || parsed.colors.background || '';
          setBgColor(bgCol);
          const crdCol = parsed.colors['--surface-color'] || parsed.colors['--surface'] || parsed.colors.card || '';
          setCardColor(crdCol);
          const crdOp = parsed.colors['--surface-opacity'] !== undefined ? parseFloat(parsed.colors['--surface-opacity']) : 1.0;
          setCardOpacity(isNaN(crdOp) ? 1.0 : crdOp);
          
          const mat = (parsed.layout && parsed.layout.cardMaterial) || parsed.colors.cardMaterial || 'flat';
          setCardMaterial(mat);
          
          const accCol = parsed.colors['--primary'] || parsed.colors['--accent-color'] || parsed.colors.accent || parsed.colors.primary || '';
          setAccentColor(accCol);
          
          const txtCol = parsed.colors['--text-color'] || parsed.colors['--text-primary'] || parsed.colors.text || '';
          setTextColor(txtCol);
          
          const brdCol = parsed.colors['--border-color'] || parsed.colors['--border'] || parsed.colors.borderColor || '';
          setBorderColor(brdCol);
          
          const topCol = parsed.colors['--header-bg'] || parsed.colors.headerBg || '';
          setTopBarColor(topCol);
          const topImg = parsed.colors['--header-bg-image'] || parsed.colors.headerBgImage || '';
          setTopBarImage(topImg);
          const topOp = parsed.colors['--header-bg-opacity'] !== undefined ? parseFloat(parsed.colors['--header-bg-opacity']) : 1.0;
          setTopBarOpacity(isNaN(topOp) ? 1.0 : topOp);
          
          const botCol = parsed.colors['--footer-bg'] || parsed.colors.footerBg || '';
          setBottomBarColor(botCol);
          const botImg = parsed.colors['--footer-bg-image'] || parsed.colors.footerBgImage || '';
          setBottomBarImage(botImg);
          const botOp = parsed.colors['--footer-bg-opacity'] !== undefined ? parseFloat(parsed.colors['--footer-bg-opacity']) : 1.0;
          setBottomBarOpacity(isNaN(botOp) ? 1.0 : botOp);
        } else {
          setBgColor('');
          setCardColor('');
          setCardOpacity(1.0);
          setCardMaterial('flat');
          setAccentColor('');
          setTextColor('');
          setBorderColor('');
          setTopBarColor('');
          setTopBarImage('');
          setTopBarOpacity(1.0);
          setBottomBarColor('');
          setBottomBarImage('');
          setBottomBarOpacity(1.0);
        }
        
        // Extract initial font family
        if (parsed.typography && parsed.typography.fontFamily) {
          setFontFamily(parsed.typography.fontFamily);
        } else {
          setFontFamily('');
        }
        
        // Extract icons
        if (parsed.icons) {
          setIconText(parsed.icons.text || '');
          setIconImage(parsed.icons.image || '');
          setIconTable(parsed.icons.table || '');
          setIconLink(parsed.icons.link || '');
        } else {
          setIconText('');
          setIconImage('');
          setIconTable('');
          setIconLink('');
        }
      } catch (err) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Fail terlalu besar! Sila upload gambar kurang dari 2MB.');
      e.target.value = '';
      return;
    }

    setProductImageName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      setProductImage(event.target.result); // Base64 DataURL
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setFileName('');
    setBgUrl('');
    setBgOpacity(1.0);
    setBgColor('');
    setCardColor('');
    setCardOpacity(1.0);
    setCardMaterial('flat');
    setAccentColor('');
    setTextColor('');
    setBorderColor('');
    setTopBarColor('');
    setTopBarImage('');
    setTopBarOpacity(1.0);
    setBottomBarColor('');
    setBottomBarImage('');
    setBottomBarOpacity(1.0);
    setFontFamily('');
    setProductImage('');
    setProductImageName('');
    setThemeData({});
  };

  const handleApplyPreview = () => {
    try {
      if (!iframeRef.current?.contentWindow) {
        alert('Iframe not ready yet');
        return;
      }

      // Support both nested .colors and flat dictionaries
      const colorsObj = themeData.colors || {};
      
      if (bgColor) {
        colorsObj['--bg-color'] = bgColor;
        colorsObj.background = bgColor;
      }
      
      if (cardColor) {
        colorsObj['--surface'] = cardColor;
        colorsObj['--surface-color'] = cardColor;
        colorsObj['--surface-opacity'] = String(cardOpacity);
        colorsObj.card = cardColor;
      }
      if (cardMaterial) {
        colorsObj.cardMaterial = cardMaterial;
      }
      
      if (accentColor) {
        colorsObj['--primary'] = accentColor;
        colorsObj['--accent-color'] = accentColor;
        colorsObj.accent = accentColor;
        colorsObj.primary = accentColor;
      }

      if (textColor) {
        colorsObj['--text-color'] = textColor;
        colorsObj['--text-primary'] = textColor; // legacy support
        colorsObj.text = textColor;
      }
      
      if (borderColor) {
        colorsObj['--border-color'] = borderColor;
        colorsObj['--border'] = borderColor;
        colorsObj.borderColor = borderColor;
      }
      
      if (topBarColor) {
        colorsObj['--header-bg'] = topBarColor;
        colorsObj.headerBg = topBarColor;
      }
      if (topBarImage) {
        colorsObj['--header-bg-image'] = topBarImage;
        colorsObj.headerBgImage = topBarImage;
        colorsObj['--header-bg-opacity'] = String(topBarOpacity);
      }
      if (bottomBarColor) {
        colorsObj['--footer-bg'] = bottomBarColor;
        colorsObj.footerBg = bottomBarColor;
      }
      if (bottomBarImage) {
        colorsObj['--footer-bg-image'] = bottomBarImage;
        colorsObj.footerBgImage = bottomBarImage;
        colorsObj['--footer-bg-opacity'] = String(bottomBarOpacity);
      }

      // Inject the manual background URL if provided
      let cleanUrl = bgUrl.trim();
      if (cleanUrl.startsWith("url('") && cleanUrl.endsWith("')")) {
        cleanUrl = cleanUrl.slice(5, -2);
      } else if (cleanUrl.startsWith("url(") && cleanUrl.endsWith(")")) {
        cleanUrl = cleanUrl.slice(4, -1);
      }

      if (cleanUrl) {
        colorsObj['--animation-url'] = `url('${cleanUrl}')`;
        if (!colorsObj['--animation-name'] || colorsObj['--animation-name'] === 'none') {
          colorsObj['--animation-name'] = 'none'; // Fallback for gif-loop
        }
        
        // Force opacity to bgOpacity so the new background actually shows up!
        if (!colorsObj['--animation-opacity'] || parseFloat(colorsObj['--animation-opacity']) !== parseFloat(bgOpacity)) {
          colorsObj['--animation-opacity'] = bgOpacity.toString(); 
        }
      }

      let animType = colorsObj['--animation-name'] || 'none';
      if (colorsObj['--animation-url'] && animType === 'none') {
        animType = 'gif-loop';
      }

      let animPayload = themeData.animation || {};
      if (colorsObj['--animation-url']) {
        animPayload = {
          type: colorsObj['--animation-name'] && colorsObj['--animation-name'] !== 'none' ? colorsObj['--animation-name'] : 'gif-loop',
          speed: parseInt(colorsObj['--animation-duration'] || animPayload.speed || 15000),
          assetUrl: colorsObj['--animation-url'],
          opacity: parseFloat(colorsObj['--animation-opacity'] || animPayload.opacity || 0)
        };
      } else if (!themeData.animation) {
        animPayload = {
          type: colorsObj['--animation-name'] || 'none',
          speed: parseInt(colorsObj['--animation-duration'] || 15000),
          assetUrl: 'none',
          opacity: 0
        };
      }
      
      const typoObj = { ...(themeData.typography || {}) };
      if (fontFamily.trim()) {
        typoObj.fontFamily = fontFamily.trim();
      }
      
      const layoutObj = themeData.layout || {};
      if (cardMaterial) {
        layoutObj.cardMaterial = cardMaterial;
      }


      const payload = {
        id: 'new_theme_preview',
        name: themeName || themeData.name || 'New Theme Preview',
        colors: colorsObj,
        animation: animPayload,
        typography: typoObj,
        layout: layoutObj
      };
      
      console.log('Pushing preview to iframe:', payload);
      
      iframeRef.current.contentWindow.postMessage({
        type: 'THEME_UPDATE',
        payload: payload
      }, '*');

      setPreviewClicked(true);
      setTimeout(() => setPreviewClicked(false), 2000);
    } catch (error) {
      console.error(error);
      alert('Error applying preview: ' + error.message);
    }
  };

  const handleIframeLoad = () => {
    handleApplyPreview();
  };

  const handleCreateTheme = async () => {
    if (!themeName.trim()) {
      alert('Please enter a theme name');
      return;
    }
    
    setCreateLoading(true);
    try {
      // Create a copy of the theme data to inject the bgUrl before saving
      const finalThemeData = JSON.parse(JSON.stringify(themeData));
      
      if (!finalThemeData.layout) finalThemeData.layout = {};
      finalThemeData.layout.cardMaterial = cardMaterial;
      
      if (!finalThemeData.colors) finalThemeData.colors = {};
      
      if (bgColor) {
        finalThemeData.colors['--bg-color'] = bgColor;
        finalThemeData.colors.background = bgColor;
      }

      if (cardColor) {
        finalThemeData.colors['--surface'] = cardColor;
        finalThemeData.colors['--surface-color'] = cardColor;
        finalThemeData.colors['--surface-opacity'] = String(cardOpacity);
        finalThemeData.colors.card = cardColor;
      }
      if (cardMaterial) {
        finalThemeData.colors.cardMaterial = cardMaterial;
      }

      if (accentColor) {
        finalThemeData.colors['--primary'] = accentColor;
        finalThemeData.colors['--accent-color'] = accentColor;
        finalThemeData.colors.accent = accentColor;
        finalThemeData.colors.primary = accentColor;
      }

      if (textColor) {
        finalThemeData.colors['--text-color'] = textColor;
        finalThemeData.colors['--text-primary'] = textColor;
        finalThemeData.colors.text = textColor;
      }
      
      if (borderColor) {
        finalThemeData.colors['--border-color'] = borderColor;
        finalThemeData.colors['--border'] = borderColor;
        finalThemeData.colors.borderColor = borderColor;
      }
      
      if (topBarColor) {
        finalThemeData.colors['--header-bg'] = topBarColor;
        finalThemeData.colors.headerBg = topBarColor;
      }
      if (topBarImage) {
        finalThemeData.colors['--header-bg-image'] = topBarImage;
        finalThemeData.colors.headerBgImage = topBarImage;
        finalThemeData.colors['--header-bg-opacity'] = String(topBarOpacity);
      }
      if (bottomBarColor) {
        finalThemeData.colors['--footer-bg'] = bottomBarColor;
        finalThemeData.colors.footerBg = bottomBarColor;
      }
      if (bottomBarImage) {
        finalThemeData.colors['--footer-bg-image'] = bottomBarImage;
        finalThemeData.colors.footerBgImage = bottomBarImage;
        finalThemeData.colors['--footer-bg-opacity'] = String(bottomBarOpacity);
      }
      
      if (fontFamily.trim()) {
        if (!finalThemeData.typography) finalThemeData.typography = {};
        finalThemeData.typography.fontFamily = fontFamily.trim();
      }

      if (productImage.trim()) {
        finalThemeData.product_image = productImage.trim();
      }


      
      let cleanUrl = bgUrl.trim();
      if (cleanUrl.startsWith("url('") && cleanUrl.endsWith("')")) {
        cleanUrl = cleanUrl.slice(5, -2);
      } else if (cleanUrl.startsWith("url(") && cleanUrl.endsWith(")")) {
        cleanUrl = cleanUrl.slice(4, -1);
      }

      if (cleanUrl) {
        finalThemeData.colors['--animation-url'] = `url('${cleanUrl}')`;
        if (!finalThemeData.colors['--animation-opacity'] || parseFloat(finalThemeData.colors['--animation-opacity']) !== parseFloat(bgOpacity)) {
          finalThemeData.colors['--animation-opacity'] = bgOpacity.toString(); 
        }
      }

      const { data, error } = await supabase
        .from('themes')
        .insert([{
          name: themeName,
          price_tier: priceTier,
          price: parseFloat(price).toFixed(2),
          category: category,
          theme_data: finalThemeData
        }])
        .select()
        .single();

      if (error) throw error;
      
      alert(`Theme "${themeName}" put on sale successfully!`);
      // Reset form
      setThemeName('');
      setPrice(3.00);
      setPriceTier('standard');
      setFileName('');
      setBgUrl('');
    } catch (err) {
      console.error(err);
      alert('Failed to save theme: ' + err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-color)', fontFamily: 'var(--font-sans)', padding: '40px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-1px', margin: 0 }}>Theme Publisher</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '5px' }}>Upload a JSON file, preview, and publish to the storefront.</p>
        </div>
        <button 
          onClick={() => router.push('/')}
          className="btn btn-outline"
          style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white', cursor: 'pointer' }}
        >
          Back to Store
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '40px' }}>
        
        {/* Left Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Uploader */}
          <div style={{ background: 'rgba(15, 23, 42, 0.45)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px', color: 'white' }}>1. Upload Theme JSON</h3>
            <input 
              type="file" 
              accept=".json"
              onChange={handleFileUpload}
              style={{ display: 'block', width: '100%', padding: '12px', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', color: 'white' }}
            />
            {fileName && <p style={{ color: 'var(--primary)', marginTop: '10px', fontSize: '0.9rem' }}>Loaded: {fileName}</p>}
            
            <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <label style={{ display: 'block', fontSize: '1rem', fontWeight: 'bold', marginBottom: '8px', color: 'white' }}>2. Upload Product Image (Thumbnail)</label>
              <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Gambar ini akan dipaparkan di kedai menggantikan mock UI.</p>
              <input 
                type="file" 
                accept="image/png, image/jpeg, image/webp"
                onChange={handleImageUpload}
                style={{ display: 'block', width: '100%', padding: '12px', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', color: 'white' }}
              />
              {productImageName && <p style={{ color: 'var(--primary)', marginTop: '10px', fontSize: '0.9rem' }}>Attached: {productImageName}</p>}
            </div>

            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '6px', color: 'var(--text-muted)' }}>Background Color Override (Optional)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="color" 
                  value={bgColor || '#2b2b2b'}
                  onChange={(e) => setBgColor(e.target.value)}
                  style={{ width: '40px', height: '40px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                />
                <input 
                  type="text" 
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  placeholder="#2b2b2b"
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '6px', color: 'var(--text-muted)' }}>Tray Item (Card) Color Override (Optional)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="color" 
                    value={cardColor || '#1e293b'}
                    onChange={(e) => setCardColor(e.target.value)}
                    style={{ width: '40px', height: '40px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                  />
                  <input 
                    type="text" 
                    value={cardColor}
                    onChange={(e) => setCardColor(e.target.value)}
                    placeholder="#1e293b"
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', width: '90px' }}>Card Opacity</label>
                  <input 
                    type="range" 
                    min="0" max="1" step="0.05"
                    value={cardOpacity}
                    onChange={(e) => setCardOpacity(parseFloat(e.target.value))}
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: '0.85rem', color: 'white', minWidth: '30px' }}>{cardOpacity.toFixed(2)}</span>
                </div>
                <div style={{ marginTop: '4px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '4px' }}>Card Material Effect</label>
                  <select 
                    value={cardMaterial}
                    onChange={(e) => setCardMaterial(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="flat">Flat / Solid (Default)</option>
                    <option value="glassmorphism">Glassmorphism (Kaca)</option>
                    <option value="waterdrop">Water Drop (Cecair)</option>
                    <option value="neumorphism">Neumorphism (Timbul)</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '6px', color: 'var(--text-muted)' }}>Primary / Accent Color Override (Optional)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="color" 
                  value={accentColor || '#4f46e5'}
                  onChange={(e) => setAccentColor(e.target.value)}
                  style={{ width: '40px', height: '40px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                />
                <input 
                  type="text" 
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  placeholder="#4f46e5 or rgba(79, 70, 229, 1)"
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '6px', color: 'var(--text-muted)' }}>Text Color Override (Optional)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="color" 
                  value={textColor || '#ffffff'}
                  onChange={(e) => setTextColor(e.target.value)}
                  style={{ width: '40px', height: '40px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                />
                <input 
                  type="text" 
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  placeholder="e.g. #FFFFFF"
                  style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '6px', color: 'var(--text-muted)' }}>Line Border Color Override (Optional)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="color" 
                  value={borderColor || '#ffffff'}
                  onChange={(e) => setBorderColor(e.target.value)}
                  style={{ width: '40px', height: '40px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                />
                <input 
                  type="text" 
                  value={borderColor}
                  onChange={(e) => setBorderColor(e.target.value)}
                  placeholder="e.g. rgba(255,255,255,0.2) or #FFFFFF"
                  style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '6px', color: 'var(--text-muted)' }}>Top Bar Override (Optional)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="color" 
                    value={topBarColor || '#ffffff'}
                    onChange={(e) => setTopBarColor(e.target.value)}
                    style={{ width: '40px', height: '40px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                  />
                  <input 
                    type="text" 
                    value={topBarColor}
                    onChange={(e) => setTopBarColor(e.target.value)}
                    placeholder="Color e.g. rgba(0,0,0,0.8) or #1E293B"
                    style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }}
                  />
                </div>
                <input 
                  type="text" 
                  value={topBarImage}
                  onChange={(e) => setTopBarImage(e.target.value)}
                  placeholder="Image URL e.g. https://domain.com/image.gif"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', width: '90px' }}>Image Opacity</label>
                  <input 
                    type="range" 
                    min="0" max="1" step="0.05"
                    value={topBarOpacity}
                    onChange={(e) => setTopBarOpacity(parseFloat(e.target.value))}
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: '0.85rem', color: 'white', minWidth: '30px' }}>{topBarOpacity.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '6px', color: 'var(--text-muted)' }}>Bottom Bar Override (Optional)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="color" 
                    value={bottomBarColor || '#ffffff'}
                    onChange={(e) => setBottomBarColor(e.target.value)}
                    style={{ width: '40px', height: '40px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                  />
                  <input 
                    type="text" 
                    value={bottomBarColor}
                    onChange={(e) => setBottomBarColor(e.target.value)}
                    placeholder="Color e.g. rgba(0,0,0,0.8) or #1E293B"
                    style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }}
                  />
                </div>
                <input 
                  type="text" 
                  value={bottomBarImage}
                  onChange={(e) => setBottomBarImage(e.target.value)}
                  placeholder="Image URL e.g. https://domain.com/image.gif"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', width: '90px' }}>Image Opacity</label>
                  <input 
                    type="range" 
                    min="0" max="1" step="0.05"
                    value={bottomBarOpacity}
                    onChange={(e) => setBottomBarOpacity(parseFloat(e.target.value))}
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: '0.85rem', color: 'white', minWidth: '30px' }}>{bottomBarOpacity.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '6px', color: 'var(--text-muted)' }}>Font Override (Optional)</label>
              <select 
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none', appearance: 'none', cursor: 'pointer' }}
              >
                <option value="">-- Gunakan Font Asal (Inter) --</option>
                <option value="'Inter', sans-serif">Inter (Modern Sans)</option>
                <option value="'JetBrains Mono', monospace">JetBrains Mono (Coding)</option>
                <option value="Arial, sans-serif">Arial (Standard Sans)</option>
                <option value="Verdana, sans-serif">Verdana (Wide Sans)</option>
                <option value="'Trebuchet MS', sans-serif">Trebuchet MS (Clean Sans)</option>
                <option value="Georgia, serif">Georgia (Elegant Serif)</option>
                <option value="'Times New Roman', serif">Times New Roman (Classic Serif)</option>
                <option value="'Courier New', monospace">Courier New (Typewriter)</option>
                <option value="'Comic Sans MS', cursive">Comic Sans MS (Fun/Casual)</option>
              </select>
            </div>

            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '6px', color: 'var(--text-muted)' }}>Background Image URL (Optional)</label>
              <input 
                type="text" 
                value={bgUrl}
                onChange={(e) => setBgUrl(e.target.value)}
                placeholder="e.g. https://media.giphy.com/... / .jpg / .png"
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }}
              />
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: '6px', marginBottom: '16px' }}>
                Paste any GIF, JPG, PNG, or WEBP image link here to apply it to the template.
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Background Brightness (Opacity)</label>
                <span style={{ fontSize: '0.9rem', color: 'white', fontWeight: 'bold' }}>{Math.round(bgOpacity * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0.1" 
                max="1.0" 
                step="0.05"
                value={bgOpacity}
                onChange={(e) => setBgOpacity(parseFloat(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button 
                onClick={handleReset}
                className="btn"
                style={{ 
                  flex: 1, 
                  padding: '12px', 
                  background: 'rgba(255,255,255,0.1)', 
                  color: 'white', 
                  border: '1px solid rgba(255,255,255,0.2)', 
                  borderRadius: '8px', 
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease'
                }}
              >
                Reset
              </button>
              <button 
                onClick={handleApplyPreview}
                className="btn btn-primary"
                style={{ 
                  flex: 2, 
                  padding: '12px', 
                  background: previewClicked ? 'rgba(255,255,255,0.2)' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)', 
                  color: previewClicked ? 'rgba(255,255,255,0.6)' : 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease'
                }}
              >
                {previewClicked ? 'Preview Sent ✓' : 'Push to Preview →'}
              </button>
            </div>
          </div>

          {/* Details */}
          <div style={{ background: 'rgba(15, 23, 42, 0.45)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px', color: 'white' }}>2. Theme Details</h3>
            
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '6px', color: 'var(--text-muted)' }}>Theme Name</label>
                <input 
                  type="text" 
                  value={themeName}
                  onChange={(e) => setThemeName(e.target.value)}
                  placeholder="e.g. Neon Cyberpunk"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '6px', color: 'var(--text-muted)' }}>Category</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#1E293B', color: 'white', outline: 'none' }}
                  >
                    <option>Dark Themes</option>
                    <option>Animated Themes</option>
                    <option>Light Themes</option>
                    <option>Aesthetic</option>
                    <option>Gaming</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '6px', color: 'var(--text-muted)' }}>Tier</label>
                  <select 
                    value={priceTier}
                    onChange={(e) => setPriceTier(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#1E293B', color: 'white', outline: 'none' }}
                  >
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '6px', color: 'var(--text-muted)' }}>Price (RM)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }}
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button 
            onClick={handleCreateTheme}
            disabled={createLoading}
            className="btn btn-primary"
            style={{ 
              padding: '16px', 
              fontSize: '1.1rem', 
              fontWeight: 'bold', 
              width: '100%',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              cursor: createLoading ? 'not-allowed' : 'pointer',
              opacity: createLoading ? 0.7 : 1
            }}
          >
            {createLoading ? 'Publishing...' : 'Put on Sale 🚀'}
          </button>

        </div>

        {/* Right Preview */}
        <div>
          <h3 style={{ margin: '0 0 16px', color: 'white' }}>Live Preview</h3>
          <div style={{ 
            background: '#1E293B', 
            borderRadius: '24px', 
            padding: '12px', 
            border: '8px solid #000',
            height: '600px', 
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            position: 'relative'
          }}>
            <iframe 
              ref={iframeRef}
              src={iframeSrc}
              style={{ width: '100%', height: '100%', border: 'none', borderRadius: '12px' }}
              title="Theme Preview"
              onLoad={handleIframeLoad}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
