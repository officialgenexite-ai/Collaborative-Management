const multer = require('multer');

// Separate from uploadMiddleware.js (attachments) because allowed types
// differ — this accepts audio for voice commands and images for the
// vision-based task extractor, neither of which are permanent attachments.
const storage = multer.memoryStorage();

const aiMediaUpload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB — audio clips can run larger than typical images
  fileFilter: (req, file, cb) => {
    const allowed = [
      'audio/webm',
      'audio/mp3',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'image/jpeg',
      'image/png',
      'image/webp'
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported media type: ${file.mimetype}`), false);
    }
  }
});

module.exports = aiMediaUpload;
