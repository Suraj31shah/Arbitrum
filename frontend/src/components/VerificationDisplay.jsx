import React from 'react';

const VerificationDisplay = ({ analysis }) => {
  if (!analysis) return null;

  const isSuccess = analysis.completed;
  const colorVar = isSuccess ? 'var(--accent)' : 'var(--error)';
  const bgVar = isSuccess ? 'var(--accent-dim)' : 'var(--error-bg)';

  const cardStyle = {
    backgroundColor: 'var(--bg-card)',
    border: `1px solid ${isSuccess ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-6)',
    marginTop: 'var(--space-6)'
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 'var(--space-6)',
    paddingBottom: 'var(--space-4)',
    borderBottom: '1px solid var(--border)'
  };

  const resultTitleStyle = {
    fontSize: '1.5rem',
    color: colorVar,
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)'
  };

  const confidenceStyle = {
    backgroundColor: bgVar,
    color: colorVar,
    padding: '4px 12px',
    borderRadius: '9999px',
    fontWeight: 'bold',
    fontSize: '0.875rem'
  };

  const sectionStyle = {
    marginBottom: 'var(--space-4)'
  };

  const labelStyle = {
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 'var(--space-2)'
  };

  const listStyle = {
    listStyleType: 'disc',
    paddingLeft: 'var(--space-4)',
    margin: 0,
    color: 'var(--text-primary)'
  };

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <h2 style={resultTitleStyle}>
          {isSuccess ? '✓ Proof Verified' : '✗ Verification Failed'}
        </h2>
        <div style={confidenceStyle}>
          {analysis.confidence}% Confidence
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>Summary</div>
        <p style={{ color: 'var(--text-primary)', margin: 0, lineHeight: 1.6 }}>
          {analysis.summary}
        </p>
      </div>

      {analysis.strengths && analysis.strengths.length > 0 && (
        <div style={sectionStyle}>
          <div style={labelStyle}>Strengths Detected</div>
          <ul style={listStyle}>
            {analysis.strengths.map((str, i) => <li key={i} style={{marginBottom: '4px'}}>{str}</li>)}
          </ul>
        </div>
      )}

      {analysis.missingEvidence && analysis.missingEvidence.length > 0 && (
        <div style={sectionStyle}>
          <div style={labelStyle}>Missing Evidence</div>
          <ul style={{ ...listStyle, color: 'var(--warning)' }}>
            {analysis.missingEvidence.map((miss, i) => <li key={i} style={{marginBottom: '4px'}}>{miss}</li>)}
          </ul>
        </div>
      )}

      {analysis.recommendation && (
        <div style={{...sectionStyle, marginBottom: 0, marginTop: 'var(--space-6)', padding: 'var(--space-4)', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)'}}>
          <div style={labelStyle}>AI Recommendation</div>
          <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--text-primary)' }}>
            "{analysis.recommendation}"
          </p>
        </div>
      )}
    </div>
  );
};

export default VerificationDisplay;
