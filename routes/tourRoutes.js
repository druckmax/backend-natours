const express = require("express");
const {
  getAllTours,
  createTour,
  getTour,
  updateTour,
  deleteTour,
  checkID,
  checkBody,
} = require("../controllers/tourController.js");

const router = express.Router();

//Middleware
router.param("id", checkID);

router.route("/").get(getAllTours).post(checkBody, createTour);

router.route("/:id").get(getTour).patch(updateTour).delete(deleteTour);

module.exports = router;
