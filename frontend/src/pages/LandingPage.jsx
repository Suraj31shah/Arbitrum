import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Menu, X } from 'lucide-react';
import Logo from '../components/Logo';
import { api, getApiUrl } from '../services/api';
import ChallengeCard from '../components/ChallengeCard';
import './LandingPage.css';

/* ─── Accurate Among Us–style SVG Crewmates ─── */
const Crewmate = ({ color = '#22d3ee', shadowColor = '#0891b2', size = 120, style = {}, className = '' }) => (
  <svg width={size} height={size * 1.2} viewBox="0 0 100 120" fill="none" className={`crewmate ${className}`} style={style}>
    {/* Backpack Shadow & Main */}
    <rect x="8" y="42" width="22" height="42" rx="11" fill={shadowColor} />
    <rect x="12" y="40" width="16" height="42" rx="8" fill={color} />
    
    {/* Body Shadow (Full shape) */}
    <path d="M 25 90 C 25 35, 30 15, 55 15 C 80 15, 85 35, 85 90 L 85 110 A 8 8 0 0 1 69 110 L 69 95 L 41 95 L 41 110 A 8 8 0 0 1 25 110 Z" fill={shadowColor} />
    {/* Body Main (Shifted up and right for shadow effect) */}
    <path d="M 32 90 C 32 40, 35 22, 58 22 C 78 22, 82 40, 82 90 L 82 108 A 6 6 0 0 1 70 108 L 70 92 L 44 92 L 44 108 A 6 6 0 0 1 32 108 Z" fill={color} />
    
    {/* Visor Shadow, Main, and Glare */}
    <rect x="42" y="32" width="46" height="30" rx="15" fill="#385a85" />
    <rect x="45" y="30" width="40" height="26" rx="13" fill="#9dbcd4" />
    <ellipse cx="68" cy="38" rx="10" ry="4" fill="white" transform="rotate(-8 68 38)" />
    
    {/* Ground Shadow */}
    <ellipse cx="55" cy="116" rx="28" ry="4" fill="black" opacity="0.3" />
  </svg>
);

const CrewmateCelebrating = ({ color = '#a855f7', shadowColor = '#7e22ce', size = 120, style = {}, className = '' }) => (
  <svg width={size} height={size * 1.4} viewBox="0 0 100 140" fill="none" className={`crewmate ${className}`} style={style}>
    {/* Backpack */}
    <rect x="8" y="52" width="22" height="42" rx="11" fill={shadowColor} />
    <rect x="12" y="50" width="16" height="42" rx="8" fill={color} />
    
    {/* Left Arm Up */}
    <rect x="10" y="20" width="14" height="40" rx="7" fill={shadowColor} transform="rotate(-30 17 40)" />
    <rect x="14" y="20" width="10" height="38" rx="5" fill={color} transform="rotate(-30 19 39)" />
    
    {/* Right Arm Up */}
    <rect x="75" y="15" width="14" height="40" rx="7" fill={shadowColor} transform="rotate(30 82 35)" />
    <rect x="75" y="15" width="10" height="38" rx="5" fill={color} transform="rotate(30 80 34)" />

    {/* Body */}
    <path d="M 25 100 C 25 45, 30 25, 55 25 C 80 25, 85 45, 85 100 L 85 120 A 8 8 0 0 1 69 120 L 69 105 L 41 105 L 41 120 A 8 8 0 0 1 25 120 Z" fill={shadowColor} />
    <path d="M 32 100 C 32 50, 35 32, 58 32 C 78 32, 82 50, 82 100 L 82 118 A 6 6 0 0 1 70 118 L 70 102 L 44 102 L 44 118 A 6 6 0 0 1 32 118 Z" fill={color} />
    
    {/* Visor */}
    <rect x="42" y="42" width="46" height="30" rx="15" fill="#385a85" />
    <rect x="45" y="40" width="40" height="26" rx="13" fill="#9dbcd4" />
    <ellipse cx="68" cy="48" rx="10" ry="4" fill="white" transform="rotate(-8 68 48)" />
    
    {/* Confetti */}
    <rect x="15" y="5" width="5" height="10" rx="2" fill="#fbbf24" transform="rotate(15 15 5)" />
    <rect x="80" y="8" width="5" height="10" rx="2" fill="#f472b6" transform="rotate(-20 80 8)" />
    <rect x="45" y="2" width="4" height="8" rx="2" fill="#34d399" />
    <circle cx="30" cy="12" r="4" fill="#818cf8" />
    <circle cx="72" cy="3" r="3" fill="#fb923c" />
    
    {/* Ground Shadow */}
    <ellipse cx="55" cy="126" rx="28" ry="4" fill="black" opacity="0.3" />
  </svg>
);

