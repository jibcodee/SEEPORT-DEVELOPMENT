'use client';

export default function LivePreviewPanel({ iframeRef, iframeSrc, onLoad }) {
  return (
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
          onLoad={onLoad}
        />
      </div>
    </div>
  );
}
