#!/usr/bin/env node

import { spawn } from 'child_process';
import { McpNotifyClient } from './client';
import { CliArgsSchema } from '../shared/config';
import { Display } from './ui/display';

// Create display instance
const display = new Display();

/**
 * Parse command line arguments and validate them
 */
function parseCliArgs(): { serverPath: string; toolName: string; steps?: number; delay?: number; interval?: number; sampling?: boolean; verbose?: boolean } {
  const args = process.argv.slice(2);
  
  // Default values
  let serverPath = 'src/server/index-improved.ts';
  let toolName = 'start_long_running_task';
  let steps: number | undefined;
  let delay: number | undefined;
  let interval: number | undefined;
  let sampling: boolean | undefined;
  let verbose: boolean | undefined;
  
  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--server':
      case '-s':
        serverPath = args[++i];
        break;
      case '--tool':
      case '-t':
        toolName = args[++i];
        break;
      case '--steps':
        steps = parseInt(args[++i], 10);
        break;
      case '--delay':
        delay = parseInt(args[++i], 10);
        break;
      case '--interval':
        interval = parseInt(args[++i], 10);
        break;
      case '--sampling':
        sampling = true;
        break;
      case '--verbose':
        verbose = true;
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
      default:
        console.error(`Unknown argument: ${arg}`);
        showHelp();
        process.exit(1);
    }
  }
  
  try {
    const parsed = CliArgsSchema.parse({
      serverPath,
      toolName,
      steps,
      delay,
      interval,
      sampling: sampling ?? true,
      verbose: verbose ?? false
    });
    return {
      serverPath: parsed.serverPath,
      toolName: parsed.toolName,
      steps: parsed.steps,
      delay: parsed.delay,
      interval: parsed.interval,
      sampling: parsed.sampling,
      verbose: parsed.verbose
    };
  } catch (error) {
    console.error('Invalid arguments:');
    if (error instanceof Error) {
      console.error(error.message);
    }
    showHelp();
    process.exit(1);
  }
}

/**
 * Show help information
 */
function showHelp(): void {
  display.showHelp();
}

/**
 * Start the MCP server as a child process
 */
function startServer(serverPath: string): Promise<{ process: any; serverTransport: any }> {
  return new Promise((resolve, reject) => {
    console.log(`Starting MCP server: ${serverPath}`);
    
    // Spawn the server process
    const serverProcess = spawn('npx', ['ts-node', serverPath], {
      stdio: ['pipe', 'pipe', 'inherit'],
      env: { ...process.env, NODE_ENV: 'development' }
    });
    
    serverProcess.on('error', (error) => {
      console.error(`Failed to start server: ${error.message}`);
      reject(error);
    });
    
    serverProcess.on('exit', (code) => {
      if (code !== 0) {
        console.error(`Server exited with code ${code}`);
      }
    });
    
    // Give the server a moment to start
    setTimeout(() => {
      const serverTransport = {
        stdin: serverProcess.stdin!,
        stdout: serverProcess.stdout!
      };
      
      resolve({ process: serverProcess, serverTransport });
    }, 1000);
  });
}

/**
 * Main function to run the client
 */
async function main(): Promise<void> {
  try {
    const args = parseCliArgs();
    
    display.showWelcome();
    console.log('Configuration:');
    console.log(`  Server: ${args.serverPath}`);
    console.log(`  Tool: ${args.toolName}`);
    if (args.steps) console.log(`  Steps: ${args.steps}`);
    if (args.delay) console.log(`  Delay: ${args.delay}ms`);
    if (args.interval) console.log(`  Interval: ${args.interval}ms`);
    display.showSeparator();
    
    // Start the server
    const { process: serverProcess } = await startServer(args.serverPath);
    
    // Create and start the client
    const client = new McpNotifyClient();
    
    // Set up graceful shutdown
    const cleanup = async (): Promise<void> => {
      console.log('Shutting down...');
      await client.disconnect();
      serverProcess.kill('SIGTERM');
      process.exit(0);
    };
    
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    
    // Connect to the server using the command
    await client.connect('npx', ['ts-node', args.serverPath]);
    
    // Create ExecutionParams object for execution
    const executionParams = {
      steps: args.steps ?? 5,
      interval: args.interval ?? 1,
      delay: args.delay ?? 1000,
      sampling: args.sampling ?? true,
      verbose: args.verbose ?? false
    };
    
    console.log(`Executing tool: ${args.toolName}`);
    display.showSeparator();
    
    const result = await client.executeLongRunningProcess(executionParams);
    
    // Wait for notifications to be received (give the server time to send them)
    console.log('Waiting for notifications...');
    const waitTime = (executionParams.steps * executionParams.delay) + 2000; // Total execution time + buffer
    await new Promise(resolve => setTimeout(resolve, waitTime));
    
    display.showSeparator();
    console.log('Tool execution completed');
    client.showSummary();
    console.log('Final result:');
    console.log(JSON.stringify(result, null, 2));
    
    // Clean shutdown
    await cleanup();
    
  } catch (error) {
    console.error('Client error:');
    if (error instanceof Error) {
      console.error(error.message);
      if (error.stack) {
        console.error('Stack trace:');
        console.error(error.stack);
      }
    } else {
      console.error(String(error));
    }
    process.exit(1);
  }
}

// Run the main function
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:');
    console.error(error);
    process.exit(1);
  });
}

export { main };
