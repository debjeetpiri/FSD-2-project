import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Users, PlusCircle, ArrowRight,
  Eye, Trash2, Edit, CheckCircle, EyeOff, Upload,
  X, FileText, Play, Loader2, AlertCircle, ImageIcon
} from 'lucide-react';
import { courseAPI, materialAPI } from '../../api/lmsApi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Dashboard.css';

const CATEGORIES = ['Programming','Design','Business','Science','Mathematics','Language','Arts','Other'];
const LEVELS     = ['Beginner','Intermediate','Advanced'];

/* ── Course Creation Modal ────────────────────────────────────────────────── */
const CreateCourseModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    title: '', description: '', category: '', level: '', duration: '', isPublished: true,
  });
  const [thumbnail, setThumbnail] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
      if (file.size > 5 * 1024 * 1024) { toast.error('Image size must be under 5 MB'); return; }
      setThumbnail(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.category || !form.level) {
      toast.error('Please fill in all required fields');
      return;
    }

    const formData = new FormData();
    formData.append('title', form.title.trim());
    formData.append('description', form.description.trim());
    formData.append('category', form.category);
    formData.append('level', form.level);
    formData.append('isPublished', form.isPublished);
    if (form.duration) formData.append('duration', form.duration.trim());
    if (thumbnail) formData.append('thumbnail', thumbnail);

    setSubmitting(true);
    try {
      const { data } = await courseAPI.create(formData);
      toast.success('Course created successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to create course');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop animate-fadeIn">
      <div className="modal-card card animate-scaleIn">
        <div className="modal-card__header">
          <h3>Create New Course</h3>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-card__body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Course Title *</label>
              <input
                className="form-input"
                placeholder="e.g. Modern Full-Stack Web Development"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Describe course objectives and overview…"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  className="form-select"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  required
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Level *</label>
                <select
                  className="form-select"
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                  required
                >
                  <option value="">Select Level</option>
                  {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            {/* Thumbnail file upload */}
            <div className="form-group">
              <label className="form-label">Course Thumbnail (Optional)</label>
              <div
                className="thumb-dropzone"
                onClick={() => fileRef.current?.click()}
                style={{ padding: '1rem' }}
              >
                {preview ? (
                  <img src={preview} alt="Preview" style={{ height: 100, borderRadius: 6, objectFit: 'cover' }} />
                ) : (
                  <>
                    <ImageIcon size={24} />
                    <span className="text-xs text-muted">Upload cover image (Max 5MB)</span>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            </div>

            <label className="toggle-row" htmlFor="pub-toggle">
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Publish Course</div>
                <div className="text-xs text-muted">Make course visible to students immediately</div>
              </div>
              <input
                id="pub-toggle"
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
              />
            </label>
          </div>

          <div className="modal-card__footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <><Loader2 size={16} className="spin" /> Creating…</> : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Upload Material Modal ────────────────────────────────────────────────── */
const UploadMaterialModal = ({ courses, onClose, onSuccess }) => {
  const [courseId, setCourseId] = useState(courses[0]?._id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [materialType, setMaterialType] = useState('note'); // 'note' or 'video'
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) setFile(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!courseId || !title.trim() || !file) {
      toast.error('Course, title, and file are required');
      return;
    }

    const formData = new FormData();
    formData.append('courseId', courseId);
    formData.append('title', title.trim());
    if (description.trim()) formData.append('description', description.trim());
    formData.append('file', file);

    setUploading(true);
    try {
      const { data } = await materialAPI.upload(formData, materialType);
      toast.success(data.message || 'Material uploaded successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-backdrop animate-fadeIn">
      <div className="modal-card card animate-scaleIn">
        <div className="modal-card__header">
          <h3>Upload Study Material</h3>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-card__body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Select Course *</label>
              <select
                className="form-select"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                required
              >
                <option value="">Select Course</option>
                {courses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Material Type *</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center', borderColor: materialType === 'note' ? 'var(--clr-primary)' : '' }}>
                  <input type="radio" name="mtype" value="note" checked={materialType === 'note'} onChange={() => setMaterialType('note')} style={{ marginRight: 6 }} />
                  <FileText size={16} /> PDF Note / Doc
                </label>
                <label className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center', borderColor: materialType === 'video' ? 'var(--clr-primary)' : '' }}>
                  <input type="radio" name="mtype" value="video" checked={materialType === 'video'} onChange={() => setMaterialType('video')} style={{ marginRight: 6 }} />
                  <Play size={16} /> Video File
                </label>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Title *</label>
              <input
                className="form-input"
                placeholder={materialType === 'note' ? 'e.g. Lecture 1 Notes PDF' : 'e.g. Introduction Video'}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description (Optional)</label>
              <input
                className="form-input"
                placeholder="Brief summary of file content…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Attach File * ({materialType === 'note' ? 'PDF/DOCX/PPTX ≤20MB' : 'MP4/WEBM ≤100MB'})</label>
              <div
                className="thumb-dropzone"
                onClick={() => fileInputRef.current?.click()}
                style={{ padding: '1.5rem', cursor: 'pointer' }}
              >
                <Upload size={28} />
                <span className="text-sm">
                  {file ? <strong>{file.name}</strong> : 'Click to select file'}
                </span>
                {file && <span className="text-xs text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</span>}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={materialType === 'note' ? '.pdf,.doc,.docx,.ppt,.pptx' : 'video/*'}
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div className="modal-card__footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={uploading}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={uploading || !file}>
              {uploading ? <><Loader2 size={16} className="spin" /> Uploading…</> : 'Upload Material'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════ */
const FacultyDashboard = () => {
  const { user } = useAuth();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);

  const fetchFacultyCourses = async () => {
    setLoading(true);
    try {
      const { data } = await courseAPI.getMy();
      setCourses(data.courses || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultyCourses();
  }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete course "${title}"? This action cannot be undone.`)) return;
    try {
      await courseAPI.delete(id);
      setCourses((prev) => prev.filter((c) => c._id !== id));
      toast.success('Course deleted');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const totalPublished = courses.filter((c) => c.isPublished).length;
  const totalStudentsEnrolled = courses.reduce((acc, c) => acc + (c.enrollmentCount || 0), 0);

  const stats = [
    { icon: <BookOpen size={20} />, label: 'Created Courses', value: loading ? '…' : courses.length, color: 'var(--clr-primary-light)' },
    { icon: <CheckCircle size={20} />, label: 'Published Courses', value: loading ? '…' : totalPublished, color: 'var(--clr-success)' },
    { icon: <Users size={20} />, label: 'Total Enrolled Students', value: loading ? '…' : totalStudentsEnrolled, color: 'var(--clr-accent)' },
  ];

  return (
    <div className="page-wrapper container animate-fadeInUp">
      {/* Dashboard Header */}
      <div className="dashboard-header mb-6">
        <div>
          <h1>Faculty Dashboard — <span className="gradient-text">{user?.name}</span></h1>
          <p className="text-muted">Manage your courses, study materials, and student enrollments.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => setShowMaterialModal(true)} disabled={courses.length === 0}>
            <Upload size={16} /> Upload Materials
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <PlusCircle size={16} /> Create Course
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid-3 mb-6">
        {stats.map(({ icon, label, value, color }) => (
          <div key={label} className="card stat-card" style={{ borderColor: `${color}30` }}>
            <div className="stat-card__icon" style={{ color }}>{icon}</div>
            <div className="stat-card__value">{value}</div>
            <div className="stat-card__label text-muted text-sm">{label}</div>
          </div>
        ))}
      </div>

      {/* Course List with Enrollment Counts */}
      <section>
        <div className="dashboard-section-header mb-4">
          <h2>My Created Courses</h2>
          <button className="btn btn-outline btn-sm" onClick={() => setShowCreateModal(true)}>
            <PlusCircle size={14} /> Add New Course
          </button>
        </div>

        {loading ? (
          <div className="grid-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 220, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="dashboard-empty card">
            <BookOpen size={48} style={{ color: 'var(--clr-text-faint)' }} />
            <h3>No courses created yet</h3>
            <p className="text-muted text-sm">Create your first course to start uploading notes, video lectures, and assignments.</p>
            <button className="btn btn-primary btn-sm mt-2" onClick={() => setShowCreateModal(true)}>
              Create First Course <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <div className="grid-3">
            {courses.map((course) => (
              <div key={course._id} className="my-course-card card card-hover">
                <div className="my-course-card__thumb">
                  {course.coverImage ? (
                    <img src={`/${course.coverImage}`} alt={course.title} loading="lazy" />
                  ) : (
                    <div className="enrolled-card__placeholder">
                      <BookOpen size={32} />
                    </div>
                  )}
                </div>

                <div className="my-course-card__body">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <h4 className="my-course-card__title">{course.title}</h4>
                    <span className={`badge ${course.isPublished ? 'badge-success' : 'badge-warning'}`}>
                      {course.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>

                  <span className="badge badge-primary" style={{ alignSelf: 'flex-start' }}>{course.category}</span>

                  <div className="my-course-card__meta">
                    <span className="text-muted text-sm flex items-center gap-1">
                      <Users size={14} style={{ color: 'var(--clr-accent)' }} />
                      <strong style={{ color: 'var(--clr-text)' }}>{course.enrollmentCount || 0}</strong> Students Enrolled
                    </span>
                  </div>
                </div>

                <div className="my-course-card__actions">
                  <Link to={`/course/${course._id}`} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                    <Eye size={14} /> View
                  </Link>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(course._id, course.title)}
                    title="Delete Course"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modals */}
      {showCreateModal && (
        <CreateCourseModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchFacultyCourses}
        />
      )}

      {showMaterialModal && (
        <UploadMaterialModal
          courses={courses}
          onClose={() => setShowMaterialModal(false)}
          onSuccess={fetchFacultyCourses}
        />
      )}
    </div>
  );
};

export default FacultyDashboard;
