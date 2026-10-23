import deployedConfig from '../contracts/deployedAddress.json';
import artifact from '../contracts/PaymentLink.json';

// Immutable Verified BotChain Mainnet Contract Address
export const MAINNET_CONTRACT_ADDRESS = '0xAC433aE018ed27EB4D081A0D4C61b6BCE08c9ae1';

// Resolves immutable contract address
export function getContractAddress() {
  return (
    import.meta.env.VITE_PAYMENT_LINK_ADDRESS ||
    deployedConfig.address ||
    MAINNET_CONTRACT_ADDRESS
  );
}

export const PAYMENT_LINK_ABI = artifact.abi;
export const RPC_URL = import.meta.env.VITE_RPC_URL || 'https://rpc.botchain.ai';
export const EXPLORER_URL = import.meta.env.VITE_EXPLORER_URL || 'https://scan.botchain.ai';
export const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || 677);
export const NETWORK_NAME = 'BotChain Mainnet';
