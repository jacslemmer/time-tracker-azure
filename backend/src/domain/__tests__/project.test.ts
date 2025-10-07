import * as E from 'fp-ts/Either';
import {
  validateProjectName,
  validateHourlyRate,
  validateBudget,
  validateCreateProject,
  calculateBilling,
  calculateBudgetPercentage,
  getBudgetStatus,
  canEditProject,
  generateProjectId,
  Project,
} from '../project';

describe('project domain functions', () => {
  describe('validation', () => {
    it('should validate project name', () => {
      expect(E.isRight(validateProjectName('Test Project'))).toBe(true);
      expect(E.isLeft(validateProjectName(''))).toBe(true);
      expect(E.isLeft(validateProjectName('   '))).toBe(true);
    });

    it('should validate hourly rate', () => {
      expect(E.isRight(validateHourlyRate(100))).toBe(true);
      expect(E.isLeft(validateHourlyRate(0))).toBe(true);
      expect(E.isLeft(validateHourlyRate(-10))).toBe(true);
    });

    it('should validate budget', () => {
      expect(E.isRight(validateBudget(1000))).toBe(true);
      expect(E.isLeft(validateBudget(0))).toBe(true);
      expect(E.isLeft(validateBudget(-100))).toBe(true);
    });

    it('should validate create project data', () => {
      const valid = {
        name: 'Test',
        clientName: 'Client',
        hourlyRate: 100,
        budget: 1000,
      };

      expect(E.isRight(validateCreateProject(valid))).toBe(true);

      const invalid = { ...valid, hourlyRate: -1 };
      expect(E.isLeft(validateCreateProject(invalid))).toBe(true);
    });
  });

  describe('business logic', () => {
    const mockProject: Project = {
      id: '1',
      user_id: 'user1',
      client_name: 'Test Client',
      name: 'Test Project',
      hourly_rate: 100,
      budget: 10000,
      total_seconds: 36000, // 10 hours
      is_running: false,
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('should calculate billing correctly', () => {
      expect(calculateBilling(mockProject)).toBe(1000); // 10 hours * R100
    });

    it('should calculate budget percentage', () => {
      expect(calculateBudgetPercentage(mockProject)).toBe(10); // 1000 / 10000 * 100
    });

    it('should determine budget status', () => {
      expect(getBudgetStatus(mockProject)).toBe('normal');

      const warning = { ...mockProject, total_seconds: 288000 }; // 80 hours
      expect(getBudgetStatus(warning)).toBe('warning');

      const danger = { ...mockProject, total_seconds: 360000 }; // 100 hours
      expect(getBudgetStatus(danger)).toBe('danger');
    });

    it('should check if project can be edited', () => {
      expect(canEditProject(mockProject)).toBe(true);

      const running = { ...mockProject, is_running: true };
      expect(canEditProject(running)).toBe(false);
    });

    it('should generate unique project IDs', () => {
      const id1 = generateProjectId();
      const id2 = generateProjectId();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
    });
  });
});
