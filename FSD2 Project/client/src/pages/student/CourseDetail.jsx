import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  BookOpen, Video, FileText, CheckSquare, Users, Clock, Award,
  Calendar, ArrowLeft, Lock, Loader2, Play, Pause, Volume2,
  VolumeX, Maximize, RotateCcw, Download, CheckCircle, AlertCircle,
  Upload, X, File, ExternalLink, ChevronRight
} from 'lucide-react';
import { courseAPI, submissionAPI } from '../../api/lmsApi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './CourseDetail.css';

/* ── Custom Video Player Component ────────────────────────────────────────── */
const VideoPlayer = ({ video }) => {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  useEffect(() => {
    // Reset state when video changes
    setPlaying(false);
    setCurrentTime(0);
  }, [video]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlaying(!playing);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) videoRef.current.currentTime = time;
  };

  const handleVolumeChange = (e) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    setMuted(vol === 0);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      videoRef.current.muted = vol === 0;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuteState = !muted;
    setMuted(newMuteState);
    videoRef.current.muted = newMuteState;
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) videoRef.current.playbackRate = speed;
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Resolve video URL (supports uploaded server files and external URLs)
  const videoSrc = video.fileUrl?.startsWith('http') || video.fileUrl?.startsWith('/')
    ? video.fileUrl
    : `/${video.fileUrl}`;

  return (
    <div className="custom-player card">
      <div className="custom-player__video-wrapper">
        <video
          ref={videoRef}
          src={videoSrc}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setPlaying(false)}
          onClick={togglePlay}
          className="custom-player__video"
        />

        {/* Overlay Play Button when Paused */}
        {!playing && (
          <button className="custom-player__overlay-btn" onClick={togglePlay} aria-label="Play video">
            <Play size={36} style={{ marginLeft: 4 }} />
          </button>
        )}
      </div>

      {/* Control Bar */}
      <div className="custom-player__controls">
        {/* Progress / Seek bar */}
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="custom-player__seek"
        />

        <div className="custom-player__actions">
          <div className="custom-player__left">
            <button className="player-btn" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
              {playing ? <Pause size={18} /> : <Play size={18} />}
            </button>

            <button className="player-btn" onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>
              {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={muted ? 0 : volume}
              onChange={handleVolumeChange}
              className="custom-player__vol-slider"
            />

            <span className="player-time text-xs text-muted">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="custom-player__right">
            {/* Speed Selector */}
            <div className="speed-selector">
              {[0.75, 1, 1.25, 1.5, 2].map((s) => (
                <button
                  key={s}
                  className={`speed-btn ${playbackSpeed === s ? 'speed-btn--active' : ''}`}
                  onClick={() => handleSpeedChange(s)}
                >
                  {s}x
                </button>
              ))}
            </div>

            <button className="player-btn" onClick={toggleFullscreen} title="Fullscreen">
              <Maximize size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="custom-player__info">
        <h3>{video.title}</h3>
        {video.description && <p className="text-muted text-sm">{video.description}</p>}
      </div>
    </div>
  );
};

