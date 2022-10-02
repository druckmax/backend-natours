const express = require("express");
const morgan = require("morgan");

const tourRouter = require("./routes/tourRoutes.js");
const userRouter = require("./routes/userRoutes.js");

const app = express();

//// 1) MIDDLEWARES
// Middleware: Function that can modifiy the incoming requesst data
// Third party middleware: Morgan is a logger middleware
app.use(morgan("dev"));
// Internal middlewares
app.use(express.json());
// Custom middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//// 2) ROUTES
// This is called mounting the router
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);

module.exports = app;
