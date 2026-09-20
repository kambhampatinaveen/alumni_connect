const express = require('express');
const router = express.Router();
const alumniController = require('../controllers/alumniController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', alumniController.getAlumni);
router.post('/', verifyToken, requireAdmin, alumniController.createAlumnus);
router.put('/:id', verifyToken, requireAdmin, alumniController.updateAlumnus);
router.delete('/:id', verifyToken, requireAdmin, alumniController.deleteAlumnus);

module.exports = router;
