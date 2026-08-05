import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute    from './components/ProtectedRoute';
import Navbar            from './components/layout/Navbar';
import Footer            from './components/layout/Footer';

/* ── Public pages ────────────────────────────────────────────────────────── */
import HomePage     from './pages/public/Home';
import CoursesPage  from './pages/public/Courses';
import ContactPage  from './pages/public/Contact';

/* ── Auth pages ──────────────────────────────────────────────────────────── */
import LoginPage    from './pages/auth/Login';
import RegisterPage from './pages/auth/Register';

/* ── Student pages ───────────────────────────────────────────────────────── */
import StudentDashboard from './pages/student/StudentDashboard';
import CourseDetailPage from './pages/student/CourseDetail';

/* ── Faculty pages ───────────────────────────────────────────────────────── */
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import CreateCoursePage from './pages/faculty/CreateCourse';

/* ── Admin pages ─────────────────────────────────────────────────────────── */
import AdminDashboard   from './pages/admin/AdminDashboard';

/* ── Error pages ─────────────────────────────────────────────────────────── */
import UnauthorizedPage from './pages/error/Unauthorized';
import NotFoundPage     from './pages/error/NotFound';

/* ─────────────────────────────────────────────────────────────────────────────
 * AppLayout
 * Wraps every route in the sticky Navbar + Footer shell.
 * The <main> element is the scroll root for page content.
 * ───────────────────────────────────────────────────────────────────────────── */
const AppLayout = ({ children }) => (
  <>
    <Navbar />
    <main id="main-content" style={{ flex: 1 }}>
      {children}
    </main>
    <Footer />
  </>
);

/* ─────────────────────────────────────────────────────────────────────────────
 * App
 * ───────────────────────────────────────────────────────────────────────────── */
const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#0f172a',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
          },
        }}
      />
      {/* Full-height flex column so Footer is always pushed to the bottom */}
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Routes>

          {/* ════════════════════════════════════════════════════════════════
           * PUBLIC ROUTES
           * Wrapped in AppLayout (Navbar + Footer)
           * ════════════════════════════════════════════════════════════════ */}
          <Route
            path="/"
            element={
              <AppLayout>
                <HomePage />
              </AppLayout>
            }
          />
          <Route
            path="/courses"
            element={
              <AppLayout>
                <CoursesPage />
              </AppLayout>
            }
          />
          <Route
            path="/contact"
            element={
              <AppLayout>
                <ContactPage />
              </AppLayout>
            }
          />

          {/* ════════════════════════════════════════════════════════════════
           * AUTH ROUTES (no layout – centred card pages)
           * ════════════════════════════════════════════════════════════════ */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ════════════════════════════════════════════════════════════════
           * STUDENT ROUTES  (role: student)
           * ════════════════════════════════════════════════════════════════ */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute roles={['student']}>
                <AppLayout>
                  <StudentDashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/course/:id"
            element={
              <ProtectedRoute roles={['student', 'faculty', 'admin']}>
                <AppLayout>
                  <CourseDetailPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* ════════════════════════════════════════════════════════════════
           * FACULTY ROUTES  (role: faculty)
           * ════════════════════════════════════════════════════════════════ */}
          <Route
            path="/faculty/dashboard"
            element={
              <ProtectedRoute roles={['faculty', 'admin']}>
                <AppLayout>
                  <FacultyDashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/create-course"
            element={
              <ProtectedRoute roles={['faculty', 'admin']}>
                <AppLayout>
                  <CreateCoursePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* ════════════════════════════════════════════════════════════════
           * ADMIN ROUTES  (role: admin only)
           * ════════════════════════════════════════════════════════════════ */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute roles={['admin']}>
                <AppLayout>
                  <AdminDashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* ════════════════════════════════════════════════════════════════
           * ERROR ROUTES
           * ════════════════════════════════════════════════════════════════ */}
          <Route
            path="/unauthorized"
            element={
              <AppLayout>
                <UnauthorizedPage />
              </AppLayout>
            }
          />

          {/* Catch-all 404 */}
          <Route
            path="*"
            element={
              <AppLayout>
                <NotFoundPage />
              </AppLayout>
            }
          />

        </Routes>
      </div>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
