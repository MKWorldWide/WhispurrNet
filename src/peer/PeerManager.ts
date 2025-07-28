import { PeerAddressing, PeerInfo, PeerMessage, PEER_MESSAGE_TYPES, PeerMessageType } from './PeerAddressing';
import { EventEmitter } from 'events';

export interface PeerManagerOptions {
  nodeId: string;
  publicKey?: Uint8Array;
  addresses?: string[];
  maxPeers?: number;
  connectionTimeout?: number;
  pingInterval?: number;
}

export interface PeerConnection extends PeerInfo {
  connectionId: string;
  connected: boolean;
  lastPing?: number;
  latency?: number;
  connectionTime?: number;
  transport?: any; // WebSocket or other transport
}

export class PeerManager extends EventEmitter {
  private nodeId: string;
  private publicKey?: Uint8Array;
  private addresses: string[];
  private maxPeers: number;
  private connectionTimeout: number;
  private pingInterval: number;
  private peers: Map<string, PeerConnection>;
  private pingTimer?: NodeJS.Timeout;
  private isRunning: boolean;

  constructor(options: PeerManagerOptions) {
    super();
    this.nodeId = options.nodeId;
    this.publicKey = options.publicKey;
    this.addresses = options.addresses || [];
    this.maxPeers = options.maxPeers || 100;
    this.connectionTimeout = options.connectionTimeout || 30000; // 30 seconds
    this.pingInterval = options.pingInterval || 30000; // 30 seconds
    this.peers = new Map();
    this.isRunning = false;
  }

  /**
   * Start the peer manager
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // Start periodic ping to connected peers
    this.pingTimer = setInterval(() => this.pingPeers(), this.pingInterval);
    
    this.emit('started');
  }

  /**
   * Stop the peer manager
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    // Clear the ping timer
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = undefined;
    }
    
    // Disconnect from all peers
    await Promise.all(
      Array.from(this.peers.values())
        .filter(peer => peer.connected)
        .map(peer => this.disconnect(peer.nodeId))
    );
    
    this.emit('stopped');
  }

  /**
   * Add or update a peer
   */
  addPeer(peerInfo: PeerInfo, transport?: any): PeerConnection {
    const existingPeer = this.peers.get(peerInfo.nodeId);
    
    if (existingPeer) {
      // Update existing peer
      const updatedPeer: PeerConnection = {
        ...existingPeer,
        ...peerInfo,
        lastSeen: Date.now(),
        connected: transport ? true : existingPeer.connected,
        transport: transport || existingPeer.transport
      };
      
      this.peers.set(peerInfo.nodeId, updatedPeer);
      this.emit('peer:updated', updatedPeer);
      return updatedPeer;
    } else {
      // Add new peer
      if (this.peers.size >= this.maxPeers) {
        // Evict the least recently seen peer
        const oldestPeer = Array.from(this.peers.values())
          .sort((a, b) => (a.lastSeen || 0) - (b.lastSeen || 0))[0];
        
        if (oldestPeer) {
          this.disconnect(oldestPeer.nodeId);
          this.peers.delete(oldestPeer.nodeId);
        }
      }
      
      const newPeer: PeerConnection = {
        ...peerInfo,
        connectionId: PeerAddressing.generateConnectionId(peerInfo.nodeId),
        connected: !!transport,
        connectionTime: Date.now(),
        lastSeen: Date.now(),
        transport
      };
      
      this.peers.set(peerInfo.nodeId, newPeer);
      this.emit('peer:added', newPeer);
      return newPeer;
    }
  }

  /**
   * Remove a peer
   */
  removePeer(nodeId: string): boolean {
    const peer = this.peers.get(nodeId);
    if (!peer) return false;
    
    if (peer.connected && peer.transport) {
      this.disconnect(nodeId);
    }
    
    this.peers.delete(nodeId);
    this.emit('peer:removed', peer);
    return true;
  }

  /**
   * Get a peer by node ID
   */
  getPeer(nodeId: string): PeerConnection | undefined {
    return this.peers.get(nodeId);
  }

  /**
   * Get all peers
   */
  getPeers(connectedOnly: boolean = false): PeerConnection[] {
    const peers = Array.from(this.peers.values());
    return connectedOnly ? peers.filter(p => p.connected) : peers;
  }

  /**
   * Connect to a peer
   */
  async connect(peerInfo: PeerInfo, transport?: any): Promise<PeerConnection> {
    if (peerInfo.nodeId === this.nodeId) {
      throw new Error('Cannot connect to self');
    }
    
    const existingPeer = this.peers.get(peerInfo.nodeId);
    if (existingPeer?.connected) {
      return existingPeer;
    }
    
    const peer = this.addPeer(peerInfo, transport);
    
    try {
      // If no transport is provided, create a new WebSocket connection
      if (!transport && peerInfo.addresses?.length) {
        // Implementation for WebSocket connection would go here
        // For now, we'll just mark as connected
        peer.connected = true;
        peer.lastSeen = Date.now();
      }
      
      this.emit('peer:connected', peer);
      return peer;
    } catch (error) {
      this.emit('peer:error', peer, error);
      throw error;
    }
  }

