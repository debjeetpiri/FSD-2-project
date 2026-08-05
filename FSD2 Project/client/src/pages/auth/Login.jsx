import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, LogIn, GraduationCap, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const LoginPage = () => {
  const { login, authLoading } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [form,   setForm]   = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);

  // After login, return to the page they were trying to reach (if any)
  const from = location.state?.from || null;

  const validate = () => {
    const e = {};
    if (!form.email.trim())    e.email    = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email address';
    if (!form.password)        e.password = 'Password is required';
    return e;
  };

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const result = await login({ email: form.email.trim(), password: form.password });
    if (result.success) {
      navigate(from ?? result.redirectTo, { replace: true });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card animate-scaleIn">
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="auth-card__header">
          <div className="auth-card__logo">
            <GraduationCap size={28} />
          </div>
          <h1 className="auth-card__title">Welcome back</h1>
          <p className="text-muted text-sm">Sign in to your EduFlow account</p>
        </div>

        {/* ── Form ────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} noValidate className="auth-form">
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">Email address</label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={`form-input ${errors.email ? 'form-input--error' : ''}`}
              value={form.email}
              onChange={handleChange}
              disabled={authLoading}
            />
            {errors.email && (
              <span className="form-error">
                <AlertCircle size={13} /> {errors.email}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="login-password" className="form-label">Password</label>
            <div className="auth-form__pw-wrap">
              <input
                id="login-password"
                name="password"
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                className={`form-input ${errors.password ? 'form-input--error' : ''}`}
                value={form.password}
                onChange={handleChange}
                disabled={authLoading}
              />
              <button
                type="button"
                className="auth-form__pw-toggle"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <span className="form-error">
                <AlertCircle size={13} /> {errors.password}
              </span>
            )}
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="btn btn-primary w-full btn-lg"
            disabled={authLoading}
          >
            {authLoading ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Signing in…</> : <><LogIn size={18} /> Sign In</>}
          </button>
        </form>

        <p className="auth-card__footer">
          Don't have an account?{' '}
          <Link to="/register" className="auth-card__link">Create one free</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
