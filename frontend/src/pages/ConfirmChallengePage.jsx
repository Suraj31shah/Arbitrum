import React, { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { api } from '../services/api';

const ConfirmChallengePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const challengeData = location.state?.challengeData;

  if (!challengeData) {
    return <Navigate to="/challenges/new" replace />;
  }

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.createChallenge(challengeData);
      // Assuming no actual crypto wallet tx for this version
      navigate(`/challenges/${response._id}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 className="mb-2">Confirm Commitment</h1>
      <p className="text-muted mb-8">Review your challenge details before staking.</p>

      {error && (
        <div style={{ color: 'var(--error)', backgroundColor: 'var(--error-bg)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
          {error}
        </div>
      )}

      <div className="card mb-8">
        <div className="flex justify-between items-center mb-6 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <div className="text-muted" style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount to Stake</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent)', lineHeight: 1 }}>
              {challengeData.stakeAmount} ETH
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="form-label">Title</div>
          <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>{challengeData.title}</div>
        </div>

        <div className="mb-6">
          <div className="form-label">Details</div>
          <div style={{ color: 'var(--text-secondary)' }}>{challengeData.description}</div>
        </div>

        <div className="mb-2">
          <div className="form-label">Deadline</div>
          <div style={{ fontWeight: '500' }}>{new Date(challengeData.deadline).toLocaleString()}</div>
        </div>
      </div>

      <div className="flex gap-4">
        <button 
          onClick={() => navigate(-1)} 
          className="btn btn-secondary" 
          style={{ flex: 1 }}
          disabled={loading}
        >
          Back to Edit
        </button>
        <button 
          onClick={handleConfirm} 
          className="btn btn-primary" 
          style={{ flex: 2 }}
          disabled={loading}
        >
          {loading ? 'Confirming...' : 'Confirm & Stake ETH'}
        </button>
      </div>
    </div>
  );
};

export default ConfirmChallengePage;
