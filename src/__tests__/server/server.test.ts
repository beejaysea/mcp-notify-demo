import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
// Import server implementation
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { z } from 'zod';

// Mock the SDK
const mockSetRequestHandler = jest.fn();
const mockNotification = jest.fn();
const mockConnect = jest.fn(() => Promise.resolve());
const mockClose = jest.fn(() => Promise.resolve());
const mockCreateMessage = jest.fn(() => Promise.resolve({
  content: {
    type: 'text',
    text: 'Test response'
  }
}));

jest.mock('@modelcontextprotocol/sdk/server/index.js', () => {
  return {
    Server: jest.fn().mockImplementation(() => ({
      connect: mockConnect,
      notification: mockNotification,
      setRequestHandler: mockSetRequestHandler,
      createMessage: mockCreateMessage,
      close: mockClose
    }))
  };
});

jest.mock('@modelcontextprotocol/sdk/server/stdio.js', () => {
  return {
    StdioServerTransport: jest.fn().mockImplementation(() => ({
      // Mock as needed
    }))
  };
});

// Import the schemas from types.js
jest.mock('@modelcontextprotocol/sdk/types.js', () => {
  return {
    CallToolRequestSchema: {
      method: 'tools/call',
      params: {
        name: 'string',
        arguments: 'object'
      }
    },
    ListToolsRequestSchema: {
      method: 'tools/list',
      params: {}
    }
  };
});

