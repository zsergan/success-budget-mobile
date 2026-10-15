import { useCallback, useEffect, useRef } from 'react';

interface Abortable {
  abort: () => void;
}

// Leaving the screen aborts the requests it waits for, so a late answer neither moves the flow nor revives it.
const useAbortOnLeave = () => {
  const running = useRef(new Set<Abortable>());

  useEffect(() => {
    const requests = running.current;

    return () => requests.forEach((request) => request.abort());
  }, []);

  return useCallback(<T extends Abortable & PromiseLike<unknown>>(request: T): T => {
    running.current.add(request);
    request.then(() => running.current.delete(request));

    return request;
  }, []);
};

export default useAbortOnLeave;
