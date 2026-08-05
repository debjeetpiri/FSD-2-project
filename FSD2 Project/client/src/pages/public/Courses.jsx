import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search, Filter, BookOpen, Users, Star,
  ChevronLeft, ChevronRight, X, Loader2,
} from 'lucide-react';
import { courseAPI } from '../../api/lmsApi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Courses.css';

const CATEGORIES = ['Programming','Design','Business','Science','Mathematics','Language','Arts','Other'];
const LEVELS     = ['Beginner','Intermediate','Advanced'];

/* ── Skeleton card ────────────────────────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="course-card card">
    <div className="skeleton" style={{ height: 180, borderRadius: 'var(--radius-md)' }} />
    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="skeleton" style={{ height: 14, width: '60%' }} />
      <div className="skeleton" style={{ height: 20, width: '90%' }} />
      <div className="skeleton" style={{ height: 14, width: '75%' }} />
      <div className="skeleton" style={{ height: 36, marginTop: 8 }} />
    </div>
  </div>
);

/* ── Course card ──────────────────────────────────────────────────────────── */
const CourseCard = ({ course, onEnroll, enrollingId }) => {
  const { isAuthenticated, isStudent } = useAuth();
  const isEnrolling = enrollingId === course._id;

  return (
    <div className="course-card card card-hover animate-fadeInUp">
      {/* Thumbnail */}
      <div className="course-card__thumb">
        {course.coverImage ? (
          <img src={`/${course.coverImage}`} alt={course.title} loading="lazy" />
        ) : (
          <div className="course-card__thumb-placeholder">
            <BookOpen size={40} />
          </div>
        )}
        <span className={`badge course-card__level-badge ${
          course.level === 'Beginner'     ? 'badge-success' :
          course.level === 'Intermediate' ? 'badge-warning' : 'badge-danger'
        }`}>{course.level}</span>
      </div>

      {/* Body */}
      <div className="course-card__body">
        <span className="badge badge-primary">{course.category}</span>
        <h3 className="course-card__title">{course.title}</h3>
        <p className="course-card__desc text-muted text-sm">
          {course.description.length > 100
            ? `${course.description.slice(0, 100)}…`
            : course.description}
        </p>

        {/* Meta row */}
        <div className="course-card__meta">
          <span className="flex items-center gap-2 text-sm text-muted">
            <Users size={14} /> {course.enrollmentCount ?? 0} students
          </span>
          {course.faculty && (
            <span className="text-sm text-muted">
              by <strong style={{ color: 'var(--clr-text)' }}>{course.faculty.name}</strong>
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="course-card__actions">
          <Link to={`/course/${course._id}`} className="btn btn-secondary btn-sm">
            View Details
          </Link>
          {isAuthenticated && isStudent && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onEnroll(course._id)}
              disabled={isEnrolling}
            >
              {isEnrolling ? <Loader2 size={14} className="spin" /> : null}
              {isEnrolling ? 'Enrolling…' : 'Enroll'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════ */
const CoursesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [courses,     setCourses]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [enrollingId, setEnrollingId] = useState(null);
  const [meta,        setMeta]        = useState({ total: 0, page: 1, totalPages: 1 });

  // Controlled filter state synced with URL search params
  const [search,   setSearch]   = useState(searchParams.get('search')   || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [level,    setLevel]    = useState(searchParams.get('level')    || '');
  const [page,     setPage]     = useState(parseInt(searchParams.get('page') || '1', 10));

  /* ── Fetch courses whenever filters/page change ───────────────────────── */
  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 9 };
      if (search.trim()) params.search   = search.trim();
      if (category)      params.category = category;
      if (level)         params.level    = level;

      const { data } = await courseAPI.getAll(params);
      setCourses(data.courses || []);
      setMeta({ total: data.total, page: data.page, totalPages: data.totalPages });
    } catch (err) {
      toast.error(err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, [search, category, level, page]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  /* ── Sync filters to URL ──────────────────────────────────────────────── */
  useEffect(() => {
    const p = {};
    if (search.trim()) p.search   = search.trim();
    if (category)      p.category = category;
    if (level)         p.level    = level;
    if (page > 1)      p.page     = page;
    setSearchParams(p, { replace: true });
  }, [search, category, level, page, setSearchParams]);

  /* ── Handlers ─────────────────────────────────────────────────────────── */
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCourses();
  };

  const clearFilters = () => {
    setSearch(''); setCategory(''); setLevel(''); setPage(1);
  };

  const handleEnroll = async (courseId) => {
    setEnrollingId(courseId);
    try {
      const { data } = await courseAPI.enroll(courseId);
      toast.success(data.message);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEnrollingId(null);
    }
  };

  const hasFilters = search || category || level;

  return (
    <div className="courses-page page-wrapper container">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="courses-page__header animate-fadeInUp">
        <div>
          <h1>Browse <span className="gradient-text">Courses</span></h1>
          <p className="text-muted">
            {meta.total > 0
              ? `${meta.total} course${meta.total !== 1 ? 's' : ''} available`
              : 'Discover courses taught by world-class instructors'}
          </p>
        </div>
      </div>

      {/* ── Search + Filters ─────────────────────────────────────────────── */}
      <form
        onSubmit={handleSearch}
        className="courses-page__filters card animate-fadeInUp"
        role="search"
        aria-label="Course search"
      >
        <div className="courses-page__search-wrap">
          <Search size={16} className="courses-page__search-icon" />
          <input
            id="course-search-input"
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search courses by title or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search courses"
          />
        </div>

        <select
          id="category-filter"
          className="form-select courses-page__select"
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          id="level-filter"
          className="form-select courses-page__select"
          value={level}
          onChange={(e) => { setLevel(e.target.value); setPage(1); }}
          aria-label="Filter by level"
        >
          <option value="">All Levels</option>
          {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>

        <button id="search-btn" type="submit" className="btn btn-primary">
          <Filter size={15} /> Search
        </button>

        {hasFilters && (
          <button type="button" className="btn btn-secondary" onClick={clearFilters} title="Clear filters">
            <X size={15} /> Clear
          </button>
        )}
      </form>

      {/* ── Results ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid-3">
          {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : courses.length === 0 ? (
        <div className="card courses-page__empty animate-fadeIn">
          <BookOpen size={56} style={{ color: 'var(--clr-text-faint)', margin: '0 auto 1rem' }} />
          <h3>No courses found</h3>
          <p className="text-muted">Try adjusting your search or filters.</p>
          {hasFilters && (
            <button className="btn btn-outline mt-4" onClick={clearFilters}>
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid-3">
          {courses.map((course) => (
            <CourseCard
              key={course._id}
              course={course}
              onEnroll={handleEnroll}
              enrollingId={enrollingId}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ──────────────────────────────────────────────────── */}
      {meta.totalPages > 1 && (
        <div className="courses-page__pagination animate-fadeIn">
          <button
            id="prev-page-btn"
            className="btn btn-secondary btn-sm"
            disabled={meta.page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={16} /> Prev
          </button>
          <span className="text-muted text-sm">
            Page <strong style={{ color: 'var(--clr-text)' }}>{meta.page}</strong> of{' '}
            <strong style={{ color: 'var(--clr-text)' }}>{meta.totalPages}</strong>
          </span>
          <button
            id="next-page-btn"
            className="btn btn-secondary btn-sm"
            disabled={meta.page >= meta.totalPages}
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default CoursesPage;
