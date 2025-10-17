const express = require('express');
const { searchCategory } = require('../tidalClient');
const { normalizeTrack, normalizeArtist, normalizeAlbum } = require('../normalizers');

const router = express.Router();
const SUPPORTED_TYPES = new Set(['tracks', 'artists', 'albums', 'all']);

router.get('/', async (req, res, next) => {
  try {
    const { q, type = 'all', limit = '25', page = '1' } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Missing query parameter "q"' });
    }
    if (!SUPPORTED_TYPES.has(type)) {
      return res
        .status(400)
        .json({ error: `Unsupported type. Use one of ${Array.from(SUPPORTED_TYPES).join(', ')}` });
    }

    const searchTargets = type === 'all' ? ['tracks', 'artists', 'albums'] : [type];
    const aggregated = {
      query: q,
      results: {
        tracks: [],
        artists: [],
        albums: []
      }
    };

    await Promise.all(
      searchTargets.map(async (category) => {
        const raw = await searchCategory(category, q, {
          limit: Number(limit) || 25,
          page: Number(page) || 1
        });

        if (category === 'tracks' && Array.isArray(raw?.tracks?.items)) {
          aggregated.results.tracks = raw.tracks.items.map(normalizeTrack);
        }
        if (category === 'artists' && Array.isArray(raw?.artists?.items)) {
          aggregated.results.artists = raw.artists.items.map(normalizeArtist);
        }
        if (category === 'albums' && Array.isArray(raw?.albums?.items)) {
          aggregated.results.albums = raw.albums.items.map(normalizeAlbum);
        }
      })
    );

    res.json(aggregated.results);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

