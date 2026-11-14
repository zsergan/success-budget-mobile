import * as Clipboard from 'expo-clipboard';

import { isFilledAtOnce, readClipboardCode, toCode } from './code';

jest.mock('expo-clipboard', () => ({ getStringAsync: jest.fn() }));

const mockedClipboard = jest.mocked(Clipboard.getStringAsync);

describe('toCode', () => {
  it('keeps only digits, leading zeros included', () => {
    expect(toCode('00 12-3a4')).toBe('001234');
  });

  it('stops at six digits', () => {
    expect(toCode('Your code: 0429178')).toBe('042917');
  });
});

describe('isFilledAtOnce', () => {
  it('tells a paste or autofill from typing and deleting', () => {
    expect(isFilledAtOnce('', '042917')).toBe(true);
    expect(isFilledAtOnce('04', '042')).toBe(false);
    expect(isFilledAtOnce('042917', '04291')).toBe(false);
  });
});

describe('readClipboardCode', () => {
  it('reads the digits on the clipboard', async () => {
    mockedClipboard.mockResolvedValue('Your code: 048 213');

    expect(await readClipboardCode()).toBe('048213');
  });

  it('reads nothing from a clipboard that can’t be read', async () => {
    mockedClipboard.mockRejectedValue(new Error('denied'));

    expect(await readClipboardCode()).toBe('');
  });
});
