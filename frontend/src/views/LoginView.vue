<template>
  <v-app>
    <v-main>
      <v-container fluid fill-height>
        <v-row align="center" justify="center">
          <v-col cols="12" sm="8" md="4">
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

            <!-- Информация о тестовых аккаунтах -->
            <v-card class="mt-4" variant="outlined">
              <v-card-text>
                <p class="text-caption mb-2">Тестовые учетные записи:</p>
                <p class="text-body-2 mb-1">
                  <strong>Администратор:</strong> admin@tcyp.ru / password123
                </p>
                <p class="text-body-2">
                  <strong>Сотрудник:</strong> alexandrov@tcyp.ru / password123
                </p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = ref(null)
const valid = ref(false)
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref(null)

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
</script>