import React from 'react';

const SVG_STYLE = { filter: 'drop-shadow(0px 8px 16px rgba(0,0,0,0.4))' };

// Base Crewmate Body (Reused across components)
export const Body = ({ color }) => (
  <>
    {/* Backpack */}
    <path d="M 22 45 C 10 45, 10 85, 22 85" fill={color} stroke="#18181b" strokeWidth="5" strokeLinecap="round" />
    {/* Main Body with Legs */}
    <path d="M 25 50 C 25 15, 85 15, 85 50 C 85 90, 80 95, 80 95 L 80 112 C 80 120, 65 120, 65 112 L 65 95 L 45 95 L 45 112 C 45 120, 30 120, 30 112 L 30 95 C 25 90, 25 70, 25 50 Z" fill={color} stroke="#18181b" strokeWidth="5" strokeLinejoin="round" />
  </>
);

export const Visor = () => (
  <>
    <path d="M 45 35 C 35 35, 35 60, 45 60 L 75 60 C 95 60, 95 35, 75 35 Z" fill="#9dbcd4" stroke="#18181b" strokeWidth="4" />
    <ellipse cx="70" cy="42" rx="8" ry="4" fill="white" transform="rotate(-10 70 42)" opacity="0.8" />
  </>
);

export const Crewmate = ({ color, size = 140, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 110 130" style={SVG_STYLE} className={className}>
    <Body color={color} />
    <Visor />
  </svg>
);

export const CrewmateStaking = ({ color, size = 140, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 140 130" style={SVG_STYLE} className={className}>
    <Body color={color} />
    <Visor />
    {/* Floating Hand holding ETH */}
    <circle cx="105" cy="75" r="16" fill="#fbbf24" stroke="#18181b" strokeWidth="4" />
    <text x="105" y="81" textAnchor="middle" fill="#18181b" fontSize="16" fontWeight="bold">Ξ</text>
    {/* Hand overlapping coin */}
    <ellipse cx="90" cy="75" rx="12" ry="8" fill={color} stroke="#18181b" strokeWidth="4" />
  </svg>
);

export const CrewmateWorking = ({ color, size = 140, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 140 130" style={SVG_STYLE} className={className}>
    <Body color={color} />
    <Visor />
    {/* Desk & Laptop */}
    <rect x="20" y="90" width="110" height="8" rx="4" fill="#3f3f46" stroke="#18181b" strokeWidth="4" />
    <rect x="75" y="70" width="35" height="20" rx="3" fill="#e4e4e7" stroke="#18181b" strokeWidth="4" />
    {/* Hands typing */}
    <ellipse cx="65" cy="85" rx="10" ry="6" fill={color} stroke="#18181b" strokeWidth="3" />
    <ellipse cx="105" cy="85" rx="10" ry="6" fill={color} stroke="#18181b" strokeWidth="3" />
  </svg>
);

export const CrewmateCelebrating = ({ color, size = 140, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 110 130" style={SVG_STYLE} className={className}>
    <Body color={color} />
    <Visor />
    {/* Hands up in the air */}
    <ellipse cx="10" cy="30" rx="10" ry="6" fill={color} stroke="#18181b" strokeWidth="4" transform="rotate(-45 10 30)" />
    <ellipse cx="100" cy="30" rx="10" ry="6" fill={color} stroke="#18181b" strokeWidth="4" transform="rotate(45 100 30)" />
    
    {/* Confetti Burst */}
    <circle cx="15" cy="15" r="5" fill="#f43f5e" />
    <rect x="35" y="5" width="6" height="14" fill="#10b981" transform="rotate(20 35 5)" />
    <circle cx="70" cy="8" r="5" fill="#fbbf24" />
    <rect x="90" y="10" width="6" height="14" fill="#3b82f6" transform="rotate(-30 90 10)" />
    <circle cx="105" cy="50" r="5" fill="#a855f7" />
    
    <path d="M 10 50 Q -5 40 5 30" fill="none" stroke="#f43f5e" strokeWidth="3" strokeDasharray="5 5" />
    <path d="M 95 20 Q 110 15 115 30" fill="none" stroke="#fbbf24" strokeWidth="3" strokeDasharray="5 5" />
  </svg>
);

export const CrewmateDead = ({ color, size = 140, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 110 130" style={SVG_STYLE} className={className}>
    {/* Backpack bottom half */}
    <path d="M 22 75 C 10 75, 10 85, 22 85" fill={color} stroke="#18181b" strokeWidth="5" strokeLinecap="round" />
    
    {/* Bone */}
    <rect x="45" y="45" width="16" height="30" fill="#f8fafc" stroke="#18181b" strokeWidth="5" />
    <circle cx="45" cy="45" r="10" fill="#f8fafc" stroke="#18181b" strokeWidth="5" />
    <circle cx="61" cy="45" r="10" fill="#f8fafc" stroke="#18181b" strokeWidth="5" />
    <rect x="42" y="45" width="22" height="15" fill="#f8fafc" /> {/* cover inner stroke */}
    
    {/* Main Body lower half (cut off flat at y=75) */}
    <path d="M 25 75 L 85 75 C 85 90, 80 95, 80 95 L 80 112 C 80 120, 65 120, 65 112 L 65 95 L 45 95 L 45 112 C 45 120, 30 120, 30 112 L 30 95 C 25 90, 25 80, 25 75 Z" fill={color} stroke="#18181b" strokeWidth="5" strokeLinejoin="round" />
    
    {/* Broken Visor on ground to the right */}
    <g transform="translate(90, 105) rotate(20)">
       <path d="M -15 -10 L 15 -10 C 20 -10, 20 10, 15 10 L -15 10 C -20 10, -20 -10, -15 -10 Z" fill="#9dbcd4" stroke="#18181b" strokeWidth="3" />
       <path d="M -5 -10 L 5 10" stroke="#18181b" strokeWidth="2" />
    </g>
  </svg>
);
