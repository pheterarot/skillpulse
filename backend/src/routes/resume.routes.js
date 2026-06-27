'use strict';

/**
 * resume.routes.js
 *
 * Defines POST /api/resume/analyze.
 * Mounted in server.js at /api/resume, so the full path is /api/resume/analyze.
 *
 * Middleware chain (in order):
 *   1. resumeLimiter      — 10 req / 15 min / IP (CONTEXT.md §6); applied
 *                           here, not globally, because it's stricter than the
 *                           100/15-min general limiter already on every route.
 *   2. multerUpload       — parses multipart/form-data; stores file in memory
 *                           so pdf-parse / mammoth can read the buffer directly.
 *                           Intercepts multer's LIMIT_FILE_SIZE error and turns
 *                           it into a 413 with the correct ApiError shape.
 *   3. validateFileUpload — magic-byte check; rejects non-PDF/DOCX with 400;
 *                           sets req.fileType for the controller.
 *   4. handleAnalyzeResume — controller (text extraction + skill matching).
 *
 * ⚠️ multer is NOT in PROJECT_SPEC.md §3's tech-stack table.
 *    It is required to receive multipart/form-data in Express.
 *    Install it with: npm install multer  (in backend/)
 */

const { Router }              = require('express');
const multer                  = require('multer');
const { resumeLimiter }       = require('../middleware/rateLimiter');
const { validateFileUpload }  = require('../middleware/fileValidation');
const { handleAnalyzeResume } = require('../controllers/resume.controller');

// 5 MB in bytes — matches CONTEXT.md §6 exactly
const MAX_FILE_BYTES = 5 * 1024 * 1024;

// Store the file in memory (no temp files on disk).
// The buffer is available as req.file.buffer after multer runs.
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: MAX_FILE_BYTES },
});

/**
 * Wraps multer's single-file parser so its internal errors are caught and
 * shaped into ApiError responses before reaching Express's error handler.
 *
 * multer throws with err.code === 'LIMIT_FILE_SIZE' when the upload exceeds
 * the configured limit.  Without this wrapper, that error would fall through
 * to errorHandler.js and return a generic 500 instead of the 413 required
 * by CONTEXT.md §5.
 */
function multerUpload(req, res, next) {
  upload.single('resume')(req, res, (err) => {
    if (!err) return next();

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error:   'file_too_large',
        message: `File exceeds the ${MAX_FILE_BYTES / (1024 * 1024)} MB limit.`,
      });
    }

    // Any other multer error (e.g. unexpected field name) → global errorHandler
    return next(err);
  });
}

const resumeRouter = Router();

resumeRouter.post(
  '/analyze',
  resumeLimiter,
  multerUpload,
  validateFileUpload,
  handleAnalyzeResume,
);

module.exports = { resumeRouter };