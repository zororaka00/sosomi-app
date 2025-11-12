import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, computed, watch } from 'vue';
import { LocalStorage } from 'quasar';
import {
  createPublicClient,
  http,
  fallback,
  type Chain,
  type PublicClient,
  type Address,
  type Hash,
  formatEther,
  formatGwei,
  formatUnits,
  isAddress,
  decodeEventLog,
  parseAbi
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
  rpcUrls: string[]; // Multiple RPC URLs for fallback
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
  logs?: TransactionLog[];
}

export interface TransactionLog {
  type: 'ERC20_Transfer' | 'ERC721_Transfer' | 'ERC1155_Transfer' | 'Unknown';
  from: Address;
  to: Address;
  tokenAddress: Address;
  value?: string; // For ERC20
  tokenId?: string; // For ERC721/ERC1155
  amount?: string; // For ERC1155
  tokenSymbol?: string;
  tokenName?: string;
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

// Supported chains configuration with multiple RPC URLs (Mainnet only)
export const SUPPORTED_CHAINS: Record<string, ChainConfig> = {
  ethereum: {
    chain: mainnet,
    rpcUrls: [
      'https://eth.llamarpc.com',
      'https://ethereum-rpc.publicnode.com',
      'https://1rpc.io/eth',
      'https://eth.drpc.org',
      'https://ethereum.blockpi.network/v1/rpc/public'
    ],
    name: 'Ethereum',
    icon: 'token',
    iconUrl: ethereumIcon
  },
  bnb: {
    chain: bsc,
    rpcUrls: [
      'https://bsc-dataseed.bnbchain.org',
      'https://bsc-dataseed1.bnbchain.org',
      'https://1rpc.io/bnb',
      'https://bsc.drpc.org',
      'https://bsc.meowrpc.com'
    ],
    name: 'BNB Chain',
    icon: 'currency_bitcoin',
    iconUrl: bnbIcon
  },
  base: {
    chain: base,
    rpcUrls: [
      'https://mainnet.base.org',
      'https://base.llamarpc.com',
      'https://1rpc.io/base',
      'https://base.drpc.org',
      'https://base.meowrpc.com'
    ],
    name: 'Base',
    icon: 'foundation',
    iconUrl: baseIcon
  },
  arbitrum: {
    chain: arbitrum,
    rpcUrls: [
      'https://arb1.arbitrum.io/rpc',
      'https://arbitrum.llamarpc.com',
      'https://1rpc.io/arb',
      'https://arbitrum.drpc.org',
      'https://arbitrum.meowrpc.com'
    ],
    name: 'Arbitrum',
    icon: 'trending_up',
    iconUrl: arbitrumIcon
  },
  optimism: {
    chain: optimism,
    rpcUrls: [
      'https://mainnet.optimism.io',
      'https://optimism.llamarpc.com',
      'https://1rpc.io/op',
      'https://optimism.drpc.org',
      'https://optimism.meowrpc.com'
    ],
    name: 'Optimism',
    icon: 'lightbulb',
    iconUrl: optimismIcon
  },
  polygon: {
    chain: polygon,
    rpcUrls: [
      'https://polygon-rpc.com',
      'https://polygon.llamarpc.com',
      'https://1rpc.io/matic',
      'https://polygon.drpc.org',
      'https://polygon.meowrpc.com'
    ],
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

  // Helper function to format numbers with max 8 decimals
  const formatWithMaxDecimals = (value: string, maxDecimals: number = 8): string => {
    const num = parseFloat(value);
    if (isNaN(num)) return value;

    // If the number has more decimals than maxDecimals, truncate
    const decimalIndex = value.indexOf('.');
    if (decimalIndex !== -1 && value.length - decimalIndex - 1 > maxDecimals) {
      return num.toFixed(maxDecimals);
    }
    return value;
  };
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

      // Create fallback transport with multiple RPCs for redundancy and speed
      const transports = config.rpcUrls.length > 0
        ? config.rpcUrls.map(url => http(url))
        : [http()]; // Fallback to default if no RPCs available

      const newClient = createPublicClient({
        chain: config.chain,
        transport: fallback(transports, {
          rank: false // Use race mode - fastest response wins
        })
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

  // Helper function to parse transaction logs for token transfers
  async function parseTransactionLogs(logs: any[]): Promise<TransactionLog[]> {
    if (!logs || logs.length === 0) return [];

    const parsedLogs: TransactionLog[] = [];

    // ERC20/ERC721 Transfer event signature
    const erc20TransferAbi = parseAbi([
      'event Transfer(address indexed from, address indexed to, uint256 value)'
    ]);

    // ERC1155 event signatures
    const erc1155TransferSingleAbi = parseAbi([
      'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)'
    ]);

    const erc1155TransferBatchAbi = parseAbi([
      'event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)'
    ]);

    for (const log of logs) {
      try {
        const tokenAddress = log.address as Address;

        // ERC20/ERC721 Transfer event
        if (log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef') {
          // Check if it's ERC721 (tokenId is indexed) or ERC20 (value in data)
          // ERC721: 4 topics (signature, from, to, tokenId) and empty or minimal data
          // ERC20: 3 topics (signature, from, to) and value in data
          const isERC721 = log.topics.length === 4;

          // Fetch token info
          let tokenSymbol = 'Unknown';
          let tokenName = 'Unknown Token';
          let tokenDecimals = 18; // Default to 18 decimals

          try {
            const [symbol, name, decimals] = await Promise.all([
              client.value.readContract({
                address: tokenAddress,
                abi: ERC20_ABI,
                functionName: 'symbol'
              }).catch(() => 'Unknown'),
              client.value.readContract({
                address: tokenAddress,
                abi: ERC20_ABI,
                functionName: 'name'
              }).catch(() => 'Unknown Token'),
              client.value.readContract({
                address: tokenAddress,
                abi: ERC20_ABI,
                functionName: 'decimals'
              }).catch(() => 18)
            ]);
            tokenSymbol = symbol as string;
            tokenName = name as string;
            tokenDecimals = decimals as number;
          } catch (e) {
            console.log('Failed to fetch token metadata:', e);
          }

          if (isERC721) {
            // ERC721/NFT Transfer - tokenId is in topics[3]
            const tokenId = BigInt(log.topics[3]).toString();

            parsedLogs.push({
              type: 'ERC721_Transfer',
              from: `0x${log.topics[1].slice(26)}` as Address,
              to: `0x${log.topics[2].slice(26)}` as Address,
              tokenAddress,
              tokenId,
              tokenSymbol,
              tokenName
            });
          } else {
            // ERC20 Token Transfer
            const decoded = decodeEventLog({
              abi: erc20TransferAbi,
              data: log.data,
              topics: log.topics
            });

            // Use actual token decimals instead of hardcoding to 18
            const value = formatWithMaxDecimals(formatUnits(decoded.args.value as bigint, tokenDecimals));

            parsedLogs.push({
              type: 'ERC20_Transfer',
              from: decoded.args.from as Address,
              to: decoded.args.to as Address,
              tokenAddress,
              value,
              tokenSymbol,
              tokenName
            });
          }
        }
        // ERC1155 TransferSingle event
        else if (log.topics[0] === '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62') {

          // Fetch token info
          let tokenSymbol = 'ERC1155';
          let tokenName = 'ERC1155 Token';
          try {
            const [symbol, name] = await Promise.all([
              client.value.readContract({
                address: tokenAddress,
                abi: ERC20_ABI,
                functionName: 'symbol'
              }).catch(() => 'ERC1155'),
              client.value.readContract({
                address: tokenAddress,
                abi: ERC20_ABI,
                functionName: 'name'
              }).catch(() => 'ERC1155 Token')
            ]);
            tokenSymbol = symbol as string;
            tokenName = name as string;
          } catch (e) {
            console.log('Failed to fetch ERC1155 token metadata:', e);
          }

          const decoded = decodeEventLog({
            abi: erc1155TransferSingleAbi,
            data: log.data,
            topics: log.topics
          });

          const tokenId = (decoded.args.id as bigint).toString();
          const value = (decoded.args.value as bigint).toString();

          parsedLogs.push({
            type: 'ERC1155_Transfer',
            from: decoded.args.from as Address,
            to: decoded.args.to as Address,
            tokenAddress,
            tokenId,
            value,
            tokenSymbol,
            tokenName
          });
        }
        // ERC1155 TransferBatch event
        else if (log.topics[0] === '0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb') {

          // Fetch token info
          let tokenSymbol = 'ERC1155';
          let tokenName = 'ERC1155 Token';
          try {
            const [symbol, name] = await Promise.all([
              client.value.readContract({
                address: tokenAddress,
                abi: ERC20_ABI,
                functionName: 'symbol'
              }).catch(() => 'ERC1155'),
              client.value.readContract({
                address: tokenAddress,
                abi: ERC20_ABI,
                functionName: 'name'
              }).catch(() => 'ERC1155 Token')
            ]);
            tokenSymbol = symbol as string;
            tokenName = name as string;
          } catch (e) {
            console.log('Failed to fetch ERC1155 token metadata:', e);
          }

          const decoded = decodeEventLog({
            abi: erc1155TransferBatchAbi,
            data: log.data,
            topics: log.topics
          });

          const ids = decoded.args.ids as bigint[];
          const values = decoded.args.values as bigint[];

          // Create a log entry for each token in the batch
          ids.forEach((id, index) => {
            const value = values[index];
            if (value !== undefined) {
              parsedLogs.push({
                type: 'ERC1155_Transfer',
                from: decoded.args.from as Address,
                to: decoded.args.to as Address,
                tokenAddress,
                tokenId: id.toString(),
                value: value.toString(),
                tokenSymbol,
                tokenName
              });
            }
          });
        }
      } catch (err) {
        // Skip logs that can't be decoded
        console.error('Failed to decode log:', err, log);
      }
    }

    return parsedLogs;
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

      // Parse logs for token transfers
      const logs = receipt?.logs ? await parseTransactionLogs(receipt.logs) : [];

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        formattedValue: formatWithMaxDecimals(formatEther(tx.value)),
        gasPrice: tx.gasPrice || null,
        gasUsed: receipt?.gasUsed || null,
        formattedGasPrice: formatWithMaxDecimals(tx.gasPrice ? formatGwei(tx.gasPrice) : '0'),
        blockNumber: tx.blockNumber || BigInt(0),
        blockHash: tx.blockHash || ('0x' as Hash),
        timestamp,
        status,
        input: tx.input,
        nonce: tx.nonce,
        transactionIndex: tx.transactionIndex,
        confirmations,
        logs
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
      formattedCost: formatWithMaxDecimals(formatEther(cost))
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
        formattedBalance: formatWithMaxDecimals(formatUnits(balance as bigint, decimals as number))
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
        formattedBalance: formatWithMaxDecimals(formatEther(balance)),
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
