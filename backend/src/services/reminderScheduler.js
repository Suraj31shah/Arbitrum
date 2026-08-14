const mongoose = require('mongoose');
const Challenge = require('../models/Challenge');
const User = require('../models/User');
const emailService = require('./emailService');

// In-memory set to prevent sending duplicate reminders for the same (challengeId, userId) pair
const sentReminders = new Set();

async function checkDeadlinesAndSendReminders() {
  try {
    if (mongoose.connection.readyState !== 1) return;

    const now = new Date();
    const deadlineThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Next 24 hours

    // Find active challenges expiring within the next 24 hours
    const activeChallenges = await Challenge.find({
      status: 'active',
      deadline: { $gt: now, $lte: deadlineThreshold }
    }).populate('participants.user');

    for (const challenge of activeChallenges) {
      if (!Array.isArray(challenge.participants)) continue;

      for (const participant of challenge.participants) {
        if (!participant.user || participant.status !== 'active') continue;

        const userId = participant.user._id ? participant.user._id.toString() : participant.user.toString();
        const reminderKey = `${challenge._id}_${userId}`;

        if (sentReminders.has(reminderKey)) continue;

        // Fetch full user record to check notification preferences
        const userObj = await User.findById(userId);
        if (userObj && userObj.emailVerified && userObj.notificationPreferences?.deadlineReminders) {
          console.log(`[reminderScheduler] Sending deadline reminder for challenge "${challenge.title}" to user ${userObj.email}`);
          sentReminders.add(reminderKey);
          await emailService.sendChallengeDeadlineReminder(userObj, challenge).catch(err => {
            console.error('[reminderScheduler] Error sending reminder:', err.message);
          });
        }
      }
    }
  } catch (err) {
    console.error('[reminderScheduler] Error during deadline check:', err.message);
  }
}

function startDeadlineScheduler(intervalMs = 15 * 60 * 1000) { // 15 mins default
  console.log('[reminderScheduler] Starting challenge deadline reminder scheduler...');
  // Initial check after 10 seconds
  setTimeout(checkDeadlinesAndSendReminders, 10000);
  // Recurring check
  setInterval(checkDeadlinesAndSendReminders, intervalMs);
}

module.exports = {
  checkDeadlinesAndSendReminders,
  startDeadlineScheduler
};
