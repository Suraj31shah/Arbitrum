import React from 'react';

const StatusBadge = ({ status }) => {
  let config = {
    label: status,
    bg: 'var(--bg-secondary)',
    color: 'var(--text-secondary)',
    border: 'var(--border)'
  };

  switch (status) {
    case 'active':
      config = {
        label: 'Active',
        bg: 'var(--warning-bg)',
        color: 'var(--warning)',
        border: 'rgba(245, 158, 11, 0.2)'
      };
      break;
    case 'proof_submitted':
    case 'verifying':
      config = {
        label: 'Verifying',
        bg: 'rgba(59, 130, 246, 0.1)',
        color: '#3b82f6',
        border: 'rgba(59, 130, 246, 0.2)'
      };
      break;
    case 'ai_verified':
      config = {
        label: 'Reviewing',
        bg: 'rgba(168, 85, 247, 0.1)',
        color: '#a855f7', // Purple
        border: 'rgba(168, 85, 247, 0.2)'
      };
      break;
    case 'completed':
      config = {
        label: 'Completed',
        bg: 'var(--accent-dim)',
        color: 'var(--accent)',
        border: 'rgba(34, 197, 94, 0.2)'
      };
      break;
    case 'failed':
      config = {
        label: 'Failed',
        bg: 'var(--error-bg)',
        color: 'var(--error)',
        border: 'rgba(239, 68, 68, 0.2)'
      };
      break;
    case 'expired':
      config = {
        label: 'Expired',
        bg: 'var(--bg-secondary)',
        color: 'var(--text-muted)',
        border: 'var(--border)'
      };
      break;
  }

  const style = {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    backgroundColor: config.bg,
    color: config.color,
    border: `1px solid ${config.border}`,
    whiteSpace: 'nowrap'
  };

  return <span style={style}>{config.label}</span>;
};

export default StatusBadge;
