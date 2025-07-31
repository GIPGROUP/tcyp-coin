<template>
  <div>
    <div :class="$vuetify.display.mobile ? 'd-block mb-4' : 'd-flex justify-space-between align-center mb-4'">
      <div :class="$vuetify.display.mobile ? 'page-title text-center mb-3' : 'page-title'">🔧 Панель администратора</div>
      <v-btn 
        color="error" 
        variant="outlined"
        @click="confirmCleanDatabase"
        :size="$vuetify.display.mobile ? 'small' : 'default'"
        :block="$vuetify.display.mobile"
      >
        <v-icon left>mdi-database-remove</v-icon>
        Очистить базу данных
      </v-btn>
    </div>
    
    <!-- Список сотрудников -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card class="pa-4">
          <div class="d-flex justify-space-between align-center mb-4">
            <h3 class="text-primary-custom">👥 Управление сотрудниками</h3>
            <v-text-field
              v-model="employeeSearch"
              append-icon="mdi-magnify"
              label="Поиск сотрудника"
              single-line
              hide-details
              style="max-width: 300px;"
              density="compact"
            ></v-text-field>
          </div>
          
          <v-data-table
            :headers="employeeHeaders"
            :items="filteredEmployees"
            :items-per-page="10"
            class="elevation-1"
            :mobile="$vuetify.display.mobile"
            :mobile-breakpoint="0"
          >
            <template v-slot:item.full_name="{ item }">
              <div>
                <div class="font-weight-medium text-primary-custom">{{ item.full_name }}</div>
              </div>
            </template>
            <template v-slot:item.coins="{ item }">
              <v-chip color="success" size="small">
                {{ item.coins.toLocaleString() }} коинов
              </v-chip>
            </template>
            <template v-slot:[`item.actions`]="{ item }">
              <div :class="$vuetify.display.mobile ? 'd-flex flex-column' : 'd-flex flex-row'">
                <v-btn 
                  color="success" 
                  :size="$vuetify.display.mobile ? 'x-small' : 'x-small'"
                  @click="() => openAddCoinsDialog(item)"
                  :class="$vuetify.display.mobile ? 'mb-1' : 'ma-1'"
                  :block="$vuetify.display.mobile"
                >
                  <v-icon size="small">mdi-plus</v-icon>
                  {{ $vuetify.display.mobile ? '+' : 'Добавить' }}
                </v-btn>
                <v-btn 
                  color="error" 
                  :size="$vuetify.display.mobile ? 'x-small' : 'x-small'"
                  @click="() => openSubtractCoinsDialog(item)"
                  :class="$vuetify.display.mobile ? 'mb-1' : 'ma-1'"
                  :block="$vuetify.display.mobile"
                >
                  <v-icon size="small">mdi-minus</v-icon>
                  {{ $vuetify.display.mobile ? '-' : 'Списать' }}
                </v-btn>
                <v-btn 
                  color="info" 
                  :size="$vuetify.display.mobile ? 'x-small' : 'x-small'"
                  @click="() => viewHistory(item)"
                  :class="$vuetify.display.mobile ? '' : 'ma-1'"
                  :block="$vuetify.display.mobile"
                >
                  <v-icon size="small">mdi-history</v-icon>
                  {{ $vuetify.display.mobile ? 'ℹ' : 'История' }}
                </v-btn>
              </div>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Заявки и действия -->
    <v-row>
      <v-col cols="12" md="4">
        <!-- Заявки сотрудников -->
        <v-card class="pa-4" style="height: 600px;">
          <div class="d-flex justify-space-between align-center mb-4">
            <h3 class="text-primary-custom">📋 Заявки сотрудников</h3>
            <v-chip :color="pendingRequestsOnly.length > 0 ? 'warning' : 'success'" size="small">
              {{ pendingRequestsOnly.length }} ожидают
            </v-chip>
          </div>
          
          <div style="height: 520px; overflow-y: auto;">
            <div v-if="pendingRequestsOnly.length === 0" class="text-center mt-8">
              <v-icon size="64" color="grey-lighten-2">mdi-check-circle</v-icon>
              <p class="grey--text mt-2">Нет новых заявок</p>
            </div>
            
            <v-card 
              v-for="request in pendingRequestsOnly" 
              :key="request.id" 
              class="mb-3 pa-3"
              variant="outlined"
            >
              <div class="d-flex justify-space-between align-center mb-2">
                <h5 class="text-primary-custom">{{ request.employee }}</h5>
                <v-chip size="small" color="warning">
                  Ожидает
                </v-chip>
              </div>
              
              <p class="text-body-2 mb-2"><strong>Активность:</strong> {{ request.activityType }}</p>
              <p class="text-body-2 mb-2" v-if="request.description">
                <strong>Описание:</strong> {{ request.description }}
              </p>
              <p class="text-body-2 mb-2">
                <strong>Ссылка:</strong> 
                <a :href="request.link" target="_blank" class="text-decoration-none">
                  {{ request.link }}
                </a>
              </p>
              <p class="text-body-2 mb-3">
                <strong>Запрашиваемая сумма:</strong> 
                <span class="text-success font-weight-bold">{{ request.expectedCoins }} коинов</span>
              </p>
              <p class="text-caption grey--text mb-3">Подана: {{ request.submittedDate }}</p>
              
              <div class="d-flex justify-end">
                <v-btn 
                  color="success" 
                  size="small" 
                  @click="approveRequest(request)"
                  class="mr-2"
                >
                  <v-icon size="small" start>mdi-check</v-icon>
                  Одобрить
                </v-btn>
                <v-btn 
                  color="error" 
                  size="small" 
                  @click="rejectRequest(request)"
                >
                  <v-icon size="small" start>mdi-close</v-icon>
                  Отклонить
                </v-btn>
              </div>
            </v-card>
          </div>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <!-- Запросы наград -->
        <v-card class="pa-4" style="height: 600px;">
          <div class="d-flex justify-space-between align-center mb-4">
            <h3 class="text-primary-custom">🎁 Запросы наград</h3>
            <v-chip :color="pendingRewardRequests.length > 0 ? 'warning' : 'success'" size="small">
              {{ pendingRewardRequests.length }} ожидают
            </v-chip>
          </div>
          
          <div style="height: 520px; overflow-y: auto;">
            <div v-if="pendingRewardRequests.length === 0" class="text-center mt-8">
              <v-icon size="64" color="grey-lighten-2">mdi-gift</v-icon>
              <p class="grey--text mt-2">Нет новых запросов наград</p>
            </div>
            
            <div v-for="request in rewardRequests" :key="request.id" 
                 class="request-card mb-3" 
                 :class="{ 'pending': request.status === 'pending' }">
              <div class="d-flex justify-space-between align-center mb-2">
                <h5 class="text-primary-custom">{{ request.user_name }}</h5>
                <v-chip 
                  :color="getRewardStatusColor(request.status)" 
                  size="x-small"
                >
                  {{ getRewardStatusText(request.status) }}
                </v-chip>
              </div>
              <p class="text-body-2 mb-1">
                <strong>Награда:</strong> {{ request.reward_name }}
              </p>
              <p class="text-body-2 mb-1">
                <strong>Стоимость:</strong> {{ request.reward_price }} коинов
              </p>
              <p class="text-caption grey--text mb-2">{{ new Date(request.created_at).toLocaleString('ru-RU') }}</p>
              
              <div v-if="request.status === 'pending'" class="d-flex justify-space-between">
                <v-btn 
                  color="success" 
                  size="x-small" 
                  @click="approveRewardRequest(request)"
                  class="mr-2"
                >
                  Одобрить
                </v-btn>
                <v-btn 
                  color="error" 
                  size="x-small" 
                  @click="rejectRewardRequest(request)"
                >
                  Отклонить
                </v-btn>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <!-- Последние действия администратора -->
        <v-card class="pa-4" style="height: 600px;">
          <h4 class="text-primary-custom mb-3">📝 Последние действия</h4>
          <div style="height: 520px; overflow-y: auto;">
            <div v-for="action in adminActions" :key="action.id" 
                 :class="['admin-action', action.type]">
              <div class="d-flex justify-space-between align-center">
                <div>
                  <h6 class="text-primary-custom mb-1">{{ action.employee }}</h6>
                  <p class="text-body-2 mb-1">{{ action.description }}</p>
                  <span class="text-caption grey--text">{{ action.date }}</span>
                </div>
                <div class="text-right">
                  <div :class="getActionAmountClass(action)" style="font-weight: 500;">
                    {{ action.amount > 0 ? '+' : '' }}{{ action.amount.toLocaleString() }} коинов
                  </div>
                  <v-btn 
                    v-if="action.can_undo"
                    size="x-small" 
                    color="warning" 
                    @click="undoAction(action)"
                    class="mt-1"
                  >
                    Отменить
                  </v-btn>
                </div>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Диалог добавления коинов -->
    <v-dialog v-model="addCoinsDialog" :max-width="$vuetify.display.mobile ? '90%' : '500px'" :fullscreen="$vuetify.display.mobile">
      <v-card>
        <v-card-title>Добавить коины</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="selectedEmployee.full_name"
            label="Сотрудник"
            readonly
          ></v-text-field>
          <v-text-field
            v-model="coinsToAdd"
            label="Количество коинов"
            type="number"
            :rules="[v => v > 0 || 'Введите положительное число']"
          ></v-text-field>
          <v-text-field
            v-model="addReason"
            label="Причина начисления (необязательно)"
            hint="Если не указано, будет 'Административное начисление'"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeAddCoinsDialog">Отмена</v-btn>
          <v-btn color="success" variant="flat" @click="addCoins">Добавить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог списания коинов -->
    <v-dialog v-model="subtractCoinsDialog" :max-width="$vuetify.display.mobile ? '90%' : '500px'" :fullscreen="$vuetify.display.mobile">
      <v-card>
        <v-card-title>Списать коины</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="selectedEmployee.full_name"
            label="Сотрудник"
            readonly
          ></v-text-field>
          <v-text-field
            v-model="coinsToSubtract"
            label="Количество коинов"
            type="number"
            :rules="[v => v > 0 || 'Введите положительное число']"
          ></v-text-field>
          <v-text-field
            v-model="subtractReason"
            label="Причина списания (необязательно)"
            hint="Если не указано, будет 'Административное списание'"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeSubtractCoinsDialog">Отмена</v-btn>
          <v-btn color="error" variant="flat" @click="subtractCoins">Списать</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог истории сотрудника -->
    <v-dialog v-model="historyDialog" :max-width="$vuetify.display.mobile ? '90%' : '800px'" :fullscreen="$vuetify.display.mobile">
      <v-card>
        <v-card-title>История изменений: {{ selectedEmployee.full_name }}</v-card-title>
        <v-card-text style="height: 400px; overflow-y: auto;">
          <div v-for="record in employeeHistory" :key="record.id" 
               :class="['admin-action', record.type]">
            <div class="d-flex justify-space-between align-center">
              <div>
                <p class="text-body-2 mb-1">{{ record.description }}</p>
                <span class="text-caption grey--text">{{ record.date }} - {{ record.admin }}</span>
              </div>
              <div :class="getActionAmountClass(record)" style="font-weight: 500;">
                {{ record.amount > 0 ? '+' : '' }}{{ record.amount.toLocaleString() }} коинов
              </div>
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="historyDialog = false">Закрыть</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог очистки базы данных -->
    <v-dialog v-model="cleanDatabaseDialog" :max-width="$vuetify.display.mobile ? '90%' : '500px'">
      <v-card>
        <v-card-title class="text-h5 error--text">
          ⚠️ Очистка базы данных
        </v-card-title>
        <v-card-text>
          <p class="text-body-1 mb-3">Это действие удалит:</p>
          <ul class="mb-3">
            <li>✅ Все транзакции</li>
            <li>✅ Все заявки</li>
            <li>✅ Всю историю действий</li>
            <li>✅ Обнулит балансы всех пользователей</li>
          </ul>
          <p class="text-body-1 font-weight-bold">Пользователи НЕ будут удалены.</p>
          <p class="text-body-2 error--text mt-3">Это действие нельзя отменить!</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn 
            variant="text" 
            @click="cleanDatabaseDialog = false"
          >
            Отмена
          </v-btn>
          <v-btn 
            color="error" 
            variant="flat"
            @click="cleanDatabase"
            :loading="cleaningDatabase"
          >
            Очистить базу
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
import { ref, computed, onMounted } from 'vue'
import api from '@/api'

