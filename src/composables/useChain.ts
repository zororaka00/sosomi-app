import { useChainStore } from '../stores/chain-store';

/**
 * Composable wrapper for chain store
 * Provides reactive access to chain state and actions
 */
export function useChain() {
  const store = useChainStore();

  return {
    currentChainId: store.currentChainId,
    currentChain: store.currentChain,
    client: store.client,
    chains: store.chains,
    switchChain: store.switchChain,
    getClient: store.getClient,
    SUPPORTED_CHAINS: store.SUPPORTED_CHAINS
  };
}
