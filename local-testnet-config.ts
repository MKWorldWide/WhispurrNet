/**
 * Local Testnet Configuration for WhispurrNet
 * 
 * This configuration sets up a local test network with a single bootstrap node
 * running on localhost for development and testing purposes.
 */

// Connection configuration for the WhispurrNode
export const LOCAL_NODE_CONFIG = {
  // Connection settings
  connection: {
    // Disable WebRTC for now as it's not working in the Deno environment
    rtcConfig: undefined,
    
    // WebSocket server configuration for direct connections
    wsServer: {
      host: '0.0.0.0',
      port: 0 // Let the OS assign a random available port
    },
    
    // Connection timeout in milliseconds
    timeout: 30000,
    
    // Maximum number of connection retries
    maxRetries: 3,
    
    // Heartbeat interval in milliseconds
    heartbeatInterval: 10000, // Reduced for faster failure detection
    
    // Disable traffic obfuscation for local testing
    enableObfuscation: false,
    
    // Enable direct WebSocket connections
    enableDirectWebSocket: true
  },
  
  // Gossip protocol settings
  gossip: {
    // Maximum number of hops a message can travel
    maxHops: 10,
    
    // How often to gossip (in milliseconds)
    gossipInterval: 5000,
    
    // Message time-to-live (in milliseconds)
    messageTTL: 300000, // 5 minutes
    
    // Enable automatic message propagation
    enableAutoPropagation: true,
    
    // Maximum number of concurrent gossip messages
    maxConcurrentGossip: 5
  },
  
  // Obfuscation settings
  obfuscation: {
    // Enable/disable obfuscation
    enabled: false, // Disable for local testing
    
    // Obfuscation patterns
    patterns: {
      // Simulate browser-like request patterns
      browserRequests: true,
      
      // Add random delays to traffic
      randomDelays: true,
      
      // Modify packet sizes to match common protocols
      packetSizeModification: true,
      
      // Add fake headers and metadata
      fakeHeaders: true
    },
    
    // Obfuscation intensity (0.0 to 1.0)
    intensity: 0.7
  },
  
  // Debug mode (enables additional logging)
  debug: true,
  
  // Enable automatic peer discovery
  autoDiscover: false, // Disable for local testing
  
  // Maximum number of connections
  maxConnections: 10 // Lower for local testing
};

// Local testnet bootstrap node information
export const BOOTSTRAP_NODE = {
  // Bootstrap node ID from the running instance
  nodeId: '2c1543378ab15b4be8a51da83eaa65be:1984f3f0746',
  // Dummy public key (in a real scenario, this would be the actual public key)
  publicKey: new Uint8Array(32), // 32-byte array for Ed25519
  // Addresses where the bootstrap node is listening
  addresses: [
    '/ip4/127.0.0.1/tcp/9000/ws',
    '/dns4/localhost/tcp/9000/ws'
  ]
};
