/**
 * Configuration interfaces and utilities
 */

import { z } from 'zod';

// Server configuration schema
export const ServerConfigSchema = z.object({
  name: z.string().default('mcp-notify-server'),
  version: z.string().default('1.0.0'),
  enableLogging: z.boolean().default(true),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type ServerConfig = z.infer<typeof ServerConfigSchema>;

// Client configuration schema
export const ClientConfigSchema = z.object({
  name: z.string().default('mcp-notify-client'),
  version: z.string().default('1.0.0'),
  enableColors: z.boolean().default(true),
  showTimestamps: z.boolean().default(true),
  autoScroll: z.boolean().default(true),
});

export type ClientConfig = z.infer<typeof ClientConfigSchema>;

// CLI arguments schema
export const CliArgsSchema = z.object({
  serverPath: z.string(),
  toolName: z.string(),
  steps: z.number().min(1).max(1000).optional(),
  interval: z.number().min(1).optional(),
  delay: z.number().min(100).max(10000).optional(),
  sampling: z.boolean().default(true),
  verbose: z.boolean().default(false),
});

export type CliArgs = z.infer<typeof CliArgsSchema>;
