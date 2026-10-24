import { useSyncExternalStore } from 'react';

const noop = () => () => {};

/** False during server render and hydration, true afterwards — for portals into document.body. */
export function useIsClient(): boolean {
  return useSyncExternalStore(noop, () => true, () => false);
}
