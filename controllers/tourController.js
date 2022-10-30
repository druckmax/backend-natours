const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');

const catchAsync = require('../utils/catchAsync');

// ALIASING
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const tours = await features.query;
  // Sending JSON back and format it according to Jsend specification
  // Additionally adding results key which holds the length of the tours array as an extra
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { tours },
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id).populate('reviews');
  // Make use of our AppError class and throw 404 error when returned tour value is null or falsy
  if (!tour) return next(new AppError('No tour found with that ID', 404));
  res.status(200).json({
    status: 'success',
    data: tour,
  });
});

exports.createTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);
  res.status(201).json({
    status: 'success',
    data: { tour: newTour },
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  // findByIdAndUpdate to do both tasks in one function
  // Arguments: 1. ID, 2. new data 3. options:
  // Option1: new:true returns modified documents rather than the original one. Default is false
  // Option2: runValidators: runs update validators. update validators validate the update operation aginst the model's schema
  // Updates the fields that are different in the req.body, only works because we are using a PATCH request
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!tour) return next(new AppError('No tour found with that ID', 404));

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);
  if (!tour) return next(new AppError('No tour found with that ID', 404));

  // 204 stands for no content
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// AGGREGATION PIPELINE
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    { $match: { ratingsAverage: { $gte: 4.5 } } },
    {
      $group: {
        _id: '$difficulty',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    { $sort: { avgPrice: 1 } },
    // Excluding all tours with difficulty easy
    // { $match: { _id: { $ne: 'easy' } } },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

// BUSINESS EXAMPLE

exports.getMonthlyPlan = catchAsync(async (req, res) => {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    { $unwind: '$startDates' },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    { $project: { _id: 0 } },
    { $sort: { numTourStarts: -1 } },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});
