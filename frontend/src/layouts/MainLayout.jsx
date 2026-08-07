import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import './MainLayout.css';

const MainLayout = () => {
  const location = useLocation();

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
          </nav>
          
          <div className="header-actions">
            <Link to="/challenges/new" className="btn btn-primary">
              New Challenge
            </Link>
          </div>
        </div>
      </header>

      <main className="layout-main">
        <div className="container">
          <Outlet />
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
