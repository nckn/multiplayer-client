import Vue from 'vue'
import App from './App.vue'
import VueRouter from 'vue-router'

import Home from './pages/PixelPlayerOrg.vue'
// import Home from './pages/PixelPlayer.vue'

Vue.use(VueRouter)

// Importing the global css file
import "@/assets/scss/main.scss"

const router = new VueRouter({
  mode: 'history',
  routes: [
    { path: '/', component: Home }
  ] 
})

import Default from './layouts/Default.vue'
Vue.component('default-layout', Default)
// Vue.component('QuickOptions', QuickOptions)

Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App),
}).$mount('#app')
