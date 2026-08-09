const express = require('express');
const passport = require('passport');

const router = express.Router();

router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get('/github/callback', (req, res, next) => {
  passport.authenticate('github', (err, user) => {
    if (err) {
      console.error('GitHub OAuth Error:', err);
      return res.status(500).json({ error: err.message || 'GitHub Auth Failed' });
    }
    if (!user) {
      return res.redirect('http://localhost:5173/challenges/new?error=auth_failed');
    }
    req.logIn(user, (logInErr) => {
      if (logInErr) return next(logInErr);
      return res.redirect('http://localhost:5173/challenges/new');
    });
  })(req, res, next);
});

router.get('/todoist', passport.authenticate('todoist', { scope: ['data:read'] }));

router.get('/todoist/callback', (req, res, next) => {
  passport.authenticate('todoist', (err, user) => {
    if (err) {
      console.error('Todoist OAuth Error:', err);
      return res.status(500).json({ error: err.message || 'Todoist Auth Failed' });
    }
    if (!user) {
      return res.redirect('http://localhost:5173/challenges/new?error=auth_failed');
    }
    req.logIn(user, (logInErr) => {
      if (logInErr) return next(logInErr);
      return res.redirect('http://localhost:5173/challenges/new');
    });
  })(req, res, next);
});

router.get('/notion', passport.authenticate('notion'));

router.get('/notion/callback', (req, res, next) => {
  passport.authenticate('notion', (err, user) => {
    if (err) {
      console.error('Notion OAuth Error:', err);
      return res.status(500).json({ error: err.message || 'Notion Auth Failed' });
    }
    if (!user) {
      return res.redirect('http://localhost:5173/challenges/new?error=auth_failed');
    }
    req.logIn(user, (logInErr) => {
      if (logInErr) return next(logInErr);
      return res.redirect('http://localhost:5173/challenges/new');
    });
  })(req, res, next);
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
      return res.redirect('http://localhost:5173/challenges/new?error=auth_failed');
    }
    req.logIn(user, (logInErr) => {
      if (logInErr) return next(logInErr);
      return res.redirect('http://localhost:5173/challenges/new');
    });
  })(req, res, next);
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
