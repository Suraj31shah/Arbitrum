import React, { useEffect, useRef, useState } from 'react';
import { Trophy, Flag } from 'lucide-react';
import './ParticipantJourneyTrack.css';

const AVATAR_COLORS = [
  '#10b981', // CredStreak Green
  '#a855f7', // Electric Purple
  '#06b6d4', // Cyan
  '#eab308', // Gold
  '#3b82f6', // Bright Blue
  '#ec4899', // Pink
];

const CharacterAvatar = ({ color, isYou }) => (
  <div className={`journey-avatar-wrapper ${isYou ? 'you-avatar' : ''}`}>
    <svg className="journey-avatar-svg" width="36" height="42" viewBox="0 0 36 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Visor / Head */}
      <circle cx="18" cy="11" r="8" fill={color} />
      <ellipse cx="20" cy="10" rx="4" ry="2.5" fill="#ffffff" opacity="0.85" />
      {/* Body / Backpack */}
      <rect x="7" y="18" width="4" height="10" rx="2" fill={color} opacity="0.8" />
      <path d="M11 21C11 18.2386 13.2386 16 16 16H20C22.7614 16 25 18.2386 25 21V29H11V21Z" fill={color} />
      {/* Legs */}
      <rect className="leg-left" x="12" y="29" width="4" height="10" rx="2" fill={color} />
      <rect className="leg-right" x="20" y="29" width="4" height="10" rx="2" fill={color} />
    </svg>
  </div>
);

const ParticipantJourneyTrack = ({ participants = [], creatorWallet, globalWalletAddress }) => {
  // Store known addresses to only animate newly joined participants
  const previousAddressesRef = useRef(new Set());
  const [animatedAddresses, setAnimatedAddresses] = useState(new Set());

  const displayParticipants = (participants && participants.length > 0)
    ? participants
    : [{ walletAddress: creatorWallet || globalWalletAddress || '0x0000000000000000000000000000000000000000', user: { username: 'Creator' } }];

  useEffect(() => {
    if (!displayParticipants || displayParticipants.length === 0) return;

    const currentAddresses = displayParticipants.map(p => p.walletAddress?.toLowerCase());
    const newlyAdded = new Set();

    // Determine if any participant address is newly added since initial mount
    if (previousAddressesRef.current.size > 0) {
      currentAddresses.forEach(addr => {
        if (addr && !previousAddressesRef.current.has(addr)) {
          newlyAdded.add(addr);
        }
      });
    }

    // Update reference set with all current addresses
    currentAddresses.forEach(addr => {
      if (addr) previousAddressesRef.current.add(addr);
    });

    if (newlyAdded.size > 0) {
      setAnimatedAddresses(newlyAdded);
      // Clear animation class after animation completes (1.5s)
      const timer = setTimeout(() => {
        setAnimatedAddresses(new Set());
      }, 1600);
      return () => clearTimeout(timer);
    }
  }, [participants]);

  const total = displayParticipants.length;

  return (
    <div className="participant-journey-card">
      <div className="journey-header">
        <div className="journey-title-group">
          <Trophy size={16} className="journey-title-icon" />
          <span className="journey-title">Challenge Journey</span>
        </div>
        <span className="journey-count">{total} {total === 1 ? 'Participant' : 'Participants'} Staked</span>
      </div>

      {/* Journey Track Area */}
      <div className="journey-track-container">
        {/* Track Line */}
        <div className="journey-track-line"></div>

        {/* Participant Avatars along track */}
        <div className="journey-participants-row">
          {displayParticipants.map((p, idx) => {
            const address = p.walletAddress?.toLowerCase() || '';
            const isYou = globalWalletAddress && address === globalWalletAddress;
            const color = isYou ? '#10b981' : AVATAR_COLORS[(idx + 1) % AVATAR_COLORS.length];
            const isNew = animatedAddresses.has(address);

            // Calculate position percentage along the track (15% to 80%)
            const percent = total === 1 ? 18 : Math.min(82, 15 + (idx / (Math.max(1, total - 1))) * 65);

            const displayName = isYou 
              ? 'YOU' 
              : (p.user?.username || (address ? `${address.substring(0, 5)}...` : `User ${idx + 1}`));

            return (
              <div 
                key={p.user?._id || address || idx} 
                className={`journey-node ${isNew ? 'animate-walk-in' : ''} ${isYou ? 'you-node' : ''}`}
                style={{ left: `${percent}%` }}
              >
                <div className="journey-avatar-container">
                  {isYou && <span className="you-pill-badge">YOU</span>}
                  <CharacterAvatar color={color} isYou={isYou} />
                  <span className="journey-avatar-name" style={{ color: isYou ? '#10b981' : '#cbd5e1' }}>
                    {displayName}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Finish Flag at right end */}
        <div className="journey-finish-flag">
          <div className="finish-flag-icon">
            <Flag size={18} />
          </div>
          <span className="finish-flag-label">Goal 🏁</span>
        </div>
      </div>
    </div>
  );
};

export default ParticipantJourneyTrack;
