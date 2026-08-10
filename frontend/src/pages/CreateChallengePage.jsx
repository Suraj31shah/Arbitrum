import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';

const INTEGRATIONS = [
  { id: 'none', label: 'None (Manual Proof)', metricLabel: '' },
  { id: 'strava', label: 'Strava', metricLabel: 'Steps / km' },
  { id: 'fitbit', label: 'Fitbit', metricLabel: 'Steps' },
  { id: 'github', label: 'GitHub', metricLabel: 'Commits / PRs' },
  { id: 'wakatime', label: 'WakaTime', metricLabel: 'Hours' },
  { id: 'leetcode', label: 'LeetCode', metricLabel: 'Problems' },
  { id: 'goodreads', label: 'Goodreads', metricLabel: 'Pages / Books' },
  { id: 'youtube', label: 'YouTube', metricLabel: 'Videos watched' },
  { id: 'toggl', label: 'Toggl Track', metricLabel: 'Hours logged' },
  { id: 'todoist', label: 'Todoist', metricLabel: 'Tasks completed' },
  { id: 'notion', label: 'Notion', metricLabel: 'Pages updated' },
  { id: 'google', label: 'Google Health / Fit', metricLabel: 'Steps' },
  { id: 'twitter', label: 'X (Twitter)', metricLabel: 'Posts' }
];

