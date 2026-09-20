const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  alumniId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  jobTitle: {
    type: String,
    required: true,
    trim: true
  },
  applicationLink: {
    type: String,
    default: '',
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Shortlisted', 'Selected', 'Rejected', 'pending', 'shortlisted', 'selected', 'rejected'],
    default: 'Pending'
  },
  notes: {
    type: String,
    default: ''
  },
  applications: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['Pending', 'Shortlisted', 'Selected', 'Rejected', 'pending', 'shortlisted', 'selected', 'rejected'],
      default: 'Pending'
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }]
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

module.exports = mongoose.model('Referral', referralSchema, 'referrals');
