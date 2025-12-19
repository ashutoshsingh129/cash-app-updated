import { useState, useEffect } from 'react';
import { getTimeRemaining } from '../utils/formatters';

export function useQRCodeTimer(qrExpiresAt) {
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    if (!qrExpiresAt) {
      setTimeRemaining(null);
      return;
    }

    const updateCountdown = () => {
      const remaining = getTimeRemaining(qrExpiresAt);
      setTimeRemaining(remaining);
    };

    updateCountdown();

    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [qrExpiresAt]);

  return timeRemaining;
}

