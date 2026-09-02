import { getErrorMessage } from './error';

describe('getErrorMessage', () => {
  it('returns a connection message when there is no response at all', () => {
    expect(getErrorMessage(undefined)).toBe('Could not reach the server. Check your connection and try again.');
  });

  it('returns a generic message for a 5xx server error instead of the raw body', () => {
    const error = { message: 'Internal Server Error', statusCode: 500, path: '/wallets', timestamp: '2026-01-01' };

    expect(getErrorMessage(error)).toBe('Something went wrong on our end. Please try again later.');
  });

  it('passes through a plain string message from a 4xx response', () => {
    const error = {
      message: 'Email already registered',
      statusCode: 409,
      path: '/auth/register',
      timestamp: '2026-01-01',
    };

    expect(getErrorMessage(error)).toBe('Email already registered');
  });

  it('passes through the first field error from an array message', () => {
    const error = {
      message: [{ field: 'email', error: 'email must be an email' }],
      statusCode: 400,
      path: '/auth/register',
      timestamp: '2026-01-01',
    };

    expect(getErrorMessage(error)).toBe('email must be an email');
  });

  it('falls back to a generic message for an empty array message', () => {
    const error = { message: [], statusCode: 400, path: '/auth/register', timestamp: '2026-01-01' };

    expect(getErrorMessage(error)).toBe('Something went wrong. Please try again.');
  });
});
