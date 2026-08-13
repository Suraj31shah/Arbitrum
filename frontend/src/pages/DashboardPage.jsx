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
  FileCheck 
} from 'lucide-react';
import { api } from '../services/api';
import StakeSummary from '../components/StakeSummary';
import ChallengeCard from '../components/ChallengeCard';
import StatusBadge from '../components/StatusBadge';
import CountdownTimer from '../components/CountdownTimer';
import './DashboardPage.css';

const DashboardPage = () => {
  const context = useOutletContext();
  const walletAddress = context?.walletAddress;

  const [stats, setStats] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [activeTab, setActiveTab] = useState('ongoing');
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

  // Find most important ongoing challenge for "Current Focus" section
  const mostImportantOngoing = challenges.find(c => 
    ['active', 'proof_submitted', 'verifying', 'ai_verified'].includes(c?.status)
  );

  // Filter challenges based on category tab
  const filteredChallenges = challenges.filter(c => {
    if (activeTab === 'ongoing') {
      return ['active', 'proof_submitted', 'verifying', 'ai_verified'].includes(c?.status);
    }
    if (activeTab === 'completed') {
      return c?.status === 'completed';
    }
    if (activeTab === 'expired') {
      return c?.status === 'expired' || c?.status === 'failed';
    }
    return true;
  });

  if (loading) {
    return <div className="container text-center mt-8 text-muted">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="container mt-8">
        <div style={{ color: 'var(--error)' }}>Failed to load dashboard: {error}</div>
      </div>
    );
  }

  return (
    <div className="dashboard-page-content">
      {/* 1. Statistics */}
      <StakeSummary stats={stats} />

      {/* 2. Current Focus Section */}
      <section className="focus-section">
        <div className="focus-header-row">
          <div className="focus-title-block">
            <h2>Current Focus</h2>
            <p className="focus-subtitle">Your most important challenge right now.</p>
          </div>
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
                  <span>Staked: <strong>{mostImportantOngoing.stakeAmount || mostImportantOngoing.prizePool || 0} ETH</strong></span>
                </div>
                <div className="focus-metric-item">
                  <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                  <span>Due: <CountdownTimer deadline={mostImportantOngoing.deadline} compact={true} /></span>
                </div>
              </div>
            </div>

            <Link to={`/challenges/${mostImportantOngoing._id}`} className="focus-continue-btn">
              Continue <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="focus-empty-panel">
            <div>
              <div className="focus-empty-title">No active challenges</div>
              <div className="focus-empty-desc">Ready to put your commitment on the line?</div>
            </div>
            <div className="focus-empty-actions">
              <Link to="/challenges" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
                Explore Challenges
              </Link>
              <Link to="/challenges/new" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
                Create Challenge
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* 3. My Challenges Section with Tabs & Max 3 Cards */}
      <section className="my-challenges-section">
        <div className="section-header-bar">
          <div className="section-title-group">
            <h2>My Challenges</h2>
            <p className="section-desc">Challenges you're currently participating in.</p>
          </div>
          <Link to="/challenges" className="header-explore-link">
            Explore Challenges <ArrowRight size={14} />
          </Link>
        </div>

        {/* Category Tabs: Ongoing | Completed | Expired */}
        <div className="category-tabs-bar">
          <button 
            className={`tab-btn ${activeTab === 'ongoing' ? 'active' : ''}`}
            onClick={() => setActiveTab('ongoing')}
          >
            Ongoing
          </button>
          <button 
            className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            Completed
          </button>
          <button 
            className={`tab-btn ${activeTab === 'expired' ? 'active' : ''}`}
            onClick={() => setActiveTab('expired')}
          >
            Expired
          </button>
        </div>

        {/* Challenge Cards Grid (Max 3) */}
        {filteredChallenges.length === 0 ? (
          <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            No {activeTab} challenges found.
          </div>
        ) : (
          <div className="dashboard-challenges-grid">
            {filteredChallenges.slice(0, 3).map(challenge => (
              <ChallengeCard key={challenge._id} challenge={challenge} />
            ))}
          </div>
        )}

        <div className="view-all-bar">
          <Link to="/challenges" className="view-all-link">
            View all my challenges <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* 4. Recent Activity Section */}
      <section className="compact-activity-card">
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
    </div>
  );
};

export default DashboardPage;
