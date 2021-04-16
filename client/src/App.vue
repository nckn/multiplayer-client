<template lang="pug">
  #app
    component(:is="layout")
    //- router-view(:renderer="renderer")
    router-view
</template>

<script>

const default_layout = 'default'

import * as THREE from 'three'

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
}
</script>

<style lang="scss">

</style>
