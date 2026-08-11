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

        // Encode the smart contract function call: joinChallenge(string, uint256)
        // For the creator, we will temporarily use the title as the unique ID for the smart contract
        const iface = new ethers.Interface([
          "function joinChallenge(string challengeId, uint256 requiredStake) external payable"
        ]);
        const parsedStake = ethers.parseEther(challengeData.stakeAmount.toString());
        const data = iface.encodeFunctionData("joinChallenge", [challengeData.title, parsedStake]);

        // 1. Process MetaMask Transaction using ethers signer to automatically calculate perfect gas fees for Arbitrum
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        // Fetch current fee data and artificially inflate it to prevent Arbitrum baseFee spikes 
        // while the user is taking time to click "Confirm" in MetaMask.
        const feeData = await provider.getFeeData();
        
        const tx = await signer.sendTransaction({
          to: "0x6d54080Ee9b54150C67b5D74B1A4DBBcD391815c",
          data: data,
          value: parsedStake,
          // If maxFeePerGas exists, pad it by 50% to ensure success
          maxFeePerGas: feeData.maxFeePerGas ? (feeData.maxFeePerGas * 150n) / 100n : undefined,
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || undefined
        });
        
        // Wait for the transaction to be mined
        await tx.wait();
      }

      // 2. Save challenge to backend once transaction is confirmed (or if no stake)
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
