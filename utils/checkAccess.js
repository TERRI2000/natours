const AppError = require('./appError');
const catchAsync = require('./catchAsync');

// Базова перевірка власності
exports.checkOwnership = (doc, user, ownerField) => {
  const ownerValue = doc[ownerField];

  if (!ownerValue) return false;

  // Використовуємо Mongoose метод для отримання ID
  const ownerId = ownerValue._id || ownerValue;
  const isOwner = ownerId.toString() === user.id;
  const isAdmin = user.role === 'admin';

  return isOwner || isAdmin;
};

// Перевірка доступу до туру
exports.checkTourAccess = (tour, user) => {
  const { role, id: userId } = user;

  // Адміни та lead-guide можуть все
  if (['admin', 'lead-guide'].includes(role)) {
    return true;
  }

  // Guide може тільки свої тури
  if (role === 'guide') {
    return tour.guides.some((guideId) => guideId.toString() === userId);
  }

  return false;
};

// Перевірка доступу до review
exports.checkReviewAccess = (review, user) => {
  return exports.checkOwnership(review, user, 'user');
};

// Перевірка доступу до користувача (тільки свій профіль або адмін)
exports.checkUserAccess = (targetUser, currentUser) => {
  const isOwn = targetUser._id.toString() === currentUser.id;
  const isAdmin = currentUser.role === 'admin';

  return isOwn || isAdmin;
};

// Універсальний middleware creator
exports.createAccessMiddleware = (Model, accessChecker) => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.findById(req.params.id);

    if (!doc) {
      return next(
        new AppError(
          `No ${Model.modelName.toLowerCase()} found with that ID`,
          404,
        ),
      );
    }

    const hasAccess = accessChecker(doc, req.user);

    if (!hasAccess) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }

    req.doc = doc;
    next();
  });
};

// Готові middleware для різних моделей
exports.tourAccessMiddleware = (Model) =>
  exports.createAccessMiddleware(Model, exports.checkTourAccess);

exports.reviewAccessMiddleware = (Model) =>
  exports.createAccessMiddleware(Model, exports.checkReviewAccess);

exports.userAccessMiddleware = (Model) =>
  exports.createAccessMiddleware(Model, exports.checkUserAccess);

// Простий middleware для перевірки власності по полю
exports.ownershipMiddleware = (Model, ownerField) =>
  exports.createAccessMiddleware(Model, (doc, user) =>
    exports.checkOwnership(doc, user, ownerField),
  );
