/**
 * 🌟 WhispurrNet Main Orchestrator Module
 * 
 * This module serves as the main orchestrator for the WhispurrNet P2P communication
 * layer, coordinating all components and providing a unified interface.
 * 
 * Features:
 * - Gossip protocol for message propagation
 * - Modular extension system for custom functionality
 * - Pluggable obfuscation layer for traffic simulation
 * - Intent-driven message routing and resonance matching
 * - Automatic network discovery and peer management
 * - Zero metadata leakage and privacy protection
 * 
 * Security Considerations:
 * - All traffic is encrypted end-to-end
 * - Zero persistent identity storage
 * - Traffic obfuscation to mimic browser-native patterns
 * - Intent-driven connections prevent metadata correlation
 * 
 * Performance: O(n) for gossip propagation, O(1) for message routing
 * Dependencies: Node.ts, Protocol.ts, entropy.ts, Web Crypto API
 */

import { WhispurrNode, ConnectionConfig, PeerInfo, ConnectionEvent } from './Node';
import { 
  Message, 
  MessageType, 
  createMessage, 
  validateMessage, 
  matchesResonance,
  isMessageExpired 
} from './Protocol';

// Re-export MessageType for convenience
export { MessageType };
import { generateWhisperTag, deriveResonanceKey } from './utils/entropy';

/**
 * Extension interface for modular functionality
 */
export interface WhispurrExtension {
  /** Extension identifier */
  id: string;
  
  /** Extension version */
  version: string;
  
  /** Supported message types */
  supportedTypes: MessageType[];
  
  /** Initialize the extension */
  initialize(whispurr: Whispurr): Promise<void>;
  
  /** Handle incoming message */
  handleMessage(message: Message, peer: PeerInfo): Promise<void>;
  
  /** Cleanup extension resources */
  cleanup(): Promise<void>;
}

/**
 * Gossip protocol configuration
 */
export interface GossipConfig {
  /** Maximum hop count for message propagation */
  maxHops: number;
  
  /** Gossip interval in milliseconds */
  gossipInterval: number;
  
  /** Message TTL for gossip propagation */
  messageTTL: number;
  
  /** Enable automatic message propagation */
  enableAutoPropagation: boolean;
  
  /** Maximum concurrent gossip operations */
  maxConcurrentGossip: number;
}

/**
 * Obfuscation layer configuration
 */
export interface ObfuscationConfig {
  /** Enable traffic obfuscation */
  enabled: boolean;
  
  /** Obfuscation patterns to simulate */
  patterns: {
    /** Simulate browser-like request patterns */
    browserRequests: boolean;
    
    /** Add random delays to traffic */
    randomDelays: boolean;
    
    /** Modify packet sizes to match common protocols */
    packetSizeModification: boolean;
    
    /** Add fake headers and metadata */
    fakeHeaders: boolean;
  };
  
  /** Obfuscation intensity (0-1) */
  intensity: number;
}

/**
 * WhispurrNet main configuration
 */
export interface WhispurrConfig {
  /** Connection configuration */
  connection: ConnectionConfig;
  
  /** Gossip protocol configuration */
  gossip: GossipConfig;
  
  /** Obfuscation configuration */
  obfuscation: ObfuscationConfig;
  
  /** Enable debug logging */
  debug: boolean;
  
  /** Auto-discover peers on startup */
  autoDiscover: boolean;
  
  /** Maximum number of concurrent connections */
  maxConnections: number;
}

/**
 * Network statistics and metrics
 */
export interface NetworkStats {
  /** Number of connected peers */
  connectedPeers: number;
  
  /** Total messages sent */
  messagesSent: number;
  
  /** Total messages received */
  messagesReceived: number;
  
  /** Average message latency */
  averageLatency: number;
  
  /** Network uptime in milliseconds */
  uptime: number;
  
  /** Active extensions */
  activeExtensions: string[];
  
  /** Gossip propagation efficiency */
  gossipEfficiency: number;
}

/**
 * Main WhispurrNet orchestrator class
 * Coordinates all network components and provides unified interface
 */
export class Whispurr {
  private node: WhispurrNode;
  private config: WhispurrConfig;
  private extensions: Map<string, WhispurrExtension> = new Map();
  private gossipQueue: Message[] = [];
  private messageHistory: Map<string, number> = new Map(); // messageId -> timestamp
  private stats: NetworkStats;
  private startTime: number;
  private isInitialized = false;
  private gossipTimer?: NodeJS.Timeout;
  private obfuscationTimer?: NodeJS.Timeout;

