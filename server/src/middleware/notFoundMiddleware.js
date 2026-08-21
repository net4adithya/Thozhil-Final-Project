import ApiError from '../utils/ApiError.js';

export const notFoundMiddleware = (req, res, next) => {
  next(new ApiError(404, 'API Route Not Found'));
};

export default notFoundMiddleware;
