<template>
  <v-app>
    <!-- Боковое меню -->
    <v-navigation-drawer
      v-model="drawer"
      app
      permanent
      color="white"
      width="260"
    >
      <v-list>
        <v-list-item class="px-4 py-4">
          <div class="text-center">
            <v-avatar size="150">
              <img src="/coin_img.png" alt="ЦУПкоин" style="width: 100%; height: 100%; object-fit: contain;">
            </v-avatar>
            <h3 class="mt-2 text-primary">ЦУПкоины</h3>
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
    <v-main>
      <v-container fluid class="pa-6">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const drawer = ref(true)
const user = computed(() => authStore.currentUser)

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
</script>

<style scoped>
.v-navigation-drawer {
  box-shadow: 2px 0 8px rgba(0,0,0,0.1) !important;
}
</style>