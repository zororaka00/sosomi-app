<template>
  <q-page class="search-page">
    <div class="search-container fade-in">
      <!-- Hero Section -->
      <div class="hero-section">
        <h1 class="hero-title">Explore the Blockchain</h1>
        <p class="hero-subtitle">
          Search for transactions, wallets, or contracts across multiple chains
        </p>
      </div>

      <!-- Search Card -->
      <base-card class="search-card" elevated>
        <q-card-section class="search-card__content">
          <q-input
            v-model="searchQuery"
            outlined
            placeholder="Enter tx hash, wallet address, or contract address"
            class="search-input"
            @keyup.enter="handleSearch"
          >
            <template v-slot:prepend>
              <q-icon name="search" color="grey-6" />
            </template>

            <template v-slot:append>
              <q-btn
                v-if="searchQuery"
                flat
                dense
                round
                icon="close"
                @click="searchQuery = ''"
                color="grey-6"
              />
            </template>
          </q-input>

          <q-btn
            unelevated
            rounded
            color="primary"
            label="Search"
            icon-right="arrow_forward"
            no-caps
            class="search-btn scale-on-press"
            :loading="searching"
            :disable="!searchQuery"
            @click="handleSearch"
          />
        </q-card-section>
      </base-card>

      <!-- Quick Examples -->
      <div class="examples-section slide-up-soft stagger-1">
        <div class="examples-title">Try these examples:</div>
        <div class="examples-chips">
          <q-chip
            v-for="example in examples"
            :key="example.label"
            clickable
            outline
            color="primary"
            :icon="example.icon"
            @click="searchQuery = example.value"
            class="example-chip hover-lift"
          >
            {{ example.label }}
          </q-chip>
        </div>
      </div>

      <!-- Recent Searches (if any) -->
      <div v-if="recentSearches.length > 0" class="recent-section slide-up-soft stagger-2">
        <base-card bordered>
          <q-card-section>
            <div class="recent-header">
              <h3 class="recent-title">Recent Searches</h3>
              <q-btn
                flat
                dense
                round
                size="sm"
                icon="close"
                @click="clearRecentSearches"
              >
                <q-tooltip>Clear all</q-tooltip>
              </q-btn>
            </div>

            <q-list separator>
              <q-item
                v-for="(search, index) in recentSearches"
                :key="index"
                clickable
                @click="handleRecentClick(search.query)"
                class="recent-item"
                v-ripple
              >
                <q-item-section avatar>
                  <q-icon :name="getSearchTypeIcon(search.type)" color="primary" />
                </q-item-section>

                <q-item-section>
                  <q-item-label class="recent-query">{{ truncateAddress(search.query) }}</q-item-label>
                  <q-item-label caption>{{ search.type }}</q-item-label>
                </q-item-section>

                <q-item-section side>
                  <q-icon name="chevron_right" color="grey-5" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </base-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { isAddress, isHash } from 'viem';
import { Notify } from 'quasar';
import { storeToRefs } from 'pinia';
import BaseCard from '../components/BaseCard.vue';
import { useSearchStore } from '../stores/search-store';

const router = useRouter();
const searchStore = useSearchStore();

const searchQuery = ref('');
const searching = ref(false);

// Use storeToRefs for reactive access
const { recentSearches } = storeToRefs(searchStore);

const examples = [
  {
    label: 'View Transaction',
    icon: 'receipt_long',
    value: '0x...' // Will be a real example
  },
  {
    label: 'Check Wallet',
    icon: 'account_balance_wallet',
    value: '0x...' // Will be a real example
  },
  {
    label: 'Explore Contract',
    icon: 'description',
    value: '0x...' // Will be a real example
  }
];

