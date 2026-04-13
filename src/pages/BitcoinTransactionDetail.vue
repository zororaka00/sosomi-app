<template>
  <q-page class="bitcoin-transaction-page">
    <!-- Loading Monster -->
    <loading-monster
      v-if="loading"
      :message="queueMessage"
      @cancel="handleCancelLoading"
    />

    <div class="page-content">
      <!-- Transaction Details -->
      <div v-if="transaction" class="transaction-details fade-in">
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
            <h1 class="page-title">Bitcoin Transaction</h1>
            <p class="page-subtitle">Mainnet</p>
          </div>
        </div>

        <!-- Status Card -->
        <base-card class="status-card slide-up-soft" elevated>
          <q-card-section class="status-content">
            <q-img
              src="~assets/bitcoin.svg"
              width="56px"
              height="56px"
            />
            <div class="status-text">
              <div class="status-label">Status</div>
              <div :class="['status-value', `status-value--${transaction.status.confirmed ? 'confirmed' : 'pending'}`]">
                {{ transaction.status.confirmed ? 'Confirmed' : 'Unconfirmed' }}
              </div>
            </div>
            <q-badge
              v-if="transaction.status.confirmed && transaction.status.block_height"
              color="primary"
              :label="`Block ${transaction.status.block_height}`"
              class="confirmations-badge"
            />
          </q-card-section>
        </base-card>

        <!-- Transaction Info Card -->
        <base-card class="info-card slide-up-soft stagger-1" bordered>
          <q-card-section>
            <div class="info-row">
              <div class="info-label">Transaction ID</div>
              <div class="info-value">
                <wallet-address-chip
                  color="primary"
                  :address="transaction.txid"
                  :is-transaction-hash="true"
                  icon="mdi-receipt-text"
                />
              </div>
            </div>

            <q-separator class="info-separator" />

            <div class="info-row">
              <div class="info-label">Amount</div>
              <div class="info-value value-amount">
                <q-img src="~assets/bitcoin.svg" width="20px" height="20px" />
                <span>{{ bitcoinStore.formatBTC(outputTotal) }} BTC</span>
              </div>
              <div v-if="outputTotal > 0" class="info-usd text-grey-7">
                ≈ {{ priceStore.formatUsdValue(parseFloat(bitcoinStore.formatBTC(outputTotal)), 'BTC') }} USD
              </div>
            </div>

            <q-separator class="info-separator" />

            <div class="info-row">
              <div class="info-label">Fee</div>
              <div class="info-value">
                {{ bitcoinStore.formatBTC(transaction.fee) }} BTC
              </div>
              <div v-if="transaction.fee > 0" class="info-usd text-grey-7">
                ≈ {{ priceStore.formatUsdValue(parseFloat(bitcoinStore.formatBTC(transaction.fee)), 'BTC') }} USD
              </div>
            </div>

            <q-separator v-if="transaction.status.block_height" class="info-separator" />

            <div v-if="transaction.status.block_height" class="info-row">
              <div class="info-label">Block Height</div>
              <div class="info-value mono-text">
                {{ transaction.status.block_height }}
              </div>
            </div>

            <q-separator v-if="transaction.status.block_time" class="info-separator" />

            <div v-if="transaction.status.block_time" class="info-row">
              <div class="info-label">Timestamp</div>
              <div class="info-value">
                {{ bitcoinStore.formatTimestamp(transaction.status.block_time) }}&nbsp;
                <span class="text-grey-6">
                  ({{ bitcoinStore.getTimeAgo(transaction.status.block_time) }})
                </span>
              </div>
            </div>

            <q-separator class="info-separator" />

            <div class="info-row">
              <div class="info-label">Size</div>
              <div class="info-value mono-text">
                {{ transaction.size }} bytes ({{ transaction.weight }} WU)
              </div>
            </div>

            <q-separator class="info-separator" />

            <div class="info-row">
              <div class="info-label">Fee Rate</div>
              <div class="info-value">
                {{ feeRate }} sat/vB
              </div>
            </div>
          </q-card-section>
        </base-card>

        <!-- Inputs Card -->
        <base-card class="inputs-card slide-up-soft stagger-2" bordered>
          <q-card-section>
            <h3 class="card-title">
              <q-icon name="mdi-arrow-down-circle" size="20px" color="negative" class="q-mr-sm" />
              Inputs ({{ transaction.vin.length }})
            </h3>

            <q-list separator>
              <q-item v-for="(input, index) in transaction.vin" :key="index" class="input-item">
                <q-item-section>
                  <q-item-label v-if="input.is_coinbase" class="coinbase-label">
                    <q-icon name="mdi-star" color="warning" size="16px" class="q-mr-xs" />
                    Coinbase (Newly Generated Coins)
                  </q-item-label>
                  <template v-else>
                    <q-item-label class="input-address">
                      <wallet-address-chip
                        v-if="input.prevout?.scriptpubkey_address"
                        color="negative"
                        :address="input.prevout.scriptpubkey_address"
                        :is-transaction-hash="false"
                        :truncate="true"
                        icon="mdi-wallet"
                        clickable
                        @click="navigateToAddress(input.prevout.scriptpubkey_address)"
                      />
                      <span v-else class="text-grey-6">Unknown</span>
                    </q-item-label>
                    <q-item-label caption class="input-value">
                      <q-img src="~assets/bitcoin.svg" width="14px" height="14px" class="q-mr-xs" />
                      {{ input.prevout ? bitcoinStore.formatBTC(input.prevout.value) : '0' }} BTC
                    </q-item-label>
                    <q-item-label v-if="input.prevout" caption class="text-grey-7 q-mt-xs">
                      ≈ {{ priceStore.formatUsdValue(parseFloat(bitcoinStore.formatBTC(input.prevout.value)), 'BTC') }} USD
                    </q-item-label>
                  </template>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </base-card>

        <!-- Outputs Card -->
        <base-card class="outputs-card slide-up-soft stagger-3" bordered>
          <q-card-section>
            <h3 class="card-title">
              <q-icon name="mdi-arrow-up-circle" size="20px" color="positive" class="q-mr-sm" />
              Outputs ({{ transaction.vout.length }})
            </h3>

            <q-list separator>
              <q-item v-for="(output, index) in transaction.vout" :key="index" class="output-item">
                <q-item-section>
                  <q-item-label class="output-address">
                    <wallet-address-chip
                      v-if="output.scriptpubkey_address"
                      color="positive"
                      :address="output.scriptpubkey_address"
                      :is-transaction-hash="false"
                      :truncate="true"
                      icon="mdi-wallet"
                      clickable
                      @click="navigateToAddress(output.scriptpubkey_address)"
                    />
                    <span v-else class="text-grey-6">{{ output.scriptpubkey_type }}</span>
                  </q-item-label>
                  <q-item-label caption class="output-value">
                    <q-img src="~assets/bitcoin.svg" width="14px" height="14px" class="q-mr-xs" />
                    {{ bitcoinStore.formatBTC(output.value) }} BTC
                  </q-item-label>
                  <q-item-label caption class="text-grey-7 q-mt-xs">
                    ≈ {{ priceStore.formatUsdValue(parseFloat(bitcoinStore.formatBTC(output.value)), 'BTC') }} USD
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </base-card>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-container fade-in">
        <base-card elevated>
          <q-card-section class="text-center">
            <q-icon name="mdi-alert-circle" size="64px" color="negative" class="q-mb-md" />
            <h3 class="text-h6 q-mb-sm">Transaction Not Found</h3>
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

