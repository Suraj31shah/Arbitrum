import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Flag, 
  FileCheck, 
  Trophy, 
  BarChart3, 
  Settings, 
  Wallet, 
  LogOut, 
  Menu,
  Plus,
  Target,
  Heart
} from 'lucide-react';
import Logo from '../components/Logo';
import { getApiUrl } from '../services/api';
import './MainLayout.css';

const CHARITY_WALLET_ADDRESS = '0x0302CDEF4ab13Ec1b17110110d1A4592B8866b72';

const MainLayout = () => {
  const location = useLocation();
  const [walletAddress, setWalletAddress] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('commitx-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, [location.pathname]);

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
      
      const response = await fetch(`${getApiUrl()}/api/auth/wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ walletAddress: address, signature })
      });
      
      if (response.ok) {
        setWalletAddress(address);
        const data = await response.json();
        if (data.user) setCurrentUser(data.user);
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
  const isDiscoverPage = location.pathname.startsWith('/discover');
  const isSettingsPage = location.pathname.startsWith('/settings');
  const isAchievementsPage = location.pathname.startsWith('/achievements');
  const isAnalyticsPage = location.pathname.startsWith('/analytics');

  return (
    <div className="app-shell">
      {/* Left Sidebar */}
      <aside className={`app-sidebar ${mobileNavOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <Link to="/" className="brand-logo">
            <Logo width={40} height={40} className="brand-icon-svg" />
            <span className="brand-text" style={{ marginLeft: '4px' }}>Commit<span style={{ color: 'var(--accent)' }}>X</span></span>
          </Link>
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
            to="/dashboard#my-challenges" 
            className={`sidebar-link ${location.pathname.startsWith('/challenges') ? 'active' : ''}`}
            onClick={() => {
              setMobileNavOpen(false);
              if (location.pathname === '/dashboard') {
                document.getElementById('my-challenges')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            <Target className="nav-icon" size={18} />
            <span className="nav-label">My Challenges</span>
          </Link>

          <Link 
            to="/dashboard#recent-activity" 
            className={`sidebar-link ${location.pathname.startsWith('/proof') ? 'active' : ''}`}
            onClick={() => {
              setMobileNavOpen(false);
              if (location.pathname === '/dashboard') {
                document.getElementById('recent-activity')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            <FileCheck className="nav-icon" size={18} />
            <span className="nav-label">Recent Activity</span>
          </Link>

          <Link 
            to="/achievements" 
            className={`sidebar-link ${isAchievementsPage ? 'active' : ''}`}
            onClick={() => setMobileNavOpen(false)}
          >
            <Trophy className="nav-icon" size={18} />
            <span className="nav-label">Achievements</span>
          </Link>

          <Link 
            to="/analytics" 
            className={`sidebar-link ${isAnalyticsPage ? 'active' : ''}`}
            onClick={() => setMobileNavOpen(false)}
          >
            <BarChart3 className="nav-icon" size={18} />
            <span className="nav-label">Analytics</span>
          </Link>

          <div className="sidebar-section-header mt-4">COMMUNITY</div>
          <Link 
            to="/discover" 
            className={`sidebar-link ${location.pathname.startsWith('/discover') ? 'active' : ''}`}
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
              <Heart className="nav-icon" size={18} />
              <span className="nav-label">Charity</span>
            </Link>
          )}

          <div className="sidebar-section-header mt-4">SETTINGS</div>
          <Link 
            to="/settings" 
            className={`sidebar-link ${location.pathname.startsWith('/settings') ? 'active' : ''}`}
            onClick={() => setMobileNavOpen(false)}
          >
            <Settings className="nav-icon" size={18} />
            <span className="nav-label">Settings</span>
          </Link>
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
            &copy; {new Date().getFullYear()} CommitX<br/>Built for accountability.
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
            <Link to="/" className="mobile-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Logo width={20} height={20} />
              CommitX
            </Link>
          </div>

          <div className="top-header-title-block desktop-only">
            <h1 className="top-page-title">
              {isSettingsPage
                ? 'Settings'
                : isDiscoverPage
                ? 'Discover Challenges'
                : isAchievementsPage
                ? 'Achievements'
                : isAnalyticsPage
                ? 'Analytics'
                : 'Dashboard'}
            </h1>
            <p className="top-page-subtitle">
              {isSettingsPage
                ? 'Manage your CommitX preferences.'
                : isDiscoverPage
                ? 'Find a challenge. Put something on the line.'
                : isAchievementsPage
                ? 'Earn badges for consistency, streaks, and proof verification.'
                : isAnalyticsPage
                ? 'Your performance and staking metrics at a glance.'
                : 'Your accountability at a glance.'}
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
          <Outlet context={{ walletAddress, currentUser, handleLogout }} />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
