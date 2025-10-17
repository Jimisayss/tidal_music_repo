'use client';

import { useMemo, type ReactNode } from 'react';
import { getDownloadUrl, useMusicStore } from '@/store/useMusicStore';
import type { ArtistSummary, AlbumSummary, TrackSummary, AudioQuality } from '@/lib/types';
import { TrackCard } from './TrackCard';
import { ArtistCard } from './ArtistCard';
import { AlbumCard } from './AlbumCard';

const defaultFormats: AudioQuality[] = ['HI_RES_LOSSLESS', 'LOSSLESS', 'HIGH'];

function SectionHeading({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="text-xl font-semibold tracking-tight text-slate-100">{title}</h2>
      <span className="text-xs uppercase tracking-widest text-slate-500">{count} results</span>
    </div>
  );
}

interface ResultsPanelProps<T> {
  title: string;
  items: T[];
  render: (item: T) => ReactNode;
}

function ResultsPanel<T>({ title, items, render }: ResultsPanelProps<T>) {
  if (items.length === 0) {
    return null;
  }
  return (
    <section className="space-y-4">
      <SectionHeading title={title} count={items.length} />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{items.map(render)}</div>
    </section>
  );
}

export function ResultsSection() {
  const {
    results,
    searchType,
    loading,
    error,
    playTrack,
    selectedTrack,
    favorites,
    toggleFavorite,
    availableFormats,
    openAlbum
  } = useMusicStore((state) => ({
    results: state.results,
    searchType: state.searchType,
    loading: state.loading,
    error: state.error,
    playTrack: state.playTrack,
    selectedTrack: state.selectedTrack,
    favorites: state.favorites,
    toggleFavorite: state.toggleFavorite,
    availableFormats: state.availableFormats,
    openAlbum: state.openAlbum
  }));

  const formats = useMemo(() => (availableFormats.length > 0 ? availableFormats : defaultFormats), [availableFormats]);

  const handleDownload = (track: TrackSummary, quality: AudioQuality) => {
    const url = getDownloadUrl(track.id, quality);
    window.open(url, '_blank', 'noopener');
  };

  const handlePreview = async (track: TrackSummary, quality: AudioQuality) => {
    await playTrack(track, quality);
  };

  const handleAlbumSelect = (album: AlbumSummary) => {
    void openAlbum(album);
  };

  const filteredResults = useMemo(() => {
    if (searchType === 'tracks') {
      return { tracks: results.tracks, artists: [], albums: [] };
    }
    if (searchType === 'artists') {
      return { tracks: [], artists: results.artists, albums: [] };
    }
    if (searchType === 'albums') {
      return { tracks: [], artists: [], albums: results.albums };
    }
    return results;
  }, [searchType, results]);

  if (error) {
    return (
      <div className="glass-panel rounded-3xl p-6 text-center text-sm text-red-300">
        <p>We hit a snag while talking to the music service.</p>
        <p className="text-xs text-red-400/80">{error}</p>
      </div>
    );
  }

  if (
    loading &&
    filteredResults.tracks.length === 0 &&
    filteredResults.artists.length === 0 &&
    filteredResults.albums.length === 0
  ) {
    return (
      <div className="glass-panel rounded-3xl p-10 text-center text-lg text-slate-300">
        Searching the hi-fi vaults...
      </div>
    );
  }

  const hasResults =
    filteredResults.tracks.length > 0 || filteredResults.artists.length > 0 || filteredResults.albums.length > 0;

  if (!hasResults) {
    return (
      <div className="glass-panel rounded-3xl p-10 text-center text-sm text-slate-400">
        Start by searching for your favorite artist, album, or track. Results will appear here instantly.
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <ResultsPanel
        title="Tracks"
        items={filteredResults.tracks}
        render={(track: TrackSummary) => (
          <TrackCard
            key={track.id}
            track={track}
            formats={formats}
            isActive={selectedTrack?.id === track.id}
            onPreview={handlePreview}
            onDownload={handleDownload}
            onFavoriteToggle={toggleFavorite}
            isFavorite={Boolean(favorites[track.id])}
          />
        )}
      />
      <ResultsPanel
        title="Artists"
        items={filteredResults.artists}
        render={(artist: ArtistSummary) => <ArtistCard key={artist.id} artist={artist} />}
      />
      <ResultsPanel
        title="Albums"
        items={filteredResults.albums}
        render={(album: AlbumSummary) => <AlbumCard key={album.id} album={album} onSelect={handleAlbumSelect} />}
      />
    </div>
  );
}


