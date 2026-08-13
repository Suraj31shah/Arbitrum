const express = require('express');
const passport = require('passport');
const mongoose = require('mongoose');

const router = express.Router();

function getFrontendUrl(req) {
  // If the backend being hit is the production Render backend, return the production Vercel frontend
  if (req.hostname && req.hostname.includes('onrender.com')) {
    return 'https://commitx-three.vercel.app';
  }
  // Otherwise, default to local development frontend
  return 'http://localhost:5173';
}

router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get('/github/callback', (req, res, next) => {
  passport.authenticate('github', (err, user) => {
    if (err) {
      console.error('GitHub OAuth Error:', err);
      return res.status(500).json({ error: err.message || 'GitHub Auth Failed' });
    }
    if (!user) {
      return res.redirect(`${getFrontendUrl(req)}/challenges/new?error=auth_failed`);
    }
    req.logIn(user, (logInErr) => {
      if (logInErr) return next(logInErr);
      return res.redirect(`${getFrontendUrl(req)}/challenges/new`);
    });
  })(req, res, next);
});

router.get('/github/disconnect', async (req, res) => {
  if (req.user) {
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user.id, { $unset: { githubId: "", githubAccessToken: "" } });
  }
  res.redirect(`${getFrontendUrl(req)}/challenges/new`);
});

router.get('/todoist', passport.authenticate('todoist', { scope: ['data:read'] }));

router.get('/todoist/callback', (req, res, next) => {
  passport.authenticate('todoist', (err, user) => {
    if (err) {
      console.error('Todoist OAuth Error:', err);
      return res.status(500).json({ error: err.message || 'Todoist Auth Failed' });
    }
    if (!user) {
      return res.redirect(`${getFrontendUrl(req)}/challenges/new?error=auth_failed`);
    }
    req.logIn(user, (logInErr) => {
      if (logInErr) return next(logInErr);
      return res.redirect(`${getFrontendUrl(req)}/challenges/new`);
    });
  })(req, res, next);
});

router.get('/todoist/disconnect', async (req, res) => {
  if (req.user) {
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user.id, { $unset: { todoistId: "", todoistAccessToken: "" } });
  }
  res.redirect(`${getFrontendUrl(req)}/challenges/new`);
});

router.get('/notion', passport.authenticate('notion'));

router.get('/notion/callback', (req, res, next) => {
  passport.authenticate('notion', (err, user) => {
    if (err) {
      console.error('Notion OAuth Error:', err);
      return res.status(500).json({ error: err.message || 'Notion Auth Failed' });
    }
    if (!user) {
      return res.redirect(`${getFrontendUrl(req)}/challenges/new?error=auth_failed`);
    }
    req.logIn(user, (logInErr) => {
      if (logInErr) return next(logInErr);
      return res.redirect(`${getFrontendUrl(req)}/challenges/new`);
    });
  })(req, res, next);
});

router.get('/notion/disconnect', async (req, res) => {
  if (req.user) {
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user.id, { $unset: { notionId: "", notionAccessToken: "" } });
  }
  res.redirect(`${getFrontendUrl(req)}/challenges/new`);
});

router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email', 'https://www.googleapis.com/auth/fitness.activity.read'],
  accessType: 'offline',
  prompt: 'consent'
}));

router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', (err, user) => {
    if (err) {
      console.error('Google OAuth Error:', err);
      return res.status(500).json({ error: err.message || 'Google Auth Failed' });
    }
    if (!user) {
      return res.redirect(`${getFrontendUrl(req)}/challenges/new?error=auth_failed`);
    }
    req.logIn(user, (logInErr) => {
      if (logInErr) return next(logInErr);
      return res.redirect(`${getFrontendUrl(req)}/challenges/new`);
    });
  })(req, res, next);
});

router.get('/google/disconnect', async (req, res) => {
  if (req.user) {
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user.id, { $unset: { googleId: "", googleAccessToken: "", googleRefreshToken: "" } });
  }
  res.redirect(`${getFrontendUrl(req)}/challenges/new`);
});

const User = require('../models/User');

router.post('/wallet', async (req, res, next) => {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    const lowerAddress = walletAddress.toLowerCase();

    // If MongoDB is offline, use local user fallback session
    if (mongoose.connection.readyState !== 1) {
      const mockUser = {
        _id: `local-user-${lowerAddress}`,
        id: `local-user-${lowerAddress}`,
        walletAddress: lowerAddress,
        username: lowerAddress.substring(0, 6) + '...' + lowerAddress.substring(lowerAddress.length - 4)
      };
      return req.logIn(mockUser, (err) => {
        if (err) return next(err);
        return res.json({ message: 'Logged in successfully (local)', user: mockUser });
      });
    }

    let user = await User.findOne({ walletAddress: lowerAddress });
    
    if (!user) {
      user = new User({ 
        walletAddress: lowerAddress,
        username: lowerAddress.substring(0, 6) + '...' + lowerAddress.substring(lowerAddress.length - 4)
      });
      await user.save();
    }

    req.logIn(user, (err) => {
      if (err) {
        console.error('req.logIn failed in wallet auth:', err);
        return next(err);
      }
      return res.json({ message: 'Logged in successfully', user });
    });
  } catch (err) {
    console.error('Wallet login error, attempting local fallback:', err.message);
    const lowerAddress = req.body && req.body.walletAddress ? req.body.walletAddress.toLowerCase() : '0x0000000000000000000000000000000000000000';
    const mockUser = {
      _id: `local-user-${lowerAddress}`,
      id: `local-user-${lowerAddress}`,
      walletAddress: lowerAddress,
      username: lowerAddress.substring(0, 6) + '...' + lowerAddress.substring(lowerAddress.length - 4)
    };
    return req.logIn(mockUser, (loginErr) => {
      if (loginErr) return res.status(500).json({ error: 'Internal server error during wallet login' });
      return res.json({ message: 'Logged in successfully (fallback)', user: mockUser });
    });
  }
});

router.get('/current-user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.json({ user: null });
  }
});

router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.json({ message: 'Logged out' });
  });
});

module.exports = router;
