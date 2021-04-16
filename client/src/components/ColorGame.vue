<template lang="pug">
  .container.outer
    .container.inner
      .pixel-wrapper.dimmed(ref="pixel_wrapper")
        .pixel(
          v-if="thisClient.id != null"
          v-for="(pixel, index) in filteredList"
          :key="index"
          :id="pixel.clientId"
          ref="items"
        )
          p {{ pixel.clientId }}
      canvas(
        ref="game"
        width="300"
        height="300"
        style="border: 1px solid black; visibility: hidden;"
      )
      //- Color picker
      #picker
      //- Debug
      .debug-info
        .p-pair.w-seperator
          p.id.col id:
          p.col {{ thisClient.id }}
        //- .p-pair
        //-   p.id.col unique id:
        //-   p.col {{ thisClient.uuid }}
        .p-pair.w-seperator
          p.col ids:
          .p-sub.col
            p(v-for="(user, index) in allClients") {{ user.clientId }} </br>
        .p-pair
          p.col users: 
          p.col {{ allClients.length }}
      //- div hey
      //-   button(v-on:click="move('right')") Right
      //-   button(v-on:click="move('left')") Left
      //-   button(v-on:click="move('up')") Up
      //-   button(v-on:click="move('down')") Down
      img(id="image1" src="../image1.jpg")
</template>
 
<script>

import iro from '@jaames/iro'

import io from 'socket.io-client'

