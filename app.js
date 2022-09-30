const fs = require("fs");
const express = require("express");

const app = express();

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);

app.get("/api/v1/tours", (req, res) => {
  // Sending JSON back and format it according to Jsend specification
  // Additionally adding results key which holds the length of the tours array as an extra
  res.status(200).json({
    status: "success",
    results: tours.length,
    data: { tours },
  });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log("Listening on port " + port));
