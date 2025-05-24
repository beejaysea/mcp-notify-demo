# MCP Notify Server

A TypeScript-based Model Context Protocol (MCP) server that demonstrates long-running tasks with real-time progress notifications and user interaction capabilities. This implementation follows official MCP patterns and best practices.

## Quick Start

### Development
```bash
# Install dependencies
npm install

# Run server in development mode (fast, no compilation)
npm run dev:server

# Run client test in development mode (fast, no compilation)
npm run dev:client
```

### Production
```bash
# Build and run
npm run build
npm run server

# Or combined
npm start
```

## Features

- **Long-running task execution** with progress tracking
- **Real-time notifications** sent to MCP client
- **User sampling/feedback requests** during task execution
- **Task cancellation** support
- **TypeScript-first** with strict type safety
- **Comprehensive testing** with Jest
- **Official Pattern Compliance**: Server structure follows official MCP examples
- **Consolidated Architecture**: Single, maintainable server implementation  
- **Automated Schema Generation**: Using `zodToJsonSchema` instead of manual schemas
- **Enhanced Type Safety**: Full TypeScript integration with strict typing
- **Proper Error Handling**: Consistent error responses following MCP standards

## Project Structure

```
mcp-notify/
├── src/
│   ├── server/           # MCP server implementation
│   ├── client/           # Demo client implementations
│   ├── shared/           # Shared types and utilities
│   └── __tests__/        # Test suites
├── docs/                 # Comprehensive documentation
├── dist/                 # Compiled JavaScript (auto-generated)
└── package.json
```

## Available Tools

### `start_long_running_task`
Starts a configurable long-running process that:
- Executes a specified number of steps with customizable delays
- Sends progress notifications at regular intervals
- Requests user feedback/sampling during execution
- Supports cancellation

**Parameters:**
- `steps` (number, 1-1000): Number of steps to execute
- `notificationInterval` (number, default: 1): Send notification every N steps  
- `delayMs` (number, 100-10000, default: 1000): Delay between steps in milliseconds
- `enableSampling` (boolean, default: true): Enable sampling requests to client

### `cancel_task`
Cancels a running task by its ID.

**Parameters:**
- `taskId` (string): ID of the task to cancel

## Documentation

For detailed information, see the [`docs/`](./docs/) directory:

- **[BUILD_PROCESS.md](./docs/BUILD_PROCESS.md)** - Build system and development workflow
- **[MCP_SERVER_IMPROVEMENTS.md](./docs/MCP_SERVER_IMPROVEMENTS.md)** - Technical implementation details
- **[MCP_NOTIFICATION_PATTERNS.md](./docs/MCP_NOTIFICATION_PATTERNS.md)** - Notification system patterns
- **[MCP_TOOL_IMPLEMENTATIONS.md](./docs/MCP_TOOL_IMPLEMENTATIONS.md)** - Tool implementation patterns
- **[README-IMPROVED.md](./docs/README-IMPROVED.md)** - Enhanced feature documentation
- **[TASK_COMPLETION_SUMMARY.md](./docs/TASK_COMPLETION_SUMMARY.md)** - Development progress summary

## Requirements

- Node.js 18+ 
- TypeScript 5.0+
- MCP-compatible client (like Claude Desktop)

## Development

This project follows TypeScript best practices with strict type checking, comprehensive testing, and clean separation between source and compiled code.

See [BUILD_PROCESS.md](./docs/BUILD_PROCESS.md) for detailed development guidelines.

## License

ISC
