import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Users, Award, Zap, Star, Play } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Home.css';

const stats = [
  { value: '12K+', label: 'Active Learners',  icon: <Users size={20} /> },
  { value: '350+', label: 'Expert Courses',    icon: <BookOpen size={20} /> },
  { value: '98%',  label: 'Satisfaction Rate', icon: <Star size={20} /> },
  { value: '50+',  label: 'Expert Instructors',icon: <Award size={20} /> },
];

const features = [
  { icon: <Zap size={24} />,      title: 'Learn at Your Pace',  desc: 'Access course materials anytime, anywhere. Our platform adapts to your schedule.' },
  { icon: <BookOpen size={24} />, title: 'Rich Content',         desc: 'HD videos, interactive notes, quizzes and assignments — all in one place.' },
  { icon: <Award size={24} />,    title: 'Get Certified',        desc: 'Earn verifiable certificates upon course completion to showcase your skills.' },
  { icon: <Users size={24} />,    title: 'Expert Faculty',       desc: 'Learn directly from industry professionals and academic experts.' },
];

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero__glow hero__glow--left"  aria-hidden />
        <div className="hero__glow hero__glow--right" aria-hidden />

        <div className="container">
          <div className="hero__content animate-fadeInUp">
            <span className="badge badge-accent hero__badge">
              <Zap size={11} /> New Courses Added Weekly
            </span>

            <h1 className="hero__title">
              Learn Without
              <span className="gradient-text"> Limits</span>
            </h1>

            <p className="hero__subtitle">
              EduFlow brings world-class courses, expert instructors, and a
              community of learners together in one powerful platform.
            </p>

            <div className="hero__cta">
              {isAuthenticated ? (
                <Link to="/courses" className="btn btn-primary btn-lg">
                  Browse Courses <ArrowRight size={18} />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary btn-lg">
                    Start Learning Free <ArrowRight size={18} />
                  </Link>
                  <Link to="/courses" className="btn btn-outline btn-lg">
                    <Play size={16} /> Explore Courses
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* ── Stats row ─────────────────────────────────────────── */}
          <div className="hero__stats animate-fadeInUp delay-200">
            {stats.map(({ value, label, icon }) => (
              <div key={label} className="hero__stat-card card">
                <div className="hero__stat-icon">{icon}</div>
                <div>
                  <div className="hero__stat-value">{value}</div>
                  <div className="hero__stat-label text-muted text-sm">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section className="features container">
        <div className="section-header text-center animate-fadeInUp">
          <h2>Everything You Need to <span className="gradient-text">Succeed</span></h2>
          <p className="text-muted">A complete learning ecosystem built for modern education.</p>
        </div>

        <div className="grid-4 animate-fadeInUp delay-100">
          {features.map(({ icon, title, desc }) => (
            <div key={title} className="feature-card card card-hover">
              <div className="feature-card__icon">{icon}</div>
              <h3 className="feature-card__title">{title}</h3>
              <p className="feature-card__desc text-muted text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────────── */}
      {!isAuthenticated && (
        <section className="cta-banner container animate-fadeInUp">
          <div className="cta-banner__inner card">
            <div className="cta-banner__glow" aria-hidden />
            <h2>Ready to Start Your Journey?</h2>
            <p className="text-muted">
              Join thousands of learners already growing with EduFlow.
            </p>
            <Link to="/register" className="btn btn-primary btn-lg">
              Create Free Account <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;
