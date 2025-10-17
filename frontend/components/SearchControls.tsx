'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useMusicStore } from '@/store/useMusicStore';
import type { SearchType } from '@/lib/types';

const searchTypeLabels: Record<SearchType, string> = {
  all: 'All',
  tracks: 'Tracks',
  artists: 'Artists',
  albums: 'Albums'
};

export function SearchControls() {
  const {
    query,
    setQuery,
    search,
    searchType,
    setSearchType,
    savedSearches,
    loading
  } = useMusicStore((state) => ({
    query: state.query,
    setQuery: state.setQuery,
    search: state.search,
    searchType: state.searchType,
    setSearchType: state.setSearchType,
    savedSearches: state.savedSearches,
    loading: state.loading
  }));

  const [focused, setFocused] = useState(false);

  const suggestions = useMemo(() => {
    if (!query) {
      return savedSearches.slice(0, 5);
    }
    return savedSearches
      .filter((item) => item.toLowerCase().includes(query.toLowerCase()) && item !== query)
      .slice(0, 5);
  }, [query, savedSearches]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await search();
  };

  const handleSuggestionSelect = async (value: string) => {
    setQuery(value);
    await search(value);
  };

  return (
    <div className="glass-panel rounded-3xl border px-6 py-6 shadow-glow">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="relative flex items-center gap-3">
          <span className="pointer-events-none text-cyan-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1016.65 16.65z"
              />
            </svg>
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search artists, albums, or tracks"
            className="w-full rounded-2xl border border-slate-700/60 bg-white/5 px-5 py-3 text-lg text-slate-100 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
            type="search"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-cyan-500/90 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-slate-900 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-cyan-900/40"
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>
        {focused && suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((item) => (
              <button
                key={item}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSuggestionSelect(item)}
                className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200 transition hover:border-cyan-400 hover:bg-cyan-400/20"
              >
                {item}
              </button>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {Object.entries(searchTypeLabels).map(([value, label]) => {
            const active = value === searchType;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setSearchType(value as SearchType)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? 'bg-cyan-400/30 text-cyan-50 shadow-glow'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </form>
    </div>
  );
}


