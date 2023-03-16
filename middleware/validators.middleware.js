/**
 * Validation Middleware.
 * Validates that all required fields on a form have been filled out
 * @param  {...any} fields 
 * @returns 
 */
const requiredFields = (...fields) => (req, res, next) => {
  try {
    const missingFields = {};

    for (const field of fields) {
      if (!req.body[field]) {
        missingFields[field] = { message: `${field} is required` };
      }
    }

    if (missingFields.length) {
      return res.status(400).json({
        missingFields
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { requiredFields };