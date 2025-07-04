import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { McpNotifyClient } from '../../client/client';
import { ExecutionParams } from '../../shared/config';
import { TOOL_NAMES } from '../../shared/constants';

// Mock the @modelcontextprotocol/sdk dependencies
jest.mock('@modelcontextprotocol/sdk/client/index.js', () => {
  return {
    Client: jest.fn().mockImplementation(() => ({
      connect: jest.fn().mockResolvedValue(undefined),
      request: jest.fn().mockImplementation((request) => {
        if (request.method === 'tools/list') {
          return Promise.resolve({
            tools: [
              { name: 'start_long_running_task' }
            ]
          });
        }
        if (request.method === 'tools/call') {
          return Promise.resolve({
            content: [{ type: 'text', text: 'Task started' }]
          });
        }
        return Promise.reject(new Error('Unknown request'));
      }),
      notification: jest.fn(),
      fallbackNotificationHandler: null,
      setRequestHandler: jest.fn(),
      onerror: null,
    }))
  };
});

jest.mock('@modelcontextprotocol/sdk/client/stdio.js', () => {
  return {
    StdioClientTransport: jest.fn().mockImplementation(() => ({
      close: jest.fn().mockResolvedValue(undefined)
    }))
  };
});

// Mock the Display class
jest.mock('../../client/ui/display', () => {
  return {
    Display: jest.fn().mockImplementation(() => ({
      showConnectionStatus: jest.fn(),
      showNotification: jest.fn(),
      showError: jest.fn(),
      showExecutionParams: jest.fn(),
      showExecutionStart: jest.fn(),
      showSamplingRequest: jest.fn(),
      showSamplingResponse: jest.fn(),
      showWelcome: jest.fn(),
      showSeparator: jest.fn(),
      showProgress: jest.fn(),
    }))
  };
});

