/**
 * Shared constants for MCP notification system
 */

// Tool names
export const TOOL_NAMES = {
  EXECUTE_LONG_PROCESS: 'long-running-task',
} as const;

// Notification methods (custom JSON-RPC methods)
export const NOTIFICATION_METHODS = {
  PROGRESS_UPDATE: 'notifications/progress',
  STATUS_UPDATE: 'notifications/status',
  ERROR_UPDATE: 'notifications/error',
  COMPLETION_UPDATE: 'notifications/completion',
} as const;

// Sampling methods
export const SAMPLING_METHODS = {
  CREATE_MESSAGE: 'sampling/createMessage',
} as const;

// Default configuration values
export const DEFAULT_CONFIG = {
  NOTIFICATION_INTERVAL: 1,
  DELAY_MS: 1000,
  ENABLE_SAMPLING: true,
  MAX_STEPS: 1000,
  MIN_STEPS: 1,
  MIN_DELAY_MS: 100,
  MAX_DELAY_MS: 10000,
} as const;

// Server information
export const SERVER_INFO = {
  NAME: 'mcp-notify-server',
  VERSION: '1.0.0',
} as const;

// Client information
export const CLIENT_INFO = {
  NAME: 'mcp-notify-client',
  VERSION: '1.0.0',
} as const;
