const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { verifyToken, optionalToken } = require('../middleware/authMiddleware');

router.get('/', optionalToken, eventController.getEvents);
router.get('/:id', optionalToken, eventController.getEventById);
router.get('/:id/participants', optionalToken, eventController.getParticipants);
router.post('/', verifyToken, eventController.createEvent);
router.put('/:id', verifyToken, eventController.updateEvent);
router.delete('/:id', verifyToken, eventController.deleteEvent);
router.post('/:id/participate', verifyToken, eventController.participateInEvent);
router.post('/:id/cancel', verifyToken, eventController.cancelEventParticipation);

module.exports = router;
