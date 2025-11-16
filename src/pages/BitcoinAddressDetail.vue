<template>
  <q-page class="bitcoin-address-page">
    <!-- Loading Monster -->
    <loading-monster
      v-if="loading"
      :message="queueMessage"
      @cancel="handleCancelLoading"
    />

    <div class="page-content">
      <!-- Address Details -->
      <div v-if="addressInfo" class="address-details fade-in">
        <!-- Header -->
        <div class="page-header">
          <q-btn
            flat
            round
            icon="mdi-arrow-left"
            @click="$router.back()"
            class="back-btn"
          />
          <div>
            <h1 class="page-title">Bitcoin Address</h1>
            <p class="page-subtitle">Mainnet</p>
          </div>
        </div>

        <!-- Address Card -->
        <base-card class="address-card slide-up-soft" elevated>
          <q-card-section>
            <div class="address-header">
              <q-img
                src="~assets/bitcoin.svg"
                width="48px"
                height="48px"
              />
              <div class="address-info">
                <div class="address-label">Address</div>
                <wallet-address-chip color="primary" :address="addressInfo.address" :is-transaction-hash="false" :truncate="true" />
              </div>
              <q-btn
                flat
                round
                icon="mdi-qrcode"
                size="md"
                color="primary"
                @click="showQrCode"
              >
                <q-tooltip>Show QR</q-tooltip>
              </q-btn>
            </div>
          </q-card-section>
        </base-card>

        <!-- Balance Card -->
        <base-card class="balance-card slide-up-soft stagger-1" bordered>
          <q-card-section>
            <div class="balance-header">
              <h3 class="card-title">Balance</h3>
              <q-img src="~assets/bitcoin.svg" width="24px" height="24px" />
            </div>
            <div class="balance-amount">
              <span class="balance-value">{{ bitcoinStore.formatBTC(balance) }}</span>
              <span class="balance-symbol">BTC</span>
            </div>
            <div v-if="balance > 0" class="balance-usd text-grey-7 q-mt-sm">
              ≈ {{ priceStore.formatUsdValue(parseFloat(bitcoinStore.formatBTC(balance)), 'BTC') }} USD
            </div>
          </q-card-section>
        </base-card>

        <!-- Statistics Card -->
        <base-card class="stats-card slide-up-soft stagger-2" bordered>
          <q-card-section>
            <h3 class="card-title">Statistics</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-label">Total Transactions</div>
                <div class="stat-value">{{ totalTxCount }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Total Received</div>
                <div class="stat-value">{{ bitcoinStore.formatBTC(totalReceived) }} BTC</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Total Sent</div>
                <div class="stat-value">{{ bitcoinStore.formatBTC(totalSent) }} BTC</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Unspent Outputs</div>
                <div class="stat-value">{{ utxos.length }}</div>
              </div>
            </div>
          </q-card-section>
        </base-card>

        <!-- UTXOs Card -->
        <base-card
          v-if="utxos.length > 0"
          class="utxos-card slide-up-soft stagger-3"
          bordered
        >
          <q-card-section>
            <h3 class="card-title">
              <q-icon name="mdi-treasure-chest" size="20px" color="primary" class="q-mr-sm" />
              Unspent Outputs ({{ utxos.length }})
            </h3>
            <q-list separator>
              <q-item v-for="(utxo, index) in utxos.slice(0, 10)" :key="index" class="utxo-item">
                <q-item-section>
                  <q-item-label class="utxo-txid">
                    <wallet-address-chip
                      color="primary"
                      :address="utxo.txid"
                      :is-transaction-hash="true"
                      icon="mdi-receipt-text"
                      clickable
                      @click="navigateToTransaction(utxo.txid)"
                    />
                  </q-item-label>
                  <q-item-label caption class="utxo-details">
                    <span>Output #{{ utxo.vout }}</span>
                    <span class="q-mx-sm">•</span>
                    <q-img src="~assets/bitcoin.svg" width="14px" height="14px" />
                    <strong class="q-ml-xs">{{ bitcoinStore.formatBTC(utxo.value) }} BTC</strong>
                    <span class="q-ml-xs text-grey-7">({{ priceStore.formatUsdValue(parseFloat(bitcoinStore.formatBTC(utxo.value)), 'BTC') }} USD)</span>
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
            <div v-if="utxos.length > 10" class="text-center q-mt-md text-grey-6">
              Showing 10 of {{ utxos.length }} UTXOs
            </div>
          </q-card-section>
        </base-card>

        <!-- Transactions Card -->
        <base-card
          v-if="transactions.length > 0"
          class="transactions-card slide-up-soft stagger-4"
          bordered
        >
          <q-card-section>
            <h3 class="card-title">
              <q-icon name="mdi-swap-horizontal" size="20px" color="primary" class="q-mr-sm" />
              Recent Transactions
            </h3>
            <q-list separator>
              <q-item
                v-for="(tx, index) in transactions.slice(0, 10)"
                :key="index"
                clickable
                @click="navigateToTransaction(tx.txid)"
                class="tx-item"
                v-ripple
              >
                <q-item-section avatar>
                  <q-icon
                    :name="tx.status.confirmed ? 'mdi-check-circle' : 'mdi-clock-outline'"
                    :color="tx.status.confirmed ? 'positive' : 'warning'"
                    size="32px"
                  />
                </q-item-section>

                <q-item-section>
                  <q-item-label class="tx-txid">
                    {{ tx.txid.substring(0, 8) }}...{{ tx.txid.substring(tx.txid.length - 8) }}
                  </q-item-label>
                  <q-item-label caption>
                    <span v-if="tx.status.block_time">
                      {{ bitcoinStore.getTimeAgo(tx.status.block_time) }}
                    </span>
                    <span v-else>Unconfirmed</span>
                  </q-item-label>
                </q-item-section>

                <q-item-section side>
                  <q-item-label class="tx-value">
                    <q-img src="~assets/bitcoin.svg" width="16px" height="16px" />
                    {{ calculateTxValue(tx) }} BTC
                    <span class="text-grey-7 q-ml-xs">({{ priceStore.formatUsdValue(parseFloat(calculateTxValue(tx)), 'BTC') }} USD)</span>
                  </q-item-label>
                  <q-item-label caption>
                    Fee: {{ bitcoinStore.formatBTC(tx.fee) }} BTC
                    <span class="text-grey-7">({{ priceStore.formatUsdValue(parseFloat(bitcoinStore.formatBTC(tx.fee)), 'BTC') }} USD)</span>
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
            <div v-if="transactions.length > 10" class="text-center q-mt-md text-grey-6">
              Showing 10 of {{ transactions.length }} transactions
            </div>
          </q-card-section>
        </base-card>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-container fade-in">
        <base-card elevated>
          <q-card-section class="text-center">
            <q-icon name="mdi-alert-circle" size="64px" color="negative" class="q-mb-md" />
            <h3 class="text-h6 q-mb-sm">Address Not Found</h3>
            <!-- <p class="text-grey-7 q-mb-lg">{{ error }}</p> -->
            <pill-button
              label="Go Back"
              icon="mdi-arrow-left"
              bg-color="#3b82f6"
              text-color="#ffffff"
              @click="$router.back()"
            />
          </q-card-section>
        </base-card>
      </div>
    </div>

    <!-- QR Code Dialog -->
    <qr-code-dialog
      v-if="addressInfo"
      v-model="showQrDialog"
      :address="addressInfo.address"
      chain-name="Bitcoin"
      :chain-logo="bitcoinIcon"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBitcoinStore } from '../stores/bitcoin-store';
