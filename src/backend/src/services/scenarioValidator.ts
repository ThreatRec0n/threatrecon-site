import { Scenario, Inject, BranchingRule, EndCondition } from '../shared/types';
import { logger } from '../utils/logger';

export interface ValidationResult {
  status: 'pass' | 'warn' | 'fail';
  errors: string[];
  warnings: string[];
  summary: {
    totalInjects: number;
    totalRoles: number;
    totalBranches: number;
    estimatedDuration: number;
  };
}

export class ScenarioValidator {
  /**
   * Validate a scenario JSON for marketplace and live session safety
   */
  async validateScenario(scenario: Scenario): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Basic structure validation
      this.validateBasicStructure(scenario, errors, warnings);
      
      // Inject validation
      this.validateInjects(scenario, errors, warnings);
      
      // Branching logic validation
      this.validateBranchingLogic(scenario, errors, warnings);
      
      // End conditions validation
      this.validateEndConditions(scenario, errors, warnings);
      
      // Timing validation
      this.validateTiming(scenario, errors, warnings);
      
      // Reachability analysis
      this.validateReachability(scenario, errors, warnings);
      
      // Circular dependency detection
      this.validateCircularDependencies(scenario, errors, warnings);

      // Determine overall status
      let status: 'pass' | 'warn' | 'fail' = 'pass';
      if (errors.length > 0) {
        status = 'fail';
      } else if (warnings.length > 0) {
        status = 'warn';
      }

      const summary = {
        totalInjects: scenario.injects.length,
        totalRoles: scenario.roles.length,
        totalBranches: scenario.branching_rules.length,
        estimatedDuration: scenario.duration_minutes
      };

      logger.info(`Scenario validation completed: ${status}`, {
        scenarioId: scenario.id,
        errors: errors.length,
        warnings: warnings.length
      });
      
      if (warnings.length > 0) {
        logger.warn('Validation warnings:', warnings);
      }
      
      if (errors.length > 0) {
        logger.error('Validation errors:', errors);
      }

