<template>
  <div>
    <h1 :class="$vuetify.display.mobile ? 'text-h5 text-primary mb-4' : 'text-h4 text-primary mb-6'">Личный кабинет</h1>
    
    <!-- Статистика -->
    <v-row class="mb-6">
      <v-col cols="12" md="6">
        <v-card 
          :class="$vuetify.display.mobile ? 'balance-card pa-4' : 'balance-card pa-6'" 
          :color="$vuetify.theme.name === 'dark' ? 'grey-darken-3' : 'primary'"
          :elevation="$vuetify.theme.name === 'dark' ? 8 : 4"
        >
          <div class="text-center">
            <img src="/coin_img.png" alt="ЦУПкоин" :style="$vuetify.display.mobile ? 'width: 100px; height: 100px; margin-bottom: 8px; object-fit: contain;' : 'width: 150px; height: 150px; margin-bottom: 16px; object-fit: contain;'" />
            <h2 
              :class="$vuetify.display.mobile ? 'text-h4 mb-1' : 'text-h3 mb-2'" 
              :style="$vuetify.theme.name === 'dark' ? 'color: #FFD54F;' : 'color: white;'"
            >
              {{ userBalance.toLocaleString() }} коинов
            </h2>
            <p 
              :class="$vuetify.display.mobile ? 'text-body-1' : 'text-h6'" 
              :style="$vuetify.theme.name === 'dark' ? 'opacity: 0.9; color: #E0E0E0;' : 'opacity: 0.9; color: white;'"
            >
              Ваш текущий баланс
            </p>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-row>
          <v-col cols="12" sm="4">
            <v-card :class="$vuetify.display.mobile ? 'stats-card pa-3 text-center' : 'stats-card pa-4 text-center'">
              <div :class="$vuetify.display.mobile ? 'text-h5 mb-1' : 'text-h4 mb-2'">📈</div>
              <h3 :class="$vuetify.display.mobile ? 'text-h6 text-primary mb-0' : 'text-h5 text-primary mb-1'">{{ stats.monthlyEarned?.toLocaleString() || 0 }}</h3>
              <p class="text-caption">Заработано в месяце</p>
            </v-card>
          </v-col>
          <v-col cols="12" sm="4">
            <v-card :class="$vuetify.display.mobile ? 'stats-card pa-3 text-center' : 'stats-card pa-4 text-center'">
              <div :class="$vuetify.display.mobile ? 'text-h5 mb-1' : 'text-h4 mb-2'">🏆</div>
              <h3 :class="$vuetify.display.mobile ? 'text-h6 text-primary mb-0' : 'text-h5 text-primary mb-1'">{{ stats.rank || '-' }}</h3>
              <p class="text-caption">Место в рейтинге</p>
            </v-card>
          </v-col>
          <v-col cols="12" sm="4">
            <v-card :class="$vuetify.display.mobile ? 'stats-card pa-3 text-center' : 'stats-card pa-4 text-center'">
              <div :class="$vuetify.display.mobile ? 'text-h5 mb-1' : 'text-h4 mb-2'">⭐</div>
              <h3 :class="$vuetify.display.mobile ? 'text-h6 text-primary mb-0' : 'text-h5 text-primary mb-1'">{{ stats.totalActivities || 0 }}</h3>
              <p class="text-caption">Активностей выполнено</p>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- Форма подачи заявки -->
    <v-card :class="$vuetify.display.mobile ? 'pa-4 mb-4' : 'pa-6 mb-6'">
      <h3 :class="$vuetify.display.mobile ? 'text-h6 text-primary mb-3' : 'text-h5 text-primary mb-4'">📝 Подать заявку на получение коинов</h3>
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
    <v-card :class="$vuetify.display.mobile ? 'pa-4' : 'pa-6'">
      <h3 :class="$vuetify.display.mobile ? 'text-h6 text-primary mb-3' : 'text-h5 text-primary mb-4'">📋 История заявок</h3>
      <v-data-table
        :headers="requestHeaders"
        :items="myRequests"
        :loading="loadingRequests"
        class="elevation-0"
        :mobile="$vuetify.display.mobile"
        :mobile-breakpoint="0"
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

    <!-- История запросов наград -->
    <v-card v-if="myRewardRequests.length > 0" :class="$vuetify.display.mobile ? 'pa-4' : 'pa-6'">
      <h3 :class="$vuetify.display.mobile ? 'text-h6 text-primary mb-3' : 'text-h5 text-primary mb-4'">🎁 Мои запросы наград</h3>
      <v-list>
        <v-list-item v-for="request in myRewardRequests" :key="request.id" class="mb-2">
          <template v-slot:prepend>
            <v-icon :color="getRewardStatusColor(request.status)" size="large">
              {{ getRewardStatusIcon(request.status) }}
            </v-icon>
          </template>
          <v-list-item-title>{{ request.reward_name }}</v-list-item-title>
          <v-list-item-subtitle>
            {{ request.reward_price }} коинов • {{ formatDate(request.created_at) }}
          </v-list-item-subtitle>
          <template v-slot:append>
            <v-chip
              :color="getRewardStatusColor(request.status)"
              size="small"
            >
              {{ getRewardStatusText(request.status) }}
            </v-chip>
          </template>
        </v-list-item>
      </v-list>
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
import { VAutocomplete, VBtn, VCard, VChip, VDataTable, VForm, VIcon, VRow, VCol, VSnackbar, VTextarea, VTextField, VList, VListItem, VListItemTitle, VListItemSubtitle } from 'vuetify/components'

