'use client';

import { useState, useEffect } from 'react';

export default function OnlineIndicator() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div
      className={`fixed bottom-4 right-4 px-4 py-2 rounded-full text-sm font-medium shadow-lg transition-all duration-300 ${
        online
          ? 'bg-accent-green/10 text-accent-green-dark border border-accent-green/30'
          : 'bg-accent-rose/10 text-accent-burgundy border border-accent-rose/30'
      }`}
    >
      <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: online ? 'var(--accent-green)' : 'var(--accent-rose)' }} />
      {online ? 'Online' : 'Offline'}
    </div>
  );
}