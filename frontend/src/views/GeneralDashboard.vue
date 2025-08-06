<template>
  <div>
    <div :class="$vuetify.display.mobile ? 'page-title-mobile' : 'page-title'">Общая информация</div>
    
    <!-- Общая статистика -->
    <v-row class="mb-6">
      <v-col cols="6" md="3">
        <v-card :class="$vuetify.display.mobile ? 'stats-card pa-3 text-center' : 'stats-card pa-4 text-center'">
          <div :style="$vuetify.display.mobile ? 'font-size: 24px; margin-bottom: 4px;' : 'font-size: 32px; margin-bottom: 8px;'">💰</div>
          <h3 :class="$vuetify.display.mobile ? 'text-primary-custom text-body-1 mb-0' : 'text-primary-custom mb-1'">{{ stats.totalEarned?.toLocaleString() || 0 }}</h3>
          <p :class="$vuetify.display.mobile ? 'text-caption mb-0' : 'caption mb-0'" style="opacity: 0.7;">Всего заработано</p>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card :class="$vuetify.display.mobile ? 'stats-card pa-3 text-center' : 'stats-card pa-4 text-center'">
          <div :style="$vuetify.display.mobile ? 'font-size: 24px; margin-bottom: 4px;' : 'font-size: 32px; margin-bottom: 8px;'">💸</div>
          <h3 :class="$vuetify.display.mobile ? 'text-primary-custom text-body-1 mb-0' : 'text-primary-custom mb-1'">{{ stats.totalSpent?.toLocaleString() || 0 }}</h3>
          <p :class="$vuetify.display.mobile ? 'text-caption mb-0' : 'caption mb-0'" style="opacity: 0.7;">Всего потрачено</p>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card :class="$vuetify.display.mobile ? 'stats-card pa-3 text-center' : 'stats-card pa-4 text-center'">
          <div :style="$vuetify.display.mobile ? 'font-size: 24px; margin-bottom: 4px;' : 'font-size: 32px; margin-bottom: 8px;'">👥</div>
          <h3 :class="$vuetify.display.mobile ? 'text-primary-custom text-body-1 mb-0' : 'text-primary-custom mb-1'">{{ stats.totalEmployees || 0 }}</h3>
          <p :class="$vuetify.display.mobile ? 'text-caption mb-0' : 'caption mb-0'" style="opacity: 0.7;">Активных сотрудников</p>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card :class="$vuetify.display.mobile ? 'stats-card pa-3 text-center' : 'stats-card pa-4 text-center'">
          <div :style="$vuetify.display.mobile ? 'font-size: 24px; margin-bottom: 4px;' : 'font-size: 32px; margin-bottom: 8px;'">📊</div>
          <h3 :class="$vuetify.display.mobile ? 'text-primary-custom text-body-1 mb-0' : 'text-primary-custom mb-1'">{{ stats.totalTransactions || 0 }}</h3>
          <p :class="$vuetify.display.mobile ? 'text-caption mb-0' : 'caption mb-0'" style="opacity: 0.7;">Всего операций</p>
        </v-card>
      </v-col>
    </v-row>

    <!-- Рулетка и история -->
    <v-row class="mb-6">
      <v-col cols="12" md="4" :order="$vuetify.display.mobile ? 2 : 1">
        <v-card class="pa-4" :style="$vuetify.display.mobile ? 'height: 400px; overflow-y: auto;' : 'height: 600px; overflow-y: auto;'">
          <h4 class="text-primary-custom mb-3">📊 Общая история операций</h4>
          <div v-for="transaction in generalHistory" :key="transaction.id" 
               :class="['activity-item', getTransactionClass(transaction)]">
            <div class="d-flex justify-space-between align-start">
              <div style="flex: 1;">
                <h5 class="text-primary-custom mb-1">{{ transaction.user }}</h5>
                <p class="text-body-2 mb-1">{{ transaction.description }}</p>
                <div class="d-flex justify-space-between align-center">
                  <span class="text-caption" style="opacity: 0.7;">{{ transaction.date }}</span>
                  <span :class="getAmountClass(transaction)" style="font-weight: 500;">
                    {{ transaction.amount > 0 ? '+' : '' }}{{ transaction.amount.toLocaleString() }} коинов
                  </span>
                </div>
              </div>
              <v-btn 
                v-if="isAdmin"
                icon
                size="small"
                variant="text"
                color="error"
                @click="deleteTransaction(transaction.id)"
                class="ml-2"
              >
                <v-icon size="small">mdi-delete</v-icon>
              </v-btn>
            </div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="8" :order="$vuetify.display.mobile ? 1 : 2">
        <!-- Рулетка -->
        <v-card class="roulette-card pa-4 mb-4" style="position: relative; overflow: visible;">
          <h4 class="text-primary-custom text-center mb-3">🎰 Еженедельная рулетка</h4>
          <div class="text-center" style="position: relative;">
            <div class="roulette-wheel mx-auto mb-3" :style="{ transform: `rotate(${rouletteRotation}deg)` }">
              <div class="roulette-pointer"></div>
              <div class="roulette-center">🎯</div>
              <!-- Числа на рулетке -->
              <div v-for="(number, index) in rouletteNumbers" 
                   :key="index" 
                   class="roulette-number"
                   :style="{
                     transform: `rotate(${index * 9.73}deg) translateY(-70px)`,
                     color: number === 0 ? '#FFD700' : ['1','3','5','7','9','12','14','16','18','19','21','23','25','27','30','32','34','36'].includes(number) ? '#FFF' : '#FFF'
                   }">
                {{ number }}
              </div>
            </div>
            <RouletteParticles 
              :is-active="isSpinning"
              :center-x="rouletteCenter.x"
              :center-y="rouletteCenter.y"
            />
            <p class="caption mb-3">Розыгрыш каждую пятницу в 17:00</p>
            <p class="subtitle-1 font-weight-bold mb-3">Приз: 1,000 коинов</p>
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
            <v-btn 
              v-if="isAdmin && !canSpin && rouletteMessage && rouletteMessage.includes('уже была разыграна')"
              color="warning" 
              variant="outlined"
              size="small"
              class="ml-2"
              @click="resetRoulette"
            >
              Сбросить ограничение
            </v-btn>
            <p v-else-if="!isAdmin" class="caption" style="opacity: 0.7;">
              Только администратор может крутить рулетку
            </p>
            <p v-if="lastWinner" class="mt-2 success--text">
              Последний победитель: {{ lastWinner }}
            </p>
            <!-- Тестовая кнопка для проверки анимации -->
            <v-btn 
              v-if="isAdmin"
              color="info" 
              variant="text"
              size="small"
              class="mt-2"
              @click="testParticles"
            >
              Тест анимации
            </v-btn>
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
                <v-col v-for="item in rewards.merchandise" :key="item.id" cols="6" sm="6" md="4" lg="3">
                  <v-card class="reward-card pa-3">
                    <div class="text-center">
                      <div style="font-size: 32px; margin-bottom: 8px;">{{ item.emoji }}</div>
                      <h6 class="text-primary mb-1">{{ item.name }}</h6>
                      <p class="text-caption mb-2">{{ item.price.toLocaleString() }} коинов</p>
                      <v-btn 
                        color="primary" 
                        size="small" 
                        @click="requestReward(item, 'merchandise')"
                        :disabled="userBalance < item.price"
                      >
                        Выбрать
                      </v-btn>
                    </div>
                  </v-card>
                </v-col>
              </v-row>
              
              <h4 class="text-h6 text-primary mb-3">✨ Привилегии</h4>
              <v-row>
                <v-col v-for="privilege in rewards.privileges" :key="privilege.id" cols="6" sm="6" md="4" lg="3">
                  <v-card class="reward-card pa-3">
                    <div class="text-center">
                      <div style="font-size: 32px; margin-bottom: 8px;">{{ privilege.emoji }}</div>
                      <h6 class="text-primary mb-1">{{ privilege.name }}</h6>
                      <p class="text-caption mb-2">{{ privilege.price.toLocaleString() }} коинов</p>
                      <v-btn 
                        color="primary" 
                        size="small" 
                        @click="requestReward(privilege, 'privileges')"
                        :disabled="userBalance < privilege.price"
                      >
                        Выбрать
                      </v-btn>
                    </div>
                  </v-card>
                </v-col>
              </v-row>
            </div>
          </v-window-item>

          <!-- Способы заработка -->
          <v-window-item>
            <div style="height: 500px; overflow-y: auto;">
              <!-- Социальные сети -->
              <h4 class="text-h6 text-primary mb-3">📱 Социальные сети</h4>
              <v-row class="mb-4">
                <v-col v-for="activity in socialActivities" :key="activity.value" cols="6" sm="6" md="4" lg="3">
                  <v-card class="earn-card pa-3">
                    <div class="text-center">
                      <div style="font-size: 24px; margin-bottom: 8px;">📱</div>
                      <h6 class="text-primary mb-1" style="font-size: 12px; line-height: 1.2;">{{ activity.text }}</h6>
                      <p class="text-caption success--text font-weight-bold">{{ activity.coins.toLocaleString() }} коинов</p>
                    </div>
                  </v-card>
                </v-col>
              </v-row>
              
              <!-- Мероприятия -->
              <h4 class="text-h6 text-primary mb-3">🎪 Мероприятия и контент</h4>
              <v-row class="mb-4">
                <v-col v-for="activity in eventActivities" :key="activity.value" cols="6" sm="6" md="4" lg="3">
                  <v-card class="earn-card pa-3">
                    <div class="text-center">
                      <div style="font-size: 24px; margin-bottom: 8px;">🎪</div>
                      <h6 class="text-primary mb-1" style="font-size: 12px; line-height: 1.2;">{{ activity.text }}</h6>
                      <p class="text-caption success--text font-weight-bold">{{ activity.coins.toLocaleString() }} коинов</p>
                    </div>
                  </v-card>
                </v-col>
              </v-row>
              
              <!-- Экспертный контент и бизнес -->
              <h4 class="text-h6 text-primary mb-3">💼 Экспертный контент и бизнес</h4>
              <v-row class="mb-4">
                <v-col v-for="activity in businessActivities" :key="activity.value" cols="6" sm="6" md="4" lg="3">
                  <v-card class="earn-card pa-3">
                    <div class="text-center">
                      <div style="font-size: 24px; margin-bottom: 8px;">💼</div>
                      <h6 class="text-primary mb-1" style="font-size: 12px; line-height: 1.2;">{{ activity.text }}</h6>
                      <p class="text-caption success--text font-weight-bold">{{ activity.coins.toLocaleString() }} коинов</p>
                    </div>
                  </v-card>
                </v-col>
              </v-row>
              
              <!-- Особые награды -->
              <h4 class="text-h6 text-primary mb-3">🏆 Особые награды</h4>
              <v-row>
                <v-col v-for="activity in milestoneActivities" :key="activity.value" cols="6" sm="6" md="4" lg="3">
                  <v-card class="earn-card pa-3">
                    <div class="text-center">
                      <div style="font-size: 24px; margin-bottom: 8px;">🏆</div>
                      <h6 class="text-primary mb-1" style="font-size: 12px; line-height: 1.2;">{{ activity.text }}</h6>
                      <p class="text-caption success--text font-weight-bold">{{ activity.coins.toLocaleString() }} коинов</p>
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
                      {{ user.coins.toLocaleString() }} коинов
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
    
    <!-- Confetti Effect -->
    <ConfettiEffect :active="showConfetti" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/api'
