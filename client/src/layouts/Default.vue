<template lang="pug">
  .header
    ul
      li
        router-link(to="/") Home
      li
        router-link(to="/pixelplayer") PixelPlayer
      li
        router-link(to="/dome") Dome
      //- li
      //-   router-link(to="/cdome") CDome
      li
        router-link(to="/konradstudio") KS
      li
        router-link(to="/faceinfo") FI
      //- li
      //-   router-link(to="/faceprojection") FP
      //- li
      //-   router-link(to="/ao") AO
      li
        router-link(to="/physics") Physics
      li
        router-link(to="/nicelight") Nicelight
      li
        router-link(to="/neon") Neon
      //- li
      //-   router-link(to="/posaudio") PosAudio
      li
        router-link(to="/boxes") BoxesLayoutDOF
      li
        router-link(to="/reflection") Reflection
      li
        router-link(to="/softbodies") Soft bodies
      //- li
      //-   router-link(to="/staticnoise") Static Noise
      li
        router-link(to="/godrays") God Rays
      li
        router-link(to="/editor") Editor
      li
        router-link(to="/tfctls") TFCtls
      li
        router-link(to="/type") Type
      li
        router-link(to="/distortimage") DistortImage
      li
        router-link(to="/hovereffect") HoverEffect
      //- li
      //-   v-link(href="/") Home
      //-   v-link(href="/about") About
    //- slot
</template>

<script>

// import VLink from '../components/VLink.vue'

export default {
  components: {
    // VLink
  }
}
</script>

<style lang="scss" scoped>

$breakp-xs: 480px;
$breakp-sm: 576px;
$breakp-md: 768px;
$breakp-lg: 992px;
$breakp-xl: 1200px;
$breakp-xxl: 1600px;

.header {
  position: absolute;
  background: none;
  // padding: 0;
  padding: 12px 16px;
  ul {
    display: flex;
    padding-left: 0;
    margin: 0;
    @media screen and (max-width: $breakp-md) {
      flex-direction: column;
    }
    li {
      margin-right: 24px;
      list-style: none;
    }
  }
}

/* .container {
  max-width: 600px;
  margin: 0 auto;
  padding: 15px 30px;
  background: #f9f7f5;
} */

</style>