<template>
  <div class="token-row" @click="handleClick">
    <div class="token-row__icon">
      <q-avatar size="40px" :color="iconColor" text-color="white">
        <span class="text-subtitle1">{{ tokenInitial }}</span>
      </q-avatar>
    </div>

    <div class="token-row__info">
      <div class="token-row__name">{{ token.symbol }}</div>
      <div class="token-row__subtitle">{{ token.name }}</div>
    </div>

    <div class="token-row__balance">
      <div class="token-row__amount">{{ formattedBalance }}</div>
      <div v-if="usdValue" class="token-row__usd">${{ usdValue }}</div>
    </div>

    <q-icon v-if="clickable" name="chevron_right" size="20px" color="grey-5" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface Token {
  symbol: string;
  name: string;
  balance: string;
  decimals?: number;
}

const props = withDefaults(
  defineProps<{
    token: Token;
    usdValue?: string;
    clickable?: boolean;
  }>(),
  {
    clickable: false
  }
);

const emit = defineEmits<{
  click: [];
}>();

const tokenInitial = computed(() => props.token.symbol.charAt(0).toUpperCase());

const iconColor = computed(() => {
  // Generate consistent color from symbol
  const colors = ['primary', 'secondary', 'positive', 'info', 'warning'];
  const index = props.token.symbol.charCodeAt(0) % colors.length;
  return colors[index];
});

const formattedBalance = computed(() => {
  const balance = parseFloat(props.token.balance);
  if (balance === 0) return '0';
  if (balance < 0.00000001) return '< 0.00000001';
  if (balance < 1) return balance.toFixed(8);
  if (balance < 1000) return balance.toFixed(Math.min(8, 2));
  return balance.toLocaleString('en-US', { maximumFractionDigits: 8, minimumFractionDigits: 0 });
});

const handleClick = () => {
  if (props.clickable) {
    emit('click');
  }
};
</script>

<style scoped>
.token-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  transition: background-color 0.2s ease;
}

.token-row:hover {
  background-color: #f9fafb;
}

.token-row__icon {
  flex-shrink: 0;
}

.token-row__info {
  flex: 1;
  min-width: 0;
}

.token-row__name {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 2px;
}

.token-row__subtitle {
  font-size: 13px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.token-row__balance {
  text-align: right;
  flex-shrink: 0;
}

.token-row__amount {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 2px;
}

.token-row__usd {
  font-size: 13px;
  color: #6b7280;
}
</style>
