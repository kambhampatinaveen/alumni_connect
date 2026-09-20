const mongoose = require('mongoose');

const mentorClassSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
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
  meetingLink: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  creatorName: {
    type: String,
    default: ''
  },
  targetType: {
    type: String,
    enum: ['all', 'select'],
    default: 'all'
  },
  studentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  studentNames: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['UPCOMING', 'COMPLETED', 'CANCELLED'],
    default: 'UPCOMING'
  }
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

module.exports = mongoose.model('MentorClass', mentorClassSchema, 'mentorclasses');
