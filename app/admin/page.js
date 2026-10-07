'use client';

import { useState, useRef, useEffect } from 'react';
import AdminHeader from '../components/admin/AdminHeader';
import ThemeEditorForm from '../components/admin/ThemeEditorForm';
import LivePreviewPanel from '../components/admin/LivePreviewPanel';

export default function AdminContent() {
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

  const iframeRef = useRef(null);

  useEffect(() => {
    setIframeSrc(`/extension-preview/sidepanel.html?v=${Date.now()}`);
  }, []);

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
        if (parsed.colors) {
          setBgColor(parsed.colors['--bg-color'] || parsed.colors.background || '');
          setCardColor(parsed.colors['--surface-color'] || parsed.colors['--surface'] || parsed.colors.card || '');
          const crdOp = parsed.colors['--surface-opacity'] !== undefined ? parseFloat(parsed.colors['--surface-opacity']) : 1.0;
          setCardOpacity(isNaN(crdOp) ? 1.0 : crdOp);
          setCardMaterial((parsed.layout && parsed.layout.cardMaterial) || parsed.colors.cardMaterial || 'flat');
          setAccentColor(parsed.colors['--primary'] || parsed.colors['--accent-color'] || parsed.colors.accent || parsed.colors.primary || '');
          setTextColor(parsed.colors['--text-color'] || parsed.colors['--text-primary'] || parsed.colors.text || '');
          setBorderColor(parsed.colors['--border-color'] || parsed.colors['--border'] || parsed.colors.borderColor || '');
          setTopBarColor(parsed.colors['--header-bg'] || parsed.colors.headerBg || '');
          setTopBarImage(parsed.colors['--header-bg-image'] || parsed.colors.headerBgImage || '');
          const topOp = parsed.colors['--header-bg-opacity'] !== undefined ? parseFloat(parsed.colors['--header-bg-opacity']) : 1.0;
          setTopBarOpacity(isNaN(topOp) ? 1.0 : topOp);
          setBottomBarColor(parsed.colors['--footer-bg'] || parsed.colors.footerBg || '');
          setBottomBarImage(parsed.colors['--footer-bg-image'] || parsed.colors.footerBgImage || '');
          const botOp = parsed.colors['--footer-bg-opacity'] !== undefined ? parseFloat(parsed.colors['--footer-bg-opacity']) : 1.0;
          setBottomBarOpacity(isNaN(botOp) ? 1.0 : botOp);
        } else {
          setBgColor(''); setCardColor(''); setCardOpacity(1.0); setCardMaterial('flat');
          setAccentColor(''); setTextColor(''); setBorderColor('');
          setTopBarColor(''); setTopBarImage(''); setTopBarOpacity(1.0);
          setBottomBarColor(''); setBottomBarImage(''); setBottomBarOpacity(1.0);
        }
        if (parsed.typography && parsed.typography.fontFamily) {
          setFontFamily(parsed.typography.fontFamily);
        } else {
          setFontFamily('');
        }
      } catch {
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
    reader.onload = (event) => setProductImage(event.target.result);
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setFileName(''); setBgUrl(''); setBgOpacity(1.0); setBgColor('');
    setCardColor(''); setCardOpacity(1.0); setCardMaterial('flat');
    setAccentColor(''); setTextColor(''); setBorderColor('');
    setTopBarColor(''); setTopBarImage(''); setTopBarOpacity(1.0);
    setBottomBarColor(''); setBottomBarImage(''); setBottomBarOpacity(1.0);
    setFontFamily(''); setProductImage(''); setProductImageName('');
    setThemeData({});
  };

  const handleApplyPreview = () => {
    try {
      if (!iframeRef.current?.contentWindow) { alert('Iframe not ready yet'); return; }
      const colorsObj = themeData.colors || {};
      if (bgColor) { colorsObj['--bg-color'] = bgColor; colorsObj.background = bgColor; }
      if (cardColor) { colorsObj['--surface'] = cardColor; colorsObj['--surface-color'] = cardColor; colorsObj['--surface-opacity'] = String(cardOpacity); colorsObj.card = cardColor; }
      if (cardMaterial) { colorsObj.cardMaterial = cardMaterial; }
      if (accentColor) { colorsObj['--primary'] = accentColor; colorsObj['--accent-color'] = accentColor; colorsObj.accent = accentColor; colorsObj.primary = accentColor; }
      if (textColor) { colorsObj['--text-color'] = textColor; colorsObj['--text-primary'] = textColor; colorsObj.text = textColor; }
      if (borderColor) { colorsObj['--border-color'] = borderColor; colorsObj['--border'] = borderColor; colorsObj.borderColor = borderColor; }
      if (topBarColor) { colorsObj['--header-bg'] = topBarColor; colorsObj.headerBg = topBarColor; }
      if (topBarImage) { colorsObj['--header-bg-image'] = topBarImage; colorsObj.headerBgImage = topBarImage; colorsObj['--header-bg-opacity'] = String(topBarOpacity); }
      if (bottomBarColor) { colorsObj['--footer-bg'] = bottomBarColor; colorsObj.footerBg = bottomBarColor; }
      if (bottomBarImage) { colorsObj['--footer-bg-image'] = bottomBarImage; colorsObj.footerBgImage = bottomBarImage; colorsObj['--footer-bg-opacity'] = String(bottomBarOpacity); }
      let cleanUrl = bgUrl.trim();
      if (cleanUrl.startsWith("url('") && cleanUrl.endsWith("')")) cleanUrl = cleanUrl.slice(5, -2);
      else if (cleanUrl.startsWith('url(') && cleanUrl.endsWith(')')) cleanUrl = cleanUrl.slice(4, -1);
      if (cleanUrl) {
        colorsObj['--animation-url'] = `url('${cleanUrl}')`;
        if (!colorsObj['--animation-name'] || colorsObj['--animation-name'] === 'none') colorsObj['--animation-name'] = 'none';
        if (!colorsObj['--animation-opacity'] || parseFloat(colorsObj['--animation-opacity']) !== parseFloat(bgOpacity)) colorsObj['--animation-opacity'] = bgOpacity.toString();
      }
      let animPayload = themeData.animation || {};
      if (colorsObj['--animation-url']) {
        animPayload = { type: colorsObj['--animation-name'] && colorsObj['--animation-name'] !== 'none' ? colorsObj['--animation-name'] : 'gif-loop', speed: parseInt(colorsObj['--animation-duration'] || animPayload.speed || 15000), assetUrl: colorsObj['--animation-url'], opacity: parseFloat(colorsObj['--animation-opacity'] || animPayload.opacity || 0) };
      } else if (!themeData.animation) {
        animPayload = { type: colorsObj['--animation-name'] || 'none', speed: parseInt(colorsObj['--animation-duration'] || 15000), assetUrl: 'none', opacity: 0 };
      }
      const typoObj = { ...(themeData.typography || {}) };
      if (fontFamily.trim()) typoObj.fontFamily = fontFamily.trim();
      const layoutObj = themeData.layout || {};
      if (cardMaterial) layoutObj.cardMaterial = cardMaterial;
      iframeRef.current.contentWindow.postMessage({ type: 'THEME_UPDATE', payload: { id: 'new_theme_preview', name: themeName || themeData.name || 'New Theme Preview', colors: colorsObj, animation: animPayload, typography: typoObj, layout: layoutObj } }, '*');
      setPreviewClicked(true);
      setTimeout(() => setPreviewClicked(false), 2000);
    } catch (error) {
      console.error(error);
      alert('Error applying preview: ' + error.message);
    }
  };

  const handleCreateTheme = async () => {
    if (!themeName.trim()) { alert('Please enter a theme name'); return; }
    setCreateLoading(true);
    try {
      const finalThemeData = JSON.parse(JSON.stringify(themeData));
      if (!finalThemeData.layout) finalThemeData.layout = {};
      finalThemeData.layout.cardMaterial = cardMaterial;
      if (!finalThemeData.colors) finalThemeData.colors = {};
      if (bgColor) { finalThemeData.colors['--bg-color'] = bgColor; finalThemeData.colors.background = bgColor; }
      if (cardColor) { finalThemeData.colors['--surface'] = cardColor; finalThemeData.colors['--surface-color'] = cardColor; finalThemeData.colors['--surface-opacity'] = String(cardOpacity); finalThemeData.colors.card = cardColor; }
      if (cardMaterial) finalThemeData.colors.cardMaterial = cardMaterial;
      if (accentColor) { finalThemeData.colors['--primary'] = accentColor; finalThemeData.colors['--accent-color'] = accentColor; finalThemeData.colors.accent = accentColor; finalThemeData.colors.primary = accentColor; }
      if (textColor) { finalThemeData.colors['--text-color'] = textColor; finalThemeData.colors['--text-primary'] = textColor; finalThemeData.colors.text = textColor; }
      if (borderColor) { finalThemeData.colors['--border-color'] = borderColor; finalThemeData.colors['--border'] = borderColor; finalThemeData.colors.borderColor = borderColor; }
      if (topBarColor) { finalThemeData.colors['--header-bg'] = topBarColor; finalThemeData.colors.headerBg = topBarColor; }
      if (topBarImage) { finalThemeData.colors['--header-bg-image'] = topBarImage; finalThemeData.colors.headerBgImage = topBarImage; finalThemeData.colors['--header-bg-opacity'] = String(topBarOpacity); }
      if (bottomBarColor) { finalThemeData.colors['--footer-bg'] = bottomBarColor; finalThemeData.colors.footerBg = bottomBarColor; }
      if (bottomBarImage) { finalThemeData.colors['--footer-bg-image'] = bottomBarImage; finalThemeData.colors.footerBgImage = bottomBarImage; finalThemeData.colors['--footer-bg-opacity'] = String(bottomBarOpacity); }
      if (fontFamily.trim()) { if (!finalThemeData.typography) finalThemeData.typography = {}; finalThemeData.typography.fontFamily = fontFamily.trim(); }
      if (productImage.trim()) finalThemeData.product_image = productImage.trim();
      let cleanUrl = bgUrl.trim();
      if (cleanUrl.startsWith("url('") && cleanUrl.endsWith("')")) cleanUrl = cleanUrl.slice(5, -2);
      else if (cleanUrl.startsWith('url(') && cleanUrl.endsWith(')')) cleanUrl = cleanUrl.slice(4, -1);
      if (cleanUrl) {
        finalThemeData.colors['--animation-url'] = `url('${cleanUrl}')`;
        if (!finalThemeData.colors['--animation-opacity'] || parseFloat(finalThemeData.colors['--animation-opacity']) !== parseFloat(bgOpacity)) finalThemeData.colors['--animation-opacity'] = bgOpacity.toString();
      }
      const res = await fetch('/api/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: themeName, price_tier: priceTier, price: parseFloat(price).toFixed(2), category, theme_data: finalThemeData })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save theme');
      alert(`Theme "${themeName}" put on sale successfully!`);
      setThemeName(''); setPrice(3.00); setPriceTier('standard'); setFileName(''); setBgUrl('');
    } catch (err) {
      console.error(err);
      alert('Failed to save theme: ' + err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-color)', fontFamily: 'var(--font-sans)', padding: '40px' }}>
      <AdminHeader />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '40px' }}>
        <ThemeEditorForm
          fileName={fileName} onFileUpload={handleFileUpload}
          productImageName={productImageName} onImageUpload={handleImageUpload}
          bgColor={bgColor} onBgColorChange={setBgColor}
          cardColor={cardColor} onCardColorChange={setCardColor}
          cardOpacity={cardOpacity} onCardOpacityChange={setCardOpacity}
          cardMaterial={cardMaterial} onCardMaterialChange={setCardMaterial}
          accentColor={accentColor} onAccentColorChange={setAccentColor}
          textColor={textColor} onTextColorChange={setTextColor}
          borderColor={borderColor} onBorderColorChange={setBorderColor}
          topBarColor={topBarColor} onTopBarColorChange={setTopBarColor}
          topBarImage={topBarImage} onTopBarImageChange={setTopBarImage}
          topBarOpacity={topBarOpacity} onTopBarOpacityChange={setTopBarOpacity}
          bottomBarColor={bottomBarColor} onBottomBarColorChange={setBottomBarColor}
          bottomBarImage={bottomBarImage} onBottomBarImageChange={setBottomBarImage}
          bottomBarOpacity={bottomBarOpacity} onBottomBarOpacityChange={setBottomBarOpacity}
          fontFamily={fontFamily} onFontFamilyChange={setFontFamily}
          bgUrl={bgUrl} onBgUrlChange={setBgUrl}
          bgOpacity={bgOpacity} onBgOpacityChange={setBgOpacity}
          previewClicked={previewClicked} onApplyPreview={handleApplyPreview} onReset={handleReset}
          themeName={themeName} onThemeNameChange={setThemeName}
          category={category} onCategoryChange={setCategory}
          priceTier={priceTier} onPriceTierChange={setPriceTier}
          price={price} onPriceChange={setPrice}
          createLoading={createLoading} onCreateTheme={handleCreateTheme}
        />
        <LivePreviewPanel
          iframeRef={iframeRef}
          iframeSrc={iframeSrc}
          onLoad={handleApplyPreview}
        />
      </div>
    </div>
  );
}
