const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'CommitX <onboarding@resend.dev>';

/**
 * Helper function to send email via Resend HTTP API.
 * Uses native fetch. Errors are caught and logged silently so core operations never fail.
 */
async function sendResendEmail({ to, subject, html }) {
  if (!to || typeof to !== 'string' || !to.includes('@')) {
    console.log(`[emailService] Skipping email: invalid target recipient '${to}'`);
    return false;
  }

  if (!RESEND_API_KEY) {
    console.log(`[emailService] RESEND_API_KEY not set in env. Would have sent email to ${to}: "${subject}"`);
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [to],
        subject: subject,
        html: html
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[emailService] Resend API error response:', response.status, errText);
      return false;
    }

    const data = await response.json();
    console.log('[emailService] Email sent successfully via Resend. Message ID:', data.id);
    return true;
  } catch (err) {
    console.error('[emailService] Failed to send email via Resend:', err.message);
    return false;
  }
}

/** HTML Template Generator for CommitX emails */
function generateCommitXEmailWrapper(title, contentHtml) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #09090b; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="560px" border="0" cellspacing="0" cellpadding="0" style="background-color: #121215; border: 1px solid #27272a; border-radius: 16px; padding: 32px; text-align: left; max-width: 560px; margin: 0 auto;">
                
                <!-- Brand Header -->
                <tr>
                  <td style="padding-bottom: 24px; border-bottom: 1px solid #27272a;">
                    <span style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Commit<span style="color: #0ea5e9;">X</span></span>
                    <div style="font-size: 12px; color: #71717a; margin-top: 4px; font-weight: 500;">Commit. Stake. Prove. Grow.</div>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 24px 0;">
                    ${contentHtml}
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding-top: 24px; border-top: 1px solid #27272a; text-align: center; color: #71717a; font-size: 12px;">
                    <p style="margin: 0;">&copy; ${new Date().getFullYear()} CommitX. Web3 Accountability Platform.</p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

// 1. Send Verification Email
async function sendVerificationEmail(user, token, reqHost = 'localhost:5173') {
  try {
    let frontendUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',')[0] : '';
    if (!frontendUrl) {
      if (reqHost && !reqHost.includes('localhost') && !reqHost.includes('127.0.0.1')) {
        frontendUrl = 'https://commitx-three.vercel.app';
      } else {
        frontendUrl = 'http://localhost:5173';
      }
    }
    const verifyLink = `${frontendUrl}/settings?verifyToken=${token}`;

    const contentHtml = `
      <h2 style="font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 0;">Verify your email address</h2>
      <p style="color: #a1a1aa; font-size: 15px; line-height: 1.5;">
        Thank you for configuring email notifications on CommitX! Please verify your email address to receive challenge deadline reminders and updates.
      </p>
      <div style="margin: 28px 0; text-align: center;">
        <a href="${verifyLink}" style="background-color: #0ea5e9; color: #041208; font-weight: 700; font-size: 15px; padding: 12px 28px; border-radius: 9999px; text-decoration: none; display: inline-block;">
          Verify Email Address →
        </a>
      </div>
      <p style="color: #71717a; font-size: 13px;">
        If you did not request this email, you can safely ignore it. The verification link expires in 24 hours.
      </p>
    `;

    return await sendResendEmail({
      to: user.email,
      subject: 'Verify your CommitX email address ✉️',
      html: generateCommitXEmailWrapper('Verify Email', contentHtml)
    });
  } catch (err) {
    console.error('[emailService] sendVerificationEmail error:', err.message);
    return false;
  }
}

// 2. Send Challenge Deadline Reminder
async function sendChallengeDeadlineReminder(user, challenge) {
  try {
    if (!user?.emailVerified || !user?.notificationPreferences?.deadlineReminders) return false;

    const frontendUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',')[0] : 'http://localhost:5173';
    const challengeLink = `${frontendUrl}/challenges/${challenge._id || challenge.id}`;
    const formattedDeadline = new Date(challenge.deadline).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    const contentHtml = `
      <h2 style="font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 0;">Your challenge is almost due ⏰</h2>
      <p style="color: #a1a1aa; font-size: 15px; line-height: 1.5;">
        Your challenge <strong>"${challenge.title}"</strong> is approaching its deadline. Submit your proof now to protect your stake!
      </p>
      
      <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 16px; margin: 20px 0;">
        <div style="font-size: 13px; color: #71717a; text-transform: uppercase; font-weight: 700;">Deadline</div>
        <div style="font-size: 16px; color: #0ea5e9; font-weight: 700; margin-top: 4px;">${formattedDeadline}</div>
        
        <div style="font-size: 13px; color: #71717a; text-transform: uppercase; font-weight: 700; margin-top: 12px;">Stake Amount</div>
        <div style="font-size: 16px; color: #ffffff; font-weight: 700; margin-top: 4px;">${challenge.stakeAmount} ETH</div>
      </div>

      <div style="margin: 28px 0; text-align: center;">
        <a href="${challengeLink}" style="background-color: #0ea5e9; color: #041208; font-weight: 700; font-size: 15px; padding: 12px 28px; border-radius: 9999px; text-decoration: none; display: inline-block;">
          View Challenge & Submit Proof →
        </a>
      </div>
    `;

    return await sendResendEmail({
      to: user.email,
      subject: `Your CommitX challenge is almost due ⏰`,
      html: generateCommitXEmailWrapper('Challenge Deadline Reminder', contentHtml)
    });
  } catch (err) {
    console.error('[emailService] sendChallengeDeadlineReminder error:', err.message);
    return false;
  }
}

