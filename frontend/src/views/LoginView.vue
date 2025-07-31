<template>
  <v-app>
    <v-main>
      <v-container fluid fill-height>
        <v-row align="center" justify="center">
          <v-col cols="12" sm="8" md="4" :class="$vuetify.display.mobile ? 'px-4' : ''">
            <div class="text-right mb-2">
              <v-btn
                icon
                @click="toggleTheme"
                variant="text"
              >
                <v-icon>{{ isDarkMode ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
              </v-btn>
            </div>
            <v-card class="elevation-12">
              <v-toolbar color="primary" dark flat>
                <v-toolbar-title>
                  <v-icon class="mr-2">mdi-currency-usd</v-icon>
                  ЦУПкоины - Вход в систему
                </v-toolbar-title>
              </v-toolbar>
              <v-card-text>
                <v-form ref="form" v-model="valid" @submit.prevent="login">
                  <v-text-field
                    v-model="email"
                    :rules="emailRules"
                    label="Email"
                    prepend-icon="mdi-email"
                    type="email"
                    required
                  ></v-text-field>

                  <v-text-field
                    v-model="password"
                    :rules="passwordRules"
                    label="Пароль"
                    prepend-icon="mdi-lock"
                    :type="showPassword ? 'text' : 'password'"
                    :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                    @click:append="showPassword = !showPassword"
                    required
                  ></v-text-field>

                  <v-alert
                    v-if="error"
                    type="error"
                    class="mt-3"
                    closable
                    @click:close="error = null"
                  >
                    {{ error }}
                  </v-alert>
                </v-form>
              </v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                  color="primary"
                  variant="flat"
                  :disabled="!valid || loading"
                  :loading="loading"
                  @click="login"
                >
                  Войти
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from 'vuetify'

const router = useRouter()
const authStore = useAuthStore()
const theme = useTheme()

const form = ref(null)
const valid = ref(false)
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref(null)
const isDarkMode = ref(false)

const emailRules = [
  v => !!v || 'Email обязателен',
  v => /.+@.+\..+/.test(v) || 'Email должен быть корректным'
]

const passwordRules = [
  v => !!v || 'Пароль обязателен',
  v => v.length >= 6 || 'Пароль должен быть не менее 6 символов'
]

const login = async () => {
  if (!valid.value) return

  loading.value = true
  error.value = null

  const result = await authStore.login({
    email: email.value,
    password: password.value
  })

  if (result.success) {
    router.push('/dashboard')
  } else {
    error.value = result.error
  }

  loading.value = false
}

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
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