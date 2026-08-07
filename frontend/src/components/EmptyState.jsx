import React from 'react';
import { Link } from 'react-router-dom';

const EmptyState = ({ title, message, actionText, actionLink }) => {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-8)',
    textAlign: 'center',
    backgroundColor: 'var(--bg-card)',
    border: '1px dashed var(--border)',
    borderRadius: 'var(--radius-lg)',
    minHeight: '300px'
  };

  const titleStyle = {
    fontSize: '1.25rem',
    marginBottom: 'var(--space-2)',
    color: 'var(--text-primary)'
  };

  const messageStyle = {
    color: 'var(--text-secondary)',
    marginBottom: 'var(--space-6)',
    maxWidth: '400px'
  };

  return (
    <div style={containerStyle}>
      <h3 style={titleStyle}>{title}</h3>
      <p style={messageStyle}>{message}</p>
      {actionLink && actionText && (
        <Link to={actionLink} className="btn btn-primary">
          {actionText}
        </Link>
      )}
    </div>
  );
};

export default EmptyState;
