// upload.js — multer middleware that sends files directly to cloudinary

import multer from 'multer';                                    // handles multipart/form-data
import { CloudinaryStorage } from 'multer-storage-cloudinary'; // cloudinary storage engine
import cloudinary from '../config/cloudinary.js';              // our configured cloudinary

// CloudinaryStorage tells multer to upload directly to cloudinary
// instead of saving to local disk first
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,        // use our configured cloudinary instance
  params: {
    folder: 'placeit/avatars',   // all profile pics go in this cloudinary folder
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'], // only image formats allowed
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' } // auto crop to face
    ],
  },
});

// create multer instance with cloudinary storage
const upload = multer({
  storage: storage,              // use cloudinary storage engine
  limits: {
    fileSize: 2 * 1024 * 1024,  // max 2MB file size
  },
  fileFilter: (req, file, cb) => {
    // only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);            // accept file
    } else {
      cb(new Error('Only image files allowed'), false); // reject file
    }
  },
});

export default upload;          // export multer middleware