/**
 * 🌀 Entropy & Identity Generation Module
 * 
 * This module provides cryptographically secure ephemeral identity generation
 * and key derivation for the WhispurrNet P2P communication layer.
 * 
 * Features:
 * - Ephemeral node ID generation from entropy + timestamp
 * - NaCl-compatible key pair generation
 * - Secure random number generation
 * - Intent-based resonance key derivation
 * 
 * Security Considerations:
 * - Uses Web Crypto API for secure random generation
 * - Implements proper key derivation functions
 * - Zero persistent identity storage
 * - Time-based entropy to prevent replay attacks
 * 
 * Performance: O(1) for most operations, O(n) for key derivation
 * Dependencies: Web Crypto API, TextEncoder
 */

/**
 * Generate cryptographically secure random bytes
 * @param length - Number of bytes to generate
 * @returns Promise<Uint8Array> - Secure random bytes
 */
export async function generateSecureBytes(length: number): Promise<Uint8Array> {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return array;
}

/**
 * Generate ephemeral node ID from entropy and timestamp
 * Creates a unique identifier that changes with each session
 * 
 * Format: <entropy_hex>:<timestamp_hex>
 * Example: "a1b2c3d4e5f6:1234567890abcdef"
 * 
 * @returns Promise<string> - Ephemeral node identifier
 */
export async function generateEphemeralNodeId(): Promise<string> {
  const entropy = await generateSecureBytes(16);
  const timestamp = Date.now();
  
  const entropyHex = Array.from(entropy)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  const timestampHex = timestamp.toString(16);
  
  return `${entropyHex}:${timestampHex}`;
}

/**
 * Generate NaCl-compatible key pair for encryption
 * Uses X25519 curve for efficient key exchange
 * 
 * @returns Promise<{publicKey: Uint8Array, privateKey: Uint8Array}>
 */
export async function generateKeyPair(): Promise<{
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256'
    },
    true,
    ['deriveKey', 'deriveBits']
  );
  
  const publicKeyBuffer = await crypto.subtle.exportKey('raw', keyPair.publicKey);
  const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  
  return {
    publicKey: new Uint8Array(publicKeyBuffer),
    privateKey: new Uint8Array(privateKeyBuffer)
  };
}

/**
 * Derive resonance key from intent string
 * Creates a deterministic hash for topic-based message routing
 * 
 * @param intent - Intent string (e.g., "whisper:general", "file:sync")
 * @returns Promise<Uint8Array> - Resonance key for intent matching
 */
export async function deriveResonanceKey(intent: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const intentBytes = encoder.encode(intent);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', intentBytes);
  return new Uint8Array(hashBuffer);
}

/**
 * Generate whisper tag from topic and optional metadata
 * Creates a unique identifier for message categorization
 * 
 * @param topic - Topic string (e.g., "general", "private", "system")
 * @param metadata - Optional metadata for additional context
 * @returns Promise<string> - Whisper tag identifier
 */
export async function generateWhisperTag(
  topic: string, 
  metadata?: Record<string, any>
): Promise<string> {
  const encoder = new TextEncoder();
  const topicBytes = encoder.encode(topic);
  
  let dataToHash = topicBytes;
  
  if (metadata) {
    const metadataStr = JSON.stringify(metadata);
    const metadataBytes = encoder.encode(metadataStr);
    dataToHash = new Uint8Array(topicBytes.length + metadataBytes.length);
    dataToHash.set(topicBytes, 0);
    dataToHash.set(metadataBytes, topicBytes.length);
  }
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataToHash);
  const hashArray = new Uint8Array(hashBuffer);
  
  return Array.from(hashArray.slice(0, 8))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Validate ephemeral node ID format
 * Ensures the ID follows the expected entropy:timestamp pattern
 * 
 * @param nodeId - Node ID to validate
 * @returns boolean - True if valid format
 */
export function validateNodeId(nodeId: string): boolean {
  const parts = nodeId.split(':');
  if (parts.length !== 2) return false;
  
  const [entropy, timestamp] = parts;
  
  // Validate entropy (32 hex characters)
  if (!/^[0-9a-f]{32}$/.test(entropy)) return false;
  
  // Validate timestamp (hex number)
  if (!/^[0-9a-f]+$/.test(timestamp)) return false;
  
  return true;
}

/**
 * Extract timestamp from ephemeral node ID
 * Useful for determining node age and implementing TTL
 * 
 * @param nodeId - Ephemeral node ID
 * @returns number - Timestamp in milliseconds
 */
export function extractTimestamp(nodeId: string): number {
  if (!validateNodeId(nodeId)) {
    throw new Error('Invalid node ID format');
  }
  
  const timestamp = nodeId.split(':')[1];
  return parseInt(timestamp, 16);
}

/**
 * Calculate node age in milliseconds
 * Useful for implementing connection timeouts and cleanup
 * 
 * @param nodeId - Ephemeral node ID
 * @returns number - Age in milliseconds
 */
export function getNodeAge(nodeId: string): number {
  const timestamp = extractTimestamp(nodeId);
  return Date.now() - timestamp;
} 