import { VWindow, VWindowItem, VTabs, VTab, VCard, VRow, VCol, VList, VListItem, VListItemTitle, VListItemSubtitle, VAvatar, VChip, VIcon, VBtn, VSnackbar } from 'vuetify/components'
import RouletteParticles from '@/components/RouletteParticles.vue'
import ConfettiEffect from '@/components/ConfettiEffect.vue'

const authStore = useAuthStore()
const isAdmin = computed(() => authStore.isAdmin)
const userBalance = computed(() => authStore.currentUser?.balance || 0)

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
const rouletteCenter = ref({ x: 150, y: 100 })
const showConfetti = ref(false)
const rouletteNumbers = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26]

// Уведомления
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
})

// Группировка активностей по категориям
const socialActivities = computed(() => 
  activityTypes.value.filter(activity => activity.category === 'social')
)

const eventActivities = computed(() => 
  activityTypes.value.filter(activity => activity.category === 'events')
)

const businessActivities = computed(() => 
  activityTypes.value.filter(activity => activity.category === 'content' || activity.category === 'business')
)

const milestoneActivities = computed(() => 
  activityTypes.value.filter(activity => activity.category === 'milestone')
)

// Методы
const loadStats = async () => {
  try {
    const response = await api.getStats()
    console.log('📊 Received stats:', response.data)
    console.log('📊 Stats object keys:', Object.keys(response.data))
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
  
  // Получаем координаты центра рулетки
  const rouletteWheel = document.querySelector('.roulette-wheel')
  if (rouletteWheel) {
    const rect = rouletteWheel.getBoundingClientRect()
    rouletteCenter.value = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    }
  }
  
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
      showConfetti.value = true
      showSnackbar(`🎉 Победитель: ${data.winner}! Приз: ${data.prizeAmount} коинов`, 'success')
      canSpin.value = false
      loadGeneralHistory() // Обновляем историю
      
      // Останавливаем конфетти через 5 секунд
      setTimeout(() => {
        showConfetti.value = false
      }, 5000)
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

const requestReward = async (reward, type) => {
  console.log('Отправляем запрос на награду:', { reward_id: reward.id, reward_name: reward.name });
  
  api.createRewardRequest({
    reward_id: reward.id,
    reward_type: type,
    reward_name: reward.name,
    reward_price: reward.price,
    comment: ''
  })
  .then(response => {
    console.log('Ответ сервера:', response);
    showSnackbar('Запрос на награду успешно отправлен!', 'success')
    // Обновляем баланс через небольшую задержку
    setTimeout(() => {
      authStore.fetchCurrentUser().catch(err => {
        console.error('Ошибка обновления баланса:', err)
      })
    }, 100)
  })
  .catch(error => {
    console.error('Ошибка при создании запроса:', error);
    console.error('Статус:', error.response?.status);
    console.error('Данные ошибки:', error.response?.data);
    
    if (error.response?.status === 400 && error.response?.data?.message?.includes('Недостаточно коинов')) {
      showSnackbar('Недостаточно коинов для получения награды', 'error')
    } else {
      showSnackbar(error.response?.data?.message || 'Ошибка отправки запроса', 'error')
    }
  })
}

const deleteTransaction = async (transactionId) => {
  if (!confirm('Вы уверены, что хотите удалить эту транзакцию?')) {
    return
  }
  
  try {
    await api.deleteTransaction(transactionId)
    showSnackbar('Транзакция успешно удалена', 'success')
    loadGeneralHistory() // Обновляем список
    loadStats() // Обновляем статистику
  } catch (error) {
    console.error('Ошибка при удалении транзакции:', error)
    showSnackbar(error.response?.data?.message || 'Ошибка при удалении транзакции', 'error')
  }
}

const resetRoulette = async () => {
  if (!confirm('Вы уверены, что хотите сбросить ограничение рулетки?')) {
    return
  }
  
  try {
    await api.resetRoulette()
    showSnackbar('Ограничение рулетки сброшено', 'success')
    loadRouletteInfo() // Обновляем информацию о рулетке
  } catch (error) {
    console.error('Ошибка при сбросе рулетки:', error)
    showSnackbar(error.response?.data?.message || 'Ошибка при сбросе рулетки', 'error')
  }
}

// Тестовая функция для проверки анимации
const testParticles = () => {
  const rouletteWheel = document.querySelector('.roulette-wheel')
  if (rouletteWheel) {
    const rect = rouletteWheel.getBoundingClientRect()
    rouletteCenter.value = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    }
  }
  
  isSpinning.value = true
  setTimeout(() => {
    isSpinning.value = false
  }, 3000)
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
  color: rgb(var(--v-theme-primary));
  font-size: 28px;
  font-weight: 500;
  margin-bottom: 24px;
}

