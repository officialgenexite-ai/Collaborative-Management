const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const crypto = require('crypto');
const logger = require('../utils/logger');

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          return done(null, user);
        }

        const randomPassword = crypto.randomBytes(16).toString('hex');

        user = new User({
          name: profile.displayName,
          email: profile.emails[0].value,
          password: randomPassword,
          isVerified: true,
          verificationToken: undefined
        });

        await user.save();
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  ));
} else {
  logger.warn('Google OAuth disabled: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set');
}

module.exports = passport;
