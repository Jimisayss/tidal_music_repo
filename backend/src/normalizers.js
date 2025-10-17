const { buildCoverUrl } = require('./tidalClient');

function unwrapTrack(item = {}) {
  if (item && typeof item === 'object') {
    if (item.item) {
      return item.item;
    }
    if (item.track) {
      return item.track;
    }
  }
  return item;
}

function normalizeTrack(raw = {}) {
  const item = unwrapTrack(raw);
  return {
    id: String(item.id ?? ''),
    title: item.title || 'Unknown title',
    artistName: item.artist?.name || item.artists?.[0]?.name || 'Unknown artist',
    albumTitle: item.album?.title || item.albumTitle || null,
    albumId: item.album?.id ? String(item.album.id) : null,
    trackNumber: item.trackNumber || item.number || null,
    durationMs: typeof item.duration === 'number' ? item.duration * 1000 : item.durationMs ?? null,
    coverUrl: buildCoverUrl(item.album?.cover || item.cover),
    explicit: Boolean(item.explicit)
  };
}

function normalizeArtist(item = {}) {
  return {
    id: String(item.id ?? ''),
    name: item.name || 'Unknown artist',
    pictureUrl: buildCoverUrl(item.picture || item.image || item.cover),
    followers: item.followerCount || item.followers || null,
    popularity: item.popularity || null
  };
}

function normalizeAlbum(raw = {}) {
  const item = (raw && typeof raw === 'object' ? raw.album ?? raw : {}) || {};
  return {
    id: String(item.id ?? ''),
    title: item.title || 'Unknown album',
    coverUrl: buildCoverUrl(item.cover),
    artistName: item.artist?.name || item.artists?.[0]?.name || null,
    releaseDate: item.releaseDate || item.date || null,
    trackCount: item.numberOfTracks || item.trackCount || null,
    description: item.description || null
  };
}

module.exports = {
  normalizeTrack,
  normalizeArtist,
  normalizeAlbum
};
