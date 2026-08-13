const express = require('express');
const cors = require('cors');
const path = require('path');
const homeRoutes = require('./routes/homeRoutes');
const challengeRoutes = require('./routes/challengeRoutes');
const proofRoutes = require('./routes/proofRoutes');
const statsRoutes = require('./routes/statsRoutes');
const authRoutes = require('./routes/authRoutes');
const session = require('express-session');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const NotionStrategy = require('passport-notion').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const OAuth2Strategy = require('passport-oauth2');
const User = require('./models/User');

// Create the Express application
const app = express();

// Enable Cross-Origin Resource Sharing
const allowedOrigins = [
  'http://localhost:5173',
  'https://commitx-three.vercel.app',
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : [])
];

const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
app.use(cors({ origin: allowedOrigins, credentials: true }));

// Enable JSON request body parsing
app.use(express.json());

// Trust the Render proxy so secure cookies work properly
app.set('trust proxy', 1);

const MongoStore = require('connect-mongo');

// Check if we are running in a production-like environment (e.g. Render)
const isProd = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/arbitrum-challenge'
  }),
  cookie: {
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: `${backendUrl}/api/auth/github/callback`,
    passReqToCallback: true
  },
  async function(req, accessToken, refreshToken, profile, done) {
    try {
      if (req.user) {
        let user = await User.findById(req.user.id);
        if (!user.githubId) {
          const existing = await User.findOne({ githubId: profile.id });
          if (existing && existing._id.toString() !== user._id.toString()) {
            existing.githubId = undefined;
            await existing.save();
          }
          user.githubId = profile.id;
          user.githubUsername = profile.username;
          if (!user.username || user.username.startsWith('0x')) {
            user.username = profile.username;
          }
          await user.save();
        }
        return done(null, user);
      } else {
        let user = await User.findOne({ githubId: profile.id });
        if (!user) {
          user = await User.create({
            githubId: profile.id,
            githubUsername: profile.username,
            username: profile.username || profile.displayName,
            profileUrl: profile.profileUrl
          });
        }
        return done(null, user);
      }
    } catch (err) {
      return done(err);
    }
  }
));



passport.use(new NotionStrategy({
    clientID: process.env.NOTION_CLIENT_ID,
    clientSecret: process.env.NOTION_CLIENT_SECRET,
    callbackURL: `${backendUrl}/api/auth/notion/callback`,
    passReqToCallback: true
  },
  async function(req, accessToken, refreshToken, params, profile, done) {
    try {
      if (req.user) {
        let user = await User.findById(req.user.id);
        const notionId = profile.id || (profile.person && profile.person.email) || profile.name;
        if (user.notionId !== notionId) {
          const existing = await User.findOne({ notionId: notionId });
          if (existing && existing._id.toString() !== user._id.toString()) {
            existing.notionId = undefined;
            await existing.save();
          }
          user.notionId = notionId;
        }
        user.notionAccessToken = accessToken;
        await user.save();
        return done(null, user);
      } else {
        // Login or create new
        let user = await User.findOne({ notionId: profile.id || (profile.person && profile.person.email) || profile.name });
        if (!user) {
          user = await User.create({
            notionId: profile.id || (profile.person && profile.person.email) || profile.name,
            notionAccessToken: accessToken,
            username: profile.name || `notion_${profile.id}`
          });
        } else {
          // Update tokens on login
          user.notionAccessToken = accessToken;
          await user.save();
        }
        return done(null, user);
      }
    } catch (err) {
      return done(err);
    }
  }
));

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${backendUrl}/api/auth/google/callback`,
    passReqToCallback: true
  },
  async function(req, accessToken, refreshToken, profile, done) {
    try {
      if (req.user) {
        let user = await User.findById(req.user.id);
        if (user.googleId !== profile.id) {
          const existing = await User.findOne({ googleId: profile.id });
          if (existing && existing._id.toString() !== user._id.toString()) {
            existing.googleId = undefined;
            await existing.save();
          }
          user.googleId = profile.id;
        }
        user.googleAccessToken = accessToken;
        user.googleRefreshToken = refreshToken;
        await user.save();
        return done(null, user);
      } else {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = await User.create({
            googleId: profile.id,
            googleAccessToken: accessToken,
            googleRefreshToken: refreshToken,
            username: profile.displayName || `google_${profile.id}`
          });
        } else {
          user.googleAccessToken = accessToken;
          user.googleRefreshToken = refreshToken;
          await user.save();
        }
        return done(null, user);
      }
    } catch (err) {
      return done(err);
    }
  }
));

// Serve static uploads folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Mount route modules
app.use('/api/auth', authRoutes);
app.use('/', homeRoutes);
app.use('/', challengeRoutes);
app.use('/', proofRoutes);
app.use('/', statsRoutes);

// Centralized error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

module.exports = app;
