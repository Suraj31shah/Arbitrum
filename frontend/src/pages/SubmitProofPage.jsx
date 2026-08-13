import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';

const SubmitProofPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Manual proof state
  const [formData, setFormData] = useState({
    description: '',
    githubUrl: '',
    websiteUrl: ''
  });
  const [file, setFile] = useState(null);

  // Integration proof state
  const [previewData, setPreviewData] = useState(null);
  const [fetchingPreview, setFetchingPreview] = useState(false);

  useEffect(() => {
    api.getChallengeById(id)
      .then(setChallenge)
      .catch(err => setError('Failed to load challenge: ' + err.message));
  }, [id]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFetchPreview = async () => {
    setFetchingPreview(true);
    setError(null);
    try {
      const data = await api.getIntegrationPreview(id);
      setPreviewData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setFetchingPreview(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    const payload = new FormData();
    payload.append('challengeId', id);
    
    if (challenge.integrationId && challenge.integrationId !== 'none') {
      // Integration mode
      payload.append('description', `Auto-verified via ${challenge.integrationId}`);
    } else {
      // Manual mode
      payload.append('description', formData.description);
      if (formData.githubUrl) payload.append('githubUrl', formData.githubUrl);
      if (formData.websiteUrl) payload.append('websiteUrl', formData.websiteUrl);
      if (file) payload.append('file', file);
    }

    try {
      await api.createProof(payload);
      // Wait a moment for UX purposes before redirecting back to the detail page
      setTimeout(() => {
        navigate(`/challenges/${id}`);
      }, 1500);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (error && !challenge) return <div className="container mt-8 text-center" style={{ color: 'var(--error)' }}>{error}</div>;
  if (!challenge) return <div className="container text-center mt-8">Loading challenge context...</div>;

  const isIntegration = challenge.integrationId && challenge.integrationId !== 'none';

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="mb-4">
        <Link to={`/challenges/${id}`} className="text-muted" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          ← Back to Challenge
        </Link>
      </div>

      <h1 className="mb-2">Verify Completion</h1>
      <p className="text-muted mb-8">
        {isIntegration ? `Verify your goal using ${challenge.integrationId}.` : 'Provide evidence that you completed your commitment.'}
      </p>

      <div className="card mb-8" style={{ backgroundColor: 'var(--bg-secondary)', border: 'none' }}>
        <div className="form-label" style={{ color: 'var(--text-primary)' }}>Your Commitment</div>
        <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '1.25rem' }}>{challenge.goal}</div>
        <div className="text-muted" style={{ fontSize: '0.875rem' }}>{challenge.description}</div>
      </div>

      {error && (
        <div style={{ color: 'var(--error)', backgroundColor: 'var(--error-bg)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="card text-center" style={{ padding: 'var(--space-8)' }}>
          <div style={{ fontSize: '3rem', color: 'var(--accent)' }} className="animate-pulse">⌘</div>
          <h3 className="mt-4 mb-2">Processing Verification...</h3>
          <p className="text-muted">Finalizing your status on the network.</p>
        </div>
      ) : isIntegration ? (
        <div className="card">
          <h3 className="mb-4 text-info">App Verification</h3>
          <p className="mb-4">This challenge requires automatic verification via <strong>{challenge.integrationId}</strong> for the handle <code>{challenge.integrationHandle}</code>.</p>
          
          {challenge.integrationMetrics && challenge.integrationMetrics.length > 0 ? (
            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
              <div className="form-label mb-2">Target Goals</div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {challenge.integrationMetrics.map(m => (
                  <li key={m.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', padding: '0.5rem 0' }}>
                    <span style={{ textTransform: 'capitalize' }}>{m.id.replace('_', ' ')}</span>
                    <strong style={{ fontSize: '1.1rem' }}>{m.goal}</strong>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
              <div className="form-label">Target Goal</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{challenge.metricValue}</div>
            </div>
          )}

          {!previewData ? (
            <button 
              onClick={handleFetchPreview} 
              className="btn btn-secondary btn-full" 
              disabled={fetchingPreview}
              style={{ padding: '1rem' }}
            >
              {fetchingPreview ? 'Fetching live data...' : `Fetch Live Data from ${challenge.integrationId}`}
            </button>
          ) : (
            <div>
              <div style={{ background: 'var(--success-bg)', borderLeft: '4px solid var(--success)', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem' }}>
                <div style={{ color: 'var(--success)', fontWeight: 'bold', marginBottom: '4px' }}>Fetched Data:</div>
                <div style={{ color: 'var(--text-primary)' }}>{previewData.text}</div>
                {previewData.values && challenge.integrationMetrics && challenge.integrationMetrics.length > 0 ? (
                  <div style={{ marginTop: '12px' }}>
                    {challenge.integrationMetrics.map(m => {
                      const actual = previewData.values[m.id] || 0;
                      const met = actual >= m.goal;
                      return (
                        <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.875rem' }}>
                          <span style={{ textTransform: 'capitalize' }}>{m.id.replace('_', ' ')}</span>
                          <span>
                            <strong>{actual}</strong> / {m.goal} {met ? '✅' : '❌'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ marginTop: '8px', fontSize: '0.875rem' }}>
                    Value extracted: <strong>{previewData.value || JSON.stringify(previewData.values)}</strong>
                  </div>
                )}
              </div>

              <div className="text-muted mb-4" style={{ fontSize: '0.875rem' }}>
                {(() => {
                  if (challenge.integrationMetrics && challenge.integrationMetrics.length > 0 && previewData.values) {
                    const allMet = challenge.integrationMetrics.every(m => (previewData.values[m.id] || 0) >= m.goal);
                    return allMet
                      ? '✅ All goals met or exceeded. You will succeed.'
                      : '⚠️ One or more goals are not met. If you submit now, your status will be marked as failed.';
                  } else {
                    return previewData.value >= challenge.metricValue 
                      ? '✅ This meets or exceeds the target goal. You will succeed.' 
                      : '⚠️ This is below the target goal. If you submit now, your status will be marked as failed.';
                  }
                })()}
              </div>

              <div className="flex gap-4">
                <button onClick={handleFetchPreview} className="btn btn-secondary" style={{ flex: 1 }} disabled={fetchingPreview}>
                  Refresh Data
                </button>
                <button onClick={handleSubmit} className="btn btn-primary" style={{ flex: 2, padding: '1rem' }}>
                  Confirm & Submit
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card">
          <div className="form-group">
            <label className="form-label" htmlFor="description">How did you complete this?</label>
            <textarea
              id="description"
              name="description"
              className="form-textarea"
              value={formData.description}
              onChange={handleChange}
              placeholder="Briefly explain what you did to achieve the goal..."
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="file">Upload Evidence (Optional)</label>
            <input
              type="file"
              id="file"
              name="file"
              className="form-input"
              style={{ padding: '8px' }}
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files[0])}
            />
            <div className="text-muted mt-2" style={{ fontSize: '0.75rem' }}>Accepted formats: JPG, PNG, WEBP, PDF (Max 10MB)</div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="githubUrl">GitHub / Code URL (Optional)</label>
            <input
              type="url"
              id="githubUrl"
              name="githubUrl"
              className="form-input"
              value={formData.githubUrl}
              onChange={handleChange}
              placeholder="https://github.com/..."
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="websiteUrl">Relevant Web Link (Optional)</label>
            <input
              type="url"
              id="websiteUrl"
              name="websiteUrl"
              className="form-input"
              value={formData.websiteUrl}
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full mt-4" style={{ padding: '1rem', fontSize: '1.125rem' }}>
            Submit for Manual Verification
          </button>
        </form>
      )}
    </div>
  );
};

export default SubmitProofPage;
