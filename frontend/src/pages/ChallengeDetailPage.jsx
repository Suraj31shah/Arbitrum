import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import CountdownTimer from '../components/CountdownTimer';
import VerificationDisplay from '../components/VerificationDisplay';

const ChallengeDetailPage = () => {
  const { id } = useParams();
  const [challenge, setChallenge] = useState(null);
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchChallengeData = async () => {
      try {
        const data = await api.getChallengeById(id);
        setChallenge(data);
        
        // Only fetch proofs if status implies they might exist
        if (['proof_submitted', 'verifying', 'ai_verified', 'completed', 'failed'].includes(data.status)) {
          const proofData = await api.getProofsByChallenge(id);
          setProofs(proofData);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChallengeData();
  }, [id]);

  if (loading) return <div className="container text-center mt-8">Loading challenge...</div>;
  if (error) return <div className="container mt-8 text-center" style={{ color: 'var(--error)' }}>{error}</div>;
  if (!challenge) return <div className="container mt-8 text-center">Challenge not found</div>;

  const latestProof = proofs.length > 0 ? proofs[0] : null;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="mb-4">
        <Link to="/dashboard" className="text-muted" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          ← Back to Dashboard
        </Link>
      </div>

      <div className="card mb-8">
        <div className="flex justify-between items-start mb-6">
          <h1 style={{ margin: 0, fontSize: '2rem', maxWidth: '80%' }}>{challenge.title}</h1>
          <StatusBadge status={challenge.status} />
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', marginBottom: 'var(--space-8)', lineHeight: 1.6 }}>
          {challenge.description}
        </p>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: 'var(--space-4)',
          borderTop: '1px solid var(--border)',
          paddingTop: 'var(--space-6)'
        }}>
          <div>
            <div className="form-label">Stake Amount</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>
              {challenge.stakeAmount} ETH
            </div>
          </div>
          
          <div>
            <div className="form-label">Time Remaining</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              <CountdownTimer deadline={challenge.deadline} />
            </div>
            <div className="text-muted" style={{ fontSize: '0.875rem', marginTop: '4px' }}>
              Due: {new Date(challenge.deadline).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {challenge.status === 'active' && (
        <div className="text-center">
          <Link to={`/challenges/${challenge._id}/proof`} className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.125rem' }}>
            Submit Proof of Completion
          </Link>
        </div>
      )}

      {challenge.status === 'verifying' && (
        <div className="card text-center" style={{ borderStyle: 'dashed' }}>
          <h3 className="mb-2" style={{ color: '#3b82f6' }}>Verifying Proof</h3>
          <p className="text-muted mb-0">Our AI is currently analyzing your submission to verify completion.</p>
        </div>
      )}

      {challenge.status === 'ai_verified' && (
        <div className="card text-center" style={{ borderStyle: 'dashed', borderColor: '#a855f7' }}>
          <h3 className="mb-2" style={{ color: '#a855f7' }}>Analysis Ready for Review</h3>
          <p className="text-muted mb-4">The AI has analyzed your proof. Please review the results.</p>
          <Link to={`/challenges/${challenge._id}/result`} className="btn btn-primary" style={{ backgroundColor: '#a855f7', color: '#fff' }}>
            Review Results
          </Link>
        </div>
      )}

      {(challenge.status === 'completed' || challenge.status === 'failed') && latestProof && latestProof.aiAnalysis && (
        <div>
          <h3 className="mb-4">Verification Result</h3>
          <VerificationDisplay analysis={latestProof.aiAnalysis} />
        </div>
      )}
    </div>
  );
};

export default ChallengeDetailPage;
