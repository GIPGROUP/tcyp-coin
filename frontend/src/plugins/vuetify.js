import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { ru } from 'vuetify/locale'

export default createVuetify({
  components,
  directives,
  locale: {
    locale: 'ru',
    messages: { ru }
  },
  theme: {
    themes: {
      light: {
        colors: {
          primary: '#012C6D',
          secondary: '#424242',
          accent: '#82B1FF',
          error: '#FF5252',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FFC107',
          background: '#F4F5FA'
        }
      }
    }
  }
})