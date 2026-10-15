import { Banner } from '@components';

import type { PasswordResetFailure } from './passwordResetFailure';
import useSecondsUntil from './useSecondsUntil';

interface Props {
  failure: PasswordResetFailure;
  // What the screen keeps for another try.
  kept: 'email' | 'code' | 'password';
  isRetrying?: boolean;
  onRetry?: () => void;
}

const KEPT_TEXT = {
  email: 'Your email is kept.',
  code: 'Your code is kept.',
  password: 'Your new password is kept.',
};

const waitText = (seconds: number) =>
  seconds === 0 ? 'You can try again now.' : `Try again in ${seconds} ${seconds === 1 ? 'second' : 'seconds'}.`;

const RateLimitedBanner = ({ retryAt }: { retryAt?: number }) => {
  const seconds = useSecondsUntil(retryAt);

  return (
    <Banner
      variant="card"
      tone="warn"
      title="Too many attempts"
      text={retryAt === undefined ? 'Wait a minute, then try again.' : waitText(seconds)}
    />
  );
};

const CodeUnusableBanner = ({ reason }: { reason?: 'expired' | 'attempts' }) => {
  switch (reason) {
    case 'expired':
      return (
        <Banner
          variant="card"
          tone="warn"
          icon="clock"
          title="This code has expired"
          text="Codes work for 30 minutes. Send a new code to continue."
        />
      );
    case 'attempts':
      return (
        <Banner
          variant="card"
          tone="danger"
          title="Too many wrong attempts"
          text="This code is blocked after 5 wrong tries. Send a new code to continue."
        />
      );
    default:
      return (
        <Banner
          variant="card"
          tone="warn"
          title="This code no longer works"
          text="It expired or was blocked after too many wrong tries. Send a new code to continue."
        />
      );
  }
};

// The code screen shows a wrong code on the field itself; every other recovery failure leads the form.
const PasswordResetFailureBanner = ({ failure, kept, isRetrying, onRetry }: Props) => {
  switch (failure.kind) {
    case 'connection':
      return (
        <Banner
          variant="card"
          tone="warn"
          icon="offline"
          title="Couldn’t reach the server"
          text={`${KEPT_TEXT[kept]} Check your connection and try again.`}
          actionLabel={onRetry && 'Retry'}
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
          title="Recovery is temporarily unavailable"
          text={`The problem is on our side. ${KEPT_TEXT[kept]} Try again in a few minutes.`}
          actionLabel={onRetry && 'Try again'}
          actionIcon="refresh"
          isBusy={isRetrying}
          onAction={onRetry}
        />
      );
    case 'rateLimited':
      return <RateLimitedBanner key={failure.retryAt} retryAt={failure.retryAt} />;
    case 'codeInvalid':
      return <Banner variant="card" tone="danger" title="That code doesn’t match" text="Check the latest email." />;
    case 'codeUnusable':
      return <CodeUnusableBanner reason={failure.reason} />;
    case 'authorizationInvalid':
      return (
        <Banner
          variant="card"
          tone="warn"
          icon="clock"
          title="Time to set a password ran out"
          text="The code was confirmed too long ago. Send a new code to start again."
        />
      );
    case 'refused':
      return <Banner variant="card" tone="danger" title="Couldn’t reset the password" text={failure.message} />;
  }
};

export default PasswordResetFailureBanner;
