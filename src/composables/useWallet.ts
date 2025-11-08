import { ref } from 'vue';
import { type Address, type Hash, formatEther, isAddress, formatUnits } from 'viem';
import { useChain } from './useChain';

export interface TokenBalance {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  balance: bigint;
  formattedBalance: string;
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

const loading = ref(false);
const error = ref<string | null>(null);

export function useWallet() {
  const chainStore = useChain();

  /**
   * Get native balance for an address
   */
  const getNativeBalance = async (address: Address): Promise<bigint> => {
    try {
      loading.value = true;
      error.value = null;

      const balance = await chainStore.client.getBalance({ address });
      return balance;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch balance';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Get ERC20 token balance and info
   */
  const getTokenBalance = async (
    tokenAddress: Address,
    walletAddress: Address
  ): Promise<TokenBalance> => {
    try {
      // Read token info and balance in parallel
      const [balance, decimals, symbol, name] = await Promise.all([
        chainStore.client.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [walletAddress]
        }),
        chainStore.client.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'decimals'
        }),
        chainStore.client.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'symbol'
        }),
        chainStore.client.readContract({
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
  };

  /**
   * Get comprehensive wallet information
   */
  const getWalletInfo = async (
    address: Address,
    tokenAddresses: Address[] = []
  ): Promise<WalletInfo> => {
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
  };

  /**
   * Get recent token transfers (using getLogs - limited window)
   */
  const getRecentTokenTransfers = async (
    address: Address,
    tokenAddress?: Address
  ) => {
    try {
      loading.value = true;
      error.value = null;

      const latestBlock = await chainStore.client.getBlockNumber();
      const fromBlock = latestBlock - BigInt(1000); // Last ~1000 blocks

      // ERC20 Transfer event signature
      const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

      const logs = await chainStore.client.getLogs({
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
  };

  /**
   * Validate if address is a contract
   */
  const isContract = async (address: Address): Promise<boolean> => {
    try {
      const code = await chainStore.client.getBytecode({ address });
      return !!code && code !== '0x';
    } catch {
      return false;
    }
  };

  return {
    loading,
    error,
    getNativeBalance,
    getTokenBalance,
    getWalletInfo,
    getRecentTokenTransfers,
    isContract
  };
}
