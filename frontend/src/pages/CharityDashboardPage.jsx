import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ethers } from 'ethers';
import { api } from '../services/api';

const CONTRACT_ADDRESS = '0xEe4A913659e1d3F8d3bB67302a82B1f2eFAe3281';
const CHARITY_WALLET_ADDRESS = '0x0302CDEF4ab13Ec1b17110110d1A4592B8866b72';

const CharityDashboardPage = () => {
  const { walletAddress } = useOutletContext();
  const [failedChallenges, setFailedChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimingIds, setClaimingIds] = useState({});

  useEffect(() => {
    const fetchCharityData = async () => {
      try {
        // Only charity wallet should view this
        if (walletAddress?.toLowerCase() !== CHARITY_WALLET_ADDRESS.toLowerCase()) {
          setLoading(false);
          return;
        }

        const challenges = await api.getChallenges();
        
        // Find all resolved and failed challenges
        const failed = challenges.filter(c => c.resolvedOnChain && c.status === 'failed');
        
        // Check on-chain claimable amounts for each failed challenge
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, [
          "function getClaimable(string challengeId, address participant) external view returns (uint256)"
        ], provider);

        const challengesWithClaims = await Promise.all(failed.map(async (challenge) => {
          try {
            const claimableWei = await contract.getClaimable(challenge._id, CHARITY_WALLET_ADDRESS);
            return {
              ...challenge,
              claimableWei: claimableWei,
              claimableEth: ethers.formatEther(claimableWei)
            };
          } catch (e) {
            console.error('Error fetching claimable for', challenge._id, e);
            return null;
          }
        }));

        setFailedChallenges(challengesWithClaims.filter(c => c && c.claimableWei > 0n));
      } catch (err) {
        console.error("Failed to load charity dashboard", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCharityData();
  }, [walletAddress]);

  const handleClaim = async (challenge) => {
    setClaimingIds(prev => ({ ...prev, [challenge._id]: true }));
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const signerAddress = await signer.getAddress();
      if (signerAddress.toLowerCase() !== CHARITY_WALLET_ADDRESS.toLowerCase()) {
        throw new Error("Active MetaMask account is not the Charity wallet.");
      }

      const contract = new ethers.Contract(CONTRACT_ADDRESS, [
        "function claimReward(string challengeId) external"
      ], signer);

      const feeData = await provider.getFeeData();
      
      const tx = await contract.claimReward(challenge._id, {
        maxFeePerGas: feeData.maxFeePerGas ? (feeData.maxFeePerGas * 15n) / 10n : undefined,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? (feeData.maxPriorityFeePerGas * 15n) / 10n : undefined
      });
      await tx.wait();
      
      alert(`Successfully collected ${challenge.claimableEth} ETH from ${challenge.title}!`);
      
      // Remove from list
      setFailedChallenges(prev => prev.filter(c => c._id !== challenge._id));
    } catch (err) {
      console.error(err);
      alert("Failed to collect funds: " + (err.message || err));
    } finally {
      setClaimingIds(prev => ({ ...prev, [challenge._id]: false }));
    }
  };

  if (walletAddress?.toLowerCase() !== CHARITY_WALLET_ADDRESS.toLowerCase()) {
    return <div className="container mt-8 text-center text-error">Access Denied. You are not logged in with the Charity wallet.</div>;
  }

  if (loading) {
    return <div className="container mt-8 text-center">Loading charity data...</div>;
  }

  const totalCollectedEth = failedChallenges.reduce((sum, c) => sum + Number(c.claimableEth), 0);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="mb-8 text-center">
        <h1 style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}>Charity Dashboard</h1>
        <p className="text-muted">Manage and collect funds from failed challenges.</p>
      </div>

      <div className="card mb-8 text-center" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--accent)' }}>
        <h3 className="mb-2">Total Stake Available to Collect</h3>
        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>
          {totalCollectedEth.toFixed(5)} ETH
        </div>
        <p className="text-muted mt-2">Across {failedChallenges.length} challenges</p>
      </div>

      <h2 className="mb-4">Available Challenges ({failedChallenges.length})</h2>
      
      {failedChallenges.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-muted mb-0">No failed challenges available to collect right now.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {failedChallenges.map(challenge => (
            <div key={challenge._id} className="card flex justify-between items-center" style={{ padding: '1.5rem' }}>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0' }}>{challenge.title}</h3>
                <div className="text-muted" style={{ fontSize: '0.875rem' }}>
                  {challenge.participants.length} Participant(s) Failed
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '2px' }}>Stake Available</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                    {challenge.claimableEth} ETH
                  </div>
                </div>
                
                <button 
                  className="btn btn-primary" 
                  onClick={() => handleClaim(challenge)}
                  disabled={claimingIds[challenge._id]}
                >
                  {claimingIds[challenge._id] ? 'Collecting...' : 'Collect'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CharityDashboardPage;
