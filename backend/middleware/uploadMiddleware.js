const multer = require('multer');

// Memory storage — the file buffer goes straight to Cloudinary in
// cloudinaryService.js, never written to disk, no temp files to clean up.
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB cap
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Allowed: JPG, PNG, WEBP, GIF, PDF'), false);
    }
  }
});

module.exports = upload;
