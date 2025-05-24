import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Display } from '../../client/ui/display';
import { ExecutionParams } from '../../shared/config';

describe('Display', () => {
  let display: Display;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  
  beforeEach(() => {
    // Disable colors for deterministic testing
    display = new Display(false);
    
    // Spy on console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });
  
  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Basic Output', () => {
    it('should display welcome message', () => {
      display.showWelcome();
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      expect(consoleLogSpy).toHaveBeenCalledWith('MCP Notification Client');
    });
    
    it('should display connection status', () => {
      display.showConnectionStatus(true, 'Test Server');
      expect(consoleLogSpy).toHaveBeenCalledWith('[CONNECTED] to Test Server\n');
      
      display.showConnectionStatus(false);
      expect(consoleLogSpy).toHaveBeenCalledWith('[DISCONNECTED]\n');
    });
    
    it('should display separator line', () => {
      display.showSeparator();
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('Execution Information', () => {
    it('should display execution parameters', () => {
      const params: ExecutionParams = {
        steps: 10,
        interval: 2,
        delay: 500,
        sampling: true,
        verbose: false
      };
      
      display.showExecutionParams(params);
      
      expect(consoleLogSpy).toHaveBeenCalledWith('Execution Parameters:');
      expect(consoleLogSpy).toHaveBeenCalledWith('  Steps: 10');
      expect(consoleLogSpy).toHaveBeenCalledWith('  Notification Interval: 2');
      expect(consoleLogSpy).toHaveBeenCalledWith('  Delay per Step: 500ms');
      expect(consoleLogSpy).toHaveBeenCalledWith('  Sampling Enabled: Yes');
    });
    
    it('should display execution start message', () => {
      display.showExecutionStart();
      
      expect(consoleLogSpy).toHaveBeenCalledWith('Starting long-running process...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Watch for notifications below:\n');
    });
    
    it('should display execution results with string input', () => {
      const resultString = JSON.stringify({
        success: true,
        totalSteps: 10,
        completedSteps: 10
      });
      
      display.showExecutionResults(resultString);
      
      expect(consoleLogSpy).toHaveBeenCalledWith('\nExecution Results:');
      expect(consoleLogSpy).toHaveBeenCalledWith('  Success: Yes');
      expect(consoleLogSpy).toHaveBeenCalledWith('  Total Steps: 10');
      expect(consoleLogSpy).toHaveBeenCalledWith('  Completed Steps: 10');
    });
    
    it('should display execution results with object input', () => {
      const resultObject = {
        success: false,
        totalSteps: 10,
        completedSteps: 5,
        error: 'Process was interrupted'
      };
      
      display.showExecutionResults(resultObject);
      
      expect(consoleLogSpy).toHaveBeenCalledWith('\nExecution Results:');
      expect(consoleLogSpy).toHaveBeenCalledWith('  Success: No');
      expect(consoleLogSpy).toHaveBeenCalledWith('  Total Steps: 10');
      expect(consoleLogSpy).toHaveBeenCalledWith('  Completed Steps: 5');
      expect(consoleLogSpy).toHaveBeenCalledWith('  Error: Process was interrupted');
    });
  });

  describe('Error and Notification Handling', () => {
    it('should display error messages', () => {
      display.showError('Something went wrong');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] Something went wrong');
    });
    
    it('should display error messages with stack trace', () => {
      const error = new Error('Test error');
      display.showError('Something went wrong', error);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] Something went wrong');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Stack trace:'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(error.stack!));
    });
    
    it('should display notification messages', () => {
      display.showNotification('info', 'Test notification');
      
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[INFO] Test notification'));
    });
    
    it('should display notification messages with data', () => {
      const data = { key: 'value', number: 42 };
      display.showNotification('warn', 'Warning message', data);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[WARN] Warning message'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Data:'));
    });
  });

  describe('Progress Visualization', () => {
    it('should display progress information', () => {
      display.showProgress(5, 10, 'Halfway there');
      
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[PROGRESS]'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('50%'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('(5/10)'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Halfway there'));
    });
    
    it('should display progress information without message', () => {
      display.showProgress(2, 10);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[PROGRESS]'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('20%'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('(2/10)'));
      // No additional message call
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });
    
    it('should create progress bars of different lengths', () => {
      const createProgressBar = (display as any).createProgressBar.bind(display);
      
      const bar25 = createProgressBar(25, 20);
      const bar50 = createProgressBar(50, 10);
      const bar75 = createProgressBar(75, 8);
      const bar100 = createProgressBar(100, 10);
      
      // Check that the bars are of the expected length
      expect(bar25.length).toBe(22); // [=====---------------]
      expect(bar50.length).toBe(12); // [====-----]
      expect(bar75.length).toBe(10); // [======--]
      expect(bar100.length).toBe(12); // [==========]
      
      // Check the fill ratio
      expect(bar25.split('=').length - 1).toBe(5); // 5 filled chars
      expect(bar50.split('=').length - 1).toBe(5); // 5 filled chars
      expect(bar75.split('=').length - 1).toBe(6); // 6 filled chars
      expect(bar100.split('=').length - 1).toBe(10); // 10 filled chars
    });
  });

  describe('Sampling Request/Response Handling', () => {
    it('should display sampling request information', () => {
      const request = {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: 'Test request'
            }
          }
        ],
        maxTokens: 100
      };
      
      display.showSamplingRequest(request);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[SAMPLING REQUEST]'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Message 1 (user):'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Test request'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Max Tokens: 100'));
    });
    
    it('should handle sampling requests with string content', () => {
      const request = {
        messages: [
          {
            role: 'user',
            content: 'Plain string content'
          }
        ]
      };
      
      display.showSamplingRequest(request);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[SAMPLING REQUEST]'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Message 1 (user): Plain string content'));
    });
    
    it('should display sampling response information', () => {
      const response = {
        message: {
          role: 'assistant',
          content: {
            type: 'text',
            text: 'Test response'
          }
        },
        stopReason: 'complete'
      };
      
      display.showSamplingResponse(response);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[SAMPLING RESPONSE]'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Response (assistant):'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Test response'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Stop Reason: complete'));
    });
    
    it('should handle sampling responses with string content', () => {
      const response = {
        message: {
          role: 'assistant',
          content: 'Plain string response'
        }
      };
      
      display.showSamplingResponse(response);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[SAMPLING RESPONSE]'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Response (assistant): Plain string response'));
    });
  });
  
  describe('Help Information', () => {
    it('should display help information', () => {
      display.showHelp();
      
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('MCP Notification Client Usage:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Command line arguments:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('--steps <number>'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Examples:'));
    });
  });
  
  describe('Color Handling', () => {
    it('should use appropriate colors for different log levels', () => {
      // Create a display with colors enabled
      const colorDisplay = new Display(true);
      
      // Store the original console.log
      const originalLog = console.log;
      
      try {
        // Create a mock that captures the color codes
        const mockLog = jest.fn();
        console.log = mockLog;
        
        // Test different log levels
        colorDisplay.showNotification('error', 'Error message');
        colorDisplay.showNotification('warn', 'Warning message');
        colorDisplay.showNotification('info', 'Info message');
        colorDisplay.showNotification('debug', 'Debug message');
        colorDisplay.showNotification('unknown', 'Unknown level message');
        
        // Check that each call has different color codes
        const calls = mockLog.mock.calls;
        const errorCall = calls[0][0];
        const warnCall = calls[1][0];
        const infoCall = calls[2][0];
        const debugCall = calls[3][0];
        const unknownCall = calls[4][0];
        
        // Each should have color codes
        expect(errorCall).toMatch(/\x1b\[\d+m/);
        expect(warnCall).toMatch(/\x1b\[\d+m/);
        expect(infoCall).toMatch(/\x1b\[\d+m/);
        expect(debugCall).toMatch(/\x1b\[\d+m/);
        expect(unknownCall).toMatch(/\x1b\[\d+m/);
        
        // Each should be different (except maybe debug and unknown)
        const colorSets = new Set([errorCall, warnCall, infoCall, debugCall, unknownCall]);
        expect(colorSets.size).toBeGreaterThan(3); // At least 4 different color codes
      } finally {
        // Restore the original console.log
        console.log = originalLog;
      }
    });
  });
});