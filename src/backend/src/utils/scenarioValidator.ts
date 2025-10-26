import { Scenario, Inject, BranchingRule, EndCondition } from '../shared/types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateScenario(scenario: Scenario): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic structure validation
  if (!scenario.id) errors.push('Scenario ID is required');
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
  if (!Array.isArray(scenario.roles) || scenario.roles.length === 0) {
    errors.push('At least one role is required');
  }

  // Validate roles
  if (scenario.roles) {
    const uniqueRoles = new Set(scenario.roles);
    if (uniqueRoles.size !== scenario.roles.length) {
      errors.push('Duplicate roles found');
    }
    
    scenario.roles.forEach((role: string, index: number) => {
      if (!role || role.trim().length === 0) {
        errors.push(`Role at index ${index} is empty`);
      }
    });
  }

  // Validate injects
  if (!Array.isArray(scenario.injects) || scenario.injects.length === 0) {
    errors.push('At least one inject is required');
  } else {
    scenario.injects.forEach((inject: any, index: number) => {
      const injectErrors = validateInject(inject, scenario.roles, index);
      errors.push(...injectErrors);
    });
  }

  // Validate branching rules
  if (scenario.branching_rules) {
    scenario.branching_rules.forEach((rule: any, index: number) => {
      const ruleErrors = validateBranchingRule(rule, scenario.injects, index);
      errors.push(...ruleErrors);
    });
  }

  // Validate end conditions
  if (!Array.isArray(scenario.end_conditions) || scenario.end_conditions.length === 0) {
    errors.push('At least one end condition is required');
  } else {
    scenario.end_conditions.forEach((condition: any, index: number) => {
      const conditionErrors = validateEndCondition(condition, scenario.injects, index);
      errors.push(...conditionErrors);
    });
  }

  // Check for unreachable injects
  const reachableInjects = findReachableInjects(scenario);
  const unreachableInjects = scenario.injects.filter((inject: any) => !reachableInjects.has(inject.id));
  if (unreachableInjects.length > 0) {
    warnings.push(`Unreachable injects found: ${unreachableInjects.map((inject: any) => inject.id).join(', ')}`);
  }

  // Check for infinite loops
  const hasInfiniteLoop = detectInfiniteLoop(scenario);
  if (hasInfiniteLoop) {
    warnings.push('Potential infinite loop detected in branching logic');
  }

  // Validate metadata
  if (scenario.metadata) {
    const metadataErrors = validateMetadata(scenario.metadata);
    errors.push(...metadataErrors);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

function validateInject(inject: Inject, availableRoles: string[], index: number): string[] {
  const errors: string[] = [];

  if (!inject.id) {
    errors.push(`Inject ${index}: ID is required`);
  }
  if (!inject.type || !['text', 'sim_log', 'email', 'siem', 'file', 'manual'].includes(inject.type)) {
    errors.push(`Inject ${index}: Invalid type`);
  }
  if (inject.time_offset_minutes < 0) {
    errors.push(`Inject ${index}: Time offset cannot be negative`);
  }
  if (!Array.isArray(inject.target_roles) || inject.target_roles.length === 0) {
    errors.push(`Inject ${index}: At least one target role is required`);
  }
  if (!inject.content || inject.content.trim().length === 0) {
    errors.push(`Inject ${index}: Content is required`);
  }
  if (!['info', 'warning', 'critical'].includes(inject.severity)) {
    errors.push(`Inject ${index}: Invalid severity level`);
  }

  // Validate target roles exist
  if (inject.target_roles) {
    inject.target_roles.forEach((role: string) => {
      if (!availableRoles.includes(role)) {
        errors.push(`Inject ${index}: Target role '${role}' not found in scenario roles`);
      }
    });
  }

  // Validate branching conditions
  if (inject.branching) {
    inject.branching.forEach((branch: any, branchIndex: number) => {
      if (!branch.if || branch.if.trim().length === 0) {
        errors.push(`Inject ${index}, Branch ${branchIndex}: Condition is required`);
      }
      if (!branch.goto || branch.goto.trim().length === 0) {
        errors.push(`Inject ${index}, Branch ${branchIndex}: Goto target is required`);
      }
    });
  }

  // Validate required actions
  if (inject.required_actions) {
    inject.required_actions.forEach((action: any, actionIndex: number) => {
      if (!action.role || !availableRoles.includes(action.role)) {
        errors.push(`Inject ${index}, Action ${actionIndex}: Invalid role`);
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

  return errors;
}

function validateBranchingRule(rule: BranchingRule, injects: Inject[], index: number): string[] {
  const errors: string[] = [];
  const injectIds = injects.map((i: any) => i.id);

  if (!rule.id) {
    errors.push(`Branching rule ${index}: ID is required`);
  }
  if (!rule.condition || rule.condition.trim().length === 0) {
    errors.push(`Branching rule ${index}: Condition is required`);
  }
  if (!rule.true_goto || rule.true_goto.trim().length === 0) {
    errors.push(`Branching rule ${index}: True goto target is required`);
  }

  // Validate goto targets exist
  if (rule.true_goto && !injectIds.includes(rule.true_goto)) {
    errors.push(`Branching rule ${index}: True goto target '${rule.true_goto}' not found`);
  }
  if (rule.false_goto && !injectIds.includes(rule.false_goto)) {
    errors.push(`Branching rule ${index}: False goto target '${rule.false_goto}' not found`);
  }
  if (rule.timeout_goto && !injectIds.includes(rule.timeout_goto)) {
    errors.push(`Branching rule ${index}: Timeout goto target '${rule.timeout_goto}' not found`);
  }

  if (rule.timeout_minutes !== undefined && rule.timeout_minutes <= 0) {
    errors.push(`Branching rule ${index}: Timeout must be positive`);
  }

  return errors;
}

function validateEndCondition(condition: EndCondition, injects: Inject[], index: number): string[] {
  const errors: string[] = [];
  const injectIds = injects.map((i: any) => i.id);

  if (!condition.type || !['time_elapsed', 'all_injects_complete', 'manual_end'].includes(condition.type)) {
    errors.push(`End condition ${index}: Invalid type`);
  }

  if (condition.type === 'time_elapsed' && (!condition.minutes || condition.minutes <= 0)) {
    errors.push(`End condition ${index}: Minutes must be positive for time_elapsed type`);
  }

  if (condition.type === 'all_injects_complete' && condition.inject_ids) {
    condition.inject_ids.forEach((injectId: string) => {
      if (!injectIds.includes(injectId)) {
        errors.push(`End condition ${index}: Inject ID '${injectId}' not found`);
      }
    });
  }

  return errors;
}

function validateMetadata(metadata: any): string[] {
  const errors: string[] = [];

  if (metadata.version && typeof metadata.version !== 'string') {
    errors.push('Metadata version must be a string');
  }

  if (metadata.tags && !Array.isArray(metadata.tags)) {
    errors.push('Metadata tags must be an array');
  }

  if (metadata.estimated_setup_time && typeof metadata.estimated_setup_time !== 'number') {
    errors.push('Metadata estimated_setup_time must be a number');
  }

  return errors;
}

function findReachableInjects(scenario: Scenario): Set<string> {
  const reachable = new Set<string>();
  const visited = new Set<string>();

  // Start with first inject (lowest time offset)
  const sortedInjects = [...scenario.injects].sort((a, b) => a.time_offset_minutes - b.time_offset_minutes);
  if (sortedInjects.length > 0) {
    const firstInject = sortedInjects[0];
    reachable.add(firstInject.id);
    visited.add(firstInject.id);
  }

  // Follow branching paths
  function followBranches(injectId: string) {
    if (visited.has(injectId)) return;
    visited.add(injectId);

    const inject = scenario.injects.find((i: any) => i.id === injectId);
    if (!inject) return;

    reachable.add(injectId);

    if (inject.branching) {
      inject.branching.forEach((branch: any) => {
        if (branch.goto) {
          reachable.add(branch.goto);
          followBranches(branch.goto);
        }
        if (branch.else) {
          reachable.add(branch.else);
          followBranches(branch.else);
        }
      });
    }
  }

  // Process all injects
  scenario.injects.forEach((inject: any) => {
    followBranches(inject.id);
  });

  return reachable;
}

function detectInfiniteLoop(scenario: Scenario): boolean {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycle(injectId: string): boolean {
    if (recursionStack.has(injectId)) {
      return true; // Cycle detected
    }

    if (visited.has(injectId)) {
      return false; // Already processed
    }

    visited.add(injectId);
    recursionStack.add(injectId);

    const inject = scenario.injects.find((i: any) => i.id === injectId);
    if (inject && inject.branching) {
      for (const branch of inject.branching) {
        if (branch.goto && hasCycle(branch.goto)) {
          return true;
        }
        if (branch.else && hasCycle(branch.else)) {
          return true;
        }
      }
    }

    recursionStack.delete(injectId);
    return false;
  }

  // Check each inject for cycles
  for (const inject of scenario.injects) {
    if (hasCycle(inject.id)) {
      return true;
    }
  }

  return false;
}
