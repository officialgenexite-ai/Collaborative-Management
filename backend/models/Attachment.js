const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      enum: ['Task', 'Comment'],
      required: true
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    fileName: {
      type: String,
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true // Cloudinary public_id — needed to delete the file later
    },
    fileType: {
      type: String // mime type, e.g. 'image/png', 'application/pdf'
    },
    fileSize: {
      type: Number // bytes
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

attachmentSchema.index({ entityType: 1, entityId: 1 });

module.exports = mongoose.model('Attachment', attachmentSchema);
