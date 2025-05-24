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
    // Handle custom progress notifications from server using fallback handler
    this.client.fallbackNotificationHandler = async (notification) => {
      if (notification.method.startsWith('notifications/')) {
        this.handleCustomNotification(notification);
      }
    };

    // Handle sampling requests from server
    this.client.setRequestHandler(CreateMessageRequestSchema, async (request) => {
      return await this.handleSamplingRequest(request);
    });

    // Handle client errors
    this.client.onerror = (error) => {
      this.display.showError('MCP Client Error', error);
    };
  }

  /**
   * Handle custom notifications from server (progress, status, etc.)
   */
  private handleCustomNotification(notification: any): void {
    console.log('Received notification:', JSON.stringify(notification, null, 2));
    
    const type = notification.method.replace('notifications/', '');
    this.notificationCount[type] = (this.notificationCount[type] || 0) + 1;
    
    const params = notification.params || {};
    const timestamp = params.timestamp || new Date().toISOString();
    const message = params.message || 'No message';
    const level = params.type || 'info';
    
    this.display.showNotification(level, message, { type, timestamp, taskId: params.taskId });
    
    // Show progress information if available
    if (params.progress !== undefined && params.step !== undefined) {
      // Use step and calculate total from progress percentage
      const currentStep = params.step;
      const totalSteps = Math.round(currentStep / (params.progress / 100));
      this.display.showProgress(currentStep, totalSteps, message);
    }
  }

  /**
   * Handle sampling requests from server - following SDK patterns
   */
  private async handleSamplingRequest(request: any): Promise<any> {
    this.samplingCount++;
    
    const messages = request.params.messages || [];
    const maxTokens = request.params.maxTokens || 100;
    
    // Extract the content to echo back
    let content = 'No content to process';
    if (messages.length > 0 && messages[0].content) {
      if (typeof messages[0].content === 'string') {
        content = messages[0].content;
      } else if (messages[0].content.text) {
        content = messages[0].content.text;
      }
    }
    
    // Simple echo response - in a real implementation, this would call an LLM
    const response = `Echo response #${this.samplingCount}: ${content}`;
    this.samplingResponses.push(response);
    
    this.display.showSamplingRequest({ messages, maxTokens });
    this.display.showSamplingResponse({ message: { role: 'assistant', content: response }, stopReason: 'complete' });
    
    return {
      role: 'assistant',
      content: {
        type: 'text',
        text: response,
      },
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
