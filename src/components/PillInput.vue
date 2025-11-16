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
    :style="inputStyle"
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
import { computed } from 'vue';

interface Props {
  modelValue: string | number;
  placeholder?: string;
  type?: 'text' | 'password' | 'email' | 'search' | 'tel' | 'file' | 'number' | 'url' | 'time' | 'date';
  bgColor?: string;
  textColor?: string;
  disabled?: boolean;
  prependIcon?: string;
  appendIcon?: string;
  rules?: Array<(val: string | number) => boolean | string>;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  type: 'text',
  bgColor: '#2A2C36',
  textColor: '#D0D0D8',
  disabled: false,
  prependIcon: '',
  appendIcon: '',
  rules: () => [],
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void;
}>();

const inputStyle = computed(() => ({
  '--bg-color': props.bgColor,
  '--text-color': props.textColor,
}));

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
    background: var(--bg-color);
    color: var(--text-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
    transition: all 0.2s ease;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border-color: #d1d5db;
    }
  }

  :deep(.q-field__control:before) {
    border: none;
  }

  :deep(.q-field__control:after) {
    border: none;
  }

  :deep(.q-field__native) {
    color: var(--text-color);
    padding: 0 8px;
    font-size: 14px;
  }

  :deep(.q-field__label) {
    color: #9ca3af;
  }

  :deep(.q-field__prepend),
  :deep(.q-field__append) {
    color: var(--text-color);
    height: 48px;
    align-items: center;
    padding-top: 0;
    padding-bottom: 0;
  }

  :deep(.q-field__prepend) {
    padding-right: 8px;
  }

  :deep(.q-field__append) {
    padding-left: 8px;
  }

  :deep(.q-icon) {
    font-size: 20px;
    color: #6b7280;
  }

  :deep(input::placeholder) {
    color: #9ca3af;
    opacity: 1;
  }

  &.q-field--focused {
    :deep(.q-field__control) {
      box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
      border-color: #3b82f6;
    }

    :deep(.q-icon) {
      color: #3b82f6;
    }
  }

  &--disabled {
    opacity: 0.5;
    pointer-events: none;
  }
}
</style>
