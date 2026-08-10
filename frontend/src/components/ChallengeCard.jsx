import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import CountdownTimer from './CountdownTimer';
import './ChallengeCard.css';

const ChallengeCard = ({ challenge }) => {
  return (
    <Link to={`/challenges/${challenge._id}`} className="challenge-card">
      <div className="card-header">
        <h3 className="challenge-title">{challenge.title}</h3>
        <StatusBadge status={challenge.status} />
      </div>
      
      <p className="challenge-desc text-muted">
        {challenge.description.length > 80 
          ? challenge.description.substring(0, 80) + '...' 
          : challenge.description}
      </p>
      
      <div className="card-footer">
        <div className="metric">
          <span className="metric-label">Prize Pool</span>
          <span className="metric-value">{challenge.prizePool || challenge.stakeAmount} ETH</span>
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
