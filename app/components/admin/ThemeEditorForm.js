'use client';

export default function ThemeEditorForm({
  // Upload state
  fileName, onFileUpload,
  productImageName, onImageUpload,
  // Color overrides
  bgColor, onBgColorChange,
  cardColor, onCardColorChange,
  cardOpacity, onCardOpacityChange,
  cardMaterial, onCardMaterialChange,
  accentColor, onAccentColorChange,
  textColor, onTextColorChange,
  borderColor, onBorderColorChange,
  topBarColor, onTopBarColorChange,
  topBarImage, onTopBarImageChange,
  topBarOpacity, onTopBarOpacityChange,
  bottomBarColor, onBottomBarColorChange,
  bottomBarImage, onBottomBarImageChange,
  bottomBarOpacity, onBottomBarOpacityChange,
  fontFamily, onFontFamilyChange,
  bgUrl, onBgUrlChange,
  bgOpacity, onBgOpacityChange,
  // Preview
  previewClicked, onApplyPreview, onReset,
  // Theme details
  themeName, onThemeNameChange,
  category, onCategoryChange,
  priceTier, onPriceTierChange,
  price, onPriceChange,
  // Submit
  createLoading, onCreateTheme
}) {
  const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' };
  const colorInputStyle = { width: '40px', height: '40px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' };
  const labelStyle = { display: 'block', fontSize: '0.9rem', marginBottom: '6px', color: 'var(--text-muted)' };
  const panelStyle = { background: 'rgba(15, 23, 42, 0.45)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Panel 1: File Upload + Color Overrides */}
      <div style={panelStyle}>
        <h3 style={{ margin: '0 0 16px', color: 'white' }}>1. Upload Theme JSON</h3>
        <input
          type="file"
          accept=".json"
          onChange={onFileUpload}
          style={{ display: 'block', width: '100%', padding: '12px', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', color: 'white' }}
        />
        {fileName && <p style={{ color: 'var(--primary)', marginTop: '10px', fontSize: '0.9rem' }}>Loaded: {fileName}</p>}

        {/* Product Image Upload */}
        <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <label style={{ display: 'block', fontSize: '1rem', fontWeight: 'bold', marginBottom: '8px', color: 'white' }}>2. Upload Product Image (Thumbnail)</label>
          <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Gambar ini akan dipaparkan di kedai menggantikan mock UI.</p>
          <input
            type="file"
            accept="image/png, image/jpeg, image/webp"
            onChange={onImageUpload}
            style={{ display: 'block', width: '100%', padding: '12px', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', color: 'white' }}
          />
          {productImageName && <p style={{ color: 'var(--primary)', marginTop: '10px', fontSize: '0.9rem' }}>Attached: {productImageName}</p>}
        </div>

        {/* Background Color */}
        <div style={{ marginTop: '20px' }}>
          <label style={labelStyle}>Background Color Override (Optional)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input type="color" value={bgColor || '#2b2b2b'} onChange={(e) => onBgColorChange(e.target.value)} style={colorInputStyle} />
            <input type="text" value={bgColor} onChange={(e) => onBgColorChange(e.target.value)} placeholder="#2b2b2b" style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none' }} />
          </div>
        </div>

        {/* Card Color */}
        <div style={{ marginTop: '20px' }}>
          <label style={labelStyle}>Tray Item (Card) Color Override (Optional)</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="color" value={cardColor || '#1e293b'} onChange={(e) => onCardColorChange(e.target.value)} style={colorInputStyle} />
              <input type="text" value={cardColor} onChange={(e) => onCardColorChange(e.target.value)} placeholder="#1e293b" style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
              <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', width: '90px' }}>Card Opacity</label>
              <input type="range" min="0" max="1" step="0.05" value={cardOpacity} onChange={(e) => onCardOpacityChange(parseFloat(e.target.value))} style={{ flex: 1 }} />
              <span style={{ fontSize: '0.85rem', color: 'white', minWidth: '30px' }}>{cardOpacity.toFixed(2)}</span>
            </div>
            <div style={{ marginTop: '4px' }}>
              <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '4px' }}>Card Material Effect</label>
              <select value={cardMaterial} onChange={(e) => onCardMaterialChange(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none', cursor: 'pointer' }}>
                <option value="flat">Flat / Solid (Default)</option>
                <option value="glassmorphism">Glassmorphism (Kaca)</option>
                <option value="waterdrop">Water Drop (Cecair)</option>
                <option value="neumorphism">Neumorphism (Timbul)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Accent Color */}
        <div style={{ marginTop: '20px' }}>
          <label style={labelStyle}>Primary / Accent Color Override (Optional)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input type="color" value={accentColor || '#4f46e5'} onChange={(e) => onAccentColorChange(e.target.value)} style={colorInputStyle} />
            <input type="text" value={accentColor} onChange={(e) => onAccentColorChange(e.target.value)} placeholder="#4f46e5 or rgba(79, 70, 229, 1)" style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none' }} />
          </div>
        </div>

        {/* Text Color */}
        <div style={{ marginTop: '20px' }}>
          <label style={labelStyle}>Text Color Override (Optional)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input type="color" value={textColor || '#ffffff'} onChange={(e) => onTextColorChange(e.target.value)} style={colorInputStyle} />
            <input type="text" value={textColor} onChange={(e) => onTextColorChange(e.target.value)} placeholder="e.g. #FFFFFF" style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }} />
          </div>
        </div>

        {/* Border Color */}
        <div style={{ marginTop: '20px' }}>
          <label style={labelStyle}>Line Border Color Override (Optional)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input type="color" value={borderColor || '#ffffff'} onChange={(e) => onBorderColorChange(e.target.value)} style={colorInputStyle} />
            <input type="text" value={borderColor} onChange={(e) => onBorderColorChange(e.target.value)} placeholder="e.g. rgba(255,255,255,0.2) or #FFFFFF" style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }} />
          </div>
        </div>

        {/* Top Bar */}
        <div style={{ marginTop: '20px' }}>
          <label style={labelStyle}>Top Bar Override (Optional)</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="color" value={topBarColor || '#ffffff'} onChange={(e) => onTopBarColorChange(e.target.value)} style={colorInputStyle} />
              <input type="text" value={topBarColor} onChange={(e) => onTopBarColorChange(e.target.value)} placeholder="Color e.g. rgba(0,0,0,0.8) or #1E293B" style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }} />
            </div>
            <input type="text" value={topBarImage} onChange={(e) => onTopBarImageChange(e.target.value)} placeholder="Image URL e.g. https://domain.com/image.gif" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
              <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', width: '90px' }}>Image Opacity</label>
              <input type="range" min="0" max="1" step="0.05" value={topBarOpacity} onChange={(e) => onTopBarOpacityChange(parseFloat(e.target.value))} style={{ flex: 1 }} />
              <span style={{ fontSize: '0.85rem', color: 'white', minWidth: '30px' }}>{topBarOpacity.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{ marginTop: '20px' }}>
          <label style={labelStyle}>Bottom Bar Override (Optional)</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="color" value={bottomBarColor || '#ffffff'} onChange={(e) => onBottomBarColorChange(e.target.value)} style={colorInputStyle} />
              <input type="text" value={bottomBarColor} onChange={(e) => onBottomBarColorChange(e.target.value)} placeholder="Color e.g. rgba(0,0,0,0.8) or #1E293B" style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }} />
            </div>
            <input type="text" value={bottomBarImage} onChange={(e) => onBottomBarImageChange(e.target.value)} placeholder="Image URL e.g. https://domain.com/image.gif" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
              <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', width: '90px' }}>Image Opacity</label>
              <input type="range" min="0" max="1" step="0.05" value={bottomBarOpacity} onChange={(e) => onBottomBarOpacityChange(parseFloat(e.target.value))} style={{ flex: 1 }} />
              <span style={{ fontSize: '0.85rem', color: 'white', minWidth: '30px' }}>{bottomBarOpacity.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Font */}
        <div style={{ marginTop: '20px' }}>
          <label style={labelStyle}>Font Override (Optional)</label>
          <select value={fontFamily} onChange={(e) => onFontFamilyChange(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none', appearance: 'none', cursor: 'pointer' }}>
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

        {/* Background Image URL */}
        <div style={{ marginTop: '20px' }}>
          <label style={labelStyle}>Background Image URL (Optional)</label>
          <input type="text" value={bgUrl} onChange={(e) => onBgUrlChange(e.target.value)} placeholder="e.g. https://media.giphy.com/... / .jpg / .png" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }} />
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: '6px', marginBottom: '16px' }}>Paste any GIF, JPG, PNG, or WEBP image link here to apply it to the template.</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={labelStyle}>Background Brightness (Opacity)</label>
            <span style={{ fontSize: '0.9rem', color: 'white', fontWeight: 'bold' }}>{Math.round(bgOpacity * 100)}%</span>
          </div>
          <input type="range" min="0.1" max="1.0" step="0.05" value={bgOpacity} onChange={(e) => onBgOpacityChange(parseFloat(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
        </div>

        {/* Reset + Preview Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          <button onClick={onReset} className="btn" style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s ease' }}>Reset</button>
          <button onClick={onApplyPreview} className="btn btn-primary" style={{ flex: 2, padding: '12px', background: previewClicked ? 'rgba(255,255,255,0.2)' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: previewClicked ? 'rgba(255,255,255,0.6)' : 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s ease' }}>
            {previewClicked ? 'Preview Sent ✓' : 'Push to Preview →'}
          </button>
        </div>
      </div>

      {/* Panel 2: Theme Details */}
      <div style={panelStyle}>
        <h3 style={{ margin: '0 0 16px', color: 'white' }}>2. Theme Details</h3>
        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Theme Name</label>
            <input type="text" value={themeName} onChange={(e) => onThemeNameChange(e.target.value)} placeholder="e.g. Neon Cyberpunk" style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select value={category} onChange={(e) => onCategoryChange(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#1E293B', color: 'white', outline: 'none' }}>
                <option>Dark Themes</option>
                <option>Animated Themes</option>
                <option>Light Themes</option>
                <option>Aesthetic</option>
                <option>Gaming</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Tier</label>
              <select value={priceTier} onChange={(e) => onPriceTierChange(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#1E293B', color: 'white', outline: 'none' }}>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Price (RM)</label>
            <input type="number" step="0.01" value={price} onChange={(e) => onPriceChange(e.target.value)} style={inputStyle} />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={onCreateTheme}
        disabled={createLoading}
        className="btn btn-primary"
        style={{ padding: '16px', fontSize: '1.1rem', fontWeight: 'bold', width: '100%', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', border: 'none', borderRadius: '12px', color: 'white', cursor: createLoading ? 'not-allowed' : 'pointer', opacity: createLoading ? 0.7 : 1 }}
      >
        {createLoading ? 'Publishing...' : 'Put on Sale 🚀'}
      </button>
    </div>
  );
}
