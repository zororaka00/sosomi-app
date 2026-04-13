<template>
  <q-page class="transaction-page">
    <!-- Loading Monster -->
    <loading-monster
      v-if="loading"
      message="Fetching transaction data..."
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
            <h1 class="page-title">Transaction Detail</h1>
            <p class="page-subtitle">View transaction information on {{ currentChain?.name }}</p>
          </div>
        </div>

        <!-- Status Card -->
        <base-card class="status-card slide-up-soft" elevated>
          <q-card-section class="status-content">
            <q-icon
              :name="transaction.status === 'success' ? 'mdi-check-circle' : 'mdi-close-circle'"
              :color="transaction.status === 'success' ? 'positive' : 'negative'"
              size="48px"
            />
            <div class="status-text">
              <div class="status-label">Status</div>
              <div :class="['status-value', `status-value--${transaction.status}`]">
                {{ transaction.status === 'success' ? 'Success' : 'Failed' }}
              </div>
            </div>
            <q-badge
              v-if="transaction.confirmations > 0"
              color="primary"
              :label="`${transaction.confirmations} confirmations`"
              class="confirmations-badge"
            />
          </q-card-section>
        </base-card>

        <!-- Transaction Info Card -->
        <base-card class="info-card slide-up-soft stagger-1" bordered>
          <q-card-section>
            <div class="info-row">
              <div class="info-label">Transaction Hash</div>
              <div class="info-value">
                <wallet-address-chip
                  color="primary"
                  :address="transaction.hash"
                  :is-transaction-hash="true"
                  icon="mdi-receipt-text"
                />
              </div>
            </div>

            <q-separator class="info-separator" />

            <div class="info-row">
              <div class="info-label">From</div>
              <div class="info-value">
                <wallet-address-chip
                  color="primary"
                  :address="transaction.from"
                  :is-transaction-hash="true"
                  clickable
                  @click="navigateToAddress(transaction.from)"
                />
              </div>
            </div>

            <q-separator class="info-separator" />

            <div class="info-row">
              <div class="info-label">To</div>
              <div class="info-value">
                <wallet-address-chip
                  v-if="transaction.to"
                  color="primary"
                  :address="transaction.to"
                  :is-transaction-hash="true"
                  clickable
                  @click="navigateToAddress(transaction.to)"
                />
                <span v-else class="text-grey-6">Contract Creation</span>
              </div>
            </div>            <q-separator class="info-separator" />

            <div class="info-row">
              <div class="info-label">Transaction Type</div>
              <div class="info-value">
                <q-badge color="primary" :label="txType" />
              </div>
            </div>

            <q-separator class="info-separator" />

            <div class="info-row">
              <div class="info-label">Value</div>
              <div class="info-value value-amount">
                <q-icon name="currency_exchange" size="20px" color="primary" />
                <span>{{ transaction.formattedValue }} {{ currentChain?.chain.nativeCurrency.symbol }}</span>
              </div>
              <div v-if="transaction.value > 0n" class="info-usd text-grey-7">
                ≈ {{ priceStore.formatUsdValue(parseFloat(transaction.formattedValue), currentChain?.chain.nativeCurrency.symbol || '') }} USD
              </div>
            </div>

            <q-separator class="info-separator" />

            <div v-if="transactionCost" class="info-row">
              <div class="info-label">Transaction Fee</div>
              <div class="info-value">
                {{ transactionCost.formattedCost }} {{ currentChain?.chain.nativeCurrency.symbol }}
              </div>
              <div v-if="transactionCost.cost > 0" class="info-usd text-grey-7">
                ≈ {{ priceStore.formatUsdValue(parseFloat(transactionCost.formattedCost), currentChain?.chain.nativeCurrency.symbol || '') }} USD
              </div>
            </div>

            <q-separator class="info-separator" />

            <div class="info-row">
              <div class="info-label">Block Number</div>
              <div class="info-value mono-text">
                {{ transaction.blockNumber.toString() }}
              </div>
            </div>

            <q-separator class="info-separator" />

            <div class="info-row">
              <div class="info-label">Timestamp</div>
              <div class="info-value">
                <span v-if="transaction.timestamp">
                  {{ formatTimestamp(transaction.timestamp) }}&nbsp;
                  <span class="text-grey-6">
                    ({{ chainStore.getTimeAgo(transaction.timestamp) }})
                  </span>
                </span>
                <span v-else class="text-grey-6">Pending...</span>
              </div>
            </div>

            <q-separator class="info-separator" />

            <div class="info-row">
              <div class="info-label">Gas Price</div>
              <div class="info-value">
                {{ transaction.formattedGasPrice }} Gwei
              </div>
            </div>

            <q-separator v-if="transaction.gasUsed" class="info-separator" />

            <div v-if="transaction.gasUsed" class="info-row">
              <div class="info-label">Gas Used</div>
              <div class="info-value mono-text">
                {{ transaction.gasUsed.toString() }}
              </div>
            </div>

            <q-separator class="info-separator" />

            <div class="info-row">
              <div class="info-label">Nonce</div>
              <div class="info-value mono-text">
                {{ transaction.nonce }}
              </div>
            </div>
          </q-card-section>
        </base-card>

        <!-- Token/NFT Transfers Card -->
        <base-card v-if="transaction.logs && transaction.logs.length > 0" class="logs-card slide-up-soft stagger-2" bordered>
          <q-card-section>
            <h3 class="card-title">
              <q-icon name="mdi-swap-horizontal" size="20px" color="primary" class="q-mr-sm" />
              Token Transfers
            </h3>

            <q-list separator>
              <q-item v-for="(log, index) in transaction.logs" :key="index" class="log-item">
                <q-item-section>
                  <q-item-label class="log-token-name">
                    {{ log.tokenName }} ({{ log.tokenSymbol }})
                  </q-item-label>
                  <q-item-label caption class="log-type">
                    {{ log.type === 'ERC20_Transfer' ? 'Token Transfer' : log.type === 'ERC721_Transfer' ? 'NFT Transfer' : 'ERC-1155 Transfer' }}
                  </q-item-label>

                  <div class="log-addresses">
                    <div class="log-address-row">
                      <span class="log-label">From:</span>
                      <wallet-address-chip
                        color="primary"
                        :address="log.from"
                        :is-transaction-hash="true"
                        icon="mdi-account"
                        clickable
                        @click="navigateToAddress(log.from)"
                      />
                    </div>
                    <div class="log-address-row">
                      <span class="log-label">To:</span>
                      <wallet-address-chip
                        color="primary"
                        :address="log.to"
                        :is-transaction-hash="true"
                        icon="mdi-account"
                        clickable
                        @click="navigateToAddress(log.to)"
                      />
                    </div>
                  </div>

                  <q-item-label v-if="log.value" class="log-value">
                    <q-icon name="mdi-cash" size="16px" class="q-mr-xs" />
                    Amount:&nbsp;<strong>{{ log.value }} {{ log.tokenSymbol }}</strong>
                  </q-item-label>

                  <q-item-label v-if="log.tokenId" class="log-value">
                    <q-icon name="mdi-tag" size="16px" class="q-mr-xs" />
                    Token ID:&nbsp;<strong>#{{ log.tokenId }}</strong>
                  </q-item-label>

                  <q-item-label caption class="log-contract">
                    <q-icon name="mdi-file-code" size="14px" class="q-mr-xs" />
                    Contract:
                    <wallet-address-chip
                      color="primary"
                      :address="log.tokenAddress"
                      :is-transaction-hash="true"
                      icon="mdi-file-code"
                      clickable
                      @click="navigateToAddress(log.tokenAddress)"
                    />
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </base-card>

        <!-- Input Data Card -->
        <base-card v-if="transaction.input !== '0x'" class="input-card slide-up-soft stagger-2" bordered>
          <q-card-section>
            <h3 class="card-title">Input Data</h3>
            <div class="input-data">
              <code>{{ transaction.input }}</code>
            </div>
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
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import type { Hash } from 'viem';
import { useChainStore } from '../stores/chain-store';
import { useSearchStore } from '../stores/search-store';
import { usePriceStore } from '../stores/price-store';
import BaseCard from '../components/BaseCard.vue';
import WalletAddressChip from '../components/WalletAddressChip.vue';
import LoadingMonster from '../components/LoadingMonster.vue';
import PillButton from '../components/PillButton.vue';

