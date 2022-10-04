const Tour = require('../models/tourMode');

exports.getAllTours = (req, res) => {
  // Sending JSON back and format it according to Jsend specification
  // Additionally adding results key which holds the length of the tours array as an extra
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    // results: tours.length,
    // data: { tours },
  });
};
exports.getTour = (req, res) => {
  // const tour = tours.find((tour) => tour.id === +req.params.id);
  // res.status(200).json({
  //   status: 'success',
  //   data: tour,
  // });
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

exports.updateTour = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      tour: '<Updated tour here>',
    },
  });
};

exports.deleteTour = (req, res) => {
  // 204 stands for no content
  res.status(204).json({
    status: 'success',
    data: null,
  });
};
