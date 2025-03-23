const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.createOne = (Model) =>
  catchAsync(async (req, res, _next) => {
    // Getting data from body object of the post request.
    const newDoc = await Model.create(req.body);

    // Created
    res.status(201).json({
      status: 'success',
      data: {
        data: newDoc,
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    const docId = req.params.id;
    // findById is a wrapper function based on Model.findOne({_id: docId})
    let query = Model.findById(docId);

    if (popOptions && Object.keys(popOptions).length)
      query = query.populate(popOptions);

    // Execute query to find one.
    const doc = await query;

    if (!doc) {
      // if docId is not returning data, throw 404 error to global error handler.
      return next(new AppError('No document found with the id provided', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { data: doc },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, _next) => {
    // To allow for nested GET all moods to filter based on userId in path (request params) or checking for admin role if no userId in the path.
    const initialFilter = req.initialFilter ?? {};

    const features = new APIFeatures(Model.find(initialFilter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // Execute query:
    // const docs = await features.query.explain(); for query statics.
    const docs = await features.query;

    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: { data: docs },
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const docId = req.params.id;
    const updatedDoc = await Model.findByIdAndUpdate(docId, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedDoc) {
      // if docId is not returning data, throw 404 error to global error handler.
      return next(new AppError('No document found with the id provided', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: updatedDoc,
      },
    });
  });

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const docId = req.params.id;
    const doc = await Model.findByIdAndDelete(docId);

    if (!doc) {
      return next(new AppError('No document found with that id', 404));
    }

    res.status(204).json({
      status: 'success',
      data: {
        data: null,
      },
    });
  });
