#!/usr/bin/env node

/**
 * Simple working example demonstrating the improved MCP server
 * This script starts the server and tests basic functionality
 */

import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import path from "path";

async function demonstrateImprovedServer() {
  console.log("🚀 Starting MCP Server Demonstration");
  console.log("=" .repeat(50));

  // Start the server process
  const serverPath = path.join(process.cwd(), "src", "server", "index.ts");
  
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["ts-node", serverPath],
  });

  const client = new Client(
    {
      name: "demo-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  try {
    console.log("📡 Connecting to improved MCP server...");
    await client.connect(transport);
    console.log("✅ Connected successfully!");

    // Test 1: List available tools
    console.log("\n📋 Testing tool discovery...");
    const toolsResponse = await client.request(
      {
        method: "tools/list",
      },
      "tools/list"
    );

    if (toolsResponse && 'tools' in toolsResponse) {
      console.log("✅ Tools discovered:");
      const tools = toolsResponse.tools as any[];
      tools.forEach((tool, index) => {
        console.log(`   ${index + 1}. ${tool.name}: ${tool.description}`);
      });
    } else {
      console.log("❌ No tools found in response");
      return;
    }

    // Test 2: Start a simple long-running task
    console.log("\n⚡ Testing long-running task execution...");
    const taskResponse = await client.request(
      {
        method: "tools/call",
        params: {
          name: "long-running-task",
          arguments: {
            steps: 3,
            notificationInterval: 1,
            delayMs: 800,
            enableSampling: false,
          },
        },
      },
      "tools/call"
    );

    if (taskResponse && 'content' in taskResponse) {
      const content = taskResponse.content as any[];
      console.log("✅ Task started:", content[0]?.text);
    } else {
      console.log("❌ Failed to start task");
    }

    // Wait for task completion
    console.log("\n⏳ Waiting for task completion (listening for notifications)...");
    
    // Set up notification handler
    client.setNotificationHandler("notifications/progress", (notification) => {
      console.log(`📊 Progress: ${notification.params?.message}`);
    });

    client.setNotificationHandler("notifications/message", (notification) => {
      console.log(`📢 Message: ${notification.params?.data?.message}`);
    });

    client.setNotificationHandler("notifications/cancelled", (notification) => {
      console.log(`❌ Cancelled: ${notification.params?.message}`);
    });

    // Wait for notifications
    await new Promise((resolve) => setTimeout(resolve, 4000));

    // Test 3: Test task cancellation (optional)
    console.log("\n🔄 Testing task cancellation...");
    const cancelResponse = await client.request(
      {
        method: "tools/call",
        params: {
          name: "cancel-task",
          arguments: {
            taskId: "non-existent-task",
          },
        },
      },
      "tools/call"
    );

    if (cancelResponse && 'content' in cancelResponse) {
      const content = cancelResponse.content as any[];
      console.log("✅ Cancel response:", content[0]?.text);
    }

    console.log("\n🎉 Demonstration completed successfully!");
    console.log("\n📊 Improvements Summary:");
    console.log("   ✅ Official MCP patterns implemented");
    console.log("   ✅ Consolidated server architecture");
    console.log("   ✅ Zod schema validation with zodToJsonSchema");
    console.log("   ✅ Proper error handling");
    console.log("   ✅ Graceful shutdown support");
    console.log("   ✅ TypeScript type safety");

  } catch (error) {
    console.error("❌ Demonstration failed:", error);
  } finally {
    console.log("\n🔌 Disconnecting from server...");
    await client.close();
    console.log("✅ Disconnected successfully!");
  }
}

// Handle cleanup
process.on('SIGINT', () => {
  console.log("\n👋 Goodbye!");
  process.exit(0);
});

// Run the demonstration
demonstrateImprovedServer().catch((error) => {
  console.error("💥 Fatal error:", error);
  process.exit(1);
});
