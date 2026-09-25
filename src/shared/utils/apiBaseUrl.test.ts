import { resolveApiBaseUrl } from './apiBaseUrl';

const urls = {
  local: 'http://localhost:3000/api/v1',
  dev: 'https://dev.example.com/api/v1',
  prod: 'https://api.example.com/api/v1',
};

describe('resolveApiBaseUrl', () => {
  it('uses the dev backend in a development build and prod in a release build', () => {
    expect(resolveApiBaseUrl({ urls, isDevBuild: true })).toBe(urls.dev);
    expect(resolveApiBaseUrl({ urls, isDevBuild: false })).toBe(urls.prod);
  });

  it('uses the environment picked by EXPO_PUBLIC_API_ENV', () => {
    expect(resolveApiBaseUrl({ urls, env: 'local', isDevBuild: true })).toBe(urls.local);
    expect(resolveApiBaseUrl({ urls, env: 'dev', isDevBuild: false })).toBe(urls.dev);
  });

  it('treats an empty EXPO_PUBLIC_API_ENV as unset', () => {
    expect(resolveApiBaseUrl({ urls, env: '', isDevBuild: true })).toBe(urls.dev);
  });

  it('rejects an unknown environment', () => {
    expect(() => resolveApiBaseUrl({ urls, env: 'staging', isDevBuild: true })).toThrow('local, dev, prod');
  });

  it('rejects an environment that has no URL yet', () => {
    expect(() => resolveApiBaseUrl({ urls: { ...urls, prod: null }, isDevBuild: false })).toThrow('"prod"');
  });

  it('prefers EXPO_PUBLIC_API_BASE_URL over the environment', () => {
    expect(resolveApiBaseUrl({ urls, env: 'local', overrideUrl: 'https://pr-42.example.com', isDevBuild: true })).toBe(
      'https://pr-42.example.com',
    );
  });

  it('allows a plain http override only for localhost', () => {
    expect(resolveApiBaseUrl({ urls, overrideUrl: 'http://127.0.0.1:3000/api/v1', isDevBuild: true })).toBe(
      'http://127.0.0.1:3000/api/v1',
    );
    expect(() => resolveApiBaseUrl({ urls, overrideUrl: 'http://api.example.com/api/v1', isDevBuild: true })).toThrow(
      'https://',
    );
  });
});
