const express = require('express');
const { getTrack, getLyrics } = require('../tidalClient');
const { normalizeTrack } = require('../normalizers');

const router = express.Router();

function deriveFormats(track) {
  const formats = new Set(['LOSSLESS', 'HIGH']);
  if (!track) {
    return Array.from(formats);
  }
  if (track.audioQuality) {
    formats.add(String(track.audioQuality).toUpperCase());
  }
  if (track.hiresAvailable || track.isMaster || track.masterQuality) {
    formats.add('HI_RES_LOSSLESS');
  }
  if (track.allowStreamingLowQuality) {
    formats.add('LOW');
  }
  return Array.from(formats);
}

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quality = 'LOSSLESS' } = req.query;
    const trackResponse = await getTrack(id, quality);
    const lyricsResponse = await getLyrics(id).catch(() => null);

    const normalized = normalizeTrack(trackResponse);
    const detail = {
      ...normalized,
      albumId: trackResponse?.album?.id ? String(trackResponse.album.id) : null,
      streamQuality: trackResponse?.audioQuality || quality,
      lyrics: lyricsResponse?.lyrics ?? null,
      formats: deriveFormats(trackResponse)
    };

    res.json(detail);
  } catch (error) {
    next(error);
  }
});

router.get('/:id/formats', async (req, res, next) => {
  try {
    const { id } = req.params;
    const trackResponse = await getTrack(id);
    res.json({ formats: deriveFormats(trackResponse) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

