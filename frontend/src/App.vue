<template>
  <v-app>
    <router-view />
  </v-app>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { VApp } from 'vuetify/components'

const authStore = useAuthStore()

onMounted(async () => {
  // Если есть токен, загружаем данные пользователя
  if (authStore.isAuthenticated) {
    await authStore.fetchUser()
  }
})
</script>

<style>
html {
  overflow-y: auto !important;
}

/* Светлая тема */
.v-theme--light .v-application {
  background-color: #F4F5FA !important;
}

/* Темная тема */
.v-theme--dark .v-application {
  background-color: #121212 !important;
}

/* Убираем отступы сверху на десктопе */
@media (min-width: 960px) {
  .v-application {
    padding-top: 0 !important;
  }
  
  .v-application .v-application__wrap {
    padding-top: 0 !important;
    min-height: 100vh;
  }
  
  /* Если есть отступ в v-main */
  .v-main {
    padding-top: 0 !important;
  }
  
  /* Если отступ в v-main__wrap */
  .v-main__wrap {
    padding-top: 0 !important;
  }
}
</style>