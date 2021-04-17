<template lang="pug">
  .container.outer.black-bg(ref="master_cont")
    canvas#containerNiceLight(ref="cont_pixel_player")
    .container.inner.overlay
      .pixel-wrapper.dimmed(ref="pixel_wrapper")
        .pixel(
          v-if="thisClient.id != null"
          v-for="(pixel, index) in filteredList"
          :key="index"
          :id="pixel.clientId"
          ref="pixel_items"
        )
          p {{ pixel.clientId }}
      //- canvas(
      //-   ref="game"
      //-   width="300"
      //-   height="300"
      //-   style="border: 1px solid black; visibility: hidden;"
      //- )
      .toggle-wrapper
        input(type="checkbox" id="switch")
        label(for="switch") Toggle
      //- Color picker
      #picker
      //- Debug
      //- .debug-info.hide-it
      .debug-info
        .p-pair.w-seperator
          p.id.col id:
          p.col {{ thisClient.clientId }}
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
</template>
 
<script>

// Example
// https://github.com/mrdoob/three.js/blob/master/examples/webgl_postprocessing_unreal_bloom.html

import * as THREE from 'three'
import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js';
// import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

// Anti aliasing
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js'

// import { map } from '@/assets/js/helpers'

const modelOne = 'models/gltf/PrimaryIonDrive.glb'
const modelTwo = 'models/gltf/morphman-mixamo-rigged-1.0.glb'

const animString = 'idle'

// Socket specific
import { map } from '@/assets/js/helpers'
import iro from '@jaames/iro'
import io from 'socket.io-client'

