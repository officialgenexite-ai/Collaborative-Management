
const express = require('express');
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');
const { register, login, verifyEmailOTP, deleteAccount } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Local Auth Routes
router.post('/register', register);
router.post('/verify-email', verifyEmailOTP);
router.post('/verify-otp', verifyEmailOTP);
router.post('/login', login);

// Google Auth Routes
const googleAuth = (req, res, next) => {
  if (!passport._strategies.google) {
    return res.status(503).json({
      success: false,
      message: 'Google login is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env and restart the server.',
    });
  }
  next();
};

router.get('/google', googleAuth, passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  googleAuth,
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    // Generate JWT token for Google authenticated user
    const token = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        
    // Redirect to frontend with token & user info
    const frontendUrl = process.env.FRONTEND_URL || process.env.PORTFOLIO_URL || 'http://localhost:5000';
    res.redirect(`${frontendUrl}/?token=${token}&user=${encodeURIComponent(JSON.stringify({
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role || 'customer'
    }))}`);
  }
);

// Delete User Route (Protected)
router.delete('/delete', protect, deleteAccount);

module.exports = router;
