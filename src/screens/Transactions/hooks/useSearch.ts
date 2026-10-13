import { useEffect, useState } from 'react';

import { isSearchTooLong } from '@screens/Transactions/search';

// Typing sends the search once it pauses; the keyboard's Search key sends it at once.
export const SEARCH_DELAY_MS = 300;

const useSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');

  const text = query.trim();
  // Never sent: the field says so, and the last search sent stays shown.
  const isTooLong = isSearchTooLong(text);

  useEffect(() => {
    if (text === submitted || isTooLong) return;

    const timer = setTimeout(() => setSubmitted(text), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [text, isTooLong, submitted]);

  const reset = () => {
    setQuery('');
    setSubmitted('');
  };

  return {
    isSearching,
    query,
    // The trimmed text the history is searched for; empty for the plain history.
    submitted,
    isTooLong,
    open: () => setIsSearching(true),
    cancel: () => {
      setIsSearching(false);
      reset();
    },
    change: setQuery,
    submit: () => {
      if (!isTooLong) setSubmitted(text);
    },
    clear: reset,
  };
};

export default useSearch;
