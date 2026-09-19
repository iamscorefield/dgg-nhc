'use client';

import { useEffect, useRef } from 'react';

interface ReferralTrackerProps {
  subdomain: string;
  targetPage?: string;
}

export default function ReferralTracker({ subdomain, targetPage = '/' }: ReferralTrackerProps) {
  const clickIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!subdomain) return;

    // Retrieve or establish a session token
    let sessionToken = sessionStorage.getItem(`nhc_sesh_${subdomain}`);
    if (!sessionToken) {
      sessionToken = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem(`nhc_sesh_${subdomain}`, sessionToken);
    }

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const deviceType = isMobile ? 'Mobile' : 'Desktop';

    const logArrival = async () => {
      try {
        const res = await fetch('/api/track-click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subdomain,
            targetPage,
            deviceType,
            sessionToken,
          }),
        });
        const data = await res.json();
        if (data.success && data.clickId) {
          clickIdRef.current = data.clickId;
        }
      } catch (err) {
        console.error('Tracker initialization failed:', err);
      }
    };

    logArrival();

    // Heartbeat every 15 seconds to update duration in real time
    const interval = setInterval(() => {
      if (!clickIdRef.current) return;
      const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);

      fetch('/api/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clickId: clickIdRef.current,
          durationSeconds,
        }),
        keepalive: true,
      }).catch(() => {});
    }, 15000);

    // Final beacon flush on tab close / unload
    const handleUnload = () => {
      if (!clickIdRef.current) return;
      const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);

      const payload = JSON.stringify({
        clickId: clickIdRef.current,
        durationSeconds,
      });

      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon('/api/track-click', blob);
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
      handleUnload();
    };
  }, [subdomain, targetPage]);

  return null;
}