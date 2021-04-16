<template lang="pug">
  div.debug-container(v-bind:class="class_name")#dragContainer
    h4 Debug panel
    div.debug-row(v-for="(data, index) in debug_data" :key="`${data.name}-${index}`")
      label.name {{ data.name }}
      label.value {{ data.val }}
    //- div.debug-row
    //-   label Passed 1st trigger
    //-   p#trigger1 {{ hasHitTriggerStart }}
    //- div.debug-row
    //-   label Fraction
    //-   p#fraction -
    //- div.debug-row
    //-   label Anim start
    //-   p#start
    //- div.debug-row
    //-   label Anim end
    //-   p#end
    //- div.debug-row
    //-   label Anim div height
    //-   p#animHeight
    //- div.debug-row
    //-   label Window height
    //-   p#windowHeight
    //- div.debug-row
    //-   label Body height
    //-   p#bodyHeight
    //- div.debug-row
    //- a-row
    //-   a-col(:span="16")
    //-     a-slider(:min="0" :max="1" v-model="inputValue" :step="0.01")
    //-   a-col(:span="4")
    //-     a-input-number(
    //-       :min="0"
    //-       :max="1"
    //-       :step="0.01"
    //-       v-model="inputValue"
    //-     )
</template>

<script>

export default {
  props: ['class_name', 'debug_data'],
  data () {
    return {
      scrollP: '-',
      fraction: 0,
      hasHitTriggerStart: false,
      hasHitTriggerEnd: false,
      triggerStartPos: null,
      inputValue: 0
    }
  },
  mounted: function () {
    var self = this
    // self.$nextTick(self.trackScrolling())
    self.$nextTick(self.dragElement(document.getElementById('dragContainer')))
    self.scrollText = document.getElementById('scrollP')
    self.scrollFraction = document.getElementById('fraction')
    self.startLabel = document.getElementById('start')
    self.endLabel = document.getElementById('end')
    self.animHeight = document.getElementById('animHeight')
    self.windowHeight = document.getElementById('windowHeight')
    self.bodyHeight = document.getElementById('bodyHeight')
    // Check if debug state
    if(window.location.hash) {
      // Fragment exists
      console.log('there is hash', self)
      self.$el.classList.add('debugging')
    } else {
      console.log('there is no hash', self)
      // Fragment doesn't exist
    }
  },
  watch: {
    fraction () {
      var self = this
      // console.log(`this is triggerStartPos: ${self.triggerStartPos} and fraction : ${self.fraction}`)
      if (self.scrollP > self.triggerStartPos) {
        self.hasHitTriggerStart = true
      }
    },
    inputValue (val) {
      // console.log(typeof val)
      this.$parent.playTimeline(val)
    }
  },
  methods: {
    determineLength: function (start, end, aH, wH, bH) {
      var self = this
      self.triggerStartPos = start
      self.triggerEndPos = end
      self.animHeight.innerHTML = aH
      self.windowHeight.innerHTML = wH
      self.bodyHeight.innerHTML = bH
      self.startLabel.innerHTML = self.triggerStartPos
      self.endLabel.innerHTML = self.triggerEndPos
    },
    deliverInformation: function (percentage) {
      var self = this
      self.fraction = percentage
      self.inputValue = percentage
      // self.startLabel.innerHTML = start !== '' ? self.startLabel.innerHTML : start
    },
    trackScrolling: function () {
      var self = this
      window.addEventListener('scroll', function () {
        self.scrollP = window.pageYOffset || (document.documentElement || document.body.parentNode || document.body).scrollTop
        self.scrollText.innerHTML = self.scrollP + ' px'
        self.scrollFraction.innerHTML = self.fraction.toFixed(2) + ''
        // console.log('scroll position: ' + self.scrollP)
      }, false)
    },
    dragElement: function (elmnt) {
      var pos1 = 0
      var pos2 = 0
      var pos3 = 0
      var pos4 = 0
      // alert('hey')
      if (document.getElementById(elmnt.id + 'header')) {
        // if present, the header is where you move the DIV from:
        document.getElementById(elmnt.id + 'header').onmousedown = dragMouseDown
      } else {
        // otherwise, move the DIV from anywhere inside the DIV
        elmnt.onmousedown = dragMouseDown
      }
      function dragMouseDown (e) {
        e = e || window.event
        e.preventDefault()
        pos3 = e.clientX
        pos4 = e.clientY
        document.onmouseup = closeDragElement
        document.onmousemove = elementDrag
      }
      function elementDrag (e) {
        e = e || window.event
        e.preventDefault()
        pos1 = pos3 - e.clientX
        pos2 = pos4 - e.clientY
        pos3 = e.clientX
        pos4 = e.clientY
        elmnt.style.top = (elmnt.offsetTop - pos2) + 'px'
        elmnt.style.left = (elmnt.offsetLeft - pos1) + 'px'
      }
      function closeDragElement () {
        // stop moving when mouse button is released
        document.onmouseup = null
        document.onmousemove = null
      }
    }
  },
  computed: {
    getCurrentScroll () {
      var self = this
      return self.scrollP
    }
  }
}
</script>


<style lang="scss">
// Ant related
.ant-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  .ant-input-number {
    width: 50px;
    height: 26px;
    .ant-input-number-input {
      padding: 0 4px;
    }
  }
}
</style>


<style lang="scss" scoped>

.debug-container { background: rgba(40, 40, 40, 0.9); }

.debug-container {
  visibility: hidden;
  &.debugging {
    visibility: visible;
  } 
}

.debug-container {
  // @media screen and (max-width: 768px) {
  //   display: none;
  // }
  // width: 256px;
  width: 128px;
  height: auto;
  // height: 400px;
  position: fixed;
  top: 8px;
  right: 8px;
  z-index: 200;
  padding: 12px;
  transition: opacity 0.2s ease-in-out;
  @media screen and (max-width: 768px) {
    // top: auto;
    // bottom: 4px;
  }
  &.dim {
    opacity: 0.2;
    &:hover {
      opacity: 1;
    }
  }
  h4 {
    margin-top: 0;
    margin-bottom: 6px;
  }
  .debug-row {
    width: 100%;
    height: 14px;
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    p, label {
      // font-family: $font-family-proxima-nova-reg;
      // font-size: $font-size-paragraph-small;
      font-size: 10px;
    }
    label {
      color: #808080;
      &.value {
        color: #fff;
      }
    }
  }
}

</style>