const route = useRoute();
const router = useRouter();

const chainStore = useChainStore();
const searchStore = useSearchStore();
const priceStore = usePriceStore();
const { currentChain, loading, error } = storeToRefs(chainStore);

const transaction = ref<Awaited<ReturnType<typeof chainStore.getTransaction>> | null>(null);

const txType = computed(() => {
  if (!transaction.value) return 'Unknown';

  // If transaction has logs (token/NFT transfers), it's a Contract Interaction
  if (transaction.value.logs && transaction.value.logs.length > 0) {
    return 'Contract Interaction';
  }

  return chainStore.getTransactionType(transaction.value.input);
});

const transactionCost = computed(() => {
  if (!transaction.value?.gasUsed || !transaction.value?.gasPrice) return null;
  return chainStore.calculateTransactionCost(transaction.value.gasUsed, transaction.value.gasPrice);
});

const formatTimestamp = (timestamp: bigint): string => {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleString();
};

const navigateToAddress = (address: string) => {
  router.push({ name: 'address', params: { address } });
};

const handleCancelLoading = () => {
  // Navigate back to home page
  router.push({ name: 'home' });
};

const loadTransaction = async () => {
  const hash = route.params.hash as Hash;
  try {
    transaction.value = await chainStore.getTransaction(hash);

    console.log('Transaction loaded:', {
      hash: transaction.value.hash,
      logsCount: transaction.value.logs?.length || 0,
      logs: transaction.value.logs
    });

    // Only add to recent searches if successfully loaded
    searchStore.addSearch(hash, 'Transaction', chainStore.currentChainId);
  } catch (err) {
    console.error('Failed to load transaction:', err);
    // Don't add to recent searches on error
  }
};

