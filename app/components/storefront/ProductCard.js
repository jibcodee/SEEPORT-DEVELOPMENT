'use client';

function getPrice(theme, rate) {
  const baseMyr = theme && theme.price !== undefined && theme.price !== null
    ? parseFloat(theme.price)
    : (theme && theme.price_tier === 'premium' ? 4.0 : 3.0);
  return baseMyr * rate;
}

export default function ProductCard({ theme, isPreviewActive, currency, rate, onPreview, onBuy }) {
  const symbol = currency === 'USD' ? '$' : 'RM';
  const price = getPrice(theme, rate);
  const priceStr = `${symbol}${price.toFixed(2)}`;
  const isFree = price === 0;
  const isPremium = theme.price_tier === 'premium';

  const colors = theme.theme_data || {};
  const bgVal = colors['--bg-color'] || colors['--bg'] || '#0F172A';
  const surfaceVal = colors['--card-bg'] || colors['--surface'] || '#1E293B';
  const textVal = colors['--text-color'] || colors['--text-primary'] || '#F8FAFC';
  const accentVal = colors['--accent-color'] || colors['--primary'] || '#6366F1';

  return (
    <div
      className={`product-card-glass ${isPreviewActive ? 'active' : ''}`}
      style={{ '--primary': accentVal }}
    >
      {/* Badge */}
      <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 2 }}>
        {isPremium ? (
          <span style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', color: 'white', fontSize: '0.72rem', fontWeight: 800, padding: '4px 10px', borderRadius: 'var(--radius-full)', letterSpacing: '0.8px', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)' }}>PREMIUM</span>
        ) : (
          <span style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', borderRadius: 'var(--radius-full)', letterSpacing: '0.8px' }}>STANDARD</span>
        )}
      </div>

      {/* Preview Image / Mini Mock UI */}
      <div
        onClick={() => onPreview(theme)}
        style={{ height: '160px', borderRadius: '12px', background: `linear-gradient(135deg, ${bgVal} 0%, ${surfaceVal} 100%)`, border: `1px solid ${accentVal}44`, boxShadow: `0 8px 24px ${accentVal}25`, marginBottom: '18px', cursor: 'pointer', overflow: 'hidden', position: 'relative', transition: 'transform 0.2s ease, border-color 0.2s ease' }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      >
        {theme.theme_data?.product_image ? (
          <img src={theme.theme_data.product_image} alt={`${theme.name} Showcase`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ padding: '12px', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
              <div style={{ marginLeft: 'auto', height: '6px', width: '60px', background: `${textVal}22`, borderRadius: '4px' }} />
            </div>
            <div style={{ background: surfaceVal, border: `1px solid ${accentVal}33`, borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ height: '8px', width: '70%', background: accentVal, borderRadius: '4px', opacity: 0.9 }} />
              <div style={{ height: '6px', width: '90%', background: textVal, opacity: 0.5, borderRadius: '3px' }} />
              <div style={{ height: '6px', width: '50%', background: textVal, opacity: 0.3, borderRadius: '3px' }} />
            </div>
            <div style={{ position: 'absolute', bottom: '10px', right: '10px', display: 'flex', gap: '4px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: bgVal, border: '1px solid rgba(255,255,255,0.2)' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: surfaceVal, border: '1px solid rgba(255,255,255,0.2)' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: accentVal }} />
            </div>
          </div>
        )}
      </div>

      {/* Title & Price */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
        <div>
          <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            {theme.price_tier} Theme
          </span>
          <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>{theme.name}</h3>
        </div>
        <span style={{ color: 'var(--primary)', fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-display)', whiteSpace: 'nowrap' }}>{priceStr}</span>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', position: 'relative', zIndex: 10 }}>
        <button
          className="btn btn-secondary"
          style={{ flex: 1, padding: '11px 0', fontSize: '0.88rem', fontWeight: 700, borderRadius: 'var(--radius-md)', background: isPreviewActive ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255,255,255,0.06)', borderColor: isPreviewActive ? 'rgba(244, 63, 94, 0.4)' : 'rgba(255,255,255,0.15)', color: isPreviewActive ? 'var(--primary)' : 'white' }}
          onClick={(e) => { e.stopPropagation(); onPreview(theme); }}
        >
          {isPreviewActive ? 'Viewing Demo' : 'Try Demo'}
        </button>
        <button
          className="btn"
          style={{ flex: 1, padding: '11px 0', fontSize: '0.88rem', fontWeight: 800, borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)', color: 'white', border: 'none', boxShadow: '0 4px 15px rgba(244, 63, 94, 0.3)', cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); onBuy(theme); }}
        >
          {isFree ? 'Get for Free' : 'Buy Theme'}
        </button>
      </div>
    </div>
  );
}
