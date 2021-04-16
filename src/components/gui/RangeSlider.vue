<template lang="pug">
  .gui-wrapper.slider
    form
      //- h2
      //-   | Range slider
      .range
        //- .bg
        .output-labels
          label.name {{ name }}
          label.value {{ sliderVal }}
        input(:name="name" type='range' min='0' max='1' step="0.01" @input="changeVal" v-model="sliderVal")
        //- input(name='range' type='range' min='0' max='0.0002' step="0.00001" @change="changeVal" v-model="sliderVal")
        .range-output
          output.output(name='output' for=sliderVal)
          //- output.output(name='output' for='range')
          //-   | 50
</template>
 
<script>

export default {
  name: 'Slider',
  props: ['name', 'val'],
  data () {
    return {
      sliderVal: this.val
    }
  },
  mounted () {
    // var self = this
    // console.log(vertexShader)
    // self.someFunc()
  },
  methods: {
    changeVal(e) {
      this.$parent.changeVal(e, this.sliderVal)
      // var self = this
    }
  }
}
</script>

<style lang="scss" scoped>

</style>
