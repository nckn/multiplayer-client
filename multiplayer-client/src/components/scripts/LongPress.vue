
<script>

export default {
  name: 'LongPress',
  // props: ['type', 'options'],
  // mixins: [globalFunctions],
  data() {
    return {
      timer: null,
      isTouch: null,
      mouseDown: null,
      mouseUp: null,
      mouseMove: null,
      startX: 0, // mouse x position when timer started
      startY: 0, // mouse y position when timer started
      maxDiffX: 10, 
      maxDiffY: 10,
      delayTime: 1000, 
    };
  },
  mounted() {
    var self = this
    self.isTouch = (('ontouchstart' in window) || (navigator.MaxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0))
    self.mouseDown = self.isTouch ? 'touchstart' : 'mousedown'
    self.mouseUp = self.isTouch ? 'touchend' : 'mouseup'
    self.mouseMove = self.isTouch ? 'touchmove' : 'mousemove'
    //

    console.log('Long Press script aight')

    // Events
    // hook events that clear a pending long press event
    document.addEventListener(self.mouseUp, self.clearLongPressTimer, true);
    document.addEventListener(self.mouseMove, self.mouseMoveHandler, true);
    document.addEventListener('wheel', self.clearLongPressTimer, true);
    document.addEventListener('scroll', self.clearLongPressTimer, true);

    // hook events that can trigger a long press event
    document.addEventListener(self.mouseDown, self.mouseDownHandler, true) // <- start

    if (typeof window.CustomEvent !== 'function') {
      window.CustomEvent = function(event, params) {
        params = params || { bubbles: false, cancelable: false, detail: undefined }
        var evt = document.createEvent('CustomEvent')
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail)
        return evt
      }
      window.CustomEvent.prototype = window.Event.prototype;
    }
  },
  methods: {
    requestTimeout(fn, delay) {
      if (!window.requestAnimationFrame && !window.webkitRequestAnimationFrame &&
        !(window.mozRequestAnimationFrame && window.mozCancelRequestAnimationFrame) && // Firefox 5 ships without cancel support
        !window.oRequestAnimationFrame && !window.msRequestAnimationFrame) return window.setTimeout(fn, delay);

      var start = new Date().getTime()
      var handle = {}

      var loop = function() {
        var current = new Date().getTime()
        var delta = current - start
        if (delta >= delay) {
          fn.call()
        }
        else {
          handle.value = requestAnimFrame(loop)
        }
      }
      handle.value = requestAnimFrame(loop)
      return handle
    },
    clearRequestTimeout(handle) {
      var self = this
      if (handle) {
        window.cancelAnimationFrame ? window.cancelAnimationFrame(handle.value) :
        window.webkitCancelAnimationFrame ? window.webkitCancelAnimationFrame(handle.value) :
        window.webkitCancelRequestAnimationFrame ? window.webkitCancelRequestAnimationFrame(handle.value) : /* Support for legacy API */
        window.mozCancelRequestAnimationFrame ? window.mozCancelRequestAnimationFrame(handle.value) :
        window.oCancelRequestAnimationFrame	? window.oCancelRequestAnimationFrame(handle.value) :
        window.msCancelRequestAnimationFrame ? window.msCancelRequestAnimationFrame(handle.value) :
        self.clearTimeout(handle)
      }
    },
    fireLongPressEvent(originalEvent) {
      var self = this
      self.clearLongPressTimer()

      var clientX = isTouch ? originalEvent.touches[0].clientX : originalEvent.clientX
      var clientY = isTouch ? originalEvent.touches[0].clientY : originalEvent.clientY

      // fire the long-press event
      var suppressClickEvent = this.dispatchEvent(new CustomEvent('long-press', { bubbles: true, cancelable: true, detail: { clientX: clientX, clientY: clientY } }));

      if (suppressClickEvent) {
        // Long press happened
        var menuElem = document.getElementsByClassName('blooming-menu__container')[0]
        if (menuElem) {
          // console.log(menuElem)
          console.log('longpress happened')
          // menuElem.style.visibility = 'visible'
          menuElem.classList.add('visible')
          menuElem.style.left = clientX + 'px'
          menuElem.style.top = clientY + 'px'

          // console.log('this is element')
          // console.log(this)

          // Event bus
          // EventBus.$emit('show-menu', menuElem)
        }
        // temporarily intercept and clear the next click
        document.addEventListener(self.mouseUp, function clearMouseUp(e) {
          document.removeEventListener(self.mouseUp, clearMouseUp, true)
          self.cancelEvent(e)
        }, true)
      }
    },
    startLongPressTimer(e) {
      var self = this
      self.clearLongPressTimer(e);
      var el = e.target
      // get delay from html attribute if it exists, otherwise default to 1500
      var longPressDelayInMs = parseInt(el.getAttribute('data-long-press-delay') || self.delayTime, 10)
      // start the timer
      self.timer = self.requestTimeout(self.fireLongPressEvent.bind(el, e), longPressDelayInMs)
    },
    clearLongPressTimer(e) {
      var self = this
      self.clearRequestTimeout(self.timer)
      self.timer = null
    },
    cancelEvent(e) {
      e.stopImmediatePropagation()
      e.preventDefault()
      e.stopPropagation()
    },
    mouseDownHandler(e) {
      self.startX = e.clientX
      self.startY = e.clientY
      self.startLongPressTimer(e)
    },
    mouseMoveHandler(e) {
      var self = this
      // calculate total number of pixels the pointer has moved
      var diffX = Math.abs(self.startX - e.clientX)
      var diffY = Math.abs(self.startY - e.clientY)
      // if pointer has moved more than allowed, cancel the long-press timer and therefore the event
      if (diffX >= self.maxDiffX || diffY >= self.maxDiffY) {
        self.clearLongPressTimer(e)
      }
    }
  }
}
</script>
