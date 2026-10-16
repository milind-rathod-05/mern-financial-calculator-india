const mongoose = require('mongoose');

const CALCULATOR_TYPES = [
  'sip',
  'step-up-sip',
  'lumpsum',
  'ppf',
  'ssa',
  'fd',
  'rd',
  'epf',
  'nps',
  'simple-interest',
  'compound-interest',
  'inflation',
  'goal-based',
  'loan-emi',
  'gold',
  'cagr',
  'xirr',
  'comparison'
];

const calculationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Calculation must belong to a user']
    },
    name: {
      type: String,
      required: [true, 'Please provide a calculation name'],
      trim: true,
      maxlength: [100, 'Calculation name cannot exceed 100 characters']
    },
    type: {
      type: String,
      required: [true, 'Please specify the calculator type'],
      enum: {
        values: CALCULATOR_TYPES,
        message: '{VALUE} is not a supported calculator type'
      }
    },
    inputs: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Calculation inputs are required']
    },
    results: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      default: ''
    },
    isFavorite: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for user querying and filtering
calculationSchema.index({ user: 1, type: 1 });
calculationSchema.index({ user: 1, updatedAt: -1 });
calculationSchema.index({ user: 1, isFavorite: 1 });

const Calculation = mongoose.model('Calculation', calculationSchema);

Calculation.CALCULATOR_TYPES = CALCULATOR_TYPES;

module.exports = Calculation;
