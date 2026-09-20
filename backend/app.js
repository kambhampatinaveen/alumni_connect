const express = require('express');
const cors = require('cors');
const apiRoutes = require('./src/routes');
const { notFound, errorHandler } = require('./src/middleware/errorMiddleware');

const app = express();

// CORS Configuration
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure req.body is always an object even if empty
app.use((req, res, next) => {
  if (!req.body || typeof req.body !== 'object') {
    req.body = {};
  }
  next();
});

// Root Health & API Info Endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'AlumniConnect Backend API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      alumni: '/api/alumni',
      students: '/api/students',
      events: '/api/events',
      mentorships: '/api/mentorships',
      messages: '/api/messages',
      referrals: '/api/referrals',
      notifications: '/api/notifications',
      analytics: '/api/analytics',
      health: '/api/health'
    }
  });
});

// API Routes (mounted both on /api and root / for Postman flexibility)
app.use('/api', apiRoutes);
app.use('/', apiRoutes);

// Fallback & Error Handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
