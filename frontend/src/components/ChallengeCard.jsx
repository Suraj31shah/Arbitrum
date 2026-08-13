import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, GitPullRequest, FileText, CheckSquare, Users, Calendar, CircleDot } from 'lucide-react';
import StatusBadge from './StatusBadge';
import CountdownTimer from './CountdownTimer';
import './ChallengeCard.css';

const ChallengeCard = ({ challenge = {} }) => {
  const challengeId = challenge?._id || challenge?.id || 'sample';
  const stakeAmountEth = challenge?.prizePool ?? challenge?.stakeAmount ?? 0;
  const stakeAmountUSD = (stakeAmountEth * 2817).toFixed(2);
  const participantsCount = Array.isArray(challenge?.participants) ? challenge.participants.length : 1;

  // Visual icon & category tags based on title/description
  let categoryIcon = <Activity size={18} />;
  let iconBgClass = 'icon-green';
  let integrationTag = 'Google Fit';
  let categoryTag = 'Health & Fitness';

  const titleText = String(challenge?.title || '');
  const descText = String(challenge?.description || '');
  const titleLower = (titleText + ' ' + descText).toLowerCase();

  if (titleLower.includes('code') || titleLower.includes('github') || titleLower.includes('pr') || titleLower.includes('git')) {
    categoryIcon = <GitPullRequest size={18} />;
    iconBgClass = 'icon-blue';
    integrationTag = 'GitHub';
    categoryTag = 'Developer';
  } else if (titleLower.includes('notion') || titleLower.includes('write') || titleLower.includes('read') || titleLower.includes('study')) {
    categoryIcon = <FileText size={18} />;
    iconBgClass = 'icon-purple';
    integrationTag = 'Notion';
    categoryTag = 'Productivity';
  } else if (titleLower.includes('task') || titleLower.includes('todo')) {
    categoryIcon = <CheckSquare size={18} />;
    iconBgClass = 'icon-red';
    integrationTag = 'Todoist';
    categoryTag = 'Tasks';
  }

  // Calculate visual progress percentage
  let progressPct = 0;
  if (challenge?.status === 'completed') progressPct = 100;
  else if (challenge?.status === 'active') progressPct = 50;
  else if (challenge?.status === 'expired' || challenge?.status === 'failed') progressPct = 0;

  return (
    <Link to={`/challenges/${challengeId}`} className="challenge-card">
      <div className="card-top-row">
        <div className="card-title-group">
          <div className={`card-icon-circle ${iconBgClass}`}>{categoryIcon}</div>
          <div>
            <div className="title-status-inline">
              <h3 className="challenge-title">{challenge.title}</h3>
              <StatusBadge status={challenge.status} />
            </div>
            <p className="challenge-subtitle">
              {challenge.description && challenge.description.length > 40
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
        <span className="tag-pill category-pill">{categoryTag}</span>
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
          <span className="metric-label">PROGRESS</span>
          <span className="metric-val flex items-center gap-1">
            <CircleDot size={14} className="metric-icon" /> {progressPct}%
          </span>
        </div>
      </div>

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
