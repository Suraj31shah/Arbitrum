import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../services/api';
import ChallengeCard from '../components/ChallengeCard';
import EmptyState from '../components/EmptyState';
import './DiscoverPage.css';

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'finished', label: 'Finished' },
  { id: 'failed', label: 'Failed' }
];

const matchesStatusFilter = (challenge, filter) => {
  const status = String(challenge?.status || '').toLowerCase();

  if (filter === 'ongoing') return status === 'active';
  if (filter === 'finished') return status === 'completed';
  if (filter === 'failed') return status === 'failed' || status === 'expired';
  return true;
};

const emptyStateCopy = {
  all: {
    title: 'No community challenges',
    message: 'There are no public challenges to explore right now.'
  },
  ongoing: {
    title: 'No ongoing challenges',
    message: "There aren't any active community challenges right now."
  },
  finished: {
    title: 'No finished challenges',
    message: 'No community challenges have been completed yet.'
  },
  failed: {
    title: 'No failed challenges',
    message: 'No failed or expired community challenges to show.'
  }
};

const DiscoverPage = () => {
  const { walletAddress } = useOutletContext();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('ongoing');

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

  const statusCounts = useMemo(() => STATUS_FILTERS.reduce((counts, filter) => {
    counts[filter.id] = challenges.filter(challenge => matchesStatusFilter(challenge, filter.id)).length;
    return counts;
  }, {}), [challenges]);

  const visibleChallenges = useMemo(
    () => challenges.filter(challenge => matchesStatusFilter(challenge, selectedStatus)),
    [challenges, selectedStatus]
  );

  if (loading) return <div className="container text-center mt-8">Loading challenges...</div>;
  
  if (error) {
    return (
      <div className="container mt-8">
        <div style={{ color: 'var(--error)' }}>Failed to load discover page: {error}</div>
      </div>
    );
  }

  return (
    <div className="discover-page">
      <div className="flex justify-between items-center mb-8">
        <h2>Discover Challenges</h2>
      </div>

      <div className="mb-4">
        <p className="text-muted">Join public challenges, put ETH on the line, and earn your share of the pool.</p>
      </div>

      <div className="status-filter-bar" aria-label="Filter challenges by status">
        {STATUS_FILTERS.map(filter => (
          <button
            key={filter.id}
            type="button"
            className={`status-filter-button ${selectedStatus === filter.id ? 'active' : ''}`}
            onClick={() => setSelectedStatus(filter.id)}
            aria-pressed={selectedStatus === filter.id}
          >
            {filter.label} <span className="status-filter-count">({statusCounts[filter.id] || 0})</span>
          </button>
        ))}
      </div>

      {visibleChallenges.length === 0 ? (
        <EmptyState 
          title={emptyStateCopy[selectedStatus].title}
          message={emptyStateCopy[selectedStatus].message}
          actionText={selectedStatus === 'all' ? 'Create Challenge' : 'View All Challenges'}
          actionLink={selectedStatus === 'all' ? '/challenges/new' : undefined}
          onAction={selectedStatus === 'all' ? undefined : () => setSelectedStatus('all')}
        />
      ) : (
        <div className="discover-challenges-grid" key={selectedStatus}>
          {visibleChallenges.map(challenge => (
            <ChallengeCard key={challenge._id || challenge.id} challenge={challenge} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DiscoverPage;
