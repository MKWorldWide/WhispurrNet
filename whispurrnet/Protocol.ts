/**
 * 📡 Protocol & Message Handling Module
 * 
 * This module defines the message types, resonance tagging system, and protocol
 * structures for the WhispurrNet P2P communication layer.
 * 
 * Features:
 * - Message type definitions and validation
 * - Resonance key-based message routing
 * - Whisper tag categorization system
 * - Protocol versioning and compatibility
 * - Message serialization and deserialization
 * 
 * Security Considerations:
 * - Zero metadata leakage in message structure
 * - Intent-driven message routing
 * - Encrypted payload handling
 * - Protocol version validation
 * 
 * Performance: O(1) for message validation, O(n) for serialization
 * Dependencies: entropy.ts, Web Crypto API
 */

import { deriveResonanceKey, generateWhisperTag } from './utils/entropy';

/**
 * Protocol version for compatibility checking
 * Format: major.minor.patch
 */
export const PROTOCOL_VERSION = '1.0.0';

/**
 * Message types for different communication patterns
 */
export enum MessageType {
  // Core protocol messages
  WHISPER = 'whisper',           // Direct encrypted message
  BROADCAST = 'broadcast',       // Gossip-style propagation
  RESONANCE = 'resonance',       // Intent-based routing
  PING = 'ping',                 // Connection health check
  PONG = 'pong',                 // Connection health response
  
  // Extension messages
  FILE_SYNC = 'file_sync',       // File synchronization
  MINING_SIGNAL = 'mining_signal', // Mining coordination
  DREAMSPACE = 'dreamspace',     // Dreamspace burst data
  
  // System messages
  HELLO = 'hello',               // Initial handshake
  GOODBYE = 'goodbye',           // Graceful disconnect
  ERROR = 'error'                // Error notification
}

/**
 * Base message structure for all protocol messages
 * Designed for zero metadata leakage and intent-driven routing
 */
export interface BaseMessage {
  /** Message type for routing and handling */
  type: MessageType;
  
  /** Ephemeral sender node ID */
  senderId: string;
  
  /** Resonance key for intent-based routing */
  resonanceKey: Uint8Array;
  
  /** Whisper tag for message categorization */
  whisperTag: string;
  
  /** Encrypted payload (base64 encoded) */
  payload: string;
  
  /** Message timestamp for TTL and ordering */
  timestamp: number;
  
  /** Protocol version for compatibility */
  version: string;
  
  /** Message TTL in milliseconds */
  ttl: number;
  
  /** Nonce for replay protection */
  nonce: string;
}

/**
 * Whisper message for direct encrypted communication
 */
export interface WhisperMessage extends BaseMessage {
  type: MessageType.WHISPER;
  /** Target node ID for direct delivery */
  targetId: string;
}

/**
 * Broadcast message for gossip-style propagation
 */
export interface BroadcastMessage extends BaseMessage {
  type: MessageType.BROADCAST;
  /** Maximum hop count for propagation */
  maxHops: number;
  /** Current hop count */
  currentHops: number;
  /** List of nodes that have seen this message */
  seenBy: string[];
}

/**
 * Resonance message for intent-based routing
 */
export interface ResonanceMessage extends BaseMessage {
  type: MessageType.RESONANCE;
  /** Intent string for routing */
  intent: string;
  /** Resonance strength (0-1) for matching */
  strength: number;
}

/**
 * File sync message for file synchronization
 */
export interface FileSyncMessage extends BaseMessage {
  type: MessageType.FILE_SYNC;
  /** File identifier */
  fileId: string;
  /** File chunk index */
  chunkIndex: number;
  /** Total chunks */
  totalChunks: number;
  /** File metadata */
  metadata: Record<string, any>;
}

/**
 * Mining signal message for coordination
 */
export interface MiningSignalMessage extends BaseMessage {
  type: MessageType.MINING_SIGNAL;
  /** Signal type */
  signalType: string;
  /** Signal data */
  signalData: Record<string, any>;
}

/**
 * Dreamspace burst message
 */
export interface DreamspaceMessage extends BaseMessage {
  type: MessageType.DREAMSPACE;
  /** Burst identifier */
  burstId: string;
  /** Burst data */
  burstData: Record<string, any>;
}

/**
 * Union type for all message types
 */
export type Message = 
  | WhisperMessage 
  | BroadcastMessage 
  | ResonanceMessage 
  | FileSyncMessage 
  | MiningSignalMessage 
  | DreamspaceMessage 
  | BaseMessage;

/**
 * Message validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate message structure and content
 * Ensures protocol compliance and security requirements
 * 
 * @param message - Message to validate
 * @returns ValidationResult - Validation status and issues
 */
