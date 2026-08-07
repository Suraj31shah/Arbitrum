import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import VerificationDisplay from '../components/VerificationDisplay';

const VerificationResultPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const [proof, setProof] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State for user action result
  const [actionResult, setActionResult] = useState(null);

  const proofId = location.state?.proofId;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const challengeData = await api.getChallengeById(id);
        setChallenge(challengeData);

        if (proofId) {
          const data = await api.getProofById(proofId);
          setProof(data);
        } else {
          const proofs = await api.getProofsByChallenge(id);
          if (proofs.length > 0) {
            setProof(proofs[0]);
          } else {
            throw new Error("No proof found for this challenge.");
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, proofId]);

  const handleAcceptAI = async () => {
    setActionLoading(true);
    try {
      await api.updateChallengeStatus(id, 'active');
      setChallenge(prev => ({ ...prev, status: 'active' }));
      setActionResult('accepted');
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisputeAI = async () => {
    setActionLoading(true);
    try {
      await api.updateChallengeStatus(id, 'completed');
      setChallenge(prev => ({ ...prev, status: 'completed' }));
      setActionResult('disputed');
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="container text-center mt-8">Loading result...</div>;
  if (error) return <div className="container mt-8 text-center" style={{ color: 'var(--error)' }}>{error}</div>;
  if (!proof || !proof.aiAnalysis) return <div className="container mt-8 text-center">Analysis data not found</div>;

  // Render the post-decision screens if an action was taken or if the challenge is already handled
  if (actionResult === 'accepted' || (challenge.status === 'active' && proof)) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: 'var(--space-8)', border: '1px solid var(--accent)' }}>
          <h2 style={{ color: 'var(--accent)', marginBottom: 'var(--space-6)' }}>Greatttt!</h2>
          <p style={{ fontSize: '1.125rem', marginBottom: 'var(--space-4)' }}>
            Realizing the work you have to do is the best decision.
          </p>
          <p className="text-muted" style={{ marginBottom: 'var(--space-8)' }}>
            You can also add notifications so you don't forget!
          </p>
          <Link to={`/challenges/${id}`} className="btn btn-primary">
            Return to Challenge
          </Link>
        </div>
      </div>
    );
  }

  if (actionResult === 'disputed' || challenge.status === 'completed') {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: 'var(--space-8)', border: '1px solid var(--warning)' }}>
          <p style={{ fontSize: '1.125rem', marginBottom: 'var(--space-6)' }}>
            The AI score was <strong>{proof.aiAnalysis.confidence}%</strong>, and you yourself assured that you did that work.
          </p>
          <p className="text-muted" style={{ marginBottom: 'var(--space-4)' }}>
            Remember that you yourself created and accepted your commitment in this site so our responsibility is to keep you accountable. You have to be honest.
          </p>
          <p style={{ color: 'var(--warning)', fontWeight: 'bold', marginBottom: 'var(--space-8)' }}>
            Please be honest to yourself otherwise don't waste your and your site's time.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to={`/challenges/${id}`} className="btn btn-secondary">
              View Challenge
            </Link>
            <a href="mailto:feedback@commitx.xyz" className="btn" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
              Send Feedback (If AI is wrong)
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Interactive Verification Screen (ai_verified state)
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="text-center mb-8">
        <h1 className="mb-2">Analysis Complete</h1>
        <p className="text-muted">The AI has finished reviewing your submission.</p>
      </div>

      <VerificationDisplay analysis={proof.aiAnalysis} />

      {challenge.status === 'ai_verified' && (
        <div className="card mt-8" style={{ border: '1px solid var(--border-focus)', backgroundColor: 'var(--bg-secondary)' }}>
          <h3 className="mb-4 text-center">What would you like to do?</h3>
          
          <div className="flex flex-col gap-4">
            <button 
              onClick={handleAcceptAI} 
              disabled={actionLoading}
              className="btn" 
              style={{ padding: '1rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--accent)', color: 'var(--text-primary)', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span>Yeah I will complete it and come back before deadline</span>
              <span style={{ color: 'var(--accent)', fontSize: '1.25rem' }}>→</span>
            </button>
            
            <button 
              onClick={handleDisputeAI}
              disabled={actionLoading}
              className="btn" 
              style={{ padding: '1rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--warning)', color: 'var(--text-primary)', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span>Nahh the AI analysis is wrong and I assure you that I completed the work</span>
              <span style={{ color: 'var(--warning)', fontSize: '1.25rem' }}>→</span>
            </button>
          </div>
        </div>
      )}

      {challenge.status !== 'ai_verified' && (
        <div className="mt-8 text-center">
          <Link to={`/challenges/${id}`} className="btn btn-secondary mr-4" style={{ marginRight: '1rem' }}>
            View Challenge
          </Link>
          <Link to="/dashboard" className="btn btn-primary">
            Return to Dashboard
          </Link>
        </div>
      )}
    </div>
  );
};

export default VerificationResultPage;
