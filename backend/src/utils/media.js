const { Readable } = require('node:stream');

const EXTENSION_MAP = {
  'audio/flac': '.flac',
  'audio/mpeg': '.mp3',
  'audio/mp4': '.m4a',
  'audio/aac': '.aac',
  'audio/wav': '.wav',
  'audio/x-m4a': '.m4a',
  'audio/x-wav': '.wav'
};

function guessExtension(contentType) {
  if (!contentType) {
    return '.bin';
  }
  const clean = String(contentType).split(';')[0].trim().toLowerCase();
  return EXTENSION_MAP[clean] || '.bin';
}

function sanitizeFilename(input) {
  if (!input) {
    return 'audio';
  }
  return input.replace(/[^a-z0-9\-_. ]/gi, '_');
}

function fetchToNodeStream(response) {
  const { body } = response;
  if (!body) {
    throw new Error('Upstream response has no body');
  }
  return typeof body.pipe === 'function' ? body : Readable.fromWeb(body);
}

module.exports = {
  guessExtension,
  sanitizeFilename,
  fetchToNodeStream
};
