/**
 * MCP Server implementation with long-running tools and notifications
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { LongRunningToolParamsSchema } from '../shared/types.js';
import { TOOL_NAMES, SERVER_INFO } from '../shared/constants.js';
import { LongRunningTool } from './tools/longRunningTool.js';

export class McpNotifyServer {
  private server: Server;
  private longRunningTool: LongRunningTool;

  constructor() {
    // Initialize the MCP server
    this.server = new Server(
      {
        name: SERVER_INFO.NAME,
        version: SERVER_INFO.VERSION,
      },
      {
        capabilities: {
          tools: {},
          sampling: {},
        },
      }
    );

    // Initialize tools
    this.longRunningTool = new LongRunningTool(this.server);

    // Set up request handlers
    this.setupRequestHandlers();
  }

  /**
   * Set up MCP request handlers
   */
  private setupRequestHandlers(): void {
    // Handle tools list request
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: TOOL_NAMES.EXECUTE_LONG_PROCESS,
            description: 'Execute a long-running process with configurable steps, notifications, and sampling',
            inputSchema: {
              type: 'object',
              properties: {
                steps: {
                  type: 'number',
                  description: 'Number of steps to execute',
                  minimum: 1,
                  maximum: 1000,
                },
                notificationInterval: {
                  type: 'number',
                  description: 'Send notification every N steps',
                  minimum: 1,
                  default: 1,
                },
                delayMs: {
                  type: 'number',
                  description: 'Delay between steps in milliseconds',
                  minimum: 100,
                  maximum: 10000,
                  default: 1000,
                },
                enableSampling: {
                  type: 'boolean',
                  description: 'Enable sampling requests to client',
                  default: true,
                },
              },
              required: ['steps'],
            },
          },
        ],
      };
    });

    // Handle tool execution request
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (name === TOOL_NAMES.EXECUTE_LONG_PROCESS) {
        try {
          // Validate parameters
          const params = LongRunningToolParamsSchema.parse(args);
          
          // Execute the long-running tool
          const result = await this.longRunningTool.execute(params);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
            isError: !result.success,
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return {
            content: [
              {
                type: 'text',
                text: `Error executing long-running process: ${errorMessage}`,
              },
            ],
            isError: true,
          };
        }
      }

      throw new Error(`Unknown tool: ${name}`);
    });
  }

  /**
   * Start the MCP server with stdio transport
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    
    console.error('Starting MCP Notify Server...');
    console.error(`Server: ${SERVER_INFO.NAME} v${SERVER_INFO.VERSION}`);
    console.error('Available tools:');
    console.error(`  - ${TOOL_NAMES.EXECUTE_LONG_PROCESS}`);
    console.error('Ready for connections.\n');

    await this.server.connect(transport);
  }

  /**
   * Get the underlying server instance
   */
  getServer(): Server {
    return this.server;
  }
}
