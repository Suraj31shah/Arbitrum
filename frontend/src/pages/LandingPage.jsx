import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Menu, X } from 'lucide-react';
import Logo from '../components/Logo';
import { api, getApiUrl } from '../services/api';
import ChallengeCard from '../components/ChallengeCard';
import './LandingPage.css';

/* ─── Among Us–style SVG Crewmates ─── */
const Crewmate = ({ color = '#22d3ee', visorColor = '#67e8f9', size = 120, style = {}, className = '' }) => (
  <svg width={size} height={size * 1.2} viewBox="0 0 100 120" fill="none" className={`crewmate ${className}`} style={style}>
    {/* Body */}
    <path d="M25 85 C25 45, 25 25, 50 20 C75 25, 75 45, 75 85 L70 90 L70 110 L58 110 L58 90 L42 90 L42 110 L30 110 L30 90 Z" fill={color} />
    {/* Backpack */}
    <rect x="12" y="45" width="16" height="30" rx="8" fill={color} opacity="0.8" />
    {/* Visor */}
    <ellipse cx="58" cy="48" rx="18" ry="14" fill={visorColor} opacity="0.9" />
    <ellipse cx="60" cy="46" rx="6" ry="4" fill="white" opacity="0.4" />
    {/* Shadow under body */}
    <ellipse cx="50" cy="115" rx="22" ry="4" fill="black" opacity="0.15" />
  </svg>
);

/* Crewmate with raised arms (celebrating) */
const CrewmateCelebrating = ({ color = '#a855f7', visorColor = '#c084fc', size = 120, style = {}, className = '' }) => (
  <svg width={size} height={size * 1.4} viewBox="0 0 100 140" fill="none" className={`crewmate ${className}`} style={style}>
    {/* Left arm up */}
    <rect x="15" y="15" width="10" height="35" rx="5" fill={color} transform="rotate(-30 20 32)" />
    {/* Right arm up */}
    <rect x="70" y="10" width="10" height="35" rx="5" fill={color} transform="rotate(30 75 27)" />
    {/* Body */}
    <path d="M25 95 C25 55, 25 35, 50 30 C75 35, 75 55, 75 95 L70 100 L70 120 L58 120 L58 100 L42 100 L42 120 L30 120 L30 100 Z" fill={color} />
    {/* Backpack */}
    <rect x="12" y="55" width="16" height="30" rx="8" fill={color} opacity="0.8" />
    {/* Visor */}
    <ellipse cx="58" cy="58" rx="18" ry="14" fill={visorColor} opacity="0.9" />
    <ellipse cx="60" cy="56" rx="6" ry="4" fill="white" opacity="0.4" />
    {/* Confetti */}
    <rect x="10" y="5" width="4" height="8" rx="2" fill="#fbbf24" transform="rotate(15 12 9)" />
    <rect x="82" y="8" width="4" height="8" rx="2" fill="#f472b6" transform="rotate(-20 84 12)" />
    <rect x="45" y="2" width="4" height="8" rx="2" fill="#34d399" />
    <circle cx="30" cy="12" r="3" fill="#818cf8" />
    <circle cx="72" cy="3" r="3" fill="#fb923c" />
    {/* Shadow */}
    <ellipse cx="50" cy="128" rx="22" ry="4" fill="black" opacity="0.15" />
  </svg>
);

/* Crewmate with coin */
const CrewmateStaking = ({ color = '#f87171', visorColor = '#fca5a5', size = 120, style = {}, className = '' }) => (
  <svg width={size} height={size * 1.3} viewBox="0 0 120 135" fill="none" className={`crewmate ${className}`} style={style}>
    {/* Arm holding coin */}
    <rect x="72" y="40" width="10" height="30" rx="5" fill={color} transform="rotate(20 77 55)" />
    {/* Coin */}
    <circle cx="95" cy="35" r="12" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" />
    <text x="95" y="40" textAnchor="middle" fill="#92400e" fontSize="14" fontWeight="bold">Ξ</text>
    {/* Body */}
    <path d="M30 90 C30 50, 30 30, 55 25 C80 30, 80 50, 80 90 L75 95 L75 115 L63 115 L63 95 L47 95 L47 115 L35 115 L35 95 Z" fill={color} />
    {/* Backpack */}
    <rect x="17" y="50" width="16" height="30" rx="8" fill={color} opacity="0.8" />
    {/* Visor */}
    <ellipse cx="63" cy="53" rx="18" ry="14" fill={visorColor} opacity="0.9" />
    <ellipse cx="65" cy="51" rx="6" ry="4" fill="white" opacity="0.4" />
    {/* Shadow */}
    <ellipse cx="55" cy="122" rx="22" ry="4" fill="black" opacity="0.15" />
  </svg>
);

