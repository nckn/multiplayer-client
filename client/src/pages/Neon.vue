<template lang="pug">
  .container.outer.black-bg(ref="master_cont")
    #containerNiceLight(ref="cont")
    //- img.img(src="@/assets/images/basilica/posx.jpg" width="400" height="400")
    .footer
      .play-button(@click="togglePlay" ref="play_button")
        .play-icon(ref="play_icon" v-bind:class="{ stop: !isPlaying }")
      .range
        .bg
        input(name='range' type='range' min='0' :max="slider.duration" step="0.01"
          @mousedown="isscrubbing('down')"
          @touchstart="isscrubbing('down')"
          @mouseup="isscrubbing('up')"
          @touchend="isscrubbing('up')"
          @input="changeVal"
          ref="slider"
          v-model="slider.progress"
        )
        //- input(name='range' type='range' min='0' max='0.0002' step="0.00001" @input="changeVal" v-model="slider.progress")
        .range-output
          output.output(name='output' for='range')
          //- output.output(name='output' for='range')
          //-   | 50
</template>
 
<script>

// Example
// https://github.com/mrdoob/three.js/blob/master/examples/webgl_postprocessing_unreal_bloom.html

// import * as THREE from 'three'
import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js';
// import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

// import { map } from '@/assets/js/helpers'

const modelOne = 'models/gltf/PrimaryIonDrive.glb'
const modelTwo = 'models/gltf/morphman-mixamo-rigged-1.0.glb'

const animString = 'idle'

