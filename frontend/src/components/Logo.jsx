import React from 'react';

const Logo = ({ width = 120, height = 120, className = '' }) => (
  <img 
    src="/commitx_logo.png" 
    alt="CommitX Logo"
    width={width}
    height={height}
    className={className}
    style={{ 
      display: 'inline-block', 
      verticalAlign: 'middle',
      /* Enhance brightness and contrast slightly to fix the dullness against the new stark black background */
      filter: 'brightness(1.1) contrast(1.15)',
      objectFit: 'contain'
    }}
  />
);

export default Logo;
