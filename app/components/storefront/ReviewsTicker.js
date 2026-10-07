'use client';
import { useState, useEffect, useMemo } from 'react';

export default function ReviewsTicker({ reviews, activeThemeId }) {
  const [reviewIdx, setReviewIdx] = useState(0);

  const filteredReviews = useMemo(() => {
    if (!activeThemeId) return reviews;
    const matched = reviews.filter(r => r.theme_id === activeThemeId);
    return matched.length > 0 ? matched : reviews;
  }, [reviews, activeThemeId]);

  useEffect(() => { setReviewIdx(0); }, [activeThemeId]);

  useEffect(() => {
    if (filteredReviews.length <= 1) return;
    const interval = setInterval(() => {
      setReviewIdx(prev => (prev + 1) % filteredReviews.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [filteredReviews]);

  if (filteredReviews.length === 0) return null;

  const current = filteredReviews[reviewIdx % filteredReviews.length];

  return (
    <div style={{ marginTop: '16px', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', backdropFilter: 'blur(16px)', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)', transition: 'all 0.4s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: 'white', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {current?.customer_name?.substring(0, 2).toUpperCase() || 'CU'}
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: '0.88rem' }}>{current?.customer_name}</span>
        </div>
        <div style={{ color: '#FBBF24', fontSize: '0.85rem', letterSpacing: '2px' }}>{'★'.repeat(current?.rating || 5)}</div>
      </div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.4', marginBottom: '6px', fontStyle: 'italic' }}>"{current?.comment}"</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <span>Theme: <strong style={{ color: 'var(--primary)' }}>{current?.theme_name}</strong></span>
        <span style={{ opacity: 0.7 }}>Verified Buyer</span>
      </div>
    </div>
  );
}
