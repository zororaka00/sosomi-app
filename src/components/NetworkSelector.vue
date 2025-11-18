<template>
  <div class="network-selector">
    <q-btn
      outline
      rounded
      no-caps
      class="network-selector__btn"
    >
      <div class="network-selector__content">
        <img
          v-if="currentChain?.iconUrl"
          :src="currentChain.iconUrl"
          :alt="currentChainLabel"
          class="network-icon"
        />
        <span>{{ currentChainLabel }}</span>
      </div>

      <q-menu auto-close class="network-selector__menu">
        <q-list style="min-width: 220px">
          <q-item
            v-for="chain in availableChains"
            :key="chain.id"
            clickable
            :active="chain.id === currentChainId"
            @click="handleChainSwitch(chain.id)"
            class="network-item"
          >
            <q-item-section avatar>
              <img
                :src="chain.iconUrl"
                :alt="chain.name"
                class="chain-icon"
              />
            </q-item-section>

            <q-item-section>
              <q-item-label>{{ chain.name }}</q-item-label>
              <q-item-label caption>{{ getChainDescription(chain.id) }}</q-item-label>
            </q-item-section>

            <q-item-section side v-if="chain.id === currentChainId">
              <q-icon name="mdi-check-circle" color="primary" size="20px" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useChainStore } from '../stores/chain-store';
import { Notify } from 'quasar';

const chainStore = useChainStore();
const { currentChainId, currentChain, chains } = storeToRefs(chainStore);

const availableChains = computed(() => chains.value);

const currentChainLabel = computed(() => currentChain.value?.name || 'Select Network');

const getChainDescription = (chainId: string): string => {
  const descriptions: Record<string, string> = {
    bitcoin: 'Mainnet',
    ethereum: 'Mainnet',
    bnb: 'Mainnet',
    base: 'Mainnet',
    arbitrum: 'Mainnet',
    optimism: 'Mainnet',
    polygon: 'Mainnet'
  };
  return descriptions[chainId] || '';
};

const handleChainSwitch = (chainId: string) => {
  try {
    chainStore.switchChain(chainId);
    const chainName = chains.value.find((c: any) => c.id === chainId)?.name;
    Notify.create({
      message: `Switched to ${chainName}`,
      color: 'positive',
      icon: 'mdi-check-circle',
      position: 'top',
      timeout: 2000
    });
  } catch (err) {
    console.error('Failed to switch chain:', err);
    Notify.create({
      message: 'Failed to switch network',
      color: 'negative',
      icon: 'mdi-alert-circle',
      position: 'top',
      timeout: 2000
    });
  }
};
</script>

<style scoped>
.network-selector {
  display: inline-flex;
}

.network-selector__btn {
  border-color: var(--color-border-primary);
  color: var(--color-text-primary);
  font-weight: 500;
  padding: 8px 16px;
  transition: all 0.3s ease;
}

.network-selector__btn:hover {
  border-color: var(--color-border-secondary);
  background-color: var(--color-bg-tertiary);
}

.network-selector__content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.network-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.chain-icon {
  width: 28px;
  height: 28px;
  object-fit: contain;
  border-radius: 50%;
}

.network-selector__menu {
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
}

.network-item {
  border-radius: 8px;
  margin: 4px 8px;
  transition: background-color 0.2s ease;
}

.network-item:hover {
  background-color: var(--color-bg-tertiary);
}

.network-item.q-item--active {
  background-color: var(--color-bg-tertiary);
}
</style>
