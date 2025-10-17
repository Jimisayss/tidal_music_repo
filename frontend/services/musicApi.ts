import { AudioQuality, SearchResults, SearchType, TrackDetail, AlbumDetail } from '@/lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api';

const withBase = (path: string) => `${API_BASE}${path}`;

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Unexpected API response');
  }
  return (await response.json()) as T;
}

export async function searchMusic(
  query: string,
  type: SearchType = 'all',
  limit = 24,
  page = 1
): Promise<SearchResults> {
  const params = new URLSearchParams({ q: query, type, limit: `${limit}`, page: `${page}` });
  const res = await fetch(withBase(`/search?${params.toString()}`), {
    next: { revalidate: 0 }
  });
  return parseResponse<SearchResults>(res);
}

export async function fetchTrackDetail(id: string): Promise<TrackDetail> {
  const res = await fetch(withBase(`/tracks/${id}`), {
    next: { revalidate: 0 }
  });
  return parseResponse<TrackDetail>(res);
}

export async function fetchAlbumDetail(id: string): Promise<AlbumDetail> {
  const res = await fetch(withBase(`/albums/${id}`), {
    next: { revalidate: 0 }
  });
  return parseResponse<AlbumDetail>(res);
}

export const buildStreamUrl = (id: string, quality: AudioQuality = 'LOSSLESS') => {
  const params = new URLSearchParams({ quality });
  return withBase(`/stream/${id}?${params.toString()}`);
};

export async function fetchStreamUrl(id: string, quality: AudioQuality = 'LOSSLESS'): Promise<string> {
  return buildStreamUrl(id, quality);
}

export async function fetchAvailableFormats(id: string): Promise<AudioQuality[]> {
  const res = await fetch(withBase(`/tracks/${id}/formats`), {
    next: { revalidate: 0 }
  });
  if (res.status === 404) {
    return ['HI_RES_LOSSLESS', 'LOSSLESS', 'HIGH'];
  }
  const data = await parseResponse<{ formats: AudioQuality[] }>(res);
  return data.formats;
}

export function buildDownloadUrl(id: string, quality: AudioQuality = 'LOSSLESS') {
  const params = new URLSearchParams({ quality });
  return withBase(`/download/${id}?${params.toString()}`);
}

export function buildAlbumDownloadUrl(id: string, quality: AudioQuality = 'LOSSLESS') {
  const params = new URLSearchParams({ quality });
  return withBase(`/albums/${id}/download?${params.toString()}`);
}
