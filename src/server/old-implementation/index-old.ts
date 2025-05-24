#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { LongRunningToolParamsSchema } from '../shared/types.js';

console.error('Starting MCP notification server...');

const server = new Server(
  {
    name: 'mcp-notify-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Track running tasks
const runningTasks = new Map<string, { cancel: () => void }>();

// Long-running task tool
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'start_long_running_task',
        description: 'Starts a long-running task that sends progress notifications and requests user feedback',
        inputSchema: zodToJsonSchema(LongRunningToolParamsSchema) as any,
      },
      {
        name: 'cancel_task',
        description: 'Cancels a running task',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: { type: 'string', description: 'ID of the task to cancel' }
          },
          required: ['taskId']
        }
      }
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'start_long_running_task') {
    const config = LongRunningToolParamsSchema.parse(args);
    const taskId = `task-${Date.now()}`;
    
    // Start the long-running task
    const { cancel } = startLongRunningTask(taskId, config);
    runningTasks.set(taskId, { cancel });

    return {
      content: [
        {
          type: 'text',
          text: `Started long-running task ${taskId} with ${config.steps} steps`,
        },
      ],
    };
  }

  if (name === 'cancel_task') {
    const { taskId } = args as { taskId: string };
    const task = runningTasks.get(taskId);
    
    if (task) {
      task.cancel();
      runningTasks.delete(taskId);
      return {
        content: [
          {
            type: 'text',
            text: `Cancelled task ${taskId}`,
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: `Task ${taskId} not found`,
          },
        ],
        isError: true,
      };
    }
  }

  return {
    content: [
      {
        type: 'text',
        text: `Unknown tool: ${name}`,
      },
    ],
    isError: true,
  };
});

function startLongRunningTask(taskId: string, config: any) {
  let cancelled = false;
  let currentStep = 0;

  const cancel = () => {
    cancelled = true;
  };

  const runTask = async () => {
    try {
      // Send start notification
      server.notification({
        method: 'notifications/progress',
        params: {
          taskId,
          type: 'start',
          message: `Starting task with ${config.steps} steps`,
          progress: 0,
          timestamp: new Date().toISOString(),
        },
      });

      for (let i = 1; i <= config.steps && !cancelled; i++) {
        currentStep = i;
        
        // Wait for step delay
        await new Promise(resolve => setTimeout(resolve, config.delayMs));
        
        if (cancelled) break;

        const progress = (i / config.steps) * 100;
        
        // Send progress notification
        server.notification({
          method: 'notifications/progress',
          params: {
            taskId,
            type: 'progress',
            message: `Completed step ${i} of ${config.steps}`,
            progress,
            step: i,
            timestamp: new Date().toISOString(),
          },
        });

        // Request sampling/feedback at intervals
        if (config.enableSampling && i % config.notificationInterval === 0) {
          server.notification({
            method: 'notifications/sampling',
            params: {
              taskId,
              type: 'sampling_request',
              message: `Please provide feedback on progress so far (step ${i}/${config.steps})`,
              data: {
                currentStep: i,
                totalSteps: config.steps,
                progress,
              },
              timestamp: new Date().toISOString(),
            },
          });
        }
      }

      if (!cancelled) {
        // Send completion notification
        server.notification({
          method: 'notifications/progress',
          params: {
            taskId,
            type: 'completion',
            message: `Task completed successfully - all ${config.steps} steps finished`,
            progress: 100,
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        // Send cancellation notification
        server.notification({
          method: 'notifications/progress',
          params: {
            taskId,
            type: 'cancelled',
            message: `Task was cancelled at step ${currentStep}`,
            progress: (currentStep / config.steps) * 100,
            timestamp: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      // Send error notification
      server.notification({
        method: 'notifications/progress',
        params: {
          taskId,
          type: 'error',
          message: `Task failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          progress: (currentStep / config.steps) * 100,
          timestamp: new Date().toISOString(),
        },
      });
    } finally {
      runningTasks.delete(taskId);
    }
  };

  // Start the task asynchronously
  runTask();

  return { cancel };
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP notification server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error running server:', error);
  process.exit(1);
});
