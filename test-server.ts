#!/usr/bin/env node

/**
 * Simple test script to verify the improved MCP server works
 */

import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { spawn } from "child_process";
import path from "path";

async function testServer() {
  console.log("Starting server test...");
  
  // Start the server process
  const serverPath = path.join(process.cwd(), "src", "server", "index.ts");
  const serverProcess = spawn("npx", ["ts-node", serverPath], {
    stdio: ["pipe", "pipe", "inherit"],
  });

  // Create client transport using the server's stdio
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["ts-node", serverPath],
  });

  const client = new Client(
    {
      name: "test-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  try {
    // Connect to server
    await client.connect(transport);
    console.log("✅ Connected to server");

    // Test tools list
    const toolsResponse = await client.request(
      {
        method: "tools/list",
      },
      "tools/list"
    );

    console.log("✅ Tools list received:", JSON.stringify(toolsResponse, null, 2));

    // Test calling the long-running task
    const taskResponse = await client.request(
      {
        method: "tools/call",
        params: {
          name: "long-running-task",
          arguments: {
            steps: 3,
            notificationInterval: 1,
            delayMs: 500,
            enableSampling: false,
          },
        },
      },
      "tools/call"
    );

    console.log("✅ Task started:", JSON.stringify(taskResponse, null, 2));

    // Wait a bit for notifications
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("✅ Server test completed successfully!");

  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    // Cleanup
    await client.close();
    serverProcess.kill();
  }
}

testServer().catch((error) => {
  console.error("Fatal test error:", error);
  process.exit(1);
});
