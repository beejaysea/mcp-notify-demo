# GitHub Copilot Instructions

## Core Development Guidelines

### 1. Library Research and Documentation
- **ALWAYS** use the context7 MCP server to look up library documentation before implementing any third-party dependencies
- Before suggesting or using any external library, use the MCP tools to:
  - Resolve the library ID with `bb7_resolve-library-id`
  - Fetch comprehensive documentation with `bb7_get-library-docs`
  - Understand the library's API, best practices, and usage patterns
- Never assume library APIs or functionality - always verify through context7
- When suggesting alternatives, research each option thoroughly using context7

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
  - Always validate server responses
  - Implement proper error handling for MCP communications
  - Use TypeScript interfaces to define MCP message types
  - Test MCP integrations with mock servers when possible
  - Follow MCP specification standards

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

1. **Research Phase**: Use context7 to understand any libraries or frameworks needed
2. **Documentation Review**: Check `docs/` directory for existing patterns and guidelines
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

### Library Research Pattern
```typescript
// Before using any library, research it thoroughly:
// 1. bb7_resolve-library-id with library name
// 2. bb7_get-library-docs with resolved ID
// 3. Understand API and implement with proper types
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

## Remember
- Context7 MCP server is your primary source for library information
- TypeScript strict mode is non-negotiable
- Tests are not optional - they are part of the definition of done
- Quality over speed - take time to research and implement properly
- All documentation goes in `docs/` directory - keep root directory clean
- Use development scripts (`npm run dev:server`) for fast iteration
- Follow the build process documented in `docs/BUILD_PROCESS.md`
