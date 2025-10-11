
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';

// Helper function to calculate the time difference
const calculateTimeLeft = (targetDate?: string, targetTime?: string) => {
  // Ensure we have a valid targetDate string
  if (!targetDate) {
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  // Combine date with time if provided, otherwise default to midnight
  const timeString = targetTime || '00:00:00';
  const fullTargetDateString = `${targetDate}T${timeString}`;
  
  const difference = +new Date(fullTargetDateString) - +new Date();
  let timeLeft = {
    total: difference,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  };

  if (difference > 0) {
    timeLeft = {
      total: difference,
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }

  return timeLeft;
};

// Timer Unit Component
const TimeUnit = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center bg-primary/10 border-2 border-primary/20 rounded-lg">
      <span className="text-3xl sm:text-4xl font-mono font-semibold text-primary">
        {String(value).padStart(2, '0')}
      </span>
    </div>
    <span className="mt-2 text-xs sm:text-sm font-semibold uppercase tracking-wider text-foreground/70">
      {label}
    </span>
  </div>
);

export function CountdownTimer({ targetDate, targetTime }: { targetDate?: string, targetTime?: string }) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetDate, targetTime));
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This ensures the component only renders and runs the timer on the client side
    // to avoid hydration mismatch errors.
    setIsClient(true);
    
    // Start timer only if the target date is in the future
    if (calculateTimeLeft(targetDate, targetTime).total > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(calculateTimeLeft(targetDate, targetTime));
      }, 1000);
      
      // Cleanup the timer
      return () => clearTimeout(timer);
    }
  }); // Reruns on every state update caused by the timer

  if (!isClient) {
    // Render nothing on the server to prevent hydration errors
    return null;
  }
  
  const timerComponents = [
    { label: 'Hari', value: timeLeft.days },
    { label: 'Jam', value: timeLeft.hours },
    { label: 'Menit', value: timeLeft.minutes },
    { label: 'Detik', value: timeLeft.seconds },
  ];

  // If the countdown is finished, show a message
  if (timeLeft.total <= 0) {
    return <div className="mt-4 text-lg font-semibold text-primary">The special day is here!</div>;
  }

  return (
    <div className="mt-8 animate-in fade-in duration-1000">
      <div className="flex justify-center items-center gap-2 sm:gap-4">
        {timerComponents.map((unit, index) => (
          <React.Fragment key={unit.label}>
            <TimeUnit value={unit.value} label={unit.label} />
            {index < timerComponents.length - 1 && (
              <span className="text-3xl sm:text-4xl font-semibold text-primary -translate-y-4">:</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
