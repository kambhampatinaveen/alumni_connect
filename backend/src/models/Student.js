const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
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
  rollNumber: {
    type: String,
    default: ''
  },
  department: {
    type: String,
    enum: ['AID', 'CSD', 'CSC', 'CSM', 'CAI'],
    default: 'AID',
    required: true
  },
  batch: {
    type: String,
    default: '2025'
  },
  gpa: {
    type: String,
    default: '3.8'
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'BLOCKED', 'Active', 'Enrolled'],
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
  interests: [{
    type: String
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

module.exports = mongoose.model('Student', studentSchema, 'students');
