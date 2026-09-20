const Notification = require('../models/Notification');

async function getNotifications(req, res) {
  try {
    const list = await Notification.find({
      $or: [{ userId: req.user.id }, { recipient: req.user.id }]
    })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      $or: [{ userId: req.user.id }, { recipient: req.user.id }],
      unread: true
    });

    res.json({ success: true, count: list.length, unreadCount, data: list });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
}

async function getUnreadCount(req, res) {
  try {
    const unreadCount = await Notification.countDocuments({
      $or: [{ userId: req.user.id }, { recipient: req.user.id }],
      unread: true
    });
    res.json({ success: true, unreadCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
}

async function markAsRead(req, res) {
  try {
    const item = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        $or: [{ userId: req.user.id }, { recipient: req.user.id }]
      },
      { unread: false, isRead: true },
      { returnDocument: 'after' }
    );
    if (!item) {
      return res.status(404).json({ error: 'Notification not found or access denied' });
    }
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function markAllRead(req, res) {
  try {
    await Notification.updateMany(
      { $or: [{ userId: req.user.id }, { recipient: req.user.id }] },
      { unread: false, isRead: true }
    );
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function deleteNotification(req, res) {
  try {
    await Notification.findOneAndDelete({
      _id: req.params.id,
      $or: [{ userId: req.user.id }, { recipient: req.user.id }]
    });
    res.json({ success: true, message: 'Notification dismissed' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllRead,
  deleteNotification
};
