<template>
  <div>
    <div class="page-title">Общая информация</div>
    
    <!-- Общая статистика -->
    <v-row class="mb-6">
      <v-col cols="6" md="3">
        <v-card class="stats-card pa-4 text-center">
          <div style="font-size: 32px; margin-bottom: 8px;">💰</div>
          <h3 class="text-primary-custom mb-1">{{ stats.totalEarned?.toLocaleString() || 0 }}</h3>
          <p class="caption grey--text mb-0">Всего заработано</p>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card class="stats-card pa-4 text-center">
          <div style="font-size: 32px; margin-bottom: 8px;">💸</div>
          <h3 class="text-primary-custom mb-1">{{ stats.totalSpent?.toLocaleString() || 0 }}</h3>
          <p class="caption grey--text mb-0">Всего потрачено</p>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card class="stats-card pa-4 text-center">
          <div style="font-size: 32px; margin-bottom: 8px;">👥</div>
          <h3 class="text-primary-custom mb-1">{{ stats.totalEmployees || 0 }}</h3>
          <p class="caption grey--text mb-0">Активных сотрудников</p>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card class="stats-card pa-4 text-center">
          <div style="font-size: 32px; margin-bottom: 8px;">📊</div>
          <h3 class="text-primary-custom mb-1">{{ stats.totalTransactions || 0 }}</h3>
          <p class="caption grey--text mb-0">Всего операций</p>
        </v-card>
      </v-col>
    </v-row>

    <!-- Рулетка и история -->
    <v-row class="mb-6">
      <v-col cols="12" md="4">
        <v-card class="pa-4" style="height: 600px; overflow-y: auto;">
          <h4 class="text-primary-custom mb-3">📊 Общая история операций</h4>
          <div v-for="transaction in generalHistory" :key="transaction.id" 
               :class="['activity-item', getTransactionClass(transaction)]">
            <div>
              <h5 class="text-primary-custom mb-1">{{ transaction.user }}</h5>
              <p class="text-body-2 mb-1">{{ transaction.description }}</p>
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption grey--text">{{ transaction.date }}</span>
                <span :class="getAmountClass(transaction)" style="font-weight: 500;">
                  {{ transaction.amount > 0 ? '+' : '' }}{{ transaction.amount.toLocaleString() }} ЦУП
                </span>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="8">
        <!-- Рулетка -->
        <v-card class="roulette-card pa-4 mb-4">
          <h4 class="text-primary-custom text-center mb-3">🎰 Еженедельная рулетка</h4>
          <div class="text-center">
            <div class="roulette-wheel mx-auto mb-3" :style="{ transform: `rotate(${rouletteRotation}deg)` }">
              <div class="roulette-pointer"></div>
              <div class="roulette-center">🎯</div>
            </div>
            <p class="caption mb-3">Розыгрыш каждую пятницу в 17:00</p>
            <p class="subtitle-1 font-weight-bold mb-3">Приз: 1,000 ЦУПкоинов</p>
            <v-btn 
              v-if="isAdmin"
              color="rgb(1, 44, 109)" 
              dark
              @click="spinRoulette"
              :disabled="isSpinning || !canSpin"
              :loading="isSpinning"
            >
              {{ isSpinning ? 'Крутится...' : canSpin ? 'Крутить рулетку' : rouletteMessage }}
            </v-btn>
            <p v-else class="caption grey--text">
              Только администратор может крутить рулетку
            </p>
            <p v-if="lastWinner" class="mt-2 success--text">
              Последний победитель: {{ lastWinner }}
            </p>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Табы -->
    <v-row>
      <v-col cols="12">
        <v-tabs v-model="activeTab" background-color="white" color="rgb(1, 44, 109)" class="mb-4">
          <v-tab>
            <v-icon left>mdi-gift</v-icon>
            Награды
          </v-tab>
          <v-tab>
            <v-icon left>mdi-cash-multiple</v-icon>
            Способы заработка
          </v-tab>
          <v-tab>
            <v-icon left>mdi-chart-line</v-icon>
            Рейтинг
          </v-tab>
        </v-tabs>

        <v-window v-model="activeTab">
          <!-- Каталог наград -->
          <v-window-item>
            <div style="height: 500px; overflow-y: auto;">
              <h4 class="text-h6 text-primary mb-3">👕 Корпоративный мерч</h4>
              <v-row class="mb-4">
                <v-col v-for="item in rewards.merchandise" :key="item.id" cols="12" sm="6" md="4" lg="3">
                  <v-card class="reward-card pa-3">
                    <div class="text-center">
                      <div style="font-size: 32px; margin-bottom: 8px;">{{ item.emoji }}</div>
                      <h6 class="text-primary mb-1">{{ item.name }}</h6>
                      <p class="text-caption">{{ item.price.toLocaleString() }} ЦУП</p>
                    </div>
                  </v-card>
                </v-col>
              </v-row>
              
              <h4 class="text-h6 text-primary mb-3">✨ Привилегии</h4>
              <v-row>
                <v-col v-for="privilege in rewards.privileges" :key="privilege.id" cols="12" sm="6" md="4" lg="3">
                  <v-card class="reward-card pa-3">
                    <div class="text-center">
                      <div style="font-size: 32px; margin-bottom: 8px;">{{ privilege.emoji }}</div>
                      <h6 class="text-primary mb-1">{{ privilege.name }}</h6>
                      <p class="text-caption">{{ privilege.price.toLocaleString() }} ЦУП</p>
                    </div>
                  </v-card>
                </v-col>
              </v-row>
            </div>
          </v-window-item>

          <!-- Способы заработка -->
          <v-window-item>
            <div style="height: 500px; overflow-y: auto;">
              <v-row>
                <v-col v-for="activity in activityTypes" :key="activity.value" cols="12" md="6">
                  <v-card class="earn-card pa-4 mb-3">
                    <div class="d-flex align-center">
                      <v-icon size="24" color="primary" class="mr-3">mdi-star</v-icon>
                      <div class="flex-grow-1">
                        <h6 class="text-primary mb-1">{{ activity.text }}</h6>
                        <div class="d-flex align-center">
                          <span class="success--text font-weight-bold">{{ activity.coins }}</span>
                          <span class="ml-1 text-caption">ЦУП</span>
                        </div>
                      </div>
                    </div>
                  </v-card>
                </v-col>
              </v-row>
            </div>
          </v-window-item>

          <!-- Общий рейтинг -->
          <v-window-item>
            <v-card class="pa-4" style="height: 500px; overflow-y: auto;">
              <h4 class="text-h6 text-primary mb-3">🏆 Общий рейтинг сотрудников</h4>
              <v-list>
                <v-list-item v-for="(user, index) in leaderboard" :key="user.id" class="mb-2">
                  <template v-slot:prepend>
                    <v-avatar :color="index < 3 ? 'amber' : 'grey'">
                      <span class="white--text font-weight-bold">{{ index + 1 }}</span>
                    </v-avatar>
                  </template>
                  <v-list-item-title class="text-primary font-weight-medium">{{ user.name }}</v-list-item-title>
                  <template v-slot:append>
                    <v-chip color="success" size="small">
                      {{ user.coins.toLocaleString() }} ЦУП
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </v-card>
          </v-window-item>
        </v-window>
      </v-col>
    </v-row>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">Закрыть</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/api'
