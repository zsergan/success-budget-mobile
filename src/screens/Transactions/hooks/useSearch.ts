import { useEffect, useState } from 'react';

// Typing sends the search once it pauses; the keyboard's Search key sends it at once.
export const SEARCH_DELAY_MS = 300;

const useSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');

  useEffect(() => {
    const text = query.trim();
    if (text === submitted) return;

    const timer = setTimeout(() => setSubmitted(text), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [query, submitted]);

  const reset = () => {
    setQuery('');
    setSubmitted('');
  };

  return {
    isSearching,
    query,
    // The trimmed text the history is searched for; empty for the plain history.
    submitted,
    open: () => setIsSearching(true),
    cancel: () => {
      setIsSearching(false);
      reset();
    },
    change: setQuery,
    submit: () => setSubmitted(query.trim()),
    clear: reset,
  };
};

export default useSearch;
