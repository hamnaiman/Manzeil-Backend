/**
 * Wraps an async route handler and forwards any thrown error to
 * Express's error-handling middleware, avoiding repetitive try/catch
 * blocks in every controller.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
