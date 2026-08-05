import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle, Upload, X, ImageIcon, AlertCircle,
  Loader2, CheckCircle, BookOpen,
} from 'lucide-react';
import { courseAPI } from '../../api/lmsApi';
import toast from 'react-hot-toast';
import './CreateCourse.css';

const CATEGORIES = ['Programming','Design','Business','Science','Mathematics','Language','Arts','Other'];
const LEVELS     = ['Beginner','Intermediate','Advanced'];

const CreateCoursePage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title:       '',
    description: '',
    category:    '',
    level:       '',
    duration:    '',
    isPublished: false,
  });
  const [errors,    setErrors]    = useState({});
  const [submitting,setSubmitting]= useState(false);
  const [thumbnail, setThumbnail] = useState(null);   // File object
  const [preview,   setPreview]   = useState(null);   // Object URL
  const fileRef = useRef();

  /* ── Handlers ──────────────────────────────────────────────────────────── */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    setErrors((er) => ({ ...er, [name]: '' }));
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPG, PNG, WEBP, etc.)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Thumbnail must be under 5 MB');
      return;
    }
    setThumbnail(file);
    setPreview(URL.createObjectURL(file));
  };

  const removeThumbnail = () => {
    setThumbnail(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    fileRef.current.value = '';
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim() || form.title.trim().length < 5)
      e.title = 'Title must be at least 5 characters';
    if (!form.description.trim() || form.description.trim().length < 20)
      e.description = 'Description must be at least 20 characters';
    if (!form.category)
      e.category = 'Please select a category';
    if (!form.level)
      e.level = 'Please select a difficulty level';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const fd = new FormData();
    fd.append('title',       form.title.trim());
    fd.append('description', form.description.trim());
    fd.append('category',    form.category);
    fd.append('level',       form.level);
    fd.append('isPublished', form.isPublished);
    if (form.duration) fd.append('duration', form.duration.trim());
    if (thumbnail)     fd.append('thumbnail', thumbnail);

    setSubmitting(true);
    try {
      const { data } = await courseAPI.create(fd);
      toast.success('Course created successfully! 🎉');
      navigate(`/course/${data.course._id}`);
    } catch (err) {
      toast.error(err.message || 'Failed to create course');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper container animate-fadeInUp" style={{ maxWidth: 760 }}>
      <div className="mb-6">
        <h1>Create a <span className="gradient-text">New Course</span></h1>
        <p className="text-muted">Fill in the details below to publish your course.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="card create-course-card">

          {/* ── Title ─────────────────────────────────────────────────── */}
          <div className="form-group">
            <label htmlFor="course-title" className="form-label">
              Course Title <span className="required-star">*</span>
            </label>
            <input
              id="course-title" name="title" type="text"
              placeholder="e.g. Complete JavaScript Bootcamp"
              className={`form-input ${errors.title ? 'form-input--error' : ''}`}
              value={form.title} onChange={handleChange} disabled={submitting}
            />
            {errors.title && <span className="form-error"><AlertCircle size={13}/> {errors.title}</span>}
          </div>

          {/* ── Description ───────────────────────────────────────────── */}
          <div className="form-group">
            <label htmlFor="course-desc" className="form-label">
              Description <span className="required-star">*</span>
            </label>
            <textarea
              id="course-desc" name="description" rows={5}
              placeholder="Describe what students will learn in this course…"
              className={`form-textarea ${errors.description ? 'form-input--error' : ''}`}
              value={form.description} onChange={handleChange} disabled={submitting}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {errors.description
                ? <span className="form-error"><AlertCircle size={13}/> {errors.description}</span>
                : <span />}
              <span className="text-xs text-muted">{form.description.length} / 2000</span>
            </div>
          </div>

          {/* ── Category + Level ──────────────────────────────────────── */}
          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="course-category" className="form-label">
                Category <span className="required-star">*</span>
              </label>
              <select
                id="course-category" name="category"
                className={`form-select ${errors.category ? 'form-input--error' : ''}`}
                value={form.category} onChange={handleChange} disabled={submitting}
              >
                <option value="">Select category…</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <span className="form-error"><AlertCircle size={13}/> {errors.category}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="course-level" className="form-label">
                Difficulty Level <span className="required-star">*</span>
              </label>
              <select
                id="course-level" name="level"
                className={`form-select ${errors.level ? 'form-input--error' : ''}`}
                value={form.level} onChange={handleChange} disabled={submitting}
              >
                <option value="">Select level…</option>
                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              {errors.level && <span className="form-error"><AlertCircle size={13}/> {errors.level}</span>}
            </div>
          </div>

          {/* ── Duration ─────────────────────────────────────────────── */}
          <div className="form-group" style={{ maxWidth: 260 }}>
            <label htmlFor="course-duration" className="form-label">Duration (optional)</label>
            <input
              id="course-duration" name="duration" type="text"
              placeholder="e.g. 8 hours, 4 weeks"
              className="form-input"
              value={form.duration} onChange={handleChange} disabled={submitting}
            />
          </div>

          {/* ── Thumbnail upload ──────────────────────────────────────── */}
          <div className="form-group">
            <label className="form-label">Course Thumbnail (optional, max 5 MB)</label>
            {preview ? (
              <div className="thumb-preview">
                <img src={preview} alt="Thumbnail preview" />
                <button
                  type="button" className="thumb-remove-btn"
                  onClick={removeThumbnail} aria-label="Remove thumbnail"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div
                className="thumb-dropzone"
                onClick={() => fileRef.current.click()}
                onKeyDown={(e) => e.key === 'Enter' && fileRef.current.click()}
                tabIndex={0} role="button" aria-label="Upload thumbnail"
              >
                <ImageIcon size={36} />
                <p>Click to upload a thumbnail</p>
                <span className="text-xs text-muted">JPG, PNG, WEBP, GIF</span>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFile}
              id="thumbnail-input"
            />
          </div>

          {/* ── Publish toggle ────────────────────────────────────────── */}
          <label className="toggle-row" htmlFor="course-published">
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Publish immediately</div>
              <div className="text-muted text-xs">
                {form.isPublished
                  ? 'Course will be visible to all students right away'
                  : 'Course saved as a draft — only you can see it'}
              </div>
            </div>
            <div className={`toggle ${form.isPublished ? 'toggle--on' : ''}`}>
              <input
                id="course-published"
                type="checkbox"
                name="isPublished"
                checked={form.isPublished}
                onChange={handleChange}
                style={{ display: 'none' }}
              />
              <div className="toggle__thumb" />
            </div>
          </label>

          {/* ── Submit ────────────────────────────────────────────────── */}
          <div className="create-course-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/faculty/dashboard')}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              id="create-course-submit"
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={submitting}
            >
              {submitting
                ? <><Loader2 size={18} className="spin" /> Creating…</>
                : form.isPublished
                  ? <><CheckCircle size={18} /> Publish Course</>
                  : <><BookOpen size={18} /> Save as Draft</>}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateCoursePage;
