<template>
  <div class="particles-container" ref="particlesContainer">
    <div
      v-for="particle in particles"
      :key="particle.id"
      class="particle"
      :style="{
        left: particle.x + 'px',
        top: particle.y + 'px',
        transform: `translate(-50%, -50%) rotate(${particle.rotation}deg) scale(${particle.scale})`,
        opacity: particle.opacity
      }"
    >
      <div 
        v-if="particle.type === 'coin'" 
        class="coin-test"
      >
        💰
      </div>
      <div v-else class="money-bill">
        <span class="bill-amount">{{ particle.amount }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  isActive: {
    type: Boolean,
    default: false
  },
  centerX: {
    type: Number,
    default: 100
  },
  centerY: {
    type: Number,
    default: 100
  }
})

const particlesContainer = ref(null)
const particles = ref([])
const coinImage = '/coin_img.png'
let particleId = 0
let animationFrameId = null

const createParticle = () => {
  const angle = Math.random() * Math.PI * 2
  const velocity = 5 + Math.random() * 10
  const type = Math.random() > 0.5 ? 'coin' : 'bill'
  
  return {
    id: particleId++,
    type,
    amount: type === 'bill' ? ['100', '500', '1000'][Math.floor(Math.random() * 3)] : null,
    x: props.centerX,
    y: props.centerY,
    vx: Math.cos(angle) * velocity,
    vy: Math.sin(angle) * velocity - 15,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 30,
    scale: 0.8 + Math.random() * 0.8,
    opacity: 1,
    gravity: 0.5,
    lifespan: 200
  }
}

const updateParticles = () => {
  particles.value = particles.value
    .map(particle => ({
      ...particle,
      x: particle.x + particle.vx,
      y: particle.y + particle.vy,
      vy: particle.vy + particle.gravity,
      rotation: particle.rotation + particle.rotationSpeed,
      opacity: Math.max(0, particle.opacity - 0.005),
      lifespan: particle.lifespan - 1
    }))
    .filter(particle => particle.lifespan > 0 && particle.opacity > 0 && particle.y < window.innerHeight + 100)
}

const animate = () => {
  if (props.isActive) {
    if (Math.random() < 0.5) {
      particles.value.push(createParticle())
      if (Math.random() < 0.3) {
        particles.value.push(createParticle())
      }
    }
  }
  
  updateParticles()
  
  if (particles.value.length > 0 || props.isActive) {
    animationFrameId = requestAnimationFrame(animate)
  }
}

// Следим за изменением props.isActive
import { watch } from 'vue'
watch(() => props.isActive, (newVal) => {
  console.log('MoneyParticles isActive:', newVal)
  if (newVal) {
    console.log('Starting particles animation at:', props.centerX, props.centerY)
    console.log('Current particles count:', particles.value.length)
  }
})

watch(() => particles.value.length, (newVal) => {
  console.log('Particles count changed:', newVal)
})

onMounted(() => {
  animate()
})

onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
})
</script>

<style scoped>
.particles-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  overflow: visible;
  z-index: 9998;
}

.particle {
  position: absolute;
  transition: none;
}

.coin-image {
  width: 60px;
  height: 60px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3)) brightness(1); }
  50% { filter: drop-shadow(0 2px 8px rgba(255, 215, 0, 0.6)) brightness(1.2); }
  100% { filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3)) brightness(1); }
}

.money-bill {
  width: 80px;
  height: 40px;
  background: linear-gradient(135deg, #85bb65 0%, #6fa85b 100%);
  border: 2px solid #5a8d4a;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
  position: relative;
  overflow: hidden;
  animation: flutter 3s infinite ease-in-out;
}

@keyframes flutter {
  0%, 100% { transform: rotateX(0deg); }
  25% { transform: rotateX(15deg); }
  75% { transform: rotateX(-15deg); }
}

.money-bill::before {
  content: '₽';
  position: absolute;
  top: 2px;
  left: 4px;
  font-size: 8px;
  color: #4a6d3a;
  font-weight: bold;
}

.money-bill::after {
  content: '₽';
  position: absolute;
  bottom: 2px;
  right: 4px;
  font-size: 8px;
  color: #4a6d3a;
  font-weight: bold;
}

.bill-amount {
  color: #fff;
  font-weight: bold;
  font-size: 12px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.coin-test {
  width: 60px;
  height: 60px;
  background: radial-gradient(circle at 30% 30%, #FFD700, #FFA500);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
}

@media (max-width: 600px) {
  .coin-image {
    width: 30px;
    height: 30px;
  }
  
  .coin-test {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }
  
  .money-bill {
    width: 45px;
    height: 22px;
  }
  
  .bill-amount {
    font-size: 10px;
  }
}
</style>