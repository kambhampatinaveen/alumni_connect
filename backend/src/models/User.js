const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
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
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'alumni', 'student', 'ADMIN', 'ALUMNI', 'STUDENT', 'Admin', 'Alumni', 'Student'],
    lowercase: true,
    trim: true,
    required: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'BLOCKED'],
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
  department: {
    type: String,
    default: ''
  },
  designation: {
    type: String,
    default: ''
  },
  company: {
    type: String,
    default: ''
  },
  batch: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  about: {
    type: String,
    default: ''
  },
  skills: [{
    type: String
  }],
  linkedin: {
    type: String,
    default: ''
  },
  github: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret.passwordHash;
      return ret;
    }
  }
});

module.exports = mongoose.model('User', userSchema, 'users');
