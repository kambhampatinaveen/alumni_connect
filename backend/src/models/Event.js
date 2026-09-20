const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    default: 'Technical Workshop'
  },
  description: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    default: '10:00 AM'
  },
  mode: {
    type: String,
    enum: ['Online', 'Offline'],
    default: 'Online',
    required: true
  },
  location: {
    type: String,
    default: 'Virtual Meet'
  },
  meetingLink: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdByRole: {
    type: String,
    enum: ['admin', 'alumni'],
    required: true
  },
  creatorName: {
    type: String,
    default: ''
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'],
    default: 'UPCOMING'
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id;
      ret.participantCount = Array.isArray(ret.participants) ? ret.participants.length : 0;
      if (!ret.title) ret.title = ret.name;
      if (!ret.name) ret.name = ret.title;
      return ret;
    }
  }
});

module.exports = mongoose.model('Event', eventSchema, 'events');
