# Build Process Documentation

## Overview

This TypeScript MCP server project follows best practices for build management, keeping source and compiled code clearly separated.

## Project Structure

```
mcp-notify/
├── src/                    # TypeScript source code (version controlled)
│   ├── server/
│   │   └── index-improved.ts  # Main server implementation
│   ├── shared/
│   └── __tests__/
├── dist/                   # Compiled JavaScript output (ignored by git)
│   ├── server/
│   └── shared/
├── package.json
├── tsconfig.json
└── .gitignore
```

## Key Principles

1. **Source Separation**: Only TypeScript files (`.ts`) should exist in the `src/` directory
2. **Build Output**: All compiled JavaScript goes to `dist/` directory
3. **Git Ignore**: The `dist/` directory and any `.js` files in `src/` are ignored by git
4. **Clean Builds**: Each build starts with a clean slate

## Build Scripts

### Development Scripts
- `npm run dev:server` - Run server directly with ts-node (no compilation)
- `npm run build:watch` - Watch mode compilation for development

### Production Scripts
- `npm run build` - Clean build: removes old artifacts and compiles fresh
- `npm run server` - Build and run the compiled server
- `npm run start` - Alias for `npm run server`

### Utility Scripts
- `npm run clean` - Remove dist/ and any stray .js files from src/
- `npm run typecheck` - Type check without emitting files

## Build Configuration

### TypeScript Config (`tsconfig.json`)
- **Input**: `src/**/*` (TypeScript files only)
- **Output**: `dist/` directory
- **Excludes**: Client files (temporarily), old implementations, tests
- **Source Maps**: Enabled for debugging
- **Declaration Files**: Generated for library usage

### Git Ignore (`.gitignore`)
Key exclusions:
```gitignore
# Build output
dist/

# No .js files in source
src/**/*.js
src/**/*.js.map
src/**/*.d.ts

# TypeScript build artifacts
*.tsbuildinfo
```

## Development Workflow

1. **Clean Start**: `npm run clean` - Remove all compiled artifacts
2. **Development**: `npm run dev:server` - Run with ts-node for fast iteration
3. **Build Check**: `npm run build` - Ensure everything compiles correctly
4. **Production**: `npm run server` - Run the compiled version

## File Management Rules

### ✅ Do
- Keep only `.ts` files in `src/`
- Let TypeScript output to `dist/`
- Use `npm run clean` when in doubt
- Commit only source code, never compiled output

### ❌ Don't
- Manually create `.js` files in `src/`
- Commit the `dist/` directory
- Mix compiled and source files

## Current Focus

The build currently focuses on the main server implementation (`src/server/index.ts`) which is the stable, production-ready MCP server implementation following official MCP patterns. Client files are temporarily excluded from the build until their TypeScript issues are resolved.

## Troubleshooting

### "Cannot find module" errors
- Run `npm run clean && npm run build`
- Check that you're importing from the correct paths

### Git showing compiled files
- Run `git status` - compiled files should not appear
- If they do: `git reset HEAD -- "src/**/*.js"` then `git add .`

### Build errors
- Use `npm run typecheck` to check types without building
- Check `tsconfig.json` exclude list if specific files are problematic
