'use client';

import { formatDuration } from '@/lib/format';
import { useMusicStore } from '@/store/useMusicStore';

export function FavoriteShelf() {
  const favorites = useMusicStore((state) => state.favorites);
  const tracks = Object.values(favorites);

  if (tracks.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">Favorites</h2>
        <span className="text-xs uppercase tracking-widest text-slate-500">{tracks.length} saved</span>
      </div>
      <div className="scrollbar-thin flex gap-3 overflow-x-auto pb-2">
        {tracks.map((track) => (
          <div
            key={track.id}
            className="glass-panel min-w-[200px] rounded-2xl px-5 py-4 text-left shadow-glow"
          >
            <p className="text-sm font-semibold text-slate-100">{track.title}</p>
            <p className="text-xs text-slate-400">{track.artistName}</p>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">
              {formatDuration(track.durationMs)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

