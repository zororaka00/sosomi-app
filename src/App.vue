<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { usePriceStore } from './stores/price-store';

const priceStore = usePriceStore();

onMounted(async () => {
  // Initialize price store (load from cache or fetch from API)
  await priceStore.initialize();
});

onUnmounted(() => {
  // Stop auto-refresh when app is unmounted
  priceStore.stopAutoRefresh();
});
</script>
