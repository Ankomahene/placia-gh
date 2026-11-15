'use client';

import { useCallback, useEffect, useState } from 'react';

/** The user's position, rounded to about 10 m. Kept on this device only, for six hours. */
export interface UserLocation {
  lat: number;
  lon: number;
  at: number;
}

const KEY = 'placia:location';
const MAX_AGE_MS = 6 * 60 * 60 * 1000;

export function readLocation(): UserLocation | null {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null') as UserLocation | null;
    if (v && Date.now() - v.at < MAX_AGE_MS) return v;
  } catch {
    // Private mode or blocked storage: no saved position.
  }
  return null;
}

export function requestLocation(): Promise<UserLocation> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('unsupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const loc = {
          lat: Number(p.coords.latitude.toFixed(4)),
          lon: Number(p.coords.longitude.toFixed(4)),
          at: Date.now(),
        };
        try {
          localStorage.setItem(KEY, JSON.stringify(loc));
        } catch {
          // Not saved; still usable for this page.
        }
        resolve(loc);
      },
      reject,
      // Coarse and cached: GPS fixes are slow and drain cheap phones.
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 10 * 60 * 1000 },
    );
  });
}

export type LocationStatus = 'idle' | 'asking' | 'ready' | 'denied' | 'unavailable';

/** The saved position, and a way to ask for it. Never asks on its own. */
export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [status, setStatus] = useState<LocationStatus>('idle');
  /** True once the saved position (if any) has been read: wait for it before searching. */
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const saved = readLocation();
    if (saved) {
      setLocation(saved);
      setStatus('ready');
    }
    setChecked(true);
  }, []);

  const ask = useCallback(async () => {
    setStatus('asking');
    try {
      const loc = await requestLocation();
      setLocation(loc);
      setStatus('ready');
      return loc;
    } catch (e) {
      const denied = (e as GeolocationPositionError)?.code === 1;
      setStatus(denied ? 'denied' : 'unavailable');
      return null;
    }
  }, []);

  return { location, status, checked, ask };
}
