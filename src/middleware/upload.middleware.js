const multer = require('multer');

// Define storage (temporary; optionally extend to use disk or cloud storage)
const storage = multer.memoryStorage();

/**
 * File filter to restrict image uploads
 */
const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    cb(new Error('Only image files are allowed'), false);
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 0.5 * 1024 * 1024, // Max 0.5MB per file
  },
});

module.exports = upload;
