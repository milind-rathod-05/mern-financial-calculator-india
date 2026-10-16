const Calculation = require('../models/Calculation');
const AppError = require('../utils/AppError');

/**
 * Get all calculations for the current authenticated user
 * Supports optional ?type= and ?isFavorite= query parameters
 * @route GET /api/calculations
 */
const getCalculations = async (req, res, next) => {
  try {
    const filter = { user: req.user._id };

    // Optional calculator type filter
    if (req.query.type) {
      filter.type = req.query.type;
    }

    // Optional favorite filter
    if (req.query.isFavorite !== undefined) {
      filter.isFavorite = req.query.isFavorite === 'true';
    }

    const calculations = await Calculation.find(filter).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: calculations.length,
      data: calculations
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single calculation by ID (must belong to authenticated user)
 * @route GET /api/calculations/:id
 */
const getCalculation = async (req, res, next) => {
  try {
    const calculation = await Calculation.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!calculation) {
      return next(new AppError('Calculation not found or you do not have permission to view it', 404));
    }

    res.status(200).json({
      success: true,
      data: calculation
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new calculation
 * @route POST /api/calculations
 */
const createCalculation = async (req, res, next) => {
  try {
    const { name, type, inputs, results, notes, isFavorite } = req.body;

    const calculation = await Calculation.create({
      user: req.user._id,
      name,
      type,
      inputs,
      results: results || {},
      notes: notes || '',
      isFavorite: isFavorite || false
    });

    res.status(201).json({
      success: true,
      data: calculation
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing calculation
 * @route PUT /api/calculations/:id
 */
const updateCalculation = async (req, res, next) => {
  try {
    const calculation = await Calculation.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!calculation) {
      return next(new AppError('Calculation not found or you do not have permission to update it', 404));
    }

    const { name, inputs, results, notes, isFavorite } = req.body;

    if (name !== undefined) calculation.name = name;
    if (inputs !== undefined) calculation.inputs = inputs;
    if (results !== undefined) calculation.results = results;
    if (notes !== undefined) calculation.notes = notes;
    if (isFavorite !== undefined) calculation.isFavorite = isFavorite;

    const updatedCalculation = await calculation.save();

    res.status(200).json({
      success: true,
      data: updatedCalculation
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Duplicate an existing calculation
 * @route POST /api/calculations/:id/duplicate
 */
const duplicateCalculation = async (req, res, next) => {
  try {
    const original = await Calculation.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!original) {
      return next(new AppError('Calculation not found or you do not have permission to duplicate it', 404));
    }

    const duplicate = await Calculation.create({
      user: req.user._id,
      name: `${original.name} (Copy)`,
      type: original.type,
      inputs: original.inputs,
      results: original.results,
      notes: original.notes,
      isFavorite: false
    });

    res.status(201).json({
      success: true,
      message: 'Calculation duplicated successfully',
      data: duplicate
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a calculation
 * @route DELETE /api/calculations/:id
 */
const deleteCalculation = async (req, res, next) => {
  try {
    const calculation = await Calculation.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!calculation) {
      return next(new AppError('Calculation not found or you do not have permission to delete it', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Calculation deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCalculations,
  getCalculation,
  createCalculation,
  updateCalculation,
  duplicateCalculation,
  deleteCalculation
};
