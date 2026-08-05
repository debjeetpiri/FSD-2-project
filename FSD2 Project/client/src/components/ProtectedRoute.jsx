import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute
 *
 * Guards a route against unauthenticated access and optional role restrictions.
 *
 * Props:
 *   children    – The component(s) to render when access is granted.
 *   roles       – Array of allowed role strings, e.g. ['admin', 'faculty'].
 *                 If omitted (or empty), any authenticated user is allowed.
 *   redirectTo  – Override the fallback redirect path (default '/login').
 *
 * Behaviour matrix:
 *   ┌─────────────────────────┬──────────────────────────────────────┐
 *   │ State                   │ Result                               │
 *   ├─────────────────────────┼──────────────────────────────────────┤
 *   │ Initialising            │ Show full-screen spinner             │
 *   │ Not authenticated        │ Redirect to /login (with `from`)     │
 *   │ Authenticated, wrong role│ Redirect to /unauthorized            │
 *   │ Authenticated, right role│ Render children                      │
 *   └─────────────────────────┴──────────────────────────────────────┘
 */
const ProtectedRoute = ({ children, roles = [], redirectTo = '/login' }) => {
  const { isAuthenticated, user, initialising } = useAuth();
  const location = useLocation();

  /* ── 1. Wait for session validation to complete ─────────────────────────── */
  if (initialising) {
    return (
      <div className="page-loader">
        <div className="spinner" />
        <p className="text-muted text-sm">Verifying session…</p>
      </div>
    );
  }

  /* ── 2. Not logged in → redirect to login, remembering the attempted URL ── */
  if (!isAuthenticated) {
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  /* ── 3. Role check – only enforced when the `roles` array is non-empty ──── */
  if (roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  /* ── 4. All checks passed → render the protected component ─────────────── */
  return children;
};

export default ProtectedRoute;
