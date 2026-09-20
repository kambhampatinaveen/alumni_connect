const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyToken, studentController.getStudents);
router.post('/', verifyToken, requireAdmin, studentController.createStudent);
router.put('/:id', verifyToken, requireAdmin, studentController.updateStudent);
router.delete('/:id', verifyToken, requireAdmin, studentController.deleteStudent);

module.exports = router;
