<template>
  <button
    :class="['pill-button', { 'pill-button--disabled': disabled }]"
    :style="buttonStyle"
    :disabled="disabled"
    @click="handleClick"
  >
    <q-icon v-if="icon" :name="icon" :size="iconSize" class="pill-button__icon" />
    <span class="pill-button__text">
      <slot>{{ label }}</slot>
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  label?: string;
  icon?: string;
  iconSize?: string;
  bgColor?: string;
  textColor?: string;
  height?: string;
  paddingX?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  icon: '',
  iconSize: '18px',
  bgColor: '#2A2C36',
  textColor: '#D0D0D8',
  height: '48px',
  paddingX: '20px',
  disabled: false,
});

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();

const buttonStyle = computed(() => ({
  '--bg-color': props.bgColor,
  '--text-color': props.textColor,
  '--height': props.height,
  '--padding-x': props.paddingX,
}));

const handleClick = (event: MouseEvent) => {
  if (!props.disabled) {
    emit('click', event);
  }
};
</script>

<style scoped lang="scss">
.pill-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: var(--height);
  padding: 0 var(--padding-x);
  background: var(--bg-color);
  color: var(--text-color);
  border: none;
  border-radius: 9999px;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  outline: none;
  user-select: none;
  white-space: nowrap;

  &:hover:not(.pill-button--disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    filter: brightness(1.1);
  }

  &:active:not(.pill-button--disabled) {
    transform: translateY(0);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    filter: brightness(0.95);
  }

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
    filter: grayscale(0.3);
  }

  &__icon {
    flex-shrink: 0;
  }

  &__text {
    font-weight: 500;
  }
}
</style>
