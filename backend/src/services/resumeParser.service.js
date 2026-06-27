'use strict';

/**
 * resumeParser.service.js
 *
 * Orchestration layer between the controller and the raw text-extraction
 * utilities.  Receives a file buffer + detected type, delegates to the
 * correct extractor, and returns plain text.
 *
 * Intentionally thin — no DB access, no matching logic.  Those concerns
 * live in skillMatching.service.js.
 */

const { extractTextFromPdf, extractTextFromDocx } = require('../utils/textExtraction');

/**
 * Parse a resume buffer into a plain-text string.
 *
 * @param {{ buffer: Buffer, fileType: 'pdf' | 'docx' }} opts
 *   buffer   — raw file bytes from req.file.buffer (populated by multer)
 *   fileType — 'pdf' or 'docx', set by fileValidation.js middleware
 * @returns {Promise<string>} Plain text content of the resume.
 * @throws {Error} If fileType is neither 'pdf' nor 'docx' (should never
 *   happen in practice since fileValidation.js guards the route).
 */
async function parseResume({ buffer, fileType }) {
  if (fileType === 'pdf')  return extractTextFromPdf(buffer);
  if (fileType === 'docx') return extractTextFromDocx(buffer);

  throw new Error(`Unsupported file type: "${fileType}"`);
}

module.exports = { parseResume };