const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  recipientRole: {
    type: String,
    enum: ['student', 'alumni', 'admin', 'STUDENT', 'ALUMNI', 'ADMIN'],
    default: 'student'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    default: '',
    trim: true
  },
  type: {
    type: String,
    default: 'session'
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  relatedType: {
    type: String,
    default: null
  },
  unread: {
    type: Boolean,
    default: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id;
      ret.recipient = ret.recipient || ret.userId;
      ret.userId = ret.userId || ret.recipient;
      if (ret.unread !== undefined) {
        ret.isRead = !ret.unread;
      } else if (ret.isRead !== undefined) {
        ret.unread = !ret.isRead;
      }
      return ret;
    }
  }
});

// Sync userId & recipient, unread & isRead
notificationSchema.pre('save', function() {
  if (!this.recipient && this.userId) {
    this.recipient = this.userId;
  } else if (!this.userId && this.recipient) {
    this.userId = this.recipient;
  }

  if (this.isModified('isRead') && !this.isModified('unread')) {
    this.unread = !this.isRead;
  } else if (this.isModified('unread') && !this.isModified('isRead')) {
    this.isRead = !this.unread;
  }
});

module.exports = mongoose.model('Notification', notificationSchema, 'notifications');
