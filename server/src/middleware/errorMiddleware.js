import { env } from '../config/env.js';
import ApiError from '../utils/ApiError.js';

export const errorConverter = (err, req, res, next) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    // Determine status code based on common Postgres/Supabase error codes
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Internal Server Error';

    if (error.code === '23505') {
      // Unique constraint violation (e.g. unique email or unique report index)
      statusCode = 400;
      message = error.detail || 'Resource already exists';
    } else if (error.code === '23503') {
      // Foreign key constraint violation
      statusCode = 400;
      message = error.detail || 'Referenced resource does not exist';
    } else if (error.code === '22P02') {
      // Invalid input syntax for type (e.g. invalid UUID format)
      statusCode = 400;
      message = 'Invalid data format or malformed identifier';
    } else if (error.status && typeof error.status === 'number') {
      statusCode = error.status;
    }

    error = new ApiError(statusCode, message, false, err.stack);
  }
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;
  if (env.env === 'production' && !err.isOperational) {
    statusCode = 500;
    message = 'Internal Server Error';
  }

  res.locals.errorMessage = err.message;

  const response = {
    success: false,
    code: statusCode,
    message,
    ...(err.errors && err.errors.length > 0 && { errors: err.errors }),
    ...(env.env === 'development' && { stack: err.stack }),
  };

  if (env.env === 'development') {
    console.error(err);
  }

  res.status(statusCode || 500).send(response);
};

export const errorMiddleware = (err, req, res, next) => {
  errorConverter(err, req, res, (convertedErr) => {
    errorHandler(convertedErr, req, res, next);
  });
};

export default errorMiddleware;
