/**
 * MCP Client implementation with notification and sampling handling
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { CliArgs } from '../shared/config.js';
import { CLIENT_INFO, TOOL_NAMES, NOTIFICATION_METHODS, SAMPLING_METHODS } from '../shared/constants.js';
import { NotificationHandler } from './handlers/notificationHandler.js';
import { SamplingHandler } from './handlers/samplingHandler.js';
import { Display } from './ui/display.js';

export class McpNotifyClient {
  private client: Client;
  private transport: StdioClientTransport | null = null;
  private notificationHandler: NotificationHandler;
  private samplingHandler: SamplingHandler;
  private display: Display;

  constructor(enableColors = true, showTimestamps = true) {
    this.display = new Display(enableColors);
    this.notificationHandler = new NotificationHandler(enableColors, showTimestamps);
    this.samplingHandler = new SamplingHandler(enableColors);

    // Initialize MCP client with sampling capability
    this.client = new Client(
      {
        name: CLIENT_INFO.NAME,
        version: CLIENT_INFO.VERSION,
      },
      {
        capabilities: {
          sampling: {},
        },
      }
    );

    this.setupEventHandlers();
  }

  /**
   * Set up client event handlers
   */
  private setupEventHandlers(): void {
    // Handle notifications from server
    this.client.setNotificationHandler(
      NOTIFICATION_METHODS.PROGRESS_UPDATE,
      (params) => this.notificationHandler.handleNotification(NOTIFICATION_METHODS.PROGRESS_UPDATE, params as any)
    );

    this.client.setNotificationHandler(
      NOTIFICATION_METHODS.STATUS_UPDATE,
      (params) => this.notificationHandler.handleNotification(NOTIFICATION_METHODS.STATUS_UPDATE, params as any)
    );

    this.client.setNotificationHandler(
      NOTIFICATION_METHODS.ERROR_UPDATE,
      (params) => this.notificationHandler.handleNotification(NOTIFICATION_METHODS.ERROR_UPDATE, params as any)
    );

    this.client.setNotificationHandler(
      NOTIFICATION_METHODS.COMPLETION_UPDATE,
      (params) => this.notificationHandler.handleNotification(NOTIFICATION_METHODS.COMPLETION_UPDATE, params as any)
    );

    // Handle sampling requests from server
    this.client.setRequestHandler(
      SAMPLING_METHODS.CREATE_MESSAGE,
      async (request) => {
        return await this.samplingHandler.handleSamplingRequest(request);
      }
    );
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
      const response = await this.client.request(
        { method: 'tools/list' },
        ListToolsRequestSchema
      );
      return response.tools;
    } catch (error) {
      this.display.showError('Failed to list tools', error instanceof Error ? error : undefined);
      throw error;
    }
  }

  /**
   * Execute the long-running process
   */
  async executeLongRunningProcess(args: CliArgs): Promise<any> {
    try {
      this.display.showExecutionParams(args);
      this.display.showExecutionStart();

      const response = await this.client.request(
        {
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
        },
        CallToolRequestSchema
      );

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
    return this.notificationHandler.getStatistics();
  }

  /**
   * Get sampling statistics
   */
  getSamplingStatistics(): { totalRequests: number; averageResponseLength: number } {
    return this.samplingHandler.getStatistics();
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
