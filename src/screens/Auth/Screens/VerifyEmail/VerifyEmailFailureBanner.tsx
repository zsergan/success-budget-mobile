import { Banner } from '@components';
import useSecondsUntil from '@hooks/useSecondsUntil';

import type { VerifyEmailFailure } from './verifyEmailFailure';

interface Props {
  failure: VerifyEmailFailure;
  isRetrying?: boolean;
  onRetry: () => void;
}

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

// A wrong code shows on the field itself, and the outcomes that leave for Sign In show there.
const VerifyEmailFailureBanner = ({ failure, isRetrying, onRetry }: Props) => {
  switch (failure.kind) {
    case 'connection':
      return (
        <Banner
          variant="card"
          tone="warn"
          icon="offline"
          title="Couldn’t reach the server"
          text="Your code is kept. Check your connection and try again."
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
          title="Verification is temporarily unavailable"
          text="The problem is on our side. Your code is kept. Try again in a few minutes."
          actionLabel="Try again"
          actionIcon="refresh"
          isBusy={isRetrying}
          onAction={onRetry}
        />
      );
    case 'rateLimited':
      return <RateLimitedBanner key={failure.retryAt} retryAt={failure.retryAt} />;
    case 'codeUnusable':
      return failure.reason === 'attempts' ? (
        <Banner
          variant="card"
          tone="danger"
          title="Too many wrong attempts"
          text="This code is blocked. Request another code to continue."
        />
      ) : (
        <Banner
          variant="card"
          tone="warn"
          icon="clock"
          title="This code no longer works"
          text="It has expired, or no code is waiting for this address. Request another code to continue."
        />
      );
    case 'refused':
      return <Banner variant="card" tone="danger" title="Couldn’t verify the email" text={failure.message} />;
    case 'codeInvalid':
    case 'alreadyVerified':
    case 'sessionNotSaved':
      return null;
  }
};

export default VerifyEmailFailureBanner;
