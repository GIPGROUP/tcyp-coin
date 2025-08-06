import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Добавляем токен к каждому запросу
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Обработка ошибок ответа
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Токен истек или недействителен
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default {
  // Auth
  login(credentials) {
    return api.post('/auth/login', credentials)
  },
  getMe() {
    return api.get('/auth/me')
  },

  // Users
  getUserStats() {
    return api.get('/users/me/stats')
  },
  getUserTransactions() {
    return api.get('/users/me/transactions')
  },
  getLeaderboard() {
    return api.get('/users/leaderboard')
  },

  // Requests
  createRequest(data) {
    return api.post('/requests', data)
  },
  getMyRequests() {
    return api.get('/requests/my')
  },
  getActivityTypes() {
    return api.get('/requests/activity-types')
  },

  // Transactions
  getGeneralTransactions() {
    return api.get('/transactions/general')
  },
  getStats() {
    return api.get('/transactions/stats')
  },
  getRewards() {
    return api.get('/transactions/rewards')
  },

  // Admin
  getEmployees() {
    return api.get('/admin/employees')
  },
  getPendingRequests() {
    return api.get('/admin/requests/pending')
  },
  approveRequest(id) {
    return api.post(`/admin/requests/${id}/approve`)
  },
  rejectRequest(id, reason) {
    return api.post(`/admin/requests/${id}/reject`, { reason })
  },
  addCoins(data) {
    return api.post('/admin/coins/add', data)
  },
  subtractCoins(data) {
    return api.post('/admin/coins/subtract', data)
  },
  getAdminActions() {
    return api.get('/admin/actions')
  },
  undoAction(id) {
    return api.post(`/admin/actions/${id}/undo`)
  },
  getEmployeeHistory(id) {
    return api.get(`/admin/employees/${id}/history`)
  },

  // Roulette
  getRouletteInfo() {
    return api.get('/roulette/info')
  },
  spinRoulette() {
    return api.post('/roulette/spin')
  },
  getRouletteWinners() {
    return api.get('/roulette/winners')
  },
  
  // Admin Tools
  cleanDatabase() {
    return api.post('/admin-tools/clean-database')
  },

  // Reward Requests
  createRewardRequest(data) {
    return api.post('/reward-requests', data)
  },
  getMyRewardRequests() {
    return api.get('/reward-requests/my')
  },
  getAllRewardRequests() {
    return api.get('/reward-requests/all')
  },
  approveRewardRequest(id) {
    return api.post(`/reward-requests/${id}/approve`)
  },
  rejectRewardRequest(id, reason) {
    return api.post(`/reward-requests/${id}/reject`, { reason })
  },

  // Удаление транзакции (только для админа)
  deleteTransaction(id) {
    return api.delete(`/transactions/${id}`)
  }
}