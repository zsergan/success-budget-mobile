import { Banner } from '@components';

import type { SignInFailure } from '@screens/Auth/Screens/SignIn/signInFailure';

interface Props {
  failure: SignInFailure;
  isRetrying: boolean;
  onRetry: () => void;
}

const waitText = (retryAfterMs?: number) => {
  if (retryAfterMs === undefined) return 'Wait a minute, then try again.';

  const seconds = Math.max(1, Math.ceil(retryAfterMs / 1000));

  return `Try again in ${seconds} ${seconds === 1 ? 'second' : 'seconds'}.`;
};

const FailureBanner = ({ failure, isRetrying, onRetry }: Props) => {
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
          isBusy={isRetrying}
          onAction={onRetry}
        />
      );
    case 'rateLimited':
      return (
        <Banner variant="card" tone="warn" title="Too many sign-in attempts" text={waitText(failure.retryAfterMs)} />
      );
    case 'refused':
      return <Banner variant="card" tone="danger" title="Couldn’t sign you in" text={failure.message} />;
  }
};

export default FailureBanner;