import { usePriceStore } from '../stores/price-store';
import { useSearchStore } from '../stores/search-store';
import BaseCard from '../components/BaseCard.vue';
import WalletAddressChip from '../components/WalletAddressChip.vue';
import LoadingMonster from '../components/LoadingMonster.vue';
import PillButton from '../components/PillButton.vue';
import QrCodeDialog from '../components/QrCodeDialog.vue';
import bitcoinIcon from '../assets/bitcoin.svg';

const route = useRoute();
const router = useRouter();
const showQrDialog = ref(false);

const bitcoinStore = useBitcoinStore();
const priceStore = usePriceStore();
const searchStore = useSearchStore();

const addressInfo = ref<Awaited<ReturnType<typeof bitcoinStore.getAddress>> | null>(null);
const transactions = ref<Awaited<ReturnType<typeof bitcoinStore.getAddressTransactions>>>([]);
const utxos = ref<Awaited<ReturnType<typeof bitcoinStore.getAddressUtxo>>>([]);
const loading = ref(false);
const error = ref<string | null>(null);

let queueCheckInterval: NodeJS.Timeout | null = null;

const queueMessage = computed(() => {
  const queueStatus = bitcoinStore.getQueueStatus();
  if (queueStatus.queueLength > 0) {
    return `Fetching... (${queueStatus.queueLength} requests in queue)`;
  }
  return 'Fetching address data...';
});