.page-title-mobile {
  color: rgb(var(--v-theme-primary));
  font-size: 20px;
  font-weight: 500;
  margin-bottom: 16px;
}

.text-primary-custom {
  color: rgb(var(--v-theme-primary)) !important;
}

/* Темная тема - исправляем синий текст */
.v-theme--dark .text-primary-custom {
  color: #90CAF9 !important;
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
  background: rgb(var(--v-theme-surface));
  border-radius: 0 8px 8px 0;
}

/* Темная тема - правильный фон для карточек */
.v-theme--dark .activity-item {
  background: rgb(var(--v-theme-surface));
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
    #FF0000 0deg 9.73deg,
    #000000 9.73deg 19.46deg,
    #FF0000 19.46deg 29.19deg,
    #000000 29.19deg 38.92deg,
    #FF0000 38.92deg 48.65deg,
    #000000 48.65deg 58.38deg,
    #FF0000 58.38deg 68.11deg,
    #000000 68.11deg 77.84deg,
    #FF0000 77.84deg 87.57deg,
    #000000 87.57deg 97.3deg,
    #FF0000 97.3deg 107.03deg,
    #000000 107.03deg 116.76deg,
    #FF0000 116.76deg 126.49deg,
    #000000 126.49deg 136.22deg,
    #FF0000 136.22deg 145.95deg,
    #000000 145.95deg 155.68deg,
    #FF0000 155.68deg 165.41deg,
    #000000 165.41deg 175.14deg,
    #FF0000 175.14deg 184.87deg,
    #00FF00 184.87deg 194.6deg,
    #FF0000 194.6deg 204.33deg,
    #000000 204.33deg 214.06deg,
    #FF0000 214.06deg 223.79deg,
    #000000 223.79deg 233.52deg,
    #FF0000 233.52deg 243.25deg,
    #000000 243.25deg 252.98deg,
    #FF0000 252.98deg 262.71deg,
    #000000 262.71deg 272.44deg,
    #FF0000 272.44deg 282.17deg,
    #000000 282.17deg 291.9deg,
    #FF0000 291.9deg 301.63deg,
    #000000 301.63deg 311.36deg,
    #FF0000 311.36deg 321.09deg,
    #000000 321.09deg 330.82deg,
    #FF0000 330.82deg 340.55deg,
    #000000 340.55deg 350.28deg,
    #FF0000 350.28deg 360deg
  );
  position: relative;
  transition: transform 3s cubic-bezier(0.25, 0.1, 0.25, 1);
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.5), inset 0 0 20px rgba(0, 0, 0, 0.2);
}

