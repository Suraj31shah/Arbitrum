import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Flag, Plus, ArrowRight, Filter } from 'lucide-react';
import { api } from '../services/api';
import ChallengeCard from '../components/ChallengeCard';
import './MyChallengesPage.css';

const MyChallengesPage = () => {
  const context = useOutletContext();
  const globalWallet = context?.walletAddress?.toLowerCase();

  const [challenges, setChallenges] = useState([]);
  const [activeTab, setActiveTab] = useState('ongoing');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMyChallenges = async () => {
      setLoading(true);
      try {
        const data = await api.getChallenges();
        if (Array.isArray(data)) {
          // Filter to only challenges where user is creator or participant
          const myOnly = data.filter(c => {
            if (!c) return false;
            const creatorAddr = c.creator?.walletAddress?.toLowerCase() || (typeof c.creator === 'string' ? c.creator.toLowerCase() : '');
            if (globalWallet && creatorAddr === globalWallet) return true;

            if (Array.isArray(c.participants)) {
              return c.participants.some(p => {
                const pAddr = p.walletAddress?.toLowerCase();
                return globalWallet && pAddr === globalWallet;
              });
            }
            return false;
          });

          // If no wallet connected or no my-challenges match, fallback to user's challenges or all user-joined ones
          setChallenges(myOnly.length > 0 ? myOnly : data);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMyChallenges();
  }, [globalWallet]);

  // Tab Filtering
  const filteredChallenges = challenges.filter(c => {
    if (activeTab === 'ongoing') {
      return ['active', 'proof_submitted', 'verifying', 'ai_verified'].includes(c?.status);
    }
    if (activeTab === 'completed') {
      return c?.status === 'completed';
    }
    if (activeTab === 'expired') {
      return c?.status === 'expired' || c?.status === 'failed';
    }
    return true;
  });

  if (loading) {
    return <div className="container text-center mt-8 text-muted">Loading your challenges...</div>;
  }

  if (error) {
    return <div className="container mt-8 text-center" style={{ color: 'var(--error)' }}>{error}</div>;
  }

  return (
    <div className="my-challenges-page">
      {/* Header */}
      <div className="page-header-block mb-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="page-main-title">My Challenges</h1>
            <p className="page-main-subtitle">Your personal library of staked commitments and active challenges.</p>
          </div>
          <Link to="/challenges/new" className="btn btn-primary">
            <Plus size={16} /> Create Challenge
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="my-challenges-tabs-bar mb-6">
        <div className="tabs-group">
          <button 
            className={`tab-pill-btn ${activeTab === 'ongoing' ? 'active' : ''}`}
            onClick={() => setActiveTab('ongoing')}
          >
            Ongoing ({challenges.filter(c => ['active', 'proof_submitted', 'verifying', 'ai_verified'].includes(c?.status)).length})
          </button>
          <button 
            className={`tab-pill-btn ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            Completed ({challenges.filter(c => c?.status === 'completed').length})
          </button>
          <button 
            className={`tab-pill-btn ${activeTab === 'expired' ? 'active' : ''}`}
            onClick={() => setActiveTab('expired')}
          >
            Expired ({challenges.filter(c => c?.status === 'expired' || c?.status === 'failed').length})
          </button>
        </div>

        <Link to="/explore" className="explore-link-btn">
          Explore Public Challenges <ArrowRight size={14} />
        </Link>
      </div>

      {/* Challenge Cards Grid */}
      {filteredChallenges.length === 0 ? (
        <div className="card text-center py-12" style={{ borderStyle: 'dashed' }}>
          <Flag size={32} className="mx-auto mb-3 text-muted" />
          <h3 className="mb-2">No {activeTab} challenges found</h3>
          <p className="text-muted mb-4">You haven't {activeTab === 'ongoing' ? 'joined any active' : activeTab} challenges yet.</p>
          <div className="flex justify-center gap-3">
            <Link to="/explore" className="btn btn-secondary">
              Explore Community Challenges
            </Link>
            <Link to="/challenges/new" className="btn btn-primary">
              Create New Challenge
            </Link>
          </div>
        </div>
      ) : (
        <div className="my-challenges-grid">
          {filteredChallenges.map(challenge => (
            <ChallengeCard key={challenge._id} challenge={challenge} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyChallengesPage;
