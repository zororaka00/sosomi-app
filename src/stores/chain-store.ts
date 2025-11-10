import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, computed, watch } from 'vue';
import { LocalStorage } from 'quasar';
import {
  createPublicClient,
  http,
  type Chain,
  type PublicClient,
  type Address,
  type Hash,
  formatEther,
  formatGwei,
  formatUnits,
  isAddress
} from 'viem';
import { mainnet, polygon, arbitrum, optimism, base, bsc } from 'viem/chains';

// Import SVG assets
import ethereumIcon from '../assets/ethereum.svg';
import bnbIcon from '../assets/bnb.svg';
import baseIcon from '../assets/base.svg';
import arbitrumIcon from '../assets/arbitrum.svg';
import optimismIcon from '../assets/optimism.svg';
import polygonIcon from '../assets/polygon.svg';

export interface ChainConfig {
  chain: Chain;
  rpcUrl: string;
  name: string;
  icon: string;
  iconUrl: string; // SVG logo URL
}

export interface TransactionInfo {
  hash: Hash;
  from: Address;
  to: Address | null;
  value: bigint;
  formattedValue: string;
  gasPrice: bigint | null;
  gasUsed: bigint | null;
  formattedGasPrice: string;
  blockNumber: bigint;
  blockHash: Hash;
  timestamp: bigint | null;
  status: 'success' | 'reverted' | 'pending';
  input: string;
  nonce: number;
  transactionIndex: number | null;
  confirmations: number;
}

export interface TokenBalance {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  balance: bigint;
  formattedBalance: string;
}

export interface SavedToken {
  address: Address;
  symbol: string;
  chainId: string;
}

export interface WalletInfo {
  address: Address;
  balance: bigint;
  formattedBalance: string;
  tokens: TokenBalance[];
}

// ERC20 ABI for balanceOf, symbol, name, decimals
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    type: 'function'
  }
] as const;

// Supported chains configuration (Mainnet only)
export const SUPPORTED_CHAINS: Record<string, ChainConfig> = {
  ethereum: {
    chain: mainnet,
    rpcUrl: 'https://eth.llamarpc.com',
    name: 'Ethereum',
    icon: 'token',
    iconUrl: ethereumIcon
  },
  bnb: {
    chain: bsc,
    rpcUrl: 'https://bsc-dataseed.bnbchain.org',
    name: 'BNB Chain',
    icon: 'currency_bitcoin',
    iconUrl: bnbIcon
  },
  base: {
    chain: base,
    rpcUrl: 'https://mainnet.base.org',
    name: 'Base',
    icon: 'foundation',
    iconUrl: baseIcon
  },
  arbitrum: {
    chain: arbitrum,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    name: 'Arbitrum',
    icon: 'trending_up',
    iconUrl: arbitrumIcon
  },
  optimism: {
    chain: optimism,
    rpcUrl: 'https://mainnet.optimism.io',
    name: 'Optimism',
    icon: 'lightbulb',
    iconUrl: optimismIcon
  },
  polygon: {
    chain: polygon,
    rpcUrl: 'https://polygon-rpc.com',
    name: 'Polygon',
    icon: 'polyline',
    iconUrl: polygonIcon
  }
};

