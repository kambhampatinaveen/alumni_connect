const Event = require('../models/Event');
const Participation = require('../models/Participation');
const User = require('../models/User');
const { calculateEventStatus, sanitizeEventForUser } = require('../utils/eventHelper');
const { createNotification, notifyAdmins } = require('../utils/notificationHelper');

async function getEvents(req, res) {
  try {
    const events = await Event.find()
      .populate('createdBy', 'name email role avatar company designation')
      .sort({ date: 1 });

    let formatted = events.map(ev => sanitizeEventForUser(ev, req.user));

    const { status } = req.query;
    if (status && status.toLowerCase() !== 'all') {
      const s = status.toLowerCase();
      if (s === 'registered') {
        formatted = formatted.filter(e => e.isRegistered);
      } else if (s === 'notregistered' || s === 'not registered' || s === 'not_registered') {
        formatted = formatted.filter(e => !e.isRegistered && !e.isCreator);
      } else {
        formatted = formatted.filter(e => e.status.toLowerCase() === s);
      }
    }

    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
}

async function getEventById(req, res) {
  try {
    const ev = await Event.findById(req.params.id)
      .populate('createdBy', 'name email role avatar company designation')
      .populate('participants', 'name email role avatar');
    if (!ev) return res.status(404).json({ error: 'Event not found' });

    const item = sanitizeEventForUser(ev, req.user);
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch event' });
  }
}

async function createEvent(req, res) {
  if (req.user.role === 'student') {
    return res.status(403).json({ error: 'Students do not have permission to host or create events.' });
  }

  try {
    const { name, title, type, description, date, time, mode, location, meetingLink } = req.body;
    if (!date) {
      return res.status(400).json({ error: 'Event date is required.' });
    }

    // Date validation: no past dates
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const eventDate = new Date(date);

    if (isNaN(eventDate.getTime()) || eventDate < todayStart) {
      return res.status(400).json({ error: 'Event date cannot be in the past. Please select today or a future date.' });
    }

    let eventMode = 'Online';
    if (mode) {
      eventMode = String(mode).toLowerCase() === 'offline' ? 'Offline' : 'Online';
    } else if (location && location.toLowerCase() !== 'online' && !meetingLink) {
      eventMode = 'Offline';
    }

    let finalMeetingLink = (meetingLink || '').trim();

    if (eventMode === 'Online') {
      if (finalMeetingLink) {
        try {
          const parsedUrl = new URL(finalMeetingLink);
          if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            throw new Error();
          }
        } catch (err) {
          return res.status(400).json({ error: 'Meeting link must be a valid HTTP or HTTPS URL.' });
        }
      } else if (mode && String(mode).toLowerCase() === 'online') {
        return res.status(400).json({ error: 'Meeting link is required for Online events.' });
      } else {
        finalMeetingLink = 'https://meet.google.com/xyz-alumni-event';
      }
    } else {
      if (!location || !location.trim()) {
        return res.status(400).json({ error: 'Meeting location/venue is required for Offline events.' });
      }
    }

    const event = await Event.create({
      name: (name || title || 'Event').trim(),
      title: (title || name || 'Event').trim(),
      type: type || 'Technical Workshop',
      description: description || '',
      date: eventDate,
      time: time || '10:00 AM',
      mode: eventMode,
      location: eventMode === 'Offline' ? location.trim() : 'Online',
      meetingLink: eventMode === 'Online' ? finalMeetingLink : '',
      createdBy: req.user.id,
      createdByRole: req.user.role,
      creatorName: req.user.name || 'Event Organizer',
      participants: []
    });

    const resItem = sanitizeEventForUser(event, req.user);

    // Administrative notification to Admin (if creator is not admin)
    if (req.user.role !== 'admin') {
      await notifyAdmins({
        type: 'event_created',
        title: 'New Event Created',
        message: `${req.user.name || 'An alumni'} created a new event: ${event.title || event.name}.`,
        relatedId: event._id,
        relatedType: 'Event',
        metadata: { eventId: event._id, eventName: event.title || event.name }
      });
    }

    // Broadcast notification to students and alumni
    try {
      const audience = await User.find({
        _id: { $ne: req.user.id },
        role: { $in: ['student', 'alumni'] }
      }).select('_id');

      for (const u of audience) {
        await createNotification({
          recipient: u._id,
          type: 'event_created',
          title: 'New Event Available',
          message: `A new event '${event.title || event.name}' has been published.`,
          relatedId: event._id,
          relatedType: 'Event',
          metadata: { eventId: event._id, eventName: event.title || event.name }
        });
      }
    } catch (broadcastErr) {
      console.error('Event broadcast notification error:', broadcastErr.message);
    }

    res.status(201).json({ success: true, data: resItem });
  } catch (err) {
    console.error('Create Event error:', err.message);
    res.status(400).json({ error: err.message });
  }
}