const handleSearch = async () => {
  const query = searchQuery.value.trim();

  if (!query) {
    Notify.create({
      message: 'Please enter a search query',
      color: 'warning',
      icon: 'warning',
      position: 'top',
      timeout: 2000
    });
    return;
  }

  searching.value = true;

  try {
    // Determine search type
    if (isHash(query)) {
      // It's a transaction hash
      addToRecentSearches(query, 'Transaction');
      await router.push({ name: 'transaction', params: { hash: query } });
    } else if (isAddress(query)) {
      // It's an address - need to determine if wallet or contract
      // We'll check this in the detail page
      addToRecentSearches(query, 'Wallet');
      await router.push({ name: 'address', params: { address: query } });
    } else {
      Notify.create({
        message: 'Invalid address or transaction hash',
        color: 'negative',
        icon: 'error',
        position: 'top',
        timeout: 3000
      });
    }
  } catch (err) {
    console.error('Search error:', err);
    Notify.create({
      message: 'Search failed. Please try again.',
      color: 'negative',
      icon: 'error',
      position: 'top',
      timeout: 3000
    });
  } finally {
    searching.value = false;
  }
};

const addToRecentSearches = (query: string, type: 'Transaction' | 'Wallet' | 'Contract') => {
  searchStore.addSearch(query, type);
};

const handleRecentClick = (query: string) => {
  searchQuery.value = query;
  handleSearch();
};

const clearRecentSearches = () => {
  searchStore.clearSearchHistory();
  Notify.create({
    message: 'Search history cleared',
    color: 'positive',
    icon: 'check_circle',
    position: 'top',
    timeout: 2000
  });
};

const getSearchTypeIcon = (type: string): string => {
  const icons: Record<string, string> = {
    Transaction: 'receipt_long',
    Wallet: 'account_balance_wallet',
    Contract: 'description'
  };
  return icons[type] || 'search';
};

const truncateAddress = (str: string): string => {
  if (!str || str.length <= 12) return str;
  // Format: 0x1234xxxx5678 (first 6 chars + xxxx + last 4 chars)
  return `${str.slice(0, 6)}xxxx${str.slice(-4)}`;
};

</script>

<style scoped>
.search-page {
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 60px 24px 40px;
}

.search-container {
  width: 100%;
  max-width: 700px;
}

/* Hero Section */
.hero-section {
  text-align: center;
  margin-bottom: 40px;
}

.hero-title {
  font-size: 48px;
  font-weight: 800;
  color: #111827;
  margin: 0 0 16px;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.hero-subtitle {
  font-size: 18px;
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
}

/* Search Card */
.search-card {
  margin-bottom: 32px;
}

.search-card__content {
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.search-input {
  font-size: 16px;
}

.search-input :deep(.q-field__control) {
  height: 56px;
  border-radius: 12px;
  padding: 0 16px;
}

.search-input :deep(.q-field__native) {
  font-weight: 500;
}

.search-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

/* Examples Section */
.examples-section {
  margin-bottom: 32px;
  opacity: 0;
  animation: fadeIn 0.5s ease-out 0.1s forwards;
}

.examples-title {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 12px;
  text-align: center;
}

.examples-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.example-chip {
  border-radius: 8px;
  font-weight: 500;
}

/* Recent Section */
.recent-section {
  opacity: 0;
  animation: fadeIn 0.5s ease-out 0.2s forwards;
}

.recent-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.recent-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.recent-item {
  border-radius: 8px;
  transition: background-color 0.2s ease;
  min-height: 56px;
  cursor: pointer;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
}

.recent-item:active {
  background-color: #e5e7eb;
}

.recent-item:hover {
  background-color: #f9fafb;
}

.recent-query {
  font-family: 'Roboto Mono', monospace;
  font-size: 14px;
  font-weight: 500;
}

/* Responsive */
@media (max-width: 600px) {
  .search-page {
    padding: 40px 16px 32px;
  }

  .hero-title {
    font-size: 36px;
  }

  .hero-subtitle {
    font-size: 16px;
  }

  .search-card__content {
    padding: 24px 20px;
  }
}
</style>
