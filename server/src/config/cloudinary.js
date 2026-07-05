// cloudinary.js — configures cloudinary with our credentials from .env

import { v2 as cloudinary } from 'cloudinary';  // import cloudinary v2 SDK

// configure cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,  // your cloud name from .env
  api_key:    process.env.CLOUDINARY_API_KEY,      // your api key from .env
  api_secret: process.env.CLOUDINARY_API_SECRET,  // your api secret from .env
});

export default cloudinary;  // export configured cloudinary instance