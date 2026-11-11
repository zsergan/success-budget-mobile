// The link's `<invitation id>.<proof>`: what the backend's /invite page accepts, nothing longer or looser.
const TOKEN_PATTERN = /^[1-9][0-9]{0,9}\.[A-Za-z0-9_-]{43}$/;

export const INVITE_APP_SCHEME = 'successbudget';

const URL_PARTS = /^([a-z][a-z0-9+.-]*):\/\/([^/?#]*)([^?#]*)(\?[^#]*)?(#.*)?$/i;
const DEFAULT_PORTS: Record<string, string> = { http: '80', https: '443' };

// `scheme://host[:port]`, lower-cased and without the scheme's default port; null for anything else.
export const originOf = (url: string): string | null => {
  const [, scheme, authority] = url.match(URL_PARTS) ?? [];
  if (!scheme || !authority || authority.includes('@')) return null;

  const lowerScheme = scheme.toLowerCase();
  const [host, port] = authority.toLowerCase().split(':');
  const keepsPort = port !== undefined && port !== DEFAULT_PORTS[lowerScheme];

  return `${lowerScheme}://${host}${keepsPort ? `:${port}` : ''}`;
};

const tokenOf = (fragment: string | undefined) => {
  const pair = (fragment ?? '')
    .replace(/^#/, '')
    .split('&')
    .find((part) => part.startsWith('token='));
  const token = pair?.slice('token='.length);

  return token && TOKEN_PATTERN.test(token) ? token : null;
};

// The token of an invitation link: `<origin>/invite#token=…` or `successbudget://invite#token=…`. Any other URL,
// path or token shape is not an invitation and gives null.
export const parseInviteLink = (url: string, origin: string | null): string | null => {
  const [, scheme, authority, path, , fragment] = url.match(URL_PARTS) ?? [];
  if (!scheme) return null;

  const isAppLink = scheme.toLowerCase() === INVITE_APP_SCHEME && authority.toLowerCase() === 'invite' && !path;
  const isWebLink = origin !== null && originOf(url) === origin && path === '/invite';

  return isAppLink || isWebLink ? tokenOf(fragment) : null;
};