/* Crewmate working at desk */
const CrewmateWorking = ({ color = '#fbbf24', visorColor = '#fde68a', size = 120, style = {}, className = '' }) => (
  <svg width={size} height={size * 1.3} viewBox="0 0 140 140" fill="none" className={`crewmate ${className}`} style={style}>
    {/* Desk */}
    <rect x="15" y="88" width="110" height="6" rx="2" fill="#475569" />
    <rect x="25" y="94" width="6" height="25" rx="1" fill="#334155" />
    <rect x="109" y="94" width="6" height="25" rx="1" fill="#334155" />
    {/* Laptop on desk */}
    <rect x="55" y="72" width="40" height="16" rx="2" fill="#1e293b" />
    <rect x="57" y="74" width="36" height="12" rx="1" fill="#3b82f6" opacity="0.6" />
    <rect x="50" y="88" width="50" height="3" rx="1" fill="#334155" />
    {/* Body (sitting) */}
    <path d="M40 88 C40 60, 40 42, 58 38 C76 42, 76 60, 76 88 Z" fill={color} />
    {/* Backpack */}
    <rect x="28" y="52" width="14" height="26" rx="7" fill={color} opacity="0.8" />
    {/* Visor */}
    <ellipse cx="66" cy="55" rx="15" ry="12" fill={visorColor} opacity="0.9" />
    <ellipse cx="68" cy="53" rx="5" ry="3.5" fill="white" opacity="0.4" />
    {/* Arm on desk */}
    <rect x="70" y="68" width="8" height="22" rx="4" fill={color} transform="rotate(15 74 79)" />
  </svg>
);

