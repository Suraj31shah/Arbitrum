import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { api, getApiUrl } from '../services/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const MIN_STAKE = 0.0000000000001;
const MAX_STAKE = 0.1;

const INTEGRATIONS = [
  { id: 'none', label: 'None (Manual Proof)', metrics: [] },
  { id: 'github', label: 'GitHub', metrics: [
    { id: 'commits', label: 'Commits' },
    { id: 'prs', label: 'Pull Requests' },
    { id: 'issues', label: 'Issues Solved' }
  ]},
  { id: 'todoist', label: 'Todoist', metrics: [{ id: 'tasks', label: 'Tasks completed' }] },
  { id: 'notion', label: 'Notion', metrics: [{ id: 'pages', label: 'Pages updated' }] },
  { id: 'google', label: 'Google Health / Fit', metrics: [
    { id: 'steps', label: 'Steps' },
    { id: 'calories', label: 'Calories Burned' },
    { id: 'active_minutes', label: 'Active Minutes' }
  ]}
];

const CreateChallengePage = () => {
  const navigate = useNavigate();
  const context = useOutletContext();
  const globalWalletAddress = context?.walletAddress;
  const [currentUser, setCurrentUser] = useState(null);
  
  const defaultStartTime = new Date();
  const defaultDeadline = new Date(defaultStartTime.getTime() + 60 * 60 * 1000); // 1 hour ahead
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal: '',
    deadline: defaultDeadline,
    stakeAmount: '0.001',
    startMode: 'immediate',
    startTime: defaultStartTime,
    integrationId: 'none',
    integrationHandle: '',
    integrationMetrics: [] // Array of { id, goal }
  });

  const getMinTime = (date) => {
    if (!date) return new Date();
    const d = date instanceof Date ? date : new Date(date);
    const today = new Date();
    const isToday = d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    return isToday ? today : new Date(new Date().setHours(0, 0, 0, 0));
  };
  
  const getMaxTime = () => {
    return new Date(new Date().setHours(23, 59, 59, 999));
  };

  const [showOauthModal, setShowOauthModal] = useState(false);
  const [oauthInput, setOauthInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const savedFormData = localStorage.getItem('pendingFormData');
    if (savedFormData) {
      try {
        const parsed = JSON.parse(savedFormData);
        if (parsed.deadline) parsed.deadline = new Date(parsed.deadline);
        if (parsed.startTime) parsed.startTime = new Date(parsed.startTime);
        setFormData(parsed);
      } catch(e){}
      localStorage.removeItem('pendingFormData');
    }
    const savedMetric = localStorage.getItem('pendingMetricValue');
    if (savedMetric) {
      setFormData(prev => ({ ...prev, metricValue: savedMetric }));
      localStorage.removeItem('pendingMetricValue');
    }

    fetch(`${getApiUrl()}/api/auth/current-user`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setCurrentUser(data.user);
          
          // Check if they were actually trying to join a challenge
          const pendingJoin = localStorage.getItem('pendingJoinChallenge');
          if (pendingJoin) {
            localStorage.removeItem('pendingJoinChallenge');
            navigate(`/challenges/${pendingJoin}`);
            return;
          }

          const pending = localStorage.getItem('pendingIntegration');
          if (pending) {
            setFormData(prev => ({ ...prev, integrationId: pending }));
            
            // Auto-fill integration handle if connected
            if (pending === 'github' && data.user.githubId) {
              setFormData(prev => ({ ...prev, integrationHandle: data.user.githubUsername || data.user.username }));
            } else if (pending === 'todoist' && data.user.todoistId) {
              setFormData(prev => ({ ...prev, integrationHandle: data.user.todoistId }));
            } else if (pending === 'notion' && data.user.notionId) {
              setFormData(prev => ({ ...prev, integrationHandle: data.user.notionId }));
            } else if (pending === 'google' && data.user.googleId) {
              setFormData(prev => ({ ...prev, integrationHandle: data.user.googleId }));
            }
            localStorage.removeItem('pendingIntegration');
          }
        }
      })
      .catch(err => console.error('Not logged in:', err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'integrationId') {
        next.integrationMetrics = [];
        next.integrationHandle = '';
      }
      return next;
    });
  };

  const handleMetricToggle = (metricId) => {
    setFormData(prev => {
      const exists = prev.integrationMetrics.find(m => m.id === metricId);
      if (exists) {
        return { ...prev, integrationMetrics: prev.integrationMetrics.filter(m => m.id !== metricId) };
      } else {
        return { ...prev, integrationMetrics: [...prev.integrationMetrics, { id: metricId, goal: '' }] };
      }
    });
  };

  const handleMetricGoalChange = (metricId, goalValue) => {
    setFormData(prev => ({
      ...prev,
      integrationMetrics: prev.integrationMetrics.map(m => 
        m.id === metricId ? { ...m, goal: goalValue } : m
      )
    }));
  };

  const handleConnectApp = (e) => {
    e.preventDefault();
    const { integrationId } = formData;
    localStorage.setItem('pendingIntegration', integrationId);
    localStorage.setItem('pendingFormData', JSON.stringify(formData));
    localStorage.setItem('pendingMetricValue', formData.metricValue);
    
    window.location.href = `${getApiUrl()}/api/auth/${integrationId}`;
  };

  const handleDisconnectApp = () => {
    window.location.href = `${getApiUrl()}/api/auth/${formData.integrationId}/disconnect`;
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
          
          <div className="form-group mb-4">
            <label className="form-label" htmlFor="integrationId">App Integration</label>
            <select id="integrationId" name="integrationId" className="form-input" value={formData.integrationId} onChange={handleChange}>
              {INTEGRATIONS.map(integration => (
                <option key={integration.id} value={integration.id}>
                  {integration.label}
                </option>
              ))}
            </select>
          </div>
          
          {(() => {
            const selectedIntegration = INTEGRATIONS.find(i => i.id === formData.integrationId);
            if (selectedIntegration && selectedIntegration.metrics && selectedIntegration.metrics.length > 0) {
              return (
                <div className="form-group mb-4">
                  <label className="form-label">Select Tracking Metrics & Goals</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                    {selectedIntegration.metrics.map(m => {
                      const isChecked = formData.integrationMetrics.some(im => im.id === m.id);
                      const currentGoal = formData.integrationMetrics.find(im => im.id === m.id)?.goal || '';
                      return (
                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: isChecked ? 'rgba(0, 219, 137, 0.05)' : 'var(--bg-primary)', border: isChecked ? '1px solid var(--primary)' : '1px solid var(--border)', borderRadius: 'var(--radius-md)', transition: 'all 0.2s' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', flex: 1, fontWeight: isChecked ? '600' : 'normal', color: isChecked ? 'var(--primary)' : 'var(--text-primary)' }}>
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={() => handleMetricToggle(m.id)}
                              style={{ width: '1.1rem', height: '1.1rem', accentColor: 'var(--primary)', cursor: 'pointer' }}
                            />
                            {m.label}
                          </label>
                          {isChecked && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', animation: 'fadeIn 0.2s ease-in-out' }}>
                              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Target:</span>
                              <input 
                                type="number" 
                                className="form-input" 
                                style={{ width: '120px', padding: '0.4rem 0.75rem', margin: 0 }}
                                placeholder="e.g. 50"
                                min="1"
                                value={currentGoal}
                                onChange={(e) => handleMetricGoalChange(m.id, e.target.value)}
                                required
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {formData.integrationId !== 'none' && (
            <div className="mt-4">
              {!(
                (formData.integrationId === 'github' && currentUser?.githubId) ||
                (formData.integrationId === 'todoist' && currentUser?.todoistId) ||
                (formData.integrationId === 'notion' && currentUser?.notionId) ||
                (formData.integrationId === 'google' && currentUser?.googleId)
              ) ? (
                <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px dashed var(--border)' }}>
                  <p className="mb-4">You need to authorize CommitX to read your {formData.integrationId} activity.</p>
                  <button type="button" onClick={handleConnectApp} className="btn btn-secondary">
                    Connect {formData.integrationId} Account
                  </button>
                </div>
              ) : (
                <div className="flex gap-4 items-end">
                  <div className="form-group mb-0" style={{ flex: 1 }}>
                    <label className="form-label">Connected Account</label>
                    <div style={{ padding: '0.75rem 1rem', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--success)' }}>
                      <span style={{ fontSize: '1.2rem' }}>✅</span>
                      Authorized successfully!
                      <button type="button" onClick={handleDisconnectApp} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--success)', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.875rem' }}>
                        Disconnect
                      </button>
                    </div>
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
                  timeIntervals={1}
                  timeCaption="time"
                  dateFormat="MMMM d, yyyy h:mm aa"
                  className="form-input"
                  placeholderText="Select start date & time"
                  required={formData.startMode === 'scheduled'}
                  minDate={new Date()}
                  minTime={getMinTime(formData.startTime)}
                  maxTime={getMaxTime()}
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
                timeIntervals={1}
                timeCaption="time"
                dateFormat="MMMM d, yyyy h:mm aa"
                className="form-input"
                placeholderText="Select deadline date & time"
                required
                minDate={formData.startMode === 'scheduled' && formData.startTime ? formData.startTime : new Date()}
                minTime={formData.startMode === 'scheduled' && formData.startTime 
                  ? (formData.deadline?.getDate() === formData.startTime.getDate() ? formData.startTime : new Date(new Date().setHours(0, 0, 0, 0)))
                  : getMinTime(formData.deadline)}
                maxTime={getMaxTime()}
              />
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-full mt-4" style={{ padding: '1rem', fontSize: '1.125rem' }}>
          Continue to Confirmation
        </button>
      </form>

    </div>
  );
};

export default CreateChallengePage;
