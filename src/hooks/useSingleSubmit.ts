import { useRef } from 'react';

// isSubmitting reaches the button only on the next render, so a quick second press joins the request already sent.
const useSingleSubmit = <T>(submit: (values: T) => Promise<unknown>) => {
  const pending = useRef<Promise<unknown> | null>(null);

  return (values: T) => {
    pending.current ??= submit(values).finally(() => {
      pending.current = null;
    });

    return pending.current;
  };
};

export default useSingleSubmit;
