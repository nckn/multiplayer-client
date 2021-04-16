<template lang="pug">
  .container.outer.black-bg
    #containerTypo(ref="container_typo")
    MenuOptions(:type="'top-left'" :options="guiControls" :closer="container")
    Controls(:settings="settings" :event="'click'" :revealed="false")
    QuickOptions(:type="'top-left'" :options="quickOptions")
    QuickSearch(:type="'top-left'" :settings="quickSearch" :options="quickOptions")
    .preview-container(v-bind:class="{ available: revealSnapper }")
      .btn.icon.camera-trigger(@click="takeScreenshot" name="screenshot-trigger" v-bind:class="{ closeagain: revealSnapper }")
      .hidden-gui
        .screenshot-img(ref="image_display")
        .action-buttons
          //- button.action-button(@click="takeScreenshot" name="display") Display
          .btn.icon.download(@click="downloadImage" name="download-btn")
    //- Canvas rectangle drawn on face
    canvas#CanvasOverlay(ref="canvas_overlay")
    //- Debugging graphics
    .lilreddot(ref="lil_red_dot" v-bind:class="{ isvisible: aCubeIsHovered }")
    .annotation(ref="annotation" v-bind:class="{ isvisible: aCubeIsHovered }")
      p Cube
</template>
 
<script>

// Example
import * as THREE from 'three'
import { MixOperation } from 'three/build/three.min.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Projector } from 'three/examples/jsm/renderers/Projector.js'

// // import { VertexNormalsHelper } from 'three/examples/jsm/helpers/VertexNormalsHelper.js';

// Post-processing
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';

// Anti aliasing
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js'
import { PixelShader } from 'three/examples/jsm/shaders/PixelShader.js'

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import MenuOptions from '@/components/gui/MenuOptions'
import Controls from '@/components/gui/Controls'
import { map } from '@/assets/js/helpers'

import QuickSearch from '@/components/gui/QuickSearch'

import globalFunctions from '@/mixins/globalFunctions.js'
import { Vector2 } from 'three';

import { TweenMax, TimelineMax, Sine, Back, Expo, Elastic } from 'gsap'

import Box from '@/assets/js/elements/projectbox'

const vertexShader = require('@/assets/js/shaders/unreal-bloom/vertexShader.glsl')
const fragmentShader = require('@/assets/js/shaders/unreal-bloom/fragmentShader.glsl')

const vertexShaderVol = require('@/assets/js/volumetric/vertexShader.glsl')
const fragmentShaderVol = require('@/assets/js/volumetric/fragmentShader.glsl')

const vertexShaderGlow = require('@/assets/js/shaders/glow/simple/vertexShader.glsl')
const fragmentShaderGlow = require('@/assets/js/shaders/glow/simple/fragmentShader.glsl')

const TEXTURE_PATH = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/123879/';

var models = [
  {name: 'iPad', path: 'models/gltf/tablet-frame_ready_test.glb'},
  {name: 'iPad', path: 'models/gltf/goblin-1.0.glb'},
]

var envTextures = [
  require('@/assets/images/environment-textures-opposite-sunrise.jpg'),
  require('@/assets/images/environment-textures-condensed-bands-1.jpg'),
]

var easeTime = 0.5
var debug = false
var sizeCube = 1
var font = ''

var targetRotation = 0;
var targetRotationOnMouseDown = 0;

var mouseX = 0;
var mouseXOnMouseDown = 0;

var windowHalfX = window.innerWidth / 2;

var fontIndex = 1;

// import Slider from '@/components/gui/Slider'

