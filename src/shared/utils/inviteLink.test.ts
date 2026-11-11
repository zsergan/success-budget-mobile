import { originOf, parseInviteLink } from './inviteLink';

const ORIGIN = 'https://budget.example.com';
const TOKEN = `87.${'A'.repeat(20)}-_${'z9'.repeat(10)}b`;

describe('parseInviteLink', () => {
  it.each([
    ['the web link', `https://budget.example.com/invite#token=${TOKEN}`],
    [
      'the web link with an upper-case host and the default port',
      `HTTPS://Budget.Example.com:443/invite#token=${TOKEN}`,
    ],
    ['the app scheme', `successbudget://invite#token=${TOKEN}`],
    ['the token among other fragment values', `successbudget://invite#utm=x&token=${TOKEN}`],
    ['a query before the fragment', `https://budget.example.com/invite?ref=mail#token=${TOKEN}`],
  ])('reads the token of %s', (_, url) => {
    expect(parseInviteLink(url, ORIGIN)).toBe(TOKEN);
  });

  it.each([
    ['another host', `https://evil.example.com/invite#token=${TOKEN}`],
    ['a host that only ends like it', `https://budget.example.com.evil.io/invite#token=${TOKEN}`],
    ['credentials before the host', `https://budget.example.com@evil.io/invite#token=${TOKEN}`],
    ['plain http for an https origin', `http://budget.example.com/invite#token=${TOKEN}`],
    ['another port', `https://budget.example.com:8443/invite#token=${TOKEN}`],
    ['another path', `https://budget.example.com/invites#token=${TOKEN}`],
    ['a deeper path', `https://budget.example.com/invite/87#token=${TOKEN}`],
    ['a trailing slash', `https://budget.example.com/invite/#token=${TOKEN}`],
    ['the token in the query', `https://budget.example.com/invite?token=${TOKEN}`],
    ['another app route', `successbudget://members#token=${TOKEN}`],
    ['another scheme', `otherapp://invite#token=${TOKEN}`],
    ['no token', 'https://budget.example.com/invite'],
    ['an empty token', 'successbudget://invite#token='],
    ['a truncated token', `successbudget://invite#token=${TOKEN.slice(0, -1)}`],
    ['a token too long', `successbudget://invite#token=${TOKEN}x`],
    ['a token without an id', `successbudget://invite#token=.${'a'.repeat(43)}`],
    ['a token with a zero id', `successbudget://invite#token=0.${'a'.repeat(43)}`],
    ['a token with other characters', `successbudget://invite#token=87.${'a'.repeat(42)}=`],
    ['not a URL', 'invite#token=x'],
  ])('rejects %s', (_, url) => {
    expect(parseInviteLink(url, ORIGIN)).toBeNull();
  });

  it('takes only app-scheme links without a known web origin', () => {
    expect(parseInviteLink(`https://budget.example.com/invite#token=${TOKEN}`, null)).toBeNull();
    expect(parseInviteLink(`successbudget://invite#token=${TOKEN}`, null)).toBe(TOKEN);
  });
});

describe('originOf', () => {
  it.each([
    ['https://api.example.com/api/v1', 'https://api.example.com'],
    ['http://localhost:3000/api/v1', 'http://localhost:3000'],
    ['HTTPS://API.example.com:443', 'https://api.example.com'],
    ['not a url', null],
  ])('of %s is %s', (url, origin) => {
    expect(originOf(url)).toBe(origin);
  });
});
