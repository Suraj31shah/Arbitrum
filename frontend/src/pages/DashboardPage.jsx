import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { 
  Activity, 
  ArrowRight, 
  Clock, 
  Coins, 
  CheckCircle2, 
  PlusCircle, 
  Wallet, 
  Flame,
  Award,
  TrendingUp,
  Target
} from 'lucide-react';
import { api } from '../services/api';
import StakeSummary from '../components/StakeSummary';
import StatusBadge from '../components/StatusBadge';
import CountdownTimer from '../components/CountdownTimer';
import './DashboardPage.css';

const DashboardPage = () => {
  const context = useOutletContext();
  const walletAddress = context?.walletAddress;

  const [stats, setStats] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsData, challengesData] = await Promise.all([
          api.getDashboardStats(),
          api.getChallenges()
        ]);
        setStats(statsData);
        setChallenges(Array.isArray(challengesData) ? challengesData : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [walletAddress]);

  // Find the single most important active challenge for "Current Focus"
  const mostImportantOngoing = challenges.find(c => 
    ['active', 'proof_submitted', 'verifying', 'ai_verified'].includes(c?.status)
  );

  if (loading) {
    return <div className="container text-center mt-8 text-muted">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="container mt-8 text-center" style={{ color: 'var(--error)' }}>
        Failed to load dashboard: {error}
      </div>
    );
  }

  return (
    <div className="dashboard-page-content">
      {/* 1. Statistics Cards (Total Staked, Ongoing, Completed, Success Rate) */}
      <StakeSummary stats={stats} />

      {/* 2. Current Focus Section (ONE important ongoing challenge) */}
      <section className="focus-section">
        <div className="focus-header-row">
          <div className="focus-title-block">
            <h2>Current Focus</h2>
            <p className="focus-subtitle">Your primary priority goal right now.</p>
          </div>
          <Link to="/my-challenges" className="header-explore-link">
            View My Challenges <ArrowRight size={14} />
          </Link>
        </div>

        {mostImportantOngoing ? (
          <div className="focus-panel">
            <div className="focus-panel-info">
              <div className="focus-challenge-title-row">
                <span className="focus-challenge-title">{mostImportantOngoing.title}</span>
                <StatusBadge status={mostImportantOngoing.status} />
              </div>

              <div className="focus-metrics-inline">
                <div className="focus-metric-item">
                  <Coins size={14} style={{ color: 'var(--accent)' }} />
                  <span>My Stake: <strong>{mostImportantOngoing.stakeAmount || mostImportantOngoing.prizePool || 0.01} ETH</strong></span>
                </div>
                <div className="focus-metric-item">
                  <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                  <span>Time Remaining: <CountdownTimer deadline={mostImportantOngoing.deadline} compact={true} /></span>
                </div>
              </div>
            </div>

            <Link to={`/challenges/${mostImportantOngoing._id}`} className="focus-continue-btn">
              Continue Challenge <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="focus-empty-panel">
            <div>
              <div className="focus-empty-title">No active focus challenge</div>
              <div className="focus-empty-desc">Set your commitment terms or discover public community challenges.</div>
            </div>
            <div className="focus-empty-actions">
              <Link to="/explore" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
                Explore Challenges
              </Link>
              <Link to="/challenges/new" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
                Create Challenge
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* 3. Streak & Weekly Progress Visualization Card */}
      <section className="streak-progress-card mb-8">
        <div className="streak-card-header">
          <div className="flex items-center gap-2">
            <Flame size={20} className="text-accent" style={{ color: '#10b981' }} />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Accountability Streak</h3>
          </div>
          <span className="badge badge-accent">Active Streak</span>
        </div>

        <div className="streak-metrics-grid mt-4">
          <div className="streak-metric-item">
            <div className="streak-num">5 Days</div>
            <div className="streak-label">Current Streak 🔥</div>
          </div>
          <div className="streak-metric-item">
            <div className="streak-num">{stats?.completedChallenges || 0}</div>
            <div className="streak-label">Milestones Met 🏆</div>
          </div>
          <div className="streak-metric-item">
            <div className="streak-num">{stats?.successRate || 100}%</div>
            <div className="streak-label">Punctuality Score ⚡</div>
          </div>
        </div>

        <div className="streak-bar-wrapper mt-4">
          <div className="flex justify-between text-muted text-xs mb-1">
            <span>Weekly Progress</span>
            <span>{stats?.completedChallenges || 1} / {stats?.totalChallenges || 1} Goals</span>
          </div>
          <div className="streak-track-bar">
            <div className="streak-fill-bar" style={{ width: `${stats?.successRate || 80}%` }}></div>
          </div>
        </div>
      </section>

      {/* 4. Recent Activity Timeline */}
      <section className="compact-activity-card mb-8">
        <div className="compact-activity-header">
          <Activity size={16} style={{ color: 'var(--text-muted)' }} />
          <h3>Recent Activity</h3>
        </div>

        <div className="compact-activity-list">
          {challenges.slice(0, 3).map((c, idx) => (
            <div key={c._id || idx} className="compact-activity-item">
              <div className="activity-left-info">
                <div className="activity-icon-badge badge-green">
                  {c.status === 'completed' ? <CheckCircle2 size={14} /> : <PlusCircle size={14} />}
                </div>
                <div>
                  <div className="activity-text-main">
                    {c.status === 'completed' ? 'Challenge completed' : 'Challenge created'}: {c.title}
                  </div>
                  <div className="activity-text-sub">Staked {c.stakeAmount || c.prizePool || 0.01} ETH</div>
                </div>
              </div>
              <div className="activity-timestamp">
                {idx === 0 ? '2h ago' : idx === 1 ? '3h ago' : 'Yesterday'}
              </div>
            </div>
          ))}

          <div className="compact-activity-item">
            <div className="activity-left-info">
              <div className="activity-icon-badge badge-neutral">
                <Wallet size={14} />
              </div>
              <div>
                <div className="activity-text-main">Wallet connected</div>
                <div className="activity-text-sub">Session active</div>
              </div>
            </div>
            <div className="activity-timestamp">Yesterday</div>
          </div>
        </div>
      </section>

      {/* 5. View My Challenges Navigation Banner */}
      <div className="dashboard-footer-banner">
        <div>
          <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>Your Complete Challenge Library</h3>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            View all ongoing, completed, and past expired commitments.
          </p>
        </div>
        <Link to="/my-challenges" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
          View My Challenges <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
};

export default DashboardPage;
