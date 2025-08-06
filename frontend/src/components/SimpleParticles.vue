<template>
  <div v-if="isActive" class="simple-particles">
    <!-- ЦУПкоины -->
    <img 
      src="/coin_img.png" 
      class="particle particle-1 tcyp-coin" 
      :style="{ left: centerX + 'px', top: centerY + 'px' }"
      alt="ЦУПкоин"
    />
    <div 
      class="particle particle-2"
      :style="{ left: centerX + 'px', top: centerY + 'px' }"
    >💵</div>
    <img 
      src="/coin_img.png" 
      class="particle particle-3 tcyp-coin" 
      :style="{ left: centerX + 'px', top: centerY + 'px' }"
      alt="ЦУПкоин"
    />
    <div 
      class="particle particle-4"
      :style="{ left: centerX + 'px', top: centerY + 'px' }"
    >💰</div>
    <img 
      src="/coin_img.png" 
      class="particle particle-5 tcyp-coin" 
      :style="{ left: centerX + 'px', top: centerY + 'px' }"
      alt="ЦУПкоин"
    />
    <div 
      class="particle particle-6"
      :style="{ left: centerX + 'px', top: centerY + 'px' }"
    >💸</div>
  </div>
</template>

<script setup>
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
</script>

<style scoped>
.simple-particles {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 9999;
}

.particle {
  position: absolute;
  font-size: 48px;
  animation: fly 3s ease-out forwards;
  transform-origin: center center;
}

.particle-1 {
  animation-delay: 0s;
}

.particle-2 {
  animation-delay: 0.2s;
}

.particle-3 {
  animation-delay: 0.4s;
}

.particle-4 {
  animation-delay: 0.6s;
}

.particle-5 {
  animation-delay: 0.8s;
}

.particle-6 {
  animation-delay: 1s;
}

.tcyp-coin {
  width: 60px;
  height: 60px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
}

@keyframes fly {
  0% {
    transform: translate(-50%, -50%) scale(0) rotate(0deg);
    opacity: 0;
  }
  20% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(0.5) rotate(180deg);
  }
  100% {
    transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y))) scale(1.5) rotate(720deg);
    opacity: 0;
  }
}

/* Траектории полета для каждой частицы */
.particle-1 { --x: -200px; --y: -300px; }
.particle-2 { --x: 200px; --y: -250px; }
.particle-3 { --x: -150px; --y: -350px; }
.particle-4 { --x: 250px; --y: -400px; }
.particle-5 { --x: 0px; --y: -450px; }
.particle-6 { --x: -250px; --y: -200px; }

@media (max-width: 600px) {
  .tcyp-coin {
    width: 45px;
    height: 45px;
  }
  
  .particle {
    font-size: 36px;
  }
}
</style>