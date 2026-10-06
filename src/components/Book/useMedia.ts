import { useSyncExternalStore } from 'react';

/** Live matchMedia, SSR-safe (false on the server and in browsers without it). */
export function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      const mq = window.matchMedia?.(query);
      mq?.addEventListener?.('change', notify);
      return () => mq?.removeEventListener?.('change', notify);
    },
    () => window.matchMedia?.(query).matches ?? false,
    () => false,
  );
}
