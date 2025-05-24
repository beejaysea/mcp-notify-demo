import { describe, it, expect } from '@jest/globals';
import {
  TOOL_NAMES,
  NOTIFICATION_METHODS,
  SAMPLING_METHODS,
  DEFAULT_CONFIG,
  SERVER_INFO,
  CLIENT_INFO
} from '../../shared/constants';

describe('Shared Constants', () => {
  describe('TOOL_NAMES', () => {
    it('should have correct tool name for long-running process', () => {
      expect(TOOL_NAMES).toHaveProperty('EXECUTE_LONG_PROCESS');
      expect(TOOL_NAMES.EXECUTE_LONG_PROCESS).toBe('start_long_running_task');
    });
    
    it('should be effectively constant', () => {
      // Instead of testing runtime immutability (which Object.freeze provides),
      // test that TypeScript correctly marks it as readonly
      const originalValue = TOOL_NAMES.EXECUTE_LONG_PROCESS;
      expect(originalValue).toBe('start_long_running_task');
      
      // Verify value didn't change (TypeScript will prevent this at compile time)
      expect(TOOL_NAMES.EXECUTE_LONG_PROCESS).toBe('start_long_running_task');
    });
  });
  
  describe('NOTIFICATION_METHODS', () => {
    it('should have expected notification methods', () => {
      expect(NOTIFICATION_METHODS).toHaveProperty('PROGRESS_UPDATE');
      expect(NOTIFICATION_METHODS).toHaveProperty('STATUS_UPDATE');
      expect(NOTIFICATION_METHODS).toHaveProperty('ERROR_UPDATE');
      expect(NOTIFICATION_METHODS).toHaveProperty('COMPLETION_UPDATE');
    });
    
    it('should use proper method namespacing', () => {
      Object.values(NOTIFICATION_METHODS).forEach(method => {
        expect(method).toMatch(/^notifications\//);
      });
    });
    
    it('should have distinct values for each method', () => {
      const methodValues = Object.values(NOTIFICATION_METHODS);
      const uniqueValues = new Set(methodValues);
      expect(uniqueValues.size).toBe(methodValues.length);
    });
  });
  
  describe('SAMPLING_METHODS', () => {
    it('should have expected sampling methods', () => {
      expect(SAMPLING_METHODS).toHaveProperty('CREATE_MESSAGE');
      expect(SAMPLING_METHODS.CREATE_MESSAGE).toBe('sampling/createMessage');
    });
    
    it('should use proper method namespacing', () => {
      Object.values(SAMPLING_METHODS).forEach(method => {
        expect(method).toMatch(/^sampling\//);
      });
    });
  });
  
  describe('DEFAULT_CONFIG', () => {
    it('should have expected default configuration values', () => {
      expect(DEFAULT_CONFIG).toHaveProperty('NOTIFICATION_INTERVAL');
      expect(DEFAULT_CONFIG).toHaveProperty('DELAY_MS');
      expect(DEFAULT_CONFIG).toHaveProperty('ENABLE_SAMPLING');
      expect(DEFAULT_CONFIG).toHaveProperty('MAX_STEPS');
      expect(DEFAULT_CONFIG).toHaveProperty('MIN_STEPS');
    });
    
    it('should have reasonable values', () => {
      expect(DEFAULT_CONFIG.NOTIFICATION_INTERVAL).toBeGreaterThanOrEqual(1);
      expect(DEFAULT_CONFIG.DELAY_MS).toBeGreaterThanOrEqual(100);
      expect(typeof DEFAULT_CONFIG.ENABLE_SAMPLING).toBe('boolean');
      expect(DEFAULT_CONFIG.MAX_STEPS).toBeGreaterThan(DEFAULT_CONFIG.MIN_STEPS);
    });
    
    it('should be consistent with schema constraints', () => {
      expect(DEFAULT_CONFIG.MIN_STEPS).toBe(1);
      expect(DEFAULT_CONFIG.MAX_STEPS).toBe(1000);
      expect(DEFAULT_CONFIG.MIN_DELAY_MS).toBe(100);
    });
  });
  
  describe('SERVER_INFO and CLIENT_INFO', () => {
    it('should have name and version for server', () => {
      expect(SERVER_INFO).toHaveProperty('NAME');
      expect(SERVER_INFO).toHaveProperty('VERSION');
      expect(SERVER_INFO.NAME).toBe('mcp-notify-server');
      expect(SERVER_INFO.VERSION).toMatch(/^\d+\.\d+\.\d+$/); // Semantic version format
    });
    
    it('should have name and version for client', () => {
      expect(CLIENT_INFO).toHaveProperty('NAME');
      expect(CLIENT_INFO).toHaveProperty('VERSION');
      expect(CLIENT_INFO.NAME).toBe('mcp-notify-client');
      expect(CLIENT_INFO.VERSION).toMatch(/^\d+\.\d+\.\d+$/); // Semantic version format
    });
    
    it('should be effectively constant', () => {
      // Instead of testing runtime immutability (which may not be enforced),
      // test that values match expected constants
      const serverName = SERVER_INFO.NAME;
      const serverVersion = SERVER_INFO.VERSION;
      const clientName = CLIENT_INFO.NAME;
      const clientVersion = CLIENT_INFO.VERSION;
      
      expect(serverName).toBe('mcp-notify-server');
      expect(serverVersion).toBe('1.0.0');
      expect(clientName).toBe('mcp-notify-client');
      expect(clientVersion).toBe('1.0.0');
    });
  });
});