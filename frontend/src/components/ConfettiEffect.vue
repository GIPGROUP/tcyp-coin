<template>
  <div v-if="active" class="confetti-container">
    <div
      v-for="confetto in confetti"
      :key="confetto.id"
      class="confetto"
      :style="{
        left: confetto.x + 'px',
        top: confetto.y + 'px',
        backgroundColor: confetto.color,
        transform: `rotate(${confetto.rotation}deg)`,
        opacity: confetto.opacity
      }"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  active: {
    type: Boolean,
    default: false
  }
})

const confetti = ref([])
let confettoId = 0

const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']

const createConfetto = () => {
  const x = Math.random() * window.innerWidth
  const y = -20
  
  return {
    id: confettoId++,
    x,
    y,
    vx: (Math.random() - 0.5) * 2,
    vy: Math.random() * 3 + 2,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 10,
    color: colors[Math.floor(Math.random() * colors.length)],
    opacity: 1,
    gravity: 0.1
  }
}

const updateConfetti = () => {
  confetti.value = confetti.value
    .map(c => ({
      ...c,
      x: c.x + c.vx,
      y: c.y + c.vy,
      vy: c.vy + c.gravity,
      rotation: c.rotation + c.rotationSpeed,
      opacity: c.opacity - 0.01
    }))
    .filter(c => c.y < window.innerHeight && c.opacity > 0)
}

let animationId = null
let spawnInterval = null

const animate = () => {
  updateConfetti()
  if (confetti.value.length > 0) {
    animationId = requestAnimationFrame(animate)
  }
}

watch(() => props.active, (newVal) => {
  if (newVal) {
    confetti.value = []
    
    // Создаем конфетти
    spawnInterval = setInterval(() => {
      for (let i = 0; i < 5; i++) {
        confetti.value.push(createConfetto())
      }
    }, 50)
    
    // Останавливаем создание через 2 секунды
    setTimeout(() => {
      clearInterval(spawnInterval)
    }, 2000)
    
    animate()
  } else {
    if (spawnInterval) clearInterval(spawnInterval)
    if (animationId) cancelAnimationFrame(animationId)
    confetti.value = []
  }
})
</script>

<style scoped>
.confetti-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
}

.confetto {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 2px;
}
</style>