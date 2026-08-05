import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  GraduationCap, Menu, X, ChevronDown,
  LayoutDashboard, LogOut, User, BookOpen,
  Shield, Users,
} from 'lucide-react';
import { useAuth, getDashboardPath } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate  = useNavigate();
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [dropOpen,    setDropOpen]    = useState(false);
  const [scrolled,    setScrolled]    = useState(false);
  const dropRef = useRef(null);

  /* ── Shrink navbar on scroll ─────────────────────────────────────────── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Close dropdown on outside click ────────────────────────────────── */
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Close mobile menu on route change ──────────────────────────────── */
  const closeAll = () => { setMenuOpen(false); setDropOpen(false); };

  const handleLogout = () => {
    logout();
    closeAll();
    navigate('/login');
  };

  const roleLabel = { admin: 'Admin', faculty: 'Faculty', student: 'Student' };
  const roleBadgeClass = {
    admin:   'badge-danger',
    faculty: 'badge-accent',
    student: 'badge-primary',
  };

  const navLinks = [
    { to: '/courses', label: 'Courses' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner container">
        {/* ── Logo ──────────────────────────────────────────────────── */}
        <Link to="/" className="navbar__logo" onClick={closeAll}>
          <div className="navbar__logo-icon">
            <GraduationCap size={22} />
          </div>
          <span className="navbar__logo-text">Edu<span>Flow</span></span>
        </Link>

        {/* ── Desktop nav links ─────────────────────────────────────── */}
        <nav className="navbar__links" aria-label="Main navigation">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `navbar__link ${isActive ? 'navbar__link--active' : ''}`
              }
            >
              {label}
            </NavLink>
          ))}

          {isAuthenticated && (
            <NavLink
              to={getDashboardPath(user?.role)}
              className={({ isActive }) =>
                `navbar__link ${isActive ? 'navbar__link--active' : ''}`
              }
            >
              Dashboard
            </NavLink>
          )}
        </nav>

        {/* ── Desktop auth area ─────────────────────────────────────── */}
        <div className="navbar__auth">
          {isAuthenticated ? (
            <div className="navbar__profile" ref={dropRef}>
              <button
                className="navbar__profile-btn"
                onClick={() => setDropOpen((v) => !v)}
                aria-expanded={dropOpen}
                aria-haspopup="true"
                id="user-menu-btn"
              >
                <div className="navbar__avatar">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="navbar__profile-info">
                  <span className="navbar__profile-name">{user?.name}</span>
                  <span className={`badge ${roleBadgeClass[user?.role]}`}>
                    {roleLabel[user?.role]}
                  </span>
                </div>
                <ChevronDown
                  size={16}
                  className={`navbar__chevron ${dropOpen ? 'navbar__chevron--open' : ''}`}
                />
              </button>

              {dropOpen && (
                <div className="navbar__dropdown glass animate-scaleIn" role="menu">
                  <Link
                    to={getDashboardPath(user?.role)}
                    className="navbar__dropdown-item"
                    onClick={closeAll}
                    role="menuitem"
                  >
                    <LayoutDashboard size={16} /> Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    className="navbar__dropdown-item"
                    onClick={closeAll}
                    role="menuitem"
                  >
                    <User size={16} /> My Profile
                  </Link>

                  {user?.role === 'faculty' && (
                    <Link
                      to="/faculty/create-course"
                      className="navbar__dropdown-item"
                      onClick={closeAll}
                      role="menuitem"
                    >
                      <BookOpen size={16} /> Create Course
                    </Link>
                  )}
                  {user?.role === 'admin' && (
                    <>
                      <Link
                        to="/admin/dashboard"
                        className="navbar__dropdown-item"
                        onClick={closeAll}
                        role="menuitem"
                      >
                        <Shield size={16} /> Admin Panel
                      </Link>
                      <Link
                        to="/admin/users"
                        className="navbar__dropdown-item"
                        onClick={closeAll}
                        role="menuitem"
                      >
                        <Users size={16} /> Manage Users
                      </Link>
                    </>
                  )}

                  <div className="navbar__dropdown-divider" />

                  <button
                    className="navbar__dropdown-item navbar__dropdown-item--danger"
                    onClick={handleLogout}
                    role="menuitem"
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="navbar__guest">
              <Link to="/login"    className="btn btn-secondary btn-sm" onClick={closeAll}>
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm" onClick={closeAll}>
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* ── Mobile hamburger ──────────────────────────────────────── */}
        <button
          className="navbar__hamburger"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* ── Mobile drawer ─────────────────────────────────────────── */}
      {menuOpen && (
        <div className="navbar__mobile glass animate-fadeIn">
          <nav className="navbar__mobile-links">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `navbar__mobile-link ${isActive ? 'navbar__mobile-link--active' : ''}`
                }
                onClick={closeAll}
              >
                {label}
              </NavLink>
            ))}

            {isAuthenticated ? (
              <>
                <NavLink
                  to={getDashboardPath(user?.role)}
                  className="navbar__mobile-link"
                  onClick={closeAll}
                >
                  <LayoutDashboard size={16} /> Dashboard
                </NavLink>
                <NavLink
                  to="/profile"
                  className="navbar__mobile-link"
                  onClick={closeAll}
                >
                  <User size={16} /> Profile
                </NavLink>
                <button
                  className="navbar__mobile-link navbar__mobile-link--danger"
                  onClick={handleLogout}
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </>
            ) : (
              <div className="navbar__mobile-auth">
                <Link to="/login"    className="btn btn-secondary w-full" onClick={closeAll}>
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary w-full" onClick={closeAll}>
                  Get Started
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