/* ── Assignment Card Component with Inline Submission Form ────────────────── */
const AssignmentCard = ({ assignment, userSubmission, onSubmissionSuccess }) => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef();

  const isOverdue = new Date(assignment.dueDate) < new Date();
  const isStudent = user?.role === 'student';

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.size > 20 * 1024 * 1024) {
        toast.error('File size must be under 20 MB');
        return;
      }
      setFile(selected);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('assignmentId', assignment._id);
    formData.append('file', file);

    setSubmitting(true);
    try {
      const { data } = await submissionAPI.submit(formData);
      toast.success(data.message || 'Assignment submitted!');
      setFile(null);
      onSubmissionSuccess();
    } catch (err) {
      toast.error(err.message || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card assignment-card mb-4">
      <div className="assignment-card__header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h3 className="assignment-card__title">{assignment.title}</h3>
            <span className={`badge ${isOverdue ? 'badge-danger' : 'badge-success'}`}>
              {isOverdue ? 'Overdue' : 'Open'}
            </span>
          </div>
          <p className="text-muted text-sm" style={{ margin: 0 }}>
            {assignment.description}
          </p>
        </div>

        <div className="assignment-card__score-badge">
          <span className="text-xs text-muted">Max Score</span>
          <span className="font-bold text-lg" style={{ color: 'var(--clr-primary-light)' }}>
            {assignment.maxScore} pts
          </span>
        </div>
      </div>

      <div className="assignment-card__meta">
        <span className="text-xs text-muted flex items-center gap-1">
          <Calendar size={13} /> Due: {new Date(assignment.dueDate).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
          })}
        </span>

        {assignment.attachmentUrl && (
          <a
            href={assignment.attachmentUrl.startsWith('http') ? assignment.attachmentUrl : `/${assignment.attachmentUrl}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs btn-link flex items-center gap-1"
          >
            <Download size={13} /> Attached Reference File
          </a>
        )}
      </div>

      {/* Submission Status or Upload Form */}
      {userSubmission ? (
        <div className="submission-status-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle size={20} style={{ color: 'var(--clr-success)' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Submitted</div>
              <div className="text-xs text-muted">
                Submitted on {new Date(userSubmission.submittedAt).toLocaleString()}
                {userSubmission.isLate && <span style={{ color: 'var(--clr-danger)', marginLeft: 6 }}>(Late Submission)</span>}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            {userSubmission.status === 'graded' ? (
              <div className="submission-score">
                Grade: <strong>{userSubmission.score} / {assignment.maxScore}</strong>
                {userSubmission.feedback && (
                  <div className="text-xs text-muted mt-1">Feedback: "{userSubmission.feedback}"</div>
                )}
              </div>
            ) : (
              <span className="badge badge-warning">Awaiting Grade</span>
            )}
          </div>
        </div>
      ) : isStudent ? (
        <form onSubmit={handleSubmit} className="assignment-upload-form">
          <h4 style={{ fontSize: '0.9rem', marginBottom: 8 }}>Upload Your Submission</h4>
          <div className="form-group mb-3">
            <div
              className="thumb-dropzone"
              onClick={() => fileInputRef.current?.click()}
              style={{ padding: '1rem', cursor: 'pointer' }}
            >
              <Upload size={20} />
              <span className="text-sm">
                {file ? <strong>{file.name}</strong> : 'Click to select solution file (PDF/Doc/ZIP)'}
              </span>
              {file && <span className="text-xs text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</span>}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.zip,.rar,.txt"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={submitting || !file}
          >
            {submitting ? <><Loader2 size={14} className="spin" /> Uploading…</> : 'Submit Assignment'}
          </button>
        </form>
      ) : null}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════ */
const CourseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isStudent, user } = useAuth();

  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'videos' | 'notes' | 'assignments'
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  const fetchCourseData = async () => {
    setLoading(true);
    try {
      const { data } = await courseAPI.getById(id);
      setCourse(data.course);
      setMaterials(data.materials || []);
      setAssignments(data.assignments || []);

      // If videos exist, set default video
      const videoMaterials = (data.materials || []).filter((m) => m.type === 'video');
      if (videoMaterials.length > 0) {
        setSelectedVideo(videoMaterials[0]);
      }

      // Fetch user's submissions if logged in as student
      if (isAuthenticated && user?.role === 'student') {
        const subRes = await submissionAPI.getMy();
        setMySubmissions(subRes.data.submissions || []);
      }
    } catch (err) {
      toast.error(err.message || 'Course not found');
      navigate('/courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseData();
  }, [id]);

  const isEnrolled = course?.enrolledStudents?.some(
    (s) => (s._id || s).toString() === user?._id?.toString()
  );
  const isFacultyOwner = (course?.faculty?._id || course?.faculty)?.toString() === user?._id?.toString();
  const canViewContent = isEnrolled || isFacultyOwner || user?.role === 'admin';

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/course/${id}` } });
      return;
    }
    setEnrolling(true);
    try {
      const { data } = await courseAPI.enroll(id);
      toast.success(data.message || 'Enrolled successfully!');
      fetchCourseData();
    } catch (err) {
      toast.error(err.message || 'Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
        <p className="text-muted">Loading course content…</p>
      </div>
    );
  }

  if (!course) return null;

  const videoList = materials.filter((m) => m.type === 'video');
  const noteList = materials.filter((m) => m.type === 'note');

  return (
    <div className="course-detail animate-fadeIn">
      {/* Hero Banner */}
      <div className="course-detail__hero">
        {course.coverImage && (
          <img className="course-detail__hero-bg" src={`/${course.coverImage}`} alt="" aria-hidden />
        )}
        <div className="course-detail__hero-overlay" />
        <div className="container course-detail__hero-content animate-fadeInUp">
          <Link to="/courses" className="btn btn-secondary btn-sm mb-4 inline-flex">
            <ArrowLeft size={14} /> Back to Courses
          </Link>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <span className="badge badge-primary">{course.category}</span>
            <span className={`badge ${
              course.level === 'Beginner' ? 'badge-success' :
              course.level === 'Intermediate' ? 'badge-warning' : 'badge-danger'
            }`}>{course.level}</span>
          </div>

          <h1 className="course-detail__title">{course.title}</h1>
          <p className="course-detail__desc">{course.description}</p>

          <div className="course-detail__meta">
            <span><Users size={15} /> {course.enrollmentCount || 0} enrolled</span>
            {course.duration && <span><Clock size={15} /> {course.duration}</span>}
            <span><Award size={15} /> Instructor: {course.faculty?.name}</span>
          </div>
        </div>
      </div>

      {/* Main Tabbed Container */}
      <div className="container course-detail__container">
        {/* Navigation Tabs */}
        <div className="course-tabs">
          <button
            className={`course-tab ${activeTab === 'overview' ? 'course-tab--active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <BookOpen size={16} /> Overview
          </button>
          <button
            className={`course-tab ${activeTab === 'videos' ? 'course-tab--active' : ''}`}
            onClick={() => setActiveTab('videos')}
          >
            <Video size={16} /> Video Lectures ({videoList.length})
          </button>
          <button
            className={`course-tab ${activeTab === 'notes' ? 'course-tab--active' : ''}`}
            onClick={() => setActiveTab('notes')}
          >
            <FileText size={16} /> Study Notes ({noteList.length})
          </button>
          <button
            className={`course-tab ${activeTab === 'assignments' ? 'course-tab--active' : ''}`}
            onClick={() => setActiveTab('assignments')}
          >
            <CheckSquare size={16} /> Assignments ({assignments.length})
          </button>
        </div>

        {/* Tab Content Panels */}
        <div className="course-tab-content">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="tab-pane animate-fadeIn">
              <div className="grid-2 gap-6">
                <div className="card">
                  <h3>About This Course</h3>
                  <p className="text-muted" style={{ lineHeight: 1.7, marginTop: 12 }}>
                    {course.description}
                  </p>

                  <h4 style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>What You Will Learn</h4>
                  <ul className="learning-outcomes">
                    <li><CheckCircle size={16} style={{ color: 'var(--clr-success)' }} /> Master key concepts in {course.category}</li>
                    <li><CheckCircle size={16} style={{ color: 'var(--clr-success)' }} /> Access HD video lectures and downloadable PDF notes</li>
                    <li><CheckCircle size={16} style={{ color: 'var(--clr-success)' }} /> Hands-on assignments with faculty feedback</li>
                  </ul>
                </div>

                <div className="card course-summary-card">
                  <h3>Course Info</h3>
                  <div className="info-list">
                    <div className="info-item">
                      <span className="text-muted">Instructor</span>
                      <strong>{course.faculty?.name}</strong>
                    </div>
                    <div className="info-item">
                      <span className="text-muted">Category</span>
                      <strong>{course.category}</strong>
                    </div>
                    <div className="info-item">
                      <span className="text-muted">Level</span>
                      <strong>{course.level}</strong>
                    </div>
                    <div className="info-item">
                      <span className="text-muted">Enrolled Students</span>
                      <strong>{course.enrollmentCount || 0}</strong>
                    </div>
                  </div>

                  {!canViewContent ? (
                    <button
                      className="btn btn-primary w-full btn-lg mt-4"
                      onClick={handleEnroll}
                      disabled={enrolling}
                    >
                      {enrolling ? <><Loader2 size={16} className="spin" /> Enrolling…</> : 'Enroll in Course'}
                    </button>
                  ) : (
                    <div className="badge badge-success w-full text-center py-2 mt-4">
                      ✓ You are enrolled in this course
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VIDEO LECTURES */}
          {activeTab === 'videos' && (
            <div className="tab-pane animate-fadeIn">
              {!canViewContent ? (
                <div className="card course-detail__locked">
                  <Lock size={40} />
                  <h3>Content Locked</h3>
                  <p className="text-muted">Please enroll in this course to watch video lectures.</p>
                  <button className="btn btn-primary mt-3" onClick={handleEnroll}>Enroll Now</button>
                </div>
              ) : videoList.length === 0 ? (
                <div className="card text-center py-12">
                  <Video size={48} style={{ color: 'var(--clr-text-faint)', margin: '0 auto 12px' }} />
                  <h3>No Video Lectures Yet</h3>
                  <p className="text-muted">The instructor hasn't uploaded video materials for this course yet.</p>
                </div>
              ) : (
                <div className="video-layout">
                  {/* Main Video Player */}
                  <div className="video-layout__player">
                    {selectedVideo ? (
                      <VideoPlayer video={selectedVideo} />
                    ) : (
                      <div className="card text-center py-12">Select a video from the list to start watching</div>
                    )}
                  </div>

                  {/* Video Playlist Sidebar */}
                  <div className="video-layout__playlist card">
                    <h4 className="mb-3" style={{ fontSize: '1rem' }}>Course Videos ({videoList.length})</h4>
                    <div className="playlist-list">
                      {videoList.map((v, index) => {
                        const isSelected = selectedVideo?._id === v._id;
                        return (
                          <div
                            key={v._id}
                            className={`playlist-item ${isSelected ? 'playlist-item--active' : ''}`}
                            onClick={() => setSelectedVideo(v)}
                          >
                            <div className="playlist-item__icon">
                              <Play size={14} />
                            </div>
                            <div className="playlist-item__info">
                              <span className="playlist-item__title">{index + 1}. {v.title}</span>
                              <span className="text-xs text-muted">Video Lecture</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: STUDY NOTES (PDF) */}
          {activeTab === 'notes' && (
            <div className="tab-pane animate-fadeIn">
              {!canViewContent ? (
                <div className="card course-detail__locked">
                  <Lock size={40} />
                  <h3>Content Locked</h3>
                  <p className="text-muted">Please enroll in this course to download PDF study notes.</p>
                  <button className="btn btn-primary mt-3" onClick={handleEnroll}>Enroll Now</button>
                </div>
              ) : noteList.length === 0 ? (
                <div className="card text-center py-12">
                  <FileText size={48} style={{ color: 'var(--clr-text-faint)', margin: '0 auto 12px' }} />
                  <h3>No Study Notes Available</h3>
                  <p className="text-muted">No document materials have been uploaded for this course.</p>
                </div>
              ) : (
                <div className="grid-2 gap-4">
                  {noteList.map((note) => {
                    const fileUrl = note.fileUrl?.startsWith('http') || note.fileUrl?.startsWith('/')
                      ? note.fileUrl
                      : `/${note.fileUrl}`;
                    return (
                      <div key={note._id} className="card note-card card-hover">
                        <div className="note-card__icon">
                          <FileText size={24} />
                        </div>
                        <div className="note-card__info">
                          <h4 style={{ fontSize: '0.95rem', margin: 0 }}>{note.title}</h4>
                          {note.description && (
                            <p className="text-muted text-xs" style={{ margin: '4px 0 0' }}>{note.description}</p>
                          )}
                          <span className="text-xs text-muted" style={{ display: 'block', marginTop: 6 }}>
                            Uploaded {new Date(note.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                          download
                        >
                          <Download size={14} /> Download
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ASSIGNMENTS */}
          {activeTab === 'assignments' && (
            <div className="tab-pane animate-fadeIn">
              {!canViewContent ? (
                <div className="card course-detail__locked">
                  <Lock size={40} />
                  <h3>Content Locked</h3>
                  <p className="text-muted">Please enroll in this course to view and submit assignments.</p>
                  <button className="btn btn-primary mt-3" onClick={handleEnroll}>Enroll Now</button>
                </div>
              ) : assignments.length === 0 ? (
                <div className="card text-center py-12">
                  <CheckSquare size={48} style={{ color: 'var(--clr-text-faint)', margin: '0 auto 12px' }} />
                  <h3>No Assignments Created</h3>
                  <p className="text-muted">There are currently no assignments posted for this course.</p>
                </div>
              ) : (
                <div>
                  {assignments.map((assignment) => {
                    const userSub = mySubmissions.find((s) => s.assignment?._id === assignment._id || s.assignment === assignment._id);
                    return (
                      <AssignmentCard
                        key={assignment._id}
                        assignment={assignment}
                        userSubmission={userSub}
                        onSubmissionSuccess={fetchCourseData}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
