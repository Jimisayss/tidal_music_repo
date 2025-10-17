export type SearchType = 'all' | 'tracks' | 'artists' | 'albums';

export type AudioQuality = 'LOW' | 'HIGH' | 'LOSSLESS' | 'HI_RES_LOSSLESS';

export interface ArtistSummary {
  id: string;
  name: string;
  pictureUrl?: string;
  followers?: number;
  popularity?: number;
}

export interface AlbumSummary {
  id: string;
  title: string;
  coverUrl?: string;
  artistName?: string;
  releaseDate?: string;
  trackCount?: number;
}

export interface AlbumDetail extends AlbumSummary {
  description?: string | null;
  tracks: TrackSummary[];
}

export interface TrackSummary {
  id: string;
  title: string;
  artistName: string;
  albumTitle?: string;
  albumId?: string | null;
  trackNumber?: number | null;
  durationMs?: number;
  coverUrl?: string;
  explicit?: boolean;
  quality?: AudioQuality;
}

export interface SearchResults {
  tracks: TrackSummary[];
  artists: ArtistSummary[];
  albums: AlbumSummary[];
}

export interface TrackDetail extends TrackSummary {\r\n  lyrics?: string;\r\n  streamUrl?: string;\r\n}

export interface DownloadOptions {
  id: string;
  quality: AudioQuality;
  filename?: string;
}



