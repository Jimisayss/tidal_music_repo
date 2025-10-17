'use client';

import Image from 'next/image';
import { formatDate } from '@/lib/format';
import type { AlbumSummary } from '@/lib/types';

interface AlbumCardProps {
  album: AlbumSummary;
  onSelect?: (album: AlbumSummary) => void;
}

export function AlbumCard({ album, onSelect }: AlbumCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(album)}
      className="glass-panel fade-in flex flex-col gap-3 rounded-3xl p-4 text-left transition hover:ring-1 hover:ring-cyan-400/40 cursor-pointer"
    >
      <div className="relative h-40 w-full overflow-hidden rounded-2xl bg-slate-800/70">
        {album.coverUrl ? (
          <Image src={album.coverUrl} alt={album.title} fill sizes="250px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">No art</div>
        )}
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-slate-100">{album.title}</h3>
        {album.artistName ? <p className="text-sm text-slate-300">{album.artistName}</p> : null}
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Released {formatDate(album.releaseDate)}
        </p>
      </div>
    </button>
  );
}


