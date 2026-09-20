const express = require('express');
const router = express.Router();
const mentorClassController = require('../controllers/mentorClassController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, mentorClassController.getMentorClasses);
router.post('/', verifyToken, mentorClassController.createMentorClass);

module.exports = router;
