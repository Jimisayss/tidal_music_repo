const express = require('express');
const archiver = require('archiver');
const { getAlbum, getArtist, getPlaylist, getStream } = require('../tidalClient');
const { normalizeAlbum, normalizeArtist, normalizeTrack } = require('../normalizers');
const { sanitizeFilename, guessExtension, fetchToNodeStream } = require('../utils/media');

const router = express.Router();

router.get('/albums/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { album: albumPayload, tracks: trackPayload } = await getAlbum(id);
    const album = normalizeAlbum(albumPayload);
    const tracks = Array.isArray(trackPayload) ? trackPayload.map(normalizeTrack) : [];
    const orderedTracks = tracks.sort(
      (a, b) => (a.trackNumber ?? Number.MAX_SAFE_INTEGER) - (b.trackNumber ?? Number.MAX_SAFE_INTEGER)
    );

    res.json({ ...album, tracks: orderedTracks });
  } catch (error) {
    next(error);
  }
});

router.get('/albums/:id/download', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quality = 'LOSSLESS' } = req.query;

    const { album: albumPayload, tracks: trackPayload } = await getAlbum(id);
    const album = normalizeAlbum(albumPayload);
    const tracks = Array.isArray(trackPayload) ? trackPayload.map(normalizeTrack) : [];
    const orderedTracks = tracks.sort(
      (a, b) => (a.trackNumber ?? Number.MAX_SAFE_INTEGER) - (b.trackNumber ?? Number.MAX_SAFE_INTEGER)
    );

    if (orderedTracks.length === 0) {
      return res.status(404).json({ error: 'Album has no streamable tracks.' });
    }

    const zipNameRaw = `${album.artistName ? `${album.artistName} - ` : ''}${album.title || `album-${id}`}`;
    const zipName = sanitizeFilename(zipNameRaw.trim() || `album-${id}`);

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${zipName}.zip"`,
      'Cache-Control': 'private, max-age=60'
    });

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', next);
    archive.pipe(res);

    for (let index = 0; index < orderedTracks.length; index += 1) {
      const track = orderedTracks[index];
      const position = String(index + 1).padStart(2, '0');
      try {
        const { response: upstream, manifest } = await getStream(track.id, quality);
        const extension = guessExtension(upstream.headers.get('content-type') || manifest?.mimeType);
        const baseNameRaw = `${position} - ${track.artistName || album.artistName || 'Unknown Artist'} - ${
          track.title || `Track ${position}`
        }`;
        const trackName = sanitizeFilename(baseNameRaw.trim() || `${position}-${track.id}`);
        const nodeStream = fetchToNodeStream(upstream);
        archive.append(nodeStream, { name: `${trackName}${extension}` });
      } catch (trackError) {
        const errorNote = `Unable to include track ${track.title || track.id}: ${trackError.message}`;
        archive.append(`${errorNote}\n`, { name: `${position}-error-${track.id}.txt` });
      }
    }

    await archive.finalize();
  } catch (error) {
    next(error);
  }
});

router.get('/artists/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await getArtist(id);
    const normalized = normalizeArtist(data);
    res.json({ ...normalized, raw: data });
  } catch (error) {
    next(error);
  }
});

router.get('/playlists/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await getPlaylist(id);
    const tracks = Array.isArray(data?.tracks?.items)
      ? data.tracks.items.map((item) => normalizeTrack(item.track || item))
      : [];
    res.json({
      id: String(data?.uuid || id),
      title: data?.title || 'Untitled playlist',
      description: data?.description || null,
      owner: data?.creator?.name || data?.editorial || null,
      coverUrl: data?.image ? data.image : null,
      tracks
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