export function validateMessage(message: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check required fields
  if (!message.type) errors.push('Missing message type');
  if (!message.senderId) errors.push('Missing sender ID');
  if (!message.resonanceKey) errors.push('Missing resonance key');
  if (!message.whisperTag) errors.push('Missing whisper tag');
  if (!message.payload) errors.push('Missing payload');
  if (!message.timestamp) errors.push('Missing timestamp');
  if (!message.version) errors.push('Missing version');
  if (!message.ttl) errors.push('Missing TTL');
  if (!message.nonce) errors.push('Missing nonce');
  
  // Validate message type
  if (message.type && !Object.values(MessageType).includes(message.type)) {
    errors.push(`Invalid message type: ${message.type}`);
  }
  
  // Validate timestamp
  if (message.timestamp && typeof message.timestamp !== 'number') {
    errors.push('Timestamp must be a number');
  }
  
  // Validate TTL
  if (message.ttl && (typeof message.ttl !== 'number' || message.ttl < 0)) {
    errors.push('TTL must be a positive number');
  }
  
  // Check message age
  if (message.timestamp && message.ttl) {
    const age = Date.now() - message.timestamp;
    if (age > message.ttl) {
      errors.push('Message has expired');
    }
  }
  
  // Validate protocol version
  if (message.version && message.version !== PROTOCOL_VERSION) {
    warnings.push(`Protocol version mismatch: ${message.version} vs ${PROTOCOL_VERSION}`);
  }
  
  // Type-specific validation
  if (message.type === MessageType.WHISPER && !message.targetId) {
    errors.push('Whisper message missing target ID');
  }
  
  if (message.type === MessageType.BROADCAST) {
    if (typeof message.maxHops !== 'number' || message.maxHops < 0) {
      errors.push('Broadcast message must have valid maxHops');
    }
    if (typeof message.currentHops !== 'number' || message.currentHops < 0) {
      errors.push('Broadcast message must have valid currentHops');
    }
    if (!Array.isArray(message.seenBy)) {
      errors.push('Broadcast message must have seenBy array');
    }
  }
  
  if (message.type === MessageType.RESONANCE) {
    if (!message.intent) {
      errors.push('Resonance message missing intent');
    }
    if (typeof message.strength !== 'number' || message.strength < 0 || message.strength > 1) {
      errors.push('Resonance strength must be between 0 and 1');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Create a new message with default values
 * 
 * @param type - Message type
 * @param senderId - Sender node ID
 * @param payload - Encrypted payload
 * @param options - Additional message options
 * @returns Promise<BaseMessage> - New message instance
 */
export async function createMessage(
  type: MessageType,
  senderId: string,
  payload: string,
  options: {
    intent?: string;
    whisperTag?: string;
    ttl?: number;
    targetId?: string;
    maxHops?: number;
    fileId?: string;
    chunkIndex?: number;
    totalChunks?: number;
    metadata?: Record<string, any>;
    signalType?: string;
    signalData?: Record<string, any>;
    burstId?: string;
    burstData?: Record<string, any>;
  } = {}
): Promise<BaseMessage> {
  const intent = options.intent || 'default';
  const resonanceKey = await deriveResonanceKey(intent);
  const whisperTag = options.whisperTag || await generateWhisperTag(intent);
  
  const baseMessage: BaseMessage = {
    type,
    senderId,
    resonanceKey,
    whisperTag,
    payload,
    timestamp: Date.now(),
    version: PROTOCOL_VERSION,
    ttl: options.ttl || 300000, // 5 minutes default
    nonce: crypto.randomUUID()
  };
  
  // Add type-specific fields
  switch (type) {
    case MessageType.WHISPER:
      return {
        ...baseMessage,
        targetId: options.targetId!
      } as WhisperMessage;
      
    case MessageType.BROADCAST:
      return {
        ...baseMessage,
        maxHops: options.maxHops || 10,
        currentHops: 0,
        seenBy: [senderId]
      } as BroadcastMessage;
      
    case MessageType.RESONANCE:
      return {
        ...baseMessage,
        intent,
        strength: 1.0
      } as ResonanceMessage;
      
    case MessageType.FILE_SYNC:
      return {
        ...baseMessage,
        fileId: options.fileId!,
        chunkIndex: options.chunkIndex || 0,
        totalChunks: options.totalChunks || 1,
        metadata: options.metadata || {}
      } as FileSyncMessage;
      
    case MessageType.MINING_SIGNAL:
      return {
        ...baseMessage,
        signalType: options.signalType!,
        signalData: options.signalData || {}
      } as MiningSignalMessage;
      
    case MessageType.DREAMSPACE:
      return {
        ...baseMessage,
        burstId: options.burstId!,
        burstData: options.burstData || {}
      } as DreamspaceMessage;
      
    default:
      return baseMessage;
  }
}

/**
 * Serialize message to JSON string
 * Handles Uint8Array conversion for transmission
 * 
 * @param message - Message to serialize
 * @returns string - JSON string representation
 */
export function serializeMessage(message: Message): string {
  const serialized = {
    ...message,
    resonanceKey: Array.from(message.resonanceKey)
  };
  
  return JSON.stringify(serialized);
}

/**
 * Deserialize message from JSON string
 * Converts arrays back to Uint8Array for resonance keys
 * 
 * @param json - JSON string to deserialize
 * @returns Message - Deserialized message
 */
export function deserializeMessage(json: string): Message {
  const parsed = JSON.parse(json);
  
  // Convert resonance key back to Uint8Array
  if (parsed.resonanceKey && Array.isArray(parsed.resonanceKey)) {
    parsed.resonanceKey = new Uint8Array(parsed.resonanceKey);
  }
  
  return parsed as Message;
}

/**
 * Check if message matches resonance criteria
 * Used for intent-based message filtering
 * 
 * @param message - Message to check
 * @param targetIntent - Target intent string
 * @param minStrength - Minimum resonance strength (0-1)
 * @returns boolean - True if message matches criteria
 */
export function matchesResonance(
  message: Message,
  targetIntent: string,
  minStrength: number = 0.5
): boolean {
  if (message.type !== MessageType.RESONANCE) return false;
  
  const resonanceMsg = message as ResonanceMessage;
  
  // Check intent match
  if (resonanceMsg.intent !== targetIntent) return false;
  
  // Check strength threshold
  if (resonanceMsg.strength < minStrength) return false;
  
  return true;
}

/**
 * Check if message has expired based on TTL
 * 
 * @param message - Message to check
 * @returns boolean - True if message has expired
 */
export function isMessageExpired(message: Message): boolean {
  const age = Date.now() - message.timestamp;
  return age > message.ttl;
}

/**
 * Get message age in milliseconds
 * 
 * @param message - Message to check
 * @returns number - Age in milliseconds
 */
export function getMessageAge(message: Message): number {
  return Date.now() - message.timestamp;
} 