.roulette-wheel:hover {
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.7), inset 0 0 20px rgba(0, 0, 0, 0.2);
}

.roulette-wheel::before {
  content: '';
  position: absolute;
  top: 10%;
  left: 10%;
  right: 10%;
  bottom: 10%;
  border-radius: 50%;
  background: radial-gradient(circle at center, #2a2a2a 0%, #1a1a1a 100%);
  z-index: 1;
}

.roulette-wheel::after {
  content: '';
  position: absolute;
  top: 5%;
  left: 5%;
  right: 5%;
  bottom: 5%;
  border-radius: 50%;
  border: 2px solid #FFD700;
  z-index: 2;
}

@media (max-width: 600px) {
  .roulette-wheel {
    width: 150px;
    height: 150px;
    border: 6px solid #FFD700;
  }
}

.roulette-pointer {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 20px solid transparent;
  border-right: 20px solid transparent;
  border-top: 40px solid #FFD700;
  z-index: 15;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}

.roulette-pointer::after {
  content: '';
  position: absolute;
  top: -40px;
  left: -10px;
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 20px solid #FFA500;
}

.roulette-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  background: radial-gradient(circle at 30% 30%, #FFD700, #B8860B);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #000;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5), inset -2px -2px 4px rgba(0, 0, 0, 0.3);
  z-index: 10;
  border: 2px solid #8B6914;
}

.reward-card, .earn-card {
  transition: all 0.3s;
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reward-card:hover, .earn-card:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.roulette-number {
  position: absolute;
  top: 50%;
  left: 50%;
  transform-origin: 0 0;
  font-weight: bold;
  font-size: 10px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  z-index: 5;
}
</style>