<template>
  <div class="wallet-address-chip" :class="{ 'wallet-address-chip--clickable': clickable }">
    <q-chip
      :color="chipColor"
      text-color="white"
      :icon="icon"
      :clickable="clickable"
      @click="handleClick"
      class="wallet-chip"
    >
      <span class="wallet-chip__text" :class="{ 'text-truncate-auto': !truncate }">
        {{ displayAddress }}
      </span>

      <q-tooltip v-if="showTooltip" anchor="top middle" self="bottom middle">
        {{ fullAddress }}
        <br />
        <small>Click to copy</small>
      </q-tooltip>
    </q-chip>

    <q-btn
      v-if="copyable"
      flat
      dense
      round
      size="sm"
      icon="mdi-content-copy"
      @click="copyAddress"
      class="wallet-chip__copy"
    >
      <q-tooltip>Copy address</q-tooltip>
    </q-btn>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { copyToClipboard, Notify } from 'quasar';

interface WalletAddressChipProps {
  address: string;
  clickable?: boolean;
  isTransactionHash?: boolean;
  icon?: string;
  color?: string;
  copyable?: boolean;
  truncate?: boolean;
  showTooltip?: boolean;
}

const props = withDefaults(defineProps<WalletAddressChipProps>(), {
  clickable: false,
  isTransactionHash: false,
  icon: 'mdi-wallet',
  copyable: true,
  truncate: false,
  showTooltip: true,
});

const emit = defineEmits<{
  click: [];
}>();

const fullAddress = computed(() => props.address);

const displayAddress = computed(() => {
  const addr = props.address;

  // If truncate enabled, always truncate to 4-4
  if (props.truncate) {
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  }

  // Transaction hash truncated to 6-4
  if (props.isTransactionHash) {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  // Address (from/to) not truncated by default
  return addr;
});

const chipColor = computed(() => props.color);

const copyAddress = async () => {
  try {
    await copyToClipboard(props.address);
    Notify.create({
      message: 'Address copied to clipboard',
      color: 'positive',
      icon: 'mdi-check-circle',
      position: 'top',
      timeout: 1500
    });
  } catch (err) {
    Notify.create({
      message: 'Failed to copy',
      color: 'negative',
      icon: 'mdi-alert-circle',
      position: 'top',
      timeout: 1500
    });
  }
};

const handleClick = () => {
  if (props.clickable) {
    emit('click');
  }
};
</script>

<style scoped>
.wallet-address-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 100%;
}

.wallet-address-chip--clickable .wallet-chip {
  cursor: pointer;
}

.wallet-chip {
  font-family: 'Roboto Mono', monospace;
  font-size: 13px;
  font-weight: 500;
  border-radius: 8px;
  max-width: 100%;
}

.wallet-chip__text {
  letter-spacing: 0.02em;
  display: inline-block;
  max-width: 100%;
}

.text-truncate-auto {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wallet-chip__copy {
  opacity: 0.7;
  transition: opacity 0.2s ease;
  flex-shrink: 0;
}

.wallet-chip__copy:hover {
  opacity: 1;
}
</style>
