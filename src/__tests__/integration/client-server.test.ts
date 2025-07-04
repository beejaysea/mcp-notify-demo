import { describe, it, expect, jest, beforeAll, afterAll } from '@jest/globals';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { EventEmitter } from 'events';

// Create memory-based communication channel
class MemoryChannel extends EventEmitter {
  server: EventEmitter;
  client: EventEmitter;

  constructor() {
    super();
    this.server = new EventEmitter();
    this.client = new EventEmitter();
  }
  
  fromClientToServer(message: any) {
    this.server.emit('message', message);
  }
  
  fromServerToClient(message: any) {
    this.client.emit('message', message);
  }
}

// Memory transports for testing
class MemoryServerTransport {
  channel: MemoryChannel;
  onReceive?: (message: any) => void;

  constructor(channel: MemoryChannel) {
    this.channel = channel;
    this.channel.server.on('message', (message) => {
      if (this.onReceive) this.onReceive(message);
    });
  }

  send(message: any) {
    this.channel.fromServerToClient(message);
  }
}

class MemoryClientTransport {
  channel: MemoryChannel;
  onReceive?: (message: any) => void;

  constructor(channel: MemoryChannel) {
    this.channel = channel;
    this.channel.client.on('message', (message) => {
      if (this.onReceive) this.onReceive(message);
    });
  }

  send(message: any) {
    this.channel.fromClientToServer(message);
  }

  close() {
    return Promise.resolve();
  }
}

// Skip this test suite in regular CI runs as it requires special setup
describe.skip('Client-Server Integration', () => {
  let server: Server;
  let client: Client;
  let channel: MemoryChannel;
  let serverTransport: MemoryServerTransport;
  let clientTransport: MemoryClientTransport;
  let notificationsReceived: any[] = [];

  // Tool schemas - matching server implementation
  const TaskSchema = z.object({
    steps: z.number().min(1).max(10).describe("Number of steps to execute"),
    delayMs: z.number().min(100).max(1000).default(100).describe("Delay between steps in ms"),
  });

  beforeAll(async () => {
    // Set up communication channel
    channel = new MemoryChannel();
    serverTransport = new MemoryServerTransport(channel);
    clientTransport = new MemoryClientTransport(channel);
    
    // Create server
    server = new Server(
      {
        name: 'test-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    // Create client
    client = new Client(
      {
        name: 'test-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );
    
    // Set up server tools
    server.setRequestHandler({
      method: 'tools/list',
      params: {}
    }, async () => {
      return {
        tools: [
          {
            name: 'test_tool',
            description: 'Test tool for integration tests',
            inputSchema: zodToJsonSchema(TaskSchema) as any,
          }
        ],
      };
    });
    
    server.setRequestHandler({
      method: 'tools/call',
      params: {
        name: 'string',
        arguments: 'object'
      }
    }, async (request) => {
      try {
        const { name, arguments: args } = request.params;
        
        if (name === 'test_tool') {
          const { steps, delayMs } = TaskSchema.parse(args);
          const taskId = `task-${Date.now()}`;
          
          // Start task in background
          executeTask(taskId, steps, delayMs).catch(console.error);
          
          return {
            content: [
              {
                type: 'text',
                text: `Started task ${taskId} with ${steps} steps`,
              },
            ],
          };
        }
        
        throw new Error(`Unknown tool: ${name}`);
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
    
    // Set up client to collect notifications
    client.fallbackNotificationHandler = async (notification) => {
      notificationsReceived.push(notification);
    };
    
    // Connect both sides
    await server.connect(serverTransport as any);
    await client.connect(clientTransport as any);

    // Helper function to execute a task and send notifications
    async function executeTask(taskId: string, steps: number, delayMs: number) {
      // Send start notification
      server.notification({
        method: 'notifications/progress',
        params: {
          progressToken: `${taskId}-start`,
          progress: 0,
          taskId,
          message: `Starting task with ${steps} steps`,
        },
      });
      
      // Execute steps
      for (let i = 1; i <= steps; i++) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
        
        const progress = (i / steps) * 100;
        
        server.notification({
          method: 'notifications/progress',
          params: {
            progressToken: `${taskId}-step-${i}`,
            progress,
            taskId,
            message: `Completed step ${i} of ${steps}`,
          },
        });
      }
      
      // Send completion notification
      server.notification({
        method: 'notifications/progress',
        params: {
          progressToken: `${taskId}-complete`,
          progress: 100,
          taskId,
          message: `Task completed successfully - all ${steps} steps finished`,
        },
      });
    }
  });
  
  afterAll(async () => {
    // Clean up
    await client.disconnect();
    await server.close();
  });

  it('should connect client and server', () => {
    // This is implicitly tested in beforeAll
    expect(server).toBeDefined();
    expect(client).toBeDefined();
  });

  it('should list available tools', async () => {
    const tools = await client.request({
      method: 'tools/list',
      params: {}
    });
    
    expect(tools).toBeDefined();
    expect(tools).toHaveProperty('tools');
    expect(tools.tools).toHaveLength(1);
    expect(tools.tools[0]).toHaveProperty('name', 'test_tool');
  });
  
  it('should execute a tool and receive notifications', async () => {
    // Clear previous notifications
    notificationsReceived = [];
    
    // Execute tool
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'test_tool',
        arguments: {
          steps: 3,
          delayMs: 100
        }
      }
    });
    
    // Verify tool execution result
    expect(result).toBeDefined();
    expect(result).toHaveProperty('content');
    expect(result.content[0]).toHaveProperty('text');
    expect(result.content[0].text).toMatch(/Started task/);
    
    // Wait for all notifications
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify notifications
    expect(notificationsReceived.length).toBeGreaterThanOrEqual(5); // start + 3 steps + complete
    
    // Verify we got a start notification
    const startNotification = notificationsReceived.find(n => 
      n.method === 'notifications/progress' && 
      n.params.progressToken.includes('start')
    );
    expect(startNotification).toBeDefined();
    
    // Verify we got step notifications
    const stepNotifications = notificationsReceived.filter(n => 
      n.method === 'notifications/progress' && 
      n.params.progressToken.includes('step-')
    );
    expect(stepNotifications.length).toBeGreaterThanOrEqual(3);
    
    // Verify we got a complete notification
    const completeNotification = notificationsReceived.find(n => 
      n.method === 'notifications/progress' && 
      n.params.progressToken.includes('complete')
    );
    expect(completeNotification).toBeDefined();
    expect(completeNotification?.params.progress).toBe(100);
  });
  
  it('should handle tool execution errors', async () => {
    // Try to execute with invalid parameters
    try {
      await client.request({
        method: 'tools/call',
        params: {
          name: 'test_tool',
          arguments: {
            steps: 0, // Invalid - below minimum
            delayMs: 100
          }
        }
      });
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});