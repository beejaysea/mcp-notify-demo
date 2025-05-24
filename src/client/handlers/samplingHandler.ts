/**
 * Sampling handler for MCP client
 */

import { SamplingRequest, SamplingResponse } from '../../shared/types.js';

export class SamplingHandler {
  private enableColors: boolean;
  private samplingHistory: Array<{ request: SamplingRequest; response: SamplingResponse }> = [];

  constructor(enableColors = true) {
    this.enableColors = enableColors;
  }

  /**
   * Handle sampling request from server
   * For MVP: echo back the request with some basic processing
   */
  async handleSamplingRequest(request: any): Promise<any> {
    const timestamp = new Date().toISOString();
    
    // Extract sampling request data
    const samplingRequest: SamplingRequest = {
      step: request.params?.metadata?.currentStep || 0,
      message: request.params?.messages?.[0]?.content?.text || 'No message provided',
      context: request.params?.metadata || {},
    };

    // Display sampling request
    this.displaySamplingRequest(samplingRequest);

    // Generate response (for MVP, we'll echo back with some processing)
    const responseText = this.generateEchoResponse(samplingRequest);
    
    const samplingResponse: SamplingResponse = {
      step: samplingRequest.step,
      response: responseText,
      timestamp,
    };

    // Store in history
    this.samplingHistory.push({
      request: samplingRequest,
      response: samplingResponse,
    });

    // Display response
    this.displaySamplingResponse(samplingResponse);

    // Return MCP-compliant sampling response
    return {
      content: [
        {
          type: 'text',
          text: responseText,
        },
      ],
      model: 'echo-model',
      stopReason: 'end_turn',
      usage: {
        inputTokens: this.estimateTokens(samplingRequest.message),
        outputTokens: this.estimateTokens(responseText),
      },
    };
  }

  /**
   * Generate echo response with basic processing
   */
  private generateEchoResponse(request: SamplingRequest): string {
    const { step, message, context } = request;
    const percentage = context?.percentage || 0;
    
    // Simple echo with acknowledgment
    const responses = [
      `Acknowledged step ${step}. Progress looks good at ${percentage}%.`,
      `Step ${step} received. Continuing with the process.`,
      `Processing step ${step}. Status: Normal operation.`,
      `Step ${step} completed successfully. Ready for next step.`,
      `Received update for step ${step}. Everything appears to be working correctly.`,
    ];

    // Select response based on step number
    const responseIndex = step % responses.length;
    return responses[responseIndex];
  }

  /**
   * Display sampling request to user
   */
  private displaySamplingRequest(request: SamplingRequest): void {
    const color = this.enableColors ? '\x1b[33m' : ''; // Yellow
    const reset = this.enableColors ? '\x1b[0m' : '';
    const timestamp = new Date().toLocaleTimeString();
    const grayColor = this.enableColors ? '\x1b[90m' : '';

    console.log(
      `${grayColor}${timestamp}${reset} ${color}[SAMPLING REQUEST]${reset} Step ${request.step}: ${request.message}`
    );
  }

  /**
   * Display sampling response to user
   */
  private displaySamplingResponse(response: SamplingResponse): void {
    const color = this.enableColors ? '\x1b[35m' : ''; // Magenta
    const reset = this.enableColors ? '\x1b[0m' : '';
    const timestamp = new Date(response.timestamp).toLocaleTimeString();
    const grayColor = this.enableColors ? '\x1b[90m' : '';

    console.log(
      `${grayColor}${timestamp}${reset} ${color}[SAMPLING RESPONSE]${reset} Step ${response.step}: ${response.response}`
    );
  }

  /**
   * Simple token estimation (for demonstration purposes)
   */
  private estimateTokens(text: string): number {
    // Very rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Get sampling history
   */
  getSamplingHistory(): Array<{ request: SamplingRequest; response: SamplingResponse }> {
    return [...this.samplingHistory];
  }

  /**
   * Clear sampling history
   */
  clearHistory(): void {
    this.samplingHistory = [];
  }

  /**
   * Get sampling statistics
   */
  getStatistics(): { totalRequests: number; averageResponseLength: number } {
    const totalRequests = this.samplingHistory.length;
    
    if (totalRequests === 0) {
      return { totalRequests: 0, averageResponseLength: 0 };
    }

    const totalResponseLength = this.samplingHistory.reduce(
      (sum, item) => sum + item.response.response.length,
      0
    );
    
    const averageResponseLength = totalResponseLength / totalRequests;

    return {
      totalRequests,
      averageResponseLength: Math.round(averageResponseLength),
    };
  }
}
