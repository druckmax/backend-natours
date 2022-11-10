const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

// Intialize pug engine, pug needs to be installed first
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//// 1) MIDDLEWARES
// Middleware: Function that can modifiy the incoming requesst data

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers
app.use(helmet());

// Development logging
// Third party middleware: Morgan is a logger middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit request from same API
const limiter = rateLimit({
  // max number of requests
  max: 100,
  // time window set to 100
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in 1 hour',
});
// Apply limiter only to api routes
app.use('/api', limiter);

// Body parser, reading data from the body into req.body
app.use(express.json({ limit: '10kb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());
/* It is fairly easy to be able to log in with just a password without knowing the email address. A query injection could look like this:

```json
{
  "email": { "$gt": '' },
  password: <correct password here>
}
```

This works, because all the users match the query, saying the email value should be greater than an empty string. When typing this in our mongoDB database, all the users will be returned. The statement will always return true and is avalid query, which allows the attacker to log in with only a valid password.

In order to defend our application against such kinds of attacks we need to install a package called <code>express-mongo-sanitize</code>, because express does not come with those security features out of the box. For most cases it is enough to create a middleware function from the mongoSanitize function.

MongoSanitize works by looking at the request body, query string and params and filtering out all the $-signs and dots, which is how mongoDB operators are written.
*/

// Data sanitization agianst XSS attacks (Cross-side-scripting)
app.use(xss());
/* This middleware will clean any user input from malicious html code. */

// Prevent parameter pollution
/* Gets rid of error when using multiple sort queries for example in our query string and only takes the last sorting statement. We need this because in our apiFeatures.js we defined that the queryString.sort should be a string, since we use the split method on it. Having multiple sort queries will return an array which is not ideal in our case. At the same time we want to be able to filter by other multiple queries for example duration. This is why we need to whitelist the fields in the hpp middleware for which we want to enable this functionality. */
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// Custom middleware(just for testing)
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//// 2) ROUTES
// This is called mounting the router
app.use('/', viewRouter);

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// CREATING 404
// If we are able to reach to following middleware, then this means that the route could not be found in previous middleware. This is why the 404-handler always needs to come in last, after all the other routes.
// .all runs for all the HTTP methods GET, POST, PUT etc.
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});

// GLOBAL ERROR HANDLER
app.use(globalErrorHandler);

module.exports = app;
