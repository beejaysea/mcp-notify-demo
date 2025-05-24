import { describe, it, expect } from '@jest/globals';
import {
  ServerConfigSchema,
  ClientConfigSchema,
  CliArgsSchema,
  ExecutionParamsSchema
} from '../../shared/config';

describe('Configuration Schemas', () => {
  describe('ServerConfigSchema', () => {
    it('should validate a valid server configuration', () => {
      const validConfig = {
        name: 'test-server',
        version: '2.0.0',
        enableLogging: true,
        logLevel: 'debug' as const
      };
      
      const result = ServerConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validConfig);
      }
    });
    
    it('should provide default values for missing fields', () => {
      const minimalConfig = {};
      
      const result = ServerConfigSchema.safeParse(minimalConfig);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('mcp-notify-server');
        expect(result.data.version).toBe('1.0.0');
        expect(result.data.enableLogging).toBe(true);
        expect(result.data.logLevel).toBe('info');
      }
    });
    
    it('should reject invalid log levels', () => {
      const invalidConfig = {
        logLevel: 'trace' // Not a valid log level
      };
      
      const result = ServerConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });
  });
  
  describe('ClientConfigSchema', () => {
    it('should validate a valid client configuration', () => {
      const validConfig = {
        name: 'test-client',
        version: '2.0.0',
        enableColors: false,
        showTimestamps: false,
        autoScroll: false
      };
      
      const result = ClientConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validConfig);
      }
    });
    
    it('should provide default values for missing fields', () => {
      const minimalConfig = {};
      
      const result = ClientConfigSchema.safeParse(minimalConfig);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('mcp-notify-client');
        expect(result.data.version).toBe('1.0.0');
        expect(result.data.enableColors).toBe(true);
        expect(result.data.showTimestamps).toBe(true);
        expect(result.data.autoScroll).toBe(true);
      }
    });
    
    it('should reject non-boolean values', () => {
      const invalidConfig = {
        enableColors: 'yes' // Not a boolean
      };
      
      const result = ClientConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });
  });
  
  describe('CliArgsSchema', () => {
    it('should validate valid CLI arguments', () => {
      const validArgs = {
        serverPath: 'src/server/index.ts',
        toolName: 'start_long_running_task',
        steps: 10,
        interval: 2,
        delay: 500,
        sampling: true,
        verbose: false
      };
      
      const result = CliArgsSchema.safeParse(validArgs);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validArgs);
      }
    });
    
    it('should validate minimal required CLI arguments', () => {
      const minimalArgs = {
        serverPath: 'src/server/index.ts',
        toolName: 'start_long_running_task'
      };
      
      const result = CliArgsSchema.safeParse(minimalArgs);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.serverPath).toBe(minimalArgs.serverPath);
        expect(result.data.toolName).toBe(minimalArgs.toolName);
      }
    });
    
    it('should reject missing required fields', () => {
      const missingArgs = {
        serverPath: 'src/server/index.ts'
        // toolName is missing
      };
      
      const result = CliArgsSchema.safeParse(missingArgs);
      expect(result.success).toBe(false);
    });
    
    it('should reject invalid step values', () => {
      const invalidArgs = {
        serverPath: 'src/server/index.ts',
        toolName: 'start_long_running_task',
        steps: 0 // Below minimum
      };
      
      const result = CliArgsSchema.safeParse(invalidArgs);
      expect(result.success).toBe(false);
    });
    
    it('should reject steps over maximum', () => {
      const invalidArgs = {
        serverPath: 'src/server/index.ts',
        toolName: 'start_long_running_task',
        steps: 1001 // Above maximum
      };
      
      const result = CliArgsSchema.safeParse(invalidArgs);
      expect(result.success).toBe(false);
    });
    
    it('should reject invalid delay values', () => {
      const invalidArgs = {
        serverPath: 'src/server/index.ts',
        toolName: 'start_long_running_task',
        delay: 99 // Below minimum
      };
      
      const result = CliArgsSchema.safeParse(invalidArgs);
      expect(result.success).toBe(false);
    });
  });
  
  describe('ExecutionParamsSchema', () => {
    it('should validate valid execution parameters', () => {
      const validParams = {
        steps: 10,
        interval: 2,
        delay: 500,
        sampling: true,
        verbose: false
      };
      
      const result = ExecutionParamsSchema.safeParse(validParams);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validParams);
      }
    });
    
    it('should provide default values for all fields', () => {
      const emptyParams = {};
      
      const result = ExecutionParamsSchema.safeParse(emptyParams);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.steps).toBe(5);
        expect(result.data.interval).toBe(1);
        expect(result.data.delay).toBe(1000);
        expect(result.data.sampling).toBe(true);
        expect(result.data.verbose).toBe(false);
      }
    });
    
    it('should reject invalid step values', () => {
      const invalidParams = {
        steps: 0 // Below minimum
      };
      
      const result = ExecutionParamsSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });
    
    it('should reject delay values over maximum', () => {
      const invalidParams = {
        delay: 11000 // Above maximum
      };
      
      const result = ExecutionParamsSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });
  });
});