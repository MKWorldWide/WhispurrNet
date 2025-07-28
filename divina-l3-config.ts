/**
 * 🌀 Divina-L3 Network Configuration
 * 
 * This configuration connects to the Divina-L3 network using WhispurrNet.
 * It includes bootstrap nodes, network parameters, and connection settings.
 */

// Bootstrap nodes for the Divina-L3 network
const BOOTSTRAP_NODES = [
  {
    nodeId: 'divina-l3-node-1',
    publicKey: new Uint8Array([
      // Example public key (replace with actual key)
      0x04, 0x5f, 0x0d, 0x1a, 0x2b, 0x3c, 0x4d, 0x5e,
      0x6f, 0x80, 0x91, 0xa2, 0xb3, 0xc4, 0xd5, 0xe6,
      0xf7, 0x08, 0x19, 0x2a, 0x3b, 0x4c, 0x5d, 0x6e,
      0x7f, 0x90, 0xa1, 0xb2, 0xc3, 0xd4, 0xe5, 0xf6
    ]),
    addresses: [
      '/dns/divina-l3-node-1.example.com/tcp/9000/ws',
      '/ip4/192.0.2.1/tcp/9000/ws',
      '/ip6/2001:db8::1/tcp/9000/ws'
    ]
  },
  {
    nodeId: 'divina-l3-node-2',
    publicKey: new Uint8Array([
      // Example public key (replace with actual key)
      0x04, 0x1a, 0x2b, 0x3c, 0x4d, 0x5e, 0x6f, 0x80,
      0x91, 0xa2, 0xb3, 0xc4, 0xd5, 0xe6, 0xf7, 0x08,
      0x19, 0x2a, 0x3b, 0x4c, 0x5d, 0x6e, 0x7f, 0x90,
      0xa1, 0xb2, 0xc3, 0xd4, 0xe5, 0xf6, 0x07, 0x18
    ]),
    addresses: [
      '/dns/divina-l3-node-2.example.com/tcp/9000/ws',
      '/ip4/203.0.113.1/tcp/9000/ws',
      '/ip6/2001:db8::2/tcp/9000/ws'
    ]
  },
  // Add more bootstrap nodes as needed
];

// Network-specific configuration
const NETWORK_CONFIG = {
  // Network identifier
  networkId: 'divina-l3',
  
  // Protocol versions supported
  protocolVersion: '1.0.0',
  
  // Connection parameters
  connection: {
    // Timeout for connection attempts (ms)
    timeout: 30000,
    
    // Maximum connection retries
    maxRetries: 5,
    
    // Heartbeat interval (ms)
    heartbeatInterval: 30000,
    
    // Enable connection obfuscation
    enableObfuscation: true,
    
    // WebRTC configuration
    rtcConfig: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478?transport=udp' }
      ]
    }
  },
  
  // Gossip protocol configuration
  gossip: {
    // Maximum number of hops for message propagation
    maxHops: 10,
    
    // Gossip interval (ms)
    gossipInterval: 5000,
    
    // Message time-to-live (ms)
    messageTTL: 300000,
    
    // Enable automatic message propagation
    enableAutoPropagation: true,
    
    // Maximum concurrent gossip operations
    maxConcurrentGossip: 5
  },
  
  // Enable debug logging
  debug: true
};

export { BOOTSTRAP_NODES, NETWORK_CONFIG };
