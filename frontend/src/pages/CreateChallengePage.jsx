import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const MIN_STAKE = 0.0000000000001;
const MAX_STAKE = 0.1;

const CreateChallengePage = () => {
  const navigate = useNavigate();
  const context = useOutletContext();
  const globalWalletAddress = context?.walletAddress;
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal: '',
    deadline: null,
    stakeAmount: '0.001',
    startMode: 'immediate',
    startTime: null,
    integrationId: 'none',
    integrationHandle: '',
    metricValue: ''
  });

  const [showOauthModal, setShowOauthModal] = useState(false);
  const [oauthInput, setOauthInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Reset connection if they change the app provider
    if (name === 'integrationId' && value !== 'none') {
      setFormData(prev => ({ ...prev, integrationHandle: '' }));
    }
  };

  const handleConnectApp = (e) => {
    e.preventDefault();
    setShowOauthModal(true);
    setOauthInput('');
  };

  const handleSimulateOauth = (e) => {
    e.preventDefault();
    setIsConnecting(true);
    setTimeout(() => {
      setFormData(prev => ({ ...prev, integrationHandle: oauthInput }));
      setIsConnecting(false);
      setShowOauthModal(false);
    }, 1200);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const stake = parseFloat(formData.stakeAmount);
    if (isNaN(stake) || stake < MIN_STAKE || stake > MAX_STAKE) {
      alert(`Stake amount must be between ${MIN_STAKE} and ${MAX_STAKE} ETH`);
      return;
    }

    if (new Date(formData.deadline) <= new Date()) {
      alert('Deadline must be in the future');
      return;
    }

    if (formData.startMode === 'scheduled' && new Date(formData.startTime) <= new Date()) {
      alert('Start time must be in the future');
      return;
    }

    if (formData.integrationId !== 'none' && !formData.integrationHandle) {
      alert(`Please connect your ${formData.integrationId} account before continuing.`);
      return;
    }

    const challengeData = {
      ...formData,
      stakeAmount: stake,
      metricValue: formData.metricValue ? Number(formData.metricValue) : null,
      startTime: formData.startTime ? formData.startTime.toISOString() : null,
      deadline: formData.deadline ? formData.deadline.toISOString() : null
    };

    navigate('/challenges/new/confirm', { state: { challengeData } });
  };

  if (!globalWalletAddress) {
    return (
      <div className="card text-center" style={{ padding: '4rem 2rem', maxWidth: '600px', margin: '0 auto' }}>
        <h2 className="mb-4">Wallet Required</h2>
        <p className="text-muted mb-6">You must connect your Web3 wallet to create a challenge.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="mb-8">
        <h1>New Challenge</h1>
        <p className="text-muted">Set a goal, choose your stakes, and invite others.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card mb-6">
          <h3 className="mb-4">The Challenge</h3>
          
          <div className="form-group">
            <label className="form-label" htmlFor="title">Title</label>
            <input type="text" id="title" name="title" className="form-input" value={formData.title} onChange={handleChange} placeholder="e.g., Run 5km daily" required maxLength={100} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="goal">Specific Goal (What needs to be done?)</label>
            <input type="text" id="goal" name="goal" className="form-input" value={formData.goal} onChange={handleChange} placeholder="e.g., 35km total distance" required />
          </div>

          <div className="form-group mb-0">
            <label className="form-label" htmlFor="description">Rules & Details</label>
            <textarea id="description" name="description" className="form-textarea" value={formData.description} onChange={handleChange} placeholder="Any specific constraints or rules..." required />
          </div>
        </div>

        <div className="card mb-6">
          <h3 className="mb-4">Verification Tracking</h3>
          <p className="text-muted mb-4">Connect a 3rd-party app to automatically verify completion based on real data.</p>
          
          <div className="form-group">
            <label className="form-label" htmlFor="integrationId">App Integration</label>
            <select id="integrationId" name="integrationId" className="form-input" value={formData.integrationId} onChange={handleChange}>
              <option value="none">None (Manual Proof Submission)</option>
              <option value="github">GitHub (Commits/PRs/Issues)</option>
              <option value="leetcode">LeetCode (Problems Solved)</option>
              <option value="wakatime">WakaTime (Hours Coded)</option>
            </select>
          </div>

          {formData.integrationId !== 'none' && (
            <div className="mt-4">
              {!formData.integrationHandle ? (
                <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px dashed var(--border)' }}>
                  <p className="mb-4">You need to authorize CommitX to read your {formData.integrationId} activity.</p>
                  <button onClick={handleConnectApp} className="btn btn-secondary">
                    Connect {formData.integrationId} Account
                  </button>
                </div>
              ) : (
                <div className="flex gap-4 items-end">
                  <div className="form-group mb-0" style={{ flex: 1 }}>
                    <label className="form-label">Connected Account</label>
                    <div style={{ padding: '0.75rem 1rem', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--success)' }}>
                      <span style={{ fontSize: '1.2rem' }}>✅</span>
                      Authorized as <strong>{formData.integrationHandle}</strong>
                      <button type="button" onClick={() => setFormData(prev => ({ ...prev, integrationHandle: '' }))} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--success)', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.875rem' }}>
                        Disconnect
                      </button>
                    </div>
                  </div>
                  <div className="form-group mb-0" style={{ flex: 1 }}>
                    <label className="form-label" htmlFor="metricValue">Target Goal (Number)</label>
                    <input type="number" id="metricValue" name="metricValue" className="form-input" value={formData.metricValue} onChange={handleChange} required min="1" placeholder="e.g., 10" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card mb-6">
          <h3 className="mb-4">Stake Amount</h3>
          <p className="text-muted mb-4">Choose how much ETH each participant must put on the line. Everyone joining this challenge stakes the same amount.</p>
          
          <div className="form-group mb-2">
            <div className="flex items-center gap-4">
              <input 
                type="number" 
                id="stakeAmount" 
                name="stakeAmount" 
                className="form-input" 
                value={formData.stakeAmount} 
                onChange={handleChange}
                step="any"
                min={MIN_STAKE}
                max={MAX_STAKE}
                required 
                style={{ flex: 1, fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center' }}
              />
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>ETH</span>
            </div>
          </div>
          <div className="text-muted" style={{ fontSize: '0.75rem' }}>
            Min: {MIN_STAKE} ETH &nbsp;·&nbsp; Max: {MAX_STAKE} ETH
          </div>
        </div>

        <div className="card mb-6">
          <h3 className="mb-4">Timeline</h3>
          
          <div className="form-group">
            <label className="form-label">When does this start?</label>
            <div className="flex gap-4">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="radio" name="startMode" value="immediate" checked={formData.startMode === 'immediate'} onChange={handleChange} />
                Start Now (Join anytime before deadline)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="radio" name="startMode" value="scheduled" checked={formData.startMode === 'scheduled'} onChange={handleChange} />
                Schedule for later
              </label>
            </div>
          </div>

          <div className="flex gap-4">
            {formData.startMode === 'scheduled' && (
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" htmlFor="startTime">Start Time</label>
                <DatePicker
                  selected={formData.startTime}
                  onChange={(date) => setFormData(prev => ({ ...prev, startTime: date }))}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  timeCaption="time"
                  dateFormat="MMMM d, yyyy h:mm aa"
                  className="form-input"
                  placeholderText="Select start date & time"
                  required={formData.startMode === 'scheduled'}
                  minDate={new Date()}
                />
              </div>
            )}
            
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label" htmlFor="deadline">Deadline</label>
              <DatePicker
                selected={formData.deadline}
                onChange={(date) => setFormData(prev => ({ ...prev, deadline: date }))}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                timeCaption="time"
                dateFormat="MMMM d, yyyy h:mm aa"
                className="form-input"
                placeholderText="Select deadline date & time"
                required
                minDate={formData.startMode === 'scheduled' && formData.startTime ? formData.startTime : new Date()}
              />
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-full mt-4" style={{ padding: '1rem', fontSize: '1.125rem' }}>
          Continue to Confirmation
        </button>
      </form>

      {showOauthModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '450px', background: 'var(--bg-primary)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
            <div className="text-center mb-6">
              <div style={{ width: '64px', height: '64px', background: 'var(--bg-secondary)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '2rem' }}>
                🔗
              </div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Connect {formData.integrationId}</h2>
              <p className="text-muted" style={{ fontSize: '0.875rem' }}>Authorize CommitX to read your public activity and verify your challenges automatically.</p>
            </div>
            
            <form onSubmit={handleSimulateOauth}>
              <div className="form-group mb-6">
                <label className="form-label">{formData.integrationId === 'wakatime' ? 'Your WakaTime API Key' : `Your ${formData.integrationId} Username`}</label>
                <input 
                  type="text" 
                  className="form-input" 
                  autoFocus
                  required
                  value={oauthInput}
                  onChange={(e) => setOauthInput(e.target.value)}
                  placeholder={formData.integrationId === 'wakatime' ? 'sec_...' : 'username'}
                />
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={() => setShowOauthModal(false)} className="btn btn-secondary" style={{ flex: 1 }} disabled={isConnecting}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isConnecting || !oauthInput}>
                  {isConnecting ? 'Authorizing...' : 'Authorize App'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateChallengePage;