// 3. Send Someone Joined Email (sent to Challenge Creator)
async function sendParticipantJoinedEmail(creator, challenge, newParticipant) {
  try {
    if (!creator?.emailVerified || !creator?.notificationPreferences?.participantJoined) return false;

    const frontendUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',')[0] : 'http://localhost:5173';
    const challengeLink = `${frontendUrl}/challenges/${challenge._id || challenge.id}`;
    const participantCount = Array.isArray(challenge.participants) ? challenge.participants.length : 1;
    const poolAmount = (challenge.stakeAmount * participantCount).toFixed(5);
    const joinedAddress = newParticipant?.walletAddress 
      ? `${newParticipant.walletAddress.substring(0, 6)}...${newParticipant.walletAddress.substring(newParticipant.walletAddress.length - 4)}`
      : 'A participant';

    const contentHtml = `
      <h2 style="font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 0;">Someone joined your challenge 👥</h2>
      <p style="color: #a1a1aa; font-size: 15px; line-height: 1.5;">
        A new participant (<strong>${joinedAddress}</strong>) just joined your public challenge <strong>"${challenge.title}"</strong>!
      </p>

      <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 16px; margin: 20px 0;">
        <div style="font-size: 13px; color: #71717a; text-transform: uppercase; font-weight: 700;">Total Participants</div>
        <div style="font-size: 16px; color: #ffffff; font-weight: 700; margin-top: 4px;">${participantCount} participants</div>
        
        <div style="font-size: 13px; color: #71717a; text-transform: uppercase; font-weight: 700; margin-top: 12px;">Total Prize Pool</div>
        <div style="font-size: 16px; color: #0ea5e9; font-weight: 700; margin-top: 4px;">${poolAmount} ETH</div>
      </div>

      <div style="margin: 28px 0; text-align: center;">
        <a href="${challengeLink}" style="background-color: #0ea5e9; color: #041208; font-weight: 700; font-size: 15px; padding: 12px 28px; border-radius: 9999px; text-decoration: none; display: inline-block;">
          View Challenge Pool →
        </a>
      </div>
    `;

    return await sendResendEmail({
      to: creator.email,
      subject: `Someone joined your CommitX challenge 👥`,
      html: generateCommitXEmailWrapper('Participant Joined', contentHtml)
    });
  } catch (err) {
    console.error('[emailService] sendParticipantJoinedEmail error:', err.message);
    return false;
  }
}

// 4. Send Proof Result Email
async function sendProofResultEmail(user, challenge, isVerified, summaryNotes = '') {
  try {
    if (!user?.emailVerified || !user?.notificationPreferences?.proofResults) return false;

    const frontendUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',')[0] : 'http://localhost:5173';
    const challengeLink = `${frontendUrl}/challenges/${challenge._id || challenge.id}`;

    const subject = isVerified 
      ? `Your CommitX proof was verified ✅` 
      : `Your CommitX proof needs attention ⚠️`;

    const contentHtml = `
      <h2 style="font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 0;">
        ${isVerified ? 'Proof Verified Successfully ✅' : 'Proof Verification Failed ⚠️'}
      </h2>
      <p style="color: #a1a1aa; font-size: 15px; line-height: 1.5;">
        Your proof for <strong>"${challenge.title}"</strong> has been processed by CommitX.
      </p>

      <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 16px; margin: 20px 0;">
        <div style="font-size: 13px; color: #71717a; text-transform: uppercase; font-weight: 700;">Status</div>
        <div style="font-size: 16px; color: ${isVerified ? '#22c55e' : '#ef4444'}; font-weight: 700; margin-top: 4px;">
          ${isVerified ? 'VERIFIED / COMPLETED' : 'FAILED / INCOMPLETE'}
        </div>

        ${summaryNotes ? `
          <div style="font-size: 13px; color: #71717a; text-transform: uppercase; font-weight: 700; margin-top: 12px;">Notes</div>
          <div style="font-size: 14px; color: #e4e4e7; margin-top: 4px;">${summaryNotes}</div>
        ` : ''}
      </div>

      <div style="margin: 28px 0; text-align: center;">
        <a href="${challengeLink}" style="background-color: #0ea5e9; color: #041208; font-weight: 700; font-size: 15px; padding: 12px 28px; border-radius: 9999px; text-decoration: none; display: inline-block;">
          View Challenge Details →
        </a>
      </div>
    `;

    return await sendResendEmail({
      to: user.email,
      subject: subject,
      html: generateCommitXEmailWrapper('Proof Verification Result', contentHtml)
    });
  } catch (err) {
    console.error('[emailService] sendProofResultEmail error:', err.message);
    return false;
  }
}

