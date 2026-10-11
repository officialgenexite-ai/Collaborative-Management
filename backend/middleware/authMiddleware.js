const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');
const User = require('../models/User');

const isDatabaseUnavailableError = (error) => {
  const message = error?.message || '';
  return (
    error?.name === 'MongoServerSelectionError' ||
    error?.name === 'MongoNetworkError' ||
    error?.name === 'MongooseServerSelectionError' ||
    error?.name === 'MongoTimeoutError' ||
    message.includes('buffering timed out') ||
    message.includes('server selection timed out') ||
    message.includes('topology was destroyed') ||
    message.includes('ECONNREFUSED')
  );
};

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Not authorized, no token', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return next(new AppError('Not authorized, user not found', 401));
    }
    req.user = user;
    return next();
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return res.status(503).json({ error: 'Database unavailable, please try again later' });
    }
    return next(error);
  }
};

module.exports = { protect, isDatabaseUnavailableError };
