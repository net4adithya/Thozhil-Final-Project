import ApiError from '../utils/ApiError.js';

export const notFoundMiddleware = (req, res, next) => {
  console.log(`\n==== [INCOMING UNKNOWN ROUTE] ====`);
  console.log(`Method: ${req.method} | URL: ${req.originalUrl || req.url}`);
  console.log(`IP: ${req.ip} | Origin: ${req.headers['origin']} | Referer: ${req.headers['referer']}`);
  console.log(`User-Agent: ${req.headers['user-agent']}`);
  console.log(`Body:`, JSON.stringify(req.body));
  console.log(`=================================\n`);
  next(new ApiError(404, 'API Route Not Found'));
};

export default notFoundMiddleware;


