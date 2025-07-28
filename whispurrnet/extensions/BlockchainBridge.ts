/**
 * ⛓️ BlockchainBridge Extension for WhispurrNet
 *
 * Enables block and transaction event propagation over the WhispurrNet mesh.
 * Broadcasts block/tx events as resonance messages for decentralized consensus and monitoring.
 *
 * Features:
 * - Block/transaction event streaming
 * - Consensus and validation messaging
 * - Pluggable as a WhispurrNet extension
 *
 * Usage Example:
 * ```ts
 * import { Whispurr } from "./Whispurr.ts";
 * import { BlockchainBridge } from "./extensions/BlockchainBridge.ts";
 *
 * const whispurr = new Whispurr({ debug: true });
 * const chainBridge = new BlockchainBridge();
 *
 * await whispurr.initialize();
 * whispurr.registerExtension(chainBridge);
 *
 * // Broadcast a new block event
 * chainBridge.sendBlockEvent({
 *   blockHash: '0xabc...',
 *   height: 12345,
 *   timestamp: Date.now()
 * });
 * ```
 */

import { WhispurrExtension, MessageType, Whispurr } from "./Whispurr.ts";
import { Message, createMessage } from "./Protocol.ts";

export class BlockchainBridge implements WhispurrExtension {
  id = 'blockchain-bridge';
  version = '1.0.0';
  supportedTypes = [MessageType.BROADCAST, MessageType.RESONANCE];

  private whispurr: Whispurr | null = null;

  async initialize(whispurr: Whispurr): Promise<void> {
    this.whispurr = whispurr;
    console.log('⛓️ BlockchainBridge initialized');
  }

  async handleMessage(message: Message): Promise<void> {
    if (message.type === MessageType.BROADCAST && message.whisperTag.startsWith('blockchain/')) {
      const payload = JSON.parse(message.payload);
      if (payload.blockHash) {
        console.log('⛓️ Received block event:', payload);
      }
      if (payload.txHash) {
        console.log('💸 Received transaction event:', payload);
      }
    }
  }

  async sendBlockEvent(block: any) {
    if (!this.whispurr) return;
    const msg = await createMessage(
      MessageType.BROADCAST,
      this.whispurr.getNodeId(),
      JSON.stringify(block),
      { intent: 'blockchain/block', whisperTag: 'blockchain/block' }
    );
    await this.whispurr.broadcast(msg.payload, 'blockchain/block');
  }

  async sendTransactionEvent(tx: any) {
    if (!this.whispurr) return;
    const msg = await createMessage(
      MessageType.BROADCAST,
      this.whispurr.getNodeId(),
      JSON.stringify(tx),
      { intent: 'blockchain/tx', whisperTag: 'blockchain/tx' }
    );
    await this.whispurr.broadcast(msg.payload, 'blockchain/tx');
  }

  async cleanup(): Promise<void> {
    console.log('⛓️ BlockchainBridge cleaned up');
  }
} 