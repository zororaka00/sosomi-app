<template>
  <q-dialog v-model="isOpen">
    <q-card class="qr-dialog" style="min-width: 350px; position: relative;">
      <!-- Close Button -->
      <q-btn
        icon="mdi-close"
        flat
        round
        dense
        color="negative"
        style="position: absolute; top: 8px; right: 8px; z-index: 1;"
        @click="isOpen = false"
      />

      <q-card-section class="text-center q-pt-lg">
        <!-- Title -->
        <div class="text-h6 q-mb-md qr-dialog__title">{{ chainName }} Address</div>

        <!-- QR Code with Logo Overlay -->
        <div style="position: relative; display: inline-block; margin: 0 auto;">
          <qrcode-vue
            :value="address"
            :size="300"
            level="H"
          />
          <!-- Chain Logo Overlay -->
          <div
            v-if="chainLogo"
            class="qr-logo-overlay"
          >
            <img
              :src="chainLogo"
              :alt="`${chainName} logo`"
              style="width: 48px; height: 48px; display: block;"
              @error="onImageError"
            />
          </div>
        </div>

        <!-- Address Text -->
        <p class="q-mt-md text-caption qr-dialog__address">
          {{ address }}
        </p>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import QrcodeVue from 'qrcode.vue';

interface Props {
  modelValue: boolean;
  address: string;
  chainName?: string;
  chainLogo?: string;
}

const props = withDefaults(defineProps<Props>(), {
  chainName: 'Wallet'
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const onImageError = (event: Event) => {
  console.error('Failed to load chain logo:', props.chainLogo);
  // Hide the logo container if image fails to load
  const target = event.target as HTMLImageElement;
  const container = target.parentElement;
  if (container) {
    container.style.display = 'none';
  }
};
</script>

<style scoped>
.qr-dialog {
  background-color: var(--color-bg-secondary);
  transition: background-color 0.3s ease;
}

.qr-dialog__title {
  color: var(--color-text-primary);
  transition: color 0.3s ease;
}

.qr-dialog__address {
  word-break: break-all;
  font-family: monospace;
  color: var(--color-text-secondary);
  transition: color 0.3s ease;
}

.qr-logo-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 8px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
</style>
