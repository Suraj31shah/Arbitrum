import { Link } from 'react-router-dom';
import { Target, GitPullRequest, FileText, CheckSquare, Users, Calendar, CircleDot } from 'lucide-react';
import StatusBadge from './StatusBadge';
import CountdownTimer from './CountdownTimer';
import './ChallengeCard.css';

const ChallengeCard = ({ challenge = {}, variant = 'default' }) => {
  const challengeId = challenge?._id || challenge?.id || 'sample';
  const stakeAmountEth = challenge?.prizePool ?? challenge?.stakeAmount ?? 0;
  const stakeAmountUSD = (stakeAmountEth * 2817).toFixed(2);
  const participantsCount = Array.isArray(challenge?.participants) ? challenge.participants.length : 1;

  // Visual icon & category tags based on title/description
  let categoryIcon = <Target size={18} />;
  let integrationTag = 'Google Fit';
  let categoryTag = 'Health & Fitness';

  const titleText = String(challenge?.title || '');
  const descText = String(challenge?.description || '');
  const titleLower = (titleText + ' ' + descText).toLowerCase();
  const creator = typeof challenge?.creator === 'object' ? challenge.creator : null;
  const creatorName = creator?.username || creator?.walletAddress || (typeof challenge?.creator === 'string' ? challenge.creator : 'Community member');
  const creatorLabel = creatorName.length > 12 ? `${creatorName.slice(0, 6)}...${creatorName.slice(-4)}` : creatorName;
  const isOngoing = challenge?.status === 'active';
  const isFailed = challenge?.status === 'failed' || challenge?.status === 'expired';

  if (titleLower.includes('code') || titleLower.includes('github') || titleLower.includes('pr') || titleLower.includes('git')) {
    categoryIcon = <GitPullRequest size={18} />;
    integrationTag = 'GitHub';
    categoryTag = 'Developer';
  } else if (titleLower.includes('notion') || titleLower.includes('write') || titleLower.includes('read') || titleLower.includes('study')) {
    categoryIcon = <FileText size={18} />;
    integrationTag = 'Notion';
    categoryTag = 'Productivity';
  } else if (titleLower.includes('task') || titleLower.includes('todo')) {
    categoryIcon = <CheckSquare size={18} />;
    integrationTag = 'Todoist';
    categoryTag = 'Tasks';
  }

  const displayCategory = challenge?.category || categoryTag;

  // Calculate visual progress percentage
  let progressPct = 0;
  if (challenge?.status === 'completed') progressPct = 100;
  else if (challenge?.status === 'active') progressPct = 50;
  else if (challenge?.status === 'expired' || challenge?.status === 'failed') progressPct = 0;

  return (
    <Link to={`/challenges/${challengeId}`} className={`challenge-card ${variant === 'discover' ? `discover-challenge-card ${isOngoing ? 'is-ongoing' : ''} ${isFailed ? 'is-failed' : ''}` : ''}`}>
      <div className="card-top-row">
        <div className="card-title-group">
          <div className="card-icon-circle">
            {categoryIcon}
          </div>
          <div>
            <div className="title-status-inline">
              <h3 className="challenge-title">{challenge.title}</h3>
              <StatusBadge status={challenge.status} />
            </div>
            <p className="challenge-subtitle">
              {variant === 'discover'
                ? `by ${creatorLabel}`
                : challenge.description && challenge.description.length > 40
                  ? challenge.description.substring(0, 40) + '...'
                  : challenge.description || 'Commitment Goal'}
            </p>
          </div>
        </div>

        <div className="card-stake-block">
          <div className="stake-eth-text">{stakeAmountEth} ETH</div>
          <div className="stake-usd-text">≈ ${stakeAmountUSD}</div>
        </div>
      </div>

      <div className="card-tags-row">
        <span className="tag-pill integration-pill">{integrationTag}</span>
        <span className="tag-pill category-pill">{displayCategory}</span>
      </div>

      <div className="card-metrics-grid">
        <div className="metric-col">
          <span className="metric-label">PARTICIPANTS</span>
          <span className="metric-val flex items-center gap-1">
            <Users size={14} className="metric-icon" /> {participantsCount}
          </span>
        </div>
        <div className="metric-col">
          <span className="metric-label">DEADLINE</span>
          <span className="metric-val flex items-center gap-1">
            <Calendar size={14} className="metric-icon" /> <CountdownTimer deadline={challenge.deadline} compact={true} />
          </span>
        </div>
        <div className="metric-col">
          <span className="metric-label">{variant === 'discover' ? 'PRIZE POOL' : 'PROGRESS'}</span>
          <span className="metric-val flex items-center gap-1">
            {variant === 'discover' ? `${challenge?.prizePool ?? challenge?.poolSize ?? stakeAmountEth} ETH` : <><CircleDot size={14} className="metric-icon" /> {progressPct}%</>}
          </span>
        </div>
      </div>

      {variant === 'discover' && isOngoing && <span className="discover-card-action">View Challenge <span aria-hidden="true">→</span></span>}

      <div className="card-progress-track">
        <div 
          className={`card-progress-fill ${challenge.status === 'expired' || challenge.status === 'failed' ? 'fill-failed' : ''}`} 
          style={{ width: `${progressPct}%` }}
        ></div>
      </div>
    </Link>
  );
};

export default ChallengeCard;
