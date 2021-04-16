import Vue from 'vue'
import * as gThree from 'three'

// https://www.digitalocean.com/community/tutorials/vuejs-creating-custom-plugins

export default {
  gThree,
  install (Vue, options) {
    Vue.prototype.$gThree = gThree
  }
}
