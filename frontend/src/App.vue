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
</style>