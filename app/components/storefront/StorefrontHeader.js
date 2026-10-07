'use client';

export default function StorefrontHeader({ isNavVisible, searchQuery, onSearchChange, activeCategory, onCategoryChange }) {
  const categories = ['All Categories', 'Premium', 'Standard'];
  
  return (
    <header
      className={`ecommerce-header ${isNavVisible ? 'visible' : 'hidden'}`}
      style={{
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '16px 40px',
        position: 'fixed', top: 0, width: '100%', zIndex: 100,
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)'
      }}
    >
      <div className="header-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
        {/* Brand */}
        <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/seeport-logo.svg" alt="Seeport Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          <span style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.5px', color: 'white', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
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
              onChange={(e) => onSearchChange(e.target.value)}
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
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat)}
                style={{
                  padding: '8px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600,
                  border: '1px solid',
                  borderColor: activeCategory === cat ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                  background: activeCategory === cat ? 'rgba(244, 63, 94, 0.15)' : 'rgba(255,255,255,0.03)',
                  color: activeCategory === cat ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="header-actions" style={{ display: 'flex', gap: '15px', alignItems: 'center' }} />
      </div>
    </header>
  );
}
