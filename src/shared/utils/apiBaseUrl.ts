export type ApiEnv = 'local' | 'dev' | 'prod';

type ApiBaseUrlConfig = {
  urls: Record<ApiEnv, string | null>;
  env?: string;
  overrideUrl?: string;
  isDevBuild: boolean;
};

const isLocalUrl = (url: string) => url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1');

const pickEnv = (urls: ApiBaseUrlConfig['urls'], env: string | undefined, isDevBuild: boolean): ApiEnv => {
  if (!env) {
    return isDevBuild ? 'dev' : 'prod';
  }

  if (!Object.hasOwn(urls, env)) {
    throw new Error(`EXPO_PUBLIC_API_ENV must be one of ${Object.keys(urls).join(', ')}, got "${env}"`);
  }

  return env as ApiEnv;
};

// Fail fast on a misconfigured non-local URL rather than sending credentials over plain HTTP.
export const resolveApiBaseUrl = ({ urls, env, overrideUrl, isDevBuild }: ApiBaseUrlConfig) => {
  if (overrideUrl) {
    if (!isLocalUrl(overrideUrl) && !overrideUrl.startsWith('https://')) {
      throw new Error('EXPO_PUBLIC_API_BASE_URL must use https:// outside of local development');
    }

    return overrideUrl;
  }

  const selectedEnv = pickEnv(urls, env, isDevBuild);
  const url = urls[selectedEnv];

  if (!url) {
    throw new Error(`No API base URL is configured for "${selectedEnv}" yet; set EXPO_PUBLIC_API_BASE_URL`);
  }

  return url;
};
