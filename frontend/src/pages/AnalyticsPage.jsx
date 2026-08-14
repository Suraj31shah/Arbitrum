import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  BarChart3, 
  Flame, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  Coins, 
  ShieldCheck, 
  Activity,
  Award,
  Zap,
  Sparkles,
  PieChart,
  CalendarCheck
} from 'lucide-react';
import { api } from '../services/api';
import './AnalyticsPage.css';

const AnalyticsPage = () => {
  const context = useOutletContext();
  const walletAddress = context?.walletAddress;
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.getChallenges('mine', walletAddress || '');
        if (Array.isArray(data)) {
          setChallenges(data);
        }
      } catch (err) {
        console.error('Failed to fetch analytics challenges:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [walletAddress]);

  // Derived Analytics Metrics
  const metrics = useMemo(() => {
    const lowerWallet = (walletAddress || '').toLowerCase();
    
    let totalChallenges = 0;
    let completedChallenges = 0;
    let failedChallenges = 0;
    let activeChallenges = 0;
    
    let totalStaked = 0;
    let totalEarned = 0;
    let totalLost = 0;

    let currentStreak = 0;
    let maxStreak = 0;

    // Days of week completion tracker
    const dayCounts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    const dayKeys = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const sorted = [...challenges].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    sorted.forEach(c => {
      const p = Array.isArray(c.participants)
        ? c.participants.find(part => part.walletAddress?.toLowerCase() === lowerWallet)
        : null;

      const pStatus = p ? p.status : c.status;
      const stake = Number(c.stakeAmount || 0);

      totalChallenges++;
      totalStaked += stake;

      if (pStatus === 'completed') {
        completedChallenges++;
        totalEarned += stake;

        currentStreak++;
        if (currentStreak > maxStreak) maxStreak = currentStreak;

        const compDate = p?.completedAt || c.completedAt || c.updatedAt || c.createdAt;
        if (compDate) {
          const dayName = dayKeys[new Date(compDate).getDay()];
          if (dayCounts[dayName] !== undefined) {
            dayCounts[dayName]++;
          }
        }
      } else if (pStatus === 'failed') {
        failedChallenges++;
        totalLost += stake;
        currentStreak = 0;
      } else {
        activeChallenges++;
      }
    });

    const finishedCount = completedChallenges + failedChallenges;
    const successRate = finishedCount > 0 
      ? Math.round((completedChallenges / finishedCount) * 100) 
      : (totalChallenges > 0 ? Math.round((completedChallenges / totalChallenges) * 100) : 0);
    
    const netReturn = totalEarned - totalLost;

    // Calculate Accountability Score (0 - 100)
    let score = null;
    let scoreMessage = 'Your analytics will come alive as you commit.';

    if (totalChallenges > 0) {
      const base = (completedChallenges / (finishedCount || 1)) * 70;
      const streakBonus = Math.min(currentStreak * 5, 20);
      const expBonus = Math.min(completedChallenges * 2, 10);
      score = Math.min(Math.round(base + streakBonus + expBonus), 100);

      if (score >= 80) {
        scoreMessage = "You're building an elite consistency streak.";
      } else if (score >= 50) {
        scoreMessage = "You're building consistent momentum.";
      } else {
        scoreMessage = "Focus on building daily momentum.";
      }
    }

    const maxDayCount = Math.max(...Object.values(dayCounts), 1);
    const maxStakingVal = Math.max(totalStaked, totalEarned, totalLost, 0.001);

    // Insights generation
    const insights = [];
    if (totalChallenges === 0) {
      insights.push("Complete your first challenge to start building your analytics history.");
    } else {
      if (currentStreak > 0) {
        insights.push(`You are currently on a ${currentStreak}-day commitment streak.`);
      }
      if (successRate > 0) {
        insights.push(`Your overall challenge completion rate is ${successRate}%.`);
      }
      if (completedChallenges > 0) {
        insights.push(`You have successfully completed ${completedChallenges} accountability challenge${completedChallenges > 1 ? 's' : ''}.`);
      }
      if (totalEarned > 0) {
        insights.push(`You have recovered ${totalEarned.toFixed(3)} ETH in completed stakes.`);
      }
      if (activeChallenges > 0) {
        insights.push(`You currently have ${activeChallenges} active challenge${activeChallenges > 1 ? 's' : ''} in progress.`);
      }
    }

    return {
      totalChallenges,
      completedChallenges,
      failedChallenges,
      activeChallenges,
      successRate,
      currentStreak,
      longestStreak: maxStreak,
      totalStaked,
      totalEarned,
      totalLost,
      netReturn,
      score,
      scoreMessage,
      dayCounts,
      maxDayCount,
      maxStakingVal,
      insights
    };
  }, [challenges, walletAddress]);

  if (loading) {
    return <div className="analytics-loading">Loading performance metrics...</div>;
  }

  // Circular progress stroke calculation
  const strokeDashoffset = 100 - (metrics.successRate || 0);

  return (
    <div className="analytics-dashboard">
      
      {/* ─── 1. ACCOUNTABILITY SCORE HERO CARD ─── */}
      <section className="analytics-card score-hero-card">
        <div className="score-hero-header">
          <div className="score-hero-title-block">
            <span className="score-badge-label">ACCOUNTABILITY SCORE</span>
            <h2 className="score-headline-msg">{metrics.scoreMessage}</h2>
          </div>
          <div className="score-big-display">
            {metrics.score !== null ? (
              <div className="score-num-group">
                <span className="score-number">{metrics.score}</span>
                <span className="score-denom">/ 100</span>
              </div>
            ) : (
              <span className="score-empty-pill">No activity yet</span>
            )}
          </div>
        </div>

        {metrics.score !== null ? (
          <div className="score-progress-track">
            <div 
              className="score-progress-fill" 
              style={{ width: `${metrics.score}%` }} 
            />
          </div>
        ) : (
          <p className="score-empty-sub">
            Complete your first challenge to start building your performance history.
          </p>
        )}
      </section>

      {/* ─── 2. TOP STAT CARDS GRID (4 COLUMNS) ─── */}
      <div className="analytics-stats-grid">
        {/* Card 1: Completed */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Completed</span>
            <CheckCircle2 size={16} className="stat-card-icon text-success" />
          </div>
          <div className="stat-card-value text-success">{metrics.completedChallenges}</div>
          <div className="stat-card-sub">Finished commitments</div>
        </div>

        {/* Card 2: Failed */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Failed</span>
            <XCircle size={16} className="stat-card-icon text-error" />
          </div>
          <div className="stat-card-value text-error">{metrics.failedChallenges}</div>
          <div className="stat-card-sub">Unfinished stakes</div>
        </div>

        {/* Card 3: Success Rate Visual */}
        <div className="stat-card stat-card-ring">
          <div className="stat-ring-container">
            <svg className="stat-ring-svg" viewBox="0 0 36 36">
              <path
                className="stat-ring-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="stat-ring-fill"
                strokeDasharray={`${metrics.successRate}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="stat-ring-text">{metrics.successRate}%</span>
          </div>
          <div className="stat-ring-info">
            <span className="stat-card-label">Success Rate</span>
            <span className="stat-card-sub">{metrics.completedChallenges} done / {metrics.failedChallenges} failed</span>
          </div>
        </div>

        {/* Card 4: Current Streak */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Current Streak</span>
            <Flame size={16} className="stat-card-icon text-accent" />
          </div>
          <div className="stat-card-value text-accent">{metrics.currentStreak} <span className="stat-unit">days</span></div>
          <div className="stat-card-sub">Active daily streak</div>
        </div>
      </div>

      {/* ─── 3. PERFORMANCE CHARTS GRID (2 COLUMNS) ─── */}
      <div className="analytics-two-col-grid">
        
        {/* CHART 1: CHALLENGE PERFORMANCE */}
        <section className="analytics-card">
          <div className="card-section-header">
            <PieChart size={17} className="card-section-icon" />
            <h3 className="card-section-title">CHALLENGE PERFORMANCE</h3>
          </div>

          {metrics.totalChallenges > 0 ? (
            <div className="horizontal-bar-chart">
              {/* Completed */}
              <div className="bar-chart-row">
                <div className="bar-row-label">
                  <span className="dot dot-success" /> Completed
                </div>
                <div className="bar-row-track">
                  <div 
                    className="bar-row-fill fill-success" 
                    style={{ width: `${Math.max((metrics.completedChallenges / metrics.totalChallenges) * 100, 4)}%` }} 
                  />
                </div>
                <span className="bar-row-count">{metrics.completedChallenges}</span>
              </div>

              {/* Failed */}
              <div className="bar-chart-row">
                <div className="bar-row-label">
                  <span className="dot dot-error" /> Failed
                </div>
                <div className="bar-row-track">
                  <div 
                    className="bar-row-fill fill-error" 
                    style={{ width: `${Math.max((metrics.failedChallenges / metrics.totalChallenges) * 100, metrics.failedChallenges > 0 ? 4 : 0)}%` }} 
                  />
                </div>
                <span className="bar-row-count">{metrics.failedChallenges}</span>
              </div>

              {/* Ongoing / Active */}
              <div className="bar-chart-row">
                <div className="bar-row-label">
                  <span className="dot dot-accent" /> Ongoing
                </div>
                <div className="bar-row-track">
                  <div 
                    className="bar-row-fill fill-accent" 
                    style={{ width: `${Math.max((metrics.activeChallenges / metrics.totalChallenges) * 100, metrics.activeChallenges > 0 ? 4 : 0)}%` }} 
                  />
                </div>
                <span className="bar-row-count">{metrics.activeChallenges}</span>
              </div>
            </div>
          ) : (
            <div className="chart-empty-state">
              <CalendarCheck size={28} className="empty-icon" />
              <p className="empty-title">No challenge history yet</p>
              <p className="empty-desc">Your challenge outcomes will be graphed here as you participate.</p>
            </div>
          )}
        </section>

        {/* CHART 2: STAKING PERFORMANCE */}
        <section className="analytics-card">
          <div className="card-section-header">
            <Coins size={17} className="card-section-icon" />
            <h3 className="card-section-title">STAKING PERFORMANCE</h3>
          </div>

          <div className="horizontal-bar-chart">
            {/* Staked */}
            <div className="bar-chart-row">
              <div className="bar-row-label">
                <span className="dot dot-info" /> Staked
              </div>
              <div className="bar-row-track">
                <div 
                  className="bar-row-fill fill-info" 
                  style={{ width: `${Math.max((metrics.totalStaked / metrics.maxStakingVal) * 100, metrics.totalStaked > 0 ? 4 : 0)}%` }} 
                />
              </div>
              <span className="bar-row-count">{metrics.totalStaked.toFixed(3)} ETH</span>
            </div>

            {/* Recovered */}
            <div className="bar-chart-row">
              <div className="bar-row-label">
                <span className="dot dot-success" /> Recovered
              </div>
              <div className="bar-row-track">
                <div 
                  className="bar-row-fill fill-success" 
                  style={{ width: `${Math.max((metrics.totalEarned / metrics.maxStakingVal) * 100, metrics.totalEarned > 0 ? 4 : 0)}%` }} 
                />
              </div>
              <span className="bar-row-count">{metrics.totalEarned.toFixed(3)} ETH</span>
            </div>

            {/* Lost */}
            <div className="bar-chart-row">
              <div className="bar-row-label">
                <span className="dot dot-error" /> Lost
              </div>
              <div className="bar-row-track">
                <div 
                  className="bar-row-fill fill-error" 
                  style={{ width: `${Math.max((metrics.totalLost / metrics.maxStakingVal) * 100, metrics.totalLost > 0 ? 4 : 0)}%` }} 
                />
              </div>
              <span className="bar-row-count">{metrics.totalLost.toFixed(3)} ETH</span>
            </div>
          </div>
        </section>
      </div>

      {/* ─── 4. CONSISTENCY & NET RETURN GRID ─── */}
      <div className="analytics-two-col-grid">
        
        {/* CONSISTENCY SECTION */}
        <section className="analytics-card">
          <div className="card-section-header">
            <Activity size={17} className="card-section-icon" />
            <h3 className="card-section-title">CONSISTENCY</h3>
          </div>

          <div className="consistency-streak-row">
            <div className="streak-stat-box">
              <span className="streak-label">Current Streak</span>
              <span className="streak-val text-accent">{metrics.currentStreak} days</span>
            </div>
            <div className="streak-stat-divider" />
            <div className="streak-stat-box">
              <span className="streak-label">Longest Streak</span>
              <span className="streak-val">{metrics.longestStreak} days</span>
            </div>
          </div>

          <div className="weekly-dot-tracker">
            <div className="weekly-dot-title">WEEKLY COMMITMENT ACTIVITY</div>
            <div className="weekly-dots-row">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                const count = metrics.dayCounts[day] || 0;
                return (
                  <div key={day} className="day-dot-item">
                    <div className={`day-dot-square ${count > 0 ? 'active' : ''}`} />
                    <span className="day-dot-label">{day[0]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* NET RETURN & SUMMARY CARD */}
        <section className="analytics-card">
          <div className="card-section-header">
            <TrendingUp size={17} className="card-section-icon" />
            <h3 className="card-section-title">NET RETURN</h3>
          </div>

          <div className="net-return-block">
            <div className={`net-return-amount ${metrics.netReturn >= 0 ? 'text-success' : 'text-error'}`}>
              {metrics.netReturn >= 0 ? '+' : ''}{metrics.netReturn.toFixed(4)} ETH
            </div>
            <div className={`net-return-pill ${metrics.netReturn >= 0 ? 'pill-success' : 'pill-error'}`}>
              {metrics.netReturn >= 0 ? 'Positive Return' : 'Keep building consistency'}
            </div>
            <p className="net-return-sub">
              Total Staked: {metrics.totalStaked.toFixed(3)} ETH · Recovered: {metrics.totalEarned.toFixed(3)} ETH
            </p>
          </div>
        </section>
      </div>

      {/* ─── 5. YOUR PROGRESS (INSIGHTS SECTION) ─── */}
      <section className="analytics-card insights-card">
        <div className="card-section-header">
          <Sparkles size={17} className="card-section-icon" />
          <h3 className="card-section-title">YOUR PROGRESS</h3>
        </div>

        <div className="insights-list">
          {metrics.insights.map((insight, i) => (
            <div key={i} className="insight-item">
              <div className="insight-bullet" />
              <span className="insight-text">{insight}</span>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default AnalyticsPage;