import { VWindow, VWindowItem, VTabs, VTab, VCard, VRow, VCol, VList, VListItem, VListItemTitle, VListItemSubtitle, VAvatar, VChip, VIcon, VBtn, VSnackbar } from 'vuetify/components'

const authStore = useAuthStore()
const isAdmin = computed(() => authStore.isAdmin)

// Данные
const stats = ref({})
const generalHistory = ref([])
const rewards = ref({ merchandise: [], privileges: [] })
const activityTypes = ref([])
const leaderboard = ref([])
const activeTab = ref(0)

// Рулетка
const rouletteRotation = ref(0)
const isSpinning = ref(false)
const canSpin = ref(false)
const lastWinner = ref('')
const rouletteMessage = ref('')

// Уведомления
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
})

// Методы
const loadStats = async () => {
  try {
    const response = await api.getStats()
    console.log('📊 Received stats:', response.data)
    stats.value = response.data
  } catch (error) {
    console.error('Error loading stats:', error)
  }
}

const loadGeneralHistory = async () => {
  try {
    const response = await api.getGeneralTransactions()
    generalHistory.value = response.data
  } catch (error) {
    console.error('Error loading history:', error)
  }
}

const loadRewards = async () => {
  try {
    const response = await api.getRewards()
    rewards.value = response.data
  } catch (error) {
    console.error('Error loading rewards:', error)
  }
}

