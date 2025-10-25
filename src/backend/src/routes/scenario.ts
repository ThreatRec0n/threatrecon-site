import { Router } from 'express';
import { ScenarioValidator } from '../services/scenarioValidator';
import { ScenarioService } from '../services/scenarioService';
import { logger } from '../utils/logger';
import { Scenario } from '../../shared/types';

const router = Router();
const scenarioValidator = new ScenarioValidator();
const scenarioService = new ScenarioService();

/**
 * @route POST /api/scenario/validate
 * @desc Validate a scenario JSON for safety and correctness
 * @access Public (for marketplace validation)
 */
router.post('/validate', async (req, res) => {
  try {
    const scenario = req.body as Scenario;

    if (!scenario) {
      res.status(400).json({ 
        error: 'Scenario data is required',
        status: 'fail',
        errors: ['No scenario data provided'],
        warnings: []
      });
      return;
    }

    // Validate the scenario
    const validationResult = await scenarioValidator.validateScenario(scenario);

    logger.info(`Scenario validation completed: ${validationResult.status}`, {
      scenarioId: scenario.id,
      errors: validationResult.errors.length,
      warnings: validationResult.warnings.length
    });

    res.json(validationResult);

  } catch (error) {
    logger.error('Error validating scenario:', error);
    res.status(500).json({
      status: 'fail',
      error: 'Validation failed due to internal error',
      errors: ['Internal validation error'],
      warnings: []
    });
  }
});

/**
 * @route POST /api/scenario/validate/marketplace
 * @desc Validate a scenario for marketplace publication
 * @access Public
 */
router.post('/validate/marketplace', async (req, res) => {
  try {
    const scenario = req.body as Scenario;

    if (!scenario) {
      res.status(400).json({ 
        error: 'Scenario data is required',
        status: 'fail',
        errors: ['No scenario data provided'],
        warnings: []
      });
      return;
    }

    // Validate for marketplace
    const validationResult = await scenarioValidator.validateForMarketplace(scenario);

    logger.info(`Marketplace validation completed: ${validationResult.status}`, {
      scenarioId: scenario.id,
      errors: validationResult.errors.length,
      warnings: validationResult.warnings.length
    });

    res.json(validationResult);

  } catch (error) {
    logger.error('Error validating scenario for marketplace:', error);
    res.status(500).json({
      status: 'fail',
      error: 'Validation failed due to internal error',
      errors: ['Internal validation error'],
      warnings: []
    });
  }
});

/**
 * @route GET /api/scenario/:id/validate
 * @desc Validate an existing scenario by ID
 * @access Public
 */
router.get('/:id/validate', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId || 'public';

    // Get the scenario
    const scenario = await scenarioService.getScenario(id, tenantId);
    
    if (!scenario) {
      res.status(404).json({
        status: 'fail',
        error: 'Scenario not found',
        errors: ['Scenario not found'],
        warnings: []
      });
      return;
    }

    // Validate the scenario
    const validationResult = await scenarioValidator.validateScenario(scenario);

    logger.info(`Existing scenario validation completed: ${validationResult.status}`, {
      scenarioId: id,
      errors: validationResult.errors.length,
      warnings: validationResult.warnings.length
    });

    res.json(validationResult);

  } catch (error) {
    logger.error('Error validating existing scenario:', error);
    res.status(500).json({
      status: 'fail',
      error: 'Validation failed due to internal error',
      errors: ['Internal validation error'],
      warnings: []
    });
  }
});

/**
 * @route POST /api/scenario/batch-validate
 * @desc Validate multiple scenarios at once
 * @access Public
 */
router.post('/batch-validate', async (req, res) => {
  try {
    const { scenarios } = req.body;

    if (!Array.isArray(scenarios)) {
      res.status(400).json({ 
        error: 'Scenarios array is required',
        results: []
      });
      return;
    }

    if (scenarios.length > 10) {
      res.status(400).json({ 
        error: 'Maximum 10 scenarios allowed per batch',
        results: []
      });
      return;
    }

    const results = [];

    for (const scenario of scenarios) {
      try {
        const validationResult = await scenarioValidator.validateScenario(scenario);
        results.push({
          scenarioId: scenario.id,
          ...validationResult
        });
      } catch (error) {
        results.push({
          scenarioId: scenario.id,
          status: 'fail',
          error: 'Validation failed',
          errors: ['Internal validation error'],
          warnings: []
        });
      }
    }

    logger.info(`Batch validation completed for ${scenarios.length} scenarios`);

    res.json({ results });

  } catch (error) {
    logger.error('Error in batch validation:', error);
    res.status(500).json({
      error: 'Batch validation failed due to internal error',
      results: []
    });
  }
});

export default router;
