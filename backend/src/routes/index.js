const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const alumniRoutes = require('./alumniRoutes');
const studentRoutes = require('./studentRoutes');
const eventRoutes = require('./eventRoutes');
const mentorshipRoutes = require('./mentorshipRoutes');
const messageRoutes = require('./messageRoutes');
const mentorClassRoutes = require('./mentorClassRoutes');
const referralRoutes = require('./referralRoutes');
const notificationRoutes = require('./notificationRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const adminRoutes = require('./adminRoutes');
const { healthCheck } = require('../controllers/adminController');

// System Health Check
router.get('/health', healthCheck);

// Mount sub-routers
router.use('/auth', authRoutes);
router.use('/alumni', alumniRoutes);
router.use('/students', studentRoutes);
router.use('/events', eventRoutes);
router.use('/mentorships', mentorshipRoutes);
router.use('/messages', messageRoutes);
router.use('/mentor-classes', mentorClassRoutes);
router.use('/referrals', referralRoutes);
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