describe('McpNotifyClient', () => {
  let client: McpNotifyClient;

  beforeEach(() => {
    client = new McpNotifyClient(false); // Disable colors for testing
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should create an instance with default parameters', () => {
      expect(client).toBeDefined();
    });

    it('should set up event handlers during initialization', () => {
      // This is implicitly testing that constructor works
      expect(client).toBeDefined();
      // Further tests could look at internal state if needed
    });
  });

  describe('Connection Management', () => {
    it('should connect to an MCP server', async () => {
      await client.connect('node', ['server.js']);
      
      // Check that internal display was called with correct status
      const display = (client as any).display;
      expect(display.showConnectionStatus).toHaveBeenCalledWith(true, 'MCP Notify Server');
    });

    it('should handle connection errors', async () => {
      // Mock the Client.connect method to throw an error
      const mockClient = require('@modelcontextprotocol/sdk/client/index.js').Client;
      mockClient.mockImplementation(() => ({
        connect: jest.fn().mockRejectedValue(new Error('Connection failed')),
        request: jest.fn(),
        notification: jest.fn(),
        setRequestHandler: jest.fn(),
      }));

      client = new McpNotifyClient(false); // Recreate with the new mock
      
      await expect(client.connect('node', ['server.js'])).rejects.toThrow('Connection failed');
      
      const display = (client as any).display;
      expect(display.showConnectionStatus).toHaveBeenCalledWith(false);
    });

    it('should disconnect from the server', async () => {
      // First connect to have a transport
      await client.connect('node', ['server.js']);
      
      // Now disconnect
      await client.disconnect();
      
      const display = (client as any).display;
      expect(display.showConnectionStatus).toHaveBeenCalledWith(false);
      
      // Check that transport is cleared
      expect((client as any).transport).toBeNull();
    });
  });

  describe('Tool Execution', () => {
    beforeEach(async () => {
      // Connect first for these tests
      await client.connect('node', ['server.js']);
    });
    
    it('should list available tools', async () => {
      const tools = await client.listTools();
      
      expect(tools).toEqual([
        { name: 'start_long_running_task' }
      ]);
    });

    it('should handle errors when listing tools', async () => {
      // Mock the request method to throw an error
      const mockClient = require('@modelcontextprotocol/sdk/client/index.js').Client;
      const mockClientInstance = mockClient.mock.results[0].value;
      mockClientInstance.request.mockRejectedValueOnce(new Error('Failed to list tools'));

      await expect(client.listTools()).rejects.toThrow();
      
      const display = (client as any).display;
      expect(display.showError).toHaveBeenCalled();
    });

    it('should execute a long-running process', async () => {
      const params: ExecutionParams = {
        steps: 10,
        interval: 2,
        delay: 500,
        sampling: true,
        verbose: false
      };
      
      const result = await client.executeLongRunningProcess(params);
      
      // Check the result
      expect(result).toBeDefined();
      expect(result).toHaveProperty('content');

      // Check that the right tool was called
      const mockClient = require('@modelcontextprotocol/sdk/client/index.js').Client;
      const mockClientInstance = mockClient.mock.results[0].value;
      expect(mockClientInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'tools/call',
          params: expect.objectContaining({
            name: TOOL_NAMES.EXECUTE_LONG_PROCESS,
            arguments: expect.objectContaining({
              steps: params.steps,
              notificationInterval: params.interval,
              delayMs: params.delay,
              enableSampling: params.sampling
            })
          })
        }),
        expect.anything()
      );
    });

    it('should handle errors in long-running process execution', async () => {
      // Mock the request method to throw an error
      const mockClient = require('@modelcontextprotocol/sdk/client/index.js').Client;
      const mockClientInstance = mockClient.mock.results[0].value;
      mockClientInstance.request.mockRejectedValueOnce(new Error('Execution failed'));

      const params: ExecutionParams = {
        steps: 10,
        interval: 2,
        delay: 500,
        sampling: true,
        verbose: false
      };
      
      await expect(client.executeLongRunningProcess(params)).rejects.toThrow();
      
      const display = (client as any).display;
      expect(display.showError).toHaveBeenCalled();
    });
  });

  describe('Notification Handling', () => {
    it('should handle custom notifications', () => {
      // Get access to the private method
      const handleCustomNotification = (client as any).handleCustomNotification.bind(client);
      
      // Create a test notification
      const notification = {
        method: 'notifications/progress',
        params: {
          data: {
            message: 'Test notification',
            taskId: 'test-task',
            step: 5,
            totalSteps: 10
          },
          level: 'info',
          timestamp: '2023-01-01T12:00:00.000Z'
        }
      };
      
      handleCustomNotification(notification);
      
      // Verify that notification is tracked
      const notificationCount = (client as any).notificationCount;
      expect(notificationCount).toHaveProperty('progress');
      
      // Verify display was called
      const display = (client as any).display;
      expect(display.showNotification).toHaveBeenCalled();
      expect(display.showProgress).toHaveBeenCalledWith(5, 10, 'Test notification');
    });

    it('should handle notifications without data field', () => {
      // Get access to the private method
      const handleCustomNotification = (client as any).handleCustomNotification.bind(client);
      
      // Create a test notification with direct params
      const notification = {
        method: 'notifications/status',
        params: {
          message: 'Direct message',
          level: 'warn',
          taskId: 'test-task',
          timestamp: '2023-01-01T12:00:00.000Z'
        }
      };
      
      handleCustomNotification(notification);
      
      // Verify that notification is tracked
      const notificationCount = (client as any).notificationCount;
      expect(notificationCount).toHaveProperty('status');
      
      // Verify display was called
      const display = (client as any).display;
      expect(display.showNotification).toHaveBeenCalled();
    });
  });

  describe('Sampling Handling', () => {
    it('should handle sampling requests', async () => {
      // Get access to the private method
      const handleSamplingRequest = (client as any).handleSamplingRequest.bind(client);
      
      // Create a test request
      const request = {
        params: {
          messages: [
            { 
              role: 'user',
              content: {
                type: 'text',
                text: 'Test sampling request'
              }
            }
          ],
          maxTokens: 100,
          systemPrompt: 'Test prompt'
        }
      };
      
      const response = await handleSamplingRequest(request);
      
      // Verify response format
      expect(response).toHaveProperty('model');
      expect(response).toHaveProperty('role', 'assistant');
      expect(response).toHaveProperty('content');
      expect(response.content).toHaveProperty('type', 'text');
      expect(response.content).toHaveProperty('text');
      
      // Verify sampling is tracked
      expect((client as any).samplingCount).toBe(1);
      expect((client as any).samplingResponses.length).toBe(1);
      
      // Verify display was called
      const display = (client as any).display;
      expect(display.showSamplingRequest).toHaveBeenCalled();
      expect(display.showSamplingResponse).toHaveBeenCalled();
    });

    it('should extract content from different message formats', async () => {
      // Get access to the private method
      const handleSamplingRequest = (client as any).handleSamplingRequest.bind(client);
      
      // Test with string content
      const stringRequest = {
        params: {
          messages: [
            { role: 'user', content: 'Plain string content' }
          ]
        }
      };
      
      await handleSamplingRequest(stringRequest);
      
      // Test with object content with text field
      const objectRequest = {
        params: {
          messages: [
            { 
              role: 'user', 
              content: { 
                text: 'Object content with text field',
                type: 'text'
              } 
            }
          ]
        }
      };
      
      await handleSamplingRequest(objectRequest);
      
      // Verify display was called twice
      const display = (client as any).display;
      expect(display.showSamplingRequest).toHaveBeenCalledTimes(2);
      expect(display.showSamplingResponse).toHaveBeenCalledTimes(2);
    });
  });

  describe('Statistics Reporting', () => {
    it('should track notification statistics', () => {
      // Get access to the private method
      const handleCustomNotification = (client as any).handleCustomNotification.bind(client);
      
      // Send a few test notifications
      handleCustomNotification({
        method: 'notifications/progress',
        params: { data: { message: 'Progress 1' } }
      });
      
      handleCustomNotification({
        method: 'notifications/progress',
        params: { data: { message: 'Progress 2' } }
      });
      
      handleCustomNotification({
        method: 'notifications/error',
        params: { data: { message: 'Error 1' } }
      });
      
      // Get statistics
      const stats = client.getNotificationStatistics();
      
      // Verify counts
      expect(stats.progress).toBe(2);
      expect(stats.error).toBe(1);
    });

    it('should track sampling statistics', async () => {
      // Get access to the private method
      const handleSamplingRequest = (client as any).handleSamplingRequest.bind(client);
      
      // Send a few test sampling requests
      await handleSamplingRequest({
        params: {
          messages: [{ role: 'user', content: 'Test 1' }]
        }
      });
      
      await handleSamplingRequest({
        params: {
          messages: [{ role: 'user', content: 'Test 2' }]
        }
      });
      
      // Get statistics
      const stats = client.getSamplingStatistics();
      
      // Verify stats
      expect(stats.totalRequests).toBe(2);
      expect(stats.averageResponseLength).toBeGreaterThan(0);
    });

    it('should provide statistics when none are available', () => {
      // Create a fresh client with no activity
      const freshClient = new McpNotifyClient();
      
      // Get statistics
      const notificationStats = freshClient.getNotificationStatistics();
      const samplingStats = freshClient.getSamplingStatistics();
      
      // Verify empty stats
      expect(Object.keys(notificationStats).length).toBe(0);
      expect(samplingStats.totalRequests).toBe(0);
      expect(samplingStats.averageResponseLength).toBe(0);
    });
  });
});