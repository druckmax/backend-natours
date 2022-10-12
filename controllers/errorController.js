const AppError = require('../utils/appError');
/* eslint-disable no-cond-assign */
/* eslint-disable no-constant-condition */
// GLOBAL ERROR HANDLER
/*
// CREATING AN ERROR
const err = new Error('Cannot find route')
err.status = 'fail'
err.statusCode = 404
next(err)
 */

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // Operational errr, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    // Programming or other unkown error: don't leak error details
  } else {
    // 1) Log error
    console.error('💥 Error:' + err);
    // 2) Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong',
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if ((process.env.NODE_ENV = 'development')) {
    sendErrorDev(err, res);
  } else if ((process.env.NODE_ENV = 'production')) {
    // Make shallow copy of the error, because it is considered bad practice to mutate a function's argument
    let newError = { ...err };

    if (newError.name === 'CastError') newError = handleCastErrorDB(newError);
    if (newError.code === 11000) newError = handleDuplicateFieldsDB(newError);
    if (newError.name === 'ValidationError')
      newError = handleValidationErrorDB(newError);

    sendErrorProd(newError, res);
  }
};

// # Error Handling in Development vs Production

/* it is comming practice do distinguis between errors in development and production. During production we want to leak as little information about our errors to the client as possible, while being in the development environment we want our error messages to be as precise and meaningful as possible. This is why we implement some logic in order to send different error messages based on the current environment.

We add the full error object and the error stack to the development error, while the production error just returns the status and the error message, and a console.error for developers. We wrap these errors in their own functions for a cleaner look.

During production we only want to send operational error messages to the client, meaning all the errors we set ourselves with the AppError class. We therefore create a a if-else block in the sendErrorProd function, which filters the errors based on the isOperational property we manually set in the AppError class. In all other cases, meaning programming or unknown errors, we want to send back a very generic error message. But for us developers, we log the error to the console as well, as a first step.

A problem that arises is that that erros coming from MongoDB, which are not marked as operational errors, will be handled by the generic error response. This means that, for example, validation errors are not shown to the client, which is of course not what we want. This is why we also need to mark those errors as operational.

There are three types of errors that might be created by MongoDB or Mongoose, which we need to mark as operational errors in order to send back meaningful error messages.

## 1.) CastError
A good example for a CastError is when the client tries to request an invalid database ID.
An invalid ID that is requested from the database is a perfect example of an operational error that is very likely to happen to the client at some point.

First we create shallow copy of the err object in the else block which accounts for the production environment, simply because mutating arguments is considered a bad practice. We can do this in ES6 manier with the spread operator. Afterwards we check if the error.name property is equal to 'CastError', and in the handleCastErrorDB function, we create a meaningful message out of the error's path and value property. The path refers to where the error happened, value is refers to the invalid user input. With this new message we create a new isntance of our AppError class and return it. Now the CastError is also marked as an operational error and will give a meaningful error response in production.

## 2.) Duplicate Key Error (code = 11000)
Another case for an operational error is when the user tries to create new document which holds a duplicate key. For example, in our schema we only allow unique tour names. So if the client tries to create a new tour with a name that already exists, we get an duplicate key error.

Handling this error is quite different, becasue it not Mongoose which is throwing the error but the underyling MongoDB driver. This is why we do not have access to the name property. But we can use the error's code property, which in this case is 11000.

Also retrieving the value of the invalid duplicate field is a bit more complex, because we have to get it from the errmsg property. In order to do that we find a regular expression that retrieves the text between quotes and use the match method to search for it. Match() will return an array and in most cases we are intereated in the first element of this array. Now again we create our meaningful message an create a new instance of our AppError class.

## 3.) Validation Error
This error happens when a validation fails, for example if the client tries to enter a rating which is larger than 5, because we set a validator that ratings cannot exceed a rating of 5.0.

This is again an error thrown by mongoose, so we can use the name property in our if-statement to account for it.

For the case of having multiple validatione errors, our returned error object has another object called errors, which holds the error data for all the invalid fields. We therefore must loop over the object and extract all the individual error messages into an array. We do this by using <code>Object.values(err.errors).map((el) => el.message)</code>. We can now simply join this array of error messages together in the message. Remember that we have this meaningful messages already, because we set them in our schema.
 */
