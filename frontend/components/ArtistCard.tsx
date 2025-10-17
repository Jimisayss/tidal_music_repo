'use client';

import Image from 'next/image';
import type { ArtistSummary } from '@/lib/types';

interface ArtistCardProps {
  artist: ArtistSummary;
  onSelect?: (artist: ArtistSummary) => void;
}

export function ArtistCard({ artist, onSelect }: ArtistCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(artist)}
      className="glass-panel fade-in flex flex-col items-center gap-3 rounded-3xl p-4 text-center transition hover:ring-1 hover:ring-cyan-400/40"
    >
      <div className="relative h-24 w-24 overflow-hidden rounded-full bg-slate-800/70">
        {artist.pictureUrl ? (
          <Image src={artist.pictureUrl} alt={artist.name} fill sizes="96px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">No art</div>
        )}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-100">{artist.name}</h3>
        {artist.followers ? (
          <p className="text-xs text-slate-500">{Intl.NumberFormat().format(artist.followers)} followers</p>
        ) : null}
      </div>
    </button>
  );
}


