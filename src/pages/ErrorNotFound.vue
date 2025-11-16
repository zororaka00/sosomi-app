<template>
  <div class="fullscreen bg-blue text-white text-center q-pa-md flex flex-center">
    <div>
      <div style="font-size: 30vh">
        404
      </div>

      <div class="text-h2" style="opacity:.4">
        Oops. Nothing here...
      </div>

      <pill-button
        label="Go Home"
        icon="mdi-home"
        bg-color="#ffffff"
        text-color="#1976d2"
        class="q-mt-xl"
        @click="$router.push('/')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import PillButton from '../components/PillButton.vue';
</script>
