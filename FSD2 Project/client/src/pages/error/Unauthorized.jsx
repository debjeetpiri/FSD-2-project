import { Link } from 'react-router-dom';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import { useAuth, getDashboardPath } from '../../context/AuthContext';

const UnauthorizedPage = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div style={{ minHeight: 'calc(100vh - 72px)', display: 'grid', placeItems: 'center', padding: '2rem' }}>
      <div className="card animate-scaleIn" style={{ textAlign: 'center', maxWidth: 480, padding: '3rem 2rem' }}>
        <div style={{
          width: 80, height: 80, borderRadius: 'var(--radius-lg)',
          background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.25)',
          display: 'grid', placeItems: 'center', margin: '0 auto 1.5rem',
          color: '#f87171',
        }}>
          <ShieldX size={40} />
        </div>

        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Access Denied</h1>
        <p className="text-muted" style={{ marginBottom: '2rem', lineHeight: 1.6 }}>
          You don't have permission to view this page.
          Please contact your administrator if you believe this is a mistake.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => window.history.back()}>
            <ArrowLeft size={16} /> Go Back
          </button>
          <Link
            to={isAuthenticated ? getDashboardPath(user?.role) : '/'}
            className="btn btn-primary"
          >
            <Home size={16} /> {isAuthenticated ? 'Dashboard' : 'Home'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
