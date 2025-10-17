'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState, type MouseEvent } from 'react';
import { formatDuration } from '@/lib/format';
import type { AudioQuality, TrackSummary } from '@/lib/types';
import { FormatDropdown } from './FormatDropdown';

interface TrackCardProps {
  track: TrackSummary;
  formats: AudioQuality[];
  isActive: boolean;
  onPreview: (track: TrackSummary, quality: AudioQuality) => void | Promise<void>;
  onDownload: (track: TrackSummary, quality: AudioQuality) => void;
  onFavoriteToggle: (track: TrackSummary) => void;
  isFavorite: boolean;
}

export function TrackCard({
  track,
  formats,
  isActive,
  onPreview,
  onDownload,
  onFavoriteToggle,
  isFavorite
}: TrackCardProps) {
  const [quality, setQuality] = useState<AudioQuality>(formats[0] ?? 'LOSSLESS');

  useEffect(() => {
    if (!formats.includes(quality)) {
      setQuality(formats[0] ?? 'LOSSLESS');
    }
  }, [formats, quality]);

  const handlePreview = useCallback(() => {
    void onPreview(track, quality);
  }, [onPreview, track, quality]);

  const handleDownload = useCallback(() => {
    onDownload(track, quality);
  }, [onDownload, track, quality]);

  const handleCardClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;
      if (target.closest('button') || target.closest('select')) {
        return;
      }
      handlePreview();
    },
    [handlePreview]
  );

  return (
    <div
      className={`glass-panel fade-in flex flex-col gap-4 rounded-3xl p-4 transition ${
        isActive ? 'ring-2 ring-cyan-400/70' : 'hover:ring-1 hover:ring-cyan-300/30'
      } cursor-pointer`}
      onClick={handleCardClick}
    >
      <div className="flex items-start gap-4">
        <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-slate-800/60">
          {track.coverUrl ? (
            <Image src={track.coverUrl} alt={track.title} fill sizes="96px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">No art</div>
          )}
          {track.explicit && (
            <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-1 text-[10px] font-bold uppercase text-slate-200">
              E
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <h3 className="text-lg font-semibold text-slate-100">{track.title}</h3>
          <p className="text-sm text-slate-300">
            {track.artistName}
            {track.albumTitle ? <span className="text-slate-500">{' - '}{track.albumTitle}</span> : null}
          </p>
          <p className="text-xs uppercase tracking-wide text-slate-500">{formatDuration(track.durationMs)}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FormatDropdown options={formats} value={quality} onChange={setQuality} />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handlePreview}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              isActive ? 'bg-cyan-400/80 text-slate-900' : 'bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/30'
            }`}
          >
            {isActive ? 'Now Playing' : 'Preview'}
          </button>
          <button
            type="button"
            onClick={() => onFavoriteToggle(track)}
            className={`rounded-full border px-3 py-2 text-sm transition ${
              isFavorite
                ? 'border-yellow-300/70 bg-yellow-400/20 text-yellow-200'
                : 'border-slate-700 bg-transparent text-slate-300 hover:border-yellow-300/50 hover:text-yellow-200'
            }`}
          >
            {isFavorite ? 'Saved' : 'Save'}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white"
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