// Данные
const employees = ref([])
const pendingRequests = ref([])
const rewardRequests = ref([])
const adminActions = ref([])
const employeeHistory = ref([])
const employeeSearch = ref('')

// Диалоги
const addCoinsDialog = ref(false)
const subtractCoinsDialog = ref(false)
const historyDialog = ref(false)
const cleanDatabaseDialog = ref(false)
const selectedEmployee = ref({})
const coinsToAdd = ref(0)
const coinsToSubtract = ref(0)
const addReason = ref('')
const subtractReason = ref('')
const cleaningDatabase = ref(false)

// Уведомления
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
})

// Заголовки таблицы
const employeeHeaders = computed(() => {
  if (window.innerWidth < 600) {
    return [
      { title: 'Сотрудник', key: 'full_name' },
      { title: 'Действия', key: 'actions', sortable: false }
    ]
  }
  return [
    { title: 'ФИО', key: 'full_name', width: '40%' },
    { title: 'Коины', key: 'coins', width: '25%' },
    { title: 'Действия', key: 'actions', sortable: false, width: '35%' }
  ]
})

// Вычисляемые свойства
const filteredEmployees = computed(() => {
  if (!employeeSearch.value) return employees.value
  return employees.value.filter(emp => 
    emp.full_name.toLowerCase().includes(employeeSearch.value.toLowerCase())
  )
})

