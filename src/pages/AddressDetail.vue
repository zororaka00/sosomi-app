<template>
  <q-page class="address-page">
    <!-- Loading Monster -->
    <loading-monster
      v-if="loading"
      message="Fetching address data..."
      @cancel="handleCancelLoading"
    />

    <div class="page-content">
      <!-- Address Details -->
      <div v-if="walletInfo" class="address-details fade-in">
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
            <h1 class="page-title">Address Detail</h1>
            <p class="page-subtitle">{{ currentChain?.name }}</p>
          </div>
        </div>

        <!-- Address Card -->
        <base-card class="address-card slide-up-soft" elevated>
          <q-card-section>
            <div class="address-header">
              <q-icon
                name="mdi-wallet"
                size="48px"
                color="primary"
              />
              <div class="address-info">
                <div class="address-label">Address</div>
                <wallet-address-chip color="primary" :address="walletInfo.address" :is-transaction-hash="false" :truncate="true" />
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
              <h3 class="card-title">Native Balance</h3>
              <q-icon name="mdi-cash" size="24px" color="primary" />
            </div>
            <div class="balance-amount">
              <span class="balance-value">{{ walletInfo.formattedBalance }}</span>
              <span class="balance-symbol">{{ currentChain?.chain.nativeCurrency.symbol }}</span>
            </div>
            <div v-if="parseFloat(walletInfo.formattedBalance) > 0" class="balance-usd text-grey-7 q-mt-sm">
              ≈ {{ priceStore.formatUsdValue(parseFloat(walletInfo.formattedBalance), currentChain?.chain.nativeCurrency.symbol || '') }} USD
            </div>
          </q-card-section>
        </base-card>

        <!-- Token Balances Card -->
        <base-card
          v-if="walletInfo.tokens.length > 0"
          class="tokens-card slide-up-soft stagger-2"
          bordered
        >
          <q-card-section>
            <h3 class="card-title">Token Balances</h3>
            <q-list separator>
              <token-row
                v-for="token in walletInfo.tokens"
                :key="token.address"
                :token="{
                  symbol: token.symbol,
                  name: token.name,
                  balance: token.formattedBalance
                }"
                clickable
              />
            </q-list>
          </q-card-section>
        </base-card>

        <!-- Add Token Section (for custom tokens) -->
        <base-card class="add-token-card slide-up-soft stagger-4" bordered>
          <q-card-section>
            <h3 class="card-title">Add Custom Token</h3>
            <p class="card-subtitle">
              Enter an ERC20 token contract address to check its balance for this address
            </p>

            <!-- Saved Tokens List -->
            <div v-if="chainStore.currentChainSavedTokens.length > 0" class="saved-tokens-section">
              <div class="saved-tokens-title">Previously Added Tokens:</div>
              <div class="saved-tokens-chips">
                <q-chip
                  v-for="token in chainStore.currentChainSavedTokens"
                  :key="token.address"
                  clickable
                  outline
                  color="primary"
                  :icon="'mdi-coin'"
                  @click="customTokenAddress = token.address"
                  removable
                  @remove="removeSavedToken(token.address)"
                  class="saved-token-chip"
                >
                  {{ token.symbol }}
                </q-chip>
              </div>
            </div>

            <div class="add-token-form">
              <pill-input
                v-model="customTokenAddress"
                placeholder="Enter token contract address"
                prepend-icon="mdi-coin"
                bg-color="#fafafa"
                text-color="#111827"
                :rules="[(val: string | number) => !val || isValidAddress(val.toString()) || 'Invalid address']"
              />

              <pill-button
                label="Add Token"
                icon="mdi-plus"
                bg-color="#3b82f6"
                text-color="#ffffff"
                :disabled="!customTokenAddress || !isValidAddress(customTokenAddress) || addingToken"
                @click="addCustomToken"
                class="add-token-btn"
              />
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
      v-if="walletInfo && currentChain"
      v-model="showQrDialog"
      :address="walletInfo.address"
      :chain-name="currentChain.name"
      :chain-logo="currentChain.iconUrl"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { type Address, isAddress as viemIsAddress } from 'viem';
import { Notify } from 'quasar';
import { useChainStore } from '../stores/chain-store';
import { useSearchStore } from '../stores/search-store';
import { usePriceStore } from '../stores/price-store';
import BaseCard from '../components/BaseCard.vue';
import WalletAddressChip from '../components/WalletAddressChip.vue';
import TokenRow from '../components/TokenRow.vue';
import LoadingMonster from '../components/LoadingMonster.vue';
import PillButton from '../components/PillButton.vue';
import PillInput from '../components/PillInput.vue';
import QrCodeDialog from '../components/QrCodeDialog.vue';

