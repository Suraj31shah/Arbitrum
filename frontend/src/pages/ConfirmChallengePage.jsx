import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate, useOutletContext } from 'react-router-dom';
import { api } from '../services/api';
import { ethers } from 'ethers';

const ConfirmChallengePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const context = useOutletContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Use the global wallet address from the layout
  const walletAddress = context?.walletAddress || '';

  const challengeData = location.state?.challengeData;

  if (!challengeData) {
    return <Navigate to="/challenges/new" replace />;
  }

  // We no longer need to fetch current-user here because the navbar handles it 
  // and passes it down via context!

  const handleConfirm = async () => {
    if (!walletAddress) {
      setError('Please connect your MetaMask wallet first.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (Number(challengeData.stakeAmount) > 0) {
        // Force MetaMask to switch to Arbitrum Sepolia (Chain ID: 421614 -> 0x66eee)
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x66eee' }],
          });
        } catch (switchError) {
          // If the network is not added to MetaMask, we could ask to add it, 
          // but assuming they have it since they showed a screenshot of it
          throw new Error('Please switch to Arbitrum Sepolia in MetaMask first.');
        }

        // 1. Process MetaMask Transaction manually to bypass Ethers.js estimateGas bugs on L2s
        const valueHex = ethers.toBeHex(ethers.parseEther(challengeData.stakeAmount.toString()));
        
        const txHash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from: walletAddress,
            to: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
            value: valueHex,
            gas: "0x2DC6C0" // 3,000,000 gas limit explicitly hardcoded to bypass MetaMask estimation failures
          }]
        });
        
        // Wait for the transaction to be mined
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.waitForTransaction(txHash);
      }

      // 2. Save challenge to backend once transaction is confirmed
      const response = await api.createChallenge(challengeData);
      navigate(`/challenges/${response._id}`);
    } catch (err) {
      console.error(err);
      // Differentiate between user rejecting tx vs backend error
      if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
        setError('Transaction was rejected in MetaMask.');
      } else {
        setError(`Transaction failed: ${err.message || 'Unknown error'}`);
      }
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
          <div>
            {!walletAddress ? (
              <div className="text-muted" style={{ fontSize: '0.875rem' }}>
                Please click 'Connect Wallet to Login' in the top right to continue.
              </div>
            ) : (
              <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', fontFamily: 'monospace' }}>
                {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
              </div>
            )}
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
          disabled={loading || !walletAddress}
        >
          {loading ? 'Processing...' : 'Confirm & Stake ETH'}
        </button>
      </div>
    </div>
  );
};

export default ConfirmChallengePage;
