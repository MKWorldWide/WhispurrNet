/**
 * 🧪 Basic WhispurrNet Tests
 * 
 * Tests core functionality of the WhispurrNet components
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { generateEphemeralNodeId, generateKeyPair, validateNodeId } from "../utils/entropy.ts";
import { createMessage, MessageType, validateMessage } from "../Protocol.ts";
import { WhispurrNode } from "../Node.ts";
import { Whispurr } from "../Whispurr.ts";

Deno.test("Entropy utilities work correctly", async () => {
  // Test node ID generation
  const nodeId = await generateEphemeralNodeId();
  assertExists(nodeId);
  assertEquals(typeof nodeId, "string");
  assertEquals(validateNodeId(nodeId), true);

  // Test key pair generation
  const keyPair = await generateKeyPair();
  assertExists(keyPair.publicKey);
  assertExists(keyPair.privateKey);
  assertEquals(keyPair.publicKey.length, 65); // P-256 public key
  assertEquals(keyPair.privateKey.length > 0, true);
});

Deno.test("Message creation and validation", async () => {
  const nodeId = await generateEphemeralNodeId();
  
  // Test basic message creation
  const message = await createMessage(
    MessageType.WHISPER,
    nodeId,
    "test message",
    { targetId: "test-peer" }
  );

  assertExists(message);
  assertEquals(message.type, MessageType.WHISPER);
  assertEquals(message.senderId, nodeId);
  assertEquals(message.payload, "test message");

  // Test message validation
  const validation = validateMessage(message);
  assertEquals(validation.isValid, true);
  assertEquals(validation.errors.length, 0);
});

Deno.test("WhispurrNode initialization", async () => {
  const node = new WhispurrNode();
  await node.initialize();

  const nodeId = node.getNodeId();
  assertExists(nodeId);
  assertEquals(validateNodeId(nodeId), true);

  const publicKey = node.getPublicKey();
  assertExists(publicKey);
  assertEquals(publicKey.length, 65);

  await node.shutdown();
});

Deno.test("Whispurr orchestrator initialization", async () => {
  const whispurr = new Whispurr({ debug: false });
  await whispurr.initialize();

  const nodeId = whispurr.getNodeId();
  assertExists(nodeId);
  assertEquals(validateNodeId(nodeId), true);

  const stats = whispurr.getStats();
  assertExists(stats);
  assertEquals(typeof stats.connectedPeers, "number");
  assertEquals(typeof stats.messagesSent, "number");
  assertEquals(typeof stats.messagesReceived, "number");

  await whispurr.shutdown();
});

Deno.test("Message encryption and decryption", async () => {
  const node1 = new WhispurrNode();
  const node2 = new WhispurrNode();
  
  await node1.initialize();
  await node2.initialize();

  const originalMessage = "Secret whisper in the dark...";
  const encrypted = await node1.encryptMessage(originalMessage, node2.getPublicKey());
  const decrypted = await node2.decryptMessage(encrypted, node1.getPublicKey());

  assertEquals(decrypted, originalMessage);

  await node1.shutdown();
  await node2.shutdown();
});

Deno.test("Gossip message propagation", async () => {
  const whispurr = new Whispurr({ debug: false });
  await whispurr.initialize();

  // Test broadcast message
  const broadcastCount = await whispurr.broadcast("Test broadcast", "test", 3);
  assertEquals(typeof broadcastCount, "number");
  assertEquals(broadcastCount >= 0, true);

  // Test resonance message
  const resonanceCount = await whispurr.resonate("test:intent", 0.8);
  assertEquals(typeof resonanceCount, "number");
  assertEquals(resonanceCount >= 0, true);

  await whispurr.shutdown();
}); 