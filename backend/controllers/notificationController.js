const Notification = require('../models/Notification');
const { AppError } = require('../middleware/errorHandler');

// ============================================
// GET NOTIFICATIONS (paginated, newest first)
// GET /api/notifications?page=1&limit=20
// ============================================
exports.getNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [notifications, unreadCount, total] = await Promise.all([
      Notification.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('triggeredBy', 'name avatar'),
      Notification.countDocuments({ userId: req.user._id, isRead: false }),
      Notification.countDocuments({ userId: req.user._id })
    ]);

    res.status(200).json({
      success: true,
      notifications,
      unreadCount,
      pagination: { page, limit, total, hasMore: skip + notifications.length < total }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// MARK ONE NOTIFICATION AS READ
// PATCH /api/notifications/:id/read
// ============================================
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, userId: req.user._id });

    if (!notification) {
      return next(new AppError('Notification not found', 404));
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};

// ============================================
// MARK ALL AS READ
// PATCH /api/notifications/read-all
// ============================================
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });

    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// ============================================
// DELETE NOTIFICATION
// DELETE /api/notifications/:id
// ============================================
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!notification) {
      return next(new AppError('Notification not found', 404));
    }

    res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
};