const CrewmateStaking = ({ color = '#f87171', shadowColor = '#b91c1c', size = 120, style = {}, className = '' }) => (
  <svg width={size} height={size * 1.3} viewBox="0 0 120 135" fill="none" className={`crewmate ${className}`} style={style}>
    {/* Arm holding coin */}
    <rect x="75" y="50" width="14" height="35" rx="7" fill={shadowColor} transform="rotate(20 82 67)" />
    <rect x="75" y="50" width="10" height="33" rx="5" fill={color} transform="rotate(20 80 66)" />
    
    {/* Coin */}
    <circle cx="102" cy="45" r="14" fill="#fbbf24" stroke="#d97706" strokeWidth="3" />
    <text x="102" y="51" textAnchor="middle" fill="#92400e" fontSize="16" fontWeight="bold">Ξ</text>
    
    {/* Backpack */}
    <rect x="13" y="47" width="22" height="42" rx="11" fill={shadowColor} />
    <rect x="17" y="45" width="16" height="42" rx="8" fill={color} />
    
    {/* Body */}
    <path d="M 30 95 C 30 40, 35 20, 60 20 C 85 20, 90 40, 90 95 L 90 115 A 8 8 0 0 1 74 115 L 74 100 L 46 100 L 46 115 A 8 8 0 0 1 30 115 Z" fill={shadowColor} />
    <path d="M 37 95 C 37 45, 40 27, 63 27 C 83 27, 87 45, 87 95 L 87 113 A 6 6 0 0 1 75 113 L 75 97 L 49 97 L 49 113 A 6 6 0 0 1 37 113 Z" fill={color} />
    
    {/* Visor */}
    <rect x="47" y="37" width="46" height="30" rx="15" fill="#385a85" />
    <rect x="50" y="35" width="40" height="26" rx="13" fill="#9dbcd4" />
    <ellipse cx="73" cy="43" rx="10" ry="4" fill="white" transform="rotate(-8 73 43)" />
    
    {/* Ground Shadow */}
    <ellipse cx="60" cy="121" rx="28" ry="4" fill="black" opacity="0.3" />
  </svg>
);

const CrewmateWorking = ({ color = '#fbbf24', shadowColor = '#b45309', size = 120, style = {}, className = '' }) => (
  <svg width={size} height={size * 1.3} viewBox="0 0 140 140" fill="none" className={`crewmate ${className}`} style={style}>
    {/* Desk */}
    <rect x="15" y="88" width="110" height="8" rx="3" fill="#3f3f46" />
    <rect x="25" y="96" width="8" height="25" rx="2" fill="#27272a" />
    <rect x="107" y="96" width="8" height="25" rx="2" fill="#27272a" />
    
    {/* Laptop on desk */}
    <rect x="55" y="70" width="40" height="18" rx="3" fill="#18181b" />
    <rect x="58" y="73" width="34" height="12" rx="1" fill="#0ea5e9" opacity="0.8" />
    <rect x="50" y="88" width="50" height="4" rx="2" fill="#27272a" />
    
    {/* Body (sitting) */}
    <path d="M 35 88 C 35 50, 35 30, 58 25 C 80 30, 80 50, 80 88 Z" fill={shadowColor} />
    <path d="M 40 88 C 40 55, 42 35, 60 32 C 75 35, 75 55, 75 88 Z" fill={color} />
    
    {/* Backpack */}
    <rect x="22" y="47" width="18" height="34" rx="9" fill={shadowColor} />
    <rect x="26" y="45" width="12" height="34" rx="6" fill={color} />
    
    {/* Visor */}
    <rect x="57" y="42" width="38" height="26" rx="13" fill="#385a85" />
    <rect x="60" y="40" width="32" height="22" rx="11" fill="#9dbcd4" />
    <ellipse cx="78" cy="46" rx="8" ry="3" fill="white" transform="rotate(-8 78 46)" />
    
    {/* Arm on desk */}
    <rect x="65" y="65" width="12" height="26" rx="6" fill={shadowColor} transform="rotate(15 71 78)" />
    <rect x="67" y="65" width="8" height="24" rx="4" fill={color} transform="rotate(15 71 77)" />
  </svg>
);

