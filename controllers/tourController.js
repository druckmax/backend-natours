const Tour = require('../models/tourModel');

exports.getAllTours = async (req, res) => {
  try {
    // Added argument for query search, classic mongoDB way
    // const tours = await Tour.find({
    //   duration: 5,
    //   difficulty: 'easy',
    // });
    // Mongoose way to filter the results
    /* 
      const tours = await Tour.find()
      .where('duration')
      .equals(5)
      .where('difficulty')
      .equals('easy');
    */
    // Since the query object we get from req.query looks exactly the same as the one we pass in above we can simply pass in req.query
    // First we need to create a shallow copy of req.query because we want only certain queries to take effect (for example we do not want the pagination query (?page=2) for our filter)
    // We create an array of all the fields we want to exclude from the query object
    // We remove all the fields we do not want from the shallow copy of req.query with a forEach loop
    // Now we can use the queryObject in the find method to get the tours filtered for the specified queries
    // Find will return a query object which allows to append other methods right to it like sort() or where().
    // But as soon as we are using await in our find method, which returns the query object, the query will execute and come back with the documents that match the query, which makes it impossible for us to later implement sorting or pagination methods by appending them. Instead we need to save the query as an actual query without the await and then await this query in a separate line of code.

    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    const query = Tour.find(queryObj);
    const tours = await query;

    // Sending JSON back and format it according to Jsend specification
    // Additionally adding results key which holds the length of the tours array as an extra
    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: { tours },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};
exports.getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    // .findById is the same as: .findOne({ _id: req.params.id })

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
