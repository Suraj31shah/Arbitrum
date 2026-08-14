import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search } from 'lucide-react';
import { api } from '../services/api';
import ChallengeCard from '../components/ChallengeCard';
import EmptyState from '../components/EmptyState';
import { Crewmate } from '../components/Crewmates';
import './DiscoverPage.css';

const STATUS_FILTERS = [
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'completed', label: 'Completed' },
  { id: 'all', label: 'All' },
  { id: 'failed', label: 'Failed' }
];

const matchesStatusFilter = (challenge, filter) => {
  const status = String(challenge?.status || '').toLowerCase();

  if (filter === 'ongoing') return status === 'active';
  if (filter === 'completed') return status === 'completed';
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
  completed: {
    title: 'No completed challenges',
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
  const [searchQuery, setSearchQuery] = useState('');

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
    () => challenges.filter(challenge => {
      if (!matchesStatusFilter(challenge, selectedStatus)) return false;

      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;

      const creator = challenge.creator;
      const creatorText = typeof creator === 'object'
        ? [creator?.username, creator?.walletAddress, creator?.profileUrl].filter(Boolean).join(' ')
        : creator;
      const searchableText = [challenge.title, challenge.description, challenge.category, creatorText]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(query);
    }),
    [challenges, selectedStatus, searchQuery]
  );

  const activeChallengesCount = statusCounts.ongoing || 0;
  const participantCount = challenges.reduce(
    (total, challenge) => total + (Array.isArray(challenge.participants) ? challenge.participants.length : 0),
    0
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
      <div className="discover-intro">
        <div className="discover-intro-text">
          <p className="text-muted">Join public challenges, put ETH on the line, and earn your share of the pool.</p>
          {challenges.length > 0 && (
            <p className="discover-community-summary">
              {activeChallengesCount} active {activeChallengesCount === 1 ? 'challenge' : 'challenges'} · {participantCount} {participantCount === 1 ? 'participant' : 'participants'}
            </p>
          )}
        </div>
        <div className="discover-companion-wrapper" title="CommitX Explorer Companion">
          <Crewmate color="#0ea5e9" size={52} className="discover-companion-astronaut" />
        </div>
      </div>

      <div className="discover-controls">
        <label className="discover-search" aria-label="Search challenges">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            placeholder="Search challenges..."
          />
        </label>

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
      </div>

      {visibleChallenges.length === 0 ? (
        <EmptyState 
          title={emptyStateCopy[selectedStatus].title}
          message={searchQuery ? 'Try a different search or explore all challenges.' : emptyStateCopy[selectedStatus].message}
          actionText={selectedStatus === 'all' ? 'Create Challenge' : 'View All Challenges'}
          actionLink={selectedStatus === 'all' ? '/challenges/new' : undefined}
          onAction={selectedStatus === 'all' ? undefined : () => { setSelectedStatus('all'); setSearchQuery(''); }}
          illustration={<Crewmate color="#0ea5e9" size={56} className="empty-state-astronaut" />}
        />
      ) : (
        <div className="discover-challenges-grid" key={selectedStatus}>
          {visibleChallenges.map((challenge, idx) => (
            <div 
              key={challenge._id || challenge.id} 
              className="discover-card-wrapper" 
              style={{ '--card-index': idx }}
            >
              <ChallengeCard challenge={challenge} variant="discover" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DiscoverPage;
