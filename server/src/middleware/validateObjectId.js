import ApiError from '../utils/ApiError.js';

const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const validateObjectId = (req, res, next) => {
  if (req.params.id && !uuidRegex.test(req.params.id)) {
    return next(new ApiError(400, 'Invalid UUID format'));
  }
  next();
};

export const validateUuid = validateObjectId;
