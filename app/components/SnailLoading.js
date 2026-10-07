export default function SnailLoading({ title = "Loading...", subtitle = "Please wait a moment." }) {
  return (
    <div style={{ maxWidth: '600px', margin: '60px auto', textAlign: 'center', color: 'white', padding: '40px' }}>
      <div style={{ width: '100%', maxWidth: '360px', margin: '0 auto 24px', position: 'relative', height: '90px', borderBottom: '2px dashed rgba(255,255,255,0.15)', overflow: 'hidden' }}>
        <div className="snail-crawling">
          <img 
            src="/SEEPORT_LOGO_WHITE_A.svg" 
            alt="Loading..." 
            style={{ height: '76px', width: 'auto', display: 'block', filter: 'none' }} 
          />
        </div>
      </div>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 6px' }}>{title}</h2>
      {subtitle && <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', margin: 0 }}>{subtitle}</p>}
    </div>
  );
}
