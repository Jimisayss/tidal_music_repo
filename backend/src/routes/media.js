const express = require('express');
const { pipeline } = require('node:stream/promises');
const { getStream, getTrack } = require('../tidalClient');
const { normalizeTrack } = require('../normalizers');
const { guessExtension, sanitizeFilename, fetchToNodeStream } = require('../utils/media');

const router = express.Router();

async function pipeResponse(upstream, res, options = {}) {
  const { fallbackType = 'audio/flac', disposition } = options;
  const contentType = upstream.headers.get('content-type') || fallbackType;
  const contentLength = upstream.headers.get('content-length');
  const acceptRanges = upstream.headers.get('accept-ranges');

  res.set('Cache-Control', 'private, max-age=60');
  res.set('Content-Type', contentType);
  if (contentLength) {
    res.set('Content-Length', contentLength);
  }
  if (acceptRanges) {
    res.set('Accept-Ranges', acceptRanges);
  }
  if (disposition) {
    res.set('Content-Disposition', disposition);
  }

  const nodeStream = fetchToNodeStream(upstream);
  await pipeline(nodeStream, res).catch((error) => {
    if (!res.headersSent) {
      res.set('Connection', 'close');
    }
    throw error;
  });
}

router.get('/stream/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quality = 'LOSSLESS' } = req.query;
    const { response: upstream, manifest } = await getStream(id, quality);
    await pipeResponse(upstream, res, { fallbackType: manifest?.mimeType || 'audio/flac' });
  } catch (error) {
    next(error);
  }
});

router.get('/download/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quality = 'LOSSLESS' } = req.query;

    const [{ response: upstream, manifest }, trackInfo] = await Promise.all([
      getStream(id, quality),
      getTrack(id, quality).catch(() => null)
    ]);

    let filename = `tidal-track-${id}`;
    if (trackInfo) {
      const normalized = normalizeTrack(trackInfo);
      filename = `${normalized.artistName} - ${normalized.title}`;
    }
    filename = sanitizeFilename(filename).replace(/\s+/g, ' ').trim();

    const extension = guessExtension(upstream.headers.get('content-type') || manifest?.mimeType);
    const disposition = `attachment; filename="${filename}${extension}"`;

    await pipeResponse(upstream, res, {
      fallbackType: manifest?.mimeType || 'audio/flac',
      disposition
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