const pendingRequestsOnly = computed(() => {
  return pendingRequests.value.filter(req => req.status === 'pending')
})

const pendingRewardRequests = computed(() => {
  return rewardRequests.value.filter(req => req.status === 'pending')
})

// Методы
const loadEmployees = async () => {
  try {
    const response = await api.getEmployees()
    employees.value = response.data
  } catch (error) {
    console.error('Error loading employees:', error)
  }
}

const loadPendingRequests = async () => {
  try {
    const response = await api.getPendingRequests()
    pendingRequests.value = response.data
  } catch (error) {
    console.error('Error loading requests:', error)
  }
}

const loadAdminActions = async () => {
  try {
    const response = await api.getAdminActions()
    adminActions.value = response.data
  } catch (error) {
    console.error('Error loading admin actions:', error)
  }
}

const loadRewardRequests = async () => {
  try {
    const response = await api.getAllRewardRequests()
    rewardRequests.value = response.data
  } catch (error) {
    console.error('Error loading reward requests:', error)
  }
}

const openAddCoinsDialog = (employee) => {
  selectedEmployee.value = {
    id: employee.id,
    full_name: employee.full_name,
    balance: employee.balance || employee.coins || 0
  }
  coinsToAdd.value = 0
  addReason.value = ''
  addCoinsDialog.value = true
}

