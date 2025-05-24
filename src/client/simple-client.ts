#!/usr/bin/env node

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Parse command line arguments
const parseArgs = (): any => {
  const args = process.argv.slice(2);
  
  // Simple argument parsing
  const parsed: any = {
    serverPath: 'src/server/index.ts',
    toolName: 'start_long_running_task',
    steps: 5,
    interval: 2,
    delay: 1000,
    sampling: true,
    verbose: false,
  };

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, '');
    const value = args[i + 1];
    
    if (key && value) {
      if (key === 'steps' || key === 'interval' || key === 'delay') {
        parsed[key] = parseInt(value, 10);
      } else if (key === 'sampling' || key === 'verbose') {
        parsed[key] = value.toLowerCase() === 'true';
      } else {
        parsed[key] = value;
      }
    }
  }

  return parsed;
};

function createProgressBar(progress: number, width: number = 20): string {
  const filled = Math.round((progress / 100) * width);
  const empty = width - filled;
  return `[${'█'.repeat(filled)}${' '.repeat(empty)}]`;
}

async function main() {
  const args = parseArgs();
  console.error('Starting MCP notification client...');
  console.error('Config:', args);

  const client = new Client(
    {
      name: 'mcp-notify-client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['ts-node', args.serverPath],
  });

  // Set up low-level notification handling via transport events
  transport.onmessage = (message: any) => {
    // Handle JSON-RPC notifications
    if (message.method && message.method.startsWith('notifications/')) {
      const params = message.params;
      const timestamp = new Date(params.timestamp).toLocaleTimeString();
      
      if (message.method === 'notifications/progress') {
        const progressBar = createProgressBar(params.progress || 0);
        
        switch (params.type) {
          case 'start':
            console.log(`\n🚀 [${timestamp}] Task ${params.taskId} started`);
            console.log(`   ${params.message}`);
            break;
            
          case 'progress':
            console.log(`\n⏳ [${timestamp}] Progress Update`);
            console.log(`   ${params.message}`);
            console.log(`   ${progressBar} ${params.progress.toFixed(1)}%`);
            break;
            
          case 'completion':
            console.log(`\n✅ [${timestamp}] Task Complete`);
            console.log(`   ${params.message}`);
            console.log(`   ${progressBar} 100%`);
            break;
            
          case 'cancelled':
            console.log(`\n❌ [${timestamp}] Task Cancelled`);
            console.log(`   ${params.message}`);
            console.log(`   ${progressBar} ${params.progress.toFixed(1)}%`);
            break;
            
          case 'error':
            console.log(`\n💥 [${timestamp}] Task Error`);
            console.log(`   ${params.message}`);
            break;
        }
      } else if (message.method === 'notifications/sampling') {
        console.log(`\n🔍 [${timestamp}] Sampling Request`);
        console.log(`   ${params.message}`);
        console.log(`   Data:`, JSON.stringify(params.data, null, 2));
        console.log(`   → Client feedback: Task is progressing well, continue!`);
      }
    }
  };

  try {
    await client.connect(transport);
    console.error('Connected to MCP server');

    // List available tools
    const toolsResponse = await client.request(
      { method: 'tools/list', params: {} },
      ListToolsRequestSchema
    ) as any;
    
    console.log('\n📋 Available tools:');
    if (toolsResponse.tools) {
      toolsResponse.tools.forEach((tool: any) => {
        console.log(`   - ${tool.name}: ${tool.description}`);
      });
    }

    // Start the long-running task
    console.log(`\n🏃 Starting tool: ${args.toolName}`);
    
    const toolParams = {
      steps: args.steps,
      notificationInterval: args.interval,
      delayMs: args.delay,
      enableSampling: args.sampling,
    };

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: args.toolName,
        arguments: toolParams,
      },
    }, CallToolRequestSchema) as any;

    console.log('\n🎯 Tool execution result:');
    if (result.content) {
      result.content.forEach((content: any) => {
        if (content.type === 'text') {
          console.log(`   ${content.text}`);
        }
      });
    }

    // Keep the client running to receive notifications
    console.log('\n👂 Listening for notifications... (Press Ctrl+C to exit)');
    
    // Set up cleanup on exit
    process.on('SIGINT', async () => {
      console.log('\n\n👋 Shutting down client...');
      await client.close();
      process.exit(0);
    });

    // Keep process alive
    await new Promise(() => {});

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
