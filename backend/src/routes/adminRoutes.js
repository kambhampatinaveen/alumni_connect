const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.put('/simulate-inactivity/:id', verifyToken, requireAdmin, adminController.simulateInactivity);
router.post('/reset-data', adminController.resetData);

module.exports = router;
