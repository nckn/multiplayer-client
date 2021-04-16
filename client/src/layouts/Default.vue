<template lang="pug">
  //- .header
  //-   ul
  //-     li
  //-       router-link(to="/pixelplayer") PixelPlayer
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