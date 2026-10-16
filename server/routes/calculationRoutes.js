const express = require('express');
const router = express.Router();

const {
  getCalculations,
  getCalculation,
  createCalculation,
  updateCalculation,
  duplicateCalculation,
  deleteCalculation
} = require('../controllers/calculationController');

const {
  calculationValidation,
  handleValidationErrors
} = require('../middleware/validate');

const { protect } = require('../middleware/auth');

// All calculation routes require authentication
router.use(protect);

router
  .route('/')
  .get(getCalculations)
  .post(calculationValidation, handleValidationErrors, createCalculation);

router.post('/:id/duplicate', duplicateCalculation);

router
  .route('/:id')
  .get(getCalculation)
  .put(updateCalculation)
  .delete(deleteCalculation);

module.exports = router;
