const isLocalUrl = (url: string) => url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1');

// Fail fast on a misconfigured non-local URL rather than sending credentials over plain HTTP.
export const resolveApiBaseUrl = (configuredUrl: string | undefined, fallbackUrl: string) => {
  if (!configuredUrl) {
    return fallbackUrl;
  }

  if (!isLocalUrl(configuredUrl) && !configuredUrl.startsWith('https://')) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL must use https:// outside of local development');
  }

  return configuredUrl;
};
