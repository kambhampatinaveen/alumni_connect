const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    default: '10:00 AM'
  },
  meetingLink: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id;
      return ret;
    }
  }
});

const mentorshipSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  alumniId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  domain: {
    type: String,
    default: 'Career Placement & Industry Guidance'
  },
  goal: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['requested', 'pending', 'active', 'accepted', 'completed', 'declined', 'rejected'],
    default: 'pending'
  },
  feedback: {
    type: String,
    default: ''
  },
  sessions: [sessionSchema]
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id;
      return ret;
    }
  }
});

module.exports = mongoose.model('Mentorship', mentorshipSchema, 'mentorships');