export default {
  name: 'LandingPageKS',
  mixins: [globalFunctions],
  data () {
    return {
      container: null,
      scene: null,
      camera: null,
      composer: null,
      projector: null,
      // Raycaster related
      raycaster: null,
      INTERSECTED: '',
      intersects: [],
      selectionColor: null,
      baseColor: null,
      material: null,
      meshes: [],
      faceIdx1: -1,
      faceIdx2: -1,
      box: null,
      rotationPoint: null,
      sphere: null,
      dirLight: null,
      textureCube: null,
      cube: null, 
      cameraTarget: {y: -100},
      group: null,
      textMesh1: null,
      textGeo: null,
      materials: null,
      cameraPersp: null,
      cameraOrtho: null,
      camera: null,
      // Quick options
      quickSearch: {
        // enabled: false
        enabled: false
      },
      // Quick options
      quickOptions: [
        {name: 'front', path: '/svg/icons/icon-camera-front.svg'},
        {name: 'top', path: '/svg/icons/icon-camera-top.svg'},
        {name: 'angle', path: '/svg/icons/icon-camera-top.svg'},
        // {name: 'snap', path: '/svg/icons/icon-snap-on.svg'},
      ],
      // MenuOptions
      guiControls: [
        {name: 'camerapos',
          enabled: true,
          methods: [
            {name: 'right', method: 'rotate'},
            {name: 'top', method: 'rotate'},
            {name: 'front', method: 'translate'},
          ]
        },
        // {name: 'transforms',
        //   enabled: true,
        //   methods: [
        //     {name: 'scale', method: 'rotate'},
        //     {name: 'rotate', method: 'rotate'},
        //     {name: 'translate', method: 'translate'},
        //   ]
        // },
        // {name: 'space world',
        //   enabled: true,
        //   otherState: 'local',
        //   methods: [
        //     {name: 'handlex', method: 'translate'},
        //     {name: 'handley', method: 'rotate'},
        //     {name: 'handlez', method: 'rotate'},
        //   ]
        // },
        // {name: 'snap', enabled: false},
      ],
      // Post-processing
      params: {
				exposure: 0.6, // org 1
				bloomThreshold: 0.3,
				bloomStrength: 1,
				bloomRadius: 0
      },
      spotParams: {
				anglePower: 0.6,
				attenuation: 8.1,
      },
      // Passes
      filmPass: null,
      bloomPass: null,
      pixelPass: null,
      fxaaPass: null,
      renderComposer: true,
      // Slider settings  
      settings: [
        {name: 'FXs',
          checkbox: [
            {name: 'Enable FXs', checked: true},
            {name: 'Enable Environment', checked: true},
            {name: 'Mirror fonts', checked: true},
            {name: 'Reflection', checked: false},
          ]
        },
        {name: 'FXsSliders',
          sliders: [
            {name: 'Scan lines', value: 0.5},
            {name: 'Noise intensity', value: 0},
            {name: 'Bloom strength', value: 0.1, min: 0, max: 6, step: 0.01},
            {name: 'Blur radius', value: 0.5},
            {name: 'Light intensity', value: 0.5},
            {name: 'Glow material c', value: 0.5, min: 0, max: 1, step: 0.1},
            {name: 'Glow material p', value: 2, min: 0, max: 6, step: 0.02},
          ]
        },
        {name: 'Pixel',
          sliders: [
            {name: 'Pixel size', value: 0.5}
          ]
        },
        {name: 'Lights',
          checkbox: [
            {name: 'Spotlight', checked: true},
            // {name: 'Show guides', checked: true},
          ]
        },
        {name: '',
          sliders: [
            {name: 'Angle Power', value: 0.8, min: 0, max: 10, step: 0.01},
          ]
        },
        {name: '2',
          sliders: [
            {name: 'Attenuation', value: 0.81, min: 0, max: 10, step: 0.01}
          ]
        }
      ],
      // Save and download image data
      imageData: null,
      revealSnapper: false,
      text: '',
      // Quick menu touch trigger
      isTouch: null,
      mouseDown: null,
      mouseDownCoords: {x: 0, y: 0},
      mouseUpCoords: {x: 0, y: 0},
      timeout: null,
      lastTap: 0,
      mapTap: {},
      // Project object
      projects: [
        {
          name: 'RYFM',
          link: 'https://nckn.github.io/ryfm/',
          obj: null,
          verts: [],
        },
        {
          name: 'Soundescapes',
          link: 'http://soundescapes.io/',
          obj: null,
          verts: [],
          // images: pImages[0],
        },
        {
          name: 'Effe',
          obj: null,
          verts: [],
          // link: 'http://soundescapes.io/',
          // images: pImages[0],
        },
      ],
      // Spotlight
      spotLight: null,
      coneMesh: null,
      sceneSettings: null,
      camDist: 3.73,
      // Hover
      aCubeIsHovered: false,
      // Canvas
      canvasOverlay: null,
      ctx: null,
      vector: null,
      vertPos: [
        {x: 0, y: 0},
        {x: 1, y: 1},
        {x: 2, y: 2},
      ],
      window: [],
      allVertices: [],
      // Projectboxes
      initPos: [
        {type: 'rect', pos: {x: 0, y: 0.5, z: 0}, rot: {x: 0, y: 0, z: 0}, scale: {x: 1, y: 1, z: 1}},
        {type: 'rect', pos: {x: -1, y: 0.5, z: 0}, rot: {x: 0, y: 0, z: 0}, scale: {x: 1, y: 1, z: 1}},
        {type: 'rect', pos: {x: 1, y: 0.5, z: 0}, rot: {x: 0, y: 0, z: 0}, scale: {x: 1, y: 1, z: 1}},
      ],
      colPos: [
        {type: 'rect', pos: {x: 0, y: 0.5, z: 0}, rot: {x: 0, y: 0, z: 0}, scale: {x: 0.1, y: 1, z: 1}},
        {type: 'rect', pos: {x: -2, y: 0.5, z: 0}, rot: {x: 0, y: 0, z: 0}, scale: {x: 0.1, y: 1, z: 1}},
        {type: 'rect', pos: {x: 2, y: 0.5, z: 0}, rot: {x: 0, y: 0, z: 0}, scale: {x: 0.1, y: 1, z: 1}},
      ],
    }
  },
  components: {
    MenuOptions,
    Controls,
    QuickSearch
  },
  mounted () {
    var self = this
    // Get window width
    self.window = {w: window.innerWidth, h: window.innerHeight}
    // console.log('mix operation: ', MixOperation)

    // See if FXs should be rendered
    var obj = self.getKeyByValue('FXs', self.settings)

    // See if FXs should be rendered
    self.sceneSettings = self.getKeyByValue('Lights', self.settings)

    // Get Canvas overlay
    self.canvasOverlay = self.$refs.canvas_overlay
    self.ctx = self.canvasOverlay.getContext('2d')

    // canvas, context, width, height
    self.scaleCanvas(self.canvasOverlay, self.ctx, window.innerWidth, window.innerHeight)

    // console.log('this is it')
    // console.log(obj.checkbox[0].checked)
    self.renderComposer = obj.checkbox[0].checked
     
    // Quick menu related - start
    // Listen for double press from mouse or touch
    // self.quickSearch['enabled'] = self.assignDoubleTap(self.quickSearch['enabled'])
    self.isTouch = (('ontouchstart' in window) || (navigator.MaxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0))
    self.mouseDown = self.isTouch ? 'touchstart' : 'mousedown'

    document.addEventListener(self.mouseDown, function(event) {
      var currentTime = new Date().getTime()
      var tapLength = currentTime - self.lastTap
      clearTimeout(self.timeout)
      if (tapLength < 500 && tapLength > 0) {
        // elm2.innerHTML = 'Double Tap'
        event.preventDefault()
        self.quickSearch['enabled'] = !self.quickSearch['enabled']
      } else {
        // elm2.innerHTML = 'Single Tap';
        self.timeout = setTimeout(function() {
          // elm2.innerHTML = 'Single Tap (timeout)'
          clearTimeout(self.timeout)
        }, 500)
      }
      self.lastTap = currentTime
    })

    // Listen for double tap from any key
    document.addEventListener('keydown', e => {
      const slug = `${ e.shiftKey ? '⇧-' : '' }${ e.ctrlKey ? '⌥-' : '' }${ e.metaKey ? '⌘-' : '' }${e.key}`
      self.mapTap[slug] = self.mapTap[slug] || []
      self.mapTap[slug].forEach(clearTimeout)
      self.mapTap[slug].push(setTimeout(() => delete self.mapTap[slug], 300))
      // var numkey = parseInt(Number(slug))
      // var numkey = slug
      if (self.mapTap[slug].length === 2) {
        // self.quickSearch['enabled'] = !self.quickSearch['enabled']
        console.log(`Double keypress of ${slug}`)
        // console.log(typeof numkey)
        console.log(e.keyCode)
        // console.log(`type of`)
        // console.log(typeof slug)
        if (e.keyCode === 32) {
          self.quickSearch['enabled'] = !self.quickSearch['enabled']
        }
      }
    })
    // Quick menu related - end

    // self.projector = new Projector()
    // console.log('projector: ', typeof Projector)
    // console.log('projector self: ', self.projector)

    setTimeout(() => {
      self.init()
      self.animate()
    }, 200)
  },
  beforeDestroy () {
    var self = this
    console.log('before destroy')
    window.cancelAnimationFrame( self.reqAnim );
    // Dispose controls
    self.controls.dispose()
    while(self.scene.children.length > 0){
      console.log('before destroying: ', self.scene.children[0])
      self.scene.remove(self.scene.children[0]);
    }
  },
  methods: {
    scaleCanvas(canvas, context, width, height) {
      var self = this
      // assume the device pixel ratio is 1 if the browser doesn't specify it
      const devicePixelRatio = window.devicePixelRatio || 1;

      // determine the 'backing store ratio' of the canvas context
      const backingStoreRatio = (
        context.webkitBackingStorePixelRatio ||
        context.mozBackingStorePixelRatio ||
        context.msBackingStorePixelRatio ||
        context.oBackingStorePixelRatio ||
        context.backingStorePixelRatio || 1
      );

      // determine the actual ratio we want to draw at
      const ratio = devicePixelRatio / backingStoreRatio;

      if (devicePixelRatio !== backingStoreRatio) {
        // set the 'real' canvas size to the higher width/height
        canvas.width = width * ratio;
        canvas.height = height * ratio;

        // ...then scale it back down with CSS
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
      }
      else {
        // this is a normal 1:1 device; just scale it simply
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = '';
        canvas.style.height = '';
      }

      // scale the drawing context so everything will work at the higher ratio
      context.scale(ratio, ratio)
    },
    makeShaderMaterial() {
      var self = this
      self.material = new THREE.ShaderMaterial({
        uniforms: { 
          attenuation: {
            type: 'f',
            value: self.spotParams.attenuation
          },
          anglePower: {
            type: 'f',
            value: 1.2
          },
          spotPosition: {
            type: 'v3',
            value: new THREE.Vector3( 0, 0, 0 )
          },
          lightColor: {
            type: 'c',
            value: new THREE.Color('cyan')
          },
        },
        vertexShader: vertexShaderVol,
        fragmentShader: fragmentShaderVol,
        // side		: self.$gThree.DoubleSide,
        // blending	: self.$gThree.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      })
    },
    addFloor() {
      var self = this
      
      var material = new THREE.MeshPhongMaterial({ color: 0xFFFFFF })
      self.floor = new THREE.Mesh(new THREE.BoxGeometry(1000, 0.2, 1000), material)
      self.floor.position.y = -0.1

      // grid texture
      self.textureLoader.load('textures/grid-invert.png', function (texture) {
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        texture.repeat.set(1000, 1000)
        self.floor.material.map = texture
        self.floor.material.transparent = true
        self.floor.material.needsUpdate = true
      })

      this.scene.add(self.floor)
      // self.floor.material.opacity = 0

      // const geometry = new THREE.PlaneGeometry(100, 100);
      // const material = new THREE.ShadowMaterial({ opacity: .3 });

      // this.floor = new THREE.Mesh(geometry, material);
      // this.floor.position.y = 0;
      // this.floor.receiveShadow = true;
      // this.floor.rotateX(- Math.PI / 2);

      // this.scene.add(this.floor);
    },
    applySpotLight() {
      var self = this
      // add spot light
      var coneRadius = 2.5
      var lightAngle = coneRadius / 12
      var cone = new THREE.CylinderGeometry( 0.1, coneRadius, 20, 32 * 2, 20, true);
      // var geometry	= new THREE.CylinderGeometry( 0.1, 5*Math.cos(Math.PI/3)/1.5, 5, 32*2, 20, true);
      // cone.applyMatrix4( new THREE.Matrix4().makeTranslation( 0, -cone.parameters.height/2, 0 ) );
      cone.applyMatrix4( new THREE.Matrix4().makeRotationX( -Math.PI / 2 ) );
      // geometry.computeVertexNormals()
      // var geometry	= new THREE.BoxGeometry( 3, 1, 3 );
      // var material	= new THREE.MeshNormalMaterial({
      // 	color: 0x0000ff,
      //   // 	wireframe	: true,
      // });
      // var material	= new THREE.MeshPhongMaterial({
      // 	color		: 0x000000,
      // 	wireframe	: true,
      // })
      self.coneMesh = new THREE.Mesh( cone, self.material )
      self.material.uniforms.lightColor.value.set('white')
      self.material.uniforms.spotPosition.value	= self.coneMesh.position
      self.coneMesh.position.set(0,8,0)
      // self.coneMesh.rotation.x = Math.PI / 2
      self.coneMesh.lookAt( new THREE.Vector3(0, 0, 0) )
      self.scene.add( self.coneMesh )

      // Attach coneMesh
      self.spotLight = new THREE.SpotLight()
      self.spotLight.exponent = 30
      self.spotLight.angle = lightAngle
      // self.spotLight.angle = 0 // Org: Math.PI/3
      self.spotLight.intensity = 5
      self.spotLight.color = self.coneMesh.material.uniforms.lightColor.value
      // Determine if shown or not on start
      self.spotLight.visible = true
      // self.spotLight.visible = self.sceneSettings.checkbox[0].checked
      self.spotLight.penumbra = 0.52
      self.coneMesh.add( self.spotLight )
      
      // Shader related
      // self.material.uniforms.lightColor.value.set('white')
      // self.material.uniforms.spotPosition.value	= self.coneMesh.position
      // self.spotLight.color = self.coneMesh.material.uniforms.lightColor.value
    },
    changeVal(ob) {
      // Slider
      var self = this
      console.log('name: ', ob.name)
      if (ob.name === 'Enable FXs') {
        self.renderComposer = !self.renderComposer
      }
      else if (ob.name === 'Scan lines') {
        console.log('scan lines: ', self.filmPass.uniforms.sIntensity)
        self.filmPass.uniforms.sIntensity.value = ob.value
        // self.refreshText()
      }
      else if (ob.name === 'Noise intensity') {
        console.log('scan lines: ', self.filmPass.uniforms.sIntensity)
        self.filmPass.uniforms.nIntensity.value = ob.value 
      }
      else if (ob.name === 'Bloom strength') {
        self.bloomPass.copyUniforms[ "opacity" ].value = ob.value
      }
      else if (ob.name === 'Blur radius') {
        self.bloomPass.radius = ob.value
        console.log('blur: ')
        // self.bloomPass.convolutionUniforms[ "uImageIncrement" ].value.y = map(ob.value, 0, 1, 0, 1)
        // console.log(JSON.stringify(self.bloomPass))
        // console.log(self.bloomPass)
        // self.bloomPass.uniforms[ "bloomRadius" ].value = map(ob.value, 0, 1, 0, 100)
      }
      else if (ob.name === 'Light intensity') {
        self.dirLight.intensity = map(ob.value, 0, 1, 0.15, 2)
      }
      else if (ob.name === 'Pixel size') {
        self.pixelPass.uniforms[ "pixelSize" ].value = map(ob.value, 0, 1, 1, 32) 
      }
      else if (ob.name === 'Spotlight') {
        self.spotLight.visible = !self.spotLight.visible
        self.coneMesh.visible = !self.coneMesh.visible
        // Play sound
        // self.playSound(sounds[0].obj, 0.5)
        // console.log(sounds[0].obj)
      }
      else if (ob.name === 'Angle Power') {
        self.material.uniforms['anglePower'].value = ob.value
      }
      else if (ob.name === 'Attenuation') {
        self.material.uniforms['attenuation'].value = ob.value
      }
      else if (ob.name === 'Glow material c') {
        self.glowMaterial.uniforms[ 'c' ].value = ob.value 
      }
      else if (ob.name === 'Glow material p') {
        self.glowMaterial.uniforms[ 'p' ].value = ob.value
      }
    },
    clickedCommandInChild (obj) {
      var self = this
      console.log('obj: ', obj.name)
      if (obj.name === 'camerapos') {
        self.toggleCamera()
        self.guiControls[0].enabled = !self.guiControls[0].enabled
      }
      else if (obj.name === 'front' || obj.name === 'top' || obj.name === 'right' || obj.name === 'angle') {
        self.changeCameraPos(obj.name)
      }
    },
    // takeScreenshot (e) {
    //   var self = this
    //   self.revealSnapper = false
    // },
    takeScreenshot (e) {
      var self = this
      var target
      if (e) {
        var target = e.target || e.srcElement || ''
        if (target.classList.contains('closeagain')) {
          self.revealSnapper = false
          return
        }
        self.revealSnapper = true
      }
      else if (e === undefined) {
        console.log('probably a keystroke')
        self.revealSnapper = true
      }
      // var name = target.getAttribute('name')
      // // console.log(e)
      // if (name === 'screenshot-trigger') {
      //   console.log('innnn')
      // }
      console.log('the input')
      console.log(e)
      // return
      console.log(target)
      
      // taken from https://jsfiddle.net/2pha/art388yv/

      try {
        var img = new Image();
        // Without 'preserveDrawingBuffer' set to true, we must render now
        // img.src = self.renderer.domElement.toDataURL()
        self.renderer.render(self.scene, self.camera)
        // Post-processing
        if (self.renderComposer) {
          self.composer.render()
        }
        self.window = {w: self.renderer.domElement.width, h: self.renderer.domElement.width}
        self.imageData = self.renderer.domElement.toDataURL()
        self.imageDisplay.style.background = `url(${self.imageData}`
        self.imageDisplay.style.backgroundSize = 'cover'
        self.imageDisplay.style.backgroundPosition = 'center'
        // self.imageDisplay.src = self.imageData
        // w.document.body.appendChild(img);
      } catch (err) {
        console.log(err)
        return
      }
    },
    downloadImage() {
      var self = this
      var link = document.createElement('a');
      if (typeof link.download === 'string') {
        document.body.appendChild(link) // Firefox requires the link to be in the body
        link.download = `${self.text}`
        link.href = self.imageData
        link.click()
        document.body.removeChild(link) //remove the link when done
      } else {
        location.replace(uri)
      }
    },
    tweenProjectCubes (type) {
      var self = this
      // console.log(self.meshes)
      // return
      self.meshes.forEach((elm, i) => {
        console.log(elm)
        // return
        if (type === 'default') {
          TweenMax.to(elm.position, easeTime, {
            x: self.initPos[i].pos.x,
            y: self.initPos[i].pos.y,
            z: self.initPos[i].pos.z,
            // ease: Sine.easeInOut
            // ease: self.easingType
          })
          TweenMax.to(elm.scale, easeTime, {
            x: self.initPos[i].scale.x,
            y: self.initPos[i].scale.y,
            z: self.initPos[i].scale.z, 
          })
        }
        else if (type === 'domino') {
          console.log('in here')
          TweenMax.to(elm.position, easeTime, {
            x: self.colPos[i].pos.x,
            y: self.colPos[i].pos.y,
            z: self.colPos[i].pos.z,
            ease: Sine.easeInOut,
            onComplete: () => {
              self.repositionVerticesGuides()
            }
            // ease: self.easingType
            // ease: Elastic.easeOut.config(1, 0.3)
          })
          TweenMax.to(elm.scale, easeTime, {
            x: self.colPos[i].scale.x,
            y: self.colPos[i].scale.y,
            z: self.colPos[i].scale.z, 
          })
          // self.convertVertPosition()
        }
        else if (type === 'spreadout') {
          TweenMax.to(elm.obj.position, easeTime, {
            x: self.colPos[i].pos.x,
            y: self.colPos[i].pos.y,
            z: self.colPos[i].pos.z,
            // ease: Sine.easeInOut
            ease: self.easingType
            // ease: Elastic.easeOut.config(1, 0.3)
          })
        }
      })
    },
    tweenObject (type) {
      var self = this
      // if (type === 'default') {
      // }
      TweenMax.to(elm.obj.position, easeTime, {
        x: elm.pos.x,
        y: elm.pos.y,
        z: elm.pos.z,
        // ease: Sine.easeInOut
        ease: self.easingType
      })
    },
    changeCameraPos(angle) {
      var self = this
      switch (angle) {
        case 'front':
          self.camera.position.set( 0, 0, self.camDist )
          break
        case 'top':
          self.camera.position.set( 0, self.camDist, 0 )
          break
        case 'angle':
          self.camera.position.set( -self.camDist, self.camDist / 2, self.camDist )
          break
        case 'right':
          self.camera.position.set( self.camDist, 0, 0 )
          break
      }
      // self.camera.lookAt( 0, 0, 0 ) // TODO: look at "active" object
      self.controls.update()
      self.render()
      // self.cameraPersp.position.set( 1000, 500, 1000 )
      // self.cameraOrtho.position.set( 1000, 500, 1000 )
    },
    init() {
      var self = this
      
      // Build the container
      self.container = self.$refs.container_typo
      self.imageDisplay = self.$refs.image_display
      
      self.lilRedDot = self.$refs.lil_red_dot
      self.annotation = self.$refs.annotation
      // document.body.appendChild( container );

      // Create scene
      self.scene = new THREE.Scene()
      // Add fog
      self.scene.fog = new THREE.Fog(0x000000, 0, self.camDist * 4)

      // Set colors
      self.selectionColor = new THREE.Color('white')
      self.baseColor = new THREE.Color('grey')

      self.resetColors()
      
      // Create a rotation points.
      self.rotationPoint = new THREE.Object3D();
      self.rotationPoint.position.set( 0, 0, 0 );
      self.scene.add(self.rotationPoint);

      // Volumetric shader material
      self.makeShaderMaterial()

      // Add spot light
      self.textureLoader = new THREE.TextureLoader()
      // self.addFloor()

      // Add spot light
      self.applySpotLight()
      
      // // Create the camera.
      // self.camera = new THREE.PerspectiveCamera(
      //   45, // Angle
      //   window.innerWidth / window.innerHeight, // Aspect Ratio.
      //   1, // Near view.
      //   23000 // Far view.
      // );
      // self.camera.position.z = 1500;
      // self.camera.position.y = 200;

      self.aspect = self.window.w / self.window.h

      self.cameraPersp = new THREE.PerspectiveCamera(
        45, // Angle
        window.innerWidth / window.innerHeight, // Aspect Ratio.
        1, // Near view.
        3000 // Far view. 23000
      )
      // Set FOV
      // var dist = 6000
      // self.cameraPersp.fov = 2 * Math.atan( ( window.innerWidth / self.aspect ) / ( 2 * dist ) ) * ( 180 / Math.PI ); // in degrees

      self.cameraOrtho = new THREE.OrthographicCamera( - 600 * self.aspect, 600 * self.aspect, 600, - 600, 0.01, 30000 )
      self.camera = self.cameraPersp
      // self.camera.position.set( 0, 0, 1500 ) 
      
      self.rotationPoint.add( self.camera )

      // Build the renderer.
      self.renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } )
      var element = self.renderer.domElement
      self.renderer.setSize( window.innerWidth, window.innerHeight )
      self.renderer.shadowMap.enabled
      self.renderer.autoClear = false
      // container.appendChild( element );
      self.container.appendChild( element )

      // Setup light
      self.setupLights()

      self.materials = [
        new self.$gThree.MeshPhongMaterial({ color: 0xa0a0a0, flatShading: true }), // front
        new self.$gThree.MeshPhongMaterial({ color: 0xa0a0a0 }) // side
      ];

      self.group = new self.$gThree.Group()
      self.group.position.y = 0

      self.scene.add(self.group)

      self.composer = new EffectComposer(self.renderer)
      self.composer.addPass(new RenderPass(self.scene, self.camera))

      var obj = self.getKeyByValue('FXsSliders', self.settings)

      // alert(obj.sliders[2].value)

      var params = {
				exposure: 1,
				// bloomStrength: 1,
				bloomStrength: parseFloat(obj.sliders[2].value),
				bloomThreshold: 0,
				bloomRadius: 0,
				scene: 'Scene with Glow'
			}

      // New Bloom Pass - start
      self.bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
			self.bloomPass.threshold = params.bloomThreshold
			self.bloomPass.strength = params.bloomStrength
      self.bloomPass.radius = params.bloomRadius
      
      self.finalPass = new ShaderPass(
				new THREE.ShaderMaterial( {
					uniforms: {
						baseTexture: { value: null },
						bloomTexture: { value: self.composer.renderTarget2.texture }
					},
					vertexShader: vertexShader,
					fragmentShader: fragmentShader,
					defines: {}
				} ), 'baseTexture'
			)
			self.finalPass.needsSwap = true
      // New Bloom Pass - end

      // Org Bloom Pass - start
      // self.bloomPass = new BloomPass(
      //   1,    // strength
      //     25,   // kernel size
      //     2,    // sigma ?
      //     256,  // blur render target resolution
      // );
      // // self.bloomPass.convolutionUniforms[ "uImageIncrement" ].value.x = -0.0001
      // // self.bloomPass.convolutionUniforms[ "uImageIncrement" ].value.y = -0.005
      // // self.bloomPass.convolutionUniforms[ "uImageIncrement" ].value.x = 0
      // // self.bloomPass.convolutionUniforms[ "uImageIncrement" ].value.y = -0.002
      // Org Bloom Pass - end

      // console.log(self.bloomPass)
      // console.log(self.bloomPass.strength)

      // Anti alias
      self.fxaaPass = new ShaderPass( FXAAShader )
      var pixelRatio = self.renderer.getPixelRatio()
      self.fxaaPass.material.uniforms[ 'resolution' ].value.x = 1 / ( self.container.offsetWidth * pixelRatio );
      self.fxaaPass.material.uniforms[ 'resolution' ].value.y = 1 / ( self.container.offsetHeight * pixelRatio );
      
      // Anti alias
      self.composer.addPass( self.fxaaPass )
      
      self.composer.addPass(self.bloomPass)
      // self.composer.addPass(self.finalPass)

      self.filmPass = new FilmPass(
        0,   // noise intensity
        0.025,  // scanline intensity
        648,    // scanline count
        false,  // grayscale
      );
      self.filmPass.renderToScreen = true;
      self.composer.addPass(self.filmPass);
      
      // Pixelation
      self.pixelPass = new ShaderPass( PixelShader )
      self.pixelPass.uniforms[ "resolution" ].value = new THREE.Vector2( window.innerWidth, window.innerHeight )
      self.pixelPass.uniforms[ "resolution" ].value.multiplyScalar( window.devicePixelRatio )
      self.composer.addPass( self.pixelPass )

      // EVENTS
      document.addEventListener('mousedown', self.onDocumentMouseDown, false)
      // document.addEventListener('mouseup', self.onDocumentMouseUp, false)

      document.addEventListener('touchstart', self.onDocumentTouchStart, false)
      document.addEventListener('touchmove', self.onDocumentTouchMove, false)
      document.addEventListener('keypress', self.onDocumentKeyPress, false)
      document.addEventListener('keydown', self.onDocumentKeyDown, false)

      document.addEventListener('mousemove', self.checkMove, false)
      document.addEventListener('touchmove', self.checkMove, false)
      document.addEventListener('touchstart', self.checkMove, false)

      self.setOrbitControls()

      // Set camera pos
      self.camera.position.set( -6, 6, 6 )
      // self.camera.rotation.order = 'YXZ';
      self.camera.rotation.y = - Math.PI / 4
      self.camera.rotation.x = Math.atan( - 1 / Math.sqrt( 2 ) )

      self.controls.update()

      self.listenForKeyEvents()

      window.addEventListener( 'resize', self.onWindowResize, false )

      self.setupGlowMaterial()

      self.addiPad()
      
      self.addText()

      self.createProjectCubes()

      // Camera setting
      self.changeCameraPos('top')
    },
    setupGlowMaterial() {
      var self = this
      self.glowMaterial = new THREE.ShaderMaterial({
        uniforms: { 
          'c': { type: 'f', value: 0 },
          'p': { type: 'f', value: 0 },
          glowColor: { type: 'c', value: new THREE.Color(0xffffff) },
          viewVector: { type: 'v3', value: self.camera.position }
        },
        vertexShader: vertexShaderGlow,
        fragmentShader: fragmentShaderGlow,
        side: THREE.FrontSide,
        blending: THREE.AdditiveBlending,
        transparent: true
      })
    },
    addText() {
      var self = this
      self.group = new self.$gThree.Group()
      var fontName = 'hankengrotesk'
      var fontWeight = 'regular'
      var text = 'Konrad Studio'
      var loader = new THREE.FontLoader()
      var height = 0.2,
        zOffset = 0,
        size = 1,
        hover = 0,
        curveSegments = 4,
        bevelThickness = 0.01,
        bevelSize = 0.1,
        // bevelEnabled = true
        bevelEnabled = false
      loader.load('fonts/json/' + fontName + '_' + fontWeight + '.typeface.json', function (response) {
        font = response
        self.textGeo = new self.$gThree.TextBufferGeometry(text, {
          font: font,
          size: size,
          height: height,
          curveSegments: curveSegments,
          bevelThickness: bevelThickness,
          bevelSize: bevelSize,
          bevelEnabled: bevelEnabled
        })

        self.textGeo.computeBoundingBox()
        self.textGeo.computeVertexNormals()

        var centerOffset = - 0.5 * (self.textGeo.boundingBox.max.x - self.textGeo.boundingBox.min.x);

        // self.textGeo = new self.$gThree.BufferGeometry().fromGeometry(self.textGeo);

        // var mat = new THREE.MeshBasicMaterial( { envMap: self.sphere1Camera.renderTarget.texture } )
        // var mat2 = new THREE.MeshBasicMaterial( { envMap: self.sphere1Camera.renderTarget.texture, opacity: 0.25 } )
        // self.textMesh1 = new self.$gThree.Mesh(self.textGeo, self.materials);
        // self.textMesh1 = new self.$gThree.Mesh(self.textGeo, self.reflection ? mat : self.materials);
        self.textMesh1 = new self.$gThree.Mesh(self.textGeo, self.glowMaterial)
        
        self.textMesh1.receiveShadow = true
        // self.textMesh1.material.uniforms[ 'c' ].value = 0.2
        // self.textMesh1.material.uniforms[ 'p' ].value = 2

        self.textMesh1.position.x = centerOffset
        self.textMesh1.position.y = hover
        // self.textMesh1.position.z = 0
        self.textMesh1.position.z = zOffset
        self.textMesh1.rotation.x = 0
        // self.textMesh1.rotation.y = Math.PI * 2
        // self.textMesh1.rotation.y = Math.PI / 2 + Math.PI / 4
        self.textMesh1.rotation.y = -Math.PI / 4
        self.group.add(self.textMesh1)
        // self.group.position.set(-2,0,4)
        self.group.position.set(6,0,-6)
        self.scene.add( self.group )
        // self.addTestText(font)
      })
    },
    addiPad() {
      var self = this
      const loader = new GLTFLoader()

			loader.load( 
        models[0].path,
        function (gltf) {
          var model = gltf.scene
          self.scene.add( model )
          model.scale.set(100,100,100)
          model.position.set(0,0,2)
          // self.mixer = new self.$gThree.AnimationMixer( model )
          
          // console.log('mixer')
          // console.log(self.mixer)
          
          // // Getting animation info
          // var clip = gltf.animations[ 0 ]
          // console.log('clip')
          // console.log(clip.duration)
          // self.slider.duration = clip.duration
          
          // self.mixer.clipAction( clip.optimize() )
          //   .play()

          // // Set playing to true
          // self.isPlaying = true
          
          // self.render()
        },
        undefined, // We don't need this function
        function (error) {
          console.error(error)
        }
      )
      
      loader.load( 
        models[1].path,
        function (gltf) {
          var model = gltf.scene
          self.scene.add( model )
          model.scale.set(2,2,2)
          model.rotation.set(0,Math.PI / 8,Math.PI / 4)
          model.position.set(0,0,-4)
          model.castShadow = true
          model.receiveShadow = true
        },
        undefined, // We don't need this function
        function (error) {
          console.error(error)
        }
      )
    },
    listenForKeyEvents() {
      var self = this
      window.addEventListener( 'keydown', function ( event ) {
        console.log('key code: ', event.keyCode)
        var key
        var target = event.target || event.srcElement
        var isSpecialKey
        if (window.event) {
          key = window.event.keyCode
          // isSpecialKey = !!window.event.shiftKey // typecast to boolean
          // isSpecialKey = !!window.event.metaKey // Cmd
          isSpecialKey = !!window.event.altKey // typecast to boolean
        } else {
          key = ev.which
          // isSpecialKey = !!ev.shiftKey
          // isSpecialKey = !!ev.metaKey
          isSpecialKey = !!ev.altKey
        }
        
        // console.log('where it stems from: ', event)
        if (target.tagName === 'INPUT' && key !== 27) {
          return
        }

        if (isSpecialKey) {
          event.preventDefault()
          switch ( key ) {
            case 77: // M
              self.quickSearch['enabled'] = !self.quickSearch['enabled']
              break
            case 67: // C
              self.toggleCamera()
              break
            case 49: // 1
              self.changeCameraPos('front')
              break
            case 50: // 2
              self.changeCameraPos('top')
              break
            case 51: // 3
              self.changeCameraPos('angle')
              break
            case 83: // S – take a screenshot
              self.takeScreenshot()
              break
            case 84: // T – tween
              self.tweenProjectCubes('domino')
              break
            case 89: // Y – tween
              self.tweenProjectCubes('default')
              break
            case 32: // S – take a screenshot
              // self.doubleTapProvoked(event)
              break
          }
        }
        // Global keys
        switch ( key ) {
          case 27: // Escape key
            self.quickSearch['enabled'] = false
            break
        }
        // if ( event.keyCode == 49 && event.keyCode == 16 ) {
        //   self.toggleCamera()
        // }
        // else if () {

        // }
      })
    },
    toggleCamera() {
      var self = this
      const position = self.camera.position.clone()

      self.camera = self.camera.isPerspectiveCamera ? self.cameraOrtho : self.cameraPersp
      self.camera.position.copy( position )

      self.controls.object = self.camera
      self.controls.camera = self.camera

      self.camera.lookAt( self.controls.target.x, self.cameraTarget.y, self.controls.target.z )
      // self.onWindowResize()
    },
    setupLights() {
      var self = this
      self.dirLight = new THREE.DirectionalLight(0xffffff, 1.75);
      var d = 20;

      self.dirLight.position.set(d, d, d);

      self.dirLight.castShadow = true;
      //self.dirLight.shadowCameraVisible = true;

      self.dirLight.shadow.mapSize.width = 2048;
      self.dirLight.shadow.mapSize.height = 2048;

      self.dirLight.shadow.camera.left = -d;
      self.dirLight.shadow.camera.right = d;
      self.dirLight.shadow.camera.top = d;
      self.dirLight.shadow.camera.bottom = -d;

      self.dirLight.shadow.camera.far = 3 * d;
      self.dirLight.shadow.camera.near = d;

      // Set intensity
      var obj = self.getKeyByValue('FXsSliders', self.settings)
      var val = parseFloat(obj.sliders[4].value)
      self.dirLight.intensity = val
      // self.dirLight.shadowDarkness = 0.5;

      self.scene.add(self.dirLight);
    },
    onDocumentMouseDown(event) {
      var self = this
      // event.preventDefault()
      // console.log('eveeeent: ', event)
      document.addEventListener('mousemove', self.onDocumentMouseMove, false)
      document.addEventListener('mouseup', self.onDocumentMouseUp, false)
      document.addEventListener('mouseout', self.onDocumentMouseOut, false)
      mouseXOnMouseDown = event.clientX - windowHalfX
      targetRotationOnMouseDown = targetRotation 

      self.mouseDownCoords = self.checkIfTouch(event)
    },
    trackMouseUp(event) {
      var self = this
      
      // console.log('the event once again')
      // console.log(event)
      self.mouseUpCoords = self.checkIfTouch(event)
      // console.log(self.mouseUpCoords.x)

      // return

      if (self.mouseUpCoords.x === self.mouseDownCoords.x &&
          self.mouseUpCoords.y === self.mouseDownCoords.y) {
        // Check if clicked
        // var mouseCoords = self.checkIfTouch(event)
        var raycaster = self.getRayCasterFromScreenCoord(self.mouseUpCoords.x, self.mouseUpCoords.y, self.camera);
        // Find the closest intersecting object
        // Now, cast the ray all render objects in the scene to see if they collide. Take the closest one.
        var intersects = raycaster.intersectObjects(self.meshes)
        // var intS = self.INTERSECTED
        if ( intersects.length > 0 ) {
          // var theClickId = intersects[0].faceIndex
          // var theClickId = intersects[0].object.id
          var theClickId = parseInt(intersects[0].object.name)
          window.open(`${self.projects[theClickId].link}`)
          // Clicked id
          // console.log('click ID: ', theClickId)
        }
      }
      else {
        console.log('cancel the damn thing')
      }

      // self.mouseDown = self.checkIfTouch(event)
    },
    onDocumentMouseMove(event) {
      var self = this
      // console.log('eveeeent: ', event.clientX)
      mouseX = event.clientX - windowHalfX
      // self.mouse = {x: event.clientX, y: event.clientY}
      targetRotation = targetRotationOnMouseDown + (mouseX - mouseXOnMouseDown) * 0.02
      self.checkMove(event)
    },
    createProjectCubes () {
      var self = this
      self.groupMesh = new self.$gThree.Object3D()
      self.groupMesh.position.set(0, 0, 0)
      self.projects.forEach((element, index) => { 
        
        // Example Box object - start
        const boxObject = new Box({
          size: sizeCube,
        })
        self.material = boxObject.material
        // var geometry = new THREE.SphereGeometry( 100, 4, 3 );
        var geometry = new THREE.CubeGeometry( sizeCube, sizeCube, sizeCube )
        geometry.mergeVertices()
        geometry.verticesNeedUpdate = true
        // geometry.computeCentroids();
        var material = new THREE.MeshNormalMaterial()
        // var mesh = new THREE.Mesh( geometry, material );
        var mesh = new THREE.Mesh( geometry, self.material );
        // mesh.position.set(0,sizeCube / 2,0);
        mesh.position.set(-(index * (sizeCube * 2)), sizeCube / 2,0)
        mesh.name = index
        // mesh.material.wireframe = true
        self.scene.add(mesh);
        self.meshes.push( mesh )

        self.box = mesh

        // Store 3D object as in project object
        element.obj = mesh

        // Trying to treat relativePosition as a position type
        for (var i = 0; i < mesh.geometry.vertices.length; i++) {
          // mesh.geometry.verticesNeedUpdate = true
          // var relativePosition = intPosition.clone().add(new THREE.Vector3(0.5, 0.5, 0.5) )
          var relativePosition = mesh.geometry.vertices[i].clone().add(new THREE.Vector3(-(index * (sizeCube * 2)), sizeCube / 2, 0) )
          var newCube = self.makeSmallSphere(relativePosition)
          element.verts.push(newCube)
        }
      })
      // self.scene.add( self.groupMesh )
    },
    makeSmallSphere(pos) {
      var self = this
      // console.log('coming in')
      // console.log(pos.x)
      var geometry = new THREE.BoxGeometry( 0.1, 0.1, 0.1 )
      geometry.mergeVertices();
      // geometry.computeCentroids();
      var material = new THREE.MeshNormalMaterial();
      var mesh = new THREE.Mesh( geometry, material );
      // mesh.position.set(0,10,0);
      mesh.position.set(pos.x, pos.y, pos.z)
      self.scene.add(mesh)
      return mesh
    },
    repositionVerticesGuides () {
      var self = this
      self.projects.forEach((element, index) => { 
        // Trying to treat relativePosition as a position type
        // element.verts.position.set(0,0,0)
        element.obj.geometry.verticesNeedUpdate = true
        for (var i = 0; i < element.obj.geometry.vertices.length; i++) {
          // console.log(element.verts[i].position)
          console.log(element.obj.geometry.vertices[i].x)
          
          // var relativePosition = element.obj.geometry.vertices[i].clone().add(new THREE.Vector3(0.5, 0.5, 0.5) )
          // var relativePosition = element.obj.geometry.vertices[i].clone().add(new THREE.Vector3(-(index * (sizeCube * 2)), sizeCube / 2, 0) )
          // var newCube = self.makeSmallSphere(relativePosition)
          // element.verts.push(newCube.position)
          
          // TODO: Trying to update vertices and copy to verts guides
          // var relativePosition = element.obj.geometry.vertices[i].clone()
          var pos = self.initPos[index].pos
          var initPos = new THREE.Vector3(pos.x, pos.y, pos.z)
          var relativePosition = element.obj.geometry.vertices[i].clone().add( initPos )
          element.verts[i].position.copy(relativePosition)
        }
      })
      self.convertVertPosition()
    },
    convertVertPosition(pos) {
      var self = this
      self.allVertices = []
      // Trying to treat relativePosition as a position type
      const canvas = self.renderer.domElement
      self.projects.forEach((element, index) => {
        for (var i = 0; i < self.box.geometry.vertices.length; i++) {
          // var relativePosition = intPosition.clone().add(new THREE.Vector3(0.5, 0.5, 0.5) )
          var relativePosition
          // TODO: Hoping to pass 2D pos array here
          if (pos) {
            relativePosition = pos
          }
          else {
            relativePosition = self.box.geometry.vertices[i].clone().add(new THREE.Vector3(-(index * (sizeCube * 2)), sizeCube / 2, 0) )
          }
          // var newCube = self.makeSmallSphere(relativePosition)
          // var thisPos = self.convertVertPosition(relativePosition)
          var vector = relativePosition.clone()
          // console.log('vector.x before: ', vector.x)
          self.camera.updateMatrixWorld() // FIX
          self.camera.updateProjectionMatrix()
          vector.project( self.camera )
          // Scale x and y values to screen
          vector.x = Math.round( (   vector.x + 1 ) * canvas.width  / 2 )
          vector.y = Math.round( ( - vector.y + 1 ) * canvas.height / 2 )
          self.allVertices.push(vector)
          // return vector
          // console.log(newCube)

          // Add vectors to array
          // self.allVertices.push(thisPos)
          // console.log(thisPos.x)
          // if (index === 1) {
          // }
        }
      })
    },
    getRayCasterFromScreenCoord (screenX, screenY, camera) {
      var self = this
      var raycaster = new self.$gThree.Raycaster()
      var mouse3D = new self.$gThree.Vector3();
      // Get 3D point form the client x y
      mouse3D.x = (screenX / window.innerWidth) * 2 - 1;
      mouse3D.y = -(screenY / window.innerHeight) * 2 + 1;
      mouse3D.z = 0.5;
      raycaster.setFromCamera(mouse3D, camera)
      return raycaster
    },
    onDocumentMouseUp(event) {
      var self = this
      document.removeEventListener('mousemove', self.onDocumentMouseMove, false)
      document.removeEventListener('mouseup', self.onDocumentMouseUp, false)
      document.removeEventListener('mouseout', self.onDocumentMouseOut, false)

      console.log('event is: ', event)
      self.trackMouseUp(event)
    },
    onDocumentMouseOut() {
      var self = this
      document.removeEventListener('mousemove', self.onDocumentMouseMove, false)
      document.removeEventListener('mouseup', self.onDocumentMouseUp, false)
      document.removeEventListener('mouseout', self.onDocumentMouseOut, false)
    },
    onDocumentTouchStart(event) {
      if (event.touches.length == 1) {
        event.preventDefault()
        mouseXOnMouseDown = event.touches[0].pageX - windowHalfX
        targetRotationOnMouseDown = targetRotation
      }
    },
    onDocumentTouchMove(event) {
      if (event.touches.length == 1) {
        event.preventDefault()
        var mouseX = event.touches[0].pageX - windowHalfX
        targetRotation = targetRotationOnMouseDown + (mouseX - mouseXOnMouseDown) * 0.05
      }
    },
    decimalToHex(d) {
      var hex = Number(d).toString(16)
      hex = '000000'.substr(0, 6 - hex.length) + hex
      return hex.toUpperCase()
    },
    setOrbitControls () {
      var self = this
      // Build the controls.
      self.controls = new OrbitControls( self.camera, self.renderer.domElement )
      // self.controls.enablePan = false
      self.controls.enableZoom = true 
      self.controls.maxDistance = self.camDist * 2 
      self.controls.minDistance = 3
      self.controls.maxPolarAngle = (Math.PI * 0.5) * 0.99
      // Set orbit camera to half way up the cube
      self.controls.target.copy( new THREE.Vector3(0, sizeCube / 2, 0) )

      self.controls.addEventListener('change', () => {
        // console.log('updating')
        console.log(self.camera.position)
        console.log(self.controls)
        if (self.box != null)
          self.convertVertPosition()
      })

      // function setOrientationControls(e) {
      //   if (!e.alpha) {
      //     return;
      //   }
      //   self.controls = new THREE.DeviceOrientationControls( self.camera )
      //   self.controls.connect()
      //   window.removeEventListener('deviceorientation', setOrientationControls, true)
      // }
      // window.addEventListener('deviceorientation', setOrientationControls, true)
    },
    addGuides () {
      var axesHelper = new THREE.AxesHelper( 5 );
      this.scene.add( axesHelper );
      // console.log('adding guides')
    },
    update() {
      this.camera.updateProjectionMatrix()
    },
    checkMove (e) {
      var self = this
      var mouseCoords = self.checkIfTouch(e)
      var raycaster = self.getRayCasterFromScreenCoord(mouseCoords.x, mouseCoords.y, self.camera);
      // Find the closest intersecting object
      // Now, cast the ray all render objects in the scene to see if they collide. Take the closest one.
      var intersects = raycaster.intersectObjects(self.meshes)
      var intS = self.INTERSECTED

      // A side is hovered. Intersection
      if ( intersects.length > 0 ) {
        // console.log('checking intersecting')
        if ( intS != intersects[ 0 ].object ) {
          
          intS = intersects[ 0 ].object
          self.box = intS

          // set previously selected faces to white
          self.setFaceColor(self.faceIdx1, self.baseColor)
          self.setFaceColor(self.faceIdx2, self.baseColor)
          
          // Log the hovered face id
          // console.log(self.box.name)
          // console.log(self.faceIdx1)

          // find the new indices of faces
          self.faceIdx1 = intersects[0].faceIndex
          self.faceIdx2 = self.faceIdx1 % 2 === 0 ? self.faceIdx1 + 1: self.faceIdx1 - 1

          // set newly selected faces to red
          self.setFaceColor(self.faceIdx1, self.selectionColor)
          self.setFaceColor(self.faceIdx2, self.selectionColor)

          self.aCubeIsHovered = true

          self.convertVertPosition()
        }
      }
      else {
        self.resetColors()
        self.aCubeIsHovered = false
        // console.log('no hover')
        self.container.style.cursor = 'default'
        intS = null
      }
      self.meshes.forEach(element => {
        if (element != intS) {
          // element.material.emissive.setHex( 0x000000 );
        }
      })
    },
    setFaceColor(idx, color){
      var self = this
      if (idx === -1) return;
      // Highlights the face color
      self.box.geometry.faces[idx].color.copy(color)
      self.container.style.cursor = 'pointer'
      // TODO: Face color tween
      // TweenMax.to(self.box.geometry.faces[idx], 0.2, {
      //   color: color,
      //   // ease: Sine.easeInOut
      //   ease: self.easingType
      //   // ease: Elastic.easeOut.config(1, 0.3)
      // })
      // self.box.geometry.faces[idx].materialIndex = 0
      // self.box.geometry.faces[idx].color.set( new THREE.Color('blue') )
      self.box.geometry.colorsNeedUpdate = true
    },
    resetColors() {
      var self = this
      for (var b = 0; b < self.meshes.length; b++) {
        for (var i = 0; i < self.meshes[b].geometry.faces.length; i++) {
          self.meshes[b].geometry.faces[i].color.set( self.baseColor )
          // console.log(element.currentHex)
        }
      }
    },
    updateScreenPosition() {
      var self = this
      // var visibleWidth, visibleHeight, p, v, percX, percY, left, top
      if (!self.box) {
        return
      }      
      const canvas = self.renderer.domElement

      self.vector = self.box.position.clone()

      self.camera.updateMatrixWorld() // FIX
      self.camera.updateProjectionMatrix()
      self.vector.project( self.camera )

      // Scale x and y values to screen
      self.vector.x = Math.round( (   self.vector.x + 1 ) * canvas.width  / 2 )
      self.vector.y = Math.round( ( - self.vector.y + 1 ) * canvas.height / 2 )

      self.vector.y = self.vector.y - 200

      self.lilRedDot.style.left = `${self.vector.x}px`
      self.lilRedDot.style.top = `${self.vector.y}px`

      self.annotation.style.left = `${self.vector.x}px`
      self.annotation.style.top = `${self.vector.y}px`
    },
    updateCanvasOverlay () {
      var self = this
      if (self.vector != null && self.aCubeIsHovered) { 
        self.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
        self.ctx.beginPath()
        // Face IDs
        // console.log(self.box.name)
        // console.log(self.faceIdx1)
        if (self.box.name === 0) {
          if (self.faceIdx1 === 0 || self.faceIdx1 === 1) {
            self.ctx.moveTo(self.allVertices[0].x, self.allVertices[0].y)
            self.ctx.lineTo(self.allVertices[1].x, self.allVertices[1].y)
            self.ctx.lineTo(self.allVertices[3].x, self.allVertices[3].y)
            self.ctx.lineTo(self.allVertices[2].x, self.allVertices[2].y)
          } else if (self.faceIdx1 === 2 || self.faceIdx1 === 3) {
            self.ctx.moveTo(self.allVertices[4].x, self.allVertices[4].y)
            self.ctx.lineTo(self.allVertices[5].x, self.allVertices[5].y)
            self.ctx.lineTo(self.allVertices[7].x, self.allVertices[7].y)
            self.ctx.lineTo(self.allVertices[6].x, self.allVertices[6].y)
          } else if (self.faceIdx1 === 4 || self.faceIdx1 === 5) {
            self.ctx.moveTo(self.allVertices[0].x, self.allVertices[0].y)
            self.ctx.lineTo(self.allVertices[1].x, self.allVertices[1].y)
            self.ctx.lineTo(self.allVertices[4].x, self.allVertices[4].y)
            self.ctx.lineTo(self.allVertices[5].x, self.allVertices[5].y)
          }
        } else if (self.box.name === 1) {
          if (self.faceIdx1 === 0 || self.faceIdx1 === 1) {
            self.ctx.moveTo(self.allVertices[8].x, self.allVertices[8].y)
            self.ctx.lineTo(self.allVertices[9].x, self.allVertices[9].y)
            self.ctx.lineTo(self.allVertices[11].x, self.allVertices[11].y)
            self.ctx.lineTo(self.allVertices[10].x, self.allVertices[10].y)
          }
        }
        self.ctx.fillStyle = 'rgba(255,0,0,1)'
        self.ctx.fill()
      } else {
        self.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      }
    },
    animate () {
      var self = this
      self.reqAnim = requestAnimationFrame( self.animate.bind(this) )
      // self.update()
      self.render()
    },
    render() {
      var self = this
      
      self.updateScreenPosition()
      
      self.updateCanvasOverlay()
      
      // Render the scene.
      self.renderer.render(self.scene, self.camera)

      // Post-processing
      if (self.renderComposer) {
        self.composer.render()
      }

      if (self.textMesh1 != null) {
        // console.log(self.textMesh1.material)
        self.textMesh1.material.uniforms.viewVector.value = new THREE.Vector3().subVectors( self.camera.position, self.textMesh1.position )
      }
  
    },
    onWindowResize() {
      var self = this
      self.camera.aspect = ( window.innerWidth / window.innerHeight )
      self.camera.updateProjectionMatrix()
      self.renderer.setSize( window.innerWidth, window.innerHeight )
    },
    onDocumentKeyDown(event) {
      var self = this
    },
    onDocumentKeyPress(event) {
      var self = this
    },
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>

$s-action-btns: 24px;
$p-master: 24px;

$breakp-xs: 480px;
$breakp-sm: 576px;
$breakp-md: 768px;
$breakp-lg: 992px;
$breakp-xl: 1200px;
$breakp-xxl: 1600px;

.preview-container {
  width: 0;
  height: 0;
  position: absolute;
  // bottom: 48px; right: 48px;
  bottom: 12px; right: 12px;
  padding: $p-master / 2;
  display: flex;
  flex-direction: column;
  background: #252525;
  transition: all 0.15s ease-in;
  box-sizing: border-box;
  -webkit-box-shadow: 0px 0px 10px 0px rgba(0,0,0,0.25);
  -moz-box-shadow: 0px 0px 10px 0px rgba(0,0,0,0.25);
  box-shadow: 0px 0px 10px 0px rgba(0,0,0,0.25);
  border-radius: 2px;
  .hidden-gui {
    visibility: hidden;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  &.available { 
    width: 156px;
    height: 156px;
    padding: $p-master;
    padding-bottom: $p-master / 2;
    .hidden-gui {
      visibility: visible;
    }
    .camera-trigger {
      top: 2px;
      right: 2px;
    }
  }
  .camera-trigger {
    position: absolute;
    top: 0;
    right: 0;
  }
  .screenshot-img {
    width: 100%;
    // height: 100px;
    // height: calc(100% - #{$s-action-btns});
    height: calc(100% - #{$s-action-btns + 12px});
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center;
  }
  .action-buttons {
    width: 100%;
    height: $s-action-btns;
    display: flex;
    // justify-content: space-between;
    justify-content: center;
    .action-button {
      width: calc(50% - 6px);
      height: 100%;
    }
  }
}

#typeinfo {
  position: absolute;
  bottom: 0;
  right: 0;
  width: auto;
  // display: none; // *** Demo purpose
}

@media screen and (max-width: $breakp-md) {
  .preview-container {
    bottom: 64px;
  }
}

#CanvasOverlay {
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  background: rgba(0, 0, 255, 0.164);
  pointer-events: none;
}

.lilreddot {
  width: 20px;
  height: 20px;
  position: absolute;
  background: red;
  top: 0;
  left: 0;
  border-radius: 10px;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.5s ease;
}

.annotation {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  margin-left: 15px;
  margin-top: 15px;
  padding: 1em;
  width: 200px;
  color: #fff;
  background: rgba(0, 0, 0, 0.8);
  border-radius: .5em;
  font-size: 12px;
  line-height: 1.2;
  opacity: 0;
  visibility: hidden;
  transition: opacity .5s ease;
  &::before {
    content: '1';
    position: absolute;
    top: -30px;
    left: -30px;
    width: 30px;
    height: 30px;
    border: 2px solid #fff;
    border-radius: 50%;
    font-size: 16px;
    line-height: 30px;
    text-align: center;
    background: rgba(0, 0, 0, 0.8);
  }
}

.isvisible {
  opacity: 1;
  visibility: visible;
}

</style>
