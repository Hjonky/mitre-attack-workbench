const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const { checkHash, reputationVerdict } = require("../services/virusService");
const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
});
router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Choose a file first." });
  const hash = crypto
    .createHash("sha256")
    .update(req.file.buffer)
    .digest("hex");
  const raw = await checkHash(hash);
  const verdict = reputationVerdict(raw);
  res.json({
    filename: req.file.originalname,
    size: req.file.size,
    hash,
    verdict,
    raw,
  });
});
module.exports = router;
