import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const SubmitProofPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    description: '',
    githubUrl: '',
    websiteUrl: ''
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    api.getChallengeById(id)
      .then(setChallenge)
      .catch(err => setError('Failed to load challenge: ' + err.message));
  }, [id]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('A file upload (image or PDF) is required as primary proof.');
      return;
    }

    setLoading(true);
    setError(null);

    const payload = new FormData();
    payload.append('challengeId', id);
    payload.append('description', formData.description);
    if (formData.githubUrl) payload.append('githubUrl', formData.githubUrl);
    if (formData.websiteUrl) payload.append('websiteUrl', formData.websiteUrl);
    payload.append('file', file);

    try {
      const response = await api.createProof(payload);
      // Wait a moment for UX purposes before redirecting
      setTimeout(() => {
        navigate(`/challenges/${id}/result`, { state: { proofId: response._id } });
      }, 1500);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (error && !challenge) return <div className="container mt-8 text-center" style={{ color: 'var(--error)' }}>{error}</div>;
  if (!challenge) return <div className="container text-center mt-8">Loading challenge context...</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 className="mb-2">Submit Proof</h1>
      <p className="text-muted mb-8">Provide evidence that you completed your commitment.</p>

      <div className="card mb-8" style={{ backgroundColor: 'var(--bg-secondary)', border: 'none' }}>
        <div className="form-label" style={{ color: 'var(--text-primary)' }}>Your Commitment</div>
        <div style={{ fontWeight: '600', marginBottom: '8px' }}>{challenge.title}</div>
        <div className="text-muted" style={{ fontSize: '0.875rem' }}>{challenge.description}</div>
      </div>

      {error && (
        <div style={{ color: 'var(--error)', backgroundColor: 'var(--error-bg)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="card text-center" style={{ padding: 'var(--space-8)' }}>
          <div style={{ fontSize: '3rem', color: 'var(--accent)', animation: 'pulse 2s infinite' }}>⌘</div>
          <h3 className="mt-4 mb-2">Analyzing Proof...</h3>
          <p className="text-muted">Our AI is verifying your submission against the challenge requirements. This usually takes 5-10 seconds.</p>
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
            <label className="form-label" htmlFor="file">Upload Evidence (Required)</label>
            <input
              type="file"
              id="file"
              name="file"
              className="form-input"
              style={{ padding: '8px' }}
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files[0])}
              required
            />
            <div className="text-muted mt-2" style={{ fontSize: '0.75rem' }}>Accepted formats: JPG, PNG, WEBP, PDF (Max 10MB)</div>
          </div>

          {(() => {
            switch (challenge.integrationId) {
              case 'github':
              case 'wakatime':
              case 'leetcode':
                return (
                  <>
                    <div className="form-group">
                      <label className="form-label" htmlFor="githubUrl">GitHub URL (Optional)</label>
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
                      <label className="form-label" htmlFor="websiteUrl">Live Link (Optional)</label>
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
                  </>
                );
              case 'google':
                return (
                  <div className="form-group">
                    <label className="form-label" htmlFor="websiteUrl">Fitness Activity Link (Optional)</label>
                    <input
                      type="url"
                      id="websiteUrl"
                      name="websiteUrl"
                      className="form-input"
                      value={formData.websiteUrl}
                      onChange={handleChange}
                      placeholder="Strava, Google Fit web link, etc."
                    />
                  </div>
                );
              case 'notion':
                return (
                  <div className="form-group">
                    <label className="form-label" htmlFor="websiteUrl">Notion Page Link (Optional)</label>
                    <input
                      type="url"
                      id="websiteUrl"
                      name="websiteUrl"
                      className="form-input"
                      value={formData.websiteUrl}
                      onChange={handleChange}
                      placeholder="https://www.notion.so/..."
                    />
                  </div>
                );
              case 'todoist':
                return (
                  <div className="form-group">
                    <label className="form-label" htmlFor="websiteUrl">Todoist Project Link (Optional)</label>
                    <input
                      type="url"
                      id="websiteUrl"
                      name="websiteUrl"
                      className="form-input"
                      value={formData.websiteUrl}
                      onChange={handleChange}
                      placeholder="https://todoist.com/..."
                    />
                  </div>
                );
              default:
                return (
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
                );
            }
          })()}

          <button type="submit" className="btn btn-primary btn-full mt-4">
            Submit for Verification
          </button>
        </form>
      )}
    </div>
  );
};

export default SubmitProofPage;
