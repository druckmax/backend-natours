// CUSTOM ERROR CLASS
/* In order to avoid repeating coude and to be able to separata operational errors from programming errors, we can build our own error class.
We inherit from the Javascripts built in Error class with extends and use the constructor for the arguments we will pass in to the class when using it, namely the message and the statusCode. We call super(), which will call the parent constructor, and put the message inside it, because the message is the only paramter the original Error class accepts.

We set the status code and build the status property from this statusCode. This is because we can only have two options for status, which is either fail or error. Fail happens for all the statusCodes that start with a 4, like 400 - bad request. An error occurs when the statusCode begins with a 5, like 500 for internal server error. In order to do this we convert the statusCode to a string in order to be able to use the startsWith method.

Additionally we can create a new property on this class called isOperational. This will mark every error, which comes from our custom AppError class, as an operational error. And this is true, because we can only use AppError for opeational errors, which means error we can predict and are cause by the user, system or network. This will later help us to distinguish between operational and programming errors. This way we can make sure to only send these operational errors back to the client and avoid sending internal error caused by bugs in our code.

As a last step we need use captureStackTrace, in order for our AppError not to appear in the error stack. When we console.log for error.stack it will give us the path of where the error happened and also show us the entire call stack which originated in this error. The Error.captureStackTrace() function takes an object as the first argument, which we set to this, so the the curren object, and points to the error class itself, which is the constructor. This way we make sure not to pollute the stack track.
 */

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