const route = useRoute();
const router = useRouter();

const chainStore = useChainStore();
const searchStore = useSearchStore();
const priceStore = usePriceStore();
const { loading, error } = storeToRefs(chainStore);

const currentChain = computed(() => chainStore.currentChain);

const walletInfo = ref<Awaited<ReturnType<typeof chainStore.getWalletInfo>> | null>(null);
const customTokenAddress = ref('');
const addingToken = ref(false);
const showQrDialog = ref(false);

const isValidAddress = (addr: string): boolean => {
  return viemIsAddress(addr);
};

const handleCancelLoading = () => {
  // Navigate back to home page
  router.push({ name: 'home' });
};

const showQrCode = () => {
  if (!walletInfo.value) return;
  showQrDialog.value = true;
};

const loadAddressInfo = async () => {
  const address = route.params.address as Address;

  try {
    // Load wallet info (balance + tokens if any)
    walletInfo.value = await chainStore.getWalletInfo(address);

    // Only add to recent searches if successfully loaded
    searchStore.addSearch(address, 'Address', chainStore.currentChainId);
  } catch (err) {
    console.error('Failed to load address info:', err);
    // Don't add to recent searches on error
  }
};

const addCustomToken = async () => {
  if (!walletInfo.value || !customTokenAddress.value) return;

  addingToken.value = true;

  try {
    const tokenBalance = await chainStore.getTokenBalance(
      customTokenAddress.value as Address,
      walletInfo.value.address
    );

    // Add to tokens list
    walletInfo.value.tokens.push(tokenBalance);

    // Save token to store with chainId
    chainStore.addSavedToken(
      customTokenAddress.value as Address,
      tokenBalance.symbol,
      chainStore.currentChainId
    );

    Notify.create({
      message: `Added ${tokenBalance.symbol}`,
      color: 'positive',
      icon: 'mdi-check-circle',
      position: 'top',
      timeout: 2000
    });

    customTokenAddress.value = '';
  } catch (err) {
    Notify.create({
      message: 'Failed to add token. Please check the address.',
      color: 'negative',
      icon: 'mdi-alert-circle',
      position: 'top',
      timeout: 3000
    });
  } finally {
    addingToken.value = false;
  }
};

const removeSavedToken = (address: Address) => {
  chainStore.removeSavedToken(address, chainStore.currentChainId);
  Notify.create({
    message: 'Token removed from saved list',
    color: 'info',
    icon: 'mdi-delete',
    position: 'top',
    timeout: 2000
  });
};

onMounted(() => {
  loadAddressInfo();
});
</script>

<style scoped>
.address-page {
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

.address-card {
  margin-bottom: 24px;
}

.address-header {
  display: flex;
  align-items: center;
  gap: 20px;
}

.address-info {
  flex: 1;
  min-width: 0;
}

.address-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
  transition: color 0.3s ease;
}

.balance-card {
  margin-bottom: 24px;
}

.balance-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
  transition: color 0.3s ease;
}

.balance-amount {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.balance-value {
  font-size: 36px;
  font-weight: 700;
  color: var(--color-text-primary);
  transition: color 0.3s ease;
}

.balance-symbol {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-secondary);
  transition: color 0.3s ease;
}

.tokens-card {
  margin-bottom: 24px;
}

.add-token-card {
  margin-bottom: 24px;
}

.card-subtitle {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0 0 20px;
  transition: color 0.3s ease;
}

.add-token-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.add-token-btn {
  width: 100%;
}

.saved-tokens-section {
  margin-bottom: 20px;
  padding: 16px;
  background-color: var(--color-bg-tertiary);
  border-radius: 8px;
  transition: background-color 0.3s ease;
}

.saved-tokens-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 12px;
  transition: color 0.3s ease;
}

.saved-tokens-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.saved-token-chip {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.saved-token-chip:hover {
  transform: translateY(-2px);
}

.loading-container,
.error-container {
  max-width: 700px;
  margin: 40px auto;
}

/* Responsive */
@media (max-width: 600px) {
  .address-page {
    padding: 24px 16px;
  }

  .page-title {
    font-size: 24px;
  }

  .balance-value {
    font-size: 28px;
  }

  .balance-symbol {
    font-size: 16px;
  }
}
</style>
