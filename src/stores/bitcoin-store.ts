import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiBtc } from 'src/boot/axios';

// Rate limiting for API calls
const RATE_LIMIT_DELAY = 3000; // 3 seconds delay between API calls
const RATE_LIMIT_ERROR_DELAY = 5000; // 5 seconds delay after rate limit error

interface BitcoinTransaction {
  txid: string;
  version: number;
  locktime: number;
  size: number;
  weight: number;
  fee: number;
  vin: Array<{
    txid: string;
    vout: number;
    is_coinbase: boolean;
    scriptsig: string;
    scriptsig_asm: string;
    sequence: number;
    witness: string[];
    prevout?: {
      scriptpubkey: string;
      scriptpubkey_address: string;
      value: number;
    };
  }>;
  vout: Array<{
    scriptpubkey: string;
    scriptpubkey_address?: string;
    scriptpubkey_type: string;
    value: number;
  }>;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
    block_time?: number;
  };
}

interface BitcoinAddress {
  address: string;
  chain_stats: {
    funded_txo_count: number;
    funded_txo_sum: number;
    spent_txo_count: number;
    spent_txo_sum: number;
    tx_count: number;
  };
  mempool_stats: {
    funded_txo_count: number;
    funded_txo_sum: number;
    spent_txo_count: number;
    spent_txo_sum: number;
    tx_count: number;
  };
}

interface UTXO {
  txid: string;
  vout: number;
  value: number;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
    block_time?: number;
  };
}

