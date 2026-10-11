
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail } = require('../utils/emailService');
const bcrypt = require('bcryptjs');

// User Registration
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    // Create 6-digit verification code
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

    const user = new User({
      name,
      email,
      password,
      verificationToken,
      isVerified: false
    });

    await user.save();

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({ 
        message: 'Registration successful. Please verify your email.',
        email: email 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Manual OTP Code Verification
exports.verifyEmailOTP = async (req, res) => {
  try {
    const { email, code, otp } = req.body;
    const verificationCode = code || otp;

    const user = await User.findOne({ 
        email: email, 
        verificationToken: verificationCode 
    });

    if (!user) return res.status(400).json({ error: 'Invalid verification code' });

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully', success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Login User & Generate JWT
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    if (!user.isVerified) return res.status(400).json({ error: 'Please verify your email first' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      accessToken: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Account
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    await User.findByIdAndDelete(userId);
    res.json({ message: 'User account deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
