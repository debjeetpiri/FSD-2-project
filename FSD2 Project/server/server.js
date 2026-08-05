require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

/* ─── Connect to MongoDB ─────────────────────────────────────────────────── */
connectDB();

const app = express();

/* ─── Global Middleware ──────────────────────────────────────────────────── */
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* ─── Static Files: Serve uploaded files (/uploads) ──────────────────────── */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ─── API REST Routes ────────────────────────────────────────────────────── */
app.use('/api/auth',        require('./routes/authRoutes'));
app.use('/api/courses',     require('./routes/courseRoutes'));
app.use('/api/materials',   require('./routes/materialRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/submissions', require('./routes/submissionRoutes'));
app.use('/api/users',       require('./routes/userRoutes'));

/* ─── Health Check Endpoint ─────────────────────────────────────────────── */
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

/* ─── 404 Not Found Handler ──────────────────────────────────────────────── */
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

/* ─── Global Error Handler Middleware ────────────────────────────────────── */
app.use((err, req, res, next) => {
  // Respect status code set in controller or default to 500
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  console.error(`[SERVER ERROR] ${req.method} ${req.originalUrl} - ${err.message}`);

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

/* ─── Server Initialization ─────────────────────────────────────────────── */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(
    `🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
  );
});

module.exports = app;
