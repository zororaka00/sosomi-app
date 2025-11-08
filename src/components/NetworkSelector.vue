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
              <q-icon name="check_circle" color="primary" size="20px" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useChain } from '../composables/useChain';
import { Notify } from 'quasar';

const { currentChainId, currentChain, chains, switchChain } = useChain();

const availableChains = computed(() => chains);

const currentChainLabel = computed(() => currentChain?.name || 'Select Network');

const getChainDescription = (chainId: string): string => {
  const descriptions: Record<string, string> = {
    ethereum: 'Mainnet',
    polygon: 'Layer 2',
    arbitrum: 'Layer 2',
    optimism: 'Layer 2',
    base: 'Layer 2'
  };
  return descriptions[chainId] || '';
};

const handleChainSwitch = (chainId: string) => {
  try {
    switchChain(chainId);
    Notify.create({
      message: `Switched to ${chains.find((c: any) => c.id === chainId)?.name}`,
      color: 'positive',
      icon: 'check_circle',
      position: 'top',
      timeout: 2000
    });
  } catch (err) {
    Notify.create({
      message: 'Failed to switch network',
      color: 'negative',
      icon: 'error',
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
  border-color: #e5e7eb;
  color: #111827;
  font-weight: 500;
  padding: 8px 16px;
  transition: all 0.2s ease;
}

.network-selector__btn:hover {
  border-color: #d1d5db;
  background-color: #f9fafb;
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
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.network-item {
  border-radius: 8px;
  margin: 4px 8px;
  transition: background-color 0.2s ease;
}

.network-item:hover {
  background-color: #f3f4f6;
}

.network-item.q-item--active {
  background-color: #eff6ff;
}
</style>
