import { describe, it, expect } from '@jest/globals';
import { LongRunningToolParamsSchema } from '../../shared/types';

describe('Shared Types', () => {
  describe('LongRunningToolParamsSchema', () => {
    it('should validate valid tool parameters', () => {
      const validParams = {
        steps: 10,
        notificationInterval: 2,
        delayMs: 500,
        enableSampling: true
      };
      
      const result = LongRunningToolParamsSchema.safeParse(validParams);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validParams);
      }
    });
    
    it('should apply default values for optional parameters', () => {
      const minimalParams = {
        steps: 5
      };
      
      const result = LongRunningToolParamsSchema.safeParse(minimalParams);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.steps).toBe(5);
        expect(result.data.notificationInterval).toBe(1);
        expect(result.data.delayMs).toBe(1000);
        expect(result.data.enableSampling).toBe(true);
      }
    });
    
    it('should require steps parameter', () => {
      const incompleteParams = {
        notificationInterval: 1,
        delayMs: 500,
        enableSampling: true
      };
      
      const result = LongRunningToolParamsSchema.safeParse(incompleteParams);
      expect(result.success).toBe(false);
    });
    
    it('should reject steps below minimum', () => {
      const invalidParams = {
        steps: 0, // Below minimum of 1
        notificationInterval: 1,
        delayMs: 500
      };
      
      const result = LongRunningToolParamsSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });
    
    it('should reject steps above maximum', () => {
      const invalidParams = {
        steps: 1001, // Above maximum of 1000
        notificationInterval: 1,
        delayMs: 500
      };
      
      const result = LongRunningToolParamsSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });
    
    it('should reject notification interval below minimum', () => {
      const invalidParams = {
        steps: 10,
        notificationInterval: 0 // Below minimum of 1
      };
      
      const result = LongRunningToolParamsSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });
    
    it('should reject delay below minimum', () => {
      const invalidParams = {
        steps: 10,
        delayMs: 50 // Below minimum of 100
      };
      
      const result = LongRunningToolParamsSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });
    
    it('should reject delay above maximum', () => {
      const invalidParams = {
        steps: 10,
        delayMs: 15000 // Above maximum of 10000
      };
      
      const result = LongRunningToolParamsSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });
  });
});