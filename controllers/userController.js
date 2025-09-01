const multer = require('multer');
const sharp = require('sharp');
const AppError = require('../utils/appError');
const checkAccess = require('../utils/checkAccess');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handleFactory');
const { upload: cloudinaryUpload, cloudinary } = require('../utils/cloudinary');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

// Використовуємо Cloudinary для production, локальний multer для development
const upload = process.env.NODE_ENV === 'production' 
  ? cloudinaryUpload 
  : multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  if (process.env.NODE_ENV === 'production') {
    // В production Cloudinary автоматично обробляє зображення
    // req.file.path містить URL від Cloudinary
    return next();
  }

  // Для development - локальна обробка
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400,
      ),
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');
  
  // 3) Обробка фото для production (Cloudinary) та development
  if (req.file) {
    if (process.env.NODE_ENV === 'production') {
      // Cloudinary повертає URL зображення в req.file.path
      filteredBody.photo = req.file.path;
    } else {
      // Development - локальне зберігання
      filteredBody.photo = req.file.filename;
    }
  }

  // 3) Update user document
  const currentUser = await User.findById(req.user.id);
  const emailChanged = req.body.email && req.body.email !== currentUser.email;
  let updatedUser;
  
  // 4) Якщо email змінився, скинути статус підтвердження та відправити новий токен
  if (emailChanged) {
    // Скинути статус підтвердження
    filteredBody.emailConfirmed = false;

    // Оновити користувача з новими даними
    updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
      new: true,
      runValidators: true,
    });
  } else {
    updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
      new: true,
      runValidators: true,
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndDelete(req.user.id);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined! Please use /signup instead.',
  });
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);

// Do not update passwords with this!
exports.updateUser = factory.updateOne(User, {
  accessCheck: checkAccess.checkUserAccess,
});
exports.deleteUser = factory.deleteOne(User, {
  accessCheck: checkAccess.checkUserAccess,
});
