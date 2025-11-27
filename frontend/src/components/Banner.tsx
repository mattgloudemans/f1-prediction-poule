import { useState, useEffect } from 'react';

interface BannerProps {
  nextRaceDate?: Date;
  nextRaceName?: string;
  isSprint?: boolean;
}

const Banner = ({ nextRaceDate, nextRaceName, isSprint }: BannerProps) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!nextRaceDate) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(nextRaceDate).getTime() - now;

      if (distance < 0) {
        setTimeLeft('Race in progress!');
        clearInterval(timer);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, [nextRaceDate]);

  const formatRaceTime = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      timeZone: 'America/New_York',
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  return (
    <div className={`overflow-hidden ${
      isSprint
        ? 'bg-gradient-to-r from-orange-600 to-orange-500'
        : 'bg-gradient-to-r from-f1-red to-red-700'
    }`}>
      <div className="animate-slide whitespace-nowrap py-3">
        <span className="inline-block px-8 text-white font-bold">
          {nextRaceName && nextRaceDate && (
            <>
              {isSprint ? '🏃' : '🏁'} NEXT {isSprint ? 'SPRINT' : 'RACE'}: {nextRaceName} • COUNTDOWN: {timeLeft} •
              {isSprint ? 'SPRINT' : 'RACE'} TIME (EST): {formatRaceTime(new Date(nextRaceDate))} {isSprint ? '🏃' : '🏁'}
            </>
          )}
          {!nextRaceName && 'Loading next race information...'}
        </span>
      </div>
    </div>
  );
};

export default Banner;
