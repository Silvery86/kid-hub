'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker on first user interaction.
 * Renders nothing — side-effect only.
 */
export const ServiceWorkerRegistrar = () => {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .catch((err) => console.warn('[SW] Registration failed:', err));
  }, []);

  return null;
};
