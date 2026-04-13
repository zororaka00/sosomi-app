<template>
  <div class="dark-mode-toggle">
    <div class="toggle-slider" :class="{ 'toggle-slider--dark': isDark }"></div>

    <!-- Light Mode Button -->
    <button
      @click="setLightMode"
      class="toggle-btn"
      :class="{ 'toggle-btn--active': !isDark }"
      aria-label="Light Mode"
    >
      <q-icon name="mdi-white-balance-sunny" class="toggle-icon" />
      <q-tooltip>Light Mode</q-tooltip>
    </button>

    <!-- Dark Mode Button -->
    <button
      @click="setDarkMode"
      class="toggle-btn"
      :class="{ 'toggle-btn--active': isDark }"
      aria-label="Dark Mode"
    >
      <q-icon name="mdi-weather-night" class="toggle-icon" />
      <q-tooltip>Dark Mode</q-tooltip>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useQuasar, LocalStorage } from 'quasar';

const $q = useQuasar();
const isDark = ref(false);

// Load saved preference
onMounted(() => {
  const saved = LocalStorage.getItem('darkMode');
  isDark.value = saved === true;
  $q.dark.set(isDark.value);
});

// Watch and save preference
watch(isDark, (newValue) => {
  $q.dark.set(newValue);
  LocalStorage.set('darkMode', newValue);
});

const setLightMode = () => {
  isDark.value = false;
};

const setDarkMode = () => {
  isDark.value = true;
};
</script>

<style scoped>
.dark-mode-toggle {
  position: relative;
  display: flex;
  align-items: center;
  gap: 2px;
  background: #f3f4f6;
  border-radius: 20px;
  padding: 4px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.body--dark .dark-mode-toggle {
  background: #2a2d3a;
  border-color: #3f4452;
}

.toggle-slider {
  position: absolute;
  left: 4px;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  border-radius: 16px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3);
  z-index: 0;
}

.toggle-slider--dark {
  left: calc(100% - 36px);
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
}

.toggle-btn {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  border-radius: 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: #9ca3af;
  outline: none;
  padding: 0;
}

.toggle-btn:hover {
  transform: scale(1.05);
}

.toggle-btn:active {
  transform: scale(0.95);
}

.toggle-btn--active {
  color: white;
}

.toggle-btn--active .toggle-icon {
  animation: iconPop 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-icon {
  font-size: 18px;
  transition: all 0.3s ease;
}

@keyframes iconPop {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2) rotate(10deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
  }
}

/* Dark mode specific adjustments */
.body--dark .toggle-btn {
  color: #6b7280;
}

.body--dark .toggle-btn--active {
  color: white;
}
</style>
