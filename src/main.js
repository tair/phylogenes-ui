import Vue from 'vue'
import './plugins/bootstrap-vue'
import JsonCSV from 'vue-json-csv'
import axios from 'axios/index'
import App from './App.vue'
import router from './router'
import { store } from './store'
import popover from './components/modal/CustomPopover'

Vue.config.productionTip = false
import BootstrapVue from 'bootstrap-vue'
Vue.component('popover', popover)

Vue.component('JsonCsv', JsonCSV)

// Axios Interceptor to handle 400 responses with redirectUri
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const { data } = error.response
      if (data && data.redirectUri) {
        // Redirect the user to the redirectUri with information of the current page
        window.location.href = data.redirectUri + "&redirect=" + window.location.href
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  }
)

// Axios interceptor to pass the credential cookie to the request
axios.interceptors.request.use(
  config => {
    config.withCredentials = true
    return config
  }
)

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app')

Vue.use(BootstrapVue)
