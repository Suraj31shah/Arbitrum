import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'radial-gradient(circle at center top, var(--bg-card) 0%, var(--bg-primary) 100%)',
      overflow: 'hidden'
    }}>
      <div className="container" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-8)' }}>
        
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }} className="animate-slide-in">
          <div style={{ 
            fontSize: '4rem', 
            color: 'var(--accent)',
            marginBottom: 'var(--space-4)',
            display: 'inline-block'
          }} className="animate-pulse">⌘</div>
          
          <h1 style={{ 
            fontSize: '4rem', 
            marginBottom: 'var(--space-4)',
            background: 'linear-gradient(to right, #fff, #a3a3a3)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.03em',
            lineHeight: '1.1'
          }}>
            Public accountability,<br />backed by real stakes.
          </h1>
          
          <p style={{ 
            fontSize: '1.25rem', 
            color: 'var(--text-secondary)',
            maxWidth: '650px',
            margin: '0 auto var(--space-8)',
            lineHeight: '1.6'
          }}>
            Join challenges, put ETH on the line, and prove your commitment. 
            Succeed to earn your stake back and a share of the pool. Fail, and your funds go to the winners.
          </p>
          
          <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center' }}>
            <Link to="/discover" className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.125rem' }}>
              Explore Challenges
            </Link>
            <Link to="/dashboard" className="btn btn-secondary" style={{ padding: '1rem 2.5rem', fontSize: '1.125rem' }}>
              Open Dashboard
            </Link>
          </div>
        </div>

        {/* How it Works */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 'var(--space-6)',
          marginTop: 'var(--space-8)',
          borderTop: '1px solid var(--border)',
          paddingTop: 'var(--space-8)'
        }}>
          <div className="card" style={{ background: 'transparent', border: 'none', padding: 0 }}>
            <div style={{ color: 'var(--accent)', fontSize: '2rem', marginBottom: 'var(--space-2)' }}>1.</div>
            <h3 style={{ marginBottom: 'var(--space-2)' }}>Join & Stake</h3>
            <p className="text-muted">Pick a challenge and commit your ETH to a shared pool.</p>
          </div>
          
          <div className="card" style={{ background: 'transparent', border: 'none', padding: 0 }}>
            <div style={{ color: 'var(--info)', fontSize: '2rem', marginBottom: 'var(--space-2)' }}>2.</div>
            <h3 style={{ marginBottom: 'var(--space-2)' }}>Do the Work</h3>
            <p className="text-muted">Complete the challenge before the deadline.</p>
          </div>
          
          <div className="card" style={{ background: 'transparent', border: 'none', padding: 0 }}>
            <div style={{ color: '#a855f7', fontSize: '2rem', marginBottom: 'var(--space-2)' }}>3.</div>
            <h3 style={{ marginBottom: 'var(--space-2)' }}>Submit Proof</h3>
            <p className="text-muted">Our AI verifies your submission objectively.</p>
          </div>
          
          <div className="card" style={{ background: 'transparent', border: 'none', padding: 0 }}>
            <div style={{ color: 'var(--warning)', fontSize: '2rem', marginBottom: 'var(--space-2)' }}>4.</div>
            <h3 style={{ marginBottom: 'var(--space-2)' }}>Win the Pool</h3>
            <p className="text-muted">Winners split the stakes of those who failed. If everyone fails, it goes to charity.</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LandingPage;
