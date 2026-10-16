const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

/**
 * Generate JSON Web Token for authenticated user
 * @param {string} id - User ObjectId
 * @returns {string} - JWT Token
 */
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'fincalc_default_secret_key',
    {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  );
};

/**
 * Register a new user
 * @route POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, preferences } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('An account with this email address already exists', 400));
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      preferences: preferences || { theme: 'system', favorites: [] }
    });

    const token = generateToken(user._id);

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      preferences: user.preferences,
      createdAt: user.createdAt
    };

    res.status(201).json({
      success: true,
      token,
      user: userResponse,
      data: userResponse
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user and return JWT
 * @route POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check for user with password field included
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return next(new AppError('Invalid email or password', 401));
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return next(new AppError('Invalid email or password', 401));
    }

    const token = generateToken(user._id);

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      preferences: user.preferences,
      createdAt: user.createdAt
    };

    res.status(200).json({
      success: true,
      token,
      user: userResponse,
      data: userResponse
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get currently authenticated user
 * @route GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      preferences: user.preferences,
      createdAt: user.createdAt
    };

    res.status(200).json({
      success: true,
      user: userResponse,
      data: userResponse
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user preferences (theme, favorites)
 * @route PUT /api/auth/preferences
 */
const updatePreferences = async (req, res, next) => {
  try {
    const { theme, favorites } = req.body;

    const updateFields = {};
    if (theme !== undefined) {
      if (!['light', 'dark', 'system'].includes(theme)) {
        return next(new AppError('Invalid theme value. Allowed: light, dark, system', 400));
      }
      updateFields['preferences.theme'] = theme;
    }

    if (favorites !== undefined) {
      if (!Array.isArray(favorites)) {
        return next(new AppError('Favorites must be an array of calculator types', 400));
      }
      updateFields['preferences.favorites'] = favorites;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: updatedUser.preferences
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updatePreferences,
  generateToken
};
