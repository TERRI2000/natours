const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

exports.deleteOne = (Model, options = {}) =>
  catchAsync(async (req, res, next) => {
    let doc;

    // Якщо є перевірка доступу
    if (options.accessCheck) {
      doc = await Model.findById(req.params.id);

      if (!doc) {
        return next(
          new AppError(
            `No ${Model.modelName.toLowerCase()} found with that ID`,
            404,
          ),
        );
      }

      const hasAccess = options.accessCheck(doc, req.user);

      if (!hasAccess) {
        return next(
          new AppError(
            'You do not have permission to perform this action',
            403,
          ),
        );
      }

      await Model.findByIdAndDelete(req.params.id);
    } else {
      doc = await Model.findByIdAndDelete(req.params.id);

      if (!doc) {
        return next(
          new AppError(
            `No ${Model.modelName.toLowerCase()} found with that ID`,
            404,
          ),
        );
      }
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model, options = {}) =>
  catchAsync(async (req, res, next) => {
    let doc;

    // Якщо є перевірка доступу
    if (options.accessCheck) {
      doc = await Model.findById(req.params.id);

      if (!doc) {
        return next(
          new AppError(
            `No ${Model.modelName.toLowerCase()} found with that ID`,
            404,
          ),
        );
      }

      const hasAccess = options.accessCheck(doc, req.user);

      if (!hasAccess) {
        return next(
          new AppError(
            'You do not have permission to perform this action',
            403,
          ),
        );
      }
    }

    // Оновлюємо документ
    doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc && !options.accessCheck) {
      return next(
        new AppError(
          `No ${Model.modelName.toLowerCase()} found with that ID`,
          404,
        ),
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query.exec();

    if (!doc) {
      return next(
        new AppError(
          `No ${Model.modelName.toLowerCase()} found with that ID`,
          404,
        ),
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

const getFilterObj = ({ paramName, foreignField }, req) => {
  const pName = req.params ? req.params[paramName] : undefined;
  return pName ? { [foreignField]: pName } : {};
};

exports.getAll = (Model, options) =>
  catchAsync(async (req, res, next) => {
    let filterObj = {};

    if (typeof options === 'object' && Object.keys(options).length) {
      filterObj = getFilterObj(options, req);
    }
    //Execute the query
    const features = new APIFeatures(Model.find(filterObj), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    // const doc = await features.query.explain();
    const doc = await features.query;

    //Sending the response
    res.status(200).json({
      status: 'success',
      result: doc.length,
      data: {
        [Model.modelName.toLowerCase()]: doc,
      },
    });
  });
