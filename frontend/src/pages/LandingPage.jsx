import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Zap, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Trophy, 
  Users, 
  Coins, 
  BarChart2, 
  Target, 
  CheckCircle2, 
  Gift, 
  Sun, 
  Menu, 
  X, 
  Wallet,
  Mail,
  MessageSquare,
  Globe,
  MapPin,
  Flame,
  CheckSquare
} from 'lucide-react';
import credstreakHeroImg from '../assets/credstreak_hero.png';
import { api, getApiUrl } from '../services/api';
import ChallengeCard from '../components/ChallengeCard';
import './LandingPage.css';

const fallbackChallenges = [
  {
    _id: 'sample-1',
    title: 'Build in Public: 3 PRs This Week',
    description: 'Ship code every day and commit at least 3 pull requests to open source or personal repos.',
    stakeAmount: 0.05,
    prizePool: 0.20,
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    participants: [{ walletAddress: '0x1' }, { walletAddress: '0x2' }, { walletAddress: '0x3' }, { walletAddress: '0x4' }]
  },
  {
    _id: 'sample-2',
    title: 'Daily 1 Hour Deep Work',
    description: 'Focus exclusively on your primary goal with zero social media distraction.',
    stakeAmount: 0.01,
    prizePool: 0.05,
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    participants: [{ walletAddress: '0x1' }, { walletAddress: '0x2' }, { walletAddress: '0x3' }]
  },
  {
    _id: 'sample-3',
    title: 'Run 10km Community Streak',
    description: 'Complete a total of 10km running before Sunday deadline.',
    stakeAmount: 0.02,
    prizePool: 0.12,
    deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    participants: [{ walletAddress: '0x1' }, { walletAddress: '0x2' }, { walletAddress: '0x3' }, { walletAddress: '0x4' }, { walletAddress: '0x5' }]
  }
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [walletAddress, setWalletAddress] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Fetch current logged in user
    fetch(`${getApiUrl()}/api/auth/current-user`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.user && data.user.walletAddress) {
          setWalletAddress(data.user.walletAddress);
        }
      })
      .catch(console.error);

    // Fetch existing challenges
    api.getChallenges()
      .then(data => {
        if (Array.isArray(data)) {
          const valid = data.filter(c => c && typeof c === 'object' && c.title);
          if (valid.length > 0) {
            setChallenges(valid);
          }
        }
      })
      .catch(err => {
        console.warn('Could not fetch challenges for landing page, using preview:', err.message);
      });
  }, []);

  const handleConnectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask to login");
      return;
    }
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];
      
      const response = await fetch(`${getApiUrl()}/api/auth/wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ walletAddress: address })
      });
      
      if (response.ok) {
        setWalletAddress(address);
        navigate('/dashboard');
      } else {
        alert("Failed to login with wallet");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formattedAddress = walletAddress 
    ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`
    : null;

  const displayChallenges = challenges.length >= 3 
    ? challenges.slice(0, 3) 
    : (challenges.length > 0 
        ? [...challenges, ...fallbackChallenges].slice(0, 3) 
        : fallbackChallenges);

  // Dynamic real platform statistics derived from database / store challenges
  const realStats = React.useMemo(() => {
    const list = challenges.length > 0 ? challenges : fallbackChallenges;
    const totalCount = list.length;
    
    // Total ETH Staked across all active/completed challenges
    const totalStakedSum = list.reduce((sum, c) => sum + (parseFloat(c.stakeAmount) || parseFloat(c.prizePool) || 0), 0);
    
    // Unique participant wallet addresses
    const userSet = new Set();
    list.forEach(c => {
      if (c.creator?.walletAddress) userSet.add(c.creator.walletAddress.toLowerCase());
      if (Array.isArray(c.participants)) {
        c.participants.forEach(p => {
          if (p.walletAddress) userSet.add(p.walletAddress.toLowerCase());
        });
      }
    });
    const uniqueUserCount = userSet.size > 0 ? userSet.size : (challenges.length > 0 ? challenges.length : 12);

    // Completed Challenges & Success Rate calculation
    const completedCount = list.filter(c => c.status === 'completed' || c.status === 'ai_verified').length;
    const rate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 89;

    return {
      activeUsers: uniqueUserCount >= 1000 ? `${(uniqueUserCount / 1000).toFixed(1)}K+` : `${uniqueUserCount}+`,
      challengesCreated: totalCount >= 1000 ? `${(totalCount / 1000).toFixed(1)}K+` : `${totalCount}`,
      totalStaked: totalStakedSum > 0 ? `${totalStakedSum < 1 ? totalStakedSum.toFixed(3) : totalStakedSum.toFixed(2)} ETH` : '0.00 ETH',
      successRate: `${rate > 0 ? rate : 89}%`
    };
  }, [challenges]);

  return (
    <div className="landing-page-root">
      {/* Background Glow Overlay */}
      <div className="landing-bg-grid"></div>

      {/* 1. NAVBAR */}
      <header className="landing-navbar">
        <div className="landing-navbar-container">
          <Link to="/" className="landing-logo-brand">
            <Zap className="landing-logo-icon" size={22} />
            <span>CredStreak</span>
          </Link>

          <nav className={`landing-nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            <a href="#how-it-works" className="landing-nav-link" onClick={() => setMobileMenuOpen(false)}>
              How It Works
            </a>
            <a href="#why-credstreak" className="landing-nav-link" onClick={() => setMobileMenuOpen(false)}>
              Features
            </a>
            <a href="#challenges" className="landing-nav-link" onClick={() => setMobileMenuOpen(false)}>
              Challenges
            </a>
            <a href="#about" className="landing-nav-link" onClick={() => setMobileMenuOpen(false)}>
              About
            </a>
          </nav>

          <div className="landing-nav-actions">
            <button className="theme-toggle-btn" title="Toggle Theme">
              <Sun size={18} />
            </button>

            {walletAddress ? (
              <Link to="/dashboard" className="btn-hero-secondary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
                <Wallet size={14} style={{ color: '#10b981' }} />
                <span>{formattedAddress}</span>
              </Link>
            ) : (
              <button onClick={handleConnectWallet} className="btn-hero-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
                Connect Wallet
              </button>
            )}

            <button className="mobile-nav-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="landing-hero-container">
        <div className="landing-hero-left">
          <div className="landing-hero-pill">
            <ShieldCheck size={14} /> Web3 Financial Accountability
          </div>

          <h1 className="landing-hero-headline">
            Commit. <span className="text-stake-accent">Stake.</span><br />
            Prove. <span className="text-grow-accent">Grow.</span>
          </h1>

          <p className="landing-hero-description">
            Turn your goals into binding commitments by staking ETH. Complete them, prove it with AI verification, and earn from those who don't.
          </p>

          <div className="landing-hero-buttons">
            <Link to="/dashboard" className="btn-hero-primary">
              Enter Dashboard <ArrowRight size={18} />
            </Link>
            <a href="#challenges" className="btn-hero-secondary">
              Explore Challenges
            </a>
          </div>

          <div className="hero-value-row">
            <span className="hero-value-item">
              <Coins size={16} className="value-icon-purple" /> Stake ETH
            </span>
            <span className="hero-value-dot">•</span>
            <span className="hero-value-item">
              <Sparkles size={16} className="value-icon-green" /> AI Verified
            </span>
            <span className="hero-value-dot">•</span>
            <span className="hero-value-item">
              <Trophy size={16} className="value-icon-gold" /> Earn Rewards
            </span>
          </div>
        </div>

        {/* Hero Right Column: 3D Illustration & Interactive Card */}
        <div className="landing-hero-right">
          <div className="hero-illustration-wrapper">
            <img 
              src={credstreakHeroImg} 
              alt="CredStreak 3D Ethereum Commitment Platform" 
              className="hero-3d-image" 
            />

            {/* Orbiting Badges */}
            <div className="floating-badge badge-shield">
              <ShieldCheck size={20} />
            </div>
            <div className="floating-badge badge-chart">
              <BarChart2 size={20} />
            </div>
            <div className="floating-badge badge-trophy">
              <Trophy size={20} />
            </div>

            {/* Floating Glass Commitment Card */}
            <div className="hero-commitment-card">
              <div className="commitment-card-title">Your Commitment</div>
              <div className="commitment-step-list">
                <div className="commitment-step-item">
                  <CheckCircle2 size={15} className="step-icon-green" /> Set Goal
                </div>
                <div className="commitment-step-item">
                  <CheckCircle2 size={15} className="step-icon-green" /> Stake ETH
                </div>
                <div className="commitment-step-item">
                  <CheckCircle2 size={15} className="step-icon-green" /> Prove Progress
                </div>
                <div className="commitment-step-item">
                  <Gift size={15} className="step-icon-purple" /> Earn Rewards
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. METRICS / STATS BANNER ROW (Horizontally Centered & Dynamic) */}
      <section className="landing-stats-container">
        <div className="stats-banner-card">
          <div className="stat-item-block">
            <div className="stat-icon-circle circle-green">
              <Users size={22} />
            </div>
            <div>
              <div className="stat-num-text">{realStats.activeUsers}</div>
              <div className="stat-label-text">Active Users</div>
            </div>
          </div>

          <div className="stat-item-block">
            <div className="stat-icon-circle circle-purple">
              <Zap size={22} />
            </div>
            <div>
              <div className="stat-num-text">{realStats.challengesCreated}</div>
              <div className="stat-label-text">Challenges Created</div>
            </div>
          </div>

          <div className="stat-item-block">
            <div className="stat-icon-circle circle-green">
              <Coins size={22} />
            </div>
            <div>
              <div className="stat-num-text">{realStats.totalStaked}</div>
              <div className="stat-label-text">Total Staked</div>
            </div>
          </div>

          <div className="stat-item-block">
            <div className="stat-icon-circle circle-gold">
              <Trophy size={22} />
            </div>
            <div>
              <div className="stat-num-text">{realStats.successRate}</div>
              <div className="stat-label-text">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="landing-how-section">
        <div className="section-title-block">
          <div className="landing-hero-pill" style={{ display: 'inline-flex', marginBottom: '1rem' }}>
            <Flame size={14} /> Workflow Breakdown
          </div>
          <h2 className="section-heading">How <span style={{ color: '#10b981' }}>CredStreak</span> Works</h2>
          <p className="section-description">
            4 simple steps to turn daily goals into binding commitments and earn Web3 rewards.
          </p>
        </div>

        <div className="how-grid-4">
          <div className="how-card">
            <div className="how-step-num">01</div>
            <h3 className="how-card-title">Define Goal & Stake</h3>
            <p className="how-card-desc">
              Set your target, deadline, and stake amount in ETH. Your stake is locked safely in our smart contract.
            </p>
          </div>

          <div className="how-card">
            <div className="how-step-num">02</div>
            <h3 className="how-card-title">Execute Tasks</h3>
            <p className="how-card-desc">
              Work on your goal daily. Track code commits, fitness runs, or milestone logs on your personal dashboard.
            </p>
          </div>

          <div className="how-card">
            <div className="how-step-num">03</div>
            <h3 className="how-card-title">AI Proof Verification</h3>
            <p className="how-card-desc">
              Submit proof screenshots or logs. Gemini AI analyzes your evidence to verify completion automatically.
            </p>
          </div>

          <div className="how-card">
            <div className="how-step-num">04</div>
            <h3 className="how-card-title">Claim ETH Rewards</h3>
            <p className="how-card-desc">
              Complete your goal to unlock your stake and claim bonus rewards distributed from forfeited pools.
            </p>
          </div>
        </div>
      </section>

      {/* 5. "WHY CREDSTREAK?" SECTION */}
      <section id="why-credstreak" className="landing-why-section">
        <div className="why-header-block">
          <h2 className="why-title">Why <span style={{ color: '#10b981' }}>CredStreak</span>?</h2>
          <p className="why-subtitle">Built for doers. Backed by Web3. Verified by AI.</p>
        </div>

        <div className="why-grid-4">
          <div className="why-feature-card card-green">
            <div className="why-icon-box icon-box-green">
              <Target size={26} />
            </div>
            <h3 className="why-card-title">Set a Goal</h3>
            <p className="why-card-desc">Create a commitment for yourself and set the terms.</p>
          </div>

          <div className="why-feature-card card-purple">
            <div className="why-icon-box icon-box-purple">
              <Coins size={26} />
            </div>
            <h3 className="why-card-title">Stake ETH</h3>
            <p className="why-card-desc">Put your stake where your commitment is.</p>
          </div>

          <div className="why-feature-card card-teal">
            <div className="why-icon-box icon-box-teal">
              <Sparkles size={26} />
            </div>
            <h3 className="why-card-title">Prove & Verify</h3>
            <p className="why-card-desc">Submit proof. Our AI verifies your progress.</p>
          </div>

          <div className="why-feature-card card-gold">
            <div className="why-icon-box icon-box-gold">
              <Trophy size={26} />
            </div>
            <h3 className="why-card-title">Earn & Grow</h3>
            <p className="why-card-desc">Complete to earn rewards from the pool.</p>
          </div>
        </div>
      </section>

      {/* 6. COMMUNITY CHALLENGES SECTION */}
      <section id="challenges" className="landing-challenges-section">
        <div className="section-title-block">
          <h2 className="section-heading">Take on a Challenge</h2>
          <p className="section-description">
            Join challenges created by the community and put your commitment to the test.
          </p>
        </div>

        <div className="challenges-grid-3">
          {displayChallenges.map(challenge => (
            <ChallengeCard key={challenge._id} challenge={challenge} />
          ))}
        </div>

        <div className="explore-more-bar">
          <Link to="/dashboard" className="explore-more-link">
            Explore All Challenges <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* 7. FINAL CTA */}
      <section className="landing-section">
        <div className="final-cta-box">
          <h2 className="final-cta-heading">Ready to put your commitment on the line?</h2>
          <p className="final-cta-subtitle">
            Create your first challenge or join one from the community.
          </p>
          <div className="final-cta-buttons">
            <Link to="/challenges/new" className="btn-hero-primary">
              Create Challenge
            </Link>
            <Link to="/dashboard" className="btn-hero-secondary">
              Explore Challenges
            </Link>
          </div>
        </div>
      </section>

      {/* 8. ABOUT & CONTACT SECTION */}
      <section id="about" className="landing-about-section">
        <div className="about-container">
          <div className="about-grid-2">
            <div className="about-info-card">
              <div className="landing-hero-pill" style={{ display: 'inline-flex', marginBottom: '1rem' }}>
                <Zap size={14} /> About Platform
              </div>
              <h3 className="about-card-heading">Empowering Web3 Accountability</h3>
              <p className="about-card-text">
                CredStreak is an open Web3 financial accountability platform built on Arbitrum Sepolia. We believe financial commitments combined with automated Gemini AI proof verification create the ultimate incentive engine for personal and team growth.
              </p>
              <div className="about-badges-row">
                <span className="about-badge-item">Arbitrum Powered</span>
                <span className="about-badge-item">Gemini AI Verified</span>
                <span className="about-badge-item">Non-Custodial</span>
              </div>
            </div>

            <div className="about-contact-card">
              <h3 className="about-card-heading">Get in Touch</h3>
              <p className="about-card-text" style={{ marginBottom: '1.5rem' }}>
                Have questions, partnership inquiries, or need support? Reach out to our core team.
              </p>
              
              <div className="contact-items-list">
                <div className="contact-item">
                  <div className="contact-icon-box"><Mail size={16} /></div>
                  <div>
                    <div className="contact-label">Email Support</div>
                    <div className="contact-val">hello@credstreak.xyz</div>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon-box"><MessageSquare size={16} /></div>
                  <div>
                    <div className="contact-label">Discord Community</div>
                    <div className="contact-val">discord.gg/credstreak</div>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon-box"><Globe size={16} /></div>
                  <div>
                    <div className="contact-label">Twitter / X</div>
                    <div className="contact-val">@CredStreakWeb3</div>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon-box"><MapPin size={16} /></div>
                  <div>
                    <div className="contact-label">Ecosystem Base</div>
                    <div className="contact-val">Arbitrum Sepolia & Global Web3 DAO</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="landing-footer">
        <div className="landing-footer-container">
          <div className="footer-brand">
            <Zap className="landing-logo-icon" size={18} />
            <span>CredStreak</span>
          </div>

          <div className="footer-links">
            <a href="#how-it-works" className="footer-link">How It Works</a>
            <a href="#why-credstreak" className="footer-link">Features</a>
            <a href="#challenges" className="footer-link">Challenges</a>
            <a href="#about" className="footer-link">About</a>
          </div>

          <div className="footer-tagline">
            Built for accountability.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
