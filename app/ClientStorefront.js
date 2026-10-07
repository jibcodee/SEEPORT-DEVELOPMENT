'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getIframeHtml } from './lib/getIframeHtml';
import StorefrontHeader from './components/storefront/StorefrontHeader';
import DonationBanner from './components/storefront/DonationBanner';
import ProductCard from './components/storefront/ProductCard';
import PreviewSidebar from './components/storefront/PreviewSidebar';

export default function ClientStorefront({ initialThemes = [] }) {
  const router = useRouter();

  // Geo & Pricing
  const [currency, setCurrency] = useState('RM');
  const [rate, setRate] = useState(1);

  // UI State
  const [activePreviewTheme, setActivePreviewTheme] = useState(initialThemes.length > 0 ? initialThemes[0] : null);
  const [activeCategory, setActiveCategory] = useState('All Categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [coffeeDonation, setCoffeeDonation] = useState(5);

  // Reviews
  const [reviews, setReviews] = useState([]);

  // Scroll handler for nav visibility
  useEffect(() => {
    const handleScroll = () => setIsNavVisible(window.scrollY <= 15);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch reviews
  useEffect(() => {
    fetch('/api/reviews')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.reviews?.length > 0) setReviews(data.reviews);
      })
      .catch(err => console.error('Failed to fetch reviews:', err));
  }, []);

  // Geo detection for currency
  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data.country_code && data.country_code !== 'MY') {
          setCurrency('USD');
          setRate(0.22);
        }
      })
      .catch(err => console.error('IP Geolocation failed', err));
  }, []);

  const handleBuyTheme = (theme) => {
    const baseMyr = theme.price != null ? parseFloat(theme.price) : (theme.price_tier === 'premium' ? 4.0 : 3.0);
    const price = baseMyr * rate;
    const isFree = price === 0;
    router.push(`/checkout-redirect?theme_id=${theme.id}${isFree ? '&is_free=true' : ''}`);
  };

  const filteredThemes = initialThemes.filter((theme) => {
    const matchSearch = theme.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory =
      activeCategory === 'Premium' ? theme.price_tier === 'premium' :
      activeCategory === 'Standard' ? theme.price_tier === 'standard' : true;
    return matchSearch && matchCategory;
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-color)', fontFamily: 'var(--font-sans)', overflowX: 'hidden' }}>
      
      <StorefrontHeader
        isNavVisible={isNavVisible}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      <div className="store-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', padding: '24px', maxWidth: '1600px', margin: '0 auto', paddingTop: '90px' }}>
        
        {/* Left Side */}
        <div className="main-content">
          <style dangerouslySetInnerHTML={{ __html: `
            .product-card-glass {
              padding: 22px;
              background: rgba(15, 23, 42, 0.4);
              border: 1px solid rgba(255, 255, 255, 0.08);
              border-radius: 20px;
              backdrop-filter: blur(20px);
              -webkit-backdrop-filter: blur(20px);
              box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
              transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
              display: flex;
              flex-direction: column;
              position: relative;
              overflow: hidden;
            }
            .product-card-glass::before {
              content: '';
              position: absolute;
              top: 0; left: 0; right: 0; bottom: 0;
              border-radius: 20px;
              padding: 2px;
              background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 100%);
              -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
              -webkit-mask-composite: xor;
              mask-composite: exclude;
              opacity: 0.5;
              transition: opacity 0.4s ease;
              pointer-events: none;
            }
            .product-card-glass:hover {
              transform: translateY(-8px) scale(1.02);
              background: rgba(15, 23, 42, 0.6);
              border-color: rgba(255, 255, 255, 0.2);
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255,255,255,0.05);
            }
            .product-card-glass:hover::before { opacity: 1; }
            .product-card-glass.active {
              border-color: var(--primary, #F43F5E);
              box-shadow: 0 12px 30px rgba(244, 63, 94, 0.25), 0 0 0 1px var(--primary, #F43F5E);
            }
          `}} />

          <DonationBanner
            currency={currency}
            coffeeDonation={coffeeDonation}
            onDonationChange={setCoffeeDonation}
          />

          <section id="products-section">
            <div className="section-header"><h2>Featured Themes</h2></div>

            {filteredThemes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(15,23,42,0.4)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <h3 style={{ color: 'white', margin: '0 0 8px', fontSize: '1.2rem' }}>No Themes Found</h3>
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.92rem' }}>Try clearing your search or selecting another category.</p>
              </div>
            ) : (
              <div className="product-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '24px' }}>
                {filteredThemes.map((theme) => (
                  <ProductCard
                    key={theme.id}
                    theme={theme}
                    isPreviewActive={activePreviewTheme?.id === theme.id}
                    currency={currency}
                    rate={rate}
                    onPreview={setActivePreviewTheme}
                    onBuy={handleBuyTheme}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Side */}
        <PreviewSidebar
          activePreviewTheme={activePreviewTheme}
          reviews={reviews}
          getIframeHtml={getIframeHtml}
        />
      </div>
    </div>
  );
}
