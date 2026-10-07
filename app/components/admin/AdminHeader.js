'use client';
import { useRouter } from 'next/navigation';

export default function AdminHeader() {
  const router = useRouter();
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
      <div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-1px', margin: 0 }}>Theme Publisher</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '5px' }}>Upload a JSON file, preview, and publish to the storefront.</p>
      </div>
      <button
        onClick={() => router.push('/')}
        className="btn btn-outline"
        style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white', cursor: 'pointer' }}
      >
        Back to Store
      </button>
    </div>
  );
}
