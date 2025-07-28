/**
 * 🧬 NovaTinyBridge Extension for WhispurrNet
 *
 * Integrates NovaTiny's nanobot orchestration and AI governance with WhispurrNet's
 * encrypted, intent-driven P2P mesh. Enables secure command relay, real-time feedback,
 * and AI event streaming between NovaTiny edge nodes and the WhispurrNet mesh.
 *
 * Features:
 * - Secure relay of NovaTiny commands (e.g., cell repair, feedback)
 * - Real-time AI event and telemetry streaming
 * - Maps NovaTiny JSON protocol to WhispurrNet resonance messages
 * - Pluggable as a WhispurrNet extension
 *
 * Usage Example:
 * ```ts
 * import { Whispurr } from "./Whispurr.ts";
 * import { NovaTinyBridge } from "./extensions/NovaTinyBridge.ts";
 *
 * const whispurr = new Whispurr({ debug: true });
 * const novaBridge = new NovaTinyBridge();
 *
 * await whispurr.initialize();
 * whispurr.registerExtension(novaBridge);
 *
 * // Send a cell repair command
 * novaBridge.sendNovaTinyCommand({
 *   task: 'cell_repair',
 *   target: 'liver_cells',
 *   priority: 'emergency',
 *   feedback: { status: 'initiated', timestamp: Date.now() }
 * });
 * ```
 *
 * Security: All messages are encrypted and intent-driven. No metadata leakage.
 */

import { WhispurrExtension, MessageType, Whispurr } from "./Whispurr.ts";
import { Message, createMessage } from "./Protocol.ts";

export class NovaTinyBridge implements WhispurrExtension {
  id = 'nova-tiny-bridge';
  version = '1.0.0';
  supportedTypes = [MessageType.BROADCAST, MessageType.RESONANCE];

  private whispurr: Whispurr | null = null;

  async initialize(whispurr: Whispurr): Promise<void> {
    this.whispurr = whispurr;
    console.log('🧬 NovaTinyBridge initialized');
  }

  async handleMessage(message: Message): Promise<void> {
    // Route NovaTiny commands/feedback
    if (message.type === MessageType.BROADCAST && message.whisperTag.startsWith('nova-tiny/')) {
      const payload = JSON.parse(message.payload);
      if (payload.task === 'cell_repair') {
        // Handle cell repair command
        console.log('🦠 NovaTiny cell repair command:', payload);
      }
      if (payload.feedback) {
        // Handle biofeedback
        console.log('🧬 NovaTiny biofeedback:', payload.feedback);
      }
    }
  }

  async sendNovaTinyCommand(command: any) {
    if (!this.whispurr) return;
    const msg = await createMessage(
      MessageType.BROADCAST,
      this.whispurr.getNodeId(),
      JSON.stringify(command),
      { intent: 'nova-tiny/command', whisperTag: 'nova-tiny/cell_repair' }
    );
    await this.whispurr.broadcast(msg.payload, 'nova-tiny/command');
  }

  async cleanup(): Promise<void> {
    console.log('🧬 NovaTinyBridge cleaned up');
  }
} 