/* Dead crewmate (failed) */
const CrewmateDead = ({ color = '#64748b', size = 80, style = {}, className = '' }) => (
  <svg width={size} height={size * 0.6} viewBox="0 0 100 60" fill="none" className={`crewmate ${className}`} style={style}>
    {/* Half body (dead) */}
    <path d="M10 55 C10 30, 20 15, 40 10 C55 15, 60 30, 60 55 Z" fill={color} />
    {/* Visor */}
    <ellipse cx="48" cy="28" rx="14" ry="10" fill="#94a3b8" opacity="0.7" />
    {/* Bone */}
    <rect x="55" y="40" width="30" height="5" rx="2.5" fill="#e2e8f0" />
    <circle cx="55" cy="37" r="4" fill="#e2e8f0" />
    <circle cx="55" cy="48" r="4" fill="#e2e8f0" />
    <circle cx="85" cy="37" r="4" fill="#e2e8f0" />
    <circle cx="85" cy="48" r="4" fill="#e2e8f0" />
    {/* X eyes on visor */}
    <text x="48" y="32" textAnchor="middle" fill="#1e293b" fontSize="10" fontWeight="bold">✕</text>
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

  const displayChallenges = challenges.length >= 3
    ? challenges.slice(0, 3)
    : (challenges.length > 0
        ? [...challenges, ...fallbackChallenges].slice(0, 3)
        : fallbackChallenges);

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
            <a href="#challenges-section" onClick={() => setMobileMenuOpen(false)}>Challenges</a>
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
            Promises are easy.<br />
            <span className="hero-highlight">Keeping them is hard.</span>
          </h1>
          <p className="hero-sub">
            What if breaking a promise to yourself actually cost you something?
            CommitX turns your goals into commitments backed by real stakes.
            Complete what you promised — or lose what you put up.
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
          <Crewmate color="#22d3ee" visorColor="#67e8f9" size={90} className="hero-crew hero-crew-1" />
          <CrewmateStaking color="#f87171" visorColor="#fca5a5" size={90} className="hero-crew hero-crew-2" />
          <CrewmateWorking color="#fbbf24" visorColor="#fde68a" size={100} className="hero-crew hero-crew-3" />
          <CrewmateCelebrating color="#a855f7" visorColor="#c084fc" size={85} className="hero-crew hero-crew-4" />
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
            <Crewmate color="#22d3ee" visorColor="#67e8f9" size={140} className="scene-character" />
            <div className="thought-bubble">
              <span>"I'll exercise every day this week."</span>
            </div>
          </div>
          <div className="scene-text">
            <div className="scene-step">Step 1</div>
            <h2>You make a promise to yourself.</h2>
            <p>
              We all do it. "I'll study harder." "I'll ship that feature."
              "I'll run every morning." But without consequences,
              most promises quietly die by Wednesday.
            </p>
          </div>
        </div>

        {/* Scene 2: Put skin in the game */}
        <div className="story-scene scene-reverse" ref={el => storyRefs.current[1] = el}>
          <div className="scene-illustration">
            <CrewmateStaking color="#f87171" visorColor="#fca5a5" size={150} className="scene-character" />
            <div className="coin-trail">
              <div className="floating-coin">Ξ</div>
              <div className="floating-coin delay-1">Ξ</div>
              <div className="floating-coin delay-2">Ξ</div>
            </div>
          </div>
          <div className="scene-text">
            <div className="scene-step">Step 2</div>
            <h2>Put something real on the line.</h2>
            <p>
              You stake a small amount of ETH on your commitment.
              Not a lot — just enough that breaking your promise
              actually stings. Now it's not just words. It's a contract
              with yourself.
            </p>
          </div>
        </div>

        {/* Scene 3: Do the work */}
        <div className="story-scene" ref={el => storyRefs.current[2] = el}>
          <div className="scene-illustration">
            <CrewmateWorking color="#fbbf24" visorColor="#fde68a" size={160} className="scene-character" />
          </div>
          <div className="scene-text">
            <div className="scene-step">Step 3</div>
            <h2>Actually do the work.</h2>
            <p>
              You have a deadline. You have skin in the game.
              Now the only thing left is to show up and do what
              you said you'd do. When you're done, submit your proof —
              a screenshot, a photo, a commit log, whatever fits.
            </p>
          </div>
        </div>

        {/* Scene 4: The Outcome */}
        <div className="story-scene scene-reverse" ref={el => storyRefs.current[3] = el}>
          <div className="scene-illustration scene-outcome">
            <div className="outcome-winner">
              <CrewmateCelebrating color="#a855f7" visorColor="#c084fc" size={120} className="scene-character" />
              <span className="outcome-label win">Completed ✓</span>
            </div>
            <div className="outcome-loser">
              <CrewmateDead color="#64748b" size={80} className="scene-character dead-mate" />
              <span className="outcome-label lose">Gave up ✕</span>
            </div>
          </div>
          <div className="scene-text">
            <div className="scene-step">Step 4</div>
            <h2>Winners take the pool.</h2>
            <p>
              If you complete the challenge, you get your stake back —
              plus a share of the stakes from everyone who didn't finish.
              If nobody finishes, the pool goes to charity.
              Simple. Fair. Motivating.
            </p>
          </div>
        </div>

        {/* Connection line between scenes */}
        <div className="story-line" aria-hidden="true" />
      </section>


      {/* ─── The Point ─── */}
      <section className="the-point" ref={el => storyRefs.current[4] = el}>
        <div className="the-point-inner">
          <h2>It's not about the money.</h2>
          <p>
            It's about the person you become when you actually
            follow through. The ETH is just the nudge. The real reward
            is proving to yourself that you can keep a promise.
          </p>
        </div>
      </section>


      {/* ─── Live Challenges ─── */}
      <section id="challenges-section" className="challenges-section" ref={el => storyRefs.current[5] = el}>
        <div className="challenges-inner">
          <h2>Jump into a challenge.</h2>
          <p className="challenges-sub">
            These are real commitments from real people. Pick one, stake your ETH, and prove yourself.
          </p>
          <div className="challenges-grid">
            {displayChallenges.map(challenge => (
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
      <section className="final-cta" ref={el => storyRefs.current[6] = el}>
        <h2>Ready to stop making excuses?</h2>
        <p>Your next commitment starts now.</p>
        <div className="final-cta-actions">
          {walletAddress ? (
            <Link to="/challenges/new" className="btn-primary-landing">Create a Challenge</Link>
          ) : (
            <button onClick={handleConnectWallet} className="btn-primary-landing">
              Connect Wallet & Start
            </button>
          )}
        </div>
        <div className="final-characters">
          <Crewmate color="#22d3ee" visorColor="#67e8f9" size={60} />
          <CrewmateStaking color="#f87171" visorColor="#fca5a5" size={60} />
          <CrewmateWorking color="#fbbf24" visorColor="#fde68a" size={65} />
          <CrewmateCelebrating color="#a855f7" visorColor="#c084fc" size={55} />
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
