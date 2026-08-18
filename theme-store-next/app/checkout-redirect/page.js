'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CheckoutRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const themeId = searchParams.get('theme_id');
  const isFree = searchParams.get('is_free') === 'true';
  const [status, setStatus] = useState(isFree ? 'Preparing your free theme...' : 'Redirecting to payment gateway...');
  const [dots, setDots] = useState('');

  // Pulsing dot animation
  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);
    return () => clearInterval(dotInterval);
  }, []);

  useEffect(() => {
    if (!themeId) {
      router.push('/');
      return;
    }

    const processCheckout = async () => {
      try {
        setStatus(isFree ? 'Generating license key...' : 'Securing payment tunnel...');
        await new Promise(resolve => setTimeout(resolve, 600));
        
        setStatus(isFree ? 'Finalizing claim...' : 'Authorizing checkout transaction...');
        
        const currencyParam = searchParams.get('currency') || 'MYR';
        // Call the new checkout API
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme_id: themeId, currency: currencyParam })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          if (data.url) {
            setStatus('Redirecting to Stripe Checkout...');
            await new Promise(resolve => setTimeout(resolve, 500));
            // Redirect to Stripe
            window.location.href = data.url;
          } else if (data.code) {
            setStatus('Transaction successful! Redirecting...');
            await new Promise(resolve => setTimeout(resolve, 500));
            // Redirect with the generated code (free themes)
            router.push(`/success?code=${data.code}&theme_id=${themeId}`);
          }
        } else {
          throw new Error(data.error || 'Failed to process checkout');
        }
      } catch (err) {
        console.error('Checkout error:', err);
        setStatus('Transaction failed. Redirecting...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        router.push(`/success?theme_id=${themeId}&error=payment_failed`);
      }
    };

    processCheckout();

  }, [themeId, router]);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#03000a',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Glow Backdrop */}
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        background: 'rgba(236, 72, 153, 0.15)',
        filter: 'blur(80px)',
        borderRadius: '50%',
        zIndex: 0
      }} />

      {/* Main Glass Box */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.45)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        padding: '40px 32px',
        width: '100%',
        maxWidth: '420px',
        textAlign: 'center',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
        zIndex: 1,
        position: 'relative'
      }}>
        {/* Animated Spin Loader */}
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          border: '4px solid rgba(236, 72, 153, 0.1)',
          borderTopColor: '#EC4899',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 24px auto'
        }} />
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}} />

        {/* Lock/Gift Icon Indicator */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: isFree ? 'rgba(16, 185, 129, 0.08)' : 'rgba(236, 72, 153, 0.08)',
          border: `1px solid ${isFree ? 'rgba(16, 185, 129, 0.25)' : 'rgba(236, 72, 153, 0.25)'}`,
          padding: '6px 14px',
          borderRadius: '99px',
          fontSize: '0.78rem',
          fontWeight: 700,
          color: isFree ? '#10B981' : '#F472B6',
          marginBottom: '16px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {isFree ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 12 20 22 4 22 4 12"></polyline>
              <rect x="2" y="7" width="20" height="5"></rect>
              <line x1="12" y1="22" x2="12" y2="7"></line>
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          )}
          {isFree ? 'Free Theme Claim' : 'Secure Checkout'}
        </div>

        {/* Processing Text */}
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', margin: '0 0 8px 0', letterSpacing: '-0.3px' }}>
          {searchParams.get('is_free') === 'true' ? 'Claiming Free Theme' : 'Seeport Payment Gateway'}
        </h3>
        <p style={{ fontSize: '0.88rem', color: '#94A3B8', margin: 0, height: '24px' }}>
          {status}{dots}
        </p>
      </div>
    </div>
  );
}

export default function CheckoutRedirectPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#03000a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
        Loading Checkout...
      </div>
    }>
      <CheckoutRedirectContent />
    </Suspense>
  );
}
