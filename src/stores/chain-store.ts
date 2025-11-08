import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, computed } from 'vue';
import { createPublicClient, http, type Chain, type PublicClient } from 'viem';
import { mainnet, polygon, arbitrum, optimism, base, bsc } from 'viem/chains';

export interface ChainConfig {
  chain: Chain;
  rpcUrl: string;
  name: string;
  icon: string;
  iconUrl: string; // SVG logo URL
}

// Supported chains configuration (Mainnet only)
export const SUPPORTED_CHAINS: Record<string, ChainConfig> = {
  ethereum: {
    chain: mainnet,
    rpcUrl: 'https://eth.llamarpc.com',
    name: 'Ethereum',
    icon: 'token',
    iconUrl: '/src/assets/ethereum.svg'
  },
  bnb: {
    chain: bsc,
    rpcUrl: 'https://bsc-dataseed.binance.org',
    name: 'BNB Chain',
    icon: 'currency_bitcoin',
    iconUrl: '/src/assets/bnb.svg'
  },
  base: {
    chain: base,
    rpcUrl: 'https://base.llamarpc.com',
    name: 'Base',
    icon: 'foundation',
    iconUrl: '/src/assets/base.svg'
  },
  arbitrum: {
    chain: arbitrum,
    rpcUrl: 'https://arbitrum.llamarpc.com',
    name: 'Arbitrum',
    icon: 'trending_up',
    iconUrl: '/src/assets/arbitrum.svg'
  },
  optimism: {
    chain: optimism,
    rpcUrl: 'https://optimism.llamarpc.com',
    name: 'Optimism',
    icon: 'lightbulb',
    iconUrl: '/src/assets/optimism.svg'
  },
  polygon: {
    chain: polygon,
    rpcUrl: 'https://polygon.llamarpc.com',
    name: 'Polygon',
    icon: 'polyline',
    iconUrl: '/src/assets/polygon.svg'
  }
};

export const useChainStore = defineStore('chain', () => {
  // State
  const currentChainId = ref<string>('ethereum');
  const clients = new Map<string, PublicClient>();

  // Getters
  const currentChain = computed(() => SUPPORTED_CHAINS[currentChainId.value]);

  const chains = computed(() =>
    Object.entries(SUPPORTED_CHAINS).map(([id, config]) => ({
      id,
      ...config
    }))
  );

  const client = computed(() => getClient());

  // Actions
  function getClient(chainId: string = currentChainId.value): PublicClient {
    if (!clients.has(chainId)) {
      const config = SUPPORTED_CHAINS[chainId];
      if (!config) {
        throw new Error(`Unsupported chain: ${chainId}`);
      }

      const newClient = createPublicClient({
        chain: config.chain,
        transport: http(config.rpcUrl)
      });

      clients.set(chainId, newClient);
    }

    return clients.get(chainId)!;
  }

  function switchChain(chainId: string) {
    if (!SUPPORTED_CHAINS[chainId]) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }
    currentChainId.value = chainId;
  }

  return {
    // State
    currentChainId,

    // Getters
    currentChain,
    chains,
    client,

    // Actions
    getClient,
    switchChain,

    // Constants
    SUPPORTED_CHAINS
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useChainStore, import.meta.hot));
}
