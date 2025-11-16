<template>
  <q-page class="search-page">
    <div class="search-container fade-in">
      <!-- Hero Section -->
      <div class="hero-section">
        <h1 class="hero-title">Blockchain Explorer</h1>
        <p class="hero-subtitle">
          Search for transaction hash or address across multiple chain
        </p>
      </div>

      <!-- Search Card -->
      <base-card class="search-card" elevated>
        <q-card-section class="search-card__content">
          <pill-input
            v-model="searchQuery"
            placeholder="Enter tx hash or address"
            prepend-icon="mdi-magnify"
            bg-color="#fafafa"
            text-color="#111827"
            class="search-input"
            @keyup.enter="handleSearch"
          >
            <template v-slot:append>
              <q-btn
                v-if="searchQuery"
                flat
                dense
                round
                icon="mdi-close"
                @click="searchQuery = ''"
                color="grey-6"
              />
            </template>
          </pill-input>

          <pill-button
            label="Search"
            icon="mdi-magnify"
            bg-color="#3b82f6"
            text-color="#ffffff"
            :disabled="!searchQuery || searching"
            @click="handleSearch"
            class="search-btn"
          />
        </q-card-section>
      </base-card>

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
                icon="mdi-close-circle"
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
                @click="handleRecentClick(search)"
                class="recent-item"
                v-ripple
              >
                <q-item-section avatar>
                  <q-icon :name="getSearchTypeIcon(search.type)" color="primary" />
                </q-item-section>

                <q-item-section>
                  <q-item-label class="recent-query">{{ truncateAddress(search.query) }}</q-item-label>
                  <q-item-label caption>
                    {{ search.type }} · {{ getChainName(search.chainId || 'ethereum') }}
                  </q-item-label>
                </q-item-section>

                <q-item-section side>
                  <q-icon name="mdi-chevron-right" color="grey-5" />
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
import PillButton from '../components/PillButton.vue';
import PillInput from '../components/PillInput.vue';
import { useSearchStore } from '../stores/search-store';
import { useChainStore } from '../stores/chain-store';

const router = useRouter();
const searchStore = useSearchStore();
const chainStore = useChainStore();

const searchQuery = ref('');
const searching = ref(false);

// Use storeToRefs for reactive access
const { recentSearches } = storeToRefs(searchStore);
const { currentChainId } = storeToRefs(chainStore);

const getChainName = (chainId: string): string => {
  const chains = chainStore.SUPPORTED_CHAINS;
  return chains[chainId]?.name || chainId;
};

const handleSearch = async () => {
  const query = searchQuery.value.trim();

  if (!query) {
    Notify.create({
      message: 'Please enter a search query',
      color: 'warning',
      icon: 'mdi-alert',
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
      await router.push({ name: 'transaction', params: { hash: query } });
    } else if (isAddress(query)) {
      // It's an address - will determine if wallet or contract in detail page
      await router.push({ name: 'address', params: { address: query } });
    } else {
      Notify.create({
        message: 'Invalid address or transaction hash',
        color: 'negative',
        icon: 'mdi-alert-circle',
        position: 'top',
        timeout: 3000
      });
    }
  } catch (err) {
    console.error('Search error:', err);
    Notify.create({
      message: 'Search failed. Please try again.',
      color: 'negative',
      icon: 'mdi-alert-circle',
      position: 'top',
      timeout: 3000
    });
  } finally {
    searching.value = false;
  }
};

const handleRecentClick = async (search: any) => {
  // Switch to the chain if different (fallback to ethereum if chainId not set)
  const searchChainId = search.chainId || 'ethereum';
  if (searchChainId !== currentChainId.value) {
    currentChainId.value = searchChainId;
    Notify.create({
      message: `Switched to ${getChainName(searchChainId)}`,
      color: 'info',
      icon: 'mdi-check-circle',
      position: 'top',
      timeout: 2000
    });
  }

  searchQuery.value = search.query;
  handleSearch();
};


const clearRecentSearches = () => {
  searchStore.clearSearchHistory();
  Notify.create({
    message: 'Search history cleared',
    color: 'positive',
    icon: 'mdi-check-circle',
    position: 'top',
    timeout: 2000
  });
};

const getSearchTypeIcon = (type: string): string => {
  const icons: Record<string, string> = {
    Transaction: 'mdi-receipt-text',
    Address: 'mdi-wallet'
  };
  return icons[type] || 'mdi-magnify';
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
