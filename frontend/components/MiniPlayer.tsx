'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { formatDuration } from '@/lib/format';
import { useMusicStore } from '@/store/useMusicStore';

export function MiniPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const {
    selectedTrack,
    previewUrl,
    nextTrack,
    previousTrack,
    toggleShuffle,
    isShuffled,
    queueIndex,
    queue
  } = useMusicStore((state) => ({
    selectedTrack: state.selectedTrack,
    previewUrl: state.previewUrl,
    nextTrack: state.nextTrack,
    previousTrack: state.previousTrack,
    toggleShuffle: state.toggleShuffle,
    isShuffled: state.isShuffled,
    queueIndex: state.queueIndex,
    queue: state.queue
  }));
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (previewUrl && audioRef.current) {
      audioRef.current.load();
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      setIsPlaying(false);
    }
  }, [previewUrl]);

  const handleNext = useCallback(async () => {
    const advanced = await nextTrack();
    if (!advanced) {
      setIsPlaying(false);
    }
  }, [nextTrack]);

  const handlePrevious = useCallback(async () => {
    const moved = await previousTrack();
    if (!moved) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        await audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    } else {
      setIsPlaying(true);
    }
  }, [previousTrack]);

  const handleEnded = useCallback(async () => {
    const advanced = await nextTrack();
    if (!advanced) {
      setIsPlaying(false);
    }
  }, [nextTrack]);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    }
  };

  if (!selectedTrack || !previewUrl) {
    return null;
  }

  const hasPrevious = queueIndex > 0;
  const hasNext = queueIndex >= 0 && queueIndex < queue.length - 1;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 w-[90%] max-w-4xl -translate-x-1/2 rounded-3xl border border-slate-800/60 bg-slate-950/80 p-4 backdrop-blur-xl shadow-lg shadow-cyan-500/10">
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-slate-800/60">
          {selectedTrack.coverUrl ? (
            <Image src={selectedTrack.coverUrl} alt={selectedTrack.title} fill sizes="64px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">No art</div>
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm uppercase tracking-widest text-cyan-300">Now Playing</p>
          <h3 className="text-lg font-semibold text-slate-100">{selectedTrack.title}</h3>
          <p className="text-sm text-slate-400">
            {selectedTrack.artistName}
            {selectedTrack.durationMs ? (
              <span className="ml-2 text-xs uppercase tracking-wide text-slate-500">
                {formatDuration(selectedTrack.durationMs)}
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleShuffle}
            className={`h-10 rounded-full border px-4 text-xs font-semibold uppercase tracking-wide transition ${
              isShuffled
                ? 'border-cyan-400 bg-cyan-500/20 text-cyan-100'
                : 'border-slate-700 bg-transparent text-slate-300 hover:border-cyan-400 hover:text-cyan-200'
            }`}
          >
            Shuffle
          </button>
          <button
            type="button"
            onClick={() => void handlePrevious()}
            disabled={!hasPrevious}
            className="h-10 w-16 rounded-full border border-slate-700 text-xs font-semibold uppercase tracking-wide text-slate-300 transition hover:border-cyan-300 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={togglePlayback}
            className="h-12 w-24 rounded-full bg-cyan-400/80 text-sm font-semibold text-slate-900 shadow-glow transition hover:bg-cyan-300"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            type="button"
            onClick={() => void handleNext()}
            disabled={!hasNext}
            className="h-10 w-16 rounded-full border border-slate-700 text-xs font-semibold uppercase tracking-wide text-slate-300 transition hover:border-cyan-300 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
        <div className="text-right text-xs text-slate-500">
          {queue.length > 0 ? `${queueIndex + 1} / ${queue.length}` : null}
        </div>
        <audio ref={audioRef} controls className="hidden" src={previewUrl} onEnded={() => void handleEnded()} />
      </div>
    </div>
  );
}