const route = useRoute();
const router = useRouter();

const bitcoinStore = useBitcoinStore();
const priceStore = usePriceStore();
const searchStore = useSearchStore();

const transaction = ref<Awaited<ReturnType<typeof bitcoinStore.getTransaction>> | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

let queueCheckInterval: NodeJS.Timeout | null = null;

const queueMessage = computed(() => {
  const queueStatus = bitcoinStore.getQueueStatus();
  if (queueStatus.queueLength > 0) {
    return `Fetching... (${queueStatus.queueLength} requests in queue)`;
  }
  return 'Fetching transaction data...';
});

const inputTotal = computed(() => {
  if (!transaction.value) return 0;
  return bitcoinStore.calculateInputTotal(transaction.value);
});

const outputTotal = computed(() => {
  if (!transaction.value) return 0;
  return bitcoinStore.calculateOutputTotal(transaction.value);
});

const feeRate = computed(() => {
  if (!transaction.value || transaction.value.weight === 0) return '0';
  const vsize = transaction.value.weight / 4;
  const rate = transaction.value.fee / vsize;
  return rate.toFixed(2);
});

const navigateToAddress = (address: string) => {
  router.push({ name: 'bitcoin-address', params: { address } });
};

const handleCancelLoading = () => {
  router.push({ name: 'home' });
};

const loadTransaction = async () => {
  const txid = route.params.txid as string;
  loading.value = true;
  error.value = null;

  try {
    transaction.value = await bitcoinStore.getTransaction(txid);

    // Only add to recent searches if successfully loaded
    searchStore.addSearch(txid, 'Transaction', 'bitcoin');
  } catch (err) {
    console.error('Failed to load Bitcoin transaction:', err);
    error.value = err instanceof Error ? err.message : 'Failed to load transaction';
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await loadTransaction();

  // Update queue message periodically while loading
  queueCheckInterval = setInterval(() => {
    if (loading.value) {
      // Trigger reactivity update
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

.bitcoin-transaction-page {
  min-height: 100vh;
  background: var(--color-bg-primary);
  transition: background-color 0.3s ease;
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
  color: var(--color-text-secondary);
  transition: color 0.3s ease;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
  transition: color 0.3s ease;
}

.page-subtitle {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 4px 0 0;
  transition: color 0.3s ease;
}

.status-card {
  margin-bottom: 16px;
}

.status-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px !important;
}

.status-text {
  flex: 1;
}

.status-label {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
  transition: color 0.3s ease;
}

.status-value {
  font-size: 20px;
  font-weight: 700;

  &--confirmed {
    color: #10b981;
  }

  &--pending {
    color: #f59e0b;
  }
}

.confirmations-badge {
  font-weight: 600;
}

.info-card,
.inputs-card,
.outputs-card {
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px 0;
}

.info-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-secondary);
  transition: color 0.3s ease;
}

.info-value {
  font-size: 14px;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  transition: color 0.3s ease;
}

.info-usd {
  font-size: 13px;
  margin-top: 4px;
}

.value-amount {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
}

.mono-text {
  font-family: 'Roboto Mono', monospace;
}

.info-separator {
  margin: 0;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 16px;
  display: flex;
  align-items: center;
  transition: color 0.3s ease;
}

.input-item,
.output-item {
  padding: 16px;
}

.coinbase-label {
  font-weight: 600;
  color: #f59e0b;
  display: flex;
  align-items: center;
}

.input-address,
.output-address {
  margin-bottom: 8px;
}

.input-value,
.output-value {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: var(--color-text-secondary);
  transition: color 0.3s ease;
}

.error-container {
  max-width: 600px;
  margin: 80px auto;
}
</style>
