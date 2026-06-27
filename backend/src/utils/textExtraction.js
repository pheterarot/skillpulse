'use strict';

/**
 * textExtraction.js
 *
 * Pure utility layer: accepts a file buffer, returns a plain-text string.
 * No DB access, no Express imports, no business logic — "buffer in, text out."
 *
 * Used exclusively by resumeParser.service.js.
 *
 * Libraries:
 *   pdf-parse — extracts text from PDF buffers
 *     NOTE: pdf-parse v2 changed its API from v1. v1 was a single callable
 *     function (`pdf(buffer)`); v2 exports a `PDFParse` class instead.
 *     package.json pins pdf-parse to v2, so this file must use the v2 shape.
 *   mammoth   — extracts raw text from DOCX buffers (API unchanged across
 *     versions, still `mammoth.extractRawText({ buffer })`)
 * Both are listed in PROJECT_SPEC.md §3 and must already be installed.
 */

const { PDFParse } = require('pdf-parse');
const mammoth       = require('mammoth');

/**
 * Extracts plain text from a PDF buffer.
 *
 * @param {Buffer} buffer
 * @returns {Promise<string>}
 */
async function extractTextFromPdf(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    // Release the parser's internal resources whether parsing succeeded or not.
    await parser.destroy();
  }
}

/**
 * Extracts plain text from a DOCX buffer.
 * Uses mammoth's extractRawText so we get plain content without HTML markup.
 *
 * @param {Buffer} buffer
 * @returns {Promise<string>}
 */
async function extractTextFromDocx(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return result.value; // result.messages contains any conversion warnings
}

module.exports = { extractTextFromPdf, extractTextFromDocx };