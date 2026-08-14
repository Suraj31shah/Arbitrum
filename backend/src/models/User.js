const mongoose = require('mongoose');
const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex') : crypto.randomBytes(32); 
const IV_LENGTH = 16;

function encrypt(text) {
  if (!text) return text;
  try {
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv(algorithm, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch(e) {
    return text;
  }
}

function decrypt(text) {
  if (!text || typeof text !== 'string' || !text.includes(':')) return text;
  try {
    let textParts = text.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv(algorithm, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch(e) {
    return text; // fallback for unencrypted or corrupted data
  }
}

const userSchema = new mongoose.Schema(
  {
    githubId: {
      type: String,
      unique: true,
      sparse: true // sparse allows multiple nulls
    },
    githubUsername: String,
    githubAccessToken: {
      type: String,
      get: decrypt,
      set: encrypt
    },
    notionId: {
      type: String,
      unique: true,
      sparse: true
    },
    notionAccessToken: {
      type: String,
      get: decrypt,
      set: encrypt
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true
    },
    googleAccessToken: {
      type: String,
      get: decrypt,
      set: encrypt
    },
    googleRefreshToken: {
      type: String,
      get: decrypt,
      set: encrypt
    },
    username: {
      type: String
    },
    profileUrl: {
      type: String
    },
    walletAddress: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true
    }
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
  }
);

const User = mongoose.model('User', userSchema);
module.exports = User;
