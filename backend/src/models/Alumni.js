const mongoose = require('mongoose');

const alumniSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    default: '',
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^[0-9]{10}$/.test(v);
      },
      message: 'Phone number must contain exactly 10 digits.'
    }
  },
  industry: {
    type: String,
    default: 'Technology',
    trim: true
  },
  rollNumber: {
    type: String,
    default: ''
  },
  branch: {
    type: String,
    default: 'CSE'
  },
  college: {
    type: String,
    default: 'KIET'
  },
  company: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    default: 'Software Engineer'
  },
  designation: {
    type: String,
    default: 'Software Engineer'
  },
  ctc: {
    type: String,
    default: '12 LPA'
  },
  batch: {
    type: String,
    default: '2023'
  },
  department: {
    type: String,
    default: 'Computer Science'
  },
  location: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'BLOCKED', 'Verified', 'Active'],
    default: 'ACTIVE'
  },
  last_login: {
    type: Date,
    default: Date.now
  },
  avatar: {
    type: String,
    default: ''
  },
  skills: [{
    type: String
  }],
  bio: {
    type: String,
    default: ''
  },
  availability: {
    type: String,
    default: 'Available for Mentorship'
  },
  mentorshipDomain: {
    type: String,
    default: 'Software Development & Placement'
  },
  engagementScore: {
    type: Number,
    default: 85
  },
  mentorshipsCompleted: {
    type: Number,
    default: 0
  },
  eventsAttended: {
    type: Number,
    default: 0
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

module.exports = mongoose.model('Alumni', alumniSchema, 'alumnis');
