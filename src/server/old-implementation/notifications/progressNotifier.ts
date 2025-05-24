/**
 * Progress notifier for sending notifications to MCP clients
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ProgressNotification, NotificationType } from '../../shared/types.js';
import { NOTIFICATION_METHODS } from '../../shared/constants.js';

export class ProgressNotifier {
  constructor(private server: Server) {}

  /**
   * Send a progress notification to the client
   */
  async sendProgressNotification(
    step: number,
    totalSteps: number,
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const notification: ProgressNotification = {
      type: 'progress',
      step,
      totalSteps,
      percentage: Math.round((step / totalSteps) * 100),
      message,
      timestamp: new Date().toISOString(),
      metadata,
    };

    await this.sendNotification(NOTIFICATION_METHODS.PROGRESS_UPDATE, notification);
  }

  /**
   * Send a status notification to the client
   */
  async sendStatusNotification(
    step: number,
    totalSteps: number,
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const notification: ProgressNotification = {
      type: 'status',
      step,
      totalSteps,
      percentage: Math.round((step / totalSteps) * 100),
      message,
      timestamp: new Date().toISOString(),
      metadata,
    };

    await this.sendNotification(NOTIFICATION_METHODS.STATUS_UPDATE, notification);
  }

  /**
   * Send an error notification to the client
   */
  async sendErrorNotification(
    step: number,
    totalSteps: number,
    message: string,
    error?: Error
  ): Promise<void> {
    const notification: ProgressNotification = {
      type: 'error',
      step,
      totalSteps,
      percentage: Math.round((step / totalSteps) * 100),
      message,
      timestamp: new Date().toISOString(),
      metadata: error ? { error: error.message, stack: error.stack } : undefined,
    };

    await this.sendNotification(NOTIFICATION_METHODS.ERROR_UPDATE, notification);
  }

  /**
   * Send a completion notification to the client
   */
  async sendCompletionNotification(
    totalSteps: number,
    message: string,
    executionTimeMs: number,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const notification: ProgressNotification = {
      type: 'completion',
      step: totalSteps,
      totalSteps,
      percentage: 100,
      message,
      timestamp: new Date().toISOString(),
      metadata: {
        executionTimeMs,
        ...metadata,
      },
    };

    await this.sendNotification(NOTIFICATION_METHODS.COMPLETION_UPDATE, notification);
  }

  /**
   * Send a notification using the server's notification system
   */
  private async sendNotification(method: string, params: ProgressNotification): Promise<void> {
    try {
      await this.server.sendNotification({
        method,
        params,
      });
    } catch (error) {
      console.error(`Failed to send notification ${method}:`, error);
    }
  }
}
