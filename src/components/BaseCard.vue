<template>
  <q-card
    class="base-card"
    :class="[
      elevated ? 'base-card--elevated' : '',
      bordered ? 'base-card--bordered' : '',
      hoverable ? 'base-card--hoverable' : ''
    ]"
    :flat="flat"
  >
    <slot />
  </q-card>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    elevated?: boolean;
    bordered?: boolean;
    flat?: boolean;
    hoverable?: boolean;
  }>(),
  {
    elevated: false,
    bordered: true,
    flat: false,
    hoverable: false
  }
);
</script>

<style scoped>
.base-card {
  border-radius: 16px;
  background: var(--color-bg-secondary);
  transition: all 0.3s ease;
}

.base-card--bordered {
  border: 1px solid var(--color-border-primary);
}

.base-card--elevated {
  box-shadow: var(--shadow-sm);
}

.base-card--hoverable {
  cursor: pointer;
}

.base-card--hoverable:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.base-card--hoverable:active {
  transform: translateY(0);
}
</style>