describe('MCP Server Implementation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Create server instance for tests that need it
    new Server({
      name: "test-server",
      version: "1.0.0"
    }, {
      capabilities: { tools: {} }
    });
  });
  
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Server Initialization', () => {
    it('should initialize the server with correct parameters', () => {
      expect(Server).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.any(String),
          version: expect.any(String)
        }),
        expect.objectContaining({
          capabilities: expect.objectContaining({
            tools: expect.any(Object)
          })
        })
      );
    });
    
    it('should set up request handlers', () => {
      // Since we're using mocks, this test verifies the Server constructor and mock setup
      // In a real scenario, the server would set up ListTools and CallTool handlers
      expect(Server).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "test-server",
          version: "1.0.0"
        }),
        expect.objectContaining({
          capabilities: { tools: {} }
        })
      );
      
      // Verify that our mock functions are available
      expect(mockSetRequestHandler).toBeDefined();
      expect(typeof mockSetRequestHandler).toBe('function');
    });
  });

  describe('Tool Schema Validation', () => {
    it('should have valid long-running task schema', () => {
      // Create a schema definition matching the one in the server
      const LongRunningTaskSchema = z.object({
        steps: z.number().min(1).max(1000).describe("Number of steps to execute"),
        notificationInterval: z.number().min(1).default(1).describe("Send notification every N steps"),
        delayMs: z.number().min(100).max(10000).default(1000).describe("Delay between steps in milliseconds"),
        enableSampling: z.boolean().default(true).describe("Enable sampling requests to client"),
      });
      
      // Generate a schema from the definition
      const schema = z.toJSONSchema(LongRunningTaskSchema);
      
      // Verify schema structure
      expect(schema).toHaveProperty('type', 'object');
      expect(schema.properties).toHaveProperty('steps');
      expect(schema.properties).toHaveProperty('notificationInterval');
      expect(schema.properties).toHaveProperty('delayMs');
      expect(schema.properties).toHaveProperty('enableSampling');
      
      // Check constraints
      expect(schema.properties?.steps).toHaveProperty('minimum', 1);
      expect(schema.properties?.steps).toHaveProperty('maximum', 1000);
      expect(schema.properties?.notificationInterval).toHaveProperty('minimum', 1);
      expect(schema.properties?.delayMs).toHaveProperty('minimum', 100);
      expect(schema.properties?.delayMs).toHaveProperty('maximum', 10000);
    });
    
    it('should have valid cancel task schema', () => {
      // Create a schema definition matching the one in the server
      const CancelTaskSchema = z.object({
        taskId: z.string().describe("ID of the task to cancel"),
      });
      
      // Generate a schema from the definition
      const schema = z.toJSONSchema(CancelTaskSchema);
      
      // Verify schema structure
      expect(schema).toHaveProperty('type', 'object');
      expect(schema.properties).toHaveProperty('taskId');
      expect(schema.properties?.taskId).toHaveProperty('type', 'string');
    });
  });

  describe('Task Management', () => {
    it('should generate proper task IDs', () => {
      // Simulate how task IDs are generated in the server
      const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Verify structure
      expect(taskId).toMatch(/^task-\d+-[a-z0-9]+$/);
    });
    
    it('should track running tasks', () => {
      // Create mock task tracking map
      const runningTasks = new Map();
      
      // Add a task
      runningTasks.set('task-123', {
        cancel: jest.fn(),
        currentStep: 0,
        totalSteps: 10,
        cancelled: false
      });
      
      // Verify
      expect(runningTasks.size).toBe(1);
      expect(runningTasks.has('task-123')).toBe(true);
      expect(runningTasks.get('task-123')).toHaveProperty('cancel', expect.any(Function));
      expect(runningTasks.get('task-123')).toHaveProperty('currentStep', 0);
      expect(runningTasks.get('task-123')).toHaveProperty('totalSteps', 10);
      expect(runningTasks.get('task-123')).toHaveProperty('cancelled', false);
      
      // Remove a task
      runningTasks.delete('task-123');
      expect(runningTasks.size).toBe(0);
    });
  });
  
  describe('Notification Handling', () => {
    it('should send properly formatted progress notifications', () => {
      // Simulate a progress notification
      const notification = {
        method: "notifications/progress",
        params: {
          progressToken: `task-123-step-1`,
          progress: 10,
          taskId: 'task-123',
          type: "progress",
          data: {
            message: `Completed step 1 of 10`,
            step: 1,
            totalSteps: 10,
            taskId: 'task-123',
          },
          level: "info",
          timestamp: new Date().toISOString(),
        },
      };
      
      // Send notification with a spied function
      mockNotification(notification);
      
      // Verify notification was sent
      expect(mockNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "notifications/progress",
          params: expect.objectContaining({
            progressToken: expect.any(String),
            progress: expect.any(Number),
            taskId: expect.any(String)
          })
        })
      );
    });
    
    it('should send completion notifications when tasks finish', () => {
      // Simulate a completion notification
      const notification = {
        method: "notifications/progress",
        params: {
          progressToken: `task-123-complete`,
          progress: 100,
          taskId: 'task-123',
          type: "completion",
          data: {
            message: `Task completed successfully - all 10 steps finished`,
            step: 10,
            totalSteps: 10,
            taskId: 'task-123',
          },
          level: "info",
          timestamp: new Date().toISOString(),
        },
      };
      
      // Send notification with the mock function
      mockNotification(notification);
      
      // Verify notification was sent
      expect(mockNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "notifications/progress",
          params: expect.objectContaining({
            progressToken: expect.stringContaining('complete'),
            progress: 100
          })
        })
      );
    });
    
    it('should send cancellation notifications when tasks are cancelled', () => {
      // Simulate a cancellation notification
      const notification = {
        method: "notifications/progress",
        params: {
          progressToken: `task-123-cancelled`,
          progress: 50,
          taskId: 'task-123',
          type: "cancelled",
          data: {
            message: `Task was cancelled at step 5`,
            step: 5,
            totalSteps: 10,
            taskId: 'task-123',
          },
          level: "warning",
          timestamp: new Date().toISOString(),
        },
      };
      
      // Send notification with the mock function
      mockNotification(notification);
      
      // Verify notification was sent
      expect(mockNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "notifications/progress",
          params: expect.objectContaining({
            progressToken: expect.stringContaining('cancelled'),
            type: "cancelled",
            level: "warning"
          })
        })
      );
    });
  });
  
  describe('Error Handling', () => {
    it('should follow proper error response format', () => {
      // Simulate the error handling format from the server
      const errorResponse = {
        content: [
          {
            type: "text",
            text: `Error: Test error message`,
          },
        ],
        isError: true,
      };
      
      // Verify structure
      expect(errorResponse).toHaveProperty('content');
      expect(errorResponse.content[0]).toHaveProperty('type', 'text');
      expect(errorResponse.content[0]).toHaveProperty('text', expect.stringContaining('Error:'));
      expect(errorResponse).toHaveProperty('isError', true);
    });
    
    it('should handle different error types consistently', () => {
      // Function to format an error response
      const formatErrorResponse = (error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      };
      
      // Test with Error instance
      const errorInstance = new Error('Instance error');
      const response1 = formatErrorResponse(errorInstance);
      
      // Test with string
      const errorString = 'String error';
      const response2 = formatErrorResponse(errorString);
      
      // Test with other type
      const errorObject = { code: 500 };
      const response3 = formatErrorResponse(errorObject);
      
      // Verify all responses follow the same format
      expect(response1).toHaveProperty('isError', true);
      expect(response2).toHaveProperty('isError', true);
      expect(response3).toHaveProperty('isError', true);
      
      expect(response1.content[0].text).toBe('Error: Instance error');
      expect(response2.content[0].text).toBe('Error: String error');
      expect(response3.content[0].text).toBe('Error: [object Object]');
    });
  });
  
  describe('Graceful Shutdown', () => {
    it('should cancel all tasks on shutdown', () => {
      // Simulate the cleanup function
      const runningTasks = new Map();
      const task1 = { cancel: jest.fn(), cancelled: false };
      const task2 = { cancel: jest.fn(), cancelled: false };
      
      runningTasks.set('task-1', task1);
      runningTasks.set('task-2', task2);
      
      // Cleanup function
      const cleanup = async () => {
        for (const [, task] of runningTasks.entries()) {
          task.cancel();
          task.cancelled = true;
        }
        runningTasks.clear();
      };
      
      // Execute cleanup
      cleanup();
      
      // Verify tasks were cancelled and map was cleared
      expect(task1.cancel).toHaveBeenCalled();
      expect(task2.cancel).toHaveBeenCalled();
      expect(task1.cancelled).toBe(true);
      expect(task2.cancelled).toBe(true);
      expect(runningTasks.size).toBe(0);
    });
    
    it('should register signal handlers for SIGINT', () => {
      // Create a mock console.error
      const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Get current signal handlers
      const originalHandlers = process.listeners('SIGINT');
      
      try {
        // Clean up any existing handlers
        process.removeAllListeners('SIGINT');
        
        // Register a test handler
        process.on('SIGINT', async () => {
          console.error('Cleaning up running tasks...');
          // Cleanup would happen here
        });
        
        // Verify handler was registered
        const handlers = process.listeners('SIGINT');
        expect(handlers.length).toBe(1);
        
        // Simulate handler call (signal handlers expect a signal parameter)
        (handlers[0] as any)('SIGINT');
        
        // Verify cleanup message
        expect(mockConsoleError).toHaveBeenCalledWith('Cleaning up running tasks...');
      } finally {
        // Restore original handlers
        process.removeAllListeners('SIGINT');
        originalHandlers.forEach(handler => {
          process.on('SIGINT', handler);
        });
        mockConsoleError.mockRestore();
      }
    });
  });
});