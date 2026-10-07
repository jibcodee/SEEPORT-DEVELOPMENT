'use client';

export default function DonationBanner({ currency, coffeeDonation, onDonationChange }) {
  const symbol = currency === 'USD' ? '$' : 'RM';

  return (
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
          onChange={(e) => onDonationChange(e.target.value)}
          style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
        />
      </div>

      <button
        className="btn"
        style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
        onClick={() => alert(`Terima kasih belanja Nasi Lemak sebanyak ${symbol}${coffeeDonation}! 🍛`)}
      >
        Donate {symbol}{coffeeDonation}
      </button>
    </div>
  );
}
