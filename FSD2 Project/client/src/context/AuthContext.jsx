import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import toast from 'react-hot-toast';
import api from '../api/axiosInstance';

/* ─────────────────────────────────────────────────────────────────────────────
 * Storage keys (centralised so a typo never causes a silent bug)
 * ───────────────────────────────────────────────────────────────────────────── */
const TOKEN_KEY = 'lms_token';
const USER_KEY  = 'lms_user';

/* ─────────────────────────────────────────────────────────────────────────────
 * Context creation
 * ───────────────────────────────────────────────────────────────────────────── */
const AuthContext = createContext(null);

/* ─────────────────────────────────────────────────────────────────────────────
 * AuthProvider
 * Wraps the entire app and makes auth state + actions available to every
 * component via useAuth().
 * ───────────────────────────────────────────────────────────────────────────── */
export const AuthProvider = ({ children }) => {
  // ── Initialise state from localStorage (avoids flash of unauthenticated UI) ─
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);

  // True during async auth operations (login / register / profile fetch)
  const [authLoading, setAuthLoading] = useState(false);

  // True during the initial session-validation on mount
  const [initialising, setInitialising] = useState(true);

  /* ── Sync token into Axios headers whenever it changes ─────────────────── */
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  /* ── On mount: validate the stored token against /api/auth/me ──────────── */
  useEffect(() => {
    const validateSession = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);

      if (!storedToken) {
        setInitialising(false);
        return;
      }

      try {
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        const { data } = await api.get('/auth/me');
        setUser(data.user);
        setToken(storedToken);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      } catch {
        // Token is expired or invalid — clear everything silently
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
        setToken(null);
      } finally {
        setInitialising(false);
      }
    };

    validateSession();
  }, []);

  /* ── Internal helper: persist session data ──────────────────────────────── */
  const persistSession = useCallback((userData, jwtToken) => {
    localStorage.setItem(TOKEN_KEY, jwtToken);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    api.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
    setToken(jwtToken);
    setUser(userData);
  }, []);

  /* ══════════════════════════════════════════════════════════════════════════
   * register
   * Creates a new account and immediately logs the user in on success.
   * @param {{ name, email, password, role? }} formData
   * @returns {{ success: boolean, redirectTo: string }}
   * ══════════════════════════════════════════════════════════════════════════ */
  const register = useCallback(async (formData) => {
    setAuthLoading(true);
    try {
      const { data } = await api.post('/auth/register', formData);
      persistSession(data.user, data.token);
      toast.success(`Welcome, ${data.user.name}! 🎉`);
      // Return the dashboard path so the caller can navigate
      return { success: true, redirectTo: getDashboardPath(data.user.role) };
    } catch (error) {
      toast.error(error.message);
      return { success: false, error: error.message };
    } finally {
      setAuthLoading(false);
    }
  }, [persistSession]);

  /* ══════════════════════════════════════════════════════════════════════════
   * login
   * Authenticates with email + password and persists the session.
   * @param {{ email, password }} credentials
   * @returns {{ success: boolean, redirectTo: string }}
   * ══════════════════════════════════════════════════════════════════════════ */
  const login = useCallback(async ({ email, password }) => {
    setAuthLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      persistSession(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name}!`);
      return { success: true, redirectTo: getDashboardPath(data.user.role) };
    } catch (error) {
      toast.error(error.message);
      return { success: false, error: error.message };
    } finally {
      setAuthLoading(false);
    }
  }, [persistSession]);

  /* ══════════════════════════════════════════════════════════════════════════
   * logout
   * Clears all session data locally (no server call needed for stateless JWT).
   * ══════════════════════════════════════════════════════════════════════════ */
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  }, []);

  /* ══════════════════════════════════════════════════════════════════════════
   * updateUserInContext
   * Call this from any component after a successful profile update so the
   * in-memory and localStorage copies stay in sync.
   * @param {object} updatedUser
   * ══════════════════════════════════════════════════════════════════════════ */
  const updateUserInContext = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  }, []);

  /* ── Convenience booleans ──────────────────────────────────────────────── */
  const isAuthenticated = !!user && !!token;
  const isAdmin   = user?.role === 'admin';
  const isFaculty = user?.role === 'faculty';
  const isStudent = user?.role === 'student';

  /* ── Memoised context value (prevents unnecessary re-renders) ───────────── */
  const value = useMemo(() => ({
    user,
    token,
    authLoading,
    initialising,
    isAuthenticated,
    isAdmin,
    isFaculty,
    isStudent,
    login,
    register,
    logout,
    updateUserInContext,
  }), [
    user, token, authLoading, initialising,
    isAuthenticated, isAdmin, isFaculty, isStudent,
    login, register, logout, updateUserInContext,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/* ─────────────────────────────────────────────────────────────────────────────
 * useAuth
 * Custom hook – throws a friendly error if used outside AuthProvider.
 * ───────────────────────────────────────────────────────────────────────────── */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an <AuthProvider>');
  }
  return context;
};

/* ─────────────────────────────────────────────────────────────────────────────
 * getDashboardPath
 * Returns the correct dashboard URL for each role.
 * ───────────────────────────────────────────────────────────────────────────── */
export const getDashboardPath = (role) => {
  switch (role) {
    case 'admin':   return '/admin/dashboard';
    case 'faculty': return '/faculty/dashboard';
    case 'student':
    default:        return '/student/dashboard';
  }
};

export default AuthContext;
