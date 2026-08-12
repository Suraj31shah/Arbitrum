import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../services/api';
import ChallengeCard from '../components/ChallengeCard';
import EmptyState from '../components/EmptyState';

const DiscoverPage = () => {
  const { walletAddress } = useOutletContext();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const data = await api.getChallenges('joinable', walletAddress || '');
        setChallenges(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchChallenges();
  }, [walletAddress]);

  if (loading) return <div className="container text-center mt-8">Loading challenges...</div>;
  
  if (error) {
    return (
      <div className="container mt-8">
        <div style={{ color: 'var(--error)' }}>Failed to load discover page: {error}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2>Discover Challenges</h2>
      </div>

      <div className="mb-4">
        <p className="text-muted">Join public challenges, put ETH on the line, and earn your share of the pool.</p>
      </div>

      {challenges.length === 0 ? (
        <EmptyState 
          title="No open challenges" 
          message="There are currently no challenges accepting new participants. Be the first to start one!"
          actionText="Create Challenge"
          actionLink="/challenges/new"
        />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 'var(--space-4)'
        }}>
          {challenges.map(challenge => (
            <ChallengeCard key={challenge._id || challenge.id} challenge={challenge} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DiscoverPage;
