import { Link } from 'react-router-dom';
import { GraduationCap, Github, Twitter, Linkedin, Heart } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const year = new Date().getFullYear();

  const footerLinks = {
    Platform: [
      { to: '/courses',  label: 'Browse Courses'  },
      { to: '/register', label: 'Get Started'      },
      { to: '/login',    label: 'Sign In'          },
    ],
    Learn: [
      { to: '/courses?category=Programming', label: 'Programming'  },
      { to: '/courses?category=Design',      label: 'Design'       },
      { to: '/courses?category=Business',    label: 'Business'     },
      { to: '/courses?category=Science',     label: 'Science'      },
    ],
    Company: [
      { to: '/contact', label: 'Contact'     },
      { to: '/contact', label: 'Support'     },
    ],
  };

  return (
    <footer className="footer">
      {/* ── Gradient top border ────────────────────────────────────── */}
      <div className="footer__border" />

      <div className="container">
        <div className="footer__grid">
          {/* ── Brand column ─────────────────────────────────────── */}
          <div className="footer__brand">
            <Link to="/" className="footer__logo">
              <div className="footer__logo-icon">
                <GraduationCap size={20} />
              </div>
              <span>Edu<span>Flow</span></span>
            </Link>
            <p className="footer__tagline">
              Empowering learners worldwide with high-quality, accessible education.
            </p>
            <div className="footer__socials">
              <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub" className="footer__social-link">
                <Github size={18} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter" className="footer__social-link">
                <Twitter size={18} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="footer__social-link">
                <Linkedin size={18} />
              </a>
            </div>
          </div>

          {/* ── Link columns ─────────────────────────────────────── */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group} className="footer__col">
              <h4 className="footer__col-title">{group}</h4>
              <ul className="footer__col-links">
                {links.map(({ to, label }) => (
                  <li key={label}>
                    <Link to={to} className="footer__link">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Bottom bar ───────────────────────────────────────────── */}
        <div className="footer__bottom">
          <p className="text-sm text-muted">
            © {year} EduFlow LMS. All rights reserved.
          </p>
          <p className="footer__made-with text-sm text-muted">
            Made with <Heart size={13} className="footer__heart" /> for learners everywhere
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
