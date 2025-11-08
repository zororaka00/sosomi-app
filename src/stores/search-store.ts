import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref } from 'vue';

export interface RecentSearch {
  query: string;
  type: 'Transaction' | 'Wallet' | 'Contract';
  timestamp: number;
}

export const useSearchStore = defineStore('search', () => {
  // State
  const recentSearches = ref<RecentSearch[]>([]);
  const currentQuery = ref('');

  // Actions
  function loadSearchHistory() {
    try {
      const stored = localStorage.getItem('recentSearches');
      if (stored) {
        recentSearches.value = JSON.parse(stored);
      }
    } catch (err) {
      console.error('Failed to load recent searches:', err);
    }
  }

  function addSearch(query: string, type: RecentSearch['type']) {
    // Remove duplicate if exists
    const filtered = recentSearches.value.filter(s => s.query !== query);

    // Add to beginning
    recentSearches.value = [
      { query, type, timestamp: Date.now() },
      ...filtered
    ].slice(0, 5); // Keep only last 5

    // Persist to localStorage
    saveSearchHistory();
  }

  function saveSearchHistory() {
    try {
      localStorage.setItem('recentSearches', JSON.stringify(recentSearches.value));
    } catch (err) {
      console.error('Failed to save search history:', err);
    }
  }

  function clearSearchHistory() {
    recentSearches.value = [];
    localStorage.removeItem('recentSearches');
  }

  function setCurrentQuery(query: string) {
    currentQuery.value = query;
  }

  // Initialize
  loadSearchHistory();

  return {
    // State
    recentSearches,
    currentQuery,

    // Actions
    loadSearchHistory,
    addSearch,
    clearSearchHistory,
    setCurrentQuery
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSearchStore, import.meta.hot));
}
