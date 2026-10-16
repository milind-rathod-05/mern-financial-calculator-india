const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getMe,
  updatePreferences
} = require('../controllers/authController');

const {
  registerValidation,
  loginValidation,
  handleValidationErrors
} = require('../middleware/validate');

const { protect } = require('../middleware/auth');

// Public authentication routes
router.post('/register', registerValidation, handleValidationErrors, register);
router.post('/login', loginValidation, handleValidationErrors, login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/preferences', protect, updatePreferences);

module.exports = router;
