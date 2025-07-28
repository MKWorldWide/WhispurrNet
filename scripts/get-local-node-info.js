// Script to get local Hardhat node information for WhispurrNet configuration
const { ethers } = require("hardhat");

async function main() {
  // Get the default provider for the local Hardhat network
  const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
  
  // Get the network information
  const network = await provider.getNetwork();
  console.log("Network information:");
  console.log(`- Chain ID: ${network.chainId}`);
  console.log(`- Network name: ${network.name}`);
  
  // Get the list of accounts
  const accounts = await provider.listAccounts();
  console.log("\nAvailable accounts:");
  
  // Get the first account's public key (we'll use this as our node ID)
  if (accounts.length > 0) {
    const signer = provider.getSigner(accounts[0]);
    const address = await signer.getAddress();
    console.log(`- Node address: ${address}`);
    
    // Get the node info (this is a placeholder - in a real scenario, you'd get the actual node ID)
    console.log("\nNode information for WhispurrNet configuration:");
    console.log(`const LOCAL_NODE_CONFIG = {
  nodeId: '${address}',
  publicKey: new Uint8Array([
    // This is a placeholder - in a real scenario, you'd get the actual public key
    0x04, 0x5f, 0x0d, 0x1a, 0x2b, 0x3c, 0x4d, 0x5e,
    0x6f, 0x80, 0x91, 0xa2, 0xb3, 0xc4, 0xd5, 0xe6,
    0xf7, 0x08, 0x19, 0x2a, 0x3b, 0x4c, 0x5d, 0x6e,
    0x7f, 0x90, 0xa1, 0xb2, 0xc3, 0xd4, 0xe5, 0xf6
  ]),
  addresses: [
    '/ip4/127.0.0.1/tcp/8545/ws',
    '/dns/localhost/tcp/8545/ws'
  ]
};`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
