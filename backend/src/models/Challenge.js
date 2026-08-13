const mongoose = require('mongoose');

// Stake bounds — creator chooses any amount within these limits
const MIN_STAKE = 0.0000000000001; // 100000 wei
const MAX_STAKE = 0.1;             // 0.1 ETH

const participantSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  walletAddress: { type: String, required: true },
  status: {
    type: String,
    enum: ['active', 'proof_submitted', 'verifying', 'completed', 'failed'],
    default: 'active'
  },
  proofId: { type: mongoose.Schema.Types.ObjectId, ref: 'Proof', default: null },
  completedAt: { type: Date, default: null }
}, { _id: false, timestamps: true });

const challengeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    goal: {
      type: String,
      required: true,
      trim: true
    },
    stakeAmount: {
      type: Number,
      required: true,
      min: MIN_STAKE,
      max: MAX_STAKE
    },
    // Start mode: immediate (joining window = 2h from creation) or scheduled
    startMode: {
      type: String,
      enum: ['immediate', 'scheduled'],
      default: 'immediate'
    },
    // When the challenge actually becomes active (joining closes)
    startTime: {
      type: Date,
      required: true
    },
    deadline: {
      type: Date,
      required: true
    },
    // Challenge lifecycle status
    status: {
      type: String,
      enum: ['joining', 'upcoming', 'active', 'submission', 'completed', 'failed'],
      default: 'joining'
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    creatorWallet: {
      type: String,
      required: true
    },
    participants: [participantSchema],
    // Charity wallet for "everyone fails" scenario
    charityAddress: {
      type: String,
      default: process.env.CHARITY_WALLET_ADDRESS || '0x000000000000000000000000000000000000dEaD'
    },
    // On-chain resolution tracking
    resolvedOnChain: {
      type: Boolean,
      default: false
    },
    resolveTxHash: {
      type: String,
      default: null
    },
    // Optional integration for auto-verification
    integrationId: {
      type: String,
      default: 'none'
    },
    integrationHandle: {
      type: String,
      default: ''
    },
    integrationMetrics: {
      type: [{
        id: String,
        goal: Number
      }],
      default: []
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Virtual: computed pool size
challengeSchema.virtual('poolSize').get(function () {
  return this.stakeAmount * this.participants.length;
});

// Virtual: number of successful participants
challengeSchema.virtual('winnersCount').get(function () {
  return this.participants.filter(p => p.status === 'completed').length;
});

// Virtual: number of failed participants
challengeSchema.virtual('losersCount').get(function () {
  return this.participants.filter(p => p.status === 'failed').length;
});

// Include virtuals in JSON output
challengeSchema.set('toJSON', { virtuals: true });
challengeSchema.set('toObject', { virtuals: true });

const Challenge = mongoose.model('Challenge', challengeSchema);

module.exports = Challenge;
module.exports.MIN_STAKE = MIN_STAKE;
module.exports.MAX_STAKE = MAX_STAKE;
