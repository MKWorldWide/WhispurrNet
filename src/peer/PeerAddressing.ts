/**
 * Peer Addressing Utilities for WhispurrNet
 * 
 * This module provides utilities for generating and managing peer IDs,
 * as well as handling peer addressing in the network.
 */

export interface PeerInfo {
  nodeId: string;
  publicKey?: Uint8Array;
  addresses: string[];
  lastSeen?: number;
  metadata?: Record<string, any>;
}

export class PeerAddressing {
  /**
   * Generate a new peer ID
   * @param publicKey Optional public key to derive the ID from
   * @returns A unique peer ID string
   */
  static generatePeerId(publicKey?: Uint8Array): string {
    // If we have a public key, use its hash as the ID
    if (publicKey && publicKey.length > 0) {
      const hash = this.sha256(publicKey);
      return this.bytesToHex(hash).substring(0, 32);
    }
    
    // Otherwise generate a random ID
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);
    return this.bytesToHex(randomBytes);
  }
  
  /**
   * Generate a connection ID for a peer connection
   * @param peerId The peer's ID
   * @returns A connection ID string
   */
  static generateConnectionId(peerId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6);
    return `conn-${timestamp}-${random}-${peerId.substring(0, 6)}`;
  }
  
  /**
   * Parse a connection ID into its components
   * @param connectionId The connection ID to parse
   * @returns An object containing the timestamp and peer ID
   */
  static parseConnectionId(connectionId: string): { timestamp: number; peerId: string } | null {
    const match = connectionId.match(/^conn-(\d+)-[a-z0-9]+-([a-f0-9]{6})/i);
    if (!match) return null;
    
    return {
      timestamp: parseInt(match[1], 10),
      peerId: match[2]
    };
  }
  
  /**
   * Generate a node ID from a public key
   * @param publicKey The public key to generate the ID from
   * @returns A node ID string
   */
  static generateNodeId(publicKey: Uint8Array): string {
    const hash = this.sha256(publicKey);
    const timestamp = Math.floor(Date.now() / 1000).toString(16);
    return `${this.bytesToHex(hash).substring(0, 32)}:${timestamp}`;
  }
  
  /**
   * Check if a node ID is valid
   * @param nodeId The node ID to validate
   * @returns True if the node ID is valid, false otherwise
   */
  static isValidNodeId(nodeId: string): boolean {
    return /^[a-f0-9]{32}:[a-f0-9]+$/i.test(nodeId);
  }
  
  /**
   * Parse a node ID into its components
   * @param nodeId The node ID to parse
   * @returns An object containing the hash and timestamp
   */
  static parseNodeId(nodeId: string): { hash: string; timestamp: number } | null {
    if (!this.isValidNodeId(nodeId)) return null;
    
    const [hash, timestamp] = nodeId.split(':');
    return {
      hash,
      timestamp: parseInt(timestamp, 16)
    };
  }
  
  /**
   * Generate a SHA-256 hash of the input data
   * @param data The data to hash
   * @returns A promise that resolves to the hash as a Uint8Array
   */
  private static async sha256(data: Uint8Array): Promise<Uint8Array> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hashBuffer);
  }
  
  /**
   * Convert a Uint8Array to a hex string
   * @param bytes The bytes to convert
   * @returns A hex string
   */
  private static bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  /**
   * Generate a peer info object
   * @param addresses The peer's addresses
   * @param publicKey Optional public key
   * @returns A PeerInfo object
   */
  static createPeerInfo(addresses: string[], publicKey?: Uint8Array): PeerInfo {
    const nodeId = publicKey 
      ? this.generateNodeId(publicKey)
      : this.generatePeerId();
    
    return {
      nodeId,
      publicKey,
      addresses,
      lastSeen: Date.now(),
      metadata: {}
    };
  }
}

// Export types and utilities
export const PEER_PROTOCOL_VERSION = '1.0.0';
export const PEER_MESSAGE_TYPES = {
  PING: 'ping',
  PONG: 'pong',
  HELLO: 'hello',
  WELCOME: 'welcome',
  MESSAGE: 'message',
  DISCONNECT: 'disconnect'
} as const;

export type PeerMessageType = typeof PEER_MESSAGE_TYPES[keyof typeof PEER_MESSAGE_TYPES];

export interface PeerMessage {
  type: PeerMessageType;
  senderId: string;
  timestamp: string;
  payload?: any;
  metadata?: Record<string, any>;
}
