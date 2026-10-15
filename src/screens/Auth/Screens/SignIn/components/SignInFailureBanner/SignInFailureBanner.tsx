import { useEffect, useState } from 'react';
import { Banner } from '@components';

import type { SignInFailure } from '@screens/Auth/Screens/SignIn/signInFailure';

interface Props {
  failure: SignInFailure;
  isRetrying: boolean;
  onRetry: () => void;
}

const secondsUntil = (time: number, now: number) => Math.max(0, Math.ceil((time - now) / 1000));

const waitText = (seconds: number) => {
  if (seconds === 0) return 'You can try again now.';

  return `Try again in ${seconds} ${seconds === 1 ? 'second' : 'seconds'}.`;
};

// Mounted anew for each refusal (see its key), so the countdown never starts from an earlier one's clock.
const RateLimitedBanner = ({ retryAt }: { retryAt?: number }) => {
  const [now, setNow] = useState(Date.now);
  const isWaiting = retryAt !== undefined && now < retryAt;

  useEffect(() => {
    if (!isWaiting) return;

    const timer = setInterval(() => setNow(Date.now()), 1000);

    return () => clearInterval(timer);
  }, [isWaiting]);

  return (
    <Banner
      variant="card"
      tone="warn"
      title="Too many sign-in attempts"
      text={retryAt === undefined ? 'Wait a minute, then try again.' : waitText(secondsUntil(retryAt, now))}
    />
  );
};

const SignInFailureBanner = ({ failure, isRetrying, onRetry }: Props) => {
  switch (failure.kind) {
    case 'credentials':
      return (
        <Banner
          variant="card"
          tone="danger"
          title="Wrong email or password"
          text="Check the address and your keyboard — the password is case-sensitive."
        />
      );
    case 'connection':
      return (
        <Banner
          variant="card"
          tone="warn"
          icon="offline"
          title="Couldn’t reach the server"
          text="The server didn’t answer, so nothing was checked. Everything you typed is kept; check your connection."
          actionLabel="Retry"
          actionIcon="refresh"
          isBusy={isRetrying}
          onAction={onRetry}
        />
      );
    case 'server':
      return (
        <Banner
          variant="card"
          tone="warn"
          title="Something went wrong on our side"
          text="The server couldn’t sign you in just now. Everything you typed is kept; try again in a moment."
          actionLabel="Retry"
          actionIcon="refresh"
          isBusy={isRetrying}
          onAction={onRetry}
        />
      );
    case 'rateLimited':
      return <RateLimitedBanner key={failure.retryAt} retryAt={failure.retryAt} />;
    case 'refused':
      return <Banner variant="card" tone="danger" title="Couldn’t sign you in" text={failure.message} />;
  }
};

export default SignInFailureBanner;
