import React, { useState, useEffect } from 'react';
import { 
  Crewmate, 
  CrewmateStaking, 
  CrewmateWorking, 
  CrewmateCelebrating, 
  CrewmateDead 
} from './Crewmates';
import './SplitRealityHero.css';


/* ─── Script Data ─── */
const SCRIPT = [
  { 
    focus: 'both',
    leftMsg: "Got work to do today.",
    rightMsg: "Got work to do today.",
    leftComp: Crewmate, rightComp: Crewmate 
  },
  { 
    focus: 'left',
    leftMsg: "I'll just put it on my to-do list.",
    leftComp: Crewmate, rightComp: Crewmate 
  },
  { 
    focus: 'right',
    rightMsg: "Staking ETH so I don't slack off.",
    leftComp: Crewmate, rightComp: CrewmateStaking 
  },
  { 
    focus: 'left',
    leftMsg: "Too tired... I'll do it tomorrow.",
    leftComp: Crewmate, rightComp: CrewmateStaking 
  },
  { 
    focus: 'right',
    rightMsg: "Tired... but can't lose my stake. Let's go.",
    leftComp: Crewmate, rightComp: CrewmateWorking 
  },
  { 
    focus: 'left',
    leftMsg: "Deadline missed. Task failed...",
    leftState: 'error',
    leftComp: CrewmateDead, rightComp: CrewmateWorking 
  },
  { 
    focus: 'right',
    rightMsg: "Done! Stake + reward unlocked!",
    rightState: 'success',
    leftComp: CrewmateDead, rightComp: CrewmateCelebrating 
  }
];

const SplitRealityHero = () => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase(p => (p + 1) % SCRIPT.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const current = SCRIPT[phase];
  const LeftIcon = current.leftComp;
  const RightIcon = current.rightComp;

  const leftActive = current.focus === 'both' || current.focus === 'left';
  const rightActive = current.focus === 'both' || current.focus === 'right';

  return (
    <div className="sr-container">
      {/* Left Panel */}
      <div className={`sr-side ${leftActive ? 'sr-active' : 'sr-dim'} ${current.leftState === 'error' ? 'sr-bg-error' : ''}`}>
        <div className="sr-title">Standard Promise</div>
        <div className="sr-char-wrapper">
          <LeftIcon color="#64748b" />
          
          {current.leftMsg && (
            <div className={`comic-bubble comic-left fade-in ${current.leftState === 'error' ? 'comic-error' : ''}`} key={`L-${phase}`}>
              {current.leftMsg}
              <div className="bubble-dots">
                <div className="dot dot1"></div>
                <div className="dot dot2"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="sr-divider"><span className="vs-badge">VS</span></div>

      {/* Right Panel */}
      <div className={`sr-side ${rightActive ? 'sr-active' : 'sr-dim'} ${current.rightState === 'success' ? 'sr-bg-success' : ''}`}>
        <div className="sr-title accent-title">CommitX Promise</div>
        <div className="sr-char-wrapper">
          <RightIcon color="#0ea5e9" />
          
          {current.rightMsg && (
            <div className={`comic-bubble comic-right fade-in ${current.rightState === 'success' ? 'comic-success' : ''}`} key={`R-${phase}`}>
              {current.rightMsg}
              <div className="bubble-dots">
                <div className="dot dot1"></div>
                <div className="dot dot2"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SplitRealityHero;
