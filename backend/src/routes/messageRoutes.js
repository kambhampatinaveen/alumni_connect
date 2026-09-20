const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/conversations', verifyToken, messageController.getConversations);
router.get('/unread-count', verifyToken, messageController.getUnreadCount);
router.get('/:mentorshipId', verifyToken, messageController.getMessages);
router.post('/', verifyToken, messageController.sendMessage);
router.put('/:mentorshipId/read', verifyToken, messageController.markAsRead);

module.exports = router;
