import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Trophy, 
  Flame, 
  Target, 
  Award, 
  Zap, 
  Coins, 
  Gem, 
  Users, 
  Lock, 
  CheckCircle2 
} from 'lucide-react';
import { api } from '../services/api';
import './AchievementsPage.css';

const AchievementsPage = () => {
  const context = useOutletContext();
  const walletAddress = context?.walletAddress;
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const data = await api.getChallenges('mine', walletAddress || '');
        if (Array.isArray(data)) {
          setChallenges(data);
        }
      } catch (err) {
        console.error('Failed to load challenges for achievements:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, [walletAddress]);

  // Derived achievement metrics
  const stats = useMemo(() => {
    let completedCount = 0;
    let completedWithStakeCount = 0;
    let createdWithParticipantsCount = 0;

    // Filter user's specific participant records
    const lowerWallet = (walletAddress || '').toLowerCase();

    // Sort challenges chronologically by date
    const sorted = [...challenges].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    let currentStreak = 0;
    let maxStreak = 0;
    let consecutiveSuccess = 0;
    let maxConsecutiveSuccess = 0;

    sorted.forEach((c) => {
      const isCreator = c.creatorWallet?.toLowerCase() === lowerWallet ||
                        (typeof c.creator === 'object' && c.creator?.walletAddress?.toLowerCase() === lowerWallet);
      
      if (isCreator && Array.isArray(c.participants) && c.participants.length > 1) {
        createdWithParticipantsCount++;
      }

      const p = Array.isArray(c.participants)
        ? c.participants.find(part => part.walletAddress?.toLowerCase() === lowerWallet)
        : null;

      const pStatus = p ? p.status : c.status;

      if (pStatus === 'completed') {
        completedCount++;
        if (c.stakeAmount > 0) completedWithStakeCount++;
        
        consecutiveSuccess++;
        if (consecutiveSuccess > maxConsecutiveSuccess) maxConsecutiveSuccess = consecutiveSuccess;
        
        currentStreak++;
        if (currentStreak > maxStreak) maxStreak = currentStreak;
      } else if (pStatus === 'failed') {
        consecutiveSuccess = 0;
        currentStreak = 0;
      }
    });

    return {
      completedCount,
      completedWithStakeCount,
      createdWithParticipantsCount,
      currentStreak,
      maxStreak,
      maxConsecutiveSuccess
    };
  }, [challenges, walletAddress]);

  // Achievement list definitions
  const achievementList = useMemo(() => [
    {
      id: 'first_commitment',
      title: 'First Commitment',
      description: 'Unlock when you complete your first challenge.',
      icon: Flame,
      unlocked: stats.completedCount >= 1,
      progress: `${Math.min(stats.completedCount, 1)} / 1`
    },
    {
      id: 'five_challenges',
      title: '5 Challenges',
      description: 'Unlock after completing 5 successful challenges.',
      icon: Target,
      unlocked: stats.completedCount >= 5,
      progress: `${Math.min(stats.completedCount, 5)} / 5`
    },
    {
      id: 'ten_challenges',
      title: '10 Challenges',
      description: 'Unlock after completing 10 successful challenges.',
      icon: Award,
      unlocked: stats.completedCount >= 10,
      progress: `${Math.min(stats.completedCount, 10)} / 10`
    },
    {
      id: 'seven_day_streak',
      title: '7 Streak Milestone',
      description: 'Maintain a 7-challenge completion streak without failure.',
      icon: Zap,
      unlocked: stats.maxStreak >= 7,
      progress: `${Math.min(stats.maxStreak, 7)} / 7`
    },
    {
      id: 'first_payout',
      title: 'First Payout',
      description: 'Unlock after completing a staked challenge with ETH on the line.',
      icon: Coins,
      unlocked: stats.completedWithStakeCount >= 1,
      progress: `${Math.min(stats.completedWithStakeCount, 1)} / 1`
    },
    {
      id: 'perfect_run',
      title: 'Perfect Run',
      description: 'Complete 5 consecutive challenges without a single failure.',
      icon: Gem,
      unlocked: stats.maxConsecutiveSuccess >= 5,
      progress: `${Math.min(stats.maxConsecutiveSuccess, 5)} / 5`
    },
    {
      id: 'community_builder',
      title: 'Community Builder',
      description: 'Create a public challenge that receives outside participants.',
      icon: Users,
      unlocked: stats.createdWithParticipantsCount >= 1,
      progress: `${Math.min(stats.createdWithParticipantsCount, 1)} / 1`
    }
  ], [stats]);

  const unlockedCount = useMemo(() => achievementList.filter(a => a.unlocked).length, [achievementList]);

  if (loading) {
    return <div className="achievements-loading">Loading achievements...</div>;
  }

  return (
    <div className="achievements-page">
      {/* Header Summary */}
      <div className="achievements-header">
        <div className="achievements-header-text">
          <h2 className="achievements-title">Achievements</h2>
          <p className="achievements-subtitle">Earn badges for consistency, streaks, and proof verification.</p>
        </div>
        <div className="achievements-badge-summary">
          <Trophy size={18} className="trophy-gold-icon" />
          <span>UNLOCKED: <strong>{unlockedCount} / {achievementList.length}</strong></span>
        </div>
      </div>

      {/* Grid List */}
      <div className="achievements-grid">
        {achievementList.map((item, idx) => {
          const IconComponent = item.icon;
          return (
            <div 
              key={item.id} 
              className={`achievement-card ${item.unlocked ? 'is-unlocked' : 'is-locked'}`}
              style={{ '--item-index': idx }}
            >
              <div className="achievement-icon-box">
                <IconComponent size={22} className="achievement-icon" />
              </div>

              <div className="achievement-content">
                <div className="achievement-title-row">
                  <h3 className="achievement-card-title">{item.title}</h3>
                  <span className={`achievement-status-tag ${item.unlocked ? 'unlocked' : 'locked'}`}>
                    {item.unlocked ? (
                      <>
                        <CheckCircle2 size={13} /> UNLOCKED
                      </>
                    ) : (
                      <>
                        <Lock size={12} /> LOCKED
                      </>
                    )}
                  </span>
                </div>
                <p className="achievement-card-desc">{item.description}</p>
                <div className="achievement-progress-text">{item.progress}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AchievementsPage;
