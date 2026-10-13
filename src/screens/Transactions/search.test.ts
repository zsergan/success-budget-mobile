import { isSearchTooLong, MAX_SEARCH_LENGTH } from './search';

describe('isSearchTooLong', () => {
  it.each([
    ['255 letters', 'a'.repeat(MAX_SEARCH_LENGTH), false],
    ['256 letters', 'a'.repeat(MAX_SEARCH_LENGTH + 1), true],
    ['255 letters within spaces', `  ${'a'.repeat(MAX_SEARCH_LENGTH)} \n`, false],
    ['255 emoji, each two UTF-16 units', '😀'.repeat(MAX_SEARCH_LENGTH), false],
    ['256 emoji', '😀'.repeat(MAX_SEARCH_LENGTH + 1), true],
    ['254 letters and an emoji', `${'a'.repeat(MAX_SEARCH_LENGTH - 1)}😀`, false],
  ])('%s', (_name, text, isTooLong) => {
    expect(isSearchTooLong(text)).toBe(isTooLong);
  });
});
