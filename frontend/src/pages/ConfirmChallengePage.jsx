import React, { useState } from 'react';
import { useLocation, useNavigate, Navigate, useOutletContext } from 'react-router-dom';
import { api } from '../services/api';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = '0x6d54080Ee9b54150C67b5D74B1A4DBBcD391815c';

const ConfirmChallengePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const context = useOutletContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const walletAddress = context?.walletAddress || '';
  const challengeData = location.state?.challengeData;

  if (!challengeData) {
    return <Navigate to="/challenges/new" replace />;
  }

  const stakeAmount = challengeData.stakeAmount;

  const handleConfirm = async () => {
    if (!walletAddress) {
      setError('Please connect your MetaMask wallet first.');
      return;
    }

    setLoading(true);
    setError(null);
    let createdChallenge = null;

    try {
      // STEP 1: Create the challenge in backend FIRST to get the MongoDB _id
      createdChallenge = await api.createChallenge(challengeData);
      const challengeId = createdChallenge._id;

      // STEP 2: Send on-chain transaction using the real _id as challengeId
      if (stakeAmount > 0) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x66eee' }],
          });
        } catch (switchError) {
          throw new Error('Please switch to Arbitrum Sepolia in MetaMask first.');
        }

        const iface = new ethers.Interface([
          "function joinChallenge(string challengeId, uint256 requiredStake) external payable"
        ]);
        const parsedStake = ethers.parseEther(Number(stakeAmount).toFixed(18));
        // Use the real MongoDB _id as the on-chain challenge identifier
        const data = iface.encodeFunctionData("joinChallenge", [challengeId, parsedStake]);

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        const tx = await signer.sendTransaction({
          to: CONTRACT_ADDRESS,
          data: data,
          value: parsedStake
        });
        
        await tx.wait();
      }

      navigate(`/challenges/${createdChallenge._id}`);
      
    } catch (err) {
      console.error(err);
      if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
        setError('Transaction was rejected in MetaMask. Your challenge was created but the on-chain stake was not placed. You can try staking again from the challenge detail page.');
      } else {
        setError(`Failed: ${err.message || 'Unknown error'}`);
      }
      // If we created a challenge but on-chain failed, still navigate to it
      if (createdChallenge) {
        setTimeout(() => navigate(`/challenges/${createdChallenge._id}`), 3000);
      }
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <h1 className="mb-2">Confirm Commitment</h1>
      <p className="text-muted mb-8">Review your stakes and the rules of the game.</p>

      {error && (
        <div style={{ color: 'var(--error)', backgroundColor: 'var(--error-bg)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
          {error}
        </div>
      )}

      <div className="card mb-6">
        <div className="flex justify-between items-center mb-6 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <div className="text-muted" style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Stake</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent)', lineHeight: 1 }}>
              {stakeAmount} ETH
            </div>
          </div>
          <div>
            {!walletAddress ? (
              <div className="text-muted" style={{ fontSize: '0.875rem' }}>
                Please connect your wallet.
              </div>
            ) : (
              <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', fontFamily: 'monospace' }}>
                {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
              </div>
            )}
          </div>
        </div>

        <div className="mb-6">
          <div className="form-label">Goal</div>
          <div style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>{challengeData.goal}</div>
        </div>

        <div className="mb-6">
          <div className="form-label">Title</div>
          <div style={{ fontSize: '1.1rem' }}>{challengeData.title}</div>
        </div>

        <div className="mb-6">
          <div className="form-label">Rules & Details</div>
          <div style={{ color: 'var(--text-secondary)' }}>{challengeData.description}</div>
        </div>

        <div className="flex gap-8">
          <div>
            <div className="form-label">Joining Window</div>
            <div style={{ fontWeight: '500' }}>
              Open until the deadline
            </div>
          </div>
          <div>
            <div className="form-label">Deadline</div>
            <div style={{ fontWeight: '500', color: 'var(--warning)' }}>{new Date(challengeData.deadline).toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="card mb-8" style={{ backgroundColor: 'var(--bg-secondary)', borderLeft: '4px solid var(--info)' }}>
        <h3 className="mb-4 text-info">How Outcomes Work</h3>
        <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li><strong>If you succeed:</strong> You get your {stakeAmount} ETH back, plus an equal share of the ETH from anyone who fails.</li>
          <li><strong>If you fail:</strong> You lose your {stakeAmount} ETH. It goes to the participants who succeeded.</li>
          <li><strong>If everyone fails:</strong> The entire pool is sent to the demo charity account. Nobody wins.</li>
        </ul>
      </div>

      <div className="flex gap-4">
        <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ flex: 1 }} disabled={loading}>
          Back to Edit
        </button>
        <button onClick={handleConfirm} className="btn btn-primary" style={{ flex: 2, padding: '1rem', fontSize: '1.1rem' }} disabled={loading || !walletAddress || stakeAmount === 0}>
          {loading ? 'Processing Transaction...' : 'Confirm & Stake ETH'}
        </button>
      </div>
    </div>
  );
};

export default ConfirmChallengePage;