const closeAddCoinsDialog = () => {
  addCoinsDialog.value = false
  selectedEmployee.value = {}
}

const openSubtractCoinsDialog = (employee) => {
  selectedEmployee.value = {
    id: employee.id,
    full_name: employee.full_name,
    balance: employee.balance || employee.coins || 0
  }
  coinsToSubtract.value = 0
  subtractReason.value = ''
  subtractCoinsDialog.value = true
}

const closeSubtractCoinsDialog = () => {
  subtractCoinsDialog.value = false
  selectedEmployee.value = {}
}

const addCoins = async () => {
  if (coinsToAdd.value <= 0) return

  try {
    await api.addCoins({
      userId: selectedEmployee.value.id,
      amount: parseInt(coinsToAdd.value),
      reason: addReason.value
    })

    showSnackbar(`Добавлено ${coinsToAdd.value} коинов для ${selectedEmployee.value.full_name}`, 'success')
    closeAddCoinsDialog()
    
    // Обновляем данные
    loadEmployees()
    loadAdminActions()
  } catch (error) {
    showSnackbar(error.response?.data?.message || 'Ошибка добавления коинов', 'error')
  }
}

const subtractCoins = async () => {
  if (coinsToSubtract.value <= 0) return

  try {
    await api.subtractCoins({
      userId: selectedEmployee.value.id,
      amount: parseInt(coinsToSubtract.value),
      reason: subtractReason.value
    })

    showSnackbar(`Списано ${coinsToSubtract.value} коинов у ${selectedEmployee.value.full_name}`, 'warning')
    closeSubtractCoinsDialog()
    
    // Обновляем данные
    loadEmployees()
    loadAdminActions()
  } catch (error) {
    showSnackbar(error.response?.data?.message || 'Ошибка списания коинов', 'error')
  }
}

const viewHistory = async (employee) => {
  selectedEmployee.value = { ...employee }
  
  try {
    const response = await api.getEmployeeHistory(employee.id)
    employeeHistory.value = response.data
    historyDialog.value = true
  } catch (error) {
    showSnackbar('Ошибка загрузки истории', 'error')
  }
}