const authStore = useAuthStore()
const userBalance = computed(() => authStore.currentUser?.balance || 0)

// Данные
const stats = ref({})
const activityTypes = ref([])
const myRequests = ref([])
const myRewardRequests = ref([])
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
const requestHeaders = computed(() => {
  if (window.innerWidth < 600) {
    return [
      { title: 'Дата', key: 'created_at' },
      { title: 'Активность', key: 'activity_type' },
      { title: 'Статус', key: 'status' }
    ]
  }
  return [
    { title: 'Дата', key: 'created_at', width: '15%' },
    { title: 'Тип активности', key: 'activity_type', width: '30%' },
    { title: 'Ссылка', key: 'link', width: '20%' },
    { title: 'Сумма', key: 'expected_coins', width: '15%' },
    { title: 'Статус', key: 'status', width: '20%' }
  ]
})

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

const getRewardStatusColor = (status) => {
  switch (status) {
    case 'pending': return 'warning'
    case 'approved': return 'success'
    case 'rejected': return 'error'
    default: return 'grey'
  }
}

const getRewardStatusText = (status) => {
  switch (status) {
    case 'pending': return 'Ожидает'
    case 'approved': return 'Одобрено'
    case 'rejected': return 'Отклонено'
    default: return status
  }
}

const getRewardStatusIcon = (status) => {
  switch (status) {
    case 'pending': return 'mdi-clock-outline'
    case 'approved': return 'mdi-check-circle'
    case 'rejected': return 'mdi-close-circle'
    default: return 'mdi-help-circle'
  }
}

const showSnackbar = (text, color = 'success') => {
  snackbar.value = {
    show: true,
    text,
    color
  }
}

const loadMyRewardRequests = async () => {
  try {
    const response = await api.getMyRewardRequests()
    myRewardRequests.value = response.data
  } catch (error) {
    console.error('Error loading reward requests:', error)
  }
}

// При загрузке
onMounted(() => {
  loadStats()
  loadActivityTypes()
  loadMyRequests()
  loadMyRewardRequests()
})
</script>

<style scoped>
.balance-card {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
}

.stats-card {
  transition: transform 0.2s;
}

.stats-card:hover {
  transform: translateY(-2px);
}
</style>