/**
 * MCP Client implementation with notification and sampling handling
 * Fixed to follow proper MCP TypeScript SDK patterns
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import {
  CallToolRequest,
  CallToolResultSchema,
  ListToolsRequest,
  ListToolsResultSchema,
  CreateMessageRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ExecutionParams } from '../shared/config';
import { CLIENT_INFO, TOOL_NAMES } from '../shared/constants';
import { Display } from './ui/display';

export class McpNotifyClient {
  private client: Client;
  private transport: StdioClientTransport | null = null;
  private display: Display;
  private notificationCount: Record<string, number> = {};
  private samplingCount = 0;
  private samplingResponses: string[] = [];

  constructor(enableColors = true) {
    this.display = new Display(enableColors);

    // Initialize MCP client with sampling capability - following SDK patterns
    this.client = new Client(
      {
        name: CLIENT_INFO.NAME,
        version: CLIENT_INFO.VERSION,
      },
      {
        capabilities: {
          sampling: {}, // Enable sampling capability
        },
      }
    );

    this.setupEventHandlers();
  }

  /**
   * Set up client event handlers following SDK patterns
   */
  private setupEventHandlers(): void {
    // Handle custom notifications through fallback handler
    this.client.fallbackNotificationHandler = async (notification) => {
      // Handle our custom notifications
      if (notification.method.startsWith('notifications/')) {
        this.handleCustomNotification(notification);
      } else {
        // Log unhandled notifications for debugging (but don't show as errors)
        console.log(`[DEBUG] Unhandled notification method: ${notification.method}`);
      }
    };

    // Handle sampling requests from server - proper MCP sampling pattern
    this.client.setRequestHandler(CreateMessageRequestSchema, async (request) => {
      return await this.handleSamplingRequest(request);
    });

    // Handle client errors with proper filtering
    this.client.onerror = (error) => {
      // Filter out schema validation errors for our custom notifications
      const errorMessage = error.message || String(error);
      if (errorMessage.includes('progressToken') || errorMessage.includes('progress') || errorMessage.includes('notification handler')) {
        // These are schema validation errors we can safely ignore
        // Our fallback handler will handle these notifications anyway
        return;
      }
      
      this.display.showError('MCP Client Error', error);
    };
  }

  /**
   * Handle custom notifications from server (progress, status, etc.)
   */
  private handleCustomNotification(notification: any): void {
    const type = notification.method.replace('notifications/', '');
    this.notificationCount[type] = (this.notificationCount[type] || 0) + 1;
    
    const params = notification.params || {};
    const timestamp = params.timestamp || new Date().toISOString();
    
    // Extract message from different possible locations
    let message = 'No message';
    let level = 'info';
    let taskId = undefined;
    let progressInfo: { current: number; total: number; percentage: number } | undefined = undefined;
    
    if (params.data) {
      // Server sends structured data in params.data
      message = params.data.message || message;
      taskId = params.data.taskId;
      level = params.level || 'info';
      
      // Extract progress information if available
      if (params.data.step !== undefined && params.data.totalSteps !== undefined) {
        progressInfo = {
          current: params.data.step,
          total: params.data.totalSteps,
          percentage: Math.round((params.data.step / params.data.totalSteps) * 100)
        };
      }
    } else {
      // Fallback to direct params
      message = params.message || message;
      level = params.level || params.type || 'info';
      taskId = params.taskId;
    }
    
    this.display.showNotification(level, message, { type, timestamp, taskId });
    
    // Show progress information if available
    if (progressInfo) {
      this.display.showProgress(progressInfo.current, progressInfo.total, message);
    }
  }

  /**
   * Handle sampling requests from server - following MCP sampling specification
   */
  private async handleSamplingRequest(request: any): Promise<any> {
    this.samplingCount++;
    
    const messages = request.params.messages || [];
    const maxTokens = request.params.maxTokens || 100;
    const systemPrompt = request.params.systemPrompt || '';
    
    // Extract the content from the messages
    let content = 'No content to process';
    if (messages.length > 0 && messages[0].content) {
      if (typeof messages[0].content === 'string') {
        content = messages[0].content;
      } else if (messages[0].content.text) {
        content = messages[0].content.text;
      }
    }
    
    // Show sampling request in UI
    this.display.showSamplingRequest({ messages, maxTokens, systemPrompt });
    
    // Simple echo response - in a real implementation, this would call an LLM
    const response = `✨ Feedback #${this.samplingCount}: Looking good! ${content.includes('progress') ? 'Great progress so far!' : 'Keep up the excellent work!'} 🚀`;
    this.samplingResponses.push(response);
    
    // Show sampling response in UI
    this.display.showSamplingResponse({ 
      message: { role: 'assistant', content: response }, 
      stopReason: 'complete' 
    });
    
    // Return proper MCP sampling response format
    return {
      model: 'mcp-notify-client-mock', // Required field
      role: 'assistant',
      content: {
        type: 'text',
        text: response,
      },
      stopReason: 'end_turn', // Optional but good practice
    };
  }

  /**
   * Connect to the MCP server
   */
  async connect(serverCommand: string, serverArgs: string[] = []): Promise<void> {
    try {
      this.transport = new StdioClientTransport({
        command: serverCommand,
        args: serverArgs,
      });

      await this.client.connect(this.transport);
      this.display.showConnectionStatus(true, 'MCP Notify Server');
    } catch (error) {
      this.display.showConnectionStatus(false);
      throw error;
    }
  }

  /**
   * List available tools from the server
   */
  async listTools(): Promise<any> {
    try {
      const request: ListToolsRequest = {
        method: 'tools/list',
        params: {}
      };
      
      const response = await this.client.request(request, ListToolsResultSchema);
      return response.tools;
    } catch (error) {
      this.display.showError('Failed to list tools', error instanceof Error ? error : undefined);
      throw error;
    }
  }

  /**
   * Execute the long-running process
   */
  async executeLongRunningProcess(args: ExecutionParams): Promise<any> {
    try {
      this.display.showExecutionParams(args);
      this.display.showExecutionStart();

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: TOOL_NAMES.EXECUTE_LONG_PROCESS,
          arguments: {
            steps: args.steps,
            notificationInterval: args.interval,
            delayMs: args.delay,
            enableSampling: args.sampling,
          },
        },
      };

      const response = await this.client.request(request, CallToolResultSchema);
      return response;
    } catch (error) {
      this.display.showError('Failed to execute long-running process', error instanceof Error ? error : undefined);
      throw error;
    }
  }

  /**
   * Disconnect from the server
   */
  async disconnect(): Promise<void> {
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
      this.display.showConnectionStatus(false);
    }
  }

  /**
   * Get notification statistics
   */
  getNotificationStatistics(): Record<string, number> {
    return { ...this.notificationCount };
  }

  /**
   * Get sampling statistics
   */
  getSamplingStatistics(): { totalRequests: number; averageResponseLength: number } {
    const averageLength = this.samplingResponses.length > 0 
      ? this.samplingResponses.reduce((sum, resp) => sum + resp.length, 0) / this.samplingResponses.length
      : 0;
      
    return {
      totalRequests: this.samplingCount,
      averageResponseLength: Math.round(averageLength),
    };
  }

  /**
   * Show execution summary
   */
  showSummary(): void {
    this.display.showSeparator();
    
    const notificationStats = this.getNotificationStatistics();
    const samplingStats = this.getSamplingStatistics();

    console.log('Session Summary:');
    console.log(`  Notifications received: ${Object.values(notificationStats).reduce((a, b) => a + b, 0)}`);
    
    Object.entries(notificationStats).forEach(([type, count]) => {
      console.log(`    ${type}: ${count}`);
    });

    if (samplingStats.totalRequests > 0) {
      console.log(`  Sampling requests handled: ${samplingStats.totalRequests}`);
      console.log(`  Average response length: ${samplingStats.averageResponseLength} characters`);
    }

    this.display.showSeparator();
  }
}