async function updateEvent(req, res) {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const isCreator = event.createdBy.toString() === req.user.id.toString() ||
      (req.user.role === 'admin' && event.createdByRole === 'admin');

    if (!isCreator && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to edit this event.' });
    }

    if (req.body.date) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const eventDate = new Date(req.body.date);
      if (isNaN(eventDate.getTime()) || eventDate < todayStart) {
        return res.status(400).json({ error: 'Event date cannot be in the past.' });
      }
      event.date = eventDate;
    }

    if (req.body.mode) {
      const eventMode = String(req.body.mode).toLowerCase() === 'offline' ? 'Offline' : 'Online';
      event.mode = eventMode;
      if (eventMode === 'Online') {
        const link = req.body.meetingLink || event.meetingLink;
        if (!link || !link.trim()) {
          return res.status(400).json({ error: 'Meeting link is required for Online events.' });
        }
        try {
          const parsed = new URL(link.trim());
          if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
        } catch (e) {
          return res.status(400).json({ error: 'Meeting link must be a valid HTTP or HTTPS URL.' });
        }
        event.meetingLink = link.trim();
        event.location = 'Online';
      } else {
        const loc = req.body.location || (event.location !== 'Online' ? event.location : '');
        if (!loc || !loc.trim()) {
          return res.status(400).json({ error: 'Meeting location/venue is required for Offline events.' });
        }
        event.location = loc.trim();
        event.meetingLink = '';
      }
    } else {
      if (req.body.location) event.location = req.body.location;
      if (req.body.meetingLink !== undefined) event.meetingLink = req.body.meetingLink;
    }

    if (req.body.name) event.name = req.body.name;
    if (req.body.title) event.title = req.body.title;
    if (req.body.type) event.type = req.body.type;
    if (req.body.description !== undefined) event.description = req.body.description;
    if (req.body.time) event.time = req.body.time;
    if (req.body.status) event.status = req.body.status;

    await event.save();
    const updatedItem = sanitizeEventForUser(event, req.user);

    // Notify registered participants about event update
    if (Array.isArray(event.participants) && event.participants.length > 0) {
      for (const pId of event.participants) {
        await createNotification({
          recipient: pId,
          type: 'event_updated',
          title: 'Event Updated',
          message: `The event '${event.title || event.name}' has been updated.`,
          relatedId: event._id,
          relatedType: 'Event',
          metadata: { eventId: event._id, eventName: event.title || event.name }
        });
      }
    }

    res.json({ success: true, data: updatedItem });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function deleteEvent(req, res) {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const isCreator = event.createdBy.toString() === req.user.id.toString() ||
      (req.user.role === 'admin' && event.createdByRole === 'admin');

    if (!isCreator && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to delete this event.' });
    }

    // Notify registered participants about event cancellation
    if (Array.isArray(event.participants) && event.participants.length > 0) {
      for (const pId of event.participants) {
        await createNotification({
          recipient: pId,
          type: 'event_cancelled',
          title: 'Event Cancelled',
          message: `The event '${event.title || event.name}' has been cancelled.`,
          relatedId: event._id,
          relatedType: 'Event',
          metadata: { eventId: event._id, eventName: event.title || event.name }
        });
      }
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function participateInEvent(req, res) {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const currentStatus = calculateEventStatus(event);
    if (currentStatus === 'COMPLETED') {
      return res.status(400).json({ error: 'This event has already ended. Registration is closed.' });
    }

    const userId = req.user.id;

    // Check if event creator is trying to register for their own event
    if (event.createdBy && event.createdBy.toString() === userId.toString()) {
      return res.status(400).json({ error: 'Event creator cannot register for own event.' });
    }

    const alreadyInEvent = Array.isArray(event.participants) &&
      event.participants.some(p => (p._id || p).toString() === userId.toString());
    const existingParticipation = await Participation.findOne({
      eventId: event._id,
      userId: userId
    });

    if (alreadyInEvent || existingParticipation) {
      return res.status(400).json({ error: 'You are already registered for this event.' });
    }

    // Add to event.participants if not already present
    if (!alreadyInEvent) {
      event.participants.push(userId);
      await event.save();
    }

    // Create record in Participation collection with unique compound key
    try {
      await Participation.create({
        eventId: event._id,
        userId: userId,
        role: req.user.role || 'student',
        userName: req.user.name || '',
        userEmail: req.user.email || '',
        status: 'registered'
      });
    } catch (partErr) {
      if (partErr.code === 11000) {
        return res.status(400).json({ error: 'You are already registered for this event.' });
      }
      console.warn('Participation write warning:', partErr.message);
    }

    const item = sanitizeEventForUser(event, req.user);

    // 1. Notify event creator (organizer) if registrant is not creator
    if (event.createdBy && event.createdBy.toString() !== userId.toString()) {
      await createNotification({
        recipient: event.createdBy,
        type: 'event_registration',
        title: 'New Event Registration',
        message: `${req.user.name} registered for ${event.title || event.name}.`,
        relatedId: event._id,
        relatedType: 'Event',
        metadata: { eventId: event._id, participantId: userId, participantName: req.user.name }
      });
    }

    // 2. Notify Admins
    await notifyAdmins({
      type: 'event_registration',
      title: 'New Event Registration',
      message: `${req.user.name} registered for ${event.title || event.name}.`,
      relatedId: event._id,
      relatedType: 'Event',
      metadata: { eventId: event._id, participantId: userId, participantName: req.user.name }
    });

    res.status(201).json({ success: true, message: 'Registration completed successfully.', data: item });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function cancelEventParticipation(req, res) {
  return res.status(403).json({ error: 'Event registration cancellation is not permitted.' });
}

async function getParticipants(req, res) {
  try {
    const ev = await Event.findById(req.params.id).populate('participants', 'name email role avatar department batch');
    if (!ev) return res.status(404).json({ error: 'Event not found' });
    res.json({ success: true, count: (ev.participants || []).length, data: ev.participants || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch participants' });
  }
}

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  participateInEvent,
  cancelEventParticipation,
  getParticipants
};