interface QueueItem {
  fn: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

export const useBitcoinStore = defineStore('bitcoin', () => {
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Rate limiting queue
  const requestQueue: QueueItem[] = [];
  let isProcessingQueue = false;
  let lastRequestTime = 0;

  // Process queue with rate limiting
  const processQueue = async () => {
    if (isProcessingQueue || requestQueue.length === 0) {
      return;
    }

    isProcessingQueue = true;

    while (requestQueue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;

      // Wait if needed to respect rate limit
      if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
        const waitTime = RATE_LIMIT_DELAY - timeSinceLastRequest;
        console.log(`⏳ Rate limit: waiting ${waitTime}ms before next request...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      const item = requestQueue.shift();
      if (item) {
        try {
          lastRequestTime = Date.now();
          const result = await item.fn();
          item.resolve(result);
        } catch (err: any) {
          // Check if it's a rate limit error (HTTP 429 or specific error message)
          const isRateLimitError =
            err?.response?.status === 429 ||
            err?.message?.toLowerCase().includes('rate limit') ||
            err?.message?.toLowerCase().includes('too many');

          if (isRateLimitError) {
            console.warn(`⚠️ Rate limit detected! Waiting ${RATE_LIMIT_ERROR_DELAY}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_ERROR_DELAY));
            lastRequestTime = Date.now();
          }

          item.reject(err);
        }
      }
    }

    isProcessingQueue = false;
  };

  // Add request to queue
  const queueRequest = <T>(fn: () => Promise<T>): Promise<T> => {
    return new Promise((resolve, reject) => {
      requestQueue.push({ fn, resolve, reject });
      processQueue();
    });
  };

  // Convert satoshis to BTC
  const satoshisToBTC = (satoshis: number): string => {
    return (satoshis / 100000000).toFixed(8);
  };

  // Format BTC value
  const formatBTC = (satoshis: number): string => {
    const btc = satoshisToBTC(satoshis);
    return parseFloat(btc).toString(); // Remove trailing zeros
  };

  // Get transaction by txid
  const getTransaction = async (txid: string): Promise<BitcoinTransaction> => {
    return queueRequest(async () => {
      console.log(`🔄 Fetching Bitcoin transaction: ${txid}`);
      const response = await apiBtc.get<BitcoinTransaction>(`/tx/${txid}`);
      console.log('✅ Bitcoin transaction fetched');
      return response.data;
    });
  };

  // Get address information
  const getAddress = async (address: string): Promise<BitcoinAddress> => {
    return queueRequest(async () => {
      console.log(`🔄 Fetching Bitcoin address: ${address}`);
      const response = await apiBtc.get<BitcoinAddress>(`/address/${address}`);
      console.log('✅ Bitcoin address fetched');
      return response.data;
    });
  };

  // Get address transactions
  const getAddressTransactions = async (address: string): Promise<BitcoinTransaction[]> => {
    return queueRequest(async () => {
      console.log(`🔄 Fetching transactions for address: ${address}`);
      const response = await apiBtc.get<BitcoinTransaction[]>(`/address/${address}/txs`);
      console.log(`✅ Fetched ${response.data.length} transactions`);
      return response.data;
    });
  };

  // Get address UTXOs
  const getAddressUtxo = async (address: string): Promise<UTXO[]> => {
    return queueRequest(async () => {
      console.log(`🔄 Fetching UTXOs for address: ${address}`);
      const response = await apiBtc.get<UTXO[]>(`/address/${address}/utxo`);
      console.log(`✅ Fetched ${response.data.length} UTXOs`);
      return response.data;
    });
  };

  // Get block by hash
  const getBlock = async (hash: string) => {
    return queueRequest(async () => {
      console.log(`🔄 Fetching block: ${hash}`);
      const response = await apiBtc.get(`/block/${hash}`);
      console.log('✅ Block fetched');
      return response.data;
    });
  };

  // Get fee estimates
  const getFeeEstimates = async () => {
    return queueRequest(async () => {
      console.log('🔄 Fetching fee estimates');
      const response = await apiBtc.get(`/fee-estimates`);
      console.log('✅ Fee estimates fetched');
      return response.data;
    });
  };

  // Calculate total input value
  const calculateInputTotal = (tx: BitcoinTransaction): number => {
    return tx.vin.reduce((total, input) => {
      if (input.prevout) {
        return total + input.prevout.value;
      }
      return total;
    }, 0);
  };

  // Calculate total output value
  const calculateOutputTotal = (tx: BitcoinTransaction): number => {
    return tx.vout.reduce((total, output) => total + output.value, 0);
  };

  // Calculate balance from address info
  const calculateBalance = (addressInfo: BitcoinAddress): number => {
    const chainBalance = addressInfo.chain_stats.funded_txo_sum - addressInfo.chain_stats.spent_txo_sum;
    const mempoolBalance = addressInfo.mempool_stats.funded_txo_sum - addressInfo.mempool_stats.spent_txo_sum;
    return chainBalance + mempoolBalance;
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  // Get time ago
  const getTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - (timestamp * 1000);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
  };

  // Validate Bitcoin address
  const isValidBitcoinAddress = (address: string): boolean => {
    // Basic validation for Bitcoin addresses
    // Legacy (P2PKH): starts with 1
    // SegWit (P2SH): starts with 3
    // Bech32 (native SegWit): starts with bc1
    const legacyRegex = /^[1][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
    const p2shRegex = /^[3][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
    const bech32Regex = /^(bc1|tb1)[a-z0-9]{39,87}$/;

    return legacyRegex.test(address) || p2shRegex.test(address) || bech32Regex.test(address);
  };

  // Validate Bitcoin txid
  const isValidBitcoinTxid = (txid: string): boolean => {
    return /^[a-f0-9]{64}$/i.test(txid);
  };

  // Get queue status
  const getQueueStatus = () => {
    return {
      queueLength: requestQueue.length,
      isProcessing: isProcessingQueue,
    };
  };

  return {
    loading,
    error,
    getTransaction,
    getAddress,
    getAddressTransactions,
    getAddressUtxo,
    getBlock,
    getFeeEstimates,
    satoshisToBTC,
    formatBTC,
    calculateInputTotal,
    calculateOutputTotal,
    calculateBalance,
    formatTimestamp,
    getTimeAgo,
    isValidBitcoinAddress,
    isValidBitcoinTxid,
    getQueueStatus,
  };
});
