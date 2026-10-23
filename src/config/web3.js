import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { defineChain } from 'viem';

export const botchainMainnet = defineChain({
  id: 677,
  name: 'BotChain Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'BOT Token',
    symbol: 'BOT',
  },
  rpcUrls: {
    default: { http: ['https://rpc.botchain.ai'] },
  },
  blockExplorers: {
    default: { name: 'BotChainScan', url: 'https://scan.botchain.ai' },
  },
});

export const projectId =
  import.meta.env.VITE_REOWN_PROJECT_ID || '3fcc6bba2d1de962d911bb5b5c3dba68';

export const networks = [botchainMainnet];

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
});

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata: {
    name: 'BOT Payment Link',
    description: 'Decentralized Merchant Payment Links on BotChain',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://scan.botchain.ai',
    icons: ['https://avatars.githubusercontent.com/u/179229932'],
  },
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#c084fc',
    '--w3m-color-mix': '#0d0f14',
    '--w3m-color-mix-strength': 40,
    '--w3m-border-radius-master': '10px',
  },
});

export const config = wagmiAdapter.wagmiConfig;
