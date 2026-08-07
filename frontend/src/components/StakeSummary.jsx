import React from 'react';
import './StakeSummary.css';

const StakeSummary = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="stake-summary-grid">
      <div className="summary-card accent-card">
        <div className="summary-label">Total Staked</div>
        <div className="summary-value">{stats.totalStaked.toFixed(2)} <span className="summary-unit">ETH</span></div>
      </div>
      
      <div className="summary-card">
        <div className="summary-label">Active</div>
        <div className="summary-value">{stats.activeChallenges}</div>
      </div>
      
      <div className="summary-card">
        <div className="summary-label">Completed</div>
        <div className="summary-value">{stats.completedChallenges}</div>
      </div>
      
      <div className="summary-card">
        <div className="summary-label">Success Rate</div>
        <div className="summary-value">{stats.successRate}%</div>
      </div>
    </div>
  );
};

export default StakeSummary;