export default {
  name: 'Neon',
  data () {
    return {
      container: null,
      scene: null,
      camera: null,
      composer: null,
      pointLight: null,
      // stats: null,
      params: {
				exposure: 0.6, // org 1
				bloomThreshold: 0,
				bloomStrength: 3,
				bloomRadius: 0
      },
      // socket specific
      socket: {},
      // context: {},
      // ip: 'http://192.168.87.107:3000', // USE
      // ip: '192.168.1.128:3000', // Hiper Fiber
      ip: 'https://mighty-temple-28923.herokuapp.com', // Heroku production
      colorPicker: null,
      clientDetails: {id: 0},
      thisClient: {
        id: 1,
        uuid: 1
      },
      allClients: [],
      hasStoredClientsOnce: false,
      // pixelation
      sample_size: 100,
      // Threejs
      container: null,
      scene: null,
      camera: null,
      allCubes: [],
      offsetX: 0,
      // anti aliasing
      fxaaPass: null,
      sizes: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    }
  },
  computed: {
    filteredList() {
      return this.allClients
    }
  },
  created () {
    var self = this
    self.socket = io.connect(self.ip)
    self.socket.on('connect', () => {      
      self.clientDetails = self.socket.emit('storeClientInfo', { customId: '000CustomIdHere0000' })
      // console.log('clientDetails: ', self.clientDetails)
    })
  },
  async mounted () {
    var self = this
    self.playIcon = self.$refs.play_icon
    setTimeout(() => {
      // console.log('the renderer: ', self.renderer)
      self.setVars()
      self.init()
      // Orbit controls
      self.setOrbitControls()
      self.setupKeyCode()
      self.render()
    }, 20)

    // Socket related
    // Set color for client
    self.color = '#' + Math.floor(Math.random()*16777215).toString(16)

    // Place this clients cube
    this.socket.on('user_connected', data => {
      // console.log('unique id is: ', data.uuid)
      // alert('joined')
      // Set client ID
      self.thisClient.clientId = data.id
      console.log('this client connected with id: ', self.thisClient.clientId)
      self.addGeometry({clientId: self.thisClient.clientId, domestic: true})
      // self.thisClient.uuid = data.uuid
      // alert('connected it was ' + data)
    })
    
    // When a new one joins or someone leaves
    // this.socket.on('all_clients', data => {
    //   // self.allClients = []
    //   // self.allClients = data

    //   // console.log('clients length: ', self.allClients.length)
      
    //   // for (var i = 0; i < self.allClients.length; i++) {
    //   //   // Add in a cube
    //   //   self.addGeometry(self.allClients[i].clientId)
    //   //   // console.log('all clients: ', self.allClients[i].clientId)
    //   //   // console.log(self.allClients[i])
    //   // }

    //   // self.assignRightSize()
      
    //   // console.log('connected it was with id: ', data)
    // })
    
    // When someone leaves
    // this.socket.on('client_leaving', data => {
    //   console.log('this here person left: ', data)
    // })

    this.socket.on('broadcast', data => {
      // If someone joined
      if (data.joinId) {

        for (var i = 0; i < data.clients.length; i++) {
          
          // 1.0
          // Add in a cube
          if (data.clients[i].clientId != self.thisClient.clientId) {
            self.addGeometry(data.clients[i])
          }
          
          // 1.1
          // Add in a cube
          // if (self.hasStoredClientsOnce) {
          //   if (data.clients[i].clientId != self.thisClient.clientId && data.clients[i].clientId != self.allClients[i].clientId) {
          //     self.addGeometry(data.clients[i])
          //   }
          // } else {
          //   if (data.clients[i].clientId != self.thisClient.clientId) {
          //     self.addGeometry(data.clients[i])
          //   }
          // }

          // if (data.clients[i].clientId != self.allClients[i].clientId) {
          // }
          // console.log('all clients: ', self.allClients[i].clientId)
          // console.log(self.allClients[i])
        }
        
        self.allClients = data.clients
        self.hasStoredClientsOnce = true

        // self.oldClients = self.allClients
        // Make layout
        // self.assignRightSize()

        // Add in a cube
        // self.addGeometry(data.joinId)
      }
      // If someone is leaving
      else if (data.leavingId) {
        // console.log('leaving id: ', data.leavingId)
        self.allClients = data.remainers

        // Remove a cube
        self.removeGeometry(data.leavingId)
      }
      // console.log('clients: ', data)
    })

    // Listen for position
    // this.socket.on('position', data => {
    //   this.position = data
    //   this.context.clearRect(0, 0, this.$refs.game.width, this.$refs.game.height)
    //   this.context.fillRect(this.position.x, this.position.y, 20, 20)
    // })
    
    // console.log('pixels: ', self.$refs.pixel_items)

    // Listen for color change
    self.socket.on('color', data => {
      self.color = data.color
      // console.log('getting in here: ', self.$refs.pixel_items)
      // Iterate pixels
      // console.log('in here.......')
      self.$refs.pixel_items.forEach(() => {
        // Change color of cube
        var attr = {
          id: data.id,
          color: self.color
        }
        self.changeColorOfCube(attr)
      });
    })

    // 
    this.socket.on('join', color => { 
      // console.log('this color: ', self.color)
      this.socket.color = color
    })

    // Get cursor movement
    // document.addEventListener('mousemove', function (e) {
    //   // var mousecoords = self.getMousePos(e)
    //   self.moveAround(e)
    // })

    // // Get tocuh movement
    // window.addEventListener('touchmove', (e) => {
    //   var touch = e.targetTouches[0];
    //   self.moveAround(touch)
    // }, false);

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

  },
  beforeDestroy () {
    var self = this
    // console.log('before destroy')
    window.cancelAnimationFrame( self.reqAnim );
    if (typeof self.gui != 'undefined') {
      self.gui.destroy()
    }
    // Dispose controls
    if (typeof self.controls != 'undefined') {
      console.log('destroying controls')
      self.controls.dispose()
    }
    while(self.scene.children.length > 0){
      // console.log('before destroying: ', self.scene.children[0])
      self.scene.remove(self.scene.children[0]);
    }
  }, 
  methods: {
    setupKeyCode () {
      var self = this
      // console.log(`${self.sound}`)
      document.body.onkeydown = function (e) {
        if (e.keyCode === 32 && e.target === document.body) {
          e.preventDefault()
        }
      }
      // Here we are listening for the Space key, for toggling play when on the sounds page
      document.body.onkeyup = function (e) {
        // if (self.$route.path !== '/sounds') {
        //   return
        // }
        if (e.keyCode === 32) {
          if (self.mixer.timeScale === 0) {
            self.mixer.timeScale = 1
            self.isPlaying = true
          }
          else {
            // Set to zero
            self.mixer.timeScale = 0
            self.isPlaying = false
          }
        }
      }
    },
    togglePlay: function() {    
      var self = this
      if (self.mixer.timeScale === 0) {
        self.mixer.timeScale = 1
        self.isPlaying = true
        // self.playIcon.classList.remove('play');
        // self.playIcon.classList.add('stop');
      }
      else {
        // Set to zero
        self.mixer.timeScale = 0
        self.isPlaying = false
        // self.playIcon.classList.remove('stop');
        // self.playIcon.classList.add('play');
      }
      // var target = e.target || e.scrElement
      // if (self.playIcon.classList.contains('play')) {
      //   self.playIcon.classList.remove('play');
      //   self.playIcon.classList.add('stop');
      //   self.isPlaying = false;
      //   self.currentTime = 0;
      //   self.previousTime = 0;
      // } else {
      //   self.playIcon.classList.remove('stop');
      //   self.playIcon.classList.add('play');
      //   self.isPlaying = true;
      //   self.playSequence();
      // }
    },
    setVars () {
      var self = this
      self.clock = new THREE.Clock()
    },
    init () {
      var self = this

      // Texture Stacy
      self.char_txt = new THREE.TextureLoader().load('/textures/morphman-texture-test.jpg')
      // self.char_txt = new THREE.TextureLoader().load('/textures/stacy.jpg')
      
      self.char_txt.flipY = false

      // self.char_mtl = new THREE.MeshLambertMaterial({ color: 0x2194CE })

      self.char_mtl = new THREE.MeshPhongMaterial({
        map: self.stacy_txt,
        color: 0xffffff,
        skinning: true
        // skinning: false
      })
      
      // Container
      self.container = self.$refs.cont_pixel_player
      
      // Parent adjustments
      self.renderer = new THREE.WebGLRenderer({
        canvas: self.container,
        antialias: true
      })
      self.renderer.setSize(self.sizes.width, self.sizes.height)
      self.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      self.renderer.outputEncoding = THREE.sRGBEncoding
      self.renderer.toneMapping = THREE.ReinhardToneMapping
      
      // Camera
      self.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 )
      self.camera.position.set( - 5, 2.5, - 3.5 )
      self.scene = new THREE.Scene()

      // Lights
      self.scene.add( new THREE.AmbientLight( 0x404040 ) )
      self.pointLight = new THREE.PointLight( 0xffffff, 1 )
      self.camera.add( self.pointLight )
      
      var renderScene = new RenderPass( self.scene, self.camera );

			var bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
			bloomPass.threshold = self.params.bloomThreshold;
			bloomPass.strength = self.params.bloomStrength;
      bloomPass.radius = self.params.bloomRadius;
      
      self.fxaaPass = new ShaderPass( FXAAShader )
      var pixelRatio = self.renderer.getPixelRatio()
      self.fxaaPass.material.uniforms[ 'resolution' ].value.x = 1 / ( self.container.offsetWidth * pixelRatio );
      self.fxaaPass.material.uniforms[ 'resolution' ].value.y = 1 / ( self.container.offsetHeight * pixelRatio );

      // composer1 = new EffectComposer( renderer );
      // composer1.addPass( renderPass );
      // composer1.addPass( fxaaPass );

			self.composer = new EffectComposer( self.renderer );
			self.composer.addPass( renderScene );
      self.composer.addPass( bloomPass );
      self.composer.addPass( self.fxaaPass );

      window.addEventListener( 'resize', self.onWindowResize, false );

    },
    isscrubbing (msg) {
      var self = this
      self.mixer.timeScale = 1
      if (msg === 'down') {
        self.isDown = true
      }
      else if (msg === 'up') {
        self.isDown = false
      }
      console.log('mouse down: ', msg)
    },
    changeVal (e) {
      // self.slider.progress
      var target = e.target || e.srcElement
      console.log('value: ', target.value)
    },
    render () {
      var self = this
      // self.stats.update()
      self.composer.render()
      // console.log(self.mixer)
      // console.log(self.mixer.time)
      // console.log('progress')
      // console.log(self.slider.progress)
      self.reqAnim = requestAnimationFrame( self.render.bind(this) )
    },
    removeGeometry (id) {
      var self = this
      console.log('removing: ', id)
      // self.allCubes.splice( idx, 1 )
      self.allCubes.splice( 0, 1 )

      // Remove object from scene
      const object = self.scene.getObjectByProperty( 'name', id );

      object.geometry.dispose();
      object.material.dispose();
      self.scene.remove( object );
      self.offsetX -= 2
    },
    generateRandomHexCode () {
      var letters = '0123456789ABCDEF';
      var color = '';
      for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    },
    addGeometry (obj) {
      var self = this
      // var l = 2
      var s = 2

      // for (var i = 0; i < self.allCubes.length; i++) {
      //   if (obj.clientId === self.allCubes[i].id) {
      //     return
      //   }
      // }

      // console.log('obj id is: ', obj.clientId)
      var geometry = new THREE.BoxGeometry( s, s, s );
      // var material = new THREE.MeshBasicMaterial( {
      //   color: 0x777777
      // } );
      // var randomColor = Math.floor(Math.random()*16777215).toString(16)

      var randomColor = `0x${self.generateRandomHexCode()}`
      // console.log('random color: ', randomColor)
      // console.log('obj.color: ', obj.color)
      
      var material = new THREE.MeshPhongMaterial({
        // color: 0x000000,
        // color: obj.color ? obj.color: 0xf5f5f5,
        // emissive: obj.color ? obj.color: 0xf5f5f5,
        color: obj.color ? obj.color : randomColor,
        emissive: obj.color ? obj.color : randomColor,
        flatShading: true,
      });
      var cube = new THREE.Mesh( geometry, material );
      // Set name of cube
      cube.name = obj.clientId

      // Position cubes
      // cube.position.x = self.offsetX
      if (obj.domestic) {
        cube.position.x = 0
      } else {
        // Map like positioning
        var rX = ( Math.random() - 0 ) * 10
        var rZ = ( Math.random() - 0 ) * 10
        cube.position.x = map(rX, 0, 10, -15, 20);
        // mesh.position.y = Math.random() * 50;
        cube.position.z = map(rZ, 0, 10, -15, 20);
      }

      self.scene.add( cube );
      self.offsetX += 2

      self.allCubes.push( {id: obj.clientId, geom: cube} )
      // self.setupGodRaysEffect(cube)
      
      // console.log('cube id: ', obj.clientId)
      // alert(obj.clientId)
      console.log('cube name: ', obj.clientId)
    },
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
        id: self.thisClient.clientId,
        color: color.hexString
      }

      this.socket.emit('changeAllColors', pixel)

      // console.log('self.clientInfo.id: ', self.thisClient.id);
      // console.log(color.hexString);
    },
    changeColorOfCube (attr) {
      var self = this
      // console.log(color)
      var colorString = attr.color.replace('#', '')
      // console.log(colorString)
      // Set color
      // self.allCubes[0].material.color.setHex( 0xffffff );
      // self.allCubes[0].material.color.setHex( `0x${colorString}` );
      const object = self.scene.getObjectByProperty( 'name', attr.id );
      object.material.color.setHex( `0x${colorString}` );
      object.material.emissive.setHex( `0x${colorString}` );
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
    setOrbitControls () {
      var self = this
      // console.log(`controls before: ${self.controls}`)
      // if (typeof self.controls != 'undefined') {
      //   console.log('before undefined')
      // }
      self.controls = new OrbitControls( self.camera, self.renderer.domElement );
      // if (typeof self.controls != 'undefined') {
      //   console.log('after undefined')
      // }
      // console.log(`controls after: ${self.controls}`)
      self.controls.enablePan = false
      self.controls.enableDamping = true
      self.controls.zoomSpeed = 0.2
      // self.controls.addEventListener('change', self.requestRenderIfNotRequested)
    },
    onWindowResize() {
      var self = this
      self.width = window.innerWidth;
      self.height = window.innerHeight;

      self.camera.aspect = self.width / self.height;
      self.camera.updateProjectionMatrix();
      self.renderer.setSize(self.width, self.height);

      // Get window width
      self.window = {w: window.innerWidth, h: window.innerHeight}
      console.log('windowW: ', self.window.w)

      // self.render()
      // self.renderer.render(self.scene, self.camera)
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

.container.overlay {
  position: absolute;
  top: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  #picker {
    position: absolute;
    bottom: 80px;
    left: calc(50% - 80px);
    pointer-events: all;
  }
  .toggle-wrapper {
    pointer-events: all;
  }
  $i-size: 200px;
  .debug-info {
    width: $i-size;
    height: $i-size;
    position: absolute;
    padding: 12px;
    background: #d0d0d0;
    top: 4px;
    right: 4px;
  }
}

</style>
