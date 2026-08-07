import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: 'var(--space-4)',
      background: 'radial-gradient(circle at center, var(--bg-card) 0%, var(--bg-primary) 100%)'
    }}>
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <div style={{ 
          fontSize: '4rem', 
          color: 'var(--accent)',
          marginBottom: 'var(--space-4)'
        }}>⌘</div>
        <h1 style={{ 
          fontSize: '3.5rem', 
          marginBottom: 'var(--space-4)',
          background: 'linear-gradient(to right, #fff, #a3a3a3)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Commit. Stake. Prove. Grow.
        </h1>
        <p style={{ 
          fontSize: '1.25rem', 
          color: 'var(--text-secondary)',
          maxWidth: '600px',
          margin: '0 auto var(--space-8)'
        }}>
          Real accountability requires real consequences. Turn your goals into commitments 
          by staking ETH. Complete it, prove it, and become your better self.
        </p>
        <Link to="/dashboard" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}>
          Enter App
        </Link>
      </div>
    </div>
  );
};

export default LandingPage;
