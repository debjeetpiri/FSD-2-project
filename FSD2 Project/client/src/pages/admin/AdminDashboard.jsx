import { useState, useEffect, useCallback } from 'react';
import {
  Users, Shield, BookOpen, FileText, Search, Filter,
  UserCheck, UserX, UserPlus, CheckCircle, AlertTriangle,
  ChevronLeft, ChevronRight, Loader2, RefreshCw
} from 'lucide-react';
import { userAPI } from '../../api/lmsApi';
import toast from 'react-hot-toast';
import './AdminDashboard.css';

const ROLES = ['all', 'student', 'faculty', 'admin'];

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFaculty: 0,
    totalAdmins: 0,
    totalUsers: 0,
    totalCourses: 0,
    publishedCourses: 0,
    totalMaterials: 0,
    totalSubmissions: 0,
  });

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [actionUserId, setActionUserId] = useState(null); // tracking row button loading

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsersCount, setTotalUsersCount] = useState(0);

  /* ── Fetch Stats ───────────────────────────────────────────────────────── */
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const { data } = await userAPI.getStats();
      setStats(data.stats);
    } catch (err) {
      toast.error(err.message || 'Failed to load stats');
    } finally {
      setLoadingStats(false);
    }
  };

  /* ── Fetch Users ───────────────────────────────────────────────────────── */
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const params = { page, limit: 8 };
      if (roleFilter !== 'all') params.role = roleFilter;
      if (search.trim()) params.search = search.trim();

      const { data } = await userAPI.getAll(params);
      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
      setTotalUsersCount(data.total || 0);
    } catch (err) {
      toast.error(err.message || 'Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  }, [page, roleFilter, search]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /* ── Actions ───────────────────────────────────────────────────────────── */
  const handleRoleChange = async (userId, newRole) => {
    setActionUserId(userId);
    try {
      const { data } = await userAPI.updateRole(userId, newRole);
      toast.success(data.message || 'Role updated');
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
      fetchStats();
    } catch (err) {
      toast.error(err.message || 'Failed to update role');
    } finally {
      setActionUserId(null);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const actionName = currentStatus ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${actionName} this user account?`)) return;

    setActionUserId(userId);
    try {
      const { data } = await userAPI.toggleStatus(userId);
      toast.success(data.message || 'Account status updated');
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isActive: !currentStatus } : u))
      );
    } catch (err) {
      toast.error(err.message || 'Failed to update account status');
    } finally {
      setActionUserId(null);
    }
  };

  const statCards = [
    { label: 'Total Students', value: loadingStats ? '…' : stats.totalStudents, icon: <Users size={22} />, color: 'var(--clr-primary-light)' },
    { label: 'Faculty Members', value: loadingStats ? '…' : stats.totalFaculty, icon: <UserCheck size={22} />, color: 'var(--clr-accent)' },
    { label: 'Total Courses', value: loadingStats ? '…' : stats.totalCourses, icon: <BookOpen size={22} />, color: 'var(--clr-warning)' },
    { label: 'Total Submissions', value: loadingStats ? '…' : stats.totalSubmissions, icon: <FileText size={22} />, color: 'var(--clr-success)' },
  ];

  return (
    <div className="page-wrapper container animate-fadeInUp">
      {/* Header */}
      <div className="dashboard-header mb-6">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div className="admin-badge-icon">
            <Shield size={28} />
          </div>
          <div>
            <h1>Admin <span className="gradient-text">Control Panel</span></h1>
            <p className="text-muted">Manage system users, roles, account statuses, and view platform metrics.</p>
          </div>
        </div>

        <button className="btn btn-secondary" onClick={() => { fetchStats(); fetchUsers(); }}>
          <RefreshCw size={15} /> Refresh Data
        </button>
      </div>

      {/* Platform Stats Grid */}
      <div className="grid-4 mb-8">
        {statCards.map(({ label, value, icon, color }) => (
          <div key={label} className="card stat-card" style={{ borderColor: `${color}30` }}>
            <div className="stat-card__icon" style={{ color }}>{icon}</div>
            <div className="stat-card__value">{value}</div>
            <div className="stat-card__label text-muted text-sm">{label}</div>
          </div>
        ))}
      </div>

      {/* User Management Section */}
      <section className="card user-mgmt-section">
        <div className="user-mgmt-header mb-4">
          <div>
            <h2>User Management</h2>
            <p className="text-muted text-sm">
              Showing {totalUsersCount} registered platform user{totalUsersCount !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Filters */}
          <div className="user-mgmt-filters">
            <div className="search-box">
              <Search size={15} className="search-box__icon" />
              <input
                className="form-input"
                style={{ paddingLeft: '2.25rem', height: 36, fontSize: '0.875rem' }}
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>

            <select
              className="form-select"
              style={{ height: 36, fontSize: '0.875rem', width: 140 }}
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            >
              <option value="all">All Roles</option>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        {/* User Table */}
        <div className="table-responsive">
          <table className="user-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingUsers ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} style={{ padding: '0.75rem' }}>
                      <div className="skeleton" style={{ height: 28, borderRadius: 4 }} />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <p className="text-muted">No users found matching filter criteria.</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isWorking = actionUserId === u._id;
                  return (
                    <tr key={u._id} className={!u.isActive ? 'tr-deactivated' : ''}>
                      {/* Name & Email */}
                      <td>
                        <div className="user-cell">
                          <div className="user-cell__avatar">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="user-cell__name">{u.name}</div>
                            <div className="text-muted text-xs">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role Selector */}
                      <td>
                        <select
                          className="form-select role-select"
                          value={u.role}
                          disabled={isWorking}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        >
                          <option value="student">Student</option>
                          <option value="faculty">Faculty</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {u.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td className="text-sm text-muted">
                        {new Date(u.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </td>

                      {/* Action buttons */}
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-secondary'}`}
                          disabled={isWorking}
                          onClick={() => handleToggleStatus(u._id, u.isActive)}
                          title={u.isActive ? 'Deactivate Account' : 'Activate Account'}
                        >
                          {isWorking ? (
                            <Loader2 size={13} className="spin" />
                          ) : u.isActive ? (
                            <><UserX size={13} /> Deactivate</>
                          ) : (
                            <><UserCheck size={13} /> Activate</>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="courses-page__pagination mt-4">
            <button
              className="btn btn-secondary btn-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={15} /> Prev
            </button>
            <span className="text-muted text-sm">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </span>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next <ChevronRight size={15} />
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminDashboard;
