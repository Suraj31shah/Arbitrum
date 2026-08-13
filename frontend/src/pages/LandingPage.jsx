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
              <span className="nav-dot">•</span> Features
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
              <Link to="/dashboard" className="btn-hero-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                Dashboard
              </Link>
            ) : (
              <button onClick={handleConnectWallet} className="btn-hero-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                Connect Wallet
              </button>
            )}

            <button className="mobile-menu-toggle-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section id="how-it-works" className="landing-hero-section">
        <div className="landing-hero-left">
          <div className="hero-badge">
            <Sparkles size={14} className="hero-badge-icon" /> 
            <span>Welcome to the Future of Accountability</span>
          </div>

          <h1 className="hero-main-heading">
            Public accountability,<br />
            <span className="text-gradient">backed by stakes.</span>
          </h1>

          <p className="hero-main-subtext">
            Join challenges, put ETH on the line, and prove your commitment. 
            Succeed to earn your stake back and a share of the pool. Fail, and your funds go to the winners.
          </p>

          <div className="hero-action-buttons">
            {walletAddress ? (
              <Link to="/dashboard" className="btn-hero-primary">
                Open Dashboard <ArrowRight size={18} />
              </Link>
            ) : (
              <button onClick={handleConnectWallet} className="btn-hero-primary">
                Connect Wallet <ArrowRight size={18} />
              </button>
            )}
            <Link to="/discover" className="btn-hero-secondary">
              Explore Challenges
            </Link>
          </div>

          <div className="hero-value-props">
            <span className="hero-value-item">
              <CheckSquare size={16} className="value-icon-green" /> Set Goals
            </span>
            <span className="hero-value-dot">•</span>
            <span className="hero-value-item">
              <ShieldCheck size={16} className="value-icon-purple" /> Verifiable Proof
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

      {/* 3. METRICS / STATS BANNER ROW */}
      <section className="landing-stats-container">
        <div className="stats-banner-card">
          <div className="stat-item-block">
            <div className="stat-icon-circle circle-green">
              <Users size={22} />
            </div>
            <div>
              <div className="stat-num-text">12K+</div>
              <div className="stat-label-text">Active Users</div>
            </div>
          </div>

          <div className="stat-item-block">
            <div className="stat-icon-circle circle-purple">
              <Zap size={22} />
            </div>
            <div>
              <div className="stat-num-text">3.6K+</div>
              <div className="stat-label-text">Challenges Created</div>
            </div>
          </div>

          <div className="stat-item-block">
            <div className="stat-icon-circle circle-green">
              <Coins size={22} />
            </div>
            <div>
              <div className="stat-num-text">256 ETH</div>
              <div className="stat-label-text">Total Staked</div>
            </div>
          </div>

          <div className="stat-item-block">
            <div className="stat-icon-circle circle-gold">
              <Trophy size={22} />
            </div>
            <div>
              <div className="stat-num-text">89%</div>
              <div className="stat-label-text">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. "WHY CREDSTREAK?" SECTION */}
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

      {/* 5. COMMUNITY CHALLENGES SECTION */}
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
          <Link to="/discover" className="explore-more-link">
            Explore All Challenges <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* 6. FINAL CTA */}
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
            <Link to="/discover" className="btn-hero-secondary">
              Explore Challenges
            </Link>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer id="about" className="landing-footer">
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
