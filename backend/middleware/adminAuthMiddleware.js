const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');
const User = require('../models/User');

const adminAuth = async (req, res, next) => {
  try {
    let user = req.user;

    if (!user) {
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user = await User.findById(decoded.userId).select('-password');
      }
    }

    if (user && user.role === 'admin') {
      req.user = user;
      return next();
    }

    return next(new AppError('Access denied. Administrator privileges required.', 403));
  } catch (error) {
    next(error);
  }
};

module.exports = adminAuth;














