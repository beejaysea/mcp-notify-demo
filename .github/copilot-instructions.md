# GitHub Copilot Instructions

## Core Development Guid### Dependencies and Package Management
- Research all dependencies thoroughly before adding to package.json
- Prefer well-maintained libraries with good TypeScript support
- Use exact versions for critical dependencies
- Regularly audit dependencies for security vulnerabilities
- Document why each dependency is needed
- Ensure compatibility with the @modelcontextprotocol/sdk package
- Consider the impact on bundle size and performance

### 1. Library Research and Documentation
- **ALWAYS** thoroughly research library documentation before implementing any third-party dependencies
- Before suggesting or using any external library:
  - Verify compatibility with the MCP (Model Context Protocol) server
  - Review the library's documentation, especially TypeScript support
  - Understand the library's API, best practices, and usage patterns
- Never assume library APIs or functionality - always verify through documentation
- When suggesting alternatives, research each option thoroughly
- Pay special attention to @modelcontextprotocol/sdk documentation and patterns

### 2. TypeScript First Approach
- **ALWAYS** use TypeScript for all code implementations
- Maintain strict type safety with proper type annotations
- Use `strict: true` in TypeScript configuration
- Prefer interfaces and types for better code documentation
- Implement proper generic types where applicable
- Use utility types (Partial, Pick, Omit, etc.) when appropriate
- Always define return types for functions and methods

### 3. Test-Driven Development
- **ALWAYS** write comprehensive tests for any new functionality
- Follow the testing pyramid: unit tests > integration tests > e2e tests
- Use appropriate testing frameworks based on the project type:
  - For Node.js/TypeScript: Jest, Vitest, or similar
  - For web applications: Testing Library, Cypress, Playwright
- Test coverage should include:
  - Happy path scenarios
  - Error conditions and edge cases
  - Boundary value testing
  - Mock external dependencies appropriately
- Write tests BEFORE or alongside implementation, not as an afterthought

### 4. Code Quality Standards
- Follow consistent code formatting and linting rules
- Use meaningful variable and function names
- Implement proper error handling with typed exceptions
- Add JSDoc comments for public APIs
- Use async/await over Promises for better readability
- Implement proper logging for debugging and monitoring

### 5. MCP Server Integration Guidelines
- When working with MCP (Model Context Protocol) servers:
  - Always validate server responses and tool parameters with Zod schemas
  - Use zodToJsonSchema for consistent schema generation
  - Follow official MCP notification patterns for progress updates
  - Implement proper error handling for MCP communications
  - Use TypeScript interfaces to define MCP message types
  - Test MCP integrations with mock servers when possible
  - Follow MCP specification standards and official implementation patterns
  - Use proper task management for long-running operations

### 6. Dependencies and Package Management
- Research all dependencies using context7 before adding to package.json
- Prefer well-maintained libraries with good TypeScript support
- Use exact versions for critical dependencies
- Regularly audit dependencies for security vulnerabilities
- Document why each dependency is needed

### 7. Project Structure and Documentation
- **Code Organization**: Clear separation of concerns with TypeScript-first approach
  - `src/` contains only TypeScript source files
  - `dist/` contains compiled JavaScript (auto-generated, not committed)
  - `docs/` contains all project documentation
- **Documentation Standards**:
  - All documentation lives in the `docs/` directory
  - Root `README.md` provides quick start and overview
  - `docs/README.md` serves as documentation index
  - Update relevant docs when making significant changes
- **Build Process**:
  - Use `npm run dev:server` for development (no compilation)
  - Use `npm run build` for production builds
  - Never commit compiled `.js` files from `src/`
  - Reference `docs/BUILD_PROCESS.md` for detailed guidelines
- **File Organization**:
  - Use barrel exports (index.ts files) for clean imports
  - Separate types into dedicated type definition files when complex
  - Keep configuration files organized and well-documented
  - Use consistent naming conventions across the project

## Implementation Workflow

1. **Research Phase**: Thoroughly research library documentation before implementing any third-party dependencies
2. **Documentation Review**: Check `docs/` directory for existing patterns and guidelines:
   - `docs/MCP_NOTIFICATION_PATTERNS.md` - For notification patterns
   - `docs/MCP_TOOL_IMPLEMENTATIONS.md` - For tool implementation patterns
   - `docs/BUILD_PROCESS.md` - For build process guidelines
3. **Type Definition**: Define TypeScript interfaces and types first
4. **Test Planning**: Write test cases and scenarios
5. **Implementation**: Code with type safety and error handling
6. **Testing**: Implement and run comprehensive tests
7. **Documentation Update**: Update relevant docs in `docs/` directory when making significant changes

## Project-Specific Guidelines

### Build and Development
- **Development**: Always use `npm run dev:server` for fast iteration
- **Production**: Use `npm run build && npm run server` for compiled execution
- **Clean Builds**: Use `npm run clean` to remove all artifacts when in doubt
- **Type Checking**: Use `npm run typecheck` for validation without compilation

### Documentation Maintenance
- **Location**: All documentation lives in `docs/` directory
- **Structure**: Organized by purpose (technical, user guides, planning)
- **Cross-References**: Link between related documentation files
- **Updates**: Keep documentation current with code changes
- **Quick Reference**: Use root `README.md` for essential information only

## Example Patterns

### MCP Tool Implementation Pattern
```typescript
// Define tool schema with Zod for validation
const MyToolSchema = z.object({
  param1: z.string().describe("Description for param1"),
  param2: z.number().min(1).max(100).default(10).describe("Description for param2"),
  param3: z.boolean().default(true).describe("Description for param3"),
});

// Register tool with proper error handling
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;
    
    if (name === "my_tool") {
      const config = MyToolSchema.parse(args);
      // Tool implementation
      return {
        content: [
          { type: "text", text: "Tool executed successfully" }
        ]
      };
    }
  } catch (error) {
    return {
      content: [
        { type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }
      ],
      isError: true
    };
  }
});
```

### TypeScript Implementation Pattern
```typescript
interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
}

async function fetchData<T>(url: string): Promise<ApiResponse<T>> {
  // Implementation with proper error handling
}
```

### Test Implementation Pattern
```typescript
describe('FeatureName', () => {
  beforeEach(() => {
    // Setup
  });

  it('should handle success case', async () => {
    // Test implementation
  });

  it('should handle error cases', async () => {
    // Error testing
  });
});
```

### Documentation Pattern
```typescript
// When creating or updating documentation:
// 1. Place in appropriate docs/ subdirectory
// 2. Update docs/README.md index if adding new files
// 3. Cross-reference related documentation
// 4. Keep root README.md focused on quick start only
```

### MCP Notification Pattern
```typescript
// Send a progress notification following MCP patterns
server.notification({
  method: "notifications/progress",
  params: {
    progressToken: `task-${taskId}-step-${step}`, // Required for MCP schema compliance
    progress: (step / totalSteps) * 100, // Required for MCP schema compliance
    taskId,
    type: "progress",
    data: {
      message: `Completed step ${step} of ${totalSteps}`,
      step,
      totalSteps,
      taskId,
    },
    level: "info",
    timestamp: new Date().toISOString(),
  },
});
```

## Remember
- Always follow official MCP SDK patterns and documentation
- TypeScript strict mode is non-negotiable
- Tests are not optional - they are part of the definition of done
- Quality over speed - take time to research and implement properly
- All documentation goes in `docs/` directory - keep root directory clean
- Use development scripts (`npm run dev:server`) for fast iteration
- Follow the build process documented in `docs/BUILD_PROCESS.md`
