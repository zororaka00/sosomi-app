import { defineStore } from 'pinia';
import { api } from 'src/boot/axios';
import { ref } from 'vue';

interface CryptoPrice {
  id: number;
  symbol: string;
  name: string;
  price: number;
  updated_at: string;
}

interface PriceResponse {
  success: boolean;
  data: CryptoPrice[];
  count: number;
}

const STORAGE_KEY = 'sosomi_crypto_prices';
const STORAGE_TIMESTAMP_KEY = 'sosomi_crypto_prices_timestamp';
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

export const usePriceStore = defineStore('price', () => {
  const prices = ref<Map<string, CryptoPrice>>(new Map());
  const loading = ref(false);
  const error = ref<string | null>(null);
  let refreshTimer: NodeJS.Timeout | null = null;

  // Load prices from localStorage
  const loadFromStorage = (): boolean => {
    try {
      const storedPrices = localStorage.getItem(STORAGE_KEY);
      const storedTimestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);

      if (!storedPrices || !storedTimestamp) {
        return false;
      }

      const timestamp = parseInt(storedTimestamp, 10);
      const now = Date.now();

      // Check if data is still valid (less than 5 minutes old)
      if (now - timestamp < REFRESH_INTERVAL) {
        const pricesData: CryptoPrice[] = JSON.parse(storedPrices);
        prices.value = new Map(pricesData.map(p => [p.symbol, p]));
        console.log('✅ Loaded crypto prices from localStorage:', pricesData);
        return true;
      }

      console.log('⚠️ Cached prices expired, will fetch new data');
      return false;
    } catch (err) {
      console.error('❌ Failed to load prices from localStorage:', err);
      return false;
    }
  };

  // Save prices to localStorage
  const saveToStorage = (pricesData: CryptoPrice[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pricesData));
      localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
      console.log('✅ Saved crypto prices to localStorage');
    } catch (err) {
      console.error('❌ Failed to save prices to localStorage:', err);
    }
  };

  // Fetch prices from API
  const fetchPrices = async (force = false): Promise<void> => {
    // If not forced and we have valid cached data, skip fetch
    if (!force && prices.value.size > 0) {
      const storedTimestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
      if (storedTimestamp) {
        const timestamp = parseInt(storedTimestamp, 10);
        const now = Date.now();
        if (now - timestamp < REFRESH_INTERVAL) {
          console.log('ℹ️ Using cached prices, next refresh in', Math.round((REFRESH_INTERVAL - (now - timestamp)) / 1000), 'seconds');
          return;
        }
      }
    }

    loading.value = true;
    error.value = null;

    try {
      console.log('🔄 Fetching crypto prices from API...');
      const response = await api.get<PriceResponse>('/price/get-all');

      if (!response.data.success || !response.data.data) {
        throw new Error('Invalid API response');
      }

      // Update prices map
      prices.value = new Map(response.data.data.map(p => [p.symbol, p]));

      // Save to localStorage
      saveToStorage(response.data.data);

      console.log('✅ Crypto prices updated:', {
        ETH: `$${response.data.data.find(p => p.symbol === 'ETH')?.price || 0}`,
        BNB: `$${response.data.data.find(p => p.symbol === 'BNB')?.price || 0}`,
        POL: `$${response.data.data.find(p => p.symbol === 'POL')?.price || 0}`,
      });
    } catch (err) {
      console.error('❌ Failed to fetch crypto prices:', err);
      error.value = err instanceof Error ? err.message : 'Failed to fetch prices';

      // Try to load from storage as fallback
      if (prices.value.size === 0) {
        loadFromStorage();
      }
    } finally {
      loading.value = false;
    }
  };

  // Get price for a specific symbol
  const getPrice = (symbol: string): number => {
    const price = prices.value.get(symbol.toUpperCase());
    return price?.price || 0;
  };

  // Calculate USD value for a crypto amount
  const calculateUsdValue = (amount: number, symbol: string): number => {
    const price = getPrice(symbol);
    return amount * price;
  };

  // Format USD value with proper formatting
  const formatUsdValue = (amount: number, symbol: string): string => {
    const usdValue = calculateUsdValue(amount, symbol);

    if (usdValue === 0) {
      return '$0.00';
    }

    // For values less than $0.01, show more decimals
    if (usdValue < 0.01) {
      return `$${usdValue.toFixed(6)}`;
    }

    // For values less than $1, show 4 decimals
    if (usdValue < 1) {
      return `$${usdValue.toFixed(4)}`;
    }

    // For values >= $1, show 2 decimals with thousand separators
    return `$${usdValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Start auto-refresh timer
  const startAutoRefresh = () => {
    if (refreshTimer) {
      clearInterval(refreshTimer);
    }

    refreshTimer = setInterval(() => {
      console.log('⏰ Auto-refreshing crypto prices...');
      fetchPrices(true);
    }, REFRESH_INTERVAL);

    console.log('✅ Auto-refresh timer started (every 5 minutes)');
  };

  // Stop auto-refresh timer
  const stopAutoRefresh = () => {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
      console.log('⏹️ Auto-refresh timer stopped');
    }
  };

  // Initialize the store
  const initialize = async () => {
    console.log('🚀 Initializing price store...');

    // Try to load from storage first
    const loaded = loadFromStorage();

    // Fetch fresh data if storage is empty or expired
    if (!loaded) {
      await fetchPrices(true);
    }

    // Start auto-refresh timer
    startAutoRefresh();
  };

  return {
    prices,
    loading,
    error,
    fetchPrices,
    getPrice,
    calculateUsdValue,
    formatUsdValue,
    initialize,
    startAutoRefresh,
    stopAutoRefresh,
  };
});
