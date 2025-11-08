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
  background: white;
  transition: all 0.3s ease;
}

.base-card--bordered {
  border: 1px solid #e5e7eb;
}

.base-card--elevated {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
}

.base-card--hoverable {
  cursor: pointer;
}

.base-card--hoverable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.base-card--hoverable:active {
  transform: translateY(0);
}
</style>
