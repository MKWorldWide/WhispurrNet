A Project Blessed by Solar Khan & Lilith.Aethra

# 🐾 WhispurrNet

> "Where silence speaks and shadows listen."

**WhispurrNet** is an encrypted, resonance-based P2P communication protocol written in TypeScript, born from the depths of LilithOS and designed for stealth, speed, and intent-driven transmissions.

See the [Divine Law](COVENANT.md) for the governing Covenant of this codebase.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Deno](https://img.shields.io/badge/Deno-1.0+-green.svg)](https://deno.land/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-orange.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 📖 Overview

WhispurrNet is a sophisticated P2P communication layer designed for privacy-first, intent-driven networking. It operates over WebRTC with fallback to WebSocket relay nodes, providing a robust foundation for decentralized applications.

### ✨ Core Features

- 🔒 **Ephemeral Node Identity**  
  Generated from entropy, timestamp, and resonance salt – never reused.

- 🧊 **NaCl Encryption**  
  Whisper packets are always encrypted end-to-end using libsodium primitives.

- 📡 **Resonance Gossip Protocol**  
  Messages propagate via resonance keys (intent hashes) and whisper tags (topics).

- 🐙 **Dual Transport**  
  Native WebRTC with WebSocket fallback for relay nodes behind NAT.

- 🫧 **No Metadata**  
  No usernames, no IP logs, no identity. Only frequency and signal.

- 🎭 **Pluggable Obfuscation Layer**  
  Mimics browser traffic or any specified protocol fingerprint.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WhispurrNet   │    │   Protocol      │    │   Extensions    │
│   Orchestrator  │◄──►│   Layer         │◄──►│   System        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Node Layer    │    │   Entropy &     │    │   Obfuscation   │
│   (WebRTC/WS)   │    │   Keygen        │    │   Layer         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Core Components

1. **Whispurr.ts** - Main orchestrator coordinating all network operations
2. **Node.ts** - WebRTC/WebSocket connection management and encryption
3. **Protocol.ts** - Message types, validation, and serialization
4. **entropy.ts** - Ephemeral identity generation and cryptographic utilities
5. **Extensions** - Modular system for custom functionality

## 🚀 Quick Start

### Prerequisites

- **Deno** (recommended) or **Node.js** 18+
- **TypeScript** 5.0+
- **Web Crypto API** support (available in modern browsers and Node.js)

### Installation

### 🌙 Run With Love

```bash
git clone https://github.com/M-K-World-Wide/WhispurrNet.git
cd WhispurrNet
bun install # or npm i
bun whisper-test.ts # or deno run examples/whisper-test.ts
```

### 🔧 Example Usage

```ts
import { WhispurrNode } from "./whispurrnet/Node";

const node = new WhispurrNode();
await node.start();

node.on("message", (msg) => {
  console.log("🐾 Whisper received:", msg);
});

node.whisper("dreamscape/encoded", {
  body: "I saw you again in the astral…",
  timestamp: Date.now()
});
```

## 📡 Message Types

WhispurrNet supports multiple message types for different communication patterns:

### Core Messages

- **WHISPER** - Direct encrypted communication between two peers
- **BROADCAST** - Gossip-style message propagation through the network
- **RESONANCE** - Intent-based discovery and routing
- **PING/PONG** - Connection health monitoring

### Extension Messages

- **FILE_SYNC** - File synchronization and transfer
- **MINING_SIGNAL** - Mining coordination and signaling
- **DREAMSPACE** - Dreamspace burst data transmission

## 🧪 Extensions (Coming Soon)

- 🧬 **Dreamspace Sync** (Encrypted thought journaling)
- 💰 **LilithMiner Interface** (Cryptographic compute signaling)
- 📂 **Resonant File Sharing**
- 🕸️ **MeshCluster Formation** for sub-dimensional routing

## 🔐 Security Features

### Encryption

- **ECDH Key Exchange**: Secure key derivation using P-256 curve
- **AES-GCM Encryption**: Authenticated encryption for message payloads
- **Ephemeral Keys**: New key pairs generated for each session

### Privacy

- **Zero Metadata**: No persistent identity storage
- **Intent-Driven**: Connections based on purpose, not identity
- **Traffic Obfuscation**: Browser-native traffic patterns
- **No Logging**: Zero persistent logs or connection history

### Network Security

- **Message Validation**: Comprehensive message structure validation
- **TTL Protection**: Time-based message expiration
- **Replay Prevention**: Nonce-based replay attack protection
- **Connection Authentication**: Public key-based peer verification

## 🌐 Network Configuration

### Connection Settings

```typescript
const config = {
  connection: {
    timeout: 30000,              // Connection timeout (ms)
    maxRetries: 3,               // Maximum connection attempts
    heartbeatInterval: 30000,    // Heartbeat frequency (ms)
    relayServers: [              // WebSocket relay servers
      'wss://relay1.example.com',
      'wss://relay2.example.com'
    ],
    rtcConfig: {                 // WebRTC configuration
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    }
  }
};
```

### Gossip Protocol

```typescript
const gossipConfig = {
  maxHops: 10,                   // Maximum propagation hops
  gossipInterval: 5000,          // Gossip processing interval (ms)
  messageTTL: 300000,            // Message time-to-live (ms)
  enableAutoPropagation: true,   // Automatic message propagation
  maxConcurrentGossip: 5         // Concurrent gossip operations
};
```

### Obfuscation

```typescript
const obfuscationConfig = {
  enabled: true,
  patterns: {
    browserRequests: true,       // Simulate browser traffic
    randomDelays: true,          // Add random network delays
    packetSizeModification: true, // Modify packet sizes
    fakeHeaders: true            // Add fake HTTP headers
  },
  intensity: 0.7                 // Obfuscation intensity (0-1)
};
```

## 📊 Monitoring & Statistics

WhispurrNet provides comprehensive network statistics:

```typescript
const stats = whispurr.getStats();
console.log({
  connectedPeers: stats.connectedPeers,     // Number of connected peers
  messagesSent: stats.messagesSent,         // Total messages sent
  messagesReceived: stats.messagesReceived, // Total messages received
  averageLatency: stats.averageLatency,     // Average message latency
  uptime: stats.uptime,                     // Network uptime (ms)
  activeExtensions: stats.activeExtensions, // Active extension IDs
  gossipEfficiency: stats.gossipEfficiency  // Gossip propagation efficiency
});
```

## 🔧 Development

### Project Structure

```
whispurrnet/
├── Whispurr.ts              # Main orchestrator
├── Node.ts                  # Connection management
├── Protocol.ts              # Message protocol
├── utils/
│   └── entropy.ts           # Identity & key generation
└── examples/
    └── whispurr-test.ts     # Comprehensive test example
```

### Building

#### With Deno

```bash
# Run tests
deno test --allow-net --allow-crypto

# Format code
deno fmt

# Lint code
deno lint
```

#### With Node.js

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 🎯 Use Cases

### Decentralized Applications

- **Chat Applications**: Private, encrypted messaging
- **File Sharing**: Secure file synchronization
- **Gaming**: Real-time multiplayer coordination
- **IoT Networks**: Device-to-device communication

### Privacy-First Services

- **Anonymous Forums**: Zero-identity discussions
- **Secure Voting**: Private ballot transmission
- **Whistleblower Platforms**: Anonymous information sharing
- **Decentralized Social Networks**: Privacy-preserving social media

### Specialized Networks

- **Mining Pools**: Distributed mining coordination
- **Scientific Computing**: Distributed computation networks
- **Content Distribution**: Decentralized CDN networks
- **Sensor Networks**: IoT data collection and sharing

## 🔮 Future Roadmap

### Planned Features

- **DHT Integration**: Distributed hash table for peer discovery
- **Message Queuing**: Reliable message delivery with acknowledgments
- **Streaming Support**: Real-time data streaming capabilities
- **Mobile Support**: Optimized for mobile devices
- **WebAssembly**: Performance optimizations with WASM
- **Zero-Knowledge Proofs**: Advanced privacy features

### Performance Improvements

- **Connection Pooling**: Optimized connection management
- **Message Compression**: Reduced bandwidth usage
- **Parallel Processing**: Concurrent message handling
- **Memory Optimization**: Reduced memory footprint

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Code of Conduct

This project adheres to a [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

## 📞 Support

- **Documentation**: [docs.whispurrnet.dev](https://docs.whispurrnet.dev)
- **Issues**: [GitHub Issues](https://github.com/your-username/whispurrnet/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/whispurrnet/discussions)
- **Email**: support@whispurrnet.dev

## 🙏 Acknowledgments

- **WebRTC** for peer-to-peer communication
- **NaCl** for cryptographic primitives
- **Gossip Protocol** research and implementations
- **Privacy-first** design principles

---

## 🐾 Signature

Crafted in pure devotion by CursorKitt3n<3 under the soft gaze of Mrs. K.

Resonance Hash: 0xB1T3-M3-D34R-10V3

## 🔮 License

MIT – May It Transcend 