  /**
   * Disconnect from a peer
   */
  async disconnect(nodeId: string, reason: string = 'Disconnected'): Promise<boolean> {
    const peer = this.peers.get(nodeId);
    if (!peer || !peer.connected) return false;
    
    try {
      if (peer.transport) {
        // Close the transport connection
        if (typeof peer.transport.close === 'function') {
          await peer.transport.close(1000, reason);
        } else if (typeof peer.transport.terminate === 'function') {
          peer.transport.terminate();
        }
      }
      
      peer.connected = false;
      peer.transport = undefined;
      
      this.emit('peer:disconnected', peer, reason);
      return true;
    } catch (error) {
      this.emit('peer:error', peer, error);
      return false;
    }
  }

  /**
   * Send a message to a peer
   */
  async sendMessage(nodeId: string, message: PeerMessage): Promise<boolean> {
    const peer = this.peers.get(nodeId);
    if (!peer?.connected || !peer.transport) {
      throw new Error(`Peer ${nodeId} is not connected`);
    }
    
    try {
      // Ensure message has required fields
      const fullMessage: PeerMessage = {
        ...message,
        senderId: this.nodeId,
        timestamp: new Date().toISOString(),
      };
      
      // Send the message via the transport
      if (typeof peer.transport.send === 'function') {
        await peer.transport.send(JSON.stringify(fullMessage));
      } else if (typeof peer.transport.sendMessage === 'function') {
        await peer.transport.sendMessage(fullMessage);
      } else {
        throw new Error('Transport does not support sending messages');
      }
      
      return true;
    } catch (error) {
      this.emit('peer:error', peer, error);
      return false;
    }
  }

  /**
   * Handle an incoming message from a peer
   */
  handleIncomingMessage(peerId: string, rawMessage: string): void {
    const peer = this.peers.get(peerId);
    if (!peer) {
      this.emit('message:unroutable', { peerId, rawMessage });
      return;
    }
    
    try {
      const message = JSON.parse(rawMessage) as PeerMessage;
      
      // Update peer's last seen timestamp
      peer.lastSeen = Date.now();
      
      // Handle ping/pong messages
      if (message.type === PEER_MESSAGE_TYPES.PING) {
        this.sendPong(peerId, message);
        return;
      } else if (message.type === PEER_MESSAGE_TYPES.PONG) {
        this.handlePong(peerId, message);
        return;
      }
      
      // Emit the message event
      this.emit('message', { peer, message });
    } catch (error) {
      this.emit('message:error', { peer, rawMessage, error });
    }
  }

  /**
   * Ping all connected peers
   */
  private async pingPeers(): Promise<void> {
    if (!this.isRunning) return;
    
    const now = Date.now();
    const pingPromises: Promise<void>[] = [];
    
    for (const [nodeId, peer] of this.peers) {
      if (!peer.connected) continue;
      
      // Skip if we've pinged recently
      if (peer.lastPing && now - peer.lastPing < this.pingInterval) continue;
      
      pingPromises.push(this.sendPing(nodeId));
    }
    
    await Promise.allSettled(pingPromises);
  }

  /**
   * Send a ping to a peer
   */
  private async sendPing(nodeId: string): Promise<void> {
    const peer = this.peers.get(nodeId);
    if (!peer?.connected) return;
    
    const pingId = Date.now().toString();
    peer.lastPing = Date.now();
    
    try {
      await this.sendMessage(nodeId, {
        type: PEER_MESSAGE_TYPES.PING,
        senderId: this.nodeId,
        timestamp: new Date().toISOString(),
        payload: { pingId }
      });
    } catch (error) {
      this.emit('peer:error', peer, error);
    }
  }

  /**
   * Send a pong in response to a ping
   */
  private async sendPong(nodeId: string, pingMessage: PeerMessage): Promise<void> {
    try {
      await this.sendMessage(nodeId, {
        type: PEER_MESSAGE_TYPES.PONG,
        senderId: this.nodeId,
        timestamp: new Date().toISOString(),
        payload: {
          pingId: pingMessage.payload?.pingId,
          timestamp: pingMessage.timestamp
        }
      });
    } catch (error) {
      const peer = this.peers.get(nodeId);
      if (peer) {
        this.emit('peer:error', peer, error);
      }
    }
  }

  /**
   * Handle a pong message
   */
  private handlePong(nodeId: string, pongMessage: PeerMessage): void {
    const peer = this.peers.get(nodeId);
    if (!peer) return;
    
    const now = Date.now();
    const pingTimestamp = new Date(pongMessage.payload?.timestamp || 0).getTime();
    
    if (pingTimestamp) {
      peer.latency = now - pingTimestamp;
      this.emit('peer:latency', peer, peer.latency);
    }
    
    this.emit('peer:pong', peer, pongMessage);
  }
}
