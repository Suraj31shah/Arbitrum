import React from 'react';
import './StakeSummary.css';

const StakeSummary = ({ stats }) => {
  if (!stats) return null;

  const totalStakedEth = typeof stats.totalStaked === 'number' ? stats.totalStaked : 0;
  const activeCount = typeof stats.activeChallenges === 'number' ? stats.activeChallenges : 0;
  const completedCount = typeof stats.completedChallenges === 'number' ? stats.completedChallenges : 0;
  const successRate = typeof stats.successRate === 'number' ? stats.successRate : 0;

  const formattedEth = totalStakedEth.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 6 
  });

  return (
    <div className="stake-summary-grid">
      {/* 1. Total Staked */}
      <div className="summary-card">
        <div className="summary-label">TOTAL STAKED</div>
        <div className="summary-value-row">
          <span className="summary-number">{formattedEth}</span>
          <span className="summary-unit">ETH</span>
        </div>
      </div>
      
      {/* 2. Ongoing */}
      <div className="summary-card">
        <div className="summary-label">ONGOING</div>
        <div className="summary-value-row">
          <span className="summary-number">{activeCount}</span>
          <span className="summary-unit-muted">{activeCount === 1 ? 'Challenge' : 'Challenges'}</span>
        </div>
      </div>
      
      {/* 3. Completed */}
      <div className="summary-card">
        <div className="summary-label">COMPLETED</div>
        <div className="summary-value-row">
          <span className="summary-number">{completedCount}</span>
          <span className="summary-unit-muted">{completedCount === 1 ? 'Challenge' : 'Challenges'}</span>
        </div>
      </div>
      
      {/* 4. Success Rate */}
      <div className="summary-card">
        <div className="summary-label">SUCCESS RATE</div>
        <div className="summary-value-row">
          <span className="summary-number">{successRate}%</span>
        </div>
      </div>
    </div>
  );
};

export default StakeSummary;
