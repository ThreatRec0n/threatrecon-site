import { ScenarioValidator } from '../services/scenarioValidator';
import { Scenario } from './types';

describe('Scenario Validator', () => {
  let validator: ScenarioValidator;

  beforeEach(() => {
    validator = new ScenarioValidator();
  });

  describe('Basic Validation Rules', () => {
    it('should pass a valid scenario', async () => {
      const validScenario: Scenario = {
        id: 'test-scenario',
        title: 'Test Scenario',
        description: 'A test scenario',
        difficulty: 'medium',
        duration_minutes: 60,
        roles: ['SOC_ANALYST', 'INCIDENT_RESPONDER'],
        injects: [
          {
            id: 'inject_1',
            time_offset_minutes: 0,
            type: 'text',
            target_roles: ['SOC_ANALYST'],
            content: 'Initial alert received',
            severity: 'info'
          },
          {
            id: 'inject_2',
            time_offset_minutes: 15,
            type: 'email',
            target_roles: ['INCIDENT_RESPONDER'],
            content: 'Escalation email',
            severity: 'warning'
          }
        ],
        branching_rules: [],
        end_conditions: [],
        metadata: {
          author: 'Test Author',
          version: '1.0'
        },
        tenantId: 'test-tenant'
      };

      const result = await validator.validateScenario(validScenario);
      expect(result.status).toBe('pass');
      expect(result.errors).toHaveLength(0);

      console.log('✅ Valid scenario test passed');
    });

    it('should fail on duplicate inject IDs', async () => {
      const invalidScenario: Scenario = {
        id: 'test-scenario',
        title: 'Test Scenario',
        description: 'A test scenario with duplicate IDs',
        difficulty: 'medium',
        duration_minutes: 60,
        roles: ['SOC_ANALYST'],
        injects: [
          {
            id: 'duplicate_id',
            time_offset_minutes: 0,
            type: 'text',
            target_roles: ['SOC_ANALYST'],
            content: 'First inject',
            severity: 'info'
          },
          {
            id: 'duplicate_id', // Duplicate ID
            time_offset_minutes: 15,
            type: 'text',
            target_roles: ['SOC_ANALYST'],
            content: 'Second inject',
            severity: 'info'
          }
        ],
        branching_rules: [],
        end_conditions: [],
        metadata: {},
        tenantId: 'test-tenant'
      };

      const result = await validator.validateScenario(invalidScenario);
      expect(result.status).toBe('fail');
      expect(result.errors).toContain('Duplicate inject ID found: duplicate_id');

      console.log('✅ Duplicate ID validation test passed');
    });

    it('should fail on invalid branching targets', async () => {
      const invalidScenario: Scenario = {
        id: 'test-scenario',
        title: 'Test Scenario',
        description: 'A test scenario with invalid branching',
        difficulty: 'medium',
        duration_minutes: 60,
        roles: ['SOC_ANALYST'],
        injects: [
          {
            id: 'inject_1',
            time_offset_minutes: 0,
            type: 'text',
            target_roles: ['SOC_ANALYST'],
            content: 'First inject',
            severity: 'info',
            branching: [
              {
                if: 'decision_1',
                goto: 'nonexistent_inject' // Invalid target
              }
            ]
          }
        ],
        branching_rules: [],
        end_conditions: [],
        metadata: {},
        tenantId: 'test-tenant'
      };

      const result = await validator.validateScenario(invalidScenario);
      expect(result.status).toBe('fail');
      expect(result.errors).toContain('Inject inject_1 branches to non-existent inject ID: nonexistent_inject');

      console.log('✅ Invalid branching validation test passed');
    });

    it('should fail on invalid target roles', async () => {
      const invalidScenario: Scenario = {
        id: 'test-scenario',
        title: 'Test Scenario',
        description: 'A test scenario with invalid roles',
        difficulty: 'medium',
        duration_minutes: 60,
        roles: ['SOC_ANALYST'], // Only SOC_ANALYST is defined
        injects: [
          {
            id: 'inject_1',
            time_offset_minutes: 0,
            type: 'text',
            target_roles: ['INVALID_ROLE'], // Invalid role
            content: 'First inject',
            severity: 'info'
          }
        ],
        branching_rules: [],
        end_conditions: [],
        metadata: {},
        tenantId: 'test-tenant'
      };

      const result = await validator.validateScenario(invalidScenario);
      expect(result.status).toBe('fail');
      expect(result.errors).toContain('Inject inject_1 targets non-existent role: INVALID_ROLE');

      console.log('✅ Invalid role validation test passed');
    });

    it('should fail on negative time offsets', async () => {
      const invalidScenario: Scenario = {
        id: 'test-scenario',
        title: 'Test Scenario',
        description: 'A test scenario with negative time offset',
        difficulty: 'medium',
        duration_minutes: 60,
        roles: ['SOC_ANALYST'],
        injects: [
          {
            id: 'inject_1',
            time_offset_minutes: -5, // Negative offset
            type: 'text',
            target_roles: ['SOC_ANALYST'],
            content: 'First inject',
            severity: 'info'
          }
        ],
        branching_rules: [],
        end_conditions: [],
        metadata: {},
        tenantId: 'test-tenant'
      };

      const result = await validator.validateScenario(invalidScenario);
      expect(result.status).toBe('fail');
      expect(result.errors).toContain('Inject inject_1 has invalid time_offset_minutes: -5');

      console.log('✅ Negative time offset validation test passed');
    });

    it('should fail when scenario duration is less than max inject offset', async () => {
      const invalidScenario: Scenario = {
        id: 'test-scenario',
        title: 'Test Scenario',
        description: 'A test scenario with duration mismatch',
        difficulty: 'medium',
        duration_minutes: 30, // Duration is 30 minutes
        roles: ['SOC_ANALYST'],
        injects: [
          {
            id: 'inject_1',
            time_offset_minutes: 45, // But inject is at 45 minutes
            type: 'text',
            target_roles: ['SOC_ANALYST'],
            content: 'First inject',
            severity: 'info'
          }
        ],
        branching_rules: [],
        end_conditions: [],
        metadata: {},
        tenantId: 'test-tenant'
      };

      const result = await validator.validateScenario(invalidScenario);
      expect(result.status).toBe('fail');
      expect(result.errors).toContain('Scenario duration (30 min) is less than the maximum inject offset (45 min).');

      console.log('✅ Duration mismatch validation test passed');
    });

    it('should fail on circular unconditional branching loops', async () => {
      const invalidScenario: Scenario = {
        id: 'test-scenario',
        title: 'Test Scenario',
        description: 'A test scenario with circular branching',
        difficulty: 'medium',
        duration_minutes: 60,
        roles: ['SOC_ANALYST'],
        injects: [
          {
            id: 'inject_1',
            time_offset_minutes: 0,
            type: 'text',
            target_roles: ['SOC_ANALYST'],
            content: 'First inject',
            severity: 'info',
            branching: [
              {
                goto: 'inject_2' // Unconditional branch
              }
            ]
          },
          {
            id: 'inject_2',
            time_offset_minutes: 15,
            type: 'text',
            target_roles: ['SOC_ANALYST'],
            content: 'Second inject',
            severity: 'info',
            branching: [
              {
                goto: 'inject_1' // Circular reference
              }
            ]
          }
        ],
        branching_rules: [],
        end_conditions: [],
        metadata: {},
        tenantId: 'test-tenant'
      };

      const result = await validator.validateScenario(invalidScenario);
      expect(result.status).toBe('fail');
      expect(result.errors.some(error => error.includes('Circular branching detected'))).toBe(true);

      console.log('✅ Circular branching validation test passed');
    });

    it('should warn on unreachable injects', async () => {
      const scenarioWithWarning: Scenario = {
        id: 'test-scenario',
        title: 'Test Scenario',
        description: 'A test scenario with unreachable inject',
        difficulty: 'medium',
        duration_minutes: 60,
        roles: ['SOC_ANALYST'],
        injects: [
          {
            id: 'inject_1',
            time_offset_minutes: 0,
            type: 'text',
            target_roles: ['SOC_ANALYST'],
            content: 'First inject',
            severity: 'info'
          },
          {
            id: 'unreachable_inject',
            time_offset_minutes: null, // No initial trigger
            type: 'text',
            target_roles: ['SOC_ANALYST'],
            content: 'Unreachable inject',
            severity: 'info'
            // No branching references this inject
          }
        ],
        branching_rules: [],
        end_conditions: [],
        metadata: {},
        tenantId: 'test-tenant'
      };

      const result = await validator.validateScenario(scenarioWithWarning);
      expect(result.status).toBe('warn');
      expect(result.warnings).toContain('Inject unreachable_inject appears to be unreachable.');

      console.log('✅ Unreachable inject warning test passed');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty injects array', async () => {
      const emptyScenario: Scenario = {
        id: 'test-scenario',
        title: 'Test Scenario',
        description: 'A test scenario with no injects',
        difficulty: 'medium',
        duration_minutes: 60,
        roles: ['SOC_ANALYST'],
        injects: [], // Empty injects
        branching_rules: [],
        end_conditions: [],
        metadata: {},
        tenantId: 'test-tenant'
      };

      const result = await validator.validateScenario(emptyScenario);
      expect(result.status).toBe('pass');
      expect(result.errors).toHaveLength(0);

      console.log('✅ Empty injects array test passed');
    });

    it('should handle null time offsets', async () => {
      const nullOffsetScenario: Scenario = {
        id: 'test-scenario',
        title: 'Test Scenario',
        description: 'A test scenario with null time offset',
        difficulty: 'medium',
        duration_minutes: 60,
        roles: ['SOC_ANALYST'],
        injects: [
          {
            id: 'inject_1',
            time_offset_minutes: null, // Null offset
            type: 'text',
            target_roles: ['SOC_ANALYST'],
            content: 'First inject',
            severity: 'info'
          }
        ],
        branching_rules: [],
        end_conditions: [],
        metadata: {},
        tenantId: 'test-tenant'
      };

      const result = await validator.validateScenario(nullOffsetScenario);
      expect(result.status).toBe('fail');
      expect(result.errors).toContain('Inject inject_1 has invalid time_offset_minutes: null');

      console.log('✅ Null time offset validation test passed');
    });
  });
});
