/**
 * CLI display utilities for the MCP client
 */

import { CliArgs } from '../../shared/config.js';

export class Display {
  private enableColors: boolean;

  constructor(enableColors = true) {
    this.enableColors = enableColors;
  }

  /**
   * Display welcome message
   */
  showWelcome(): void {
    const color = this.enableColors ? '\x1b[36m' : ''; // Cyan
    const reset = this.enableColors ? '\x1b[0m' : '';
    const bold = this.enableColors ? '\x1b[1m' : '';

    console.log(`${color}${bold}MCP Notification Client${reset}`);
    console.log(`${color}========================${reset}\n`);
  }

  /**
   * Display connection status
   */
  showConnectionStatus(connected: boolean, serverName?: string): void {
    const color = connected 
      ? (this.enableColors ? '\x1b[32m' : '') // Green
      : (this.enableColors ? '\x1b[31m' : ''); // Red
    const reset = this.enableColors ? '\x1b[0m' : '';
    
    const status = connected ? 'CONNECTED' : 'DISCONNECTED';
    const serverInfo = serverName ? ` to ${serverName}` : '';
    
    console.log(`${color}[${status}]${reset}${serverInfo}\n`);
  }

  /**
   * Display tool execution parameters
   */
  showExecutionParams(args: CliArgs): void {
    const color = this.enableColors ? '\x1b[34m' : ''; // Blue
    const reset = this.enableColors ? '\x1b[0m' : '';
    
    console.log(`${color}Execution Parameters:${reset}`);
    console.log(`  Steps: ${args.steps}`);
    console.log(`  Notification Interval: ${args.interval}`);
    console.log(`  Delay per Step: ${args.delay}ms`);
    console.log(`  Sampling Enabled: ${args.sampling ? 'Yes' : 'No'}`);
    console.log('');
  }

  /**
   * Display tool execution start
   */
  showExecutionStart(): void {
    const color = this.enableColors ? '\x1b[33m' : ''; // Yellow
    const reset = this.enableColors ? '\x1b[0m' : '';
    
    console.log(`${color}Starting long-running process...${reset}`);
    console.log(`${color}Watch for notifications below:${reset}\n`);
  }

  /**
   * Display execution results
   */
  showExecutionResults(result: any): void {
    const color = result.success 
      ? (this.enableColors ? '\x1b[32m' : '') // Green
      : (this.enableColors ? '\x1b[31m' : ''); // Red
    const reset = this.enableColors ? '\x1b[0m' : '';
    const bold = this.enableColors ? '\x1b[1m' : '';

    console.log(`\n${color}${bold}Execution Results:${reset}`);
    
    if (typeof result === 'string') {
      try {
        const parsed = JSON.parse(result);
        this.displayResultObject(parsed);
      } catch {
        console.log(result);
      }
    } else {
      this.displayResultObject(result);
    }
  }

  /**
   * Display result object with formatting
   */
  private displayResultObject(result: any): void {
    const color = this.enableColors ? '\x1b[36m' : ''; // Cyan
    const reset = this.enableColors ? '\x1b[0m' : '';
    
    if (result.success !== undefined) {
      console.log(`  ${color}Success:${reset} ${result.success ? 'Yes' : 'No'}`);
    }
    if (result.totalSteps !== undefined) {
      console.log(`  ${color}Total Steps:${reset} ${result.totalSteps}`);
    }
    if (result.completedSteps !== undefined) {
      console.log(`  ${color}Completed Steps:${reset} ${result.completedSteps}`);
    }
    if (result.executionTimeMs !== undefined) {
      console.log(`  ${color}Execution Time:${reset} ${result.executionTimeMs}ms`);
    }
    if (result.notificationsSent !== undefined) {
      console.log(`  ${color}Notifications Sent:${reset} ${result.notificationsSent}`);
    }
    if (result.samplingRequests !== undefined) {
      console.log(`  ${color}Sampling Requests:${reset} ${result.samplingRequests}`);
    }
    if (result.error) {
      const errorColor = this.enableColors ? '\x1b[31m' : ''; // Red
      console.log(`  ${errorColor}Error:${reset} ${result.error}`);
    }
  }

  /**
   * Display error message
   */
  showError(message: string, error?: Error): void {
    const color = this.enableColors ? '\x1b[31m' : ''; // Red
    const reset = this.enableColors ? '\x1b[0m' : '';
    
    console.error(`${color}[ERROR]${reset} ${message}`);
    
    if (error && error.stack) {
      console.error(`${color}Stack trace:${reset}\n${error.stack}`);
    }
  }

  /**
   * Display help information
   */
  showHelp(): void {
    const color = this.enableColors ? '\x1b[36m' : ''; // Cyan
    const reset = this.enableColors ? '\x1b[0m' : '';
    const bold = this.enableColors ? '\x1b[1m' : '';

    console.log(`${color}${bold}MCP Notification Client Usage:${reset}\n`);
    console.log(`${color}Command line arguments:${reset}`);
    console.log('  --steps <number>     Number of steps to execute (1-1000)');
    console.log('  --interval <number>  Notification interval (default: 1)');
    console.log('  --delay <number>     Delay between steps in ms (default: 1000)');
    console.log('  --sampling <boolean> Enable sampling requests (default: true)');
    console.log('  --verbose <boolean>  Enable verbose output (default: false)');
    console.log('  --help               Show this help message\n');
    
    console.log(`${color}Examples:${reset}`);
    console.log('  npm run client -- --steps 20 --interval 2');
    console.log('  npm run client -- --steps 10 --delay 500 --sampling false');
    console.log('  npm run client -- --help\n');
  }

  /**
   * Display a separator line
   */
  showSeparator(): void {
    const color = this.enableColors ? '\x1b[90m' : ''; // Gray
    const reset = this.enableColors ? '\x1b[0m' : '';
    
    console.log(`${color}${'─'.repeat(50)}${reset}`);
  }

  /**
   * Clear the screen (if supported)
   */
  clear(): void {
    if (process.stdout.isTTY) {
      console.clear();
    }
  }
}