const CreateChallengePage = () => {
  const navigate = useNavigate();
  const context = useOutletContext();
  const globalWalletAddress = context?.walletAddress;
  const [currentUser, setCurrentUser] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    stakeAmount: 0.01
  });

  const [selectedIntegrationId, setSelectedIntegrationId] = useState('none');
  const [integrationHandle, setIntegrationHandle] = useState('');
  const [metricValue, setMetricValue] = useState('');

  useEffect(() => {
    // Restore form data from before OAuth redirect
    const savedFormData = localStorage.getItem('pendingFormData');
    if (savedFormData) {
      try { setFormData(JSON.parse(savedFormData)); } catch(e){}
      localStorage.removeItem('pendingFormData');
    }
    const savedMetric = localStorage.getItem('pendingMetricValue');
    if (savedMetric) {
      setMetricValue(savedMetric);
      localStorage.removeItem('pendingMetricValue');
    }
    const savedHandle = localStorage.getItem('pendingIntegrationHandle');
    if (savedHandle) {
      setIntegrationHandle(savedHandle);
      localStorage.removeItem('pendingIntegrationHandle');
    }

    // Check if user is logged in via OAuth
    fetch('http://localhost:5000/api/auth/current-user', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setCurrentUser(data.user);
          // Restore the integration the user was trying to connect
          const pending = localStorage.getItem('pendingIntegration');
          if (pending) {
            setSelectedIntegrationId(pending);
            localStorage.removeItem('pendingIntegration');
          }
        }
      })
      .catch(err => console.error('Not logged in:', err));
  }, []);

  const selectedIntegration = INTEGRATIONS.find(i => i.id === selectedIntegrationId);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'stakeAmount' ? parseFloat(value) : value
    }));
  };

  const handleConnectGithub = () => {
    localStorage.setItem('pendingIntegration', 'github');
    localStorage.setItem('pendingFormData', JSON.stringify(formData));
    localStorage.setItem('pendingMetricValue', metricValue);
    localStorage.setItem('pendingIntegrationHandle', integrationHandle);
    window.location.href = 'http://localhost:5000/api/auth/github';
  };

  const handleConnectTodoist = () => {
    localStorage.setItem('pendingIntegration', 'todoist');
    localStorage.setItem('pendingFormData', JSON.stringify(formData));
    localStorage.setItem('pendingMetricValue', metricValue);
    localStorage.setItem('pendingIntegrationHandle', integrationHandle);
    window.location.href = 'http://localhost:5000/api/auth/todoist';
  };

  const handleConnectNotion = () => {
    localStorage.setItem('pendingIntegration', 'notion');
    localStorage.setItem('pendingFormData', JSON.stringify(formData));
    localStorage.setItem('pendingMetricValue', metricValue);
    localStorage.setItem('pendingIntegrationHandle', integrationHandle);
    window.location.href = 'http://localhost:5000/api/auth/notion';
  };

  const handleConnectGoogle = () => {
    localStorage.setItem('pendingIntegration', 'google');
    localStorage.setItem('pendingFormData', JSON.stringify(formData));
    localStorage.setItem('pendingMetricValue', metricValue);
    localStorage.setItem('pendingIntegrationHandle', integrationHandle);
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate
    if (new Date(formData.deadline) <= new Date()) {
      alert('Deadline must be in the future');
      return;
    }

    if (formData.stakeAmount < 0) {
      alert('Stake amount cannot be negative');
      return;
    }

    if (selectedIntegrationId !== 'none' && !metricValue) {
      alert(`Please enter the number of ${selectedIntegration.metricLabel} to complete.`);
      return;
    }

    let finalHandle = integrationHandle;
    if (selectedIntegrationId === 'github' && currentUser && currentUser.githubId) {
      finalHandle = currentUser.username;
    } else if (selectedIntegrationId === 'todoist' && currentUser && currentUser.todoistId) {
      finalHandle = currentUser.todoistId;
    } else if (selectedIntegrationId === 'notion' && currentUser && currentUser.notionId) {
      finalHandle = currentUser.notionId;
    } else if (selectedIntegrationId === 'google' && currentUser && currentUser.googleId) {
      finalHandle = currentUser.googleId;
    }

    // Enhance description with integration if selected
    let enhancedDescription = formData.description;
    if (selectedIntegrationId !== 'none') {
      enhancedDescription = `${selectedIntegration.label} Integration: Goal is to complete ${metricValue} ${selectedIntegration.metricLabel}.\n\n` + formData.description;
    }

    const challengeData = {
      ...formData,
      description: enhancedDescription,
      integrationId: selectedIntegrationId,
      integrationHandle: finalHandle,
      metricValue: Number(metricValue) || null
    };

    // Move to confirm step, pass data via router state
    navigate('/challenges/new/confirm', { state: { challengeData } });
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="flex justify-between items-end mb-2">
        <h1>New Commitment</h1>
        {(currentUser || globalWalletAddress) && <div style={{fontSize: '0.875rem', color: 'var(--accent)'}}>Logged in as {currentUser?.username || `${globalWalletAddress.substring(0,6)}...`}</div>}
      </div>
      <p className="text-muted mb-8">Define what you want to achieve and set the stakes.</p>

      {(!currentUser || !currentUser.walletAddress) && !globalWalletAddress ? (
        <div className="card text-center" style={{ padding: '4rem 2rem' }}>
          <h2 className="mb-4">Wallet Required</h2>
          <p className="text-muted mb-6" style={{ fontSize: '1.1rem' }}>
            You must connect your Web3 wallet to create a new challenge and stake ETH.
          </p>
          <p className="text-muted">
            Please click <strong>Connect Wallet to Login</strong> in the top right corner of the navigation bar to continue.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card">
          <div className="form-group">
            <label className="form-label" htmlFor="title">Challenge Title</label>
            <input
              type="text"
              id="title"
              name="title"
              className="form-input"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Run 5km every day for a week"
              required
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">Details</label>
            <textarea
              id="description"
              name="description"
              className="form-textarea"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the exact requirements for this to be considered complete..."
              required
            />
          </div>

          <div className="flex gap-4 mb-6">
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label className="form-label" htmlFor="deadline">Deadline</label>
              <input
                type="datetime-local"
                id="deadline"
                name="deadline"
                className="form-input"
                value={formData.deadline}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label className="form-label" htmlFor="stakeAmount">Stake Amount (ETH)</label>
              <input
                type="number"
                id="stakeAmount"
                name="stakeAmount"
                className="form-input"
                value={formData.stakeAmount}
                onChange={handleChange}
                step="any"
                min="0"
                required
              />
            </div>
          </div>

          {/* Integration Section */}
          <div className="form-group p-4" style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
            <label className="form-label">Auto-Verify with 3rd Party App (Optional)</label>
            
            <div className="mb-4">
              <select 
                className="form-input"
                value={selectedIntegrationId}
                onChange={(e) => setSelectedIntegrationId(e.target.value)}
              >
                {INTEGRATIONS.map(integration => (
                  <option key={integration.id} value={integration.id}>
                    {integration.label}
                  </option>
                ))}
              </select>
            </div>
            
            {selectedIntegrationId === 'github' && (!currentUser || !currentUser.githubId) && (
               <div className="text-center mb-4">
                 <button type="button" className="btn btn-secondary" onClick={handleConnectGithub}>
                   Connect GitHub Account
                 </button>
               </div>
            )}

            {selectedIntegrationId === 'todoist' && (!currentUser || !currentUser.todoistId) && (
               <div className="text-center mb-4">
                 <button type="button" className="btn btn-secondary" onClick={handleConnectTodoist}>
                   Connect Todoist Account
                 </button>
               </div>
            )}

            {selectedIntegrationId === 'notion' && (!currentUser || !currentUser.notionId) && (
               <div className="text-center mb-4">
                 <button type="button" className="btn btn-secondary" onClick={handleConnectNotion}>
                   Connect Notion Account
                 </button>
               </div>
            )}

            {selectedIntegrationId === 'google' && (!currentUser || !currentUser.googleId) && (
               <div className="text-center mb-4">
                 <button type="button" className="btn btn-secondary" onClick={handleConnectGoogle}>
                   Connect Google Health / Fit Account
                 </button>
               </div>
            )}

            {selectedIntegrationId !== 'none' && 
             !(selectedIntegrationId === 'github' && (!currentUser || !currentUser.githubId)) &&
             !(selectedIntegrationId === 'todoist' && (!currentUser || !currentUser.todoistId)) &&
             !(selectedIntegrationId === 'notion' && (!currentUser || !currentUser.notionId)) &&
             !(selectedIntegrationId === 'google' && (!currentUser || !currentUser.googleId)) && (
              <div className="flex gap-4 flex-col">
                {selectedIntegrationId !== 'github' && selectedIntegrationId !== 'todoist' && selectedIntegrationId !== 'notion' && selectedIntegrationId !== 'google' && (
                  <div>
                    <input 
                      type="text" 
                      className="form-input"
                      value={integrationHandle}
                      onChange={(e) => setIntegrationHandle(e.target.value)}
                      placeholder={`Enter your ${selectedIntegration.label} username or API key`}
                      required={selectedIntegrationId !== 'github' && selectedIntegrationId !== 'todoist' && selectedIntegrationId !== 'notion' && selectedIntegrationId !== 'google'}
                    />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    className="form-input"
                    style={{ flex: 1 }}
                    value={metricValue}
                    onChange={(e) => setMetricValue(e.target.value)}
                    placeholder={`Target ${selectedIntegration?.metricLabel} (e.g. 5)`}
                    required
                  />
                  <span className="text-muted" style={{ minWidth: '100px' }}>{selectedIntegration?.metricLabel}</span>
                </div>
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary btn-full mt-4">
            Continue to Confirmation
          </button>
        </form>
      )}
    </div>
  );
};

export default CreateChallengePage;
