const express = require('express');
const router = express.Router();
const mentorshipController = require('../controllers/mentorshipController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, mentorshipController.getMentorships);
router.get('/:id', verifyToken, mentorshipController.getMentorshipById);
router.post('/', verifyToken, mentorshipController.requestMentorship);
router.put('/:id', verifyToken, mentorshipController.updateMentorship);
router.put('/:id/status', verifyToken, mentorshipController.updateMentorship);
router.post('/:id/sessions', verifyToken, mentorshipController.addSession);

module.exports = router;
