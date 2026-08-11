import React, { useState, useEffect } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import { api, getApiUrl } from '../services/api';
import { ethers } from 'ethers';
import StatusBadge from '../components/StatusBadge';
import CountdownTimer from '../components/CountdownTimer';
import VerificationDisplay from '../components/VerificationDisplay';

const ChallengeDetailPage = () => {
  const { id } = useParams();
  const [challenge, setChallenge] = useState(null);
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const context = useOutletContext();
  const globalWalletAddress = context?.walletAddress?.toLowerCase();

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

  const handleJoinChallenge = async () => {
    if (!globalWalletAddress) {
      alert("Please connect your wallet to join!");
      return;
    }
    setLoading(true);
    try {
      // 1. Send Transaction
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x66eee' }],
        });
      } catch (e) {
        console.warn('Network switch failed, proceeding anyway', e);
      }
      
      // Encode the smart contract function call: joinChallenge(string, uint256)
      const iface = new ethers.Interface([
        "function joinChallenge(string challengeId, uint256 requiredStake) external payable"
      ]);
      const parsedStake = ethers.parseEther(challenge.stakeAmount.toString());
      const data = iface.encodeFunctionData("joinChallenge", [challenge.title, parsedStake]);
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const tx = await signer.sendTransaction({
        to: "0x6d54080Ee9b54150C67b5D74B1A4DBBcD391815c",
        data: data,
        value: parsedStake
      });
      
      await tx.wait();

      // 2. Join in Backend
      const response = await fetch(`${getApiUrl()}/api/challenges/${id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error("Failed to join on server");
      
      const updatedChallenge = await response.json();
      setChallenge(updatedChallenge);
    } catch (err) {
      console.error(err);
      alert("Failed to join challenge: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container text-center mt-8">Loading challenge...</div>;
  if (error) return <div className="container mt-8 text-center" style={{ color: 'var(--error)' }}>{error}</div>;
  if (!challenge) return <div className="container mt-8 text-center">Challenge not found</div>;

  const latestProof = proofs.length > 0 ? proofs[0] : null;
  const isParticipant = challenge.participants?.some(p => p.walletAddress.toLowerCase() === globalWalletAddress);

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
          gridTemplateColumns: '1fr 1fr 1fr', 
          gap: 'var(--space-4)',
          borderTop: '1px solid var(--border)',
          paddingTop: 'var(--space-6)'
        }}>
          <div>
            <div className="form-label">Entry Stake</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {challenge.stakeAmount} ETH
            </div>
          </div>
          <div>
            <div className="form-label">Total Prize Pool</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>
              {challenge.prizePool || challenge.stakeAmount} ETH
            </div>
          </div>
          <div>
            <div className="form-label">Time Remaining</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              <CountdownTimer deadline={challenge.deadline} />
            </div>
          </div>
        </div>
        
        {challenge.participants && challenge.participants.length > 0 && (
          <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
            <h3 className="mb-4 text-muted" style={{ fontSize: '1rem' }}>Participants ({challenge.participants.length})</h3>
            <div className="flex gap-4 flex-wrap">
              {challenge.participants.map(p => (
                <div key={p.user._id || p.walletAddress} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-primary)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.status === 'completed' ? 'var(--success)' : p.status === 'failed' ? 'var(--error)' : 'var(--accent)' }}></div>
                  <span style={{ fontFamily: 'monospace' }}>
                    {p.user?.username || (p.walletAddress.substring(0,6) + '...')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {challenge.status === 'active' && (
        <div className="text-center">
          {isParticipant ? (
            <Link to={`/challenges/${challenge._id}/proof`} className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.125rem' }}>
              Submit Proof of Completion
            </Link>
          ) : (
            <button onClick={handleJoinChallenge} className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.125rem', backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }}>
              Join Challenge & Stake {challenge.stakeAmount} ETH
            </button>
          )}
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
