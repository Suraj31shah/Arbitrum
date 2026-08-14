import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Menu, X } from 'lucide-react';
import Logo from '../components/Logo';
import { api, getApiUrl } from '../services/api';
import ChallengeCard from '../components/ChallengeCard';
import SplitRealityHero from '../components/SplitRealityHero';
import { 
  Crewmate, 
  CrewmateStaking, 
  CrewmateWorking, 
  CrewmateCelebrating, 
  CrewmateDead 
} from '../components/Crewmates';
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
      
      // 1. Fetch nonce
      const nonceRes = await fetch(`${getApiUrl()}/api/auth/nonce`, { credentials: 'include' });
      if (!nonceRes.ok) throw new Error("Failed to get nonce");
      const { nonce } = await nonceRes.json();
      
      // 2. Request signature
      const message = `Sign this message to authenticate with CommitX.\nNonce: ${nonce}`;
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, address],
      });

      // 3. Authenticate
      const response = await fetch(`${getApiUrl()}/api/auth/wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ walletAddress: address, signature })
      });
      
      if (response.ok) {
        setWalletAddress(address);
        navigate('/dashboard');
      } else {
        const errData = await response.json();
        alert(errData.error || "Failed to login with wallet");
      }
    } catch (err) {
      console.error(err);
      if (err.code === 4001) {
        alert("Signature rejected. Login cancelled.");
      } else {
        alert("An error occurred during login.");
      }
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

        <div className="hero-animation-wrapper">
          <SplitRealityHero />
        </div>

        <div className="scroll-indicator">
          <p>Scroll to see how it works</p>
          <div className="scroll-arrow">↓</div>
        </div>
      </section>

      {/* ─── Scroll Storytelling ─── */}
      <section id="story" className="story-section">

        {/* Scene 1: The Promise */}
        <div className="story-scene" ref={el => storyRefs.current[0] = el}>
          <div className="scene-illustration">
            <Crewmate color="#0ea5e9" size={160} />
          </div>
          <div className="scene-text">
            <h2>You already know what to do.</h2>
            <p>
              Ship the project. Run 5 km. Study. 
              The hard part isn't knowing. <strong>It's doing it when nobody is watching.</strong>
            </p>
          </div>
        </div>

        {/* Scene 2: Put skin in the game */}
        <div className="story-scene scene-reverse" ref={el => storyRefs.current[1] = el}>
          <div className="scene-illustration">
            <CrewmateStaking color="#f43f5e" size={160} />
          </div>
          <div className="scene-text">
            <h2>Make yourself a deal.</h2>
            <p>
              Set the deadline and put ETH on the line. 
              Then get out of your own way and do the work.
            </p>
          </div>
        </div>

        {/* Scene 3: The consequence */}
        <div className="story-scene" ref={el => storyRefs.current[2] = el}>
          <div className="scene-illustration">
            <CrewmateDead color="#52525b" size={140} />
          </div>
          <div className="scene-text">
            <h2>Breaking it costs you.</h2>
            <p>
              Finish your commitment → <strong>get your stake back.</strong><br/>
              Don't → <strong>it goes to those who did.</strong>
            </p>
          </div>
        </div>

        {/* Scene 4: Proof */}
        <div className="story-scene scene-reverse" ref={el => storyRefs.current[3] = el}>
          <div className="scene-illustration">
            <CrewmateWorking color="#f59e0b" size={160} />
          </div>
          <div className="scene-text">
            <h2>No judges. Just proof.</h2>
            <p>
              A GitHub commit. A fitness record. A screenshot. 
              Your promise starts the challenge. Your proof finishes it.
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
