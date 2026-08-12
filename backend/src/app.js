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

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production' ? true : false,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
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
            if (!existing.walletAddress) await User.deleteOne({ _id: existing._id });
            else return done(new Error("This GitHub account is already linked to another wallet."));
          }
          user.githubId = profile.id;
          user.username = user.username || profile.username;
          await user.save();
        }
        return done(null, user);
      } else {
        let user = await User.findOne({ githubId: profile.id });
        if (!user) {
          user = await User.create({
            githubId: profile.id,
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

class CustomTodoistStrategy extends OAuth2Strategy {
  constructor(options, verify) {
    super({
      authorizationURL: 'https://todoist.com/oauth/authorize',
      tokenURL: 'https://todoist.com/oauth/access_token',
      ...options
    }, verify);
    this.name = 'todoist';
  }

  async userProfile(accessToken, done) {
    try {
      const response = await fetch('https://api.todoist.com/api/v1/sync', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sync_token: '*',
          resource_types: ['user']
        })
      });
      if (!response.ok) {
        return done(new Error(`Failed to fetch Todoist user profile: ${response.statusText}`));
      }
      const data = await response.json();
      const user = data.user;
      
      if (!user) {
         return done(new Error('User data not found in Todoist response'));
      }

      const profile = {
        provider: 'todoist',
        id: String(user.id),
        displayName: user.full_name || user.email || `todoist_${user.id}`,
        email: user.email
      };
      done(null, profile);
    } catch (err) {
      done(err);
    }
  }
}

passport.use(new CustomTodoistStrategy({
    clientID: process.env.TODOIST_CLIENT_ID,
    clientSecret: process.env.TODOIST_CLIENT_SECRET,
    callbackURL: `${backendUrl}/api/auth/todoist/callback`,
    passReqToCallback: true
  },
  async function(req, accessToken, refreshToken, profile, done) {
    try {
      if (req.user) {
        let user = await User.findById(req.user.id);
        if (user.todoistId !== profile.id) {
          const existing = await User.findOne({ todoistId: profile.id });
          if (existing && existing._id.toString() !== user._id.toString()) {
            if (!existing.walletAddress) await User.deleteOne({ _id: existing._id });
            else return done(new Error("This Todoist account is already linked to another wallet."));
          }
          user.todoistId = profile.id;
        }
        user.todoistAccessToken = accessToken;
        await user.save();
        return done(null, user);
      } else {
        // Login or create new
        let user = await User.findOne({ todoistId: profile.id });
        if (!user) {
          user = await User.create({
            todoistId: profile.id,
            todoistAccessToken: accessToken,
            username: profile.displayName || `todoist_${profile.id}`
          });
        } else {
          // Update tokens on login
          user.todoistAccessToken = accessToken;
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
            if (!existing.walletAddress) await User.deleteOne({ _id: existing._id });
            else return done(new Error("This Notion account is already linked to another wallet."));
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
            if (!existing.walletAddress) await User.deleteOne({ _id: existing._id });
            else return done(new Error("This Google account is already linked to another wallet."));
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
