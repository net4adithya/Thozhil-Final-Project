import ApiError from '../utils/ApiError.js';

export const validate = (schema) => (req, res, next) => {
  if (!schema) return next();
  const { error, value } = schema.validate(req.body, { abortEarly: false, allowUnknown: true });
  if (error) {
    const errorMessages = error.details.map((d) => d.message);
    return next(new ApiError(400, 'Validation Error', true, '', errorMessages));
  }
  req.body = value;
  next();
};
