<template>
  <button
    :class="['pill-button', { 'pill-button--disabled': disabled }]"
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
interface Props {
  label?: string;
  icon?: string;
  iconSize?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  icon: '',
  iconSize: '18px',
  disabled: false,
});

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();

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
  height: 48px;
  padding: 0 24px;
  background: var(--color-accent-primary);
  color: white;
  border: none;
  border-radius: 9999px;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
  outline: none;
  user-select: none;
  white-space: nowrap;

  &:hover:not(.pill-button--disabled) {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
    background: var(--color-accent-hover);
  }

  &:active:not(.pill-button--disabled) {
    transform: translateY(0);
    box-shadow: var(--shadow-sm);
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
    font-weight: 600;
  }
}
</style>
