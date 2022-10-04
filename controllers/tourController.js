const Tour = require('../models/tourModel');

exports.getAllTours = async (req, res) => {
  try {
    // Getting all the tours in the database with find method and no arguments
    const tours = await Tour.find();

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
