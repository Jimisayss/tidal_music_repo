'use client';

import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import Image from 'next/image';
import { formatDuration } from '@/lib/format';
import type { AudioQuality, TrackSummary } from '@/lib/types';
import { getAlbumDownloadUrl, getDownloadUrl, useMusicStore } from '@/store/useMusicStore';
import { FormatDropdown } from './FormatDropdown';

const DEFAULT_FORMATS: AudioQuality[] = ['HI_RES_LOSSLESS', 'LOSSLESS', 'HIGH'];
const EMPTY_TRACKS: TrackSummary[] = [];

interface AlbumTrackRowProps {
  track: TrackSummary;
  formats: AudioQuality[];
  isActive: boolean;
  onPreview: (track: TrackSummary, quality: AudioQuality) => void;
  onDownload: (track: TrackSummary, quality: AudioQuality) => void;
}

function AlbumTrackRow({ track, formats, isActive, onPreview, onDownload }: AlbumTrackRowProps) {
  const [quality, setQuality] = useState<AudioQuality>(formats[0] ?? 'LOSSLESS');

  useEffect(() => {
    if (!formats.includes(quality)) {
      setQuality(formats[0] ?? 'LOSSLESS');
    }
  }, [formats, quality]);

  const trackNumber = track.trackNumber ?? null;

  return (
    <div
      className={`glass-panel flex flex-wrap items-center gap-4 rounded-2xl px-4 py-3 transition ${
        isActive ? 'ring-2 ring-cyan-400/70' : 'hover:ring-1 hover:ring-cyan-400/40'
      }`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/5 text-xs font-semibold text-cyan-200">
        {trackNumber ? String(trackNumber).padStart(2, '0') : '--'}
      </div>
      <div className="flex min-w-[180px] flex-1 flex-col gap-1 text-left">
        <p className="text-sm font-semibold text-slate-100">{track.title}</p>
        <p className="text-xs text-slate-400">
          {track.artistName}
          {track.albumTitle ? <span className="text-slate-600"> - {track.albumTitle}</span> : null}
        </p>
      </div>
      <p className="text-xs uppercase tracking-wide text-slate-500">{formatDuration(track.durationMs)}</p>
      <FormatDropdown options={formats} value={quality} onChange={setQuality} />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPreview(track, quality)}
          className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
            isActive ? 'bg-cyan-400/80 text-slate-900' : 'bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/30'
          }`}
        >
          {isActive ? 'Playing' : 'Preview'}
        </button>
        <button
          type="button"
          onClick={() => onDownload(track, quality)}
          className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-900 transition hover:bg-white"
        >
          Download
        </button>
      </div>
    </div>
  );
}

export function AlbumDetailDrawer() {
  const {
    selectedAlbum,
    albumLoading,
    albumError,
    closeAlbum,
    playAlbumTracks,
    selectedTrack,
    availableFormats,
    isShuffled,
    playbackQuality
  } = useMusicStore((state) => ({
    selectedAlbum: state.selectedAlbum,
    albumLoading: state.albumLoading,
    albumError: state.albumError,
    closeAlbum: state.closeAlbum,
    playAlbumTracks: state.playAlbumTracks,
    selectedTrack: state.selectedTrack,
    availableFormats: state.availableFormats,
    isShuffled: state.isShuffled,
    playbackQuality: state.playbackQuality
  }));
  const [downloadQuality, setDownloadQuality] = useState<AudioQuality>('LOSSLESS');

  useEffect(() => {
    if (availableFormats.length > 0 && !availableFormats.includes(downloadQuality)) {
      setDownloadQuality(availableFormats[0]);
    }
  }, [availableFormats, downloadQuality]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeAlbum();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [closeAlbum]);

  const formats = useMemo(
    () => (availableFormats.length > 0 ? availableFormats : DEFAULT_FORMATS),
    [availableFormats]
  );

  if (!selectedAlbum) {
    return null;
  }

  const tracks = selectedAlbum.tracks ?? EMPTY_TRACKS;
  const totalDuration = tracks.reduce((acc, track) => acc + (track.durationMs ?? 0), 0);

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      closeAlbum();
    }
  };

  const handleTrackPreview = async (
    index: number,
    track: TrackSummary,
    quality: AudioQuality
  ) => {
    await playAlbumTracks(tracks, index, { quality, shuffle: isShuffled });
  };

  const handleTrackDownload = (track: TrackSummary, quality: AudioQuality) => {
    const url = getDownloadUrl(track.id, quality);
    window.open(url, '_blank', 'noopener');
  };

  const handleAlbumDownload = () => {
    const url = getAlbumDownloadUrl(selectedAlbum.id, downloadQuality);
    window.open(url, '_blank', 'noopener');
  };

  const handleAlbumPlay = async (shuffle: boolean) => {
    await playAlbumTracks(tracks, 0, { shuffle, quality: playbackQuality });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div className="glass-panel relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-800/80 shadow-2xl shadow-cyan-500/20">
        <button
          type="button"
          onClick={closeAlbum}
          className="absolute right-6 top-6 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-xs uppercase tracking-wide text-slate-300 transition hover:border-cyan-400 hover:text-cyan-200"
        >
          Close
        </button>
        <div className="grid gap-6 p-8 md:grid-cols-[240px_1fr]">
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-48 w-48 overflow-hidden rounded-3xl bg-slate-800/60 shadow-glow">
              {selectedAlbum.coverUrl ? (
                <Image src={selectedAlbum.coverUrl} alt={selectedAlbum.title} fill sizes="192px" className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">No art</div>
              )}
            </div>
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-cyan-300">Album</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-100">{selectedAlbum.title}</h2>
              {selectedAlbum.artistName ? (
                <p className="text-sm text-slate-400">{selectedAlbum.artistName}</p>
              ) : null}
              <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs text-slate-500">
                {selectedAlbum.releaseDate ? <span>Released {selectedAlbum.releaseDate}</span> : null}
                <span>{(selectedAlbum.trackCount ?? tracks.length) || tracks.length} tracks</span>
                {totalDuration > 0 ? <span>{formatDuration(totalDuration)}</span> : null}
              </div>
            </div>
            {selectedAlbum.description ? (
              <p className="line-clamp-4 text-center text-xs text-slate-400">{selectedAlbum.description}</p>
            ) : null}
            <div className="glass-panel flex w-full flex-col gap-3 rounded-2xl px-4 py-3">
              <span className="text-xs uppercase tracking-wide text-slate-400">Play</span>
              <div className="flex w-full flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleAlbumPlay(false)}
                  className="flex-1 rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-slate-900 shadow-glow transition hover:bg-cyan-300"
                >
                  Play Album
                </button>
                <button
                  type="button"
                  onClick={() => void handleAlbumPlay(true)}
                  className="flex-1 rounded-full border border-cyan-400/50 bg-cyan-500/10 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-400/20"
                >
                  Shuffle Play
                </button>
              </div>
            </div>
            <div className="glass-panel flex w-full flex-col gap-3 rounded-2xl px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-slate-400">Album Download</span>
                <FormatDropdown options={formats} value={downloadQuality} onChange={setDownloadQuality} />
              </div>
              <button
                type="button"
                onClick={handleAlbumDownload}
                className="w-full rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-slate-900 shadow-glow transition hover:bg-cyan-300"
              >
                Download Album (.zip)
              </button>
            </div>
            {albumError ? <p className="text-xs text-red-400">{albumError}</p> : null}
          </div>
          <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto pr-2">
            {albumLoading ? (
              <div className="glass-panel rounded-2xl p-6 text-center text-sm text-slate-300">Loading tracklist...</div>
            ) : null}
            {tracks.map((track, index) => (
              <AlbumTrackRow
                key={track.id}
                track={track}
                formats={formats}
                isActive={selectedTrack?.id === track.id}
                onPreview={(item, quality) => {
                  void handleTrackPreview(index, item, quality);
                }}
                onDownload={handleTrackDownload}
              />
            ))}
            {tracks.length === 0 && !albumLoading ? (
              <div className="glass-panel rounded-2xl p-6 text-center text-sm text-slate-400">
                No tracks available for this album.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
