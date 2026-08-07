import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import StakeSummary from '../components/StakeSummary';
import ChallengeCard from '../components/ChallengeCard';
import EmptyState from '../components/EmptyState';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, challengesData] = await Promise.all([
          api.getDashboardStats(),
          api.getChallenges()
        ]);
        setStats(statsData);
        setChallenges(challengesData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="container text-center mt-8">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="container mt-8">
        <div style={{ color: 'var(--error)' }}>Failed to load dashboard: {error}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2>Your Dashboard</h2>
      </div>

      <StakeSummary stats={stats} />

      <div className="mb-4">
        <h3>Active Commitments</h3>
      </div>

      {challenges.length === 0 ? (
        <EmptyState 
          title="No commitments yet" 
          message="It's time to put something on the line. Create your first challenge and stake some ETH."
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
            <ChallengeCard key={challenge._id} challenge={challenge} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
