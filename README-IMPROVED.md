# MCP Notify Server - Improved Implementation

A Model Context Protocol (MCP) server implementation featuring long-running tasks with progress notifications, following official MCP patterns and best practices.

## 🚀 Improvements Made

This implementation has been **completely refactored** to align with official MCP server patterns from the [ModelContextProtocol/servers](https://github.com/modelcontextprotocol/servers) repository.

### ✅ Key Improvements

- **Official Pattern Compliance**: Server structure follows official MCP examples
- **Consolidated Architecture**: Single, maintainable server implementation  
- **Automated Schema Generation**: Using `zodToJsonSchema` instead of manual schemas
- **Enhanced Type Safety**: Full TypeScript integration with strict typing
- **Proper Error Handling**: Consistent error responses following MCP standards
- **Graceful Shutdown**: Proper cleanup of running tasks on termination
- **Comprehensive Testing**: Full test suite covering all functionality

## 📋 Available Tools

### `long-running-task`
Execute a long-running task with configurable progress notifications.

**Parameters:**
- `steps` (number, 1-1000): Number of steps to execute
- `notificationInterval` (number, default: 1): Send notification every N steps  
- `delayMs` (number, 100-10000, default: 1000): Delay between steps in milliseconds
- `enableSampling` (boolean, default: true): Enable sampling requests to client

### `cancel-task`
Cancel a running task by its ID.

**Parameters:**
- `taskId` (string): ID of the task to cancel

## 🛠️ Installation

```bash
npm install
```

## 🚀 Quick Start

### Start the Server
```bash
npm run server
```

### Run Tests
```bash
npm test
```

### Run Demonstration
```bash
npm run demo
```

## 📡 Usage Examples

### Using JSON-RPC directly

**List available tools:**
```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | npm run server
```

**Start a task:**
```bash
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "long-running-task", "arguments": {"steps": 3, "delayMs": 1000, "notificationInterval": 1}}}' | npm run server
```

### Expected Response Format

**Tool List Response:**
```json
{
  "result": {
    "tools": [
      {
        "name": "long-running-task",
        "description": "Execute a long-running task with progress notifications",
        "inputSchema": { ... }
      },
      {
        "name": "cancel-task", 
        "description": "Cancel a running task",
        "inputSchema": { ... }
      }
    ]
  }
}
```

**Task Execution Response:**
```json
{
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Started long-running task with ID: task-1748119906113-tzp0r2nqh"
      }
    ]
  }
}
```

**Progress Notifications:**
```json
{
  "method": "notifications/progress",
  "params": {
    "progress": 0.5,
    "taskId": "task-1748119906113-tzp0r2nqh", 
    "message": "Step 1/2 completed"
  }
}
```

## 🏗️ Architecture

### Server Implementation (`src/server/index.ts`)
- Single consolidated implementation following official patterns
- Zod schema validation with automatic JSON schema generation
- Proper MCP request handler patterns
- Type-safe task management with `TaskInfo` interface
- Official notification patterns

### Key Features
- **Consolidated Logic**: All functionality in single maintainable file
- **Schema Automation**: `zodToJsonSchema` for consistent validation
- **Type Safety**: Full TypeScript with strict typing
- **Official Patterns**: Follows MCP SDK best practices
- **Graceful Shutdown**: Proper cleanup on SIGINT/SIGTERM

## 🧪 Testing

The project includes comprehensive tests covering:

- Official MCP pattern compliance
- Task management functionality  
- Notification structure verification
- Schema validation patterns
- Graceful shutdown behavior
- Error handling patterns

Run tests:
```bash
npm test
```

## 📁 Project Structure

```
src/
├── server/
│   ├── index.ts              # Main improved server implementation
│   └── old-implementation/   # Backup of previous implementations
├── __tests__/
│   └── server/
│       └── improved-server.test.ts  # Comprehensive test suite
├── client/                   # Client implementations (existing)
└── shared/                   # Shared types and constants
```

## 🔧 Configuration

Server capabilities are configured to support:
- **Tools**: Core MCP tool functionality
- **Logging**: Progress and status notifications

## 🎯 Compliance with Official Patterns

This implementation follows official MCP patterns:

✅ **Server Initialization**: Matches official server setup patterns  
✅ **Tool Registration**: Uses `zodToJsonSchema` like official examples  
✅ **Request Handling**: Official request handler patterns  
✅ **Error Handling**: Consistent with official error response format  
✅ **Cleanup**: Proper shutdown handling like official implementations  

## 🚧 Development

### Building
```bash
npm run build
```

### Linting
```bash
npm run lint
```

### Formatting
```bash
npm run format
```

## 📝 Changelog

### Latest Improvements
- ✅ Refactored to follow official MCP server patterns
- ✅ Consolidated architecture (removed duplicate implementations)  
- ✅ Automated schema generation with `zodToJsonSchema`
- ✅ Enhanced TypeScript type safety
- ✅ Improved error handling following MCP standards
- ✅ Added comprehensive test suite
- ✅ Implemented graceful shutdown with task cleanup

## 🤝 Contributing

When contributing to this project:

1. Follow the established MCP patterns
2. Use `zodToJsonSchema` for schema generation
3. Maintain TypeScript strict mode compliance
4. Add tests for new functionality
5. Follow the consolidated architecture approach

## 📄 License

ISC

---

*This implementation demonstrates best practices for MCP server development and serves as a reference for building notification-capable MCP servers.*