onMounted(() => {
  loadTransaction();
});
</script>

<style scoped>
.transaction-page {
  padding: 32px 24px;
}

.page-content {
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.back-btn {
  flex-shrink: 0;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 4px;
  line-height: 1.2;
  transition: color 0.3s ease;
}

.page-subtitle {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0;
  transition: color 0.3s ease;
}

.status-card {
  margin-bottom: 24px;
}

.status-content {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
}

.status-text {
  flex: 1;
}

.status-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
  transition: color 0.3s ease;
}

.status-value {
  font-size: 24px;
  font-weight: 700;
}

.status-value--success {
  color: #059669;
}

.status-value--reverted {
  color: #dc2626;
}

.confirmations-badge {
  font-size: 13px;
  padding: 8px 16px;
}

.info-card {
  margin-bottom: 24px;
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
  transition: color 0.3s ease;
}

.input-card {
  margin-bottom: 24px;
}

.logs-card {
  margin-bottom: 24px;
}

.log-item {
  padding: 16px 0;
}

.log-token-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 4px;
  transition: color 0.3s ease;
}

.log-type {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
  margin-bottom: 12px;
  transition: color 0.3s ease;
}

.log-addresses {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.log-address-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.log-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  min-width: 50px;
  transition: color 0.3s ease;
}

.log-value {
  font-size: 14px;
  color: var(--color-text-primary);
  margin: 8px 0;
  display: flex;
  align-items: center;
  transition: color 0.3s ease;
}

.log-contract {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.3s ease;
}

.input-data {
  background-color: var(--color-bg-tertiary);
  border-radius: 8px;
  padding: 16px;
  overflow-x: auto;
  transition: background-color 0.3s ease;
}

.input-data code {
  font-family: 'Roboto Mono', monospace;
  font-size: 12px;
  color: var(--color-text-secondary);
  word-break: break-all;
  transition: color 0.3s ease;
}

.loading-container,
.error-container {
  max-width: 700px;
  margin: 40px auto;
}

/* Responsive */
@media (max-width: 600px) {
  .transaction-page {
    padding: 24px 16px;
  }

  .page-title {
    font-size: 24px;
  }

  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .info-label {
    min-width: auto;
  }

  .info-value {
    text-align: left;
  }

  .value-amount {
    justify-content: flex-start;
  }

  .status-content {
    flex-wrap: wrap;
  }
}
</style>
