<template>
  <v-app>
    <!-- App Bar для мобильных устройств -->
    <v-app-bar
      :app="false"
      :elevation="2"
      class="d-md-none"
      style="position: fixed; top: 0; width: 100%; z-index: 100;"
    >
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-app-bar-title>ЦУПкоины</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-btn
        icon
        @click="() => { isDarkMode = !isDarkMode; toggleTheme(); }"
      >
        <v-icon>{{ isDarkMode ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
      </v-btn>
    </v-app-bar>

    <!-- Боковое меню -->
    <v-navigation-drawer
      v-model="drawer"
      app
      :permanent="$vuetify.display.mdAndUp"
      :temporary="!$vuetify.display.mdAndUp"
      :color="$vuetify.theme.name === 'dark' ? 'surface' : 'white'"
      width="260"
    >
      <v-list>
        <v-list-item class="px-4 py-4">
          <div class="text-center">
            <v-avatar size="150">
              <img src="/coin_img.png" alt="ЦУПкоин" style="width: 100%; height: 100%; object-fit: contain;">
            </v-avatar>
            <h3 class="mt-2 text-primary">ЦУПкоины</h3>
            <!-- Переключатель темы для десктопа -->
            <div class="d-none d-md-flex align-center justify-center mt-3">
              <v-icon size="small" class="mr-2">mdi-weather-sunny</v-icon>
              <v-switch
                v-model="isDarkMode"
                color="primary"
                hide-details
                density="compact"
                @update:model-value="toggleTheme"
              ></v-switch>
              <v-icon size="small" class="ml-2">mdi-weather-night</v-icon>
            </div>
          </div>
        </v-list-item>
      </v-list>

      <v-divider></v-divider>

      <v-list nav density="comfortable">
        <v-list-item
          v-for="item in menuItems"
          :key="item.title"
          :to="item.route"
          :prepend-icon="item.icon"
          :title="item.title"
          color="primary"
        />
      </v-list>

      <template v-slot:append>
        <v-divider></v-divider>
        <v-list>
          <v-list-item class="px-4 py-3">
            <div class="text-center">
              <p class="text-body-2 mb-2">{{ user?.full_name }}</p>
              <v-btn
                color="primary"
                variant="text"
                size="small"
                @click="logout"
                class="mt-2"
              >
                Выйти
              </v-btn>
            </div>
          </v-list-item>
        </v-list>
      </template>
    </v-navigation-drawer>

    <!-- Основной контент -->
    <v-main :style="{ paddingTop: $vuetify.display.mobile ? '56px' : '0' }">
      <v-container fluid :class="$vuetify.display.mobile ? 'pa-2' : 'pa-6'">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from 'vuetify'

const router = useRouter()
const authStore = useAuthStore()
const theme = useTheme()

const drawer = ref(null)
const user = computed(() => authStore.currentUser)
const isDarkMode = ref(false)

const menuItems = computed(() => {
  const items = [
    {
      title: 'Личный кабинет',
      icon: 'mdi-account',
      route: '/dashboard'
    },
    {
      title: 'Общая страница',
      icon: 'mdi-view-dashboard',
      route: '/general'
    }
  ]

  // Добавляем админ панель если пользователь админ
  if (authStore.isAdmin) {
    items.push({
      title: 'Панель администратора',
      icon: 'mdi-shield-account',
      route: '/admin'
    })
  }

  return items
})

const logout = () => {
  authStore.logout()
  router.push('/login')
}

const toggleTheme = () => {
  theme.global.name.value = isDarkMode.value ? 'dark' : 'light'
  localStorage.setItem('theme', theme.global.name.value)
}

// При загрузке восстанавливаем выбранную тему
onMounted(() => {
  const savedTheme = localStorage.getItem('theme') || 'light'
  theme.global.name.value = savedTheme
  isDarkMode.value = savedTheme === 'dark'
})
</script>

<style scoped>
.v-navigation-drawer {
  box-shadow: 2px 0 8px rgba(0,0,0,0.1) !important;
}
</style>