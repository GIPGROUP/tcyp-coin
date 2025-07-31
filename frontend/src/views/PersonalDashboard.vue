<template>
  <div>
    <h1 class="text-h4 text-primary mb-6">Личный кабинет</h1>
    
    <!-- Статистика -->
    <v-row class="mb-6">
      <v-col cols="12" md="6">
        <v-card class="balance-card pa-6" color="primary">
          <div class="text-center">
            <img src="/coin_img.png" alt="ЦУПкоин" style="width: 150px; height: 150px; margin-bottom: 16px; object-fit: contain;" />
            <h2 class="text-h3 white--text mb-2">{{ userBalance.toLocaleString() }} коинов</h2>
            <p class="white--text text-h6" style="opacity: 0.9;">Ваш текущий баланс</p>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-row>
          <v-col cols="4">
            <v-card class="stats-card pa-4 text-center">
              <div class="text-h4 mb-2">📈</div>
              <h3 class="text-h5 text-primary mb-1">{{ stats.monthlyEarned?.toLocaleString() || 0 }}</h3>
              <p class="text-caption">Заработано в месяце</p>
            </v-card>
          </v-col>
          <v-col cols="4">
            <v-card class="stats-card pa-4 text-center">
              <div class="text-h4 mb-2">🏆</div>
              <h3 class="text-h5 text-primary mb-1">{{ stats.rank || '-' }}</h3>
              <p class="text-caption">Место в рейтинге</p>
            </v-card>
          </v-col>
          <v-col cols="4">
            <v-card class="stats-card pa-4 text-center">
              <div class="text-h4 mb-2">⭐</div>
              <h3 class="text-h5 text-primary mb-1">{{ stats.totalActivities || 0 }}</h3>
              <p class="text-caption">Активностей выполнено</p>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- Форма подачи заявки -->
    <v-card class="pa-6 mb-6">
      <h3 class="text-h5 text-primary mb-4">📝 Подать заявку на получение коинов</h3>
      <v-form ref="form" v-model="validForm" @submit.prevent="submitRequest">
        <v-autocomplete
          v-model="newRequest.type"
          :items="activityTypes"
          item-title="text"
          item-value="value"
          label="Тип активности"
          :rules="[v => !!v || 'Выберите тип активности']"
          @update:model-value="updateExpectedCoins"
          required
        ></v-autocomplete>

        <v-text-field
          v-model="newRequest.description"
          label="Описание активности (необязательно)"
        ></v-text-field>

        <v-text-field
          v-model="newRequest.link"
          label="Ссылка на публикацию/подтверждение (необязательно)"
          hint="Можете указать ссылку или описание"
        ></v-text-field>

        <v-text-field
          v-model="newRequest.expectedCoins"
          label="Ожидаемое количество коинов"
          type="number"
          :rules="[v => !!v || 'Укажите количество', v => v > 0 || 'Должно быть больше 0']"
          required
          readonly
        ></v-text-field>

        <v-textarea
          v-model="newRequest.comment"
          label="Дополнительный комментарий"
          rows="3"
        ></v-textarea>

        <div class="text-right mt-4">
          <v-btn color="grey" variant="text" @click="resetForm">Очистить</v-btn>
          <v-btn 
            color="primary" 
            variant="flat"
            :disabled="!validForm" 
            :loading="submitting"
            type="submit"
            class="ml-3"
          >
            Подать заявку
          </v-btn>
        </div>
      </v-form>
    </v-card>

    <!-- История заявок -->
    <v-card class="pa-6">
      <h3 class="text-h5 text-primary mb-4">📋 История заявок</h3>
      <v-data-table
        :headers="requestHeaders"
        :items="myRequests"
        :loading="loadingRequests"
        class="elevation-0"
      >
        <template v-slot:item.status="{ item }">
          <v-chip
            :color="getStatusColor(item.status)"
            size="small"
          >
            {{ getStatusText(item.status) }}
          </v-chip>
        </template>
        <template v-slot:item.created_at="{ item }">
          {{ formatDate(item.created_at) }}
        </template>
      </v-data-table>
    </v-card>

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
import { VAutocomplete, VBtn, VCard, VChip, VDataTable, VForm, VIcon, VRow, VCol, VSnackbar, VTextarea, VTextField } from 'vuetify/components'

const authStore = useAuthStore()
const userBalance = computed(() => authStore.currentUser?.balance || 0)

// Данные
const stats = ref({})
const activityTypes = ref([])
const myRequests = ref([])
const loadingRequests = ref(false)
const submitting = ref(false)

// Форма
const form = ref(null)
const validForm = ref(false)
const newRequest = ref({
  type: '',
  description: '',
  link: '',
  expectedCoins: '',
  comment: ''
})

// Уведомления
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
})

// Заголовки таблицы
const requestHeaders = [
  { title: 'Дата', key: 'created_at', width: '15%' },
  { title: 'Тип активности', key: 'activity_type', width: '30%' },
  { title: 'Ссылка', key: 'link', width: '20%' },
  { title: 'Сумма', key: 'expected_coins', width: '15%' },
  { title: 'Статус', key: 'status', width: '20%' }
]

// Методы
const loadStats = async () => {
  try {
    const response = await api.getUserStats()
    stats.value = response.data
  } catch (error) {
    console.error('Error loading stats:', error)
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

const loadMyRequests = async () => {
  loadingRequests.value = true
  try {
    const response = await api.getMyRequests()
    myRequests.value = response.data
  } catch (error) {
    console.error('Error loading requests:', error)
  } finally {
    loadingRequests.value = false
  }
}

const updateExpectedCoins = (value) => {
  const activity = activityTypes.value.find(a => a.value === value)
  if (activity) {
    newRequest.value.expectedCoins = activity.coins
  }
}

const isValidUrl = (url) => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

const submitRequest = async () => {
  if (!validForm.value) return

  submitting.value = true
  try {
    await api.createRequest({
      activity_type: newRequest.value.type,
      description: newRequest.value.description,
      link: newRequest.value.link,
      expected_coins: parseInt(newRequest.value.expectedCoins),
      comment: newRequest.value.comment
    })

    showSnackbar('Заявка успешно отправлена!', 'success')
    resetForm()
    loadMyRequests()
  } catch (error) {
    showSnackbar(error.response?.data?.message || 'Ошибка отправки заявки', 'error')
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  form.value?.reset()
  newRequest.value = {
    type: '',
    description: '',
    link: '',
    expectedCoins: '',
    comment: ''
  }
}

const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return 'warning'
    case 'approved': return 'success'
    case 'rejected': return 'error'
    default: return 'grey'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'pending': return 'Ожидает'
    case 'approved': return 'Одобрена'
    case 'rejected': return 'Отклонена'
    default: return status
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleString('ru-RU')
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
  loadActivityTypes()
  loadMyRequests()
})
</script>

<style scoped>
.balance-card {
  background: linear-gradient(135deg, #496797 0%, #012C6D 100%);
}

.stats-card {
  transition: transform 0.2s;
}

.stats-card:hover {
  transform: translateY(-2px);
}
</style>