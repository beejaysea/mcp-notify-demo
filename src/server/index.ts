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
      logging: {},
    },
  }
);

// Tool registration - following official pattern
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "long-running-task",
        description: "Execute a long-running task with progress notifications",
        inputSchema: zodToJsonSchema(LongRunningTaskSchema),
      },
      {
        name: "cancel-task",
        description: "Cancel a running task",
        inputSchema: zodToJsonSchema(CancelTaskSchema),
      },
    ],
  };
});

// Tool execution handler - following official pattern
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "long-running-task": {
        const validatedArgs = LongRunningTaskSchema.parse(args);
        return await handleLongRunningTask(validatedArgs);
      }

      case "cancel-task": {
        const validatedArgs = CancelTaskSchema.parse(args);
        return await handleCancelTask(validatedArgs);
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    // Following official error handling pattern
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
      isError: true,
    };
  }
});

// Long running task handler - consolidated from original separate files
async function handleLongRunningTask(args: z.infer<typeof LongRunningTaskSchema>) {
  const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  let cancelled = false;
  let currentStep = 0;

  const taskInfo: TaskInfo = {
    cancel: () => {
      cancelled = true;
      taskInfo.cancelled = true;
    },
    currentStep: 0,
    totalSteps: args.steps,
    cancelled: false,
  };

  runningTasks.set(taskId, taskInfo);

  // Start the long-running process
  const processTask = async () => {
    try {
      for (let step = 1; step <= args.steps && !cancelled; step++) {
        // Update task info
        currentStep = step;
        taskInfo.currentStep = step;

        // Send progress notification if at interval
        if (step % args.notificationInterval === 0) {
          await server.notification({
            method: "notifications/progress",
            params: {
              progress: step / args.steps,
              taskId,
              message: `Step ${step}/${args.steps} completed`,
            },
          });
        }

        // Send sampling request if enabled (commenting out for now to avoid schema issues)
        /*
        if (args.enableSampling && step % Math.max(1, Math.floor(args.steps / 10)) === 0) {
          try {
            await server.request(
              {
                method: "sampling/createMessage",
                params: {
                  messages: [
                    {
                      role: "user",
                      content: {
                        type: "text",
                        text: `Task ${taskId} is at step ${step}/${args.steps}. Should I continue?`,
                      },
                    },
                  ],
                  systemPrompt: "You are monitoring a long-running task. Respond briefly about whether to continue.",
                  maxTokens: 100,
                },
              },
              {} // Schema placeholder
            );
          } catch (samplingError) {
            console.error("Sampling request failed:", samplingError);
          }
        }
        */

        // Delay between steps
        await new Promise((resolve) => setTimeout(resolve, args.delayMs));
      }

      // Task completed
      runningTasks.delete(taskId);

      if (cancelled) {
        await server.notification({
          method: "notifications/cancelled",
          params: {
            taskId,
            message: `Task ${taskId} was cancelled at step ${currentStep}`,
          },
        });
      } else {
        await server.notification({
          method: "notifications/message",
          params: {
            level: "info",
            logger: "mcp-notify-server",
            data: {
              taskId,
              message: `Task ${taskId} completed successfully`,
              totalSteps: args.steps,
            },
          },
        });
      }
    } catch (error) {
      runningTasks.delete(taskId);
      await server.notification({
        method: "notifications/message",
        params: {
          level: "error",
          logger: "mcp-notify-server",
          data: {
            taskId,
            error: error instanceof Error ? error.message : "Unknown error",
          },
        },
      });
    }
  };

  // Start task asynchronously
  processTask();

  return {
    content: [
      {
        type: "text",
        text: `Started long-running task with ID: ${taskId}`,
      },
    ],
  };
}

// Cancel task handler
async function handleCancelTask(args: z.infer<typeof CancelTaskSchema>) {
  const task = runningTasks.get(args.taskId);

  if (!task) {
    return {
      content: [
        {
          type: "text",
          text: `Task ${args.taskId} not found or already completed`,
        },
      ],
      isError: true,
    };
  }

  task.cancel();
  runningTasks.delete(args.taskId);

  return {
    content: [
      {
        type: "text",
        text: `Task ${args.taskId} cancelled successfully`,
      },
    ],
  };
}

// Server startup - following official pattern
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Notify Server running on stdio");
}

// Graceful shutdown - following official pattern
process.on("SIGINT", async () => {
  console.error("Shutting down server...");
  
  // Cancel all running tasks
  for (const [, task] of runningTasks) {
    task.cancel();
  }
  runningTasks.clear();
  
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.error("Received SIGTERM, shutting down server...");
  
  // Cancel all running tasks
  for (const [, task] of runningTasks) {
    task.cancel();
  }
  runningTasks.clear();
  
  process.exit(0);
});

// Start server
runServer().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
