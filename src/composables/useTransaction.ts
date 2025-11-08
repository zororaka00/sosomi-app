import { ref } from 'vue';
import { type Address, type Hash, formatEther, formatGwei } from 'viem';
import { useChain } from './useChain';

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

const loading = ref(false);
const error = ref<string | null>(null);

export function useTransaction() {
  const chainStore = useChain();

  /**
   * Get transaction details by hash
   */
  const getTransaction = async (hash: Hash): Promise<TransactionInfo> => {
    try {
      loading.value = true;
      error.value = null;

      // Fetch transaction and receipt in parallel
      const [tx, receipt, latestBlock] = await Promise.all([
        chainStore.client.getTransaction({ hash }),
        chainStore.client.getTransactionReceipt({ hash }).catch(() => null),
        chainStore.client.getBlockNumber()
      ]);

      if (!tx) {
        throw new Error('Transaction not found');
      }

      // Get block timestamp if transaction is mined
      let timestamp: bigint | null = null;
      if (tx.blockNumber) {
        const block = await chainStore.client.getBlock({ blockNumber: tx.blockNumber });
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
  };

  /**
   * Get recent transactions for a block
   */
  const getBlockTransactions = async (blockNumber: bigint) => {
    try {
      loading.value = true;
      error.value = null;

      const block = await chainStore.client.getBlock({
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
  };

  /**
   * Decode transaction input (basic detection)
   */
  const getTransactionType = (input: string): string => {
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
  };

  /**
   * Calculate transaction cost
   */
  const calculateTransactionCost = (
    gasUsed: bigint,
    gasPrice: bigint
  ): { cost: bigint; formattedCost: string } => {
    const cost = gasUsed * gasPrice;
    return {
      cost,
      formattedCost: formatEther(cost)
    };
  };

  /**
   * Format time ago
   */
  const getTimeAgo = (timestamp: bigint): string => {
    const now = BigInt(Math.floor(Date.now() / 1000));
    const diff = Number(now - timestamp);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return {
    loading,
    error,
    getTransaction,
    getBlockTransactions,
    getTransactionType,
    calculateTransactionCost,
    getTimeAgo
  };
}
