import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import CountdownTimer from './CountdownTimer';
import './ChallengeCard.css';

const ChallengeCard = ({ challenge }) => {
  const isJoinable = challenge.status === 'upcoming' || challenge.status === 'active';
  const poolSize = challenge.poolSize || (challenge.stakeAmount * (challenge.participants?.length || 1));

  return (
    <Link to={`/challenges/${challenge._id || challenge.id}`} className="challenge-card">
      <div className="card-header">
        <h3 className="challenge-title">{challenge.title}</h3>
        <StatusBadge status={challenge.status} />
      </div>
      
      <p className="challenge-desc text-muted">
        {(challenge.goal || challenge.description || '').length > 80 
          ? (challenge.goal || challenge.description || '').substring(0, 80) + '...' 
          : (challenge.goal || challenge.description || '')}
      </p>
      
      {isJoinable && (
        <div style={{ fontSize: '0.75rem', color: 'var(--info)', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--info)' }} className="animate-pulse"></span>
          Open to join until deadline
        </div>
      )}

      <div className="card-footer">
        <div className="metric">
          <span className="metric-label">Pool</span>
          <span className="metric-value">{poolSize} ETH</span>
        </div>
        <div className="metric">
          <span className="metric-label">Participants</span>
          <span className="metric-value">{challenge.participants?.length || 1}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Deadline</span>
          <span className="metric-value">
            <CountdownTimer deadline={challenge.deadline} compact={true} />
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ChallengeCard;
