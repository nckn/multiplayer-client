<template lang="pug">
  .gui-wrapper.slider
    form(oninput='output.value = Math.round(range.valueAsNumber / 1000)')
      //- h2
      //-   | Range slider
      .range
        .bg
        input(name='range' type='range' min='0' max='1' step="0.01" @input="changeVal" v-model="sliderVal")
        //- input(name='range' type='range' min='0' max='0.0002' step="0.00001" @change="changeVal" v-model="sliderVal")
        .range-output
          output.output(name='output' for='range')
          //- output.output(name='output' for='range')
          //-   | 50
</template>
 
<script>

export default {
  name: 'Slider',
  props: [''],
  data () {
    return {
      sliderVal: null
    }
  },
  mounted () {
    // var self = this
    // console.log(vertexShader)
    // self.someFunc()
  },
  methods: {
    changeVal() {
      this.$parent.changeVal(this.sliderVal)
      // var self = this
    }
  }
}
</script>

<style lang="scss">

</style>