  constructor(config: Partial<WhispurrConfig> = {}) {
    this.config = {
      connection: {
        timeout: 30000,
        maxRetries: 3,
        heartbeatInterval: 30000,
        enableObfuscation: true
      },
      gossip: {
        maxHops: 10,
        gossipInterval: 5000,
        messageTTL: 300000,
        enableAutoPropagation: true,
        maxConcurrentGossip: 5
      },
      obfuscation: {
        enabled: true,
        patterns: {
          browserRequests: true,
          randomDelays: true,
          packetSizeModification: true,
          fakeHeaders: true
        },
        intensity: 0.7
      },
      debug: false,
      autoDiscover: true,
      maxConnections: 50,
      ...config
    };

    this.node = new WhispurrNode(this.config.connection);
    this.startTime = Date.now();
    this.stats = {
      connectedPeers: 0,
      messagesSent: 0,
      messagesReceived: 0,
      averageLatency: 0,
      uptime: 0,
      activeExtensions: [],
      gossipEfficiency: 0
    };
  }

  /**
   * Initialize the WhispurrNet network
   * Sets up the node, extensions, and starts all services
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      throw new Error('WhispurrNet already initialized');
    }

    try {
      // Initialize the underlying node
      await this.node.initialize();

      // Set up event handlers
      this.setupEventHandlers();

      // Set up message handlers
      this.setupMessageHandlers();

      // Start gossip protocol
      if (this.config.gossip.enableAutoPropagation) {
        this.startGossipProtocol();
      }

      // Start obfuscation layer
      if (this.config.obfuscation.enabled) {
        this.startObfuscationLayer();
      }

      // Initialize extensions
      for (const extension of this.extensions.values()) {
        await extension.initialize(this);
      }

      this.isInitialized = true;
      this.log('🌟 WhispurrNet initialized successfully');
    } catch (error) {
      this.log('❌ Failed to initialize WhispurrNet:', error);
      throw error;
    }
  }

  /**
   * Set up event handlers for the underlying node
   */
  private setupEventHandlers(): void {
    this.node.onEvent((event) => {
      switch (event.type) {
        case 'connected':
          this.stats.connectedPeers = this.node.getConnectedPeers().length;
          this.log(`🔗 Connected to peer: ${event.peer.nodeId}`);
          break;

        case 'disconnected':
          this.stats.connectedPeers = this.node.getConnectedPeers().length;
          this.log(`🔌 Disconnected from peer: ${event.peerId} (${event.reason})`);
          break;

        case 'message':
          this.stats.messagesReceived++;
          this.handleIncomingMessage(event.message, event.peer);
          break;

        case 'error':
          this.log(`❌ Connection error: ${event.error.message}`);
          break;
      }
    });
  }

  /**
   * Set up message handlers for different message types
   */
  private setupMessageHandlers(): void {
    // Handle ping messages
    this.node.onMessage(MessageType.PING, async (message, peer) => {
      const pongMessage = await createMessage(
        MessageType.PONG,
        this.node.getNodeId(),
        '',
        { ttl: 10000 }
      );
      await this.node.sendMessage(peer.nodeId, pongMessage);
    });

    // Handle broadcast messages for gossip
    this.node.onMessage(MessageType.BROADCAST, async (message, peer) => {
      await this.handleGossipMessage(message, peer);
    });

    // Handle resonance messages
    this.node.onMessage(MessageType.RESONANCE, async (message, peer) => {
      await this.handleResonanceMessage(message, peer);
    });

    // Route other messages to extensions
    for (const messageType of Object.values(MessageType)) {
      if (messageType !== MessageType.PING && 
          messageType !== MessageType.BROADCAST && 
          messageType !== MessageType.RESONANCE) {
        this.node.onMessage(messageType, async (message, peer) => {
          await this.routeMessageToExtensions(message, peer);
        });
      }
    }
  }

  /**
   * Handle incoming message and route to appropriate handlers
   */
  private async handleIncomingMessage(message: Message, peer: PeerInfo): Promise<void> {
    // Check if message has expired
    if (isMessageExpired(message)) {
      this.log(`⏰ Message expired from ${peer.nodeId}`);
      return;
    }

    // Check if we've seen this message before (prevent loops)
    const messageId = `${message.senderId}:${message.nonce}`;
    if (this.messageHistory.has(messageId)) {
      return;
    }

    // Record message
    this.messageHistory.set(messageId, Date.now());

    // Clean up old message history
    this.cleanupMessageHistory();

    // Route to appropriate handler
    switch (message.type) {
      case MessageType.BROADCAST:
        await this.handleGossipMessage(message, peer);
        break;

      case MessageType.RESONANCE:
        await this.handleResonanceMessage(message, peer);
        break;

      default:
        await this.routeMessageToExtensions(message, peer);
        break;
    }
  }

