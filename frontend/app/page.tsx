import { FavoriteShelf } from '@/components/FavoriteShelf';
import { MiniPlayer } from '@/components/MiniPlayer';
import { ResultsSection } from '@/components/ResultsSection';
import { SearchControls } from '@/components/SearchControls';
import { AlbumDetailDrawer } from '@/components/AlbumDetailDrawer';

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 pb-32">
      <header className="glass-panel rounded-3xl p-8 shadow-glow">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">HiFi Music Downloader</p>
        <h1 className="mt-4 text-4xl font-semibold text-slate-100 md:text-5xl">
          Search. Preview. Download.
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-slate-300 md:text-base">
          Tap into the TIDAL proxy catalog with fast search, silky playback previews, and direct downloads in
          lossless or hi-res formats. Favorites and recent searches are saved locally so you can jump back into the
          groove anytime.
        </p>
      </header>
      <SearchControls />
      <FavoriteShelf />
      <ResultsSection />
      <AlbumDetailDrawer />
      <MiniPlayer />
    </main>
  );
}

