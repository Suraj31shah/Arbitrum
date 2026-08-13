import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { getApiUrl } from '../services/api';
import './MainLayout.css';

const CHARITY_WALLET_ADDRESS = '0x0302CDEF4ab13Ec1b17110110d1A4592B8866b72';

const MainLayout = () => {
  const location = useLocation();
  const [walletAddress, setWalletAddress] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Check if already logged in
    fetch(`${getApiUrl()}/api/auth/current-user`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.user && data.user.walletAddress) {
          setWalletAddress(data.user.walletAddress);
          setCurrentUser(data.user);
        }
      })
      .catch(console.error);
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
      } else {
        alert("Failed to login with wallet");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${getApiUrl()}/api/auth/logout`, { 
        method: 'POST',
        credentials: 'include'
      });
      setWalletAddress(null);
      // Optional: redirect to home or just let the state update reflect the logout
      window.location.href = '/'; 
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <div className="layout-container">
      <header className="layout-header">
        <div className="container header-content">
          <Link to="/" className="brand">
            <span className="brand-icon">⌘</span>
            CommitX
          </Link>
          
          <nav className="main-nav">
            <Link 
              to="/dashboard" 
              className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
            >
              Dashboard
            </Link>
            <Link 
              to="/discover" 
              className={`nav-link ${location.pathname === '/discover' ? 'active' : ''}`}
            >
              Discover
            </Link>
            {walletAddress?.toLowerCase() === CHARITY_WALLET_ADDRESS.toLowerCase() && (
              <Link 
                to="/charity" 
                className={`nav-link ${location.pathname === '/charity' ? 'active' : ''}`}
                style={{ color: 'var(--accent)', fontWeight: 'bold' }}
              >
                Charity
              </Link>
            )}
          </nav>
          
          <div className="header-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {walletAddress ? (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <span style={{ fontFamily: 'monospace', color: 'var(--accent)', background: 'var(--bg-secondary)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-md)' }}>
                  {walletAddress.substring(0,6)}...{walletAddress.substring(walletAddress.length - 4)}
                </span>
                <button onClick={handleLogout} className="btn" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)' }}>
                  Logout
                </button>
              </div>
            ) : (
              <button onClick={handleConnectWallet} className="btn btn-secondary">
                Connect Wallet to Login
              </button>
            )}
            <Link to="/challenges/new" className="btn btn-primary">
              New Challenge
            </Link>
          </div>
        </div>
      </header>

      <main className="layout-main">
        <div className="container">
          <Outlet context={{ walletAddress, currentUser }} />
        </div>
      </main>
      
      <footer className="layout-footer">
        <div className="container text-muted">
          &copy; {new Date().getFullYear()} CommitX. Accountability through stake and proof.
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