const balance = computed(() => {
  if (!addressInfo.value) return 0;
  return bitcoinStore.calculateBalance(addressInfo.value);
});

const totalTxCount = computed(() => {
  if (!addressInfo.value) return 0;
  return addressInfo.value.chain_stats.tx_count + addressInfo.value.mempool_stats.tx_count;
});

const totalReceived = computed(() => {
  if (!addressInfo.value) return 0;
  return addressInfo.value.chain_stats.funded_txo_sum + addressInfo.value.mempool_stats.funded_txo_sum;
});

const totalSent = computed(() => {
  if (!addressInfo.value) return 0;
  return addressInfo.value.chain_stats.spent_txo_sum + addressInfo.value.mempool_stats.spent_txo_sum;
});

const calculateTxValue = (tx: any) => {
  const outputTotal = bitcoinStore.calculateOutputTotal(tx);
  return bitcoinStore.formatBTC(outputTotal);
};

const navigateToTransaction = (txid: string) => {
  router.push({
    name: 'bitcoin-transaction',
    params: { txid }
  });
};

const handleCancelLoading = () => {
  router.push({ name: 'home' });
};

const showQrCode = () => {
  if (!addressInfo.value) return;
  showQrDialog.value = true;
};

const loadAddressData = async () => {
  const address = route.params.address as string;
  loading.value = true;
  error.value = null;

  try {
    // Load address info, transactions, and UTXOs in sequence (rate limited)
    addressInfo.value = await bitcoinStore.getAddress(address);
    transactions.value = await bitcoinStore.getAddressTransactions(address);
    utxos.value = await bitcoinStore.getAddressUtxo(address);

    // Only add to recent searches if successfully loaded
    searchStore.addSearch(address, 'Address', 'bitcoin');
  } catch (err) {
    console.error('Failed to load Bitcoin address:', err);
    error.value = err instanceof Error ? err.message : 'Failed to load address';
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await loadAddressData();

  // Update queue message periodically while loading
  queueCheckInterval = setInterval(() => {
    if (loading.value) {
      const status = bitcoinStore.getQueueStatus();
      console.log(`Queue status: ${status.queueLength} pending`);
    }
  }, 500);
});

onUnmounted(() => {
  if (queueCheckInterval) {
    clearInterval(queueCheckInterval);
  }
});
</script>

<style scoped lang="scss">
@import '../css/animations.css';
@import '../css/transitions.css';

.bitcoin-address-page {
  min-height: 100vh;
  background: #fafafa;
}

.page-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.back-btn {
  color: #6b7280;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.page-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 4px 0 0;
}

.address-card {
  margin-bottom: 16px;
}

.address-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.address-info {
  flex: 1;
}

.address-label {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
  font-weight: 600;
}

.balance-card {
  margin-bottom: 16px;
}

.balance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin: 0;
  display: flex;
  align-items: center;
}

.balance-amount {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.balance-value {
  font-size: 32px;
  font-weight: 700;
  color: #111827;
}

.balance-symbol {
  font-size: 18px;
  font-weight: 600;
  color: #6b7280;
}

.balance-usd {
  font-size: 16px;
}

.stats-card,
.utxos-card,
.transactions-card {
  margin-bottom: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-item {
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.utxo-item,
.tx-item {
  padding: 16px;
}

.utxo-txid {
  margin-bottom: 8px;
}

.utxo-details {
  display: flex;
  align-items: center;
  color: #6b7280;
}

.tx-txid {
  font-family: 'Roboto Mono', monospace;
  font-size: 14px;
  color: #111827;
  margin-bottom: 4px;
}

.tx-value {
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 4px;
}

// Mobile responsive - stack transaction details vertically
@media (max-width: 599px) {
  .tx-item {
    .q-item__section--side {
      padding-top: 8px;
      align-items: flex-start !important;
    }

    &.q-item {
      flex-direction: column;
      align-items: flex-start;
    }
  }
}

.error-container {
  max-width: 600px;
  margin: 80px auto;
}
</style>
