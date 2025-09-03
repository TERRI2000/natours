const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const AppError = require('./appError');

// Налаштування Cloudinary - використовуємо CLOUDINARY_URL якщо є, інакше окремі змінні
if (process.env.CLOUDINARY_URL) {
  // CLOUDINARY_URL автоматично налаштовує всі параметри
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Налаштування сховища для користувачів
const userStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'natours/users', // папка в Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [
      { width: 500, height: 500, crop: 'fill' }
    ],
  },
});

// Налаштування сховища для турів
const tourStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'natours/tours', // папка в Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [
      { width: 2000, height: 1333, crop: 'fill' }
    ],
  },
});

const upload = multer({ 
  storage: userStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
      cb(null, true);
    } else {
      cb(new AppError('Not an image! Please upload only images.', 400), false);
    }
  }
});

const tourUpload = multer({ 
  storage: tourStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
      cb(null, true);
    } else {
      cb(new AppError('Not an image! Please upload only images.', 400), false);
    }
  }
});

module.exports = { upload, tourUpload, cloudinary };
