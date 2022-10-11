// GLOBAL ERROR HANDLER
/*
// CREATING AN ERROR
const err = new Error('Cannot find route')
err.status = 'fail'
err.statusCode = 404
next(err)
 */

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};
