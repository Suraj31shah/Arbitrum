import React, { useState, useEffect } from 'react';
import { useParams, Link, useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { ethers } from 'ethers';
import StatusBadge from '../components/StatusBadge';
import CountdownTimer from '../components/CountdownTimer';
import VerificationDisplay from '../components/VerificationDisplay';

const CONTRACT_ADDRESS = '0xEe4A913659e1d3F8d3bB67302a82B1f2eFAe3281';

const ChallengeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [challenge, setChallenge] = useState(null);
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [claimableAmount, setClaimableAmount] = useState(0);
  const [isClaiming, setIsClaiming] = useState(false);

  const context = useOutletContext();
  const globalWalletAddress = context?.walletAddress?.toLowerCase();
  const currentUser = context?.currentUser;

  useEffect(() => {
    const fetchChallengeData = async () => {
      try {
        const data = await api.getChallengeById(id);
        setChallenge(data);
        
        if (globalWalletAddress) {
          const proofData = await api.getProofsByChallenge(id, globalWalletAddress);
          setProofs(proofData);
          
          if (data.resolvedOnChain) {
            try {
              const provider = new ethers.BrowserProvider(window.ethereum);
              const contract = new ethers.Contract(CONTRACT_ADDRESS, [
                "function getClaimable(string challengeId, address participant) external view returns (uint256)"
              ], provider);
              const amount = await contract.getClaimable(data._id, globalWalletAddress);
              setClaimableAmount(ethers.formatEther(amount));
            } catch (e) {
              console.error("Failed to fetch claimable amount:", e);
            }
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChallengeData();
  }, [id, globalWalletAddress]);

  const handleJoinChallenge = async () => {
    if (!globalWalletAddress) {
      alert("Please connect your wallet to join!");
      return;
    }

    // Check integration requirement
    if (challenge.integrationId && challenge.integrationId !== 'none') {
      const integrationField = challenge.integrationId + 'Id'; // e.g., githubId, todoistId
      if (!currentUser || !currentUser[integrationField]) {
        // Need to authenticate
        localStorage.setItem('pendingJoinChallenge', challenge._id);
        window.location.href = `${api.getApiUrl ? api.getApiUrl() : 'http://localhost:5000'}/api/auth/${challenge.integrationId}`;
        return;
      }
    }

    setLoading(true);
    try {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x66eee' }],
        });
      } catch (e) {
        console.warn('Network switch failed, proceeding anyway', e);
      }
      
      const iface = new ethers.Interface([
        "function joinChallenge(string challengeId, uint256 requiredStake) external payable"
      ]);
      const parsedStake = ethers.parseEther(Number(challenge.stakeAmount).toFixed(18));
      // Use the MongoDB _id as the on-chain challenge identifier (not title!)
      const data = iface.encodeFunctionData("joinChallenge", [challenge._id, parsedStake]);
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      
      if (signerAddress.toLowerCase() !== globalWalletAddress.toLowerCase()) {
        alert(`Mismatch! Your website account is linked to ${globalWalletAddress.substring(0,6)}..., but your active MetaMask account is ${signerAddress.substring(0,6)}.... Please switch to the correct account in MetaMask, or logout and connect the correct wallet.`);
        setLoading(false);
        return;
      }

      const feeData = await provider.getFeeData();
      
      const tx = await signer.sendTransaction({
        to: CONTRACT_ADDRESS,
        data: data,
        value: parsedStake,
        maxFeePerGas: feeData.maxFeePerGas ? (feeData.maxFeePerGas * 15n) / 10n : undefined,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? (feeData.maxPriorityFeePerGas * 15n) / 10n : undefined
      });
      
      await tx.wait();

      const response = await api.joinChallenge(id);
      setChallenge(response);
    } catch (err) {
      console.error(err);
      alert("Failed to join challenge: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = async () => {
    setIsClaiming(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, [
        "function claimReward(string challengeId) external"
      ], signer);
      
      const feeData = await provider.getFeeData();

      const tx = await contract.claimReward(challenge._id, {
        maxFeePerGas: feeData.maxFeePerGas ? (feeData.maxFeePerGas * 15n) / 10n : undefined,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? (feeData.maxPriorityFeePerGas * 15n) / 10n : undefined
      });
      await tx.wait();
      
      setClaimableAmount(0);
      alert("Successfully reclaimed your stake and winnings!");
    } catch (err) {
      console.error(err);
      alert("Failed to claim reward: " + err.message);
    } finally {
      setIsClaiming(false);
    }
  };

  if (loading) return <div className="container text-center mt-8">Loading challenge...</div>;
  if (error) return <div className="container mt-8 text-center" style={{ color: 'var(--error)' }}>{error}</div>;
  if (!challenge) return <div className="container mt-8 text-center">Challenge not found</div>;

  const latestProof = proofs.length > 0 ? proofs[0] : null;
  const myParticipant = challenge.participants?.find(p => p.walletAddress.toLowerCase() === globalWalletAddress);
  const isParticipant = !!myParticipant;
  
  const isOpenToJoin = ['upcoming', 'active'].includes(challenge.status) && new Date(challenge.deadline) > new Date();

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="mb-4 flex justify-between">
        <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', border: 'none', padding: 0 }}>
          ← Back
        </button>
      </div>

      <div className="card mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 style={{ margin: 0, fontSize: '2.5rem' }}>{challenge.title}</h1>
            <div className="text-muted mt-2" style={{ fontSize: '1.25rem' }}>Goal: {challenge.goal}</div>
          </div>
          <StatusBadge status={challenge.status} />
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', marginBottom: 'var(--space-6)', lineHeight: 1.6 }}>
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
            <div className="form-label">Stake per Person</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {challenge.stakeAmount} ETH
            </div>
          </div>
          <div>
            <div className="form-label">Total Pool</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>
              {challenge.poolSize || (challenge.stakeAmount * (challenge.participants?.length || 1))} ETH
            </div>
          </div>
          <div>
            <div className="form-label">Deadline</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              <CountdownTimer deadline={challenge.deadline} />
            </div>
          </div>
        </div>
        
        {challenge.participants && challenge.participants.length > 0 && (
          <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
            <h3 className="mb-4 text-muted" style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Participants ({challenge.participants.length})
            </h3>
            <div className="flex gap-4 flex-wrap">
              {challenge.participants.map(p => {
                let pColor = 'var(--text-secondary)'; // active
                if (p.status === 'completed') pColor = 'var(--success)';
                if (p.status === 'failed') pColor = 'var(--error)';
                if (p.status === 'verifying' || p.status === 'proof_submitted') pColor = 'var(--info)';

                return (
                  <div key={p.walletAddress} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-primary)', padding: '0.5rem 1rem', borderRadius: '99px', border: `1px solid ${pColor}33` }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: pColor }}></div>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      {p.walletAddress.toLowerCase() === globalWalletAddress ? 'You' : (p.walletAddress.substring(0,6) + '...')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {isParticipant && myParticipant && (
        <div className="card mb-8" style={{ background: 'var(--bg-secondary)', borderColor: myParticipant.status === 'failed' ? 'var(--error)' : 'var(--border)' }}>
          <div className="flex justify-between items-center mb-4">
            <h3 style={{ margin: 0 }}>Your Status</h3>
            <StatusBadge status={myParticipant.status} />
          </div>
          
          {myParticipant.status === 'active' && challenge.status === 'active' && (
            <div>
              <p className="text-muted mb-4">You have an active stake in this challenge. Complete the work and submit proof before the deadline to win your stake back and a share of the pool.</p>
              <Link to={`/challenges/${challenge._id}/proof`} className="btn btn-primary btn-full" style={{ padding: '1rem', fontSize: '1.125rem' }}>
                Submit Proof of Completion
              </Link>
            </div>
          )}

          {myParticipant.status === 'active' && challenge.status !== 'active' && (
            <p className="text-muted mb-0">Waiting for challenge to become active.</p>
          )}

          {myParticipant.status === 'verifying' && (
             <div className="text-center p-4">
               <h4 className="text-info mb-2">Verifying Proof</h4>
               <p className="text-muted mb-0">Our AI is analyzing your submission...</p>
             </div>
          )}

          {latestProof && latestProof.aiAnalysis && (myParticipant.status === 'completed' || myParticipant.status === 'failed') && (
            <div className="mt-4">
              <VerificationDisplay analysis={latestProof.aiAnalysis} />
            </div>
          )}

          {myParticipant.status === 'completed' && challenge.resolvedOnChain && Number(claimableAmount) > 0 && (
             <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
               <h4 className="text-success mb-2">You Won!</h4>
               <p className="text-muted mb-4">You have {claimableAmount} ETH available to claim.</p>
               <button onClick={handleClaimReward} disabled={isClaiming} className="btn btn-primary btn-full" style={{ padding: '1rem', fontSize: '1.125rem' }}>
                 {isClaiming ? 'Claiming...' : 'Reclaim Stake & Winnings'}
               </button>
             </div>
          )}

          {myParticipant.status === 'completed' && challenge.resolvedOnChain && Number(claimableAmount) === 0 && (
             <div className="mt-4 pt-4 text-center" style={{ borderTop: '1px solid var(--border)' }}>
               <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✅ Stake & Winnings Claimed</span>
             </div>
          )}
        </div>
      )}

      {!isParticipant && isOpenToJoin && (
        <div className="text-center mt-8">
          <button onClick={handleJoinChallenge} className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.125rem' }}>
            Join Challenge & Stake {challenge.stakeAmount} ETH
          </button>
        </div>
      )}

      {challenge.status === 'failed' && (
        <div className="card mt-8" style={{ borderLeft: '4px solid var(--warning)', backgroundColor: 'var(--warning-bg)' }}>
          <h4 style={{ color: 'var(--warning)', marginBottom: '4px' }}>Challenge Concluded</h4>
          <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>
            {challenge.winnersCount === 0 
              ? `Everyone failed. The entire pool was sent to the demo charity account.` 
              : `${challenge.winnersCount} participants succeeded and split the pool.`}
          </p>
          {challenge.resolveTxHash && (
            <p className="mt-2 mb-0" style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
              On-chain tx: {challenge.resolveTxHash}
            </p>
          )}
        </div>
      )}

      {challenge.status === 'completed' && (
        <div className="card mt-8" style={{ borderLeft: '4px solid var(--success)', backgroundColor: 'var(--success-bg)' }}>
          <h4 style={{ color: 'var(--success)', marginBottom: '4px' }}>Challenge Succeeded</h4>
          <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>
            {challenge.winnersCount} participants successfully completed the challenge and shared the pool.
          </p>
          {challenge.resolveTxHash && (
            <p className="mt-2 mb-0" style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
              On-chain tx: {challenge.resolveTxHash}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ChallengeDetailPage;
