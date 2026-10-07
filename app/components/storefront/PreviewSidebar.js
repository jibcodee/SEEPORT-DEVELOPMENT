'use client';
import ReviewsTicker from './ReviewsTicker';

export default function PreviewSidebar({ activePreviewTheme, reviews, getIframeHtml }) {
  return (
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

      <ReviewsTicker
        reviews={reviews}
        activeThemeId={activePreviewTheme?.id}
      />
    </aside>
  );
}
