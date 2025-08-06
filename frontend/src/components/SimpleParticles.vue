<template>
  <div v-if="isActive" class="simple-particles">
    <div class="particle particle-1">💰</div>
    <div class="particle particle-2">💵</div>
    <div class="particle particle-3">💰</div>
    <div class="particle particle-4">💸</div>
    <div class="particle particle-5">💰</div>
    <div class="particle particle-6">💴</div>
  </div>
</template>

<script setup>
defineProps({
  isActive: {
    type: Boolean,
    default: false
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
}

.particle-1 {
  top: 50%;
  left: 50%;
  animation-delay: 0s;
}

.particle-2 {
  top: 50%;
  left: 50%;
  animation-delay: 0.2s;
}

.particle-3 {
  top: 50%;
  left: 50%;
  animation-delay: 0.4s;
}

.particle-4 {
  top: 50%;
  left: 50%;
  animation-delay: 0.6s;
}

.particle-5 {
  top: 50%;
  left: 50%;
  animation-delay: 0.8s;
}

.particle-6 {
  top: 50%;
  left: 50%;
  animation-delay: 1s;
}

@keyframes fly {
  0% {
    transform: translate(-50%, -50%) scale(0) rotate(0deg);
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  100% {
    transform: translate(calc(-50% + var(--x, 200px)), calc(-50% + var(--y, -300px))) scale(1.5) rotate(720deg);
    opacity: 0;
  }
}

.particle-1 { --x: -200px; --y: -300px; }
.particle-2 { --x: 200px; --y: -250px; }
.particle-3 { --x: -150px; --y: -350px; }
.particle-4 { --x: 250px; --y: -400px; }
.particle-5 { --x: 0px; --y: -450px; }
.particle-6 { --x: -250px; --y: -200px; }
</style>