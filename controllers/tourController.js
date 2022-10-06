const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');

// ALIASING
/* Here we create our own custom middleware, which will be used for the /top-5-tours route. This way we can make a custom route, which handels some search results that are often requested or we'd like to offer the client. By using the middleware, we can prefill the query object with some properties, which then will be handled in the getAllTours controller function. So we can call the getAllTours function from our new route, but by putting a the alias middleware before it, we configure the query object to filter our results, even if the user does not pass in any queries by him-/herself. */
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = async (req, res) => {
  try {
    /* In summary: We are creating a new object out of the APIFeatures class. In there we are passing a queryObject and the queryString that is coming from express. In each of the four methods we chain onto the object, we manipulate the query. By the end we simply await the result, so that it can come back with all the documents that we selected. This query now lives at features, which is the new obejct we created.
     */

    // EXECUTE QUERY
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
  } catch (err) {
    console.error(err);
    res.status(404).json({
      status: 'fail',
      message: err.message,
    });
  }
};
exports.getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: tour,
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};
exports.createTour = async (req, res) => {
  try {
    /*   const newTour = new Tour({});
  newTour.save(); */
    // is similar to the code below. save and create return both a promise
    const newTour = await Tour.create(req.body);

    // 201 stands for created
    res.status(201).json({
      status: 'success',
      data: { tour: newTour },
    });
  } catch (err) {
    // 400 stands for bad request
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    // findByIdAndUpdate to do both tasks in one function
    // Arguments: 1. ID, 2. new data 3. options:
    // Option1: new:true returns modified documents rather than the original one. Default is false
    // Option2: runValidators: runs update validators. update validators validate the update operation aginst the model's schema
    // Updates the fields that are different in the req.body, only works because we are using a PATCH request
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);
    // 204 stands for no content
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};
