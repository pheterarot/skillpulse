'use strict';

/**
 * resume.controller.js
 *
 * Handles POST /api/resume/analyze.
 *
 * By the time this function runs, the middleware chain has already:
 *   1. Applied the strict rate limit (resumeLimiter)
 *   2. Parsed the multipart upload into req.file (multer)
 *   3. Validated the file exists and is a real PDF/DOCX (fileValidation.js)
 *   4. Set req.fileType = 'pdf' | 'docx'
 *
 * This controller only owns the request/response cycle — all logic
 * is delegated to the service layer.
 */

const { parseResume }         = require('../services/resumeParser.service');
const { matchSkillsFromText } = require('../services/skillMatching.service');

/**
 * POST /api/resume/analyze
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
async function handleAnalyzeResume(req, res) {
  try {
    const { buffer }   = req.file;
    const { fileType } = req;

    // Step 1 — Extract plain text from the uploaded PDF or DOCX
    const resumeText = await parseResume({ buffer, fileType });

    // Step 2 — Compare against all tracked skills in the DB
    const result = await matchSkillsFromText(resumeText);

    // Response shape matches CONTEXT.md §5 exactly:
    // { matchedSkills, missingSkills, matchPercentage }
    return res.status(200).json(result);
  } catch (err) {
    console.error('[resume.controller] Error analyzing resume:', err);
    return res.status(500).json({
      error:   'internal_server_error',
      message: 'Failed to analyze the uploaded file.',
    });
  }
}

module.exports = { handleAnalyzeResume };