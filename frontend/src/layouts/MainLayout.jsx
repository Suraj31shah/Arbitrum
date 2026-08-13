import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Zap, 
  Home, 
  Flag, 
  FileCheck, 
  Trophy, 
  BarChart3, 
  Settings, 
  Wallet, 
  LogOut, 
  Menu,
  Plus
} from 'lucide-react';
import { getApiUrl } from '../services/api';
import './MainLayout.css';

const CHARITY_WALLET_ADDRESS = '0x0302CDEF4ab13Ec1b17110110d1A4592B8866b72';

const MainLayout = () => {
  const location = useLocation();
  const [walletAddress, setWalletAddress] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
      window.location.href = '/'; 
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const formattedAddress = walletAddress 
    ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`
    : null;

  return (
    <div className="app-shell">
      {/* Left Sidebar */}
      <aside className={`app-sidebar ${mobileNavOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <Link to="/" className="brand-logo">
            <Zap className="brand-icon" size={22} />
            <span className="brand-text">CredStreak</span>
          </Link>
          
          <nav className="main-nav">
            <Link 
              to="/dashboard" 
              className={`nav-link ${location.pathname === '/dashboard' || location.pathname === '/' ? 'active' : ''}`}
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
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-header">MY SPACE</div>
          <Link 
            to="/dashboard" 
            className={`sidebar-link ${location.pathname === '/dashboard' || location.pathname === '/' ? 'active' : ''}`}
            onClick={() => setMobileNavOpen(false)}
          >
            <Home className="nav-icon" size={18} />
            <span className="nav-label">Dashboard</span>
          </Link>

          <Link 
            to="/challenges" 
            className={`sidebar-link ${location.pathname === '/challenges' ? 'active' : ''}`}
            onClick={() => setMobileNavOpen(false)}
          >
            <Flag className="nav-icon" size={18} />
            <span className="nav-label">My Challenges</span>
          </Link>

          <Link 
            to="/proofs" 
            className={`sidebar-link ${location.pathname.startsWith('/proof') ? 'active' : ''}`}
            onClick={() => setMobileNavOpen(false)}
          >
            <FileCheck className="nav-icon" size={18} />
            <span className="nav-label">Proofs</span>
          </Link>

          <a href="#achievements" className="sidebar-link disabled-link" onClick={e => e.preventDefault()}>
            <Trophy className="nav-icon" size={18} />
            <span className="nav-label">Achievements</span>
          </a>

          <a href="#analytics" className="sidebar-link disabled-link" onClick={e => e.preventDefault()}>
            <BarChart3 className="nav-icon" size={18} />
            <span className="nav-label">Analytics</span>
          </a>

          <div className="sidebar-section-header mt-4">COMMUNITY</div>
          <Link 
            to="/challenges" 
            className="sidebar-link"
            onClick={() => setMobileNavOpen(false)}
          >
            <Flag className="nav-icon" size={18} />
            <span className="nav-label">Explore Challenges</span>
          </Link>

          {walletAddress?.toLowerCase() === CHARITY_WALLET_ADDRESS.toLowerCase() && (
            <Link 
              to="/charity" 
              className={`sidebar-link ${location.pathname === '/charity' ? 'active' : ''}`}
              onClick={() => setMobileNavOpen(false)}
            >
              <Zap className="nav-icon" size={18} />
              <span className="nav-label">Charity</span>
            </Link>
          )}

          <div className="sidebar-section-header mt-4">SETTINGS</div>
          <a href="#settings" className="sidebar-link disabled-link" onClick={e => e.preventDefault()}>
            <Settings className="nav-icon" size={18} />
            <span className="nav-label">Settings</span>
          </a>
        </nav>

        {/* Sidebar Footer & Connected Wallet Widget */}
        <div className="sidebar-bottom">
          {walletAddress ? (
            <div className="wallet-widget">
              <div className="wallet-widget-header">
                <Wallet className="eth-icon" size={15} />
                <span className="wallet-status-label">Connected Wallet</span>
              </div>
              <div className="wallet-address-row">
                <span className="wallet-address-text">{formattedAddress}</span>
                <button onClick={handleLogout} className="wallet-disconnect-btn" title="Logout">
                  <LogOut size={14} />
>>>>>>> origin/drashti-ui
                </button>
              </div>
            </div>
          ) : (
            <div className="wallet-widget un-connected" onClick={handleConnectWallet}>
              <Wallet className="eth-icon" size={15} />
              <span className="wallet-status-label">Click to Connect Wallet</span>
            </div>
          )}

          <div className="sidebar-copyright">
            &copy; {new Date().getFullYear()} CredStreak<br/>Built for accountability.
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="app-main-wrapper">
        {/* Top Header */}
        <header className="top-header">
          <div className="mobile-header-left">
            <button className="mobile-menu-toggle" onClick={() => setMobileNavOpen(!mobileNavOpen)}>
              <Menu size={20} />
            </button>
            <Link to="/" className="mobile-brand">
              CredStreak
            </Link>
          </div>

          <div className="top-header-title-block desktop-only">
            <h1 className="top-page-title">Dashboard</h1>
            <p className="top-page-subtitle">
              Your accountability at a glance.
            </p>
          </div>

          <div className="top-header-actions">
            {walletAddress ? (
              <div className="wallet-pill-button">
                <Wallet size={14} className="wallet-pill-icon" />
                <span className="wallet-pill-text">{formattedAddress}</span>
              </div>
            ) : (
              <button onClick={handleConnectWallet} className="btn btn-secondary">
                Connect Wallet
              </button>
            )}

            <Link to="/challenges/new" className="btn btn-primary">
              <Plus size={16} /> New Challenge
            </Link>
          </div>
        </header>

        {/* Outlet Content */}
        <main className="main-content-body">
          <Outlet context={{ walletAddress, currentUser }} />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
