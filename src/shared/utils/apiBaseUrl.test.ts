import { resolveApiBaseUrl } from './apiBaseUrl';

const FALLBACK = 'http://localhost:3000/api/v1';

describe('resolveApiBaseUrl', () => {
  it('falls back when no URL is configured', () => {
    expect(resolveApiBaseUrl(undefined, FALLBACK)).toBe(FALLBACK);
    expect(resolveApiBaseUrl('', FALLBACK)).toBe(FALLBACK);
  });

  it('uses a configured https URL', () => {
    expect(resolveApiBaseUrl('https://api.example.com/api/v1', FALLBACK)).toBe('https://api.example.com/api/v1');
  });

  it('allows plain http only for localhost', () => {
    expect(resolveApiBaseUrl('http://127.0.0.1:3000/api/v1', FALLBACK)).toBe('http://127.0.0.1:3000/api/v1');
    expect(() => resolveApiBaseUrl('http://api.example.com/api/v1', FALLBACK)).toThrow('https://');
  });
});
