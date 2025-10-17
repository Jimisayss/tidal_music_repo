import { create } from 'zustand';
import type { StateStorage } from 'zustand/middleware';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  AlbumDetail,
  AlbumSummary,
  AudioQuality,
  SearchResults,
  SearchType,
  TrackDetail,
  TrackSummary
} from '@/lib/types';
import {
  buildAlbumDownloadUrl,
  buildDownloadUrl,
  fetchAlbumDetail,
  fetchAvailableFormats,
  fetchStreamUrl,
  fetchTrackDetail,
  searchMusic
} from '@/services/musicApi';

const DEFAULT_FORMATS: AudioQuality[] = ['HI_RES_LOSSLESS', 'LOSSLESS', 'HIGH'];
const DEFAULT_QUALITY: AudioQuality = 'LOSSLESS';

const emptyResults: SearchResults = {
  tracks: [],
  artists: [],
  albums: []
};

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => void 0,
  removeItem: () => void 0
};

function shuffleArray<T>(items: readonly T[]): T[] {
  const clone = [...items];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

interface MusicState {
  query: string;
  searchType: SearchType;
  results: SearchResults;
  loading: boolean;
  error: string | null;
  selectedTrack: TrackDetail | null;
  previewUrl: string | null;
  availableFormats: AudioQuality[];
  favorites: Record<string, TrackSummary>;
  savedSearches: string[];
  selectedAlbum: AlbumDetail | null;
  albumLoading: boolean;
  albumError: string | null;
  queue: TrackSummary[];
  queueOriginal: TrackSummary[];
  queueIndex: number;
  isShuffled: boolean;
  playbackQuality: AudioQuality;
  setQuery: (query: string) => void;
  setSearchType: (type: SearchType) => void;
  search: (query?: string) => Promise<void>;
  playTrack: (track: TrackSummary, quality?: AudioQuality) => Promise<void>;
  playAlbumTracks: (
    tracks: TrackSummary[],
    startIndex?: number,
    options?: { quality?: AudioQuality; shuffle?: boolean }
  ) => Promise<void>;
  nextTrack: () => Promise<boolean>;
  previousTrack: () => Promise<boolean>;
  toggleShuffle: () => void;
  setPlaybackQuality: (quality: AudioQuality) => void;
  toggleFavorite: (track: TrackSummary) => void;
  clearError: () => void;
  openAlbum: (album: AlbumSummary) => Promise<void>;
  closeAlbum: () => void;
}

export const useMusicStore = create<MusicState>()(
  persist(
    (set, get) => {
      const loadTrackForPlayback = async (track: TrackSummary, quality: AudioQuality) => {
        set({ loading: true, error: null });
        try {
          const [detail, formats] = await Promise.all([
            fetchTrackDetail(track.id),
            fetchAvailableFormats(track.id).catch(() => get().availableFormats || DEFAULT_FORMATS)
          ]);
          const streamUrl = await fetchStreamUrl(track.id, quality);
          const merged: TrackDetail = {
            ...track,
            ...detail,
            streamUrl
          };
          set({
            selectedTrack: merged,
            previewUrl: streamUrl,
            availableFormats: formats.length ? formats : DEFAULT_FORMATS,
            loading: false,
            error: null
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unable to start playback';
          set({ loading: false, error: message });
          throw error;
        }
      };

      const prepareQueue = (
        tracks: TrackSummary[],
        startIndex: number,
        shuffle: boolean
      ) => {
        const queueOriginal = tracks.map((track) => ({ ...track }));
        let queue = [...queueOriginal];
        let queueIndex = Math.min(Math.max(startIndex, 0), Math.max(queue.length - 1, 0));
        if (shuffle && queue.length > 1) {
          const startTrack = queue[queueIndex];
          const remaining = queue.filter((item) => item.id !== startTrack.id);
          const shuffled = shuffleArray(remaining);
          queue = [startTrack, ...shuffled];
          queueIndex = 0;
        }
        set({
          queue: queue,
          queueOriginal,
          queueIndex,
          isShuffled: shuffle
        });
        return queue[queueIndex];
      };

      return {
        query: '',
        searchType: 'all',
        results: emptyResults,
        loading: false,
        error: null,
        selectedTrack: null,
        previewUrl: null,
        availableFormats: DEFAULT_FORMATS,
        favorites: {},
        savedSearches: [],
        selectedAlbum: null,
        albumLoading: false,
        albumError: null,
        queue: [],
        queueOriginal: [],
        queueIndex: -1,
        isShuffled: false,
        playbackQuality: DEFAULT_QUALITY,
        setQuery: (query) => set({ query }),
        setSearchType: (searchType) => set({ searchType }),
        search: async (incomingQuery) => {
          const query = (incomingQuery ?? get().query).trim();
          if (!query) {
            return;
          }
          set({ loading: true, error: null });
          try {
            const results = await searchMusic(query, get().searchType);
            const savedSearches = new Set([query, ...get().savedSearches]);
            set({
              results,
              loading: false,
              savedSearches: Array.from(savedSearches).slice(0, 10)
            });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unable to fetch search results';
            set({ loading: false, error: message });
          }
        },
        playTrack: async (track, quality) => {
          const state = get();
          const chosenQuality = quality ?? state.playbackQuality ?? DEFAULT_QUALITY;
          let queue = state.queue.length ? [...state.queue] : [];
          let queueOriginal = state.queueOriginal.length ? [...state.queueOriginal] : [];
          let queueIndex = queue.findIndex((item) => item.id === track.id);
          let isShuffled = state.isShuffled;

          if (queueIndex === -1) {
            const originalIndex = queueOriginal.findIndex((item) => item.id === track.id);
            if (!isShuffled && originalIndex !== -1) {
              queue = [...queueOriginal];
              queueIndex = originalIndex;
            }
          }

          if (queueIndex === -1) {
            queueOriginal = [track];
            queue = [track];
            queueIndex = 0;
            isShuffled = false;
          }

          set({
            queue,
            queueOriginal,
            queueIndex,
            isShuffled,
            playbackQuality: chosenQuality
          });

          await loadTrackForPlayback(queue[queueIndex], chosenQuality);
        },
        playAlbumTracks: async (tracks, startIndex = 0, options) => {
          if (!tracks || tracks.length === 0) {
            return;
          }
          const deduped = tracks.filter(
            (track, index, array) => array.findIndex((item) => item.id === track.id) === index
          );
          const chosenQuality =
            options?.quality ?? get().playbackQuality ?? DEFAULT_QUALITY;
          const shuffle = options?.shuffle ?? false;
          const trackToPlay = prepareQueue(deduped, startIndex, shuffle);
          set({ playbackQuality: chosenQuality });
          await loadTrackForPlayback(trackToPlay, chosenQuality);
        },
        nextTrack: async () => {
          const state = get();
          if (state.queueIndex < 0 || state.queueIndex >= state.queue.length - 1) {
            return false;
          }
          const nextIndex = state.queueIndex + 1;
          const nextTrack = state.queue[nextIndex];
          set({ queueIndex: nextIndex });
          await loadTrackForPlayback(nextTrack, state.playbackQuality);
          return true;
        },
        previousTrack: async () => {
          const state = get();
          if (state.queueIndex <= 0) {
            return false;
          }
          const previousIndex = state.queueIndex - 1;
          const previousTrack = state.queue[previousIndex];
          set({ queueIndex: previousIndex });
          await loadTrackForPlayback(previousTrack, state.playbackQuality);
          return true;
        },
        toggleShuffle: () => {
          const state = get();
          if (state.queue.length <= 1) {
            return;
          }
          const currentTrack = state.queue[state.queueIndex] ?? state.selectedTrack;
          if (!currentTrack) {
            return;
          }
          if (!state.isShuffled) {
            const remaining = state.queueOriginal.filter((item) => item.id !== currentTrack.id);
            const shuffled = shuffleArray(remaining);
            set({
              queue: [currentTrack, ...shuffled],
              queueIndex: 0,
              isShuffled: true
            });
          } else {
            const queueOriginal = [...state.queueOriginal];
            const newIndex = queueOriginal.findIndex((item) => item.id === currentTrack.id);
            set({
              queue: queueOriginal,
              queueIndex: newIndex >= 0 ? newIndex : 0,
              isShuffled: false
            });
          }
        },
        setPlaybackQuality: (quality) => {
          set({ playbackQuality: quality });
        },
        toggleFavorite: (track) => {
          const favorites = { ...get().favorites };
          if (favorites[track.id]) {
            delete favorites[track.id];
          } else {
            favorites[track.id] = track;
          }
          set({ favorites });
        },
        clearError: () => set({ error: null }),
        openAlbum: async (album) => {
          const existing = get().selectedAlbum;
          if (existing?.id === album.id && existing.tracks.length > 0) {
            return;
          }
          const placeholder: AlbumDetail = { ...album, tracks: [] };
          set({
            selectedAlbum: placeholder,
            albumLoading: true,
            albumError: null
          });
          try {
            const detail = await fetchAlbumDetail(album.id);
            set({
              selectedAlbum: detail,
              albumLoading: false
            });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unable to load album details';
            set({ albumLoading: false, albumError: message });
          }
        },
        closeAlbum: () =>
          set({
            selectedAlbum: null,
            albumLoading: false,
            albumError: null
          })
      };
    },
    {
      name: 'hifi-music-storage',
      storage: createJSONStorage(() =>
        typeof window === 'undefined' ? noopStorage : window.localStorage
      ),
      partialize: (state) => ({
        favorites: state.favorites,
        savedSearches: state.savedSearches
      })
    }
  )
);

export const getDownloadUrl = (trackId: string, quality: AudioQuality = DEFAULT_QUALITY) =>
  buildDownloadUrl(trackId, quality);

export const getAlbumDownloadUrl = (
  albumId: string,
  quality: AudioQuality = DEFAULT_QUALITY
) => buildAlbumDownloadUrl(albumId, quality);
