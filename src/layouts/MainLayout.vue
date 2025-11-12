<template>
  <q-layout view="lHh Lpr lFf" class="layout">
    <q-header class="header" bordered>
      <q-toolbar class="toolbar">
        <q-toolbar-title class="toolbar__title">
          <router-link to="/" class="logo-link">
            <span class="logo-text">Sosomi</span>
          </router-link>
        </q-toolbar-title>

        <div class="toolbar__actions">
          <network-selector />
        </div>
      </q-toolbar>
    </q-header>

    <q-page-container class="page-container">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import NetworkSelector from '../components/NetworkSelector.vue';
</script>

<style scoped>
.layout {
  background-color: #fafafa;
}

.header {
  background-color: white;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: none;
}

.toolbar {
  min-height: 64px;
  padding: 0 24px;
}

.toolbar__title {
  flex: 0 0 auto;
}

.logo-link {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.logo-link:hover {
  opacity: 0.8;
}

.logo-text {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.02em;
}

.toolbar__actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.page-container {
  background-color: #fafafa;
}

/* Page transitions */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateX(10px);
}

.page-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

/* Responsive */
@media (max-width: 600px) {
  .toolbar {
    padding: 0 16px;
  }

  .logo-text {
    font-size: 20px;
  }
}
</style>
