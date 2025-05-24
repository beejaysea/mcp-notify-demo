/**
 * Shared type definitions for MCP notification system
 */

import { z } from 'zod';

// Notification types
export type NotificationType = 'progress' | 'status' | 'error' | 'completion';

// Progress notification interface
export interface ProgressNotification {
  type: NotificationType;
  step: number;
  totalSteps: number;
  percentage: number;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// Tool execution parameters schema
export const LongRunningToolParamsSchema = z.object({
  steps: z.number().min(1).max(1000),
  notificationInterval: z.number().min(1).default(1),
  delayMs: z.number().min(100).max(10000).default(1000),
  enableSampling: z.boolean().default(true),
});

export type LongRunningToolParams = z.infer<typeof LongRunningToolParamsSchema>;

// Tool execution result
export interface ToolExecutionResult {
  success: boolean;
  totalSteps: number;
  completedSteps: number;
  executionTimeMs: number;
  notificationsSent: number;
  samplingRequests: number;
  error?: string;
}

// Sampling request/response types
export interface SamplingRequest {
  step: number;
  message: string;
  context?: Record<string, unknown>;
}

export interface SamplingResponse {
  step: number;
  response: string;
  timestamp: string;
}
