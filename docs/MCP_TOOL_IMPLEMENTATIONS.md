# MCP Tool Implementation Patterns

This document outlines the tool implementation patterns used in the MCP Notify Server.

## Tool Registration

The MCP Notify Server follows the official pattern for registering tools with the server:

```typescript
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
```

## Parameter Validation

Tool parameters are defined and validated using Zod schemas:

```typescript
const LongRunningTaskSchema = z.object({
  steps: z.number().min(1).max(1000).describe("Number of steps to execute"),
  notificationInterval: z.number().min(1).default(1).describe("Send notification every N steps"),
  delayMs: z.number().min(100).max(10000).default(1000).describe("Delay between steps in milliseconds"),
  enableSampling: z.boolean().default(true).describe("Enable sampling requests to client"),
});
```

Benefits of this approach:
1. Runtime type validation
2. Automatic schema generation
3. Default values
4. Descriptive error messages
5. Parameter descriptions

## Tool Execution

Tool execution follows the official MCP pattern:

```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    if (!args) {
      throw new Error(`No arguments provided for tool: ${name}`);
    }

    switch (name) {
      case "start_long_running_task": {
        const config = LongRunningTaskSchema.parse(args);
        // Tool implementation
        return {
          content: [
            {
              type: "text",
              text: `Started task with ${config.steps} steps`,
            },
          ],
        };
      }
      
      // Other tools...
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});
```

## Error Handling

Consistent error handling pattern:

```typescript
try {
  // Tool implementation
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
```

## Long-Running Task Management

Task information is tracked using a consistent pattern:

```typescript
interface TaskInfo {
  cancel: () => void;
  currentStep: number;
  totalSteps: number;
  cancelled: boolean;
}

const runningTasks = new Map<string, TaskInfo>();

// When starting a task
const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const taskInfo = await startLongRunningTask(taskId, config);
runningTasks.set(taskId, taskInfo);

// When cancelling a task
const task = runningTasks.get(taskId);
if (task) {
  task.cancel();
  task.cancelled = true;
  runningTasks.delete(taskId);
}
```

## Response Formatting

All tool responses follow the standardized format:

```typescript
return {
  content: [
    {
      type: "text",
      text: "Response message here",
    },
  ],
  // Optional error flag
  isError: false,
};
```

## Best Practices

1. **Schema Validation**
   - Use Zod for parameter validation
   - Generate JSON schemas with zodToJsonSchema
   - Include parameter descriptions
   - Set sensible min/max values and defaults

2. **Error Handling**
   - Catch and properly format all errors
   - Provide descriptive error messages
   - Include the isError flag for error responses

3. **Task Management**
   - Generate unique task IDs
   - Track task state with TaskInfo interface
   - Provide cancellation capability
   - Clean up tasks when completed or cancelled

4. **Response Format**
   - Use consistent content array format
   - Include appropriate text responses
   - Consider using other content types when appropriate

5. **Async Operations**
   - Use async/await for all asynchronous operations
   - Handle Promise rejections
   - Avoid blocking the main thread

6. **Graceful Shutdown**
   - Properly clean up running tasks on process exit
   - Cancel any pending operations
   - Close resources cleanly
