/**
 * 🤖 AIBridge Extension for WhispurrNet
 *
 * Enables AI/ML event and model update propagation over the WhispurrNet mesh.
 * Broadcasts model updates, anomaly alerts, and consensus events as resonance messages.
 *
 * Features:
 * - AI/ML event streaming (model updates, anomaly alerts)
 * - Consensus and coordination messaging
 * - Pluggable as a WhispurrNet extension
 *
 * Usage Example:
 * ```ts
 * import { Whispurr } from "./Whispurr.ts";
 * import { AIBridge } from "./extensions/AIBridge.ts";
 *
 * const whispurr = new Whispurr({ debug: true });
 * const aiBridge = new AIBridge();
 *
 * await whispurr.initialize();
 * whispurr.registerExtension(aiBridge);
 *
 * // Broadcast a model update
 * aiBridge.sendModelUpdate({
 *   modelId: 'ml-42',
 *   version: '1.2.3',
 *   weights: 'base64-weights',
 *   timestamp: Date.now()
 * });
 * ```
 */

import { WhispurrExtension, MessageType, Whispurr } from "./Whispurr.ts";
import { Message, createMessage } from "./Protocol.ts";

export class AIBridge implements WhispurrExtension {
  id = 'ai-bridge';
  version = '1.0.0';
  supportedTypes = [MessageType.BROADCAST, MessageType.RESONANCE];

  private whispurr: Whispurr | null = null;

  async initialize(whispurr: Whispurr): Promise<void> {
    this.whispurr = whispurr;
    console.log('🤖 AIBridge initialized');
  }

  async handleMessage(message: Message): Promise<void> {
    if (message.type === MessageType.BROADCAST && message.whisperTag.startsWith('ai/')) {
      const payload = JSON.parse(message.payload);
      if (payload.modelId) {
        console.log('🤖 Received AI model update:', payload);
      }
      if (payload.anomaly) {
        console.log('⚠️ AI anomaly alert:', payload.anomaly);
      }
    }
  }

  async sendModelUpdate(update: any) {
    if (!this.whispurr) return;
    const msg = await createMessage(
      MessageType.BROADCAST,
      this.whispurr.getNodeId(),
      JSON.stringify(update),
      { intent: 'ai/model_update', whisperTag: 'ai/model_update' }
    );
    await this.whispurr.broadcast(msg.payload, 'ai/model_update');
  }

  async sendAnomalyAlert(anomaly: any) {
    if (!this.whispurr) return;
    const msg = await createMessage(
      MessageType.BROADCAST,
      this.whispurr.getNodeId(),
      JSON.stringify({ anomaly }),
      { intent: 'ai/anomaly', whisperTag: 'ai/anomaly' }
    );
    await this.whispurr.broadcast(msg.payload, 'ai/anomaly');
  }

  async cleanup(): Promise<void> {
    console.log('🤖 AIBridge cleaned up');
  }
} 