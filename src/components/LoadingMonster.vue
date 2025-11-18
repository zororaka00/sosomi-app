<template>
  <div class="loading-monster-overlay">
    <div class="loading-monster-container">
      <!-- 3D Monster Animation -->
      <div class="monster">
        <div class="monster-body">
          <!-- Eyes -->
          <div class="eyes">
            <div class="eye left">
              <div class="pupil"></div>
            </div>
            <div class="eye right">
              <div class="pupil"></div>
            </div>
          </div>

          <!-- Horns -->
          <div class="horn left-horn"></div>
          <div class="horn right-horn"></div>

          <!-- Arms -->
          <div class="arm left-arm">
            <div class="hand"></div>
          </div>
          <div class="arm right-arm">
            <div class="hand"></div>
          </div>
        </div>

        <!-- Shadow -->
        <div class="shadow"></div>
      </div>

      <!-- Loading Text -->
      <div class="loading-text">
        <div class="loading-message">{{ message }}</div>
        <div class="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      <!-- Cancel Button -->
      <q-btn
        v-if="showCancel"
        flat
        rounded
        color="negative"
        label="Cancel"
        icon="mdi-close-circle"
        class="cancel-button"
        @click="handleCancel"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

interface Props {
  message?: string;
  showCancel?: boolean;
}

withDefaults(defineProps<Props>(), {
  message: 'Loading data from blockchain...',
  showCancel: true
});

const emit = defineEmits<{
  cancel: []
}>();

const handleCancel = () => {
  emit('cancel');
};
</script>

<style scoped>
.loading-monster-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(250, 250, 250, 0.98);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease-out;
  transition: background-color 0.3s ease;
}

.body--dark .loading-monster-overlay {
  background: rgba(15, 17, 23, 0.98);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.loading-monster-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
}

/* Monster Animation */
.monster {
  position: relative;
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: bounce 1.5s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-20px) scale(1.05);
  }
}

.monster-body {
  position: relative;
  width: 150px;
  height: 150px;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border-radius: 50% 50% 45% 45%;
  box-shadow:
    0 10px 30px rgba(59, 130, 246, 0.3),
    inset 0 -5px 20px rgba(0, 0, 0, 0.1),
    inset 0 5px 20px rgba(255, 255, 255, 0.2);
  animation: bodyWobble 2s ease-in-out infinite;
  transform-style: preserve-3d;
}

@keyframes bodyWobble {
  0%, 100% {
    border-radius: 50% 50% 45% 45%;
    transform: rotate(0deg);
  }
  25% {
    border-radius: 45% 55% 50% 40%;
    transform: rotate(-2deg);
  }
  75% {
    border-radius: 55% 45% 40% 50%;
    transform: rotate(2deg);
  }
}

/* Eyes */
.eyes {
  position: absolute;
  top: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 30px;
}

.eye {
  width: 32px;
  height: 40px;
  background: white;
  border-radius: 50%;
  position: relative;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.2),
    inset 0 2px 4px rgba(0, 0, 0, 0.1);
  animation: blink 3s ease-in-out infinite;
}

@keyframes blink {
  0%, 90%, 100% {
    transform: scaleY(1);
  }
  95% {
    transform: scaleY(0.1);
  }
}

.pupil {
  position: absolute;
  width: 16px;
  height: 16px;
  background: #2d3748;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: lookAround 4s ease-in-out infinite;
  box-shadow: 0 0 8px rgba(45, 55, 72, 0.5);
}

.pupil::after {
  content: '';
  position: absolute;
  width: 6px;
  height: 6px;
  background: white;
  border-radius: 50%;
  top: 3px;
  left: 3px;
}

@keyframes lookAround {
  0%, 100% {
    transform: translate(-50%, -50%);
  }
  25% {
    transform: translate(-70%, -50%);
  }
  75% {
    transform: translate(-30%, -50%);
  }
}

/* Horns */
.horn {
  position: absolute;
  width: 0;
  height: 0;
  border-left: 12px solid transparent;
  border-right: 12px solid transparent;
  border-bottom: 30px solid #8b5cf6;
  top: -15px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.left-horn {
  left: 15px;
  transform: rotate(-15deg);
  animation: hornWiggle 1.5s ease-in-out infinite;
}

.right-horn {
  right: 15px;
  transform: rotate(15deg);
  animation: hornWiggle 1.5s ease-in-out infinite reverse;
}

@keyframes hornWiggle {
  0%, 100% {
    transform: rotate(-15deg);
  }
  50% {
    transform: rotate(-25deg);
  }
}

/* Arms */
.arm {
  position: absolute;
  width: 40px;
  height: 80px;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border-radius: 20px;
  top: 50px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.left-arm {
  left: -25px;
  transform-origin: top center;
  animation: waveLeft 1.5s ease-in-out infinite;
}

.right-arm {
  right: -25px;
  transform-origin: top center;
  animation: waveRight 1.5s ease-in-out infinite;
}

@keyframes waveLeft {
  0%, 100% {
    transform: rotate(-20deg);
  }
  50% {
    transform: rotate(-40deg);
  }
}

@keyframes waveRight {
  0%, 100% {
    transform: rotate(20deg);
  }
  50% {
    transform: rotate(40deg);
  }
}

/* Hands */
.hand {
  position: absolute;
  width: 30px;
  height: 30px;
  background: #8b5cf6;
  border-radius: 50%;
  bottom: -15px;
  left: 5px;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4);
}

/* Shadow */
.shadow {
  position: absolute;
  bottom: -30px;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 20px;
  background: radial-gradient(ellipse, rgba(0, 0, 0, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  animation: shadowPulse 1.5s ease-in-out infinite;
}

@keyframes shadowPulse {
  0%, 100% {
    width: 120px;
    opacity: 0.3;
  }
  50% {
    width: 100px;
    opacity: 0.5;
  }
}

/* Loading Text */
.loading-text {
  text-align: center;
  color: white;
}

/* Loading message */
.loading-message {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 20px;
  opacity: 0;
  animation: fadeIn 0.5s ease-in forwards;
  animation-delay: 0.3s;
  transition: color 0.3s ease;
}

.loading-dots {
  display: flex;
  gap: 8px;
  justify-content: center;
}

/* Loading dots */
.loading-dot {
  width: 12px;
  height: 12px;
  background: #3b82f6;
  border-radius: 50%;
  margin: 0 6px;
  animation: bounce 1.4s infinite ease-in-out both;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
}

.loading-dots span:nth-child(1) {
  animation-delay: 0s;
}

.loading-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes dotPulse {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}

/* Cancel Button */
.cancel-button {
  margin-top: 16px;
  font-weight: 600;
  padding: 12px 32px;
  font-size: 16px;
  text-transform: none;
  transition: all 0.3s ease;
  background: rgba(239, 68, 68, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.cancel-button:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.5);
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3);
}

/* Responsive */
@media (max-width: 600px) {
  .monster {
    width: 160px;
    height: 160px;
  }

  .monster-body {
    width: 120px;
    height: 120px;
  }

  .loading-message {
    font-size: 16px;
  }

  .cancel-button {
    font-size: 14px;
    padding: 10px 24px;
  }
}
</style>
