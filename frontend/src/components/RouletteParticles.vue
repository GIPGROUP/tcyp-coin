<template>
  <div v-if="isActive" class="roulette-particles-container">
    <!-- ЦУПкоины -->
    <img 
      v-for="(coin, index) in coins"
      :key="`coin-${index}`"
      src="/coin_img.png" 
      :class="`flying-particle coin-particle-${index + 1} tcyp-coin-img`"
      :style="{ left: centerX + 'px', top: centerY + 'px' }"
      alt="ЦУПкоин"
    />
    <!-- Эмодзи денег -->
    <div 
      v-for="(emoji, index) in emojis"
      :key="`emoji-${index}`"
      :class="`flying-particle emoji-particle-${index + 1}`"
      :style="{ left: centerX + 'px', top: centerY + 'px' }"
    >{{ emoji }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  isActive: {
    type: Boolean,
    default: false
  },
  centerX: {
    type: Number,
    default: window.innerWidth / 2
  },
  centerY: {
    type: Number,
    default: window.innerHeight / 2
  }
})

const coins = ref([1, 2, 3])
const emojis = ref(['💵', '💰', '💸'])
</script>

<style scoped>
.roulette-particles-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 9999;
}

.flying-particle {
  position: absolute;
  font-size: 48px;
  animation: roulette-fly 3s ease-out forwards;
  transform-origin: center center;
}

.tcyp-coin-img {
  width: 60px !important;
  height: 60px !important;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
}

/* Задержки анимации */
.coin-particle-1 { animation-delay: 0s; --fly-x: -200px; --fly-y: -300px; }
.emoji-particle-1 { animation-delay: 0.2s; --fly-x: 200px; --fly-y: -250px; }
.coin-particle-2 { animation-delay: 0.4s; --fly-x: -150px; --fly-y: -350px; }
.emoji-particle-2 { animation-delay: 0.6s; --fly-x: 250px; --fly-y: -400px; }
.coin-particle-3 { animation-delay: 0.8s; --fly-x: 0px; --fly-y: -450px; }
.emoji-particle-3 { animation-delay: 1s; --fly-x: -250px; --fly-y: -200px; }

@keyframes roulette-fly {
  0% {
    transform: translate(-50%, -50%) scale(0) rotate(0deg);
    opacity: 0;
  }
  20% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(0.5) rotate(180deg);
  }
  100% {
    transform: translate(calc(-50% + var(--fly-x)), calc(-50% + var(--fly-y))) scale(1.5) rotate(720deg);
    opacity: 0;
  }
}

@media (max-width: 600px) {
  .flying-particle {
    font-size: 36px;
  }
  
  .tcyp-coin-img {
    width: 45px !important;
    height: 45px !important;
  }
}
</style>