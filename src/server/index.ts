#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod";

// Tool schemas - following official patterns
const LongRunningTaskSchema = z.object({
  steps: z.number().min(1).max(1000).describe("Number of steps to execute"),
  notificationInterval: z.number().min(1).default(1).describe("Send notification every N steps"),
  delayMs: z.number().min(100).max(10000).default(1000).describe("Delay between steps in milliseconds"),
  enableSampling: z.boolean().default(true).describe("Enable sampling requests to client"),
});

const CancelTaskSchema = z.object({
  taskId: z.string().describe("ID of the task to cancel"),
});

// Task management
interface TaskInfo {
  cancel: () => void;
  currentStep: number;
  totalSteps: number;
  cancelled: boolean;
}

const runningTasks = new Map<string, TaskInfo>();

// Server setup - following official pattern
const server = new Server(
  {
    name: "mcp-notify-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool registration - following official pattern
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "start_long_running_task",
        description: "Starts a long-running task that sends progress notifications and requests user feedback",
        inputSchema: zodToJsonSchema(LongRunningTaskSchema) as any,
      },
      {
        name: "cancel_task",
        description: "Cancels a running task",
        inputSchema: zodToJsonSchema(CancelTaskSchema) as any,
      },
    ],
  };
});

// Tool execution handler - following official error handling patterns
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    if (!args) {
      throw new Error(`No arguments provided for tool: ${name}`);
    }

    switch (name) {
      case "start_long_running_task": {
        const config = LongRunningTaskSchema.parse(args);
        const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Start the long-running task
        const taskInfo = await startLongRunningTask(taskId, config);
        runningTasks.set(taskId, taskInfo);

        return {
          content: [
            {
              type: "text",
              text: `Started long-running task ${taskId} with ${config.steps} steps`,
            },
          ],
        };
      }

      case "cancel_task": {
        const { taskId } = CancelTaskSchema.parse(args);
        const task = runningTasks.get(taskId);
        
        if (task) {
          task.cancel();
          task.cancelled = true;
          runningTasks.delete(taskId);
          
          return {
            content: [
              {
                type: "text",
                text: `Cancelled task ${taskId}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: `Task ${taskId} not found`,
              },
            ],
            isError: true,
          };
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    // Official error handling pattern
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
  }
});

// Long-running task implementation - improved error handling and cleanup
async function startLongRunningTask(taskId: string, config: z.infer<typeof LongRunningTaskSchema>): Promise<TaskInfo> {
  let cancelled = false;
  let currentStep = 0;

  const taskInfo: TaskInfo = {
    cancel: () => {
      cancelled = true;
    },
    currentStep: 0,
    totalSteps: config.steps,
    cancelled: false,
  };

  const runTask = async () => {
    try {
      // Send start notification with proper MCP schema format
      server.notification({
        method: "notifications/progress",
        params: {
          progressToken: `task-${taskId}-start`, // Required for MCP schema compliance
          progress: 0, // Required for MCP schema compliance
          taskId,
          type: "start",
          data: {
            message: `Starting task with ${config.steps} steps`,
            step: 0,
            totalSteps: config.steps,
            taskId,
          },
          level: "info",
          timestamp: new Date().toISOString(),
        },
      });

      for (let i = 1; i <= config.steps && !cancelled; i++) {
        currentStep = i;
        taskInfo.currentStep = i;
        
        // Wait for step delay
        await new Promise(resolve => setTimeout(resolve, config.delayMs));
        
        if (cancelled) break;

        const progress = (i / config.steps) * 100;
        
        // Send progress notification using proper MCP pattern
        // Use the built-in notification method with proper schema
        try {
          server.notification({
            method: "notifications/progress",
            params: {
              progressToken: `task-${taskId}-step-${i}`, // Required for MCP schema compliance
              taskId,
              type: "progress", 
              data: {
                message: `Completed step ${i} of ${config.steps}`,
                step: i,
                totalSteps: config.steps,
                taskId,
              },
              level: "info",
              timestamp: new Date().toISOString(),
            },
          });
        } catch (error) {
          console.error(`Failed to send progress notification:`, error);
        }

        // Request sampling/feedback at intervals
        if (config.enableSampling && i % config.notificationInterval === 0) {
          try {
            // Send a sampling request to the client using the built-in createMessage method
            // This method properly formats the JSON-RPC request
            const samplingResponse = await server.createMessage({
              messages: [
                {
                  role: "user" as const,
                  content: {
                    type: "text" as const,
                    text: `Please provide feedback on progress so far. We are at step ${i} of ${config.steps} (${progress.toFixed(1)}% complete). How should we proceed?`,
                  },
                },
              ],
              systemPrompt: "You are a helpful assistant monitoring a long-running task. Provide brief, encouraging feedback.",
              maxTokens: 100,
              temperature: 0.7,
            });
            
            // Extract response content properly
            let responseText = 'No response';
            if (samplingResponse && samplingResponse.content) {
              if (samplingResponse.content.type === 'text') {
                responseText = samplingResponse.content.text;
              }
            }
            
            // Send a notification with the sampling response
            server.notification({
              method: "notifications/sampling_response",
              params: {
                progressToken: `task-${taskId}-sampling-${i}`, // Required for MCP schema compliance
                taskId,
                type: "sampling_response",
                data: {
                  message: `Sampling response received: ${responseText}`,
                  step: i,
                  totalSteps: config.steps,
                  taskId,
                },
                level: "info",
                timestamp: new Date().toISOString(),
              },
            });
          } catch (error) {
            // If sampling fails (e.g., client doesn't support it), send a notification about it
            server.notification({
              method: "notifications/sampling_error",
              params: {
                progressToken: `task-${taskId}-error-${i}`, // Required for MCP schema compliance
                taskId,
                type: "sampling_error",
                data: {
                  message: `Sampling request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                  step: i,
                  totalSteps: config.steps,
                  taskId,
                },
                level: "error",
                timestamp: new Date().toISOString(),
              },
            });
          }
        }
      }

      if (!cancelled) {
        // Send completion notification with proper MCP schema format
        server.notification({
          method: "notifications/progress",
          params: {
            progressToken: `task-${taskId}-complete`, // Required for MCP schema compliance
            progress: 100, // Required for MCP schema compliance
            taskId,
            type: "completion",
            data: {
              message: `Task completed successfully - all ${config.steps} steps finished`,
              step: config.steps,
              totalSteps: config.steps,
              taskId,
            },
            level: "info",
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        // Send cancellation notification with proper MCP schema format
        server.notification({
          method: "notifications/progress",
          params: {
            progressToken: `task-${taskId}-cancelled`, // Required for MCP schema compliance
            progress: (currentStep / config.steps) * 100, // Required for MCP schema compliance
            taskId,
            type: "cancelled",
            data: {
              message: `Task was cancelled at step ${currentStep}`,
              step: currentStep,
              totalSteps: config.steps,
              taskId,
            },
            level: "warning",
            timestamp: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      // Send error notification with proper MCP schema format
      server.notification({
        method: "notifications/progress",
        params: {
          progressToken: `task-${taskId}-error`, // Required for MCP schema compliance
          progress: (currentStep / config.steps) * 100, // Required for MCP schema compliance
          taskId,
          type: "error",
          data: {
            message: `Task failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            step: currentStep,
            totalSteps: config.steps,
            taskId,
          },
          level: "error",
          timestamp: new Date().toISOString(),
        },
      });
    } finally {
      // Cleanup - following official patterns
      runningTasks.delete(taskId);
    }
  };

  // Start the task asynchronously
  runTask();

  return taskInfo;
}

// Server startup - following official pattern
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP notification server running on stdio");
}

// Cleanup on exit - following official patterns
const cleanup = async () => {
  console.error("Cleaning up running tasks...");
  for (const [, task] of runningTasks.entries()) {
    task.cancel();
    task.cancelled = true;
  }
  runningTasks.clear();
};

process.on("SIGINT", async () => {
  await cleanup();
  await server.close();
  process.exit(0);
});

// Main execution - following official pattern
runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
