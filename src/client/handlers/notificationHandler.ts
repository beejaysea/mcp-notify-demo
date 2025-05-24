/**
 * Notification handler for MCP client
 */

import { ProgressNotification } from '../../shared/types.js';
import { NOTIFICATION_METHODS } from '../../shared/constants.js';

export class NotificationHandler {
  private notifications: ProgressNotification[] = [];
  private enableColors: boolean;
  private showTimestamps: boolean;

  constructor(enableColors = true, showTimestamps = true) {
    this.enableColors = enableColors;
    this.showTimestamps = showTimestamps;
  }

  /**
   * Handle incoming notifications from the MCP server
   */
  handleNotification(method: string, params: ProgressNotification): void {
    // Store notification for history
    this.notifications.push(params);

    // Display notification based on type
    switch (method) {
      case NOTIFICATION_METHODS.PROGRESS_UPDATE:
        this.displayProgress(params);
        break;
      case NOTIFICATION_METHODS.STATUS_UPDATE:
        this.displayStatus(params);
        break;
      case NOTIFICATION_METHODS.ERROR_UPDATE:
        this.displayError(params);
        break;
      case NOTIFICATION_METHODS.COMPLETION_UPDATE:
        this.displayCompletion(params);
        break;
      default:
        this.displayGeneric(method, params);
    }
  }

  /**
   * Display progress notification
   */
  private displayProgress(notification: ProgressNotification): void {
    const timestamp = this.formatTimestamp(notification.timestamp);
    const progressBar = this.createProgressBar(notification.percentage);
    const color = this.enableColors ? '\x1b[36m' : ''; // Cyan
    const reset = this.enableColors ? '\x1b[0m' : '';

    console.log(
      `${timestamp}${color}[PROGRESS]${reset} ${progressBar} ${notification.percentage}% - ${notification.message}`
    );
  }

  /**
   * Display status notification
   */
  private displayStatus(notification: ProgressNotification): void {
    const timestamp = this.formatTimestamp(notification.timestamp);
    const color = this.enableColors ? '\x1b[34m' : ''; // Blue
    const reset = this.enableColors ? '\x1b[0m' : '';

    console.log(
      `${timestamp}${color}[STATUS]${reset} ${notification.message}`
    );
  }

  /**
   * Display error notification
   */
  private displayError(notification: ProgressNotification): void {
    const timestamp = this.formatTimestamp(notification.timestamp);
    const color = this.enableColors ? '\x1b[31m' : ''; // Red
    const reset = this.enableColors ? '\x1b[0m' : '';

    console.log(
      `${timestamp}${color}[ERROR]${reset} ${notification.message}`
    );

    // Show error details if available
    if (notification.metadata?.error) {
      console.log(`${timestamp}${color}       Error details: ${notification.metadata.error}${reset}`);
    }
  }

  /**
   * Display completion notification
   */
  private displayCompletion(notification: ProgressNotification): void {
    const timestamp = this.formatTimestamp(notification.timestamp);
    const color = this.enableColors ? '\x1b[32m' : ''; // Green
    const reset = this.enableColors ? '\x1b[0m' : '';

    console.log(
      `${timestamp}${color}[COMPLETE]${reset} ${notification.message}`
    );

    // Show execution summary
    if (notification.metadata) {
      const meta = notification.metadata;
      console.log(`${timestamp}${color}         Execution time: ${meta.executionTimeMs}ms${reset}`);
      if (meta.notificationsSent) {
        console.log(`${timestamp}${color}         Notifications sent: ${meta.notificationsSent}${reset}`);
      }
      if (meta.samplingRequests) {
        console.log(`${timestamp}${color}         Sampling requests: ${meta.samplingRequests}${reset}`);
      }
    }
  }

  /**
   * Display generic notification
   */
  private displayGeneric(method: string, notification: ProgressNotification): void {
    const timestamp = this.formatTimestamp(notification.timestamp);
    const color = this.enableColors ? '\x1b[37m' : ''; // White
    const reset = this.enableColors ? '\x1b[0m' : '';

    console.log(
      `${timestamp}${color}[${method.toUpperCase()}]${reset} ${notification.message}`
    );
  }

  /**
   * Create a visual progress bar
   */
  private createProgressBar(percentage: number, width = 20): string {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    return `[${bar}]`;
  }

  /**
   * Format timestamp for display
   */
  private formatTimestamp(timestamp: string): string {
    if (!this.showTimestamps) {
      return '';
    }
    
    const date = new Date(timestamp);
    const timeStr = date.toLocaleTimeString();
    const color = this.enableColors ? '\x1b[90m' : ''; // Gray
    const reset = this.enableColors ? '\x1b[0m' : '';
    
    return `${color}${timeStr}${reset} `;
  }

  /**
   * Get notification history
   */
  getNotificationHistory(): ProgressNotification[] {
    return [...this.notifications];
  }

  /**
   * Clear notification history
   */
  clearHistory(): void {
    this.notifications = [];
  }

  /**
   * Get statistics about notifications received
   */
  getStatistics(): Record<string, number> {
    const stats: Record<string, number> = {};
    
    for (const notification of this.notifications) {
      stats[notification.type] = (stats[notification.type] || 0) + 1;
    }
    
    return stats;
  }
}
