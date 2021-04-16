<template lang="pug">
  ColorGame
  //- Camera
</template>

<script>

// import ColorGame from './components/ColorGame.vue'
// import Camera from './components/Camera.vue'
import ColorGame from '@/components/ColorGame3D.vue'

export default {
  name: 'App',
  layout: 'Main',
  components: {
    // Camera,
    ColorGame
  }
}
</script>

<style lang="scss">

html, body {
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
}

html {
  position: fixed;
}

body {
  font-family: Arial, Helvetica, sans-serif;
}

#app {
  width: 100%;
  height: 100%;
}

</style>
