'use strict';

/**
 * fileValidation.js
 *
 * Express middleware that validates an uploaded resume file by inspecting
 * its actual binary content (magic bytes), not the client-supplied MIME type
 * or file extension — both are trivially spoofable.
 *
 * Must run AFTER multer has populated req.file (buffer stored in memory).
 * Sets req.fileType = 'pdf' | 'docx' so downstream services know which
 * parser to call without re-detecting the type.
 *
 * Supported signatures:
 *   PDF  — %PDF  (hex: 25 50 44 46)
 *   DOCX — PK\x03\x04  (hex: 50 4B 03 04, the ZIP local-file-header signature)
 *
 * ⚠️ DOCX limitation: DOCX, XLSX, and PPTX all start with the same ZIP
 * signature.  We can only verify the ZIP container here, not that it's
 * specifically a Word document.  A misidentified XLSX would fail at the
 * mammoth parsing step with a 500, not silently succeed.
 */

// PDF magic bytes: %PDF
const PDF_MAGIC = Buffer.from([0x25, 0x50, 0x44, 0x46]);

// DOCX/ZIP magic bytes: PK\x03\x04
const DOCX_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

/**
 * Returns true if `buf` starts with the expected `magic` byte sequence.
 *
 * @param {Buffer} buf
 * @param {Buffer} magic
 * @returns {boolean}
 */
function startsWithMagic(buf, magic) {
  if (buf.length < magic.length) return false;
  return buf.slice(0, magic.length).equals(magic);
}

/**
 * Validates that req.file exists and its content matches a known PDF or
 * DOCX magic-byte signature.  Responds with 400 on failure; calls next()
 * on success after setting req.fileType.
 *
 * @param {import('express').Request}      req
 * @param {import('express').Response}     res
 * @param {import('express').NextFunction} next
 */
function validateFileUpload(req, res, next) {
  if (!req.file) {
    return res.status(400).json({
      error:   'invalid_file_type',
      message: 'No file attached. Send a PDF or DOCX file in the "resume" field.',
    });
  }

  const { buffer } = req.file;

  if (startsWithMagic(buffer, PDF_MAGIC)) {
    req.fileType = 'pdf';
    return next();
  }

  if (startsWithMagic(buffer, DOCX_MAGIC)) {
    req.fileType = 'docx';
    return next();
  }

  return res.status(400).json({
    error:   'invalid_file_type',
    message: 'Only PDF and DOCX files are accepted.',
  });
}

module.exports = { validateFileUpload };