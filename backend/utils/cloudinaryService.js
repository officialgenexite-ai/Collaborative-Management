const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * uploadBuffer
 * --------------
 * Uploads a file straight from memory (multer's memoryStorage buffer) —
 * no temp file ever touches disk, which matters given the RAM/storage
 * constraints this project runs under.
 * resource_type: 'auto' lets Cloudinary handle images AND PDFs correctly.
 */
function uploadBuffer(buffer, folder = 'clickup-clone') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'auto' }, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    stream.end(buffer);
  });
}

function deleteFile(publicId, resourceType = 'image') {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

module.exports = { uploadBuffer, deleteFile };
