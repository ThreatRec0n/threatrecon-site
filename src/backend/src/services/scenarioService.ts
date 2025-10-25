import { Scenario, Inject, BranchingRule, EndCondition } from '../shared/types';
import { validateScenario } from '../utils/scenarioValidator';
import { logger } from '../utils/logger';
import fs from 'fs/promises';
import path from 'path';

export class ScenarioService {
  private scenarios: Map<string, Scenario> = new Map();
  private scenarioCache: Map<string, Scenario[]> = new Map();

  constructor() {
    this.loadScenarios();
  }

  /**
   * Load scenarios from the scenarios directory
   */
  private async loadScenarios(): Promise<void> {
    try {
      const scenariosDir = path.join(process.cwd(), 'scenarios');
      const files = await fs.readdir(scenariosDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(scenariosDir, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const scenario = JSON.parse(content) as Scenario;
            
            // Validate scenario structure
            const validation = validateScenario(scenario);
            if (!validation.valid) {
              logger.warn(`Invalid scenario ${file}: ${validation.errors.join(', ')}`);
              continue;
            }
            
            this.scenarios.set(scenario.id, scenario);
            logger.info(`Loaded scenario: ${scenario.title}`);
          } catch (error) {
            logger.error(`Error loading scenario ${file}:`, error);
          }
        }
      }
      
      logger.info(`Loaded ${this.scenarios.size} scenarios`);
    } catch (error) {
      logger.error('Error loading scenarios:', error);
    }
  }

  /**
   * Get all scenarios for a tenant
   */
  async getScenarios(tenantId: string): Promise<Scenario[]> {
    const cached = this.scenarioCache.get(tenantId);
    if (cached) {
      return cached;
    }

    const scenarios = Array.from(this.scenarios.values())
      .filter(scenario => scenario.tenantId === tenantId || scenario.tenantId === 'public')
      .sort((a, b) => a.title.localeCompare(b.title));

    this.scenarioCache.set(tenantId, scenarios);
    return scenarios;
  }

  /**
   * Get a specific scenario by ID
   */
  async getScenario(scenarioId: string, tenantId: string): Promise<Scenario | null> {
    const scenario = this.scenarios.get(scenarioId);
    
    if (!scenario) {
      return null;
    }

    // Check tenant access
    if (scenario.tenantId !== tenantId && scenario.tenantId !== 'public') {
      return null;
    }

    return scenario;
  }

  /**
   * Create a new scenario
   */
  async createScenario(scenario: Omit<Scenario, 'id' | 'createdAt' | 'updatedAt'>): Promise<Scenario> {
    const validation = validateScenario(scenario as Scenario);
    if (!validation.valid) {
      throw new Error(`Invalid scenario: ${validation.errors.join(', ')}`);
    }

    const newScenario: Scenario = {
      ...scenario,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.scenarios.set(newScenario.id, newScenario);
    this.scenarioCache.clear(); // Clear cache

    logger.info(`Created scenario: ${newScenario.title}`);
    return newScenario;
  }

  /**
   * Update an existing scenario
   */
  async updateScenario(scenarioId: string, updates: Partial<Scenario>, tenantId: string): Promise<Scenario | null> {
    const existing = await this.getScenario(scenarioId, tenantId);
    if (!existing) {
      return null;
    }

    const updatedScenario: Scenario = {
      ...existing,
      ...updates,
      id: scenarioId, // Ensure ID doesn't change
      updatedAt: new Date()
    };

    const validation = validateScenario(updatedScenario);
    if (!validation.valid) {
      throw new Error(`Invalid scenario: ${validation.errors.join(', ')}`);
    }

    this.scenarios.set(scenarioId, updatedScenario);
    this.scenarioCache.clear(); // Clear cache

    logger.info(`Updated scenario: ${updatedScenario.title}`);
    return updatedScenario;
  }

  /**
   * Delete a scenario
   */
  async deleteScenario(scenarioId: string, tenantId: string): Promise<boolean> {
    const scenario = await this.getScenario(scenarioId, tenantId);
    if (!scenario) {
      return false;
    }

    this.scenarios.delete(scenarioId);
    this.scenarioCache.clear(); // Clear cache

    logger.info(`Deleted scenario: ${scenario.title}`);
    return true;
  }

  /**
   * Validate scenario structure and logic
   */
  async validateScenario(scenario: Scenario): Promise<{ valid: boolean; errors: string[] }> {
    return validateScenario(scenario);
  }

  /**
   * Get scenarios by difficulty level
   */
  async getScenariosByDifficulty(difficulty: 'low' | 'medium' | 'high', tenantId: string): Promise<Scenario[]> {
    const scenarios = await this.getScenarios(tenantId);
    return scenarios.filter(s => s.difficulty === difficulty);
  }

  /**
   * Get scenarios by industry/tags
   */
  async getScenariosByTags(tags: string[], tenantId: string): Promise<Scenario[]> {
    const scenarios = await this.getScenarios(tenantId);
    return scenarios.filter(s => 
      tags.some(tag => s.metadata.tags.includes(tag))
    );
  }

  /**
   * Get scenario statistics
   */
  async getScenarioStats(tenantId: string): Promise<{
    total: number;
    byDifficulty: Record<string, number>;
    byIndustry: Record<string, number>;
    averageDuration: number;
  }> {
    const scenarios = await this.getScenarios(tenantId);
    
    const stats = {
      total: scenarios.length,
      byDifficulty: {
        low: scenarios.filter(s => s.difficulty === 'low').length,
        medium: scenarios.filter(s => s.difficulty === 'medium').length,
        high: scenarios.filter(s => s.difficulty === 'high').length
      },
      byIndustry: {} as Record<string, number>,
      averageDuration: 0
    };

    // Count by industry
    scenarios.forEach(scenario => {
      if (scenario.metadata.industry) {
        stats.byIndustry[scenario.metadata.industry] = 
          (stats.byIndustry[scenario.metadata.industry] || 0) + 1;
      }
    });

    // Calculate average duration
    if (scenarios.length > 0) {
      stats.averageDuration = scenarios.reduce((sum, s) => sum + s.duration_minutes, 0) / scenarios.length;
    }

    return stats;
  }

  /**
   * Clone a scenario for customization
   */
  async cloneScenario(scenarioId: string, newTitle: string, tenantId: string): Promise<Scenario | null> {
    const original = await this.getScenario(scenarioId, tenantId);
    if (!original) {
      return null;
    }

    const cloned: Scenario = {
      ...original,
      id: this.generateId(),
      title: newTitle,
      tenantId,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        ...original.metadata,
        author: 'Cloned',
        version: '1.0'
      }
    };

    this.scenarios.set(cloned.id, cloned);
    this.scenarioCache.clear(); // Clear cache

    logger.info(`Cloned scenario: ${original.title} -> ${cloned.title}`);
    return cloned;
  }

  /**
   * Export scenario to JSON
   */
  async exportScenario(scenarioId: string, tenantId: string): Promise<string | null> {
    const scenario = await this.getScenario(scenarioId, tenantId);
    if (!scenario) {
      return null;
    }

    return JSON.stringify(scenario, null, 2);
  }

  /**
   * Import scenario from JSON
   */
  async importScenario(jsonData: string, tenantId: string): Promise<Scenario> {
    try {
      const scenario = JSON.parse(jsonData) as Scenario;
      
      // Override tenant and generate new ID
      const importedScenario: Scenario = {
        ...scenario,
        id: this.generateId(),
        tenantId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const validation = validateScenario(importedScenario);
      if (!validation.valid) {
        throw new Error(`Invalid scenario: ${validation.errors.join(', ')}`);
      }

      this.scenarios.set(importedScenario.id, importedScenario);
      this.scenarioCache.clear(); // Clear cache

      logger.info(`Imported scenario: ${importedScenario.title}`);
      return importedScenario;
    } catch (error) {
      throw new Error(`Failed to import scenario: ${error}`);
    }
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `scenario_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Refresh scenario cache
   */
  async refreshCache(): Promise<void> {
    this.scenarioCache.clear();
    await this.loadScenarios();
  }
}
