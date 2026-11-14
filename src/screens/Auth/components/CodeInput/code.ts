import * as Clipboard from 'expo-clipboard';

export const CODE_LENGTH = 6;

// Paste and code autofill may bring spaces or dashes; only the digits count, leading zeros included.
export const toCode = (text: string) => text.replace(/\D/g, '').slice(0, CODE_LENGTH);

// More than one digit arriving at once is a paste or an autofill, never typing.
export const isFilledAtOnce = (previous: string, next: string) => next.length - previous.length > 1;

export const readClipboardCode = async () => {
  try {
    return toCode(await Clipboard.getStringAsync());
  } catch {
    // Nothing readable on the clipboard: the field is still there to type in.
    return '';
  }
};
