import Vue from 'vue'
import App from './App.vue'
import VueRouter from 'vue-router'


// import Home from './pages/Home.vue'
import Home from './pages/PixelPlayer.vue'
import PixelPlayer from './pages/PixelPlayerOrg.vue'
import Dome from './pages/Dome.vue'
// import CDome from './pages/CubicDomeWithReflection.vue'
import KS from './pages/KS.vue'
// import FP from './pages/FaceProjection.vue'
import FI from './pages/FaceInfo.vue'
// import AO from './pages/AO.vue'
import Cannon from './pages/Cannon.vue'
import NiceLight from './pages/NiceLight.vue'
import Neon from './pages/Neon.vue'
import PosAudio from './pages/PosAudio.vue'
import BoxesLayoutDOF from './pages/BoxesLayoutDOF.vue'
import Reflection from './pages/Reflection.vue'
import SoftBodies from './pages/SoftBodies.vue'
// import StaticNoise from './pages/StaticNoise.vue'
import GodRays from './pages/GodRays.vue'
import Editor from './pages/Editor.vue'
import TFCtls from './pages/TransformControls.vue'
import Type from './pages/Type.vue'

import DistortImage from './pages/DistortImage.vue'
// import HoverEffect from './pages/HoverEffect.vue'

// THREE
import gThree from '@/plugins/gThree'

import QuickOptions from '@/components/gui/QuickOptions'
// Vue.use(QuickOptions)

// globalThreefunctions
import globalThreefunctions from '@/plugins/globalThreefunctions'

// Use
Vue.use(gThree)
Vue.use(globalThreefunctions)
// console.log(globalThreefunctions)

Vue.use(VueRouter)

// Importing the global css file
import "@/assets/scss/main.scss"

// import router from './router'

const router = new VueRouter({
  mode: 'history',
  routes: [
    { path: '/', component: Home },
    { path: '/dome', component: Dome },
    { path: '/pixelplayer', component: PixelPlayer },
    // { path: '/cdome', component: CDome },
    { path: '/konradstudio', component: KS },
    { path: '/faceinfo', component: FI },
    // { path: '/faceprojection', component: FP },
    // { path: '/ao', component: AO },
    { path: '/physics', component: Cannon },
    { path: '/nicelight', component: NiceLight },
    { path: '/neon', component: Neon },
    { path: '/posaudio', component: PosAudio },
    { path: '/boxes', component: BoxesLayoutDOF },
    { path: '/reflection', component: Reflection },
    { path: '/softbodies', component: SoftBodies },
    // { path: '/staticnoise', component: StaticNoise },
    { path: '/godrays', component: GodRays },
    { path: '/editor', component: Editor },
    { path: '/tfctls', component: TFCtls },
    { path: '/type', component: Type },
    // Distort Image
    { path: '/distortimage', component: DistortImage },
    // { path: '/hovereffect', component: HoverEffect },
  ] 
})

import Default from './layouts/Default.vue'
Vue.component('default-layout', Default)
Vue.component('QuickOptions', QuickOptions)

Vue.config.productionTip = false

new Vue({
  router,
  // gThree,
  render: h => h(App),
}).$mount('#app')
