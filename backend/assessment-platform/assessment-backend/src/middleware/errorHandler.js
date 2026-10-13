const { CompilerError } = require('../services/compilerService');
const multer = require('multer');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof CompilerError) {
    return res.status(err.status || 502).json({ message: err.message, code: err.code });
  }

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message, code: err.code });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }

  if (err.code === 11000) {
    return res.status(409).json({ message: 'Duplicate entry.', details: err.keyValue });
  }

  // Most controllers throw a plain Error after already calling res.status(4xx) (or,
  // less commonly, set err.status directly) — that status was getting silently
  // discarded here in favor of a flat 500, and the real message hidden behind
  // err.expose (which nothing ever sets), so essentially every intentional validation
  // error in the app — bad login, malformed bulk-import row, this file's own
  // corrupted-version check, etc — was reaching the client as a bare "Internal server
  // error." with no indication of what actually went wrong or a 500 instead of a 400.
  // A status already on `res` (or explicitly on `err`) means the controller meant to
  // signal a client-side problem, so trust it and show the real message; genuinely
  // unexpected exceptions (res.statusCode still the default 200) still fall back to a
  // generic message so we never leak internals.
  const status = err.status || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  const expose = err.expose !== undefined ? err.expose : status < 500;

  if (status >= 500) console.error('[error]', err);
  res.status(status).json({
    message: expose ? err.message : 'Internal server error.',
  });
}

module.exports = errorHandler;