<template>
  <q-input
    :model-value="modelValue"
    @update:model-value="handleInput"
    :placeholder="placeholder"
    :type="type"
    :disable="disabled"
    :rules="rules"
    outlined
    :class="['pill-input', { 'pill-input--disabled': disabled }]"
  >
    <template v-if="prependIcon" v-slot:prepend>
      <q-icon :name="prependIcon" />
    </template>
    <template v-if="appendIcon" v-slot:append>
      <q-icon :name="appendIcon" />
    </template>
    <template v-if="$slots.prepend" v-slot:prepend>
      <slot name="prepend"></slot>
    </template>
    <template v-if="$slots.append" v-slot:append>
      <slot name="append"></slot>
    </template>
  </q-input>
</template>

<script setup lang="ts">
interface Props {
  modelValue: string | number;
  placeholder?: string;
  type?: 'text' | 'password' | 'email' | 'search' | 'tel' | 'file' | 'number' | 'url' | 'time' | 'date';
  disabled?: boolean;
  prependIcon?: string;
  appendIcon?: string;
  rules?: Array<(val: string | number) => boolean | string>;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  type: 'text',
  disabled: false,
  prependIcon: '',
  appendIcon: '',
  rules: () => [],
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void;
}>();

const handleInput = (value: string | number | null) => {
  emit('update:modelValue', value ?? '');
};
</script>

<style scoped lang="scss">
.pill-input {
  :deep(.q-field__control) {
    border-radius: 9999px;
    height: 48px;
    padding: 0 20px;
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--color-border-primary);
    transition: all 0.3s ease;
    display: flex;
    align-items: center;

    &:hover {
      box-shadow: var(--shadow-md);
      border-color: var(--color-border-secondary);
    }
  }

  :deep(.q-field__control:before) {
    border: none;
  }

  :deep(.q-field__control:after) {
    border: none;
  }

  :deep(.q-field__native) {
    color: var(--color-text-primary);
    padding: 0 8px;
    font-size: 14px;
  }

  :deep(.q-field__label) {
    color: var(--color-text-tertiary);
  }

  :deep(.q-field__prepend),
  :deep(.q-field__append) {
    color: var(--color-text-secondary);
    height: 100%;
    display: flex;
    align-items: center;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
    margin-top: 0 !important;
    margin-bottom: 0 !important;
  }

  :deep(.q-field__prepend) {
    padding-right: 8px;
  }

  :deep(.q-field__append) {
    padding-left: 8px;
  }

  :deep(.q-icon) {
    font-size: 20px;
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
  }

  :deep(input::placeholder) {
    color: var(--color-text-tertiary);
    opacity: 1;
  }

  &.q-field--focused {
    :deep(.q-field__control) {
      box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
      border-color: var(--color-accent-primary);
    }

    :deep(.q-icon) {
      color: var(--color-accent-primary);
    }
  }

  &--disabled {
    opacity: 0.5;
    pointer-events: none;
  }
}
</style>
