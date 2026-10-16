import { useCallback, useEffect, useRef } from 'react';

interface Abortable {
  abort: () => void;
}

// One request per screen: a new attempt, a changed email or leaving the screen aborts the one before,
// so its late answer neither moves the flow nor revives it.
const useLatestRequest = () => {
  const current = useRef<Abortable | null>(null);

  useEffect(() => () => current.current?.abort(), []);

  const start = useCallback(<T extends Abortable>(request: T): T => {
    current.current?.abort();
    current.current = request;

    return request;
  }, []);

  const isLatest = useCallback((request: Abortable) => current.current === request, []);

  const abort = useCallback(() => {
    current.current?.abort();
    current.current = null;
  }, []);

  return { start, isLatest, abort };
};

export default useLatestRequest;
