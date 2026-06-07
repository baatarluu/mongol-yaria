import { useEffect, useState } from 'react';
import { subscribeStatus, flush, status } from './sync.js';

// Синк төлвийг (online, pending, syncing) дагах hook.
export function useSync() {
  const [s, setS] = useState(status());
  useEffect(() => subscribeStatus(setS), []);
  return { ...s, syncNow: flush };
}