export default {
  name: 'Neon',
  data () {
    return {
      container: null,
      scene: null,
      camera: null,
      composer: null,
      pointLight: null,
      mixer: null,
      // stats: null,
      params: {
				exposure: 1,
				bloomStrength: 1.5,
				bloomThreshold: 0,
				bloomRadius: 0
      },
      clock: null,
      // char
      idle: null,
      slider: {
        progress: 0,
        duration: 0
      },
      isPlaying: false
    }
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
      // self.render()
    }, 200)
  },
  beforeDestroy () {
    var self = this
    // console.log('before destroy')
    window.cancelAnimationFrame( self.reqAnim );
    // Dispose controls
    self.gui.destroy()
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
      self.clock = new self.$gThree.Clock()
    },
    init () {
      var self = this

      // Texture Stacy
      self.char_txt = new self.$gThree.TextureLoader().load('/textures/morphman-texture-test.jpg')
      // self.char_txt = new self.$gThree.TextureLoader().load('/textures/stacy.jpg')
      
      self.char_txt.flipY = false

      // self.char_mtl = new self.$gThree.MeshLambertMaterial({ color: 0x2194CE })

      self.char_mtl = new self.$gThree.MeshPhongMaterial({
        map: self.stacy_txt,
        color: 0xffffff,
        skinning: true
        // skinning: false
      })
      
      // Container
      self.container = self.$refs.cont
      self.container.appendChild( self.$parent.renderer.domElement )

      // Stats
      // self.stats = new Stats()
      // self.container.appendChild( self.stats.dom )
      // console.log(Stats)
      
      // Parent adjustments
      self.$parent.renderer.toneMapping = self.$gThree.ReinhardToneMapping 
      
      // Camera
      self.camera = new self.$gThree.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 )
      self.camera.position.set( - 5, 2.5, - 3.5 )
      self.scene = new self.$gThree.Scene()
      
      // OrbitControls
      self.controls = new OrbitControls( self.camera, self.$parent.renderer.domElement )
      self.controls.maxPolarAngle = Math.PI * 0.5
			self.controls.minDistance = 1
			self.controls.maxDistance = 10

      // Lights
      self.scene.add( new self.$gThree.AmbientLight( 0x404040 ) )
      self.pointLight = new self.$gThree.PointLight( 0xffffff, 1 )
      self.camera.add( self.pointLight )
      
      var renderScene = new RenderPass( self.scene, self.camera );

			var bloomPass = new UnrealBloomPass( new self.$gThree.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
			bloomPass.threshold = self.params.bloomThreshold;
			bloomPass.strength = self.params.bloomStrength;
			bloomPass.radius = self.params.bloomRadius;

			self.composer = new EffectComposer( self.$parent.renderer );
			self.composer.addPass( renderScene );
      self.composer.addPass( bloomPass );
      
      const loader = new GLTFLoader()

			loader.load( 
        modelOne,
        function (gltf) {
          var model = gltf.scene
          self.scene.add( model )
          self.mixer = new self.$gThree.AnimationMixer( model )
          
          console.log('mixer')
          console.log(self.mixer)
          
          // Getting animation info
          var clip = gltf.animations[ 0 ]
          console.log('clip')
          console.log(clip.duration)
          self.slider.duration = clip.duration
          
          self.mixer.clipAction( clip.optimize() )
            .play()

          // Set playing to true
          self.isPlaying = true
          
          self.render()
        },
        undefined, // We don't need this function
        function (error) {
          console.error(error)
        }
      )
      
      loader.load(
        modelTwo, 
        function (gltf) {
          // self.model = gltf.scene.children[0]
          self.model = gltf.scene
          let fileAnimations = gltf.animations

          self.model.traverse(o => {
            // console.log(o)
            if (o.isMesh) {
              o.castShadow = true
              o.receiveShadow = true
              o.material = self.char_mtl
            }
            // Reference the neck and waist bones
            if (o.isBone && o.name === 'mixamorigNeck') {
              self.neck = o
            }
            if (o.isBone && o.name === 'mixamorigSpine') {
              self.waist = o
            }
          })

          // let fileAnimations = gltf.animations
          console.log('model is: ', self.model.children[0].children)
          self.scene.add(self.model)

          self.mixer = new self.$gThree.AnimationMixer(self.model)

          let clips = fileAnimations.filter(val => val.name !== animString)
          self.possibleAnims = clips.map(val => {
            let clip = self.$gThree.AnimationClip.findByName(clips, val.name)

            clip.tracks.splice(3, 3)
            clip.tracks.splice(9, 3)

            clip = self.mixer.clipAction(clip)
            return clip
          })

          let idleAnim = self.$gThree.AnimationClip.findByName(fileAnimations, animString)

          idleAnim.tracks.splice(3, 3)
          idleAnim.tracks.splice(9, 3)

          self.idle = self.mixer.clipAction(idleAnim)
          self.idle.play()
        },
        undefined, // We don't need this function
        function (error) {
          console.error(error)
        }
      )

      // GUI
			self. gui = new GUI()
			self.gui.add( self.params, 'exposure', 0.1, 2 ).onChange( function ( value ) {
				self.$parent.renderer.toneMappingExposure = Math.pow( value, 4.0 );
			})

			self.gui.add( self.params, 'bloomThreshold', 0.0, 1.0 ).onChange( function ( value ) {
				bloomPass.threshold = Number( value );
			})

			self.gui.add( self.params, 'bloomStrength', 0.0, 3.0 ).onChange( function ( value ) {
				bloomPass.strength = Number( value );
			})

			self.gui.add( self.params, 'bloomRadius', 0.0, 1.0 ).step( 0.01 ).onChange( function ( value ) {
				bloomPass.radius = Number( value );
			})

      // window.addEventListener( 'resize', self.onResize, false );

      // add plane to the scene
      // var plane = new self.$gThree.Mesh(
      //   new self.$gThree.BoxBufferGeometry( Math.PI, Math.sqrt( 2 ), Math.E ),
      //   new self.$gThree.MeshLambertMaterial({
      //     color: 0x00afaf,
      //     emissive: 0x2a2a2a,
      //     emissiveIntensity: .5,
      //     side: self.$gThree.DoubleSide
      // }));
      // self.scene.add(plane);

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
      const delta = self.clock.getDelta()
      
      // Update slider
      if (self.isDown) {
        // self.mixer.update( self.$refs.slider.value )
        self.mixer.setTime( self.$refs.slider.value )
      }
      else {
        self.$refs.slider.value = self.slider.progress
        self.mixer.update( delta )
      }

      if (self.slider.progress >= self.slider.duration) {
        // console.log('more than')
        self.clock = new self.$gThree.Clock()
        // self.mixer.update( 0 )
        self.mixer.setTime(0)
        self.slider.progress = 0
        // self.mixer.play()
      }
      else {
        // console.log('progress')
        // console.log(self.slider.progress)
        
        // console.log('self.duration')
        // console.log(self.slider.duration)
      }

      // self.stats.update()
      self.composer.render()
      // console.log(self.mixer)
      self.slider.progress = self.mixer.time

      // console.log(self.mixer.time)
      // console.log('progress')
      // console.log(self.slider.progress)
      self.reqAnim = requestAnimationFrame( self.render.bind(this) )
    },
    setOrbitControls () {
      var self = this
      self.controls = new OrbitControls( self.camera, self.$parent.renderer.domElement );
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
      self.$parent.renderer.setSize(self.width, self.height);

      // Get window width
      self.window = {w: window.innerWidth, h: window.innerHeight}
      console.log('windowW: ', self.window.w)

      // self.render()
      // self.$parent.renderer.render(self.scene, self.camera)
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>

</style>
