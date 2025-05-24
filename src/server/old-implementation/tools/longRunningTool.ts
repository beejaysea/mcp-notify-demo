/**
 * Long-running tool implementation with progress notifications and sampling
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { 
  LongRunningToolParams, 
  ToolExecutionResult, 
  SamplingRequest, 
  SamplingResponse 
} from '../../shared/types.js';
import { SAMPLING_METHODS } from '../../shared/constants.js';
import { ProgressNotifier } from '../notifications/progressNotifier.js';

export class LongRunningTool {
  private notifier: ProgressNotifier;

  constructor(private server: Server) {
    this.notifier = new ProgressNotifier(server);
  }

  /**
   * Execute the long-running process with progress notifications and sampling
   */
  async execute(params: LongRunningToolParams): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    let completedSteps = 0;
    let notificationsSent = 0;
    let samplingRequests = 0;

    try {
      // Send initial status notification
      await this.notifier.sendStatusNotification(
        0,
        params.steps,
        `Starting long-running process with ${params.steps} steps`,
        { 
          notificationInterval: params.notificationInterval,
          delayMs: params.delayMs,
          enableSampling: params.enableSampling
        }
      );
      notificationsSent++;

      // Execute each step
      for (let step = 1; step <= params.steps; step++) {
        // Simulate work with delay
        await this.delay(params.delayMs);

        // Send progress notification if interval reached
        if (step % params.notificationInterval === 0) {
          await this.notifier.sendProgressNotification(
            step,
            params.steps,
            `Completed step ${step} of ${params.steps}`,
            { currentStep: step }
          );
          notificationsSent++;
        }

        // Send sampling request if enabled and at specific intervals
        if (params.enableSampling && step % Math.max(params.notificationInterval * 2, 1) === 0) {
          try {
            const samplingResponse = await this.requestSampling(step, params.steps);
            if (samplingResponse) {
              samplingRequests++;
              console.log(`Sampling response at step ${step}:`, samplingResponse.response);
            }
          } catch (error) {
            console.warn(`Sampling request failed at step ${step}:`, error);
          }
        }

        completedSteps = step;
      }

      const executionTimeMs = Date.now() - startTime;

      // Send completion notification
      await this.notifier.sendCompletionNotification(
        params.steps,
        `Successfully completed all ${params.steps} steps`,
        executionTimeMs,
        {
          completedSteps,
          notificationsSent,
          samplingRequests,
          averageStepTimeMs: executionTimeMs / params.steps
        }
      );
      notificationsSent++;

      return {
        success: true,
        totalSteps: params.steps,
        completedSteps,
        executionTimeMs,
        notificationsSent,
        samplingRequests,
      };

    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Send error notification
      await this.notifier.sendErrorNotification(
        completedSteps,
        params.steps,
        `Error during execution: ${errorMessage}`,
        error instanceof Error ? error : undefined
      );
      notificationsSent++;

      return {
        success: false,
        totalSteps: params.steps,
        completedSteps,
        executionTimeMs,
        notificationsSent,
        samplingRequests,
        error: errorMessage,
      };
    }
  }

  /**
   * Request sampling from the client
   */
  private async requestSampling(step: number, totalSteps: number): Promise<SamplingResponse | null> {
    const samplingRequest: SamplingRequest = {
      step,
      message: `Please provide feedback for step ${step} of ${totalSteps}`,
      context: {
        currentStep: step,
        totalSteps,
        percentage: Math.round((step / totalSteps) * 100),
        timestamp: new Date().toISOString(),
      },
    };

    try {
      // Send sampling request to client
      const response = await this.server.sendRequest(
        {
          method: SAMPLING_METHODS.CREATE_MESSAGE,
          params: {
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: samplingRequest.message,
                },
              },
            ],
            systemPrompt: 'You are a helpful assistant providing feedback on a long-running process.',
            maxTokens: 100,
            metadata: samplingRequest.context,
          },
        },
        // Schema validation would go here in a real implementation
        {} as any
      );

      return {
        step,
        response: response.content?.[0]?.text || 'No response received',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.warn(`Sampling request failed for step ${step}:`, error);
      return null;
    }
  }

  /**
   * Utility method to create a delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
