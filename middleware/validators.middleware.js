const requiredFields = (...fields) => (req, res, next) => {
  try {
    const missingFields = [];
    const commaSeparatedFields = fields.length > 1 ?
      fields.slice(0, fields.length - 1).join(', ') + " and " + fields[fields.length - 1] :
      fields[0];

    for (const field of fields) {
      if (!req.body[field]) {
        missingFields.push(field);
      }
    }

    if (missingFields.length) {
      return res.status(400).json({
        missingFields,
        message: `Required fields: ${commaSeparatedFields}`
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { requiredFields };