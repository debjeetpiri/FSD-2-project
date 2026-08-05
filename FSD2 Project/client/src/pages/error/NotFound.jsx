import { Link } from 'react-router-dom';
import { SearchX, Home } from 'lucide-react';

const NotFoundPage = () => (
  <div style={{ minHeight: 'calc(100vh - 72px)', display: 'grid', placeItems: 'center', padding: '2rem' }}>
    <div className="card animate-scaleIn" style={{ textAlign: 'center', maxWidth: 480, padding: '3rem 2rem' }}>
      <div style={{
        width: 80, height: 80, borderRadius: 'var(--radius-lg)',
        background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.25)',
        display: 'grid', placeItems: 'center', margin: '0 auto 1.5rem',
        color: 'var(--clr-primary-light)',
      }}>
        <SearchX size={40} />
      </div>
      <h1 style={{ fontSize: '4rem', fontFamily: 'var(--font-display)', lineHeight: 1 }}>404</h1>
      <h2 style={{ marginBlock: '0.5rem 1rem' }}>Page Not Found</h2>
      <p className="text-muted" style={{ marginBottom: '2rem' }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="btn btn-primary">
        <Home size={16} /> Back to Home
      </Link>
    </div>
  </div>
);

export default NotFoundPage;