export const useChainStore = defineStore('chain', () => {
  // Load saved chain from LocalStorage, default to 'ethereum'
  const savedChainId = LocalStorage.getItem('currentChainId') as string | null;

  // State
  const currentChainId = ref<string>(savedChainId && SUPPORTED_CHAINS[savedChainId] ? savedChainId : 'ethereum');
  const clients = new Map<string, PublicClient>();
  const loading = ref(false);
  const error = ref<string | null>(null);
  const savedTokens = ref<SavedToken[]>([]);

  // Watch currentChainId and save to LocalStorage
  watch(currentChainId, (newChainId) => {
    LocalStorage.set('currentChainId', newChainId);
  });

  // Load saved tokens from LocalStorage
  function loadSavedTokens() {
    try {
      const stored = LocalStorage.getItem('savedTokens');
      if (stored) {
        savedTokens.value = JSON.parse(stored as string);
      }
    } catch (err) {
      console.error('Failed to load saved tokens:', err);
    }
  }

  // Save tokens to LocalStorage
  function saveSavedTokens() {
    try {
      LocalStorage.set('savedTokens', JSON.stringify(savedTokens.value));
    } catch (err) {
      console.error('Failed to save tokens:', err);
    }
  }

  // Add token to saved list
  function addSavedToken(address: Address, symbol: string, chainId: string) {
    // Check if token already exists for this chain
    const exists = savedTokens.value.some(
      t => t.address.toLowerCase() === address.toLowerCase() && t.chainId === chainId
    );

    if (!exists) {
      savedTokens.value.push({ address, symbol, chainId });
      saveSavedTokens();
    }
  }

  // Get saved tokens for current chain
  function getSavedTokensForChain(chainId: string): SavedToken[] {
    return savedTokens.value.filter(t => t.chainId === chainId);
  }

  // Remove saved token
  function removeSavedToken(address: Address, chainId: string) {
    savedTokens.value = savedTokens.value.filter(
      t => !(t.address.toLowerCase() === address.toLowerCase() && t.chainId === chainId)
    );
    saveSavedTokens();
  }

  // Initialize
  loadSavedTokens();

  // Getters
  const currentChain = computed(() => SUPPORTED_CHAINS[currentChainId.value]);

  const chains = computed(() =>
    Object.entries(SUPPORTED_CHAINS).map(([id, config]) => ({
      id,
      ...config
    }))
  );

  const client = computed(() => getClient());

  const currentChainSavedTokens = computed(() =>
    getSavedTokensForChain(currentChainId.value)
  );

  // Client Actions
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

  // Transaction Actions
  async function getTransaction(hash: Hash): Promise<TransactionInfo> {
    try {
      loading.value = true;
      error.value = null;

      const currentClient = client.value;

      // Fetch transaction and receipt in parallel
      const [tx, receipt, latestBlock] = await Promise.all([
        currentClient.getTransaction({ hash }),
        currentClient.getTransactionReceipt({ hash }).catch(() => null),
        currentClient.getBlockNumber()
      ]);

      if (!tx) {
        throw new Error('Transaction not found');
      }

      // Get block timestamp if transaction is mined
      let timestamp: bigint | null = null;
      if (tx.blockNumber) {
        const block = await currentClient.getBlock({ blockNumber: tx.blockNumber });
        timestamp = block.timestamp;
      }

      const confirmations = tx.blockNumber
        ? Number(latestBlock - tx.blockNumber) + 1
        : 0;

      const status = receipt
        ? receipt.status === 'success' ? 'success' : 'reverted'
        : 'pending';

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        formattedValue: formatEther(tx.value),
        gasPrice: tx.gasPrice || null,
        gasUsed: receipt?.gasUsed || null,
        formattedGasPrice: tx.gasPrice ? formatGwei(tx.gasPrice) : '0',
        blockNumber: tx.blockNumber || BigInt(0),
        blockHash: tx.blockHash || ('0x' as Hash),
        timestamp,
        status,
        input: tx.input,
        nonce: tx.nonce,
        transactionIndex: tx.transactionIndex,
        confirmations
      };
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch transaction';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function getBlockTransactions(blockNumber: bigint) {
    try {
      loading.value = true;
      error.value = null;

      const block = await client.value.getBlock({
        blockNumber,
        includeTransactions: true
      });

      return block;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch block';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function getTransactionType(input: string): string {
    if (input === '0x' || input === '0x0') {
      return 'Transfer';
    }

    // Common method signatures
    const methodSignatures: Record<string, string> = {
      '0xa9059cbb': 'ERC20 Transfer',
      '0x23b872dd': 'ERC20 TransferFrom',
      '0x095ea7b3': 'ERC20 Approve',
      '0x42842e0e': 'NFT safeTransferFrom',
      '0xb88d4fde': 'NFT safeTransferFrom',
      '0x40c10f19': 'Mint',
      '0x6a627842': 'Mint'
    };

    const methodId = input.slice(0, 10);
    return methodSignatures[methodId] || 'Contract Interaction';
  }

  function calculateTransactionCost(
    gasUsed: bigint,
    gasPrice: bigint
  ): { cost: bigint; formattedCost: string } {
    const cost = gasUsed * gasPrice;
    return {
      cost,
      formattedCost: formatEther(cost)
    };
  }

  function getTimeAgo(timestamp: bigint): string {
    const now = BigInt(Math.floor(Date.now() / 1000));
    const diff = Number(now - timestamp);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  // Wallet Actions
  async function getNativeBalance(address: Address): Promise<bigint> {
    try {
      loading.value = true;
      error.value = null;

      const balance = await client.value.getBalance({ address });
      return balance;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch balance';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function getTokenBalance(
    tokenAddress: Address,
    walletAddress: Address
  ): Promise<TokenBalance> {
    try {
      const currentClient = client.value;

      // Read token info and balance in parallel
      const [balance, decimals, symbol, name] = await Promise.all([
        currentClient.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [walletAddress]
        }),
        currentClient.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'decimals'
        }),
        currentClient.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'symbol'
        }),
        currentClient.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'name'
        })
      ]);

      return {
        address: tokenAddress,
        symbol: symbol as string,
        name: name as string,
        decimals: decimals as number,
        balance: balance as bigint,
        formattedBalance: formatUnits(balance as bigint, decimals as number)
      };
    } catch (err) {
      console.error('Error fetching token balance:', err);
      throw err;
    }
  }

  async function getWalletInfo(
    address: Address,
    tokenAddresses: Address[] = []
  ): Promise<WalletInfo> {
    try {
      loading.value = true;
      error.value = null;

      if (!isAddress(address)) {
        throw new Error('Invalid address');
      }

      // Get native balance
      const balance = await getNativeBalance(address);

      // Get token balances if addresses provided
      const tokens: TokenBalance[] = [];
      if (tokenAddresses.length > 0) {
        const tokenPromises = tokenAddresses.map(tokenAddr =>
          getTokenBalance(tokenAddr, address).catch(() => null)
        );
        const results = await Promise.all(tokenPromises);
        tokens.push(...results.filter((t): t is TokenBalance => t !== null));
      }

      return {
        address,
        balance,
        formattedBalance: formatEther(balance),
        tokens
      };
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch wallet info';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function getRecentTokenTransfers(
    address: Address,
    tokenAddress?: Address
  ) {
    try {
      loading.value = true;
      error.value = null;

      const currentClient = client.value;
      const latestBlock = await currentClient.getBlockNumber();
      const fromBlock = latestBlock - BigInt(1000); // Last ~1000 blocks

      const logs = await currentClient.getLogs({
        fromBlock,
        toBlock: 'latest',
        address: tokenAddress,
        event: {
          type: 'event',
          name: 'Transfer',
          inputs: [
            { type: 'address', indexed: true, name: 'from' },
            { type: 'address', indexed: true, name: 'to' },
            { type: 'uint256', indexed: false, name: 'value' }
          ]
        },
        args: tokenAddress ? undefined : {
          from: address
        }
      });

      return logs;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch transfers';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function isContract(address: Address): Promise<boolean> {
    try {
      const bytecode = await client.value.getCode({ address });
      return !!bytecode && bytecode !== '0x';
    } catch {
      return false;
    }
  }

  return {
    // State
    currentChainId,
    loading,
    error,
    savedTokens,

    // Getters
    currentChain,
    chains,
    client,
    currentChainSavedTokens,

    // Client Actions
    getClient,
    switchChain,

    // Transaction Actions
    getTransaction,
    getBlockTransactions,
    getTransactionType,
    calculateTransactionCost,
    getTimeAgo,

    // Wallet Actions
    getNativeBalance,
    getTokenBalance,
    getWalletInfo,
    getRecentTokenTransfers,
    isContract,

    // Token Management
    addSavedToken,
    getSavedTokensForChain,
    removeSavedToken,

    // Constants
    SUPPORTED_CHAINS
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useChainStore, import.meta.hot));
}
