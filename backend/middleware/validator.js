const { body, validationResult } = require('express-validator');

const validateSensorData = [
  body('electricity')
    .isNumeric().withMessage('Electricity must be a number')
    .isFloat({ min: 0, max: 10000 }).withMessage('Electricity must be between 0 and 10000'),
  body('water')
    .isNumeric().withMessage('Water must be a number')
    .isFloat({ min: 0, max: 100 }).withMessage('Water must be between 0 and 100'),
  body('timestamp')
    .optional()
    .isISO8601().withMessage('Timestamp must be a valid ISO 8601 date'),
  body('rooms')
    .optional()
    .isObject().withMessage('Rooms must be an object'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
      });
    }
    next();
  }
];

module.exports = { validateSensorData };
