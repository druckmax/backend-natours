const fs = require("fs");
const express = require("express");
const { allowedNodeEnvironmentFlags } = require("process");

const app = express();

// Middleware: Function that can modifiy the incoming requesst data
app.use(express.json());

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);

// Get all the tours
app.get("/api/v1/tours", (req, res) => {
  // Sending JSON back and format it according to Jsend specification
  // Additionally adding results key which holds the length of the tours array as an extra
  res.status(200).json({
    status: "success",
    results: tours.length,
    data: { tours },
  });
});

//Get a single tour
app.get("/api/v1/tours/:id", (req, res) => {
  const tour = tours.find((tour) => tour.id === +req.params.id);

  if (!tour) {
    return res.status(404).json({
      status: "fail",
      message: "Invalid ID",
    });
  }

  res.status(200).json({
    status: "success",
    data: tour,
  });
});

// Create a new tour
app.post("/api/v1/tours", (req, res) => {
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
});

// Patch a existing tour
app.patch("/api/v1/tours/:id", (req, res) => {
  if (+req.params.id > tours.length) {
    return res.status(404).json({
      status: "fail",
      message: "Invalid ID",
    });
  }

  res.status(200).json({
    status: "success",
    data: {
      tour: "<Updated tour here>",
    },
  });
});

// Delete a tour
app.delete("/api/v1/tours/:id", (req, res) => {
  if (+req.params.id > tours.length) {
    return res.status(404).json({
      status: "fail",
      message: "Invalid ID",
    });
  }

  // 204 stands for no content
  res.status(204).json({
    status: "success",
    data: null,
  });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log("Listening on port " + port));
