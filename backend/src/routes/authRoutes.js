const express = require('express');
const passport = require('passport');
const mongoose = require('mongoose');
const { verifyMessage } = require('ethers');
const crypto = require('crypto');

const router = express.Router();

function getFrontendUrl(req) {
  // If the backend is hit from production, use the production frontend URL
  if (req.hostname && req.hostname !== 'localhost' && req.hostname !== '127.0.0.1') {
    if (process.env.FRONTEND_URL) {
      return process.env.FRONTEND_URL.split(',')[0];
    }
    return 'https://commitx-three.vercel.app';
  }
  return 'http://localhost:5173';
}

router.get('/github', passport.authenticate('github', { scope: ['user:email'], prompt: 'consent' }));

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
  prompt: 'select_account'
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

router.get('/nonce', (req, res) => {
  const nonce = crypto.randomBytes(16).toString('hex');
  req.session.nonce = nonce;
  res.json({ nonce });
});

router.post('/wallet', async (req, res, next) => {
  try {
    const lowerAddress = walletAddress.toLowerCase();
    
    // Strict format validation to prevent injection or invalid DB queries
    if (!/^0x[a-f0-9]{40}$/.test(lowerAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }

    // SIWE Verification
    const { signature } = req.body;
    if (!signature) {
      return res.status(400).json({ error: 'Signature is required for secure login.' });
    }
    
    const nonce = req.session.nonce;
    if (!nonce) {
      return res.status(400).json({ error: 'Session expired or nonce missing. Please try again.' });
    }

    try {
      const message = `Sign this message to authenticate with CommitX.\nNonce: ${nonce}`;
      const recoveredAddress = verifyMessage(message, signature);
      if (recoveredAddress.toLowerCase() !== lowerAddress) {
        return res.status(401).json({ error: 'Signature verification failed.' });
      }
    } catch (err) {
      return res.status(401).json({ error: 'Invalid signature.' });
    }
    
    // Clear nonce after successful use
    req.session.nonce = null;

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
    console.error('Wallet login error:', err.message);
    return res.status(500).json({ error: 'Internal server error during wallet login' });
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
