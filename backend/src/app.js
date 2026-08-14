const express = require('express');
const dns = require('dns');
// Fix Windows default DNS SRV query refusal for MongoDB Atlas mongodb+srv URIs
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr) {
  console.warn('Could not set custom DNS servers:', dnsErr.message);
}
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
const mongoose = require('mongoose');
const User = require('./models/User');
const crypto = require('crypto');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Create the Express application
const app = express();

const isProd = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';

// Enable Cross-Origin Resource Sharing
const allowedOrigins = [
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : [])
];
if (!isProd) {
  allowedOrigins.push('http://localhost:5173');
}
allowedOrigins.push('https://commitx-three.vercel.app');

const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
app.use(cors({ origin: allowedOrigins, credentials: true }));

// Enable JSON request body parsing
app.use(express.json());

// Add Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Needed for serving images
}));

// Setup Rate Limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many auth requests from this IP, please try again after 15 minutes'
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Trust the Render proxy so secure cookies work properly
app.set('trust proxy', 1);

const { MongoStore } = require('connect-mongo');

// Check if we are running in a production-like environment (e.g. Render)
// (Moved isProd definition up for CORS)

// Session setup
const sessionStore = MongoStore.create({ 
  mongoUrl: process.env.MONGODB_URI,
  collectionName: 'sessions',
  mongoOptions: { serverSelectionTimeoutMS: 2000 }
});

sessionStore.on('error', function(error) {
  console.warn('MongoStore connection error. Sessions will fallback to memory or fail:', error.message);
});

app.use(session({
  secret: process.env.SESSION_SECRET && process.env.SESSION_SECRET !== 'secret' ? process.env.SESSION_SECRET : crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 30 // 30 days
  }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      if (typeof id === 'string' && id.startsWith('local-user-')) {
        const walletAddress = id.replace('local-user-', '');
        return done(null, {
          _id: id,
          id: id,
          walletAddress: walletAddress,
          username: walletAddress.substring(0, 6) + '...' + walletAddress.substring(walletAddress.length - 4)
        });
      }
      return done(null, null);
    }
    const user = await User.findById(id);
    if (!user && typeof id === 'string' && id.startsWith('local-user-')) {
      const walletAddress = id.replace('local-user-', '');
      return done(null, {
        _id: id,
        id: id,
        walletAddress: walletAddress,
        username: walletAddress.substring(0, 6) + '...' + walletAddress.substring(walletAddress.length - 4)
      });
    }
    done(null, user || null);
  } catch (err) {
    if (typeof id === 'string' && id.startsWith('local-user-')) {
      const walletAddress = id.replace('local-user-', '');
      return done(null, {
        _id: id,
        id: id,
        walletAddress: walletAddress,
        username: walletAddress.substring(0, 6) + '...' + walletAddress.substring(walletAddress.length - 4)
      });
    }
    done(null, null);
  }
});

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: '/api/auth/github/callback',
    passReqToCallback: true
  },
  async function(req, accessToken, refreshToken, profile, done) {
    try {
      if (req.user) {
        let user = await User.findById(req.user.id);
        if (!user.githubId || user.githubAccessToken !== accessToken) {
          const existing = await User.findOne({ githubId: profile.id });
          if (existing && existing._id.toString() !== user._id.toString()) {
            existing.githubId = undefined;
            await existing.save();
          }
          user.githubId = profile.id;
          user.githubUsername = profile.username;
          user.githubAccessToken = accessToken;
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
            githubAccessToken: accessToken,
            username: profile.username || profile.displayName,
            profileUrl: profile.profileUrl
          });
        } else if (user.githubAccessToken !== accessToken) {
          user.githubAccessToken = accessToken;
          await user.save();
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
    callbackURL: '/api/auth/notion/callback',
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
    callbackURL: '/api/auth/google/callback',
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
app.use('/api/auth', authLimiter, authRoutes);
app.use('/', apiLimiter, homeRoutes);
app.use('/', apiLimiter, challengeRoutes);
app.use('/', apiLimiter, proofRoutes);
app.use('/', apiLimiter, statsRoutes);

// Centralized error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

module.exports = app;
