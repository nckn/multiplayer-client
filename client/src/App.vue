<template lang="pug">
  #app
    component(:is="layout")
    //- router-view(:renderer="renderer")
    router-view
</template>

<script>

const default_layout = 'default'

// import * as THREE from 'three'

export default {
  data () {
    return {
      renderer: null,
      tjekillaa: 7
    }
  },
  computed: {
    layout () {
      return (this.$route.meta.layout || default_layout) + '-layout'
    }
  },
  async mounted () {
    var self = this
    // await self.init()
    var cube = this.makeCube({
      color: 0x020202,
      size: {x: 1, y: 1, z: 1},
      position: {x: 0, y: 0.5, z: 0}
    })
    // console.log('vue thingY: ', typeof cube)
    // var tyf = new this.WebGLRenderer()
    console.log('vue thingY: ', this.$gThree)
    self.$nextTick(() => {
      self.init()
    })
  },
  methods: {
    heeeeeeeeeyBaby() {
      // Test
    },
    init () {
      var self = this
      self.renderer = new this.$gThree.WebGLRenderer( { antialias: true } );
      self.renderer.setPixelRatio( window.devicePixelRatio );
      self.renderer.setSize( window.innerWidth, window.innerHeight );
      self.renderer.shadowMap.enabled = true;
      self.renderer.shadowMapSoft = true
      self.renderer.shadowMap.type = this.$gThree.PCFSoftShadowMap;
      self.renderer.outputEncoding = this.$gThree.sRGBEncoding;
      // From Cannon.uve
      // self.renderer.gammaInput = true;
      console.log('making renderer: ', self.renderer)
    }
  }
}
</script>

<style lang="scss">

</style>
