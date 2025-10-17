const config = require('./config');
const MemoryCache = require('./cache');

const cache = new MemoryCache({ ttlMs: config.cacheTtlMs, maxEntries: config.cacheMaxEntries });

const CATEGORY_PARAM = {
  tracks: 's',
  artists: 'a',
  albums: 'al'
};

const DEFAULT_HEADERS = {
  Accept: 'application/json'
};

function buildUrl(path, query = {}) {
  const url = new URL(path, config.apiBaseUrl);
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    url.searchParams.set(key, value);
  });
  return url;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504, 524]);

async function fetchJson(path, query, options = {}) {
  const { cacheKey, ttlMs, retries = 2, retryDelayMs = 350 } = options;
  if (cacheKey) {
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const url = buildUrl(path, query);
  let attempt = 0;
  // total attempts = retries + 1
  while (true) {
    try {
      const response = await fetch(url, { headers: DEFAULT_HEADERS });
      if (!response.ok) {
        const text = await response.text();
        const error = new Error(`Tidal API error ${response.status}: ${text.slice(0, 512)}`);
        error.status = response.status;
        if (attempt < retries && RETRYABLE_STATUS_CODES.has(response.status)) {
          attempt += 1;
          await sleep(retryDelayMs * attempt);
          continue;
        }
        throw error;
      }
      const payload = await response.json();
      if (cacheKey) {
        cache.set(cacheKey, payload, ttlMs);
      }
      return payload;
    } catch (error) {
      if (
        attempt < retries &&
        (error?.status ? RETRYABLE_STATUS_CODES.has(error.status) : true)
      ) {
        attempt += 1;
        await sleep(retryDelayMs * attempt);
        continue;
      }
      throw error;
    }
  }
}

async function fetchStream(path, query) {
  const url = buildUrl(path, query);
  return fetch(url);
}

function buildCoverUrl(coverId, size = 640) {
  if (!coverId) {
    return null;
  }

  if (typeof coverId === 'number' || /^\d+$/.test(String(coverId))) {
    return buildUrl('/cover/', { id: coverId }).toString();
  }

  const slug = String(coverId).replace(/-/g, '/');
  return `https://resources.tidal.com/images/${slug}/${size}x${size}.jpg`;
}

async function searchCategory(category, query, { limit = 25, page = 1 } = {}) {
  const paramKey = CATEGORY_PARAM[category];
  if (!paramKey) {
    throw new Error(`Unsupported search category: ${category}`);
  }

  const params = {
    [paramKey]: query,
    li: limit,
    p: page
  };
  return fetchJson('/search/', params, {
    cacheKey: `search:${category}:${query}:${limit}:${page}`
  });
}

async function getTrack(id, quality = 'LOSSLESS') {
  const data = await fetchJson('/track/', { id, quality }, { cacheKey: `track:${id}:${quality}` });
  if (Array.isArray(data)) {
    const detailEntry = data.find((entry) => entry && typeof entry === 'object' && 'id' in entry) ?? data[0];
    const manifestEntry = data.find((entry) => entry && typeof entry === 'object' && 'manifest' in entry);
    const originalEntry = data.find(
      (entry) => entry && typeof entry === 'object' && 'OriginalTrackUrl' in entry
    );
    const track = detailEntry && typeof detailEntry === 'object' ? { ...detailEntry } : detailEntry;
    if (track && typeof track === 'object') {
      if (manifestEntry) {
        track.manifest = manifestEntry;
      }
      if (originalEntry && originalEntry.OriginalTrackUrl) {
        track.originalTrackUrl = originalEntry.OriginalTrackUrl;
      }
    }
    return track;
  }
  return data;
}

async function getLyrics(id) {
  return fetchJson('/lyrics/', { id }, { cacheKey: `lyrics:${id}` });
}

async function getAlbum(id) {
  const data = await fetchJson('/album/', { id }, { cacheKey: `album:${id}` });
  if (Array.isArray(data)) {
    const [albumMeta, trackPayload] = data;
    const trackItems = Array.isArray(trackPayload?.items)
      ? trackPayload.items.map((entry) => entry.item ?? entry)
      : Array.isArray(albumMeta?.tracks?.items)
      ? albumMeta.tracks.items.map((entry) => entry.item ?? entry)
      : [];
    return { album: albumMeta, tracks: trackItems };
  }
  if (data && typeof data === 'object' && Array.isArray(data.items)) {
    return { album: data, tracks: data.items };
  }
  return { album: data, tracks: [] };
}

async function getArtist(id) {
  return fetchJson('/artist/', { id }, { cacheKey: `artist:${id}` });
}

async function getPlaylist(id) {
  return fetchJson('/playlist/', { id }, { cacheKey: `playlist:${id}` });
}

async function getStream(id, quality = 'LOSSLESS') {
  const manifest = await getHiResDash(id, quality);
  const streamUrl = Array.isArray(manifest?.urls) ? manifest.urls[0] : null;
  if (!streamUrl) {
    const error = new Error('Playback manifest did not include any stream URLs');
    error.status = 502;
    throw error;
  }
  const response = await fetch(streamUrl);
  if (!response.ok) {
    const text = await response.text();
    const error = new Error(`Stream request failed ${response.status}: ${text}`);
    error.status = response.status;
    throw error;
  }
  return { response, manifest };
}

async function getHiResDash(id, quality = 'HI_RES_LOSSLESS') {
  return fetchJson('/dash/', { id, quality }, { cacheKey: `dash:${id}:${quality}` });
}

module.exports = {
  searchCategory,
  getTrack,
  getLyrics,
  getAlbum,
  getArtist,
  getPlaylist,
  getStream,
  getHiResDash,
  buildCoverUrl,
  buildUrl
};

