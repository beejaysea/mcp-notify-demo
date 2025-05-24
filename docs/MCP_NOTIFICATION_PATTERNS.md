# MCP Notification Patterns

This document outlines the notification patterns used in the MCP Notify Server implementation.

## Overview

The MCP Notify Server uses the official Model Context Protocol (MCP) notification patterns to:

1. Send progress updates for long-running tasks
2. Request user feedback during task execution
3. Notify about task completion or cancellation
4. Report errors or issues during execution

## Notification Types

### Progress Notifications

The server sends progress notifications at configured intervals using the official MCP pattern:

```typescript
server.notification({
  method: "notifications/progress",
  params: {
    progressToken: `task-${taskId}-step-${step}`, // Required for MCP schema compliance
    progress: (step / totalSteps) * 100,          // Required for MCP schema compliance
    taskId,
    type: "progress",
    data: {
      message: `Completed step ${step} of ${config.steps}`,
      step: i,
      totalSteps: config.steps,
      taskId,
    },
    level: "info",
    timestamp: new Date().toISOString(),
  },
});
```

### Client Sampling/Feedback

The server can request user feedback during task execution:

```typescript
const samplingResponse = await server.createMessage({
  messages: [
    {
      role: "user",
      content: {
        type: "text",
        text: `Please provide feedback on progress so far. We are at step ${i} of ${config.steps}.`,
      },
    },
  ],
  systemPrompt: "You are a helpful assistant monitoring a long-running task.",
  maxTokens: 100,
  temperature: 0.7,
});
```

### Completion Notifications

When a task completes successfully:

```typescript
server.notification({
  method: "notifications/progress",
  params: {
    progressToken: `task-${taskId}-complete`,
    progress: 100,
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
```

### Cancellation Notifications

When a task is cancelled:

```typescript
server.notification({
  method: "notifications/progress",
  params: {
    progressToken: `task-${taskId}-cancelled`,
    progress: (currentStep / config.steps) * 100,
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
```

### Error Notifications

When a task encounters an error:

```typescript
server.notification({
  method: "notifications/progress",
  params: {
    progressToken: `task-${taskId}-error`,
    progress: (currentStep / config.steps) * 100,
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
```

## Best Practices

1. **Always include required fields**:
   - `progressToken` - Unique identifier for the notification
   - `progress` - Numerical progress percentage (0-100)

2. **Include contextual data**:
   - Current step number
   - Total steps
   - Task ID for correlation
   - Human-readable message

3. **Use appropriate notification levels**:
   - "info" for general progress
   - "warning" for cancellations or potential issues
   - "error" for failures

4. **Add timestamps**:
   - Use ISO 8601 format (`new Date().toISOString()`)

5. **Handle errors gracefully**:
   - Catch errors during notification sending
   - Include error details in the notification when possible

## Notification Frequency

Balance between:

- **Too frequent**: Can overwhelm the client and create performance issues
- **Too infrequent**: Can leave the user wondering if the task is still running

Use the `notificationInterval` parameter to control frequency based on task duration.
