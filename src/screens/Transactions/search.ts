// The server's limit for the trimmed text, in code points (an emoji is one); a longer one is refused, never cut.
export const MAX_SEARCH_LENGTH = 255;

export const isSearchTooLong = (text: string) => [...text.trim()].length > MAX_SEARCH_LENGTH;