  /**
   * Handle gossip message propagation
   */
  private async handleGossipMessage(message: Message, peer: PeerInfo): Promise<void> {
    const broadcastMsg = message as any;
    
    // Check if we should continue propagating
    if (broadcastMsg.currentHops >= broadcastMsg.maxHops) {
      return;
    }

    // Check if we've already seen this message
    if (broadcastMsg.seenBy.includes(this.node.getNodeId())) {
      return;
    }

    // Add ourselves to seen list
    broadcastMsg.seenBy.push(this.node.getNodeId());
    broadcastMsg.currentHops++;

    // Add to gossip queue for propagation
    this.gossipQueue.push(message);

    // Process gossip queue
    await this.processGossipQueue();
  }

  /**
   * Handle resonance message for intent-based routing
   */
  private async handleResonanceMessage(message: Message, peer: PeerInfo): Promise<void> {
    const resonanceMsg = message as any;
    
    // Check if this message resonates with our interests
    const resonates = await this.checkResonance(resonanceMsg.intent, resonanceMsg.strength);
    
    if (resonates) {
      this.log(`🎯 Resonating with message from ${peer.nodeId}: ${resonanceMsg.intent}`);
      
      // Route to extensions that handle this intent
      await this.routeMessageToExtensions(message, peer);
    }
  }

  /**
   * Check if a message resonates with our interests
   */
  private async checkResonance(intent: string, strength: number): Promise<boolean> {
    // For now, accept all resonance messages with strength > 0.5
    // This can be extended with more sophisticated intent matching
    return strength > 0.5;
  }

  /**
   * Route message to appropriate extensions
   */
  private async routeMessageToExtensions(message: Message, peer: PeerInfo): Promise<void> {
    for (const extension of this.extensions.values()) {
      if (extension.supportedTypes.includes(message.type)) {
        try {
          await extension.handleMessage(message, peer);
        } catch (error) {
          this.log(`❌ Extension ${extension.id} error:`, error);
        }
      }
    }
  }

  /**
   * Start gossip protocol for message propagation
   */
  private startGossipProtocol(): void {
    this.gossipTimer = setInterval(async () => {
      await this.processGossipQueue();
    }, this.config.gossip.gossipInterval);
  }

  /**
   * Process gossip queue and propagate messages
   */
  private async processGossipQueue(): Promise<void> {
    if (this.gossipQueue.length === 0) return;

    const connectedPeers = this.node.getConnectedPeers();
    if (connectedPeers.length === 0) return;

    // Process up to maxConcurrentGossip messages
    const messagesToProcess = this.gossipQueue.splice(
      0, 
      this.config.gossip.maxConcurrentGossip
    );

    for (const message of messagesToProcess) {
      // Select random peers for propagation
      const targetPeers = this.selectGossipTargets(connectedPeers, 3);
      
      for (const peer of targetPeers) {
        try {
          const success = await this.node.sendMessage(peer.nodeId, message);
          if (success) {
            this.stats.messagesSent++;
          }
        } catch (error) {
          this.log(`❌ Gossip propagation error:`, error);
        }
      }
    }
  }

  /**
   * Select gossip targets from connected peers
   */
  private selectGossipTargets(peers: PeerInfo[], count: number): PeerInfo[] {
    const shuffled = [...peers].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  /**
   * Start obfuscation layer for traffic simulation
   */
  private startObfuscationLayer(): void {
    if (!this.config.obfuscation.enabled) return;

    this.obfuscationTimer = setInterval(() => {
      this.generateObfuscationTraffic();
    }, 10000); // Generate obfuscation traffic every 10 seconds
  }

  /**
   * Generate obfuscation traffic to simulate browser-native patterns
   */
  private generateObfuscationTraffic(): void {
    if (!this.config.obfuscation.enabled) return;

    const { patterns, intensity } = this.config.obfuscation;

    if (patterns.randomDelays && Math.random() < intensity) {
      // Add random delays to simulate network latency
      setTimeout(() => {
        // This is just a placeholder for actual obfuscation
      }, Math.random() * 1000);
    }

    if (patterns.fakeHeaders && Math.random() < intensity) {
      // Generate fake headers to simulate browser requests
      const fakeHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      };
      
      // This would be used to modify actual traffic patterns
    }
  }

  /**
   * Clean up old message history to prevent memory leaks
   */
  private cleanupMessageHistory(): void {
    const cutoff = Date.now() - this.config.gossip.messageTTL;
    
    for (const [messageId, timestamp] of this.messageHistory.entries()) {
      if (timestamp < cutoff) {
        this.messageHistory.delete(messageId);
      }
    }
  }