export default {
  name: 'ColorGame',
  data () {
    return {
      socket: {},
      context: {},
      position: {
        x: 0,
        y: 0
      },
      // users: {
      //   amount: 0,
      // },
      users: 0,
      colorPicker: null,
      // clientInfo: {
      //   clientId: null
      // },
      clientDetails: {id: 0},
      thisClient: {
        id: 1,
        uuid: 1
      },
      allClients: [],
      // pixelation
      sample_size: 100
    }
  },
  // watch: {
  //   position () {
  //     this.context.fillRect(this.position.x, this.position.y, 20, 20)
  //   }
  // },
  created () {
    var self = this
    // this.socket = io('http://localhost:3000')
    // this.socket = io('http://192.168.87.107:3000')

    // this.socket = io('http://192.168.2.100:3000')
    // self.socket = io.connect('http://192.168.2.100:3000');
    // self.socket = io.connect('http://192.168.43.216:3000'); // Mobile
    self.socket = io.connect('http://192.168.87.107:3000'); // Use

    self.socket.on('connect', () => {
      // console.log(data)
      // console.log('here comes..... .....')
      self.clientDetails = self.socket.emit('storeClientInfo', { customId: '000CustomIdHere0000' });
      // console.log('clientDetails: ', self.clientDetails)
    });

    // const sessionID = socketConnection.socket.sessionid

  },
  computed: {
    filteredList() {
      return this.allClients
    }
  },
  async mounted () {
    var self = this
    
    // Setup pixelation
    self.pixelation()

    this.context = this.$refs.game.getContext('2d')

    // Set color for client
    self.color = '#' + Math.floor(Math.random()*16777215).toString(16)

    this.socket.on('user_connected', data => {
      console.log('connected it was with id: ', data.id)
      console.log('unique id is: ', data.uuid)
      // Set client ID
      self.thisClient.id = data.id
      self.thisClient.uuid = data.uuid
      // alert('connected it was ' + data)
    })
    
    // When a new one joins or someone leaves
    this.socket.on('all_clients', data => {
      self.allClients = []
      self.allClients = data
      self.assignRightSize()
      // console.log('connected it was with id: ', data)
    })
    
    // When someone leaves
    // this.socket.on('client_leaving', data => {
    //   console.log('this here person left: ', data)
    // })

    this.socket.on('broadcast', data => {
      // If someone joined
      if (data.joinId) {
        self.allClients = data.joiners
        // Make layout
        self.assignRightSize()
      }
      // If someone is leaving
      else if (data.leavingId) {
        console.log('this here person left: ', data.leavingId)
        self.allClients = data.remainers
      }
      console.log('clients: ', data)
    })

    // Listen for position
    this.socket.on('position', data => {
      this.position = data
      this.context.clearRect(0, 0, this.$refs.game.width, this.$refs.game.height)
      this.context.fillRect(this.position.x, this.position.y, 20, 20)
    })
    
    // Listen for color change
    self.socket.on('color', data => {
      self.color = data.color
      // Iterate pixels
      // console.log('in here.......')
      self.$refs.items.forEach((element) => {
        // console.log(element)
        // console.log(element.getAttribute('id'))
        // element.style.backgroundColor = color.hexString
        // if (data.id === self.clientInfo.clientId) {
        // if (index === 1) {
        if (element.id === data.id) {
          // console.log('client id: ', self.thisClient.id)
          // console.log('data id: ', data.id)
          element.style.backgroundColor = self.color
        }
      });
    })

    // self.socket.on('storeInfo', data => {
    //   // console.log('here comes..........')
    //   self.clientInfo = data
    //   // console.log('data: ', data)
    // })
    
    // Listen for client Count
    // this.socket.on('getCount', data => {
    //   // this.users = data
    //   this.users = data
    // })

    // 
    this.socket.on('join', color => { 
      // console.log('this color: ', self.color)
      this.socket.color = color
    })

    // Get cursor movement
    document.addEventListener('mousemove', function (e) {
      // var mousecoords = self.getMousePos(e)
      self.moveAround(e)
    })

    // Get tocuh movement
    window.addEventListener('touchmove', (e) => {
      var touch = e.targetTouches[0];
      self.moveAround(touch)
    }, false);

    // Make color picker
    self.colorPicker = new iro.ColorPicker('#picker', {
      // Set the size of the color picker
      width: 160,
      // Set the initial color to pure red
      color: '#f00',
      layout: [
        { 
          component: iro.ui.Wheel,
          options: {}
        },
        { 
          component: iro.ui.Slider,
        },
      ]
    })

    // start listening to the color change event
    // colorChangeCallback will be called whenever the color changes
    self.colorPicker.on('color:change', self.colorChangeCallback)

    self.$nextTick( () => {
      self.trackWindowResize(),
      self.assignRightSize()
      // self.$refs.items.forEach((elmt) => {
      //   elmt.classList.add('revealed')
      // })
    })
  },
  methods: {
    colorChangeCallback(color) {
      var self = this
      // Set color of pixel

      // Iterate pixels
      // this.$refs.items.forEach(element => {
      //   // console.log(element)
      //   // console.log(element.getAttribute('id'))
      //   // element.style.backgroundColor = color.hexString
      // });

      var pixel = {
        id: self.thisClient.id,
        color: color.hexString
      }

      this.socket.emit('changeAllColors', pixel)

      // console.log('self.clientInfo.id: ', self.thisClient.id);
      // console.log(color.hexString);
    },
    pixelation () {
      var self = this
      let c = document.createElement("canvas");
      var ctx = c.getContext('2d');
      let img1 = new Image();

      img1.onload = function () {
        document.getElementById("image1").remove();

        var w = img1.width;
        var h = img1.height;

        c.width = w;
        c.height = h;
        ctx.drawImage(img1, 0, 0);

        var pixelArr = ctx.getImageData(0, 0, w, h).data;

        for (let y = 0; y < h; y += self.sample_size) {
          for (let x = 0; x < w; x += self.sample_size) {
            let p = (x + (y*w)) * 4;
            ctx.fillStyle = "rgba(" + pixelArr[p] + "," + pixelArr[p + 1] + "," + pixelArr[p + 2] + "," + pixelArr[p + 3] + ")";
            ctx.fillRect(x, y, self.sample_size, self.sample_size);
          }
        }

        let img = new Image();
        img.src = c.toDataURL("image/jpeg");
        img.width = 200;
        img.style.position = 'absolute'
        img.classList.add('pixelated-image')
        // document.body.appendChild(img);
        self.$refs.pixel_wrapper.appendChild(img);
      };

      img1.src = document.getElementById("image1").src;

      console.log('calculating image')
      // window.requestAnimationFrame(self.pixelation())
    },
    move(direction) {
      this.socket.emit('move', direction)
    },
    moveAround(pos) {
      var self = this
      // console.log('x: ', pos.clientX)
      // console.log('y: ', pos.clientY)
      var newPos = {x: pos.clientX, y: pos.clientY}
      // console.log('pos: ', pos)
      self.socket.emit('move', newPos)
      // this.mouse3D.x = (clientX / this.width) * 2 - 1;
      // this.mouse3D.y = -(clientY / this.height) * 2 + 1;
    },
    getMousePos (e) {
      return { x: e.clientX, y: e.clientY }
    },
    async assignRightSize () {
      setTimeout(() => {
        var self = this
        self.$refs.pixel_wrapper.classList.add('revealed')
        // Make sure pixel tiles are always square
        // TODO: Make sure they are from beginning
        // var idol = document.getElementsByClassName('pixel')
        var idol = self.$refs.items
        // await self.$refs.items.forEach((element) => {
        //   console.log(element)
        // });
        // if (!self.isSmScreen) {}
        console.log('assigning right size ', idol)
        // console.log('in alright ', idol)
        // console.log('in here as well')
        var idolStyle = window.getComputedStyle(idol[0], null)
        var idolWidth = (parseInt(idolStyle.width, 10))
        for (var i = 0; i < idol.length; i++) {
          // console.log('here they are:' + idol[i])
          idol[i].style.height = '' + idolWidth + 'px'
          // idol[i].classList.add('revealed')
        }
        // if (idol.length > 0) {
        // }
      }, 200)
    },
    trackWindowResize () {
      if (typeof window !== undefined) {
        // this.window.addEventListener('resize', this.assignRightSize)
        window.addEventListener('resize', this.assignRightSize)
      }
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>

$breakp-xs: 480px;
$breakp-sm: 576px;
$breakp-md: 768px;
$breakp-lg: 992px;
$breakp-xl: 1200px;
$breakp-xxl: 1600px;

// .container.outer { background: red; }
// .container.inner { background: blue; }

.container {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  &.outer {
    padding: 24px;
  }
  &.inner {
    height: calc(100% - 100px);
    .pixel-wrapper {
      width: 100%;
      // height: 100%;
      display: flex; 
      flex-flow: row wrap;
      justify-content: flex-start;
      height: auto;
      .pixel {
        padding: 12px;
        height: 0;
        box-sizing: border-box;
        // transition: all 0.25s ease-in;
        transition: opacity 0.25s ease-in, height 0.25s ease-in;
        // transition: background 0.05s ease-in;
        flex-basis: 50%;
        margin-bottom: 0;
        // @media(min-width: $breakp-md) {
        // }
        @media(min-width: $breakp-lg) {
          flex-basis: 33.33%;
        }
        @media(min-width: $breakp-xl) {
          flex-basis: 25%;
        }
        p {
          font-size: 8px;
          width: 100%;
        }
      }
    }
    #picker {
      position: absolute;
      bottom: 80px;
      left: calc(50% - 80px);
    }
  }
}

@function random-decimal() {
  @return random(100)/100;
}
@mixin random-rgba($attr, $color: 255, $alpha: random-decimal()){
  #{$attr}: rgba(random($color),random($color),random($color),$alpha);
}
 
// div {
//   display: inline-block;
// }

@for $i from 1 through 30 {
  .pixel {
    // width: 100px;
    // transition: opacity 0.25s ease-in, height 0.25s ease-in;    
    &:nth-child(#{$i}) {
      height: 100%;
      // height: random(200) + px;
      // background: red;
      @include random-rgba(background-color);
    }
  }
}

.pixel-wrapper.dimmed {
  opacity: 0;
  transition: opacity 0.25s ease-in;
  &.revealed {
    opacity: 1;
  }
}

.pixelated-image {
  width: 200px;
  // height: 200px;
  position: absolute;
  bottom: 12px;
  left: 12px;
}

</style>
