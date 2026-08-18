'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

function SuccessContent() {
  const searchParams = useSearchParams();
  const urlThemeId = searchParams.get('theme_id');
  const urlCode = searchParams.get('code');
  const urlError = searchParams.get('error');
  const sessionId = searchParams.get('session_id');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState(null);
  const [themeCode, setThemeCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (urlError === 'payment_failed') {
      setError('Payment processing failed. Please try again.');
      setLoading(false);
      return;
    }

    async function processSuccess() {
      try {
        let finalThemeId = urlThemeId;
        let finalCode = urlCode;

        // If it's a Stripe redirection, we have a session_id
        if (sessionId) {
          const res = await fetch('/api/verify-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId })
          });
          const verifyData = await res.json();
          if (!res.ok) throw new Error(verifyData.error || 'Failed to verify session');
          
          finalCode = verifyData.code;
          finalThemeId = verifyData.theme_id;
        }

        if (!finalThemeId) {
          throw new Error('Missing theme details.');
        }

        // Fetch theme details from Supabase with API fallback
        let themeData = null;
        const { data, error: dbError } = await supabase
          .from('themes')
          .select('*')
          .eq('id', finalThemeId)
          .single();

        if (data) {
          themeData = data;
        } else {
          try {
            const themesRes = await fetch('/api/themes');
            if (themesRes.ok) {
              const allThemes = await themesRes.json();
              themeData = allThemes.find(t => t.id === finalThemeId);
            }
          } catch (e) {
            console.error('Fallback fetch theme error:', e);
          }
        }

        if (!themeData) {
          throw new Error(dbError?.message || 'Theme not found.');
        }

        setTheme(themeData);

        if (finalCode) {
          setThemeCode(finalCode);
        } else {
          throw new Error('No valid theme code was generated for this transaction.');
        }

      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to retrieve theme and generate claim code.');
      } finally {
        setLoading(false);
      }
    }

    processSuccess();
  }, [urlThemeId, urlCode, sessionId, urlError]);

  const handleCopy = () => {
    if (!themeCode) return;
    navigator.clipboard.writeText(themeCode)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => console.error('Failed to copy code:', err));
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#03000a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '3px solid rgba(255,255,255,0.1)',
          borderTopColor: '#10B981',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }} />
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin { to { transform: rotate(360deg); } }
        `}} />
        <p style={{ fontSize: '0.9rem', color: '#94A3B8', fontWeight: 600 }}>Unlocking Theme Code...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#03000a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{
          background: 'rgba(15, 23, 42, 0.45)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: '20px',
          padding: '32px',
          width: '100%',
          maxWidth: '460px',
          textAlign: 'center',
          backdropFilter: 'blur(16px)'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#EF4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h3 style={{ color: '#F87171', fontSize: '1.25rem', fontWeight: 800, margin: '0 0 10px 0' }}>Purchase Error</h3>
          <p style={{ color: '#94A3B8', fontSize: '0.88rem', margin: '0 0 24px 0', lineHeight: 1.5 }}>{error}</p>
          <Link href="/" style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '10px',
            textDecoration: 'none',
            fontSize: '0.88rem',
            fontWeight: 700
          }}>
            Return to Store
          </Link>
        </div>
      </div>
    );
  }

  const isPremium = theme.price_tier === 'premium';
  const tierColor = isPremium ? '#F59E0B' : '#8B5CF6';
  const tierBg = isPremium ? 'rgba(245, 158, 11, 0.1)' : 'rgba(139, 92, 246, 0.1)';
  const tierBorder = isPremium ? 'rgba(245, 158, 11, 0.25)' : 'rgba(139, 92, 246, 0.25)';

  return (
    <div style={{
      minHeight: '100vh',
      background: '#03000a',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <img src="/SEEPORT_LOGO_WHITE_A.svg" alt="Seeport Logo" style={{ height: '48px', margin: '0 auto 12px auto' }} />
        <span style={{ display: 'block', fontSize: '1.1rem', fontWeight: 800, color: 'white', letterSpacing: '0.5px' }}>
          Seeport Storefront
        </span>
      </div>

      {/* Main Success Container */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.45)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        padding: '36px 32px',
        width: '100%',
        maxWidth: '520px',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.45)'
      }}>
        {/* Success Icon */}
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          color: '#10B981',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px auto'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, textAlign: 'center', margin: '0 0 6px 0', letterSpacing: '-0.3px' }}>
          {theme.price == 0 ? 'Theme Claimed Successfully!' : 'Payment Successful!'}
        </h2>
        <p style={{ fontSize: '0.88rem', color: '#94A3B8', textAlign: 'center', margin: '0 0 28px 0' }}>
          {theme.price == 0 ? 'Enjoy your free theme. Your theme code is unlocked below.' : 'Thank you for your purchase. Your theme code is unlocked below.'}
        </p>

        {/* Purchased Theme Overview Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.2)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '16px',
          padding: '14px 20px',
          marginBottom: '28px'
        }}>
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 700 }}>{theme.name}</h4>
            <span style={{
              display: 'inline-block',
              fontSize: '0.72rem',
              fontWeight: 800,
              color: tierColor,
              background: tierBg,
              border: `1px solid ${tierBorder}`,
              padding: '2px 8px',
              borderRadius: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {theme.price_tier}
            </span>
          </div>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>
            RM {parseFloat(theme.price).toFixed(2)}
          </span>
        </div>

        {/* Copyable Code Container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '36px' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#F472B6', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>
            Your Chrome Extension Theme Code
          </label>
          <div style={{ position: 'relative', width: '100%', maxWidth: '400px', margin: '0 auto' }}>
            <input
              readOnly
              value={themeCode}
              style={{
                width: '100%',
                background: 'rgba(236, 72, 153, 0.05)',
                border: '2px solid rgba(236, 72, 153, 0.3)',
                color: '#fff',
                padding: '24px 16px',
                borderRadius: '16px',
                outline: 'none',
                fontSize: '1.6rem',
                fontWeight: 900,
                fontFamily: 'monospace',
                textAlign: 'center',
                letterSpacing: '3px',
                textShadow: '0 0 15px rgba(236, 72, 153, 0.8), 0 0 30px rgba(236, 72, 153, 0.5)',
                boxShadow: '0 0 30px rgba(236, 72, 153, 0.15) inset, 0 10px 30px rgba(236, 72, 153, 0.2)',
                transition: 'all 0.3s ease'
              }}
              onClick={(e) => {
                e.target.select();
                e.target.style.borderColor = '#F472B6';
                e.target.style.boxShadow = '0 0 40px rgba(236, 72, 153, 0.3) inset, 0 10px 40px rgba(236, 72, 153, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'rgba(236, 72, 153, 0.3)';
                e.target.style.boxShadow = '0 0 30px rgba(236, 72, 153, 0.15) inset, 0 10px 30px rgba(236, 72, 153, 0.2)';
              }}
            />
            <button
              onClick={handleCopy}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: copied ? '#10B981' : 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)',
                border: 'none',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: copied ? '0 4px 15px rgba(16, 185, 129, 0.3)' : '0 4px 15px rgba(244, 63, 94, 0.4)'
              }}
            >
              {copied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tutorial Section */}
        <div style={{
          background: 'rgba(0,0,0,0.25)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '32px',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 700, color: '#E2E8F0' }}>
            How to use this code?
          </h4>
          <p style={{ fontSize: '0.82rem', color: '#94A3B8', margin: '0 0 16px 0', lineHeight: 1.5 }}>
            Copy the code above and paste it into the <strong>"Redeem Code"</strong> section inside the Seeport Chrome Extension to instantly unlock your theme.
          </p>
          <div style={{ 
            borderRadius: '12px', 
            overflow: 'hidden', 
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}>
            <img 
              src="https://qodrnrewzwrcejelcbwl.supabase.co/storage/v1/object/public/assets/tutorial_claim_1786184078571.gif" 
              alt="Tutorial Claim Theme" 
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>
        </div>

        {/* Return Button */}
        <Link href="/" style={{
          display: 'block',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)',
          color: 'white',
          padding: '14px',
          borderRadius: '12px',
          fontWeight: 800,
          textDecoration: 'none',
          fontSize: '0.9rem',
          boxShadow: '0 4px 15px rgba(244, 63, 94, 0.2)',
          transition: 'transform 0.2s'
        }} onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'} onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}>
          Back to Store
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#03000a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
        Loading Invoice...
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