const approveRequest = async (request) => {
  try {
    await api.approveRequest(request.id)
    showSnackbar(`Заявка от ${request.employee} одобрена!`, 'success')
    
    // Обновляем данные
    loadPendingRequests()
    loadAdminActions()
    loadEmployees()
  } catch (error) {
    showSnackbar(error.response?.data?.message || 'Ошибка одобрения заявки', 'error')
  }
}

const rejectRequest = async (request) => {
  try {
    await api.rejectRequest(request.id)
    showSnackbar(`Заявка от ${request.employee} отклонена`, 'warning')
    
    // Обновляем данные
    loadPendingRequests()
    loadAdminActions()
  } catch (error) {
    showSnackbar(error.response?.data?.message || 'Ошибка отклонения заявки', 'error')
  }
}

const undoAction = async (action) => {
  try {
    await api.undoAction(action.id)
    showSnackbar('Операция отменена', 'info')
    
    // Обновляем данные
    loadAdminActions()
    loadEmployees()
  } catch (error) {
    showSnackbar(error.response?.data?.message || 'Ошибка отмены операции', 'error')
  }
}

const getActionAmountClass = (action) => {
  if (action.type === 'add' || action.type === 'approve') return 'text-success'
  if (action.type === 'subtract') return 'text-error'
  if (action.type === 'undo') return 'text-warning'
  return ''
}

const showSnackbar = (text, color = 'success') => {
  snackbar.value = {
    show: true,
    text,
    color
  }
}

const approveRewardRequest = async (request) => {
  try {
    await api.approveRewardRequest(request.id)
    showSnackbar(`Запрос награды от ${request.user_name} одобрен!`, 'success')
    
    // Обновляем данные
    loadRewardRequests()
    loadAdminActions()
    loadEmployees()
  } catch (error) {
    showSnackbar(error.response?.data?.message || 'Ошибка одобрения запроса награды', 'error')
  }
}

const rejectRewardRequest = async (request) => {
  try {
    await api.rejectRewardRequest(request.id, 'Отклонено администратором')
    showSnackbar(`Запрос награды от ${request.user_name} отклонен`, 'warning')
    
    // Обновляем данные
    loadRewardRequests()
    loadAdminActions()
  } catch (error) {
    showSnackbar(error.response?.data?.message || 'Ошибка отклонения запроса награды', 'error')
  }
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

const confirmCleanDatabase = () => {
  cleanDatabaseDialog.value = true
}

const cleanDatabase = async () => {
  cleaningDatabase.value = true
  try {
    const response = await api.cleanDatabase()
    
    if (response.data.success) {
      const results = response.data.results
      showSnackbar(
        `База очищена! Удалено: ${results.deletedTransactions} транзакций, ${results.deletedRequests} заявок, обнулено ${results.resetBalances} балансов`, 
        'success'
      )
      cleanDatabaseDialog.value = false
      
      // Обновляем все данные
      loadEmployees()
      loadPendingRequests()
      loadAdminActions()
    } else {
      showSnackbar(response.data.message || 'Ошибка очистки базы данных', 'error')
    }
  } catch (error) {
    showSnackbar(error.response?.data?.message || 'Ошибка очистки базы данных', 'error')
  } finally {
    cleaningDatabase.value = false
  }
}


// При загрузке
onMounted(() => {
  loadEmployees()
  loadPendingRequests()
  loadAdminActions()
  loadRewardRequests()
})
</script>

<style scoped>
.page-title {
  color: rgb(1, 44, 109);
  font-size: 28px;
  font-weight: 500;
  margin-bottom: 24px;
}

/* Темная тема */
.v-theme--dark .page-title {
  color: #90CAF9;
}

.text-primary-custom {
  color: rgb(1, 44, 109) !important;
}

/* Темная тема */
.v-theme--dark .text-primary-custom {
  color: #90CAF9 !important;
}

.admin-action {
  border-left: 4px solid #2196F3;
  padding: 12px;
  margin-bottom: 8px;
  background: white;
  border-radius: 0 8px 8px 0;
}

/* Темная тема */
.v-theme--dark .admin-action {
  background: rgb(var(--v-theme-surface));
}

.admin-action.add {
  border-color: #4CAF50;
}

.admin-action.subtract {
  border-color: #FF5722;
}

.admin-action.undo {
  border-color: #FF9800;
}

.admin-action.approve {
  border-color: #4CAF50;
}

.admin-action.reject {
  border-color: #FF5722;
}
</style>