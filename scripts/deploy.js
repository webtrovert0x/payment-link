import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { ethers } from 'ethers';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const rpcUrl = process.env.RPC_URL || 'https://rpc.botchain.ai';
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey) {
    console.error('❌ Error: PRIVATE_KEY not found in .env file.');
    console.error('Please add PRIVATE_KEY=0x... to your .env file and run: npm run deploy');
    process.exit(1);
  }

  const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;

  console.log(`📡 Connecting to RPC: ${rpcUrl}...`);
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  const network = await provider.getNetwork();
  console.log(`🌐 Connected to Chain ID: ${network.chainId.toString()}`);

  const wallet = new ethers.Wallet(formattedKey, provider);
  console.log(`👤 Deployer Address: ${wallet.address}`);

  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 Deployer Balance: ${ethers.formatEther(balance)} BOT`);

  if (balance === 0n) {
    console.warn('⚠️ Warning: Deployer balance is 0 BOT. Transaction might fail if funds are needed for gas.');
  }

  const artifactPath = path.resolve(__dirname, '../src/contracts/PaymentLink.json');
  if (!fs.existsSync(artifactPath)) {
    console.error('❌ Artifact not found. Run "npm run compile" first.');
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

  console.log('🚀 Deploying PaymentLink contract to BotChain Mainnet...');
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const deployedAddress = await contract.getAddress();
  console.log(`🎉 PaymentLink successfully deployed to: ${deployedAddress}`);

  // Save deployed address for frontend
  const deployedConfig = {
    address: deployedAddress,
    chainId: Number(network.chainId),
    networkName: 'BotChain Mainnet',
    rpcUrl: rpcUrl,
    deployedAt: new Date().toISOString(),
    deployer: wallet.address,
  };

  const deployedPath = path.resolve(__dirname, '../src/contracts/deployedAddress.json');
  fs.writeFileSync(deployedPath, JSON.stringify(deployedConfig, null, 2));
  console.log(`💾 Saved deployed address to: ${deployedPath}`);

  // Also update or write to .env if needed
  const envPath = path.resolve(__dirname, '../.env');
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('VITE_PAYMENT_LINK_ADDRESS=')) {
      envContent = envContent.replace(
        /VITE_PAYMENT_LINK_ADDRESS=.*/g,
        `VITE_PAYMENT_LINK_ADDRESS=${deployedAddress}`
      );
    } else {
      envContent += `\nVITE_PAYMENT_LINK_ADDRESS=${deployedAddress}\n`;
    }
  } else {
    envContent = `PRIVATE_KEY=${privateKey}\nRPC_URL=${rpcUrl}\nCHAIN_ID=968\nVITE_PAYMENT_LINK_ADDRESS=${deployedAddress}\n`;
  }
  fs.writeFileSync(envPath, envContent);
  console.log(`📝 Updated .env with VITE_PAYMENT_LINK_ADDRESS=${deployedAddress}`);
}

main().catch((error) => {
  console.error('❌ Deployment failed:', error);
  process.exit(1);
});