const loadActivityTypes = async () => {
  try {
    const response = await api.getActivityTypes()
    activityTypes.value = response.data
  } catch (error) {
    console.error('Error loading activity types:', error)
  }
}

const loadLeaderboard = async () => {
  try {
    const response = await api.getLeaderboard()
    leaderboard.value = response.data
  } catch (error) {
    console.error('Error loading leaderboard:', error)
  }
}

const loadRouletteInfo = async () => {
  try {
    const response = await api.getRouletteInfo()
    const data = response.data
    canSpin.value = data.canSpin
    lastWinner.value = data.lastWinner
    rouletteMessage.value = data.message || 'Ждите пятницу'
  } catch (error) {
    console.error('Error loading roulette info:', error)
  }
}

const spinRoulette = async () => {
  if (!canSpin.value || isSpinning.value) return
  
  isSpinning.value = true
  const spins = 5 + Math.random() * 3 // 5-8 оборотов
  const finalAngle = spins * 360 + Math.random() * 360
  rouletteRotation.value += finalAngle
  
  try {
    const response = await api.spinRoulette()
    const data = response.data
    
    setTimeout(() => {
      isSpinning.value = false
      lastWinner.value = data.winner
      showSnackbar(`🎉 Победитель: ${data.winner}! Приз: ${data.prizeAmount} ЦУПкоинов`, 'success')
      canSpin.value = false
      loadGeneralHistory() // Обновляем историю
    }, 3000)
  } catch (error) {
    isSpinning.value = false
    showSnackbar(error.response?.data?.message || 'Ошибка при розыгрыше', 'error')
  }
}

const getTransactionClass = (transaction) => {
  switch(transaction.type) {
    case 'lottery': return 'lottery'
    case 'earn': return 'positive'
    case 'spend': return 'negative'
    default: return ''
  }
}

const getAmountClass = (transaction) => {
  switch(transaction.type) {
    case 'lottery': return 'warning--text'
    case 'earn': return 'success--text'
    case 'spend': return 'error--text'
    default: return ''
  }
}

const showSnackbar = (text, color = 'success') => {
  snackbar.value = {
    show: true,
    text,
    color
  }
}

// При загрузке
onMounted(() => {
  loadStats()
  loadGeneralHistory()
  loadRewards()
  loadActivityTypes()
  loadLeaderboard()
  loadRouletteInfo()
})
</script>

<style scoped>
.page-title {
  color: rgb(1, 44, 109);
  font-size: 28px;
  font-weight: 500;
  margin-bottom: 24px;
}

.text-primary-custom {
  color: rgb(1, 44, 109) !important;
}

.stats-card {
  transition: transform 0.2s;
}

.stats-card:hover {
  transform: translateY(-2px);
}

.activity-item {
  border-left: 4px solid #2196F3;
  padding: 16px;
  margin-bottom: 16px;
  background: white;
  border-radius: 0 8px 8px 0;
}

.activity-item.positive {
  border-color: #4CAF50;
}

.activity-item.negative {
  border-color: #FF5722;
}

.activity-item.lottery {
  border-color: #FFD700;
}

.roulette-wheel {
  width: 200px;
  height: 200px;
  border: 8px solid #FFD700;
  border-radius: 50%;
  background: conic-gradient(
    #FF6B6B 0deg 72deg,
    #4ECDC4 72deg 144deg,
    #45B7D1 144deg 216deg,
    #96CEB4 216deg 288deg,
    #FFEAA7 288deg 360deg
  );
  position: relative;
  transition: transform 3s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.roulette-pointer {
  position: absolute;
  top: -15px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 15px solid transparent;
  border-right: 15px solid transparent;
  border-top: 30px solid #FFD700;
  z-index: 10;
}

.roulette-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  background: #FFD700;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: rgb(1, 44, 109);
}

.reward-card, .earn-card {
  transition: all 0.3s;
}

.reward-card:hover, .earn-card:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}
</style>