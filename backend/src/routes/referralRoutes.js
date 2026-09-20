const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, referralController.getReferrals);
router.post('/', verifyToken, referralController.createReferral);
router.put('/:id', verifyToken, referralController.updateReferralStatus);

module.exports = router;
