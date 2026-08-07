import React, { useState, useEffect } from 'react';

const CountdownTimer = ({ deadline, compact = false }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(deadline) - new Date();
      
      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft('Expired');
        return;
      }

      setIsExpired(false);
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);

      if (compact) {
        if (days > 0) setTimeLeft(`${days}d ${hours}h`);
        else if (hours > 0) setTimeLeft(`${hours}h ${minutes}m`);
        else setTimeLeft(`${minutes}m`);
      } else {
        if (days > 0) setTimeLeft(`${days} days, ${hours} hours`);
        else if (hours > 0) setTimeLeft(`${hours} hours, ${minutes} minutes`);
        else setTimeLeft(`${minutes} minutes`);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // update every minute

    return () => clearInterval(timer);
  }, [deadline, compact]);

  return (
    <span style={{ color: isExpired ? 'var(--error)' : 'inherit' }}>
      {timeLeft}
    </span>
  );
};

export default CountdownTimer;
