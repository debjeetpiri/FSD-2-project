import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Clock, Award, TrendingUp, ArrowRight,
  Calendar, CheckCircle, AlertCircle, Upload, X, Loader2,
  FileText, Play, CheckSquare
} from 'lucide-react';
import { courseAPI, submissionAPI, assignmentAPI } from '../../api/lmsApi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Dashboard.css';

/* ── Enrolled Course Card with Progress Bar ───────────────────────────────── */
const EnrolledCourseCard = ({ course }) => {
  // Mock calculate progress based on enrollment or materials
  const progressPercent = course.progress || Math.min(100, Math.floor(Math.random() * 40) + 30);

  return (
    <div className="card card-hover enrolled-course-card">
      <div className="enrolled-course-card__header">
        <div className="enrolled-course-card__thumb">
          {course.coverImage ? (
            <img src={`/${course.coverImage}`} alt={course.title} loading="lazy" />
          ) : (
            <div className="enrolled-card__placeholder">
              <BookOpen size={24} />
            </div>
          )}
        </div>
        <div className="enrolled-course-card__info">
          <span className="badge badge-primary">{course.category}</span>
          <h4 className="enrolled-course-card__title">{course.title}</h4>
          <span className="text-muted text-xs">Instructor: {course.faculty?.name || 'Faculty'}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="course-progress">
        <div className="course-progress__label">
          <span className="text-xs text-muted">Course Completion</span>
          <span className="text-xs font-bold" style={{ color: 'var(--clr-primary-light)' }}>
            {progressPercent}%
          </span>
        </div>
        <div className="course-progress__bar">
          <div
            className="course-progress__fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="enrolled-course-card__footer">
        <span className="text-xs text-muted">
          {course.level} Level
        </span>
        <Link to={`/course/${course._id}`} className="btn btn-secondary btn-sm">
          Continue <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
};

/* ── Submission Modal ─────────────────────────────────────────────────────── */
const SubmitModal = ({ assignment, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef();

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.size > 20 * 1024 * 1024) {
        toast.error('File size cannot exceed 20 MB');
        return;
      }
      setFile(selected);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file to submit');
      return;
    }

    const formData = new FormData();
    formData.append('assignmentId', assignment._id);
    formData.append('file', file);

    setSubmitting(true);
    try {
      const { data } = await submissionAPI.submit(formData);
      toast.success(data.message || 'Assignment submitted!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop animate-fadeIn">
      <div className="modal-card card animate-scaleIn">
        <div className="modal-card__header">
          <h3>Submit Assignment</h3>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-card__body">
          <div className="assignment-meta-box">
            <h4 style={{ margin: 0 }}>{assignment.title}</h4>
            <p className="text-muted text-sm" style={{ margin: '4px 0 0' }}>
              Due: {new Date(assignment.dueDate).toLocaleString()}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group mb-4">
              <label className="form-label">Attach File (PDF, DOCX, ZIP - Max 20MB)</label>
              <div
                className="thumb-dropzone"
                onClick={() => fileInputRef.current?.click()}
                style={{ padding: '1.5rem', cursor: 'pointer' }}
              >
                <Upload size={32} />
                <p className="text-sm">
                  {file ? <strong>{file.name}</strong> : 'Click to select submission file'}
                </p>
                {file && <span className="text-xs text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</span>}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>

            <div className="modal-card__footer">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting || !file}>
                {submitting ? <><Loader2 size={16} className="spin" /> Uploading…</> : 'Submit File'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════ */
const StudentDashboard = () => {
  const { user } = useAuth();

  const [courses, setCourses] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [activeAssignment, setActiveAssignment] = useState(null); // for submission modal
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [courseRes, subRes] = await Promise.all([
        courseAPI.getMy(),
        submissionAPI.getMy(),
      ]);
      setCourses(courseRes.data.courses || []);
      setSubmissions(subRes.data.submissions || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const gradedCount = submissions.filter((s) => s.status === 'graded' || s.status === 'returned').length;
  const pendingCount = submissions.filter((s) => s.status === 'submitted').length;

  const stats = [
    { icon: <BookOpen size={20} />, label: 'Enrolled Courses', value: loading ? '…' : courses.length, color: 'var(--clr-primary-light)' },
    { icon: <CheckCircle size={20} />, label: 'Graded', value: loading ? '…' : gradedCount, color: 'var(--clr-success)' },
    { icon: <Clock size={20} />, label: 'Pending Review', value: loading ? '…' : pendingCount, color: 'var(--clr-warning)' },
    { icon: <Award size={20} />, label: 'Total Submissions', value: loading ? '…' : submissions.length, color: 'var(--clr-accent)' },
  ];

  return (
    <div className="page-wrapper container animate-fadeInUp">
      {/* Dashboard Header */}
      <div className="dashboard-header mb-6">
        <div>
          <h1>Student Dashboard — <span className="gradient-text">{user?.name}</span></h1>
          <p className="text-muted">Track your course progress and upcoming assignment submissions.</p>
        </div>
        <Link to="/courses" className="btn btn-primary">
          <TrendingUp size={16} /> Explore Courses
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid-4 mb-6">
        {stats.map(({ icon, label, value, color }) => (
          <div key={label} className="card stat-card" style={{ borderColor: `${color}30` }}>
            <div className="stat-card__icon" style={{ color }}>{icon}</div>
            <div className="stat-card__value">{value}</div>
            <div className="stat-card__label text-muted text-sm">{label}</div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Left Column: Enrolled Courses with Progress Bars */}
        <section>
          <div className="dashboard-section-header">
            <h2>Enrolled Courses</h2>
            <Link to="/courses" className="btn btn-outline btn-sm">Browse Catalogue</Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[1, 2].map((i) => (
                <div key={i} className="skeleton" style={{ height: 160, borderRadius: 'var(--radius-lg)' }} />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="dashboard-empty card">
              <BookOpen size={48} style={{ color: 'var(--clr-text-faint)' }} />
              <h3>No enrolled courses yet</h3>
              <p className="text-muted text-sm">Enroll in a course to view your progress and materials.</p>
              <Link to="/courses" className="btn btn-primary btn-sm mt-2">
                Browse Courses <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {courses.map((course) => (
                <EnrolledCourseCard key={course._id} course={course} />
              ))}
            </div>
          )}
        </section>

        {/* Right Column: Submissions & Assignment Statuses */}
        <section>
          <div className="dashboard-section-header">
            <h2>My Submissions & Status</h2>
          </div>

          {loading ? (
            <div className="card" style={{ padding: '1rem' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton" style={{ height: 50, marginBottom: 8 }} />
              ))}
            </div>
          ) : submissions.length === 0 ? (
            <div className="dashboard-empty card">
              <CheckSquare size={48} style={{ color: 'var(--clr-text-faint)' }} />
              <p className="text-muted">No submissions recorded yet.</p>
              <span className="text-xs text-muted">Submissions will appear here once you upload files for course assignments.</span>
            </div>
          ) : (
            <div className="card" style={{ padding: '0.5rem' }}>
              {submissions.map((sub) => {
                const isGraded = sub.status === 'graded' || sub.status === 'returned';
                return (
                  <div key={sub._id} className="submission-row">
                    <div className={`submission-row__icon ${isGraded ? 'submission-row__icon--graded' : ''}`}>
                      {isGraded ? <CheckCircle size={16} /> : <Clock size={16} />}
                    </div>
                    <div className="submission-row__info">
                      <span className="submission-row__title">{sub.assignment?.title || 'Assignment'}</span>
                      <span className="text-muted text-xs">{sub.assignment?.course?.title || 'Course'}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {isGraded ? (
                        <div className="submission-row__score">
                          {sub.score ?? 0} / {sub.assignment?.maxScore || 100} pts
                        </div>
                      ) : (
                        <span className="badge badge-warning">Pending Review</span>
                      )}
                      {sub.isLate && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end', marginTop: 2 }}>
                          <AlertCircle size={10} style={{ color: 'var(--clr-danger)' }} />
                          <span className="text-xs" style={{ color: 'var(--clr-danger)' }}>Late</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Submission Modal */}
      {activeAssignment && (
        <SubmitModal
          assignment={activeAssignment}
          onClose={() => setActiveAssignment(null)}
          onSuccess={fetchDashboardData}
        />
      )}
    </div>
  );
};

export default StudentDashboard;
