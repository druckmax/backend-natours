const express = require('express');
const morgan = require('morgan');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

//// 1) MIDDLEWARES
// Middleware: Function that can modifiy the incoming requesst data
// Third party middleware: Morgan is a logger middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// Internal middlewares
app.use(express.json());
app.use(express.static(`${__dirname}/public`));

// Custom middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//// 2) ROUTES
// This is called mounting the router
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// CREATING 404
// If we are able to reach to following middleware, then this means that the route could not be found in previous middleware. This is why the 404-handler always needs to come in last, after all the other routes.
// .all runs for all the HTTP methods GET, POST, PUT etc.
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});

// GLOBAL ERROR HANDLER
app.use(globalErrorHandler);

module.exports = app;
