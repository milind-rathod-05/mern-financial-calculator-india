const { body, validationResult } = require('express-validator');
const Calculation = require('../models/Calculation');

/**
 * Middleware to intercept validation errors and send standardized 400 response
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: extractedErrors
    });
  }
  next();
};

/**
 * Validation rules for user registration
 */
const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

/**
 * Validation rules for user login
 */
const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

/**
 * Validation rules for creating/updating a calculation
 */
const calculationValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Calculation name is required')
    .isLength({ max: 100 })
    .withMessage('Calculation name cannot exceed 100 characters'),
  body('type')
    .trim()
    .notEmpty()
    .withMessage('Calculation type is required')
    .isIn(Calculation.CALCULATOR_TYPES)
    .withMessage(`Calculator type must be one of: ${Calculation.CALCULATOR_TYPES.join(', ')}`),
  body('inputs')
    .notEmpty()
    .withMessage('Calculation inputs are required')
    .isObject()
    .withMessage('Inputs must be a valid JSON object')
];

module.exports = {
  handleValidationErrors,
  registerValidation,
  loginValidation,
  calculationValidation
};
