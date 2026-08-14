const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const emailService = require('../services/emailService');

const router = express.Router();

// Helper middleware for authentication
const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  next();
};

// GET /api/users/notification-preferences
router.get('/notification-preferences', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id);
    if (!user) {
      // Fallback for mock local session user
      return res.json({
        email: '',
        emailVerified: false,
        notificationPreferences: {
          deadlineReminders: true,
          participantJoined: true,
          proofResults: true,
          challengeCompleted: true,
          rewardReceived: true
        }
      });
    }

    res.json({
      email: user.email || '',
      emailVerified: !!user.emailVerified,
      notificationPreferences: user.notificationPreferences || {
        deadlineReminders: true,
        participantJoined: true,
        proofResults: true,
        challengeCompleted: true,
        rewardReceived: true
      }
    });
  } catch (err) {
    console.error('Error fetching notification preferences:', err.message);
    res.status(500).json({ error: 'Failed to fetch notification preferences.' });
  }
});

// PUT /api/users/notification-preferences
router.put('/notification-preferences', requireAuth, async (req, res) => {
  try {
    const { notificationPreferences } = req.body;
    if (!notificationPreferences || typeof notificationPreferences !== 'object') {
      return res.status(400).json({ error: 'Valid notificationPreferences object is required.' });
    }

    const user = await User.findById(req.user._id || req.user.id);
    if (user) {
      user.notificationPreferences = {
        ...user.notificationPreferences,
        ...notificationPreferences
      };
      await user.save();
      return res.json({
        message: 'Notification preferences updated successfully',
        notificationPreferences: user.notificationPreferences
      });
    }

    res.json({ message: 'Notification preferences saved', notificationPreferences });
  } catch (err) {
    console.error('Error updating notification preferences:', err.message);
    res.status(500).json({ error: 'Failed to update notification preferences.' });
  }
});

// PUT /api/users/email - Save email & send verification link
router.put('/email', requireAuth, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const user = await User.findById(req.user._id || req.user.id);
    if (user) {
      user.email = normalizedEmail;
      user.emailVerified = false;
      user.emailVerificationToken = token;
      user.emailVerificationExpires = expires;
      await user.save();

      // Trigger verification email asynchronously
      emailService.sendVerificationEmail(user, token, req.headers.host).catch(err => {
        console.error('Failed to send verification email asynchronously:', err.message);
      });

      return res.json({
        message: 'Verification email sent. Please check your inbox.',
        email: user.email,
        emailVerified: false
      });
    }

    res.json({ message: 'Email saved', email: normalizedEmail, emailVerified: false });
  } catch (err) {
    console.error('Error saving user email:', err.message);
    res.status(500).json({ error: 'Failed to save email address.' });
  }
});

// POST /api/users/email/verify - Confirm email verification token
router.post('/email/verify', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Verification token is required.' });
    }

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token.' });
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    res.json({
      message: 'Email address verified successfully!',
      email: user.email,
      emailVerified: true
    });
  } catch (err) {
    console.error('Error verifying email:', err.message);
    res.status(500).json({ error: 'Failed to verify email address.' });
  }
});

module.exports = router;
