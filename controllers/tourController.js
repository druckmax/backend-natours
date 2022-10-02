const fs = require("fs");

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
);

// Param Middleware: val holds the value of the id parameter
// Helps get rid of repeated check if the id is valid
exports.checkID = (req, res, next, val) => {
  const tour = tours.find((tour) => tour.id === +req.params.id);

  if (!tour) {
    return res.status(404).json({
      status: "fail",
      message: "Invalid ID",
    });
  }
  next();
};
exports.checkBody = (req, res, next) => {
  if (!req.body.name || !req.body.price) {
    return res.status(400).json({
      status: "fail",
      message: "Missing name or price",
    });
  }
  next();
};

exports.getAllTours = (req, res) => {
  // Sending JSON back and format it according to Jsend specification
  // Additionally adding results key which holds the length of the tours array as an extra
  res.status(200).json({
    status: "success",
    requestedAt: req.requestTime,
    results: tours.length,
    data: { tours },
  });
};
exports.getTour = (req, res) => {
  const tour = tours.find((tour) => tour.id === +req.params.id);

  res.status(200).json({
    status: "success",
    data: tour,
  });
};
exports.createTour = (req, res) => {
  const newId = tours[tours.length - 1].id + 1;
  const newTour = Object.assign({ id: newId }, req.body);

  tours.push(newTour);

  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (err) => {
      // 201 stands for created
      res.status(201).json({
        status: "success",
        data: { tour: newTour },
      });
    }
  );
};

exports.updateTour = (req, res) => {
  res.status(200).json({
    status: "success",
    data: {
      tour: "<Updated tour here>",
    },
  });
};

exports.deleteTour = (req, res) => {
  // 204 stands for no content
  res.status(204).json({
    status: "success",
    data: null,
  });
};
