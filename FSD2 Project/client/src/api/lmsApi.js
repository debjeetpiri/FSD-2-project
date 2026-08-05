import api from './axiosInstance';

/* ── Course endpoints ─────────────────────────────────────────────────────── */
export const courseAPI = {
  /** GET /api/courses  – public listing with optional query params */
  getAll: (params = {}) => api.get('/courses', { params }),

  /** GET /api/courses/my  – role-scoped: faculty own / student enrolled / admin all */
  getMy: () => api.get('/courses/my'),

  /** GET /api/courses/:id  – single course with materials + assignments */
  getById: (id) => api.get(`/courses/${id}`),

  /** POST /api/courses  – multipart/form-data (thumbnail optional) */
  create: (formData) =>
    api.post('/courses', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  /** PUT /api/courses/:id  – multipart/form-data */
  update: (id, formData) =>
    api.put(`/courses/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  /** DELETE /api/courses/:id */
  delete: (id) => api.delete(`/courses/${id}`),

  /** POST /api/courses/:id/enroll */
  enroll: (id) => api.post(`/courses/${id}/enroll`),

  /** DELETE /api/courses/:id/enroll */
  unenroll: (id) => api.delete(`/courses/${id}/enroll`),
};

/* ── Material endpoints ───────────────────────────────────────────────────── */
export const materialAPI = {
  /** POST /api/materials?type=note|video  – multipart/form-data */
  upload: (formData, type = 'note') =>
    api.post(`/materials?type=${type}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /** GET /api/materials/course/:courseId */
  getByCourse: (courseId) => api.get(`/materials/course/${courseId}`),

  /** GET /api/materials/:id */
  getById: (id) => api.get(`/materials/${id}`),

  /** PUT /api/materials/:id */
  update: (id, data) => api.put(`/materials/${id}`, data),

  /** DELETE /api/materials/:id */
  delete: (id) => api.delete(`/materials/${id}`),
};

/* ── Assignment endpoints ─────────────────────────────────────────────────── */
export const assignmentAPI = {
  /** POST /api/assignments */
  create: (data) => api.post('/assignments', data),

  /** GET /api/assignments/course/:courseId */
  getByCourse: (courseId) => api.get(`/assignments/course/${courseId}`),

  /** GET /api/assignments/:id */
  getById: (id) => api.get(`/assignments/${id}`),

  /** PUT /api/assignments/:id */
  update: (id, data) => api.put(`/assignments/${id}`, data),

  /** DELETE /api/assignments/:id */
  delete: (id) => api.delete(`/assignments/${id}`),
};

/* ── Submission endpoints ─────────────────────────────────────────────────── */
export const submissionAPI = {
  /** POST /api/submissions  – multipart/form-data with file field "file" */
  submit: (formData) =>
    api.post('/submissions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /** GET /api/submissions/my */
  getMy: () => api.get('/submissions/my'),

  /** GET /api/submissions/assignment/:assignmentId */
  getByAssignment: (assignmentId) =>
    api.get(`/submissions/assignment/${assignmentId}`),

  /** GET /api/submissions/:id */
  getById: (id) => api.get(`/submissions/${id}`),

  /** PUT /api/submissions/:id/grade */
  grade: (id, data) => api.put(`/submissions/${id}/grade`, data),

  /** DELETE /api/submissions/:id */
  delete: (id) => api.delete(`/submissions/${id}`),
};

/* ── User endpoints (Admin) ───────────────────────────────────────────────── */
export const userAPI = {
  /** GET /api/users/stats */
  getStats: () => api.get('/users/stats'),

  /** GET /api/users */
  getAll: (params = {}) => api.get('/users', { params }),

  /** PUT /api/users/:id/role */
  updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),

  /** PUT /api/users/:id/status */
  toggleStatus: (id) => api.put(`/users/${id}/status`),
};