      return {
        status,
        errors,
        warnings,
        summary
      };

    } catch (error) {
      logger.error('Error validating scenario:', error);
      return {
        status: 'fail',
        errors: ['Validation failed due to internal error'],
        warnings: [],
        summary: {
          totalInjects: 0,
          totalRoles: 0,
          totalBranches: 0,
          estimatedDuration: 0
        }
      };
    }
  }

  /**
   * Validate basic scenario structure
   */
  private validateBasicStructure(scenario: Scenario, errors: string[], warnings: string[]): void {
    // Required fields
    if (!scenario.id || scenario.id.trim().length === 0) {
      errors.push('Scenario ID is required');
    }

    if (!scenario.title || scenario.title.trim().length === 0) {
      errors.push('Scenario title is required');
    }

    if (!scenario.description || scenario.description.trim().length === 0) {
      errors.push('Scenario description is required');
    }

    if (!['low', 'medium', 'high'].includes(scenario.difficulty)) {
      errors.push('Difficulty must be low, medium, or high');
    }

    if (scenario.duration_minutes <= 0) {
      errors.push('Duration must be greater than 0 minutes');
    }

    // Roles validation
    if (!Array.isArray(scenario.roles) || scenario.roles.length === 0) {
      errors.push('At least one role is required');
    } else {
      const uniqueRoles = new Set(scenario.roles);
      if (uniqueRoles.size !== scenario.roles.length) {
        errors.push('Duplicate roles found');
      }
      
      scenario.roles.forEach((role, index) => {
        if (!role || role.trim().length === 0) {
          errors.push(`Role at index ${index} is empty`);
        }
      });
    }

    // Injects validation
    if (!Array.isArray(scenario.injects) || scenario.injects.length === 0) {
      errors.push('At least one inject is required');
    }

    // End conditions validation
    if (!Array.isArray(scenario.end_conditions) || scenario.end_conditions.length === 0) {
      errors.push('At least one end condition is required');
    }
  }

  /**
   * Validate all injects in the scenario
   */
  private validateInjects(scenario: Scenario, errors: string[], warnings: string[]): void {
    const injectIds = new Set<string>();
    const validRoles = new Set(scenario.roles);

    scenario.injects.forEach((inject, index) => {
      // Unique ID validation
      if (!inject.id || inject.id.trim().length === 0) {
        errors.push(`Inject ${index}: ID is required`);
      } else if (injectIds.has(inject.id)) {
        errors.push(`Inject ${index}: Duplicate ID '${inject.id}'`);
      } else {
        injectIds.add(inject.id);
      }

      // Type validation
      if (!inject.type || !['text', 'sim_log', 'email', 'siem', 'file', 'manual'].includes(inject.type)) {
        errors.push(`Inject ${index}: Invalid type '${inject.type}'`);
      }

      // Time offset validation
      if (inject.time_offset_minutes < 0) {
        errors.push(`Inject ${index}: Time offset cannot be negative`);
      }

      // Target roles validation
      if (!Array.isArray(inject.target_roles) || inject.target_roles.length === 0) {
        errors.push(`Inject ${index}: At least one target role is required`);
      } else {
        inject.target_roles.forEach(role => {
          if (!validRoles.has(role)) {
            errors.push(`Inject ${index}: Target role '${role}' not found in scenario roles`);
          }
        });
      }

      // Content validation
      if (!inject.content || inject.content.trim().length === 0) {
        errors.push(`Inject ${index}: Content is required`);
      }

      // Severity validation
      if (!['info', 'warning', 'critical'].includes(inject.severity)) {
        errors.push(`Inject ${index}: Invalid severity '${inject.severity}'`);
      }

      // Required actions validation
      if (inject.required_actions) {
        inject.required_actions.forEach((action, actionIndex) => {
          if (!validRoles.has(action.role)) {
            errors.push(`Inject ${index}, Action ${actionIndex}: Invalid role '${action.role}'`);
          }
          if (!action.action || action.action.trim().length === 0) {
            errors.push(`Inject ${index}, Action ${actionIndex}: Action description is required`);
          }
          if (action.timeout_minutes <= 0) {
            errors.push(`Inject ${index}, Action ${actionIndex}: Timeout must be positive`);
          }
          if (action.penalty_points < 0) {
            errors.push(`Inject ${index}, Action ${actionIndex}: Penalty points cannot be negative`);
          }
        });
      }

      // Branching validation
      if (inject.branching) {
        inject.branching.forEach((branch, branchIndex) => {
          if (!branch.if || branch.if.trim().length === 0) {
            errors.push(`Inject ${index}, Branch ${branchIndex}: Condition is required`);
          }
          if (!branch.goto || branch.goto.trim().length === 0) {
            errors.push(`Inject ${index}, Branch ${branchIndex}: Goto target is required`);
          } else if (!injectIds.has(branch.goto)) {
            errors.push(`Inject ${index}, Branch ${branchIndex}: Goto target '${branch.goto}' not found`);
          }
          if (branch.else && !injectIds.has(branch.else)) {
            errors.push(`Inject ${index}, Branch ${branchIndex}: Else target '${branch.else}' not found`);
          }
        });
      }
    });
  }

  /**
   * Validate branching rules
   */
  private validateBranchingLogic(scenario: Scenario, errors: string[], warnings: string[]): void {
    const injectIds = new Set(scenario.injects.map(i => i.id));

    scenario.branching_rules.forEach((rule, index) => {
      if (!rule.id || rule.id.trim().length === 0) {
        errors.push(`Branching rule ${index}: ID is required`);
      }

      if (!rule.condition || rule.condition.trim().length === 0) {
        errors.push(`Branching rule ${index}: Condition is required`);
      }

      if (!rule.true_goto || rule.true_goto.trim().length === 0) {
        errors.push(`Branching rule ${index}: True goto target is required`);
      } else if (!injectIds.has(rule.true_goto)) {
        errors.push(`Branching rule ${index}: True goto target '${rule.true_goto}' not found`);
      }

      if (rule.false_goto && !injectIds.has(rule.false_goto)) {
        errors.push(`Branching rule ${index}: False goto target '${rule.false_goto}' not found`);
      }

      if (rule.timeout_goto && !injectIds.has(rule.timeout_goto)) {
        errors.push(`Branching rule ${index}: Timeout goto target '${rule.timeout_goto}' not found`);
      }

      if (rule.timeout_minutes !== undefined && rule.timeout_minutes <= 0) {
        errors.push(`Branching rule ${index}: Timeout must be positive`);
      }
    });
  }

  /**
   * Validate end conditions
   */
  private validateEndConditions(scenario: Scenario, errors: string[], warnings: string[]): void {
    const injectIds = new Set(scenario.injects.map(i => i.id));

    scenario.end_conditions.forEach((condition, index) => {
      if (!condition.type || !['time_elapsed', 'all_injects_complete', 'manual_end'].includes(condition.type)) {
        errors.push(`End condition ${index}: Invalid type '${condition.type}'`);
      }

      if (condition.type === 'time_elapsed' && (!condition.minutes || condition.minutes <= 0)) {
        errors.push(`End condition ${index}: Minutes must be positive for time_elapsed type`);
      }

      if (condition.type === 'all_injects_complete' && condition.inject_ids) {
        condition.inject_ids.forEach(injectId => {
          if (!injectIds.has(injectId)) {
            errors.push(`End condition ${index}: Inject ID '${injectId}' not found`);
          }
        });
      }
    });
  }

  /**
   * Validate timing consistency
   */
  private validateTiming(scenario: Scenario, errors: string[], warnings: string[]): void {
    const maxInjectTime = Math.max(...scenario.injects.map(i => i.time_offset_minutes));
    
    if (scenario.duration_minutes < maxInjectTime) {
      errors.push(`Scenario duration (${scenario.duration_minutes} min) is less than maximum inject time (${maxInjectTime} min)`);
    }

    // Check for injects scheduled beyond scenario duration
    const lateInjects = scenario.injects.filter(i => i.time_offset_minutes > scenario.duration_minutes);
    if (lateInjects.length > 0) {
      warnings.push(`${lateInjects.length} injects are scheduled beyond scenario duration`);
    }

    // Check for very long scenarios
    if (scenario.duration_minutes > 480) { // 8 hours
      warnings.push('Scenario duration exceeds 8 hours - consider breaking into multiple sessions');
    }
  }

  /**
   * Validate inject reachability
   */
  private validateReachability(scenario: Scenario, errors: string[], warnings: string[]): void {
    // Check for injects that are referenced in branching but don't exist
    const allInjectIds = new Set<string>(scenario.injects.map(i => i.id));
    const referencedInjects = new Set<string>();
    
    for (const inject of scenario.injects) {
      if (inject.branching) {
        for (const branch of inject.branching) {
          if (branch.goto) referencedInjects.add(branch.goto);
          if (branch.else) referencedInjects.add(branch.else);
        }
      }
    }
    
    // Check for referenced injects that don't exist
    for (const referencedId of referencedInjects) {
      if (!allInjectIds.has(referencedId)) {
        errors.push(`Branching references non-existent inject: ${referencedId}`);
      }
    }
    
    // Only warn about injects that are never referenced and have no time-based trigger
    // This is a very conservative check - most injects are reachable by time
    const timeBasedInjects = new Set<string>(scenario.injects.map(i => i.id));
    const unreachableInjects = [...referencedInjects].filter(id => 
      !timeBasedInjects.has(id) && allInjectIds.has(id)
    );
    
    if (unreachableInjects.length > 0) {
      warnings.push(`Potentially unreachable injects (only reachable by branching): ${unreachableInjects.join(', ')}`);
    }
  }

  /**
   * Validate for circular dependencies
   */
  private validateCircularDependencies(scenario: Scenario, errors: string[], warnings: string[]): void {
    const hasCircularDependency = this.detectCircularDependencies(scenario);
    
    if (hasCircularDependency) {
      errors.push('Circular dependency detected in branching logic - this would cause infinite loops');
    }
  }

  /**
   * Find all reachable injects from the scenario start
   */
  private findReachableInjects(scenario: Scenario): Set<string> {
    const reachable = new Set<string>();
    const visited = new Set<string>();

    // All injects are reachable by time progression (they fire at their time_offset_minutes)
    // We only need to check for injects that are ONLY reachable by branching
    for (const inject of scenario.injects) {
      reachable.add(inject.id);
    }

    // Additionally, traverse branching paths to find injects reachable by branching
    const initialInjects = scenario.injects.filter(i => i.time_offset_minutes === 0);
    
    for (const inject of initialInjects) {
      this.traverseInjects(scenario, inject.id, reachable, visited);
    }

    return reachable;
  }

  /**
   * Traverse injects following branching paths
   */
  private traverseInjects(scenario: Scenario, injectId: string, reachable: Set<string>, visited: Set<string>): void {
    if (visited.has(injectId)) return;
    visited.add(injectId);

    const inject = scenario.injects.find(i => i.id === injectId);
    if (!inject) return;

    reachable.add(injectId);

    // Follow branching paths
    if (inject.branching) {
      inject.branching.forEach(branch => {
        if (branch.goto) {
          this.traverseInjects(scenario, branch.goto, reachable, visited);
        }
        if (branch.else) {
          this.traverseInjects(scenario, branch.else, reachable, visited);
        }
      });
    }

    // Follow branching rules
    scenario.branching_rules.forEach(rule => {
      if (rule.true_goto) {
        this.traverseInjects(scenario, rule.true_goto, reachable, visited);
      }
      if (rule.false_goto) {
        this.traverseInjects(scenario, rule.false_goto, reachable, visited);
      }
      if (rule.timeout_goto) {
        this.traverseInjects(scenario, rule.timeout_goto, reachable, visited);
      }
    });
  }

  /**
   * Detect circular dependencies in branching logic
   */
  private detectCircularDependencies(scenario: Scenario): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    for (const inject of scenario.injects) {
      if (this.hasCycle(scenario, inject.id, visited, recursionStack)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check for cycles starting from a specific inject
   */
  private hasCycle(scenario: Scenario, injectId: string, visited: Set<string>, recursionStack: Set<string>): boolean {
    if (recursionStack.has(injectId)) {
      return true; // Cycle detected
    }

    if (visited.has(injectId)) {
      return false; // Already processed
    }

    visited.add(injectId);
    recursionStack.add(injectId);

    const inject = scenario.injects.find(i => i.id === injectId);
    if (inject && inject.branching) {
      for (const branch of inject.branching) {
        // Treat certain conditions as unconditional (always execute)
        const isUnconditional = branch.if === 'always_true' || branch.if === 'true' || !branch.if;
        
        if (isUnconditional && branch.goto && this.hasCycle(scenario, branch.goto, visited, recursionStack)) {
          return true;
        }
        if (branch.else && this.hasCycle(scenario, branch.else, visited, recursionStack)) {
          return true;
        }
      }
    }

    recursionStack.delete(injectId);
    return false;
  }

  /**
   * Validate scenario for marketplace publication
   */
  async validateForMarketplace(scenario: Scenario): Promise<ValidationResult> {
    const result = await this.validateScenario(scenario);
    
    // Additional marketplace-specific validations
    if (result.status === 'pass' || result.status === 'warn') {
      // Check for placeholder content
      const hasPlaceholders = this.checkForPlaceholders(scenario);
      if (!hasPlaceholders) {
        result.warnings.push('Scenario does not appear to use placeholder content - ensure no real data is included');
      }

      // Check for appropriate difficulty/content balance
      if (scenario.difficulty === 'low' && scenario.injects.length > 10) {
        result.warnings.push('Low difficulty scenario has many injects - consider medium difficulty');
      }

      if (scenario.difficulty === 'high' && scenario.injects.length < 5) {
        result.warnings.push('High difficulty scenario has few injects - consider adding complexity');
      }
    }

    return result;
  }

  /**
   * Check if scenario uses placeholder content
   */
  private checkForPlaceholders(scenario: Scenario): boolean {
    const placeholderPatterns = [
      /\{\{.*?\}\}/g,  // {{PLACEHOLDER}}
      /ROLE_\w+/g,     // ROLE_NETWORK
      /HOST_\w+/g,     // HOST_PLACEHOLDER
      /IP_\w+/g,       // IP_PLACEHOLDER
      /\$\{.*?\}/g     // ${PLACEHOLDER}
    ];

    const content = JSON.stringify(scenario);
    
    return placeholderPatterns.some(pattern => pattern.test(content));
  }
}
