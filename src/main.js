import Vue from 'vue'
import './plugins/bootstrap-vue'
import JsonCSV from 'vue-json-csv'
import App from './App.vue'
import router from './router'
import { store } from './store'

Vue.config.productionTip = false
import BootstrapVue from 'bootstrap-vue'

Vue.component('JsonCsv', JsonCSV)

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')

Vue.use(BootstrapVue);
