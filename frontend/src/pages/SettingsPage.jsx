import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { 
  User, 
  Bell, 
  SunMoon, 
  ShieldCheck, 
  Wallet, 
  Info, 
  Copy, 
  Check, 
  LogOut, 
  ExternalLink,
  Mail,
  AlertTriangle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { api } from '../services/api';
import './SettingsPage.css';

const SettingsPage = () => {
  const context = useOutletContext();
  const walletAddress = context?.walletAddress;
  const currentUser = context?.currentUser;
  const handleLogout = context?.handleLogout;
  const [searchParams, setSearchParams] = useSearchParams();
  const verifiedTokenRef = useRef(null);

  const [copied, setCopied] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState(null);

  const [savingPrefs, setSavingPrefs] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  const [notifications, setNotifications] = useState({
    deadlineReminders: true,
    participantJoined: true,
    proofResults: true,
    challengeCompleted: true,
    rewardReceived: true,
  });

  const [appearance, setAppearance] = useState(() => {
    const currentTheme = localStorage.getItem('commitx-theme') || document.documentElement.getAttribute('data-theme') || 'dark';
    return {
      darkMode: currentTheme !== 'light',
      reducedMotion: false
    };
  });

  const [accountability, setAccountability] = useState({
    showActive: true,
    showCompleted: true,
    showFailed: true,
  });

  // Fetch email & notification preferences on mount
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const data = await api.getNotificationPreferences();
        if (data) {
          if (data.email) {
            setUserEmail(data.email);
            setEmailInput(data.email);
          }
          setEmailVerified(!!data.emailVerified);
          if (data.notificationPreferences) {
            setNotifications(prev => ({
              ...prev,
              ...data.notificationPreferences
            }));
          }
        }
      } catch (err) {
        console.error('Failed to load notification preferences:', err.message);
      }
    };

    fetchPreferences();

    // Check for verification token in query string (guarded against duplicate execution)
    const verifyToken = searchParams.get('verifyToken');
    if (verifyToken && verifiedTokenRef.current !== verifyToken) {
      verifiedTokenRef.current = verifyToken;
      api.verifyEmail(verifyToken)
        .then(res => {
          setEmailVerified(true);
          setEmailMessage({ type: 'success', text: res.message || 'Email verified successfully!' });
          searchParams.delete('verifyToken');
          setSearchParams(searchParams, { replace: true });
        })
        .catch(err => {
          setEmailMessage({ type: 'error', text: err.message || 'Email verification failed.' });
        });
    }
  }, [searchParams, setSearchParams]);

  // Save email
  const handleSaveEmail = async (e) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes('@')) {
      setEmailMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    setSavingEmail(true);
    setEmailMessage(null);
    try {
      const res = await api.saveEmail(emailInput);
      setUserEmail(res.email || emailInput);
      setEmailVerified(false);
      setEmailMessage({ type: 'success', text: res.message || 'Verification email sent. Check your inbox!' });
    } catch (err) {
      setEmailMessage({ type: 'error', text: err.message || 'Failed to save email address.' });
    } finally {
      setSavingEmail(false);
    }
  };

  // Toggle notification preference & persist to backend
  const handleToggleNotification = async (key, newValue) => {
    const updated = { ...notifications, [key]: newValue };
    setNotifications(updated);
    setSavingPrefs(true);
    setSaveStatus('Saving...');

    try {
      await api.updateNotificationPreferences(updated);
      setSaveStatus('Saved ✓');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err) {
      console.error('Failed to update notification preferences:', err.message);
      setSaveStatus('Error saving');
      // Revert state on error
      setNotifications(notifications);
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleCopyWallet = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDarkModeToggle = (isDark) => {
    setAppearance(prev => ({ ...prev, darkMode: isDark }));
    const themeStr = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', themeStr);
    localStorage.setItem('commitx-theme', themeStr);
  };

  const handleReducedMotionToggle = (val) => {
    setAppearance(prev => ({ ...prev, reducedMotion: val }));
    if (val) {
      document.body.classList.add('reduced-motion-override');
    } else {
      document.body.classList.remove('reduced-motion-override');
    }
  };

  const formattedAddress = walletAddress
    ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`
    : 'Not connected';

  return (
    <div className="settings-page-container">
      <div className="settings-grid">
        
        {/* COLUMN 1 */}
        <div className="settings-column">
          {/* SECTION 1: PROFILE */}
          <section className="settings-card">
            <div className="settings-card-header">
              <User size={18} className="settings-card-icon" />
              <div>
                <h2 className="settings-card-title">Profile</h2>
                <p className="settings-card-subtitle">Your CommitX identity and wallet info.</p>
              </div>
            </div>

            <div className="settings-card-body">
              <div className="settings-field-group">
                <label className="settings-field-label">Username</label>
                <div className="settings-field-value-box">
                  {currentUser?.username || (walletAddress ? 'Connected User' : 'Anonymous')}
                </div>
              </div>

              <div className="settings-field-group">
                <label className="settings-field-label">Wallet Address</label>
                <div className="settings-field-input-row">
                  <span className="settings-wallet-address">{walletAddress || 'No wallet connected'}</span>
                  {walletAddress && (
                    <button 
                      type="button" 
                      onClick={handleCopyWallet} 
                      className="settings-copy-btn"
                      title="Copy Wallet Address"
                    >
                      {copied ? <Check size={14} className="copy-success-icon" /> : <Copy size={14} />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="settings-field-group">
                <label className="settings-field-label">Network</label>
                <div className="settings-field-value-box settings-network-badge">
                  <span className="network-dot" />
                  Arbitrum Sepolia
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: NOTIFICATIONS & EMAIL */}
          <section className="settings-card">
            <div className="settings-card-header">
              <Bell size={18} className="settings-card-icon" />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 className="settings-card-title">Notifications</h2>
                  {saveStatus && (
                    <span className="save-status-text">{saveStatus}</span>
                  )}
                </div>
                <p className="settings-card-subtitle">Configure email alerts & notifications.</p>
              </div>
            </div>

            <div className="settings-card-body">
              
              {/* EMAIL SECTION */}
              <div className="email-config-box">
                <label className="settings-field-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={14} /> Email Notifications
                </label>
                
                <form onSubmit={handleSaveEmail} className="email-input-group">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    placeholder="user@example.com"
                    className="email-input-field"
                  />
                  <button 
                    type="submit" 
                    disabled={savingEmail || !emailInput} 
                    className="btn btn-primary email-save-btn"
                  >
                    {savingEmail ? <Loader2 size={14} className="spin-icon" /> : 'Save Email'}
                  </button>
                </form>

                {/* Email Verification Status Badge */}
                {userEmail && (
                  <div className="email-status-row">
                    {emailVerified ? (
                      <span className="email-status-badge verified">
                        <CheckCircle2 size={14} /> ✓ Email verified
                      </span>
                    ) : (
                      <span className="email-status-badge unverified">
                        <AlertTriangle size={14} /> ⚠ Email not verified
                      </span>
                    )}
                  </div>
                )}

                {/* Status message */}
                {emailMessage && (
                  <div className={`email-alert-message ${emailMessage.type}`}>
                    {emailMessage.text}
                  </div>
                )}
              </div>

              <div className="toggle-list-divider" />

              {/* NOTIFICATION TOGGLES */}
              <ToggleRow
                label="Challenge deadline reminders"
                description="Get notified before your staked challenge expires"
                checked={notifications.deadlineReminders}
                onChange={val => handleToggleNotification('deadlineReminders', val)}
                disabled={savingPrefs}
              />
              <ToggleRow
                label="Someone joins my challenge"
                description="Get notified when participants join your pool"
                checked={notifications.participantJoined}
                onChange={val => handleToggleNotification('participantJoined', val)}
                disabled={savingPrefs}
              />
              <ToggleRow
                label="Proof verification results"
                description="Get notified when AI verifies submitted proofs"
                checked={notifications.proofResults}
                onChange={val => handleToggleNotification('proofResults', val)}
                disabled={savingPrefs}
              />
              <ToggleRow
                label="Challenge completion"
                description="Get notified when challenges are successfully completed"
                checked={notifications.challengeCompleted}
                onChange={val => handleToggleNotification('challengeCompleted', val)}
                disabled={savingPrefs}
              />
              <ToggleRow
                label="Reward received"
                description="Get notified when payout distributions arrive"
                checked={notifications.rewardReceived}
                onChange={val => handleToggleNotification('rewardReceived', val)}
                disabled={savingPrefs}
              />
            </div>
          </section>
        </div>

        {/* COLUMN 2 */}
        <div className="settings-column">
          {/* SECTION 3: APPEARANCE */}
          <section className="settings-card">
            <div className="settings-card-header">
              <SunMoon size={18} className="settings-card-icon" />
              <div>
                <h2 className="settings-card-title">Appearance</h2>
                <p className="settings-card-subtitle">Visual theme and accessibility.</p>
              </div>
            </div>

            <div className="settings-card-body">
              <ToggleRow
                label="Dark mode"
                description="CommitX minimalist dark theme (default)"
                checked={appearance.darkMode}
                disabled={false}
                onChange={handleDarkModeToggle}
              />
              <ToggleRow
                label="Reduced motion"
                description="Disable movement animations for improved accessibility"
                checked={appearance.reducedMotion}
                onChange={handleReducedMotionToggle}
              />
            </div>
          </section>

          {/* SECTION 4: ACCOUNTABILITY */}
          <section className="settings-card">
            <div className="settings-card-header">
              <ShieldCheck size={18} className="settings-card-icon" />
              <div>
                <h2 className="settings-card-title">Accountability</h2>
                <p className="settings-card-subtitle">Challenge view preferences.</p>
              </div>
            </div>

            <div className="settings-card-body">
              <ToggleRow
                label="Show active challenges first"
                description="Prioritize active commitments on dashboard"
                checked={accountability.showActive}
                onChange={val => setAccountability(prev => ({ ...prev, showActive: val }))}
              />
              <ToggleRow
                label="Show completed challenges"
                description="Display completed streaks in challenge list"
                checked={accountability.showCompleted}
                onChange={val => setAccountability(prev => ({ ...prev, showCompleted: val }))}
              />
              <ToggleRow
                label="Show failed challenges"
                description="Include slashed/expired attempts in history"
                checked={accountability.showFailed}
                onChange={val => setAccountability(prev => ({ ...prev, showFailed: val }))}
              />
            </div>
          </section>

          {/* SECTION 5: WALLET & NETWORK */}
          <section className="settings-card">
            <div className="settings-card-header">
              <Wallet size={18} className="settings-card-icon" />
              <div>
                <h2 className="settings-card-title">Wallet & Network</h2>
                <p className="settings-card-subtitle">Manage Web3 session & connection.</p>
              </div>
            </div>

            <div className="settings-card-body">
              <div className="settings-info-row">
                <span className="info-label">Connected Wallet</span>
                <div className="info-val-group">
                  <span className="info-mono-val">{formattedAddress}</span>
                  {walletAddress && (
                    <button type="button" onClick={handleCopyWallet} className="settings-icon-btn" title="Copy Address">
                      {copied ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
                    </button>
                  )}
                </div>
              </div>

              <div className="settings-info-row">
                <span className="info-label">Network</span>
                <span className="info-val-badge">
                  <span className="network-dot" />
                  Arbitrum Sepolia
                </span>
              </div>

              {walletAddress && handleLogout && (
                <div className="settings-action-row mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <button type="button" onClick={handleLogout} className="btn-disconnect-wallet">
                    <LogOut size={15} /> Disconnect Wallet
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* SECTION 6: ABOUT */}
          <section className="settings-card">
            <div className="settings-card-header">
              <Info size={18} className="settings-card-icon" />
              <div>
                <h2 className="settings-card-title">About CommitX</h2>
                <p className="settings-card-subtitle">Platform details & repository links.</p>
              </div>
            </div>

            <div className="settings-card-body">
              <div className="settings-info-row">
                <span className="info-label">Version</span>
                <span className="info-mono-val">v1.0.0 (Arbitrum Stylus)</span>
              </div>
              <div className="settings-info-row">
                <span className="info-label">Network</span>
                <span className="info-mono-val">Arbitrum Sepolia</span>
              </div>
              <div className="settings-info-row">
                <span className="info-label">GitHub</span>
                <a 
                  href="https://github.com/Suraj31shah/Arbitrum" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="settings-link-val"
                >
                  Suraj31shah/Arbitrum <ExternalLink size={13} />
                </a>
              </div>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
};

const ToggleRow = ({ label, description, checked, onChange, disabled }) => (
  <div className="settings-toggle-row">
    <div className="toggle-label-block">
      <span className="toggle-label-text">{label}</span>
      {description && <span className="toggle-desc-text">{description}</span>}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={`toggle-switch-btn ${checked ? 'is-on' : 'is-off'}`}
      onClick={() => !disabled && onChange(!checked)}
    >
      <span className="toggle-switch-handle" />
    </button>
  </div>
);

export default SettingsPage;
