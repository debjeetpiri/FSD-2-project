import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, GraduationCap, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const ROLES = [
  { value: 'student', label: '🎓 Student – I want to learn' },
  { value: 'faculty', label: '🧑‍🏫 Faculty – I want to teach' },
];

const RegisterPage = () => {
  const { register, authLoading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', role: 'student',
  });
  const [errors, setErrors]   = useState({});
  const [showPw,  setShowPw]  = useState(false);
  const [showCpw, setShowCpw] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim() || form.name.trim().length < 2)
      e.name = 'Name must be at least 2 characters';
    if (!form.email.trim())
      e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Invalid email address';
    if (!form.password || form.password.length < 6)
      e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword)
      e.confirmPassword = 'Passwords do not match';
    if (!['student', 'faculty'].includes(form.role))
      e.role = 'Please select a valid role';
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

    const result = await register({
      name:     form.name.trim(),
      email:    form.email.trim(),
      password: form.password,
      role:     form.role,
    });

    if (result.success) {
      navigate(result.redirectTo, { replace: true });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--wide card animate-scaleIn">
        <div className="auth-card__header">
          <div className="auth-card__logo">
            <GraduationCap size={28} />
          </div>
          <h1 className="auth-card__title">Create your account</h1>
          <p className="text-muted text-sm">Join thousands of learners on EduFlow</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="auth-form">
          {/* Name */}
          <div className="form-group">
            <label htmlFor="reg-name" className="form-label">Full Name</label>
            <input
              id="reg-name" name="name" type="text" autoComplete="name"
              placeholder="Jane Smith"
              className={`form-input ${errors.name ? 'form-input--error' : ''}`}
              value={form.name} onChange={handleChange} disabled={authLoading}
            />
            {errors.name && <span className="form-error"><AlertCircle size={13}/> {errors.name}</span>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="reg-email" className="form-label">Email address</label>
            <input
              id="reg-email" name="email" type="email" autoComplete="email"
              placeholder="you@example.com"
              className={`form-input ${errors.email ? 'form-input--error' : ''}`}
              value={form.email} onChange={handleChange} disabled={authLoading}
            />
            {errors.email && <span className="form-error"><AlertCircle size={13}/> {errors.email}</span>}
          </div>

          {/* Role */}
          <div className="form-group">
            <label htmlFor="reg-role" className="form-label">I am a…</label>
            <select
              id="reg-role" name="role"
              className={`form-select ${errors.role ? 'form-input--error' : ''}`}
              value={form.role} onChange={handleChange} disabled={authLoading}
            >
              {ROLES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {errors.role && <span className="form-error"><AlertCircle size={13}/> {errors.role}</span>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="reg-password" className="form-label">Password</label>
            <div className="auth-form__pw-wrap">
              <input
                id="reg-password" name="password" autoComplete="new-password"
                type={showPw ? 'text' : 'password'} placeholder="Min. 6 characters"
                className={`form-input ${errors.password ? 'form-input--error' : ''}`}
                value={form.password} onChange={handleChange} disabled={authLoading}
              />
              <button type="button" className="auth-form__pw-toggle"
                onClick={() => setShowPw(v => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}>
                {showPw ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </div>
            {errors.password && <span className="form-error"><AlertCircle size={13}/> {errors.password}</span>}
          </div>

          {/* Confirm password */}
          <div className="form-group">
            <label htmlFor="reg-confirm" className="form-label">Confirm Password</label>
            <div className="auth-form__pw-wrap">
              <input
                id="reg-confirm" name="confirmPassword" autoComplete="new-password"
                type={showCpw ? 'text' : 'password'} placeholder="Re-enter password"
                className={`form-input ${errors.confirmPassword ? 'form-input--error' : ''}`}
                value={form.confirmPassword} onChange={handleChange} disabled={authLoading}
              />
              <button type="button" className="auth-form__pw-toggle"
                onClick={() => setShowCpw(v => !v)}
                aria-label={showCpw ? 'Hide password' : 'Show password'}>
                {showCpw ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </div>
            {errors.confirmPassword && <span className="form-error"><AlertCircle size={13}/> {errors.confirmPassword}</span>}
          </div>

          <button
            id="register-submit-btn"
            type="submit"
            className="btn btn-primary w-full btn-lg"
            disabled={authLoading}
          >
            {authLoading
              ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Creating account…</>
              : <><UserPlus size={18} /> Create Account</>}
          </button>
        </form>

        <p className="auth-card__footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-card__link">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