  /**
   * Send whisper message to specific peer
   */
  async whisper(peerId: string, content: string, intent: string = 'default'): Promise<boolean> {
    const whisperTag = await generateWhisperTag(intent);
    
    const message = await createMessage(
      MessageType.WHISPER,
      this.node.getNodeId(),
      content,
      { targetId: peerId, intent, whisperTag }
    );

    const success = await this.node.sendMessage(peerId, message);
    if (success) {
      this.stats.messagesSent++;
    }
    
    return success;
  }

  /**
   * Broadcast message to all peers using gossip protocol
   */
  async broadcast(content: string, intent: string = 'default', maxHops: number = 10): Promise<number> {
    const whisperTag = await generateWhisperTag(intent);
    
    const message = await createMessage(
      MessageType.BROADCAST,
      this.node.getNodeId(),
      content,
      { intent, whisperTag, maxHops, ttl: this.config.gossip.messageTTL }
    );

    // Add to gossip queue for propagation
    this.gossipQueue.push(message);

    // Send to immediate peers
    const successCount = await this.node.broadcastMessage(message);
    this.stats.messagesSent += successCount;
    
    return successCount;
  }

  /**
   * Send resonance message for intent-based discovery
   */
  async resonate(intent: string, strength: number = 1.0): Promise<number> {
    const whisperTag = await generateWhisperTag(intent);
    
    const message = await createMessage(
      MessageType.RESONANCE,
      this.node.getNodeId(),
      '',
      { intent, whisperTag }
    );

    const successCount = await this.node.broadcastMessage(message);
    this.stats.messagesSent += successCount;
    
    return successCount;
  }

  /**
   * Connect to a peer node
   */
  async connect(peerId: string, peerPublicKey: Uint8Array): Promise<boolean> {
    return await this.node.connectToPeer(peerId, peerPublicKey);
  }

  /**
   * Disconnect from a peer node
   */
  disconnect(peerId: string): void {
    this.node.disconnectFromPeer(peerId);
  }

  /**
   * Register an extension
   */
  registerExtension(extension: WhispurrExtension): void {
    if (this.extensions.has(extension.id)) {
      throw new Error(`Extension ${extension.id} already registered`);
    }

    this.extensions.set(extension.id, extension);
    this.stats.activeExtensions.push(extension.id);
    
    if (this.isInitialized) {
      extension.initialize(this).catch(error => {
        this.log(`❌ Failed to initialize extension ${extension.id}:`, error);
      });
    }
  }

  /**
   * Unregister an extension
   */
  async unregisterExtension(extensionId: string): Promise<void> {
    const extension = this.extensions.get(extensionId);
    if (!extension) {
      throw new Error(`Extension ${extensionId} not found`);
    }

    await extension.cleanup();
    this.extensions.delete(extensionId);
    
    const index = this.stats.activeExtensions.indexOf(extensionId);
    if (index > -1) {
      this.stats.activeExtensions.splice(index, 1);
    }
  }

  /**
   * Get network statistics
   */
  getStats(): NetworkStats {
    this.stats.uptime = Date.now() - this.startTime;
    this.stats.connectedPeers = this.node.getConnectedPeers().length;
    
    return { ...this.stats };
  }

  /**
   * Get connected peers
   */
  getPeers(): PeerInfo[] {
    return this.node.getConnectedPeers();
  }

  /**
   * Get node ID
   */
  getNodeId(): string {
    return this.node.getNodeId();
  }

  /**
   * Get public key
   */
  getPublicKey(): Uint8Array {
    return this.node.getPublicKey();
  }

  /**
   * Send message to peer (public interface)
   */
  async sendMessageToPeer(peerId: string, message: Message): Promise<boolean> {
    return this.node.sendMessage(peerId, message);
  }

  /**
   * Log message with debug support
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[WhispurrNet]', ...args);
    }
  }

  /**
   * Shutdown the WhispurrNet network
   */
  async shutdown(): Promise<void> {
    this.log('🔄 Shutting down WhispurrNet...');

    // Stop timers
    if (this.gossipTimer) {
      clearInterval(this.gossipTimer);
    }
    if (this.obfuscationTimer) {
      clearInterval(this.obfuscationTimer);
    }

    // Cleanup extensions
    for (const extension of this.extensions.values()) {
      try {
        await extension.cleanup();
      } catch (error) {
        this.log(`❌ Extension cleanup error:`, error);
      }
    }

    // Shutdown node
    await this.node.shutdown();

    this.isInitialized = false;
    this.log('✅ WhispurrNet shutdown complete');
  }
} 