// 5. Send Challenge Completed Email
async function sendChallengeCompletedEmail(user, challenge, isSuccess) {
  try {
    if (!user?.emailVerified || !user?.notificationPreferences?.challengeCompleted) return false;

    const frontendUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',')[0] : 'http://localhost:5173';
    const challengeLink = `${frontendUrl}/challenges/${challenge._id || challenge.id}`;

    const contentHtml = `
      <h2 style="font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 0;">Challenge completed 🎉</h2>
      <p style="color: #a1a1aa; font-size: 15px; line-height: 1.5;">
        The challenge <strong>"${challenge.title}"</strong> has reached its conclusion.
      </p>

      <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 16px; margin: 20px 0;">
        <div style="font-size: 13px; color: #71717a; text-transform: uppercase; font-weight: 700;">Result</div>
        <div style="font-size: 16px; color: ${isSuccess ? '#22c55e' : '#ef4444'}; font-weight: 700; margin-top: 4px;">
          ${isSuccess ? 'Successful' : 'Failed'}
        </div>

        <div style="font-size: 13px; color: #71717a; text-transform: uppercase; font-weight: 700; margin-top: 12px;">Stake Amount</div>
        <div style="font-size: 16px; color: #ffffff; font-weight: 700; margin-top: 4px;">${challenge.stakeAmount} ETH</div>
      </div>

      <div style="margin: 28px 0; text-align: center;">
        <a href="${challengeLink}" style="background-color: #0ea5e9; color: #041208; font-weight: 700; font-size: 15px; padding: 12px 28px; border-radius: 9999px; text-decoration: none; display: inline-block;">
          View Challenge Results →
        </a>
      </div>
    `;

    return await sendResendEmail({
      to: user.email,
      subject: `Challenge completed 🎉`,
      html: generateCommitXEmailWrapper('Challenge Completed', contentHtml)
    });
  } catch (err) {
    console.error('[emailService] sendChallengeCompletedEmail error:', err.message);
    return false;
  }
}

// 6. Send Reward Received Email
async function sendRewardReceivedEmail(user, challenge, rewardAmount, txHash = '') {
  try {
    if (!user?.emailVerified || !user?.notificationPreferences?.rewardReceived) return false;

    const frontendUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',')[0] : 'http://localhost:5173';
    const challengeLink = `${frontendUrl}/challenges/${challenge._id || challenge.id}`;
    const formattedWallet = user.walletAddress
      ? `${user.walletAddress.substring(0, 6)}...${user.walletAddress.substring(user.walletAddress.length - 4)}`
      : '';

    const contentHtml = `
      <h2 style="font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 0;">Your CommitX reward is ready 💰</h2>
      <p style="color: #a1a1aa; font-size: 15px; line-height: 1.5;">
        Congratulations! You earned a payout from completing <strong>"${challenge.title}"</strong>.
      </p>

      <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 16px; margin: 20px 0;">
        <div style="font-size: 13px; color: #71717a; text-transform: uppercase; font-weight: 700;">Reward Amount</div>
        <div style="font-size: 20px; color: #0ea5e9; font-weight: 800; margin-top: 4px;">${rewardAmount || challenge.stakeAmount} ETH</div>

        <div style="font-size: 13px; color: #71717a; text-transform: uppercase; font-weight: 700; margin-top: 12px;">Recipient Wallet</div>
        <div style="font-size: 14px; color: #ffffff; font-weight: 600; margin-top: 4px;">${formattedWallet}</div>

        ${txHash ? `
          <div style="font-size: 13px; color: #71717a; text-transform: uppercase; font-weight: 700; margin-top: 12px;">Transaction Hash</div>
          <div style="font-size: 13px; color: #0ea5e9; font-weight: 600; margin-top: 4px; word-break: break-all;">${txHash}</div>
        ` : ''}
      </div>

      <div style="margin: 28px 0; text-align: center;">
        <a href="${challengeLink}" style="background-color: #0ea5e9; color: #041208; font-weight: 700; font-size: 15px; padding: 12px 28px; border-radius: 9999px; text-decoration: none; display: inline-block;">
          View Challenge & Payout →
        </a>
      </div>
    `;

    return await sendResendEmail({
      to: user.email,
      subject: `Your CommitX reward is ready 💰`,
      html: generateCommitXEmailWrapper('Reward Ready', contentHtml)
    });
  } catch (err) {
    console.error('[emailService] sendRewardReceivedEmail error:', err.message);
    return false;
  }
}

module.exports = {
  sendResendEmail,
  sendVerificationEmail,
  sendChallengeDeadlineReminder,
  sendParticipantJoinedEmail,
  sendProofResultEmail,
  sendChallengeCompletedEmail,
  sendRewardReceivedEmail
};