const CrewmateDead = ({ color = '#52525b', shadowColor = '#27272a', size = 80, style = {}, className = '' }) => (
  <svg width={size} height={size * 0.75} viewBox="0 0 100 75" fill="none" className={`crewmate ${className}`} style={style}>
    {/* Half body (dead) */}
    <path d="M 15 65 C 15 40, 25 25, 45 20 C 60 25, 65 40, 65 65 Z" fill={shadowColor} />
    <path d="M 22 65 C 22 45, 30 32, 47 28 C 58 32, 60 45, 60 65 Z" fill={color} />
    
    {/* Bone */}
    <rect x="35" y="10" width="20" height="15" rx="4" fill="#d4d4d8" />
    <circle cx="40" cy="8" r="7" fill="#d4d4d8" />
    <circle cx="50" cy="8" r="7" fill="#d4d4d8" />
    
    {/* Visor on ground */}
    <rect x="60" y="50" width="35" height="18" rx="9" fill="#385a85" transform="rotate(15 77 59)" />
    <rect x="62" y="52" width="31" height="14" rx="7" fill="#71717a" transform="rotate(15 77 59)" />
    
    <text x="75" y="62" textAnchor="middle" fill="#18181b" fontSize="12" fontWeight="900" transform="rotate(15 77 59)">✕</text>
  </svg>
);

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
  const storyRefs = useRef([]);

  /* Scroll-triggered reveal */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('story-visible');
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -60px 0px' }
    );

    storyRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  /* Fetch user & challenges */
  useEffect(() => {
    fetch(`${getApiUrl()}/api/auth/current-user`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.user && data.user.walletAddress) {
          setWalletAddress(data.user.walletAddress);
        }
      })
      .catch(console.error);

    api.getChallenges()
      .then(data => {
        if (Array.isArray(data)) {
          const valid = data.filter(c => c && typeof c === 'object' && c.title);
          if (valid.length > 0) setChallenges(valid);
        }
      })
      .catch(() => {});
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

  return (
    <div className="landing-root">
      {/* ─── Navbar ─── */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <Link to="/" className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Logo width={36} height={36} />
            <span>Commit<span style={{ color: 'var(--accent)' }}>X</span></span>
          </Link>
          <nav className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
            <a href="#story" onClick={() => setMobileMenuOpen(false)}>How it works</a>
            <a href="#challenges-section" onClick={() => setMobileMenuOpen(false)}>Live Challenges</a>
          </nav>
          <div className="nav-actions">
            {walletAddress ? (
              <Link to="/dashboard" className="nav-cta">Dashboard</Link>
            ) : (
              <button onClick={handleConnectWallet} className="nav-cta">Connect Wallet</button>
            )}
            <button className="mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="hero">
        <div className="hero-content">
          <h1>
            You said you'd do it.<br />
            <span className="hero-highlight">Now put something behind it.</span>
          </h1>
          <p className="hero-sub">
            You set the goal. You put something real on the line. 
            Then you either show up — or someone who did gets your stake.
          </p>
          <div className="hero-actions">
            {walletAddress ? (
              <Link to="/dashboard" className="btn-primary-landing">
                Go to Dashboard <ArrowRight size={18} />
              </Link>
            ) : (
              <button onClick={handleConnectWallet} className="btn-primary-landing">
                Start a Commitment <ArrowRight size={18} />
              </button>
            )}
            <a href="#story" className="btn-ghost">See how it works ↓</a>
          </div>
        </div>

        {/* Decorative crewmates in hero */}
        <div className="hero-characters">
          <Crewmate color="#0ea5e9" shadowColor="#0369a1" size={90} className="hero-crew hero-crew-1" />
          <CrewmateStaking color="#f43f5e" shadowColor="#be123c" size={90} className="hero-crew hero-crew-2" />
          <CrewmateWorking color="#f59e0b" shadowColor="#b45309" size={100} className="hero-crew hero-crew-3" />
          <CrewmateCelebrating color="#a855f7" shadowColor="#7e22ce" size={85} className="hero-crew hero-crew-4" />
        </div>
      </section>

      {/* ─── Scroll Storytelling ─── */}
      <section id="story" className="story-section">
        <div className="story-intro">
          <p className="story-intro-text">Here's how it actually works.</p>
        </div>

        {/* Scene 1: The Promise */}
        <div className="story-scene" ref={el => storyRefs.current[0] = el}>
          <div className="scene-illustration">
            <Crewmate color="#0ea5e9" shadowColor="#0369a1" size={140} className="scene-character" />
            <div className="thought-bubble">
              <span>"I'll exercise every day this week."</span>
            </div>
          </div>
          <div className="scene-text">
            <h2>You already know what you need to do.</h2>
            <p>
              Study for the exam. Ship the project. Run 5 km. 
              Finish the thing you've been putting off for three weeks.
              <br/><br/>
              The hard part isn't knowing. <strong>It's doing it when nobody is watching.</strong>
            </p>
          </div>
        </div>

        {/* Scene 2: Put skin in the game */}
        <div className="story-scene scene-reverse" ref={el => storyRefs.current[1] = el}>
          <div className="scene-illustration">
            <CrewmateStaking color="#f43f5e" shadowColor="#be123c" size={150} className="scene-character" />
            <div className="coin-trail">
              <div className="floating-coin">Ξ</div>
              <div className="floating-coin delay-1">Ξ</div>
              <div className="floating-coin delay-2">Ξ</div>
            </div>
          </div>
          <div className="scene-text">
            <h2>So make yourself a deal.</h2>
            <p>
              Pick something you actually want to finish. Set the deadline. 
              Put ETH behind the promise. 
              <br/><br/>
              Then get out of the way and do the work.
            </p>
          </div>
        </div>

        {/* Scene 3: The consequence */}
        <div className="story-scene" ref={el => storyRefs.current[2] = el}>
          <div className="scene-illustration scene-outcome">
            <div className="outcome-winner">
              <CrewmateCelebrating color="#a855f7" shadowColor="#7e22ce" size={120} className="scene-character" />
              <span className="outcome-label win">Completed ✓</span>
            </div>
            <div className="outcome-loser">
              <CrewmateDead color="#52525b" shadowColor="#27272a" size={80} className="scene-character dead-mate" />
              <span className="outcome-label lose">Gave up ✕</span>
            </div>
          </div>
          <div className="scene-text">
            <h2>Because this time, breaking it costs you.</h2>
            <p>
              Everyone who joins puts up the same stake.
              Finish your commitment → <strong>you get your stake back.</strong><br/>
              Don't → <strong>your stake goes to the people who did.</strong>
              <br/><br/>
              And if nobody manages to finish? <strong>It goes to charity.</strong><br/>
              No house. No hidden winner. No one gets paid for simply showing up.
            </p>
          </div>
        </div>

        {/* Scene 4: Proof */}
        <div className="story-scene scene-reverse" ref={el => storyRefs.current[3] = el}>
          <div className="scene-illustration">
            <CrewmateWorking color="#f59e0b" shadowColor="#b45309" size={160} className="scene-character" />
          </div>
          <div className="scene-text">
            <h2>We don't just take your word for it.</h2>
            <p>
              When the deadline arrives, show what you actually did.
              A GitHub commit. A fitness record. A screenshot. Whatever proves the commitment.
              <br/><br/>
              <strong>Your promise starts the challenge.<br/>Your proof finishes it.</strong>
            </p>
          </div>
        </div>

        {/* Connection line between scenes */}
        <div className="story-line" aria-hidden="true" />
      </section>

      {/* ─── Live Challenges ─── */}
      <section id="challenges-section" className="challenges-section" ref={el => storyRefs.current[4] = el}>
        <div className="challenges-inner">
          <h2>Jump into a challenge.</h2>
          <p className="challenges-sub">
            These are real commitments from real people. Pick one, stake your ETH, and prove yourself.
          </p>
          <div className="challenges-grid">
            {(challenges.length > 0 ? challenges : fallbackChallenges).slice(0, 3).map(challenge => (
              <ChallengeCard key={challenge._id} challenge={challenge} />
            ))}
          </div>
          <div className="challenges-cta">
            <Link to="/discover" className="btn-primary-landing">
              See all challenges <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="final-cta" ref={el => storyRefs.current[5] = el}>
        <h2>The money isn't the goal. It's the consequence.</h2>
        <p>So... what are you going to finish? Don't make another to-do list.<br/><strong>Make it a commitment.</strong></p>
        <div className="final-cta-actions">
          {walletAddress ? (
            <Link to="/challenges/new" className="btn-primary-landing">Start a Challenge</Link>
          ) : (
            <button onClick={handleConnectWallet} className="btn-primary-landing">
              Connect Wallet & Start
            </button>
          )}
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} CommitX</span>
        <span className="footer-sep">·</span>
        <span>Built for people who keep their word.</span>
      </footer>
    </div>
  );
};

export default LandingPage;
