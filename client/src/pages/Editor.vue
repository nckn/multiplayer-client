<template lang="pug">
  .container
    .inner-container.white-bg
      #sceneContainer
      .gui-dock(v-show="showGUI")
        RangeSlider(:name="'grid'" :val="0")
        RangeSlider(:name="'speed'")
        Slider(:slider_name="'Easing type'" :min="0" :max="3" :value="1" :step="1" :class_name="'switch'")
      //- .intro-block
      //-   h1 test
    //- Popover(:canShow="canShow" :coords="popOverInfoPos")
</template>

<script>

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
// import { WEBVR } from "three/examples/js/vr/WebVR.js";

import { TweenMax, TimelineMax, Sine, Back, Expo, Elastic } from 'gsap'

import globalFunctions from '@/mixins/globalFunctions.js'

import Cone from '@/assets/js/elements/cone'
import Torus from '@/assets/js/elements/torus'
import Cylinder from '@/assets/js/elements/cylinder'
import Sphere from '@/assets/js/elements/sphere'
// import Box from '@/assets/js/elements/box'
import SimpleBox from '@/assets/js/elements/boxSimple'
import SimpleCylinder from '@/assets/js/elements/cylinderSimple'

// import Popover from '@/components/gui/Popover.vue'
import RangeSlider from '@/components/gui/RangeSlider.vue'
import Slider from '@/components/gui/Slider.vue'

import { radians, map, distance } from '@/assets/js/helpers'

// const easeTime = 0.45
var easeTime = 2
var debug = false
// var debug = true
// var easingType = null

export default {
  name: 'LogoWF3D',
  props: ['layoutState'],
  mixins: [globalFunctions],
  components: {
    // Popover,
    RangeSlider,
    Slider
  },
  watch: { 
    layoutState: function(newVal, oldVal) { // watch it
      // console.log('Prop changed: ', newVal, ' | was: ', oldVal)
      if (newVal === 0) {
        // Make layout 0
        this.layout = 0
      }
      else if (newVal === 1) {
        // Make layout 1
        this.layout = 1
        // console.log('tween layout 1')
      }
      else if (newVal === 2) {
        // Make layout 2
        this.layout = 2
        // console.log('tween layout 2')
      }
    }
  },
  data () {
    return {
      container: null,
      showGUI: true,
      isLarge: true,
      shadowsOn: false,
      window: {w: null, h: null},
      layout: 0,
      // Materials
      materialObjs: null,
      hasBeenDistributed: false,
      // Timing
      stdTime: 0.7,
      // Popover
      canPlacePopover: true,
      canShow: false,
      popOverInfoPos: {x: 0, y: 0},
      lastHovered: null,
      // Tweening
      beenHereOnce: false,
      lastLayout: 0,
      centerX: 0,
      centerZ: 0,
      orgSize: 0.1,
      ringSize: 8, // The size of the ring
      lineSize: 50, // The length of the lines that make up the ring,
      textureLoader: null,
      logoShapes: [
        {type: 'rect', size: {w: 1, h: 1, d: 4}, pos: {x: -2.5, y: 0, z: -2}, scale: {x: 1, y: 1, z: 1}},
        {type: 'rect', size: {w: 1, h: 1, d: 2.5}, pos: {x: 1.5, y: 0, z: -0.25}, scale: {x: 1, y: 1, z: 1}},
        {type: 'rect', size: {w: 1, h: 1, d: 2.5}, pos: {x: -0.5, y: 0, z: -0.25}, scale: {x: 1, y: 1, z: 1}},
        {type: 'rect', size: {w: 1, h: 1, d: 2.5}, pos: {x: 1.5, y: 0, z: -2.75}, scale: {x: 1, y: 1, z: 1}},
        {type: 'cylinder', size: {w: 0.505, h: 0.1, d: 0.505}, pos: {x: 3.5, y: 0, z: -3.5}, scale: {x: 1, y: 1, z: 1}},
        {type: 'cylinder', size: {w: 0.505, h: 0.1, d: 0.505}, pos: {x: 3.5, y: 0, z: -3.5}, scale: {x: 1, y: 1, z: 1}},
        {type: 'cylinder', size: {w: 0.505, h: 0.1, d: 0.505}, pos: {x: 3.5, y: 0, z: -1.5}, scale: {x: 1, y: 1, z: 1}},
        {type: 'cylinder', size: {w: 0.505, h: 0.1, d: 0.505}, pos: {x: 3.5, y: 0, z: -1.5}, scale: {x: 1, y: 1, z: 1}},
        {type: 'prism', name: 'prism1', size: {w: 0.5, h: 0.1, d: 0.5}, pos: {x: -2.5, y: 1, z: 0.5}, rot: {x: Math.PI / 2, y: 0, z: 0}, scale: {x: 1, y: 1, z: 1}},
        {type: 'prism', name: 'prism2', size: {w: 0.5, h: 0.1, d: 0.5}, pos: {x: -2.5, y: 1, z: 0.5}, rot: {x: Math.PI / 2, y: Math.PI, z: Math.PI / 2}, scale: {x: 1, y: 1, z: 1}},
      ],
      colPos: [
        {type: 'rect', size: {w: 1, h: 1, d: 4}, pos: {x: -2.5, y: 0, z: -2.5}, rot: {x: 0, y: 0, z: 0}, scale: {x: 1, y: 1, z: 0.75}},
        {type: 'rect', size: {w: 1, h: 1, d: 2.5}, pos: {x: 1.5, y: 0, z: -1.5}, rot: {x: 0, y: 0, z: 0}, scale: {x: 1, y: 1, z: 0.7}},
        {type: 'rect', size: {w: 1, h: 1, d: 2.5}, pos: {x: -0.5, y: 0, z: -0.5}, rot: {x: 0, y: 0, z: 0}, scale: {x: 1, y: 1, z: 1.2}},
        {type: 'rect', size: {w: 1, h: 1, d: 2.5}, pos: {x: 3.5, y: 0, z: 0.5}, rot: {x: 0, y: 0, z: 0}, scale: {x: 1, y: 1, z: 0.4}},
        {type: 'cylinder', size: {w: 1, h: 1, d: 2.5}, pos: {x: -0.5, y: 0, z: -3.5}, rot: {x: 0, y: 0, z: 0}},
        {type: 'cylinder', size: {w: 1, h: 1, d: 2.5}, pos: {x: 1.5, y: 0, z: -3.5}, rot: {x: 0, y: 0, z: 0}},
        {type: 'cylinder', size: {w: 1, h: 1, d: 2.5}, pos: {x: 3.5, y: 0, z: -3.5}, rot: {x: 0, y: 0, z: 0}},
        {type: 'cylinder', size: {w: 1, h: 1, d: 2.5}, pos: {x: 1.5, y: 0, z: 0.5}, rot: {x: 0, y: 0, z: 0}},
        {type: 'prism', size: {w: 1, h: 1, d: 2.5}, pos: {x: -2.5, y: 1, z: 0.5}, rot: {x: Math.PI / 2, y: 0, z: 0}},
        {type: 'prism', size: {w: 1, h: 1, d: 2.5}, pos: {x: 3.5, y: 1, z: -1.5}, rot: {x: Math.PI / 2, y: Math.PI, z: Math.PI / 2}},
      ],
      group: null,
      // Extrude settings, prism related
      extrudeSettings: null,
      triangleShape: null,
      // otherPos: [
      //   {name: 'collaboration', pos: {x: -2.5, y: 0, z: -1.5}}
      // ]
      oscTypes: [Sine.easeInOut, Expo.easeOut, Back.easeOut.config(1.7), Elastic.easeOut.config(1, 0.3)],
      easingType: Elastic.easeOut.config(1, 0.3),
      // Debugging
      colors: [
        '0x3a8025',
        '0x0056k7',
        '0x306700',
        '0x252525',
        '0x258725',
        '0x472509',
        '0x320049',
        '0x125000',
        '0x575089',
      ],
    }
  },
  mounted() {
    var self = this;

    // Get window width
    self.window = {w: window.innerWidth, h: window.innerHeight}

    // Check size of client
    self.isLarge = self.checkIfLarge(768)

    self.$nextTick(
      // self.setupScene()
      self.show3DCanvas(),
      self.init()
    )
  },
  methods: {
    show3DCanvas() {
      var self = this
      var tl = new TimelineMax()
      tl.from('#sceneContainer', 4, {autoAlpha: 0, ease: Sine.easeIn})
        .from('.gui-dock', 1, {autoAlpha: 0, ease: Sine.easeIn})
    },
    setupPrism() {
      var self = this
      // var extrudeSettings = { depth: 1, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 0.1, bevelThickness: 1 }
      self.extrudeSettings = { depth: 1, bevelEnabled: false }
      // Triangle
			self.triangleShape = new THREE.Shape()
        .moveTo( -0.5, -0.5 )
        .lineTo( 0.5, 0.5 )
        .lineTo( 0.5, -0.5 )
        .lineTo( -0.5, -0.5 ) // close path
      // self.addShape( triangleShape, extrudeSettings, 0x8080f0, - 180, 0, 0, 0, 0, 0, 1 )
    },
    addShape( shape, extrudeSettings, color, x, y, z, rx, ry, rz, s ) {
      var self = this
      // https://threejs.org/examples/webgl_geometry_shapes.html
      // extruded shape
      var geometry = new THREE.ExtrudeBufferGeometry( shape, extrudeSettings );
      var mesh = new THREE.Mesh( geometry, new THREE.MeshPhongMaterial( { color: color } ) );
      mesh.rotation.set( rx, ry, rz );
      return mesh
      // mesh.position.set( x, y, z );
      // var pos = {
      //   x: self.logoShapes[5].pos.x,
      //   y: self.logoShapes[5].pos.y,
      //   z: self.logoShapes[5].pos.z,
      // }
      // mesh.position.set( pos.x, pos.y, pos.z )
      // mesh.scale.set( s, s, s );
      // self.scene.add( mesh );
      // // Add to group and shapw array
      // self.groupMesh.add(mesh)
      // self.logoShapes.push({
      //   type: 'prism',
      //   size: {w: 1, h: 1, d: 2.5},
      //   pos: {x: -2.5, y: 0, z: -2.75},
      //   rot: {x: 0, y: Math.PI, z: 0},
      //   obj: mesh,
      // })
      // addLineShape( shape, color, x, y, z, rx, ry, rz, s );
    },
    changeParam: function(target) {
      var self = this
      if (target.name == 'Easing type') {
        self.easingType = self.oscTypes[target.value]
        console.log('Osc 1: ' + self.oscTypes[target.value])
      }
      // if (target.name == 'Osc 2') {
      //   self.osc[1] = self.oscTypes[target.value]
      //   console.log('Osc 2: ' + target.value)
      // }
    },
    tweenObject (type) {
      var self = this
      self.logoShapes.forEach((elm, i) => {
        if (type === 'default') {
          TweenMax.to(elm.obj.position, easeTime, {
            x: elm.pos.x,
            y: elm.pos.y,
            z: elm.pos.z,
            // ease: Sine.easeInOut
            ease: self.easingType
          })
          if (elm.scale) {
            TweenMax.to(elm.obj.scale, easeTime, {
              x: elm.scale.x,
              y: elm.scale.y,
              z: elm.scale.z,
              // ease: Sine.easeInOut
              ease: self.easingType
              // ease: Elastic.easeOut.config(1, 0.3)
            })
          }
        }
        else if (type === 'collapse') {
          TweenMax.to(elm.obj.position, easeTime, {
            // x: Math.sin( i / length * Math.PI * 2 ),
            // z: Math.cos( i / length * Math.PI * 2 ),
            x: 0,
            y: Math.random() * 10,
            // ease: Sine.easeInOut
            ease: self.easingType
            // ease: Elastic.easeOut.config(1, 0.3)
          })
        }
        else if (type === 'collaborate') {
          TweenMax.to(elm.obj.position, easeTime, {
            x: self.colPos[i].pos.x,
            y: self.colPos[i].pos.y,
            z: self.colPos[i].pos.z,
            // ease: Sine.easeInOut
            ease: self.easingType
            // ease: Elastic.easeOut.config(1, 0.3)
          })
          if (self.colPos[i].rot) {
            TweenMax.to(elm.obj.rotation, easeTime, {
              x: self.colPos[i].rot.x,
              y: self.colPos[i].rot.y,
              z: self.colPos[i].rot.z,
              // ease: Sine.easeInOut
              ease: self.easingType
              // ease: Elastic.easeOut.config(1, 0.3)
            })
          }
          if (self.colPos[i].scale) {
            TweenMax.to(elm.obj.scale, easeTime, {
              x: self.colPos[i].scale.x,
              y: self.colPos[i].scale.y,
              z: self.colPos[i].scale.z,
              // ease: Sine.easeInOut
              ease: self.easingType
              // ease: Elastic.easeOut.config(1, 0.3)
            })
          }
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
      // var index = 0
      // var length = this.grid.rows * this.grid.cols
      // for (let i = 0; i < length; i++) {
      //   var mesh = this.allObjects[i]
        
      //   // Group mesh tween
      //   self.setGroupMeshPos(0, 0, 0)        
        
      //   var size = self.orgSize * 5

      //   if (type === 'position') {
      //     // Look at direction
      //     // mesh.lookAt(mesh.position)
      //     // Scale
      //     TweenMax.to(mesh.scale, self.stdTime, {
      //       x: size,
      //       y: size,
      //       z: size
      //     })
      //     TweenMax.to(mesh.position, self.stdTime, {
      //       x: Math.sin( i / length * Math.PI * 2 ) * self.ringSize,
      //       z: Math.cos( i / length * Math.PI * 2 ) * self.ringSize,
      //       // ease: Sine.easeInOut,
      //       // ease: Elastic.easeOut.config(1, 0.3)
      //     })
      //   }
      //   else if (type === 'scale') {
      //     mesh.lookAt(self.groupMesh.position)
      //     // mesh.lookAt(new THREE.Vector3(0,0,0))
      //     // if (!self.beenHereOnce) {
      //     //   mesh.lookAt(self.groupMesh.position)
      //     //   self.beenHereOnce = true
      //     // }
      //     // if (self.lastLayout === self.layout) {
      //     //   return
      //     // }
      //     TweenMax.to(mesh.scale, self.stdTime, {
      //       x: size,
      //       y: size,
      //       z: self.lineSize,
      //       // ease: Sine.easeIn,
      //       // ease: Expo.easeOut,
      //       onComplete: () => {
      //         // self.beenHereOnce = true
      //       }
      //     });
      //     self.lastLayout = self.layout
      //   }
      // }
    },
    changeVal (e, val) {
      var self = this
      // console.log(self.floor.material)
      var target = e.target || e.srcElement
      console.log(e.target.name)
      if (target.name === 'grid') {
        self.floor.material.opacity = Number(val)
      }
      if (target.name === 'speed') {
        easeTime = map(val, 0, 1, 4, 0.2)
      }
      // self.floor.material.alphaMap = val
      // self.floor.material.alphaTest = Number(val)
    },
    setup() {
      var self = this
      // this.gutter = { size: 1.6 };
      this.gutter = { size: ((window.innerWidth / 6) * 0.06) }
      this.meshes = [];
      this.allObjects = [];
      // this.grid = cols: 20, rows: 8 } : { cols: 6, rows: 8 }
      // this.grid = self.isLarge ? { cols: 20, rows: 8 } : { cols: 6, rows: 8 }
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.mouse3D = new THREE.Vector2();
      this.geometries = [
        // new Box({size: self.orgSize}),
        // new Sphere({size: self.orgSize}),
        // new Cone(),
        // new Torus(),
        // new Cylinder(),
      ];

      this.raycaster = new THREE.Raycaster()
    },
    init() {
      var self = this
      if (process.browser) {
        this.setup();
        this.createScene()
        this.createCamera();
        
        self.setupPrism()

        this.createObjects();

        self.textureLoader = new THREE.TextureLoader()
        this.addFloor()
        
        this.addAmbientLight();
        this.addSpotLight();
        // this.addRectLight();
        // this.addPointLight(0xfff000, { x: 0, y: 10, z: -100 });
        // this.addPointLight(0x79573e, { x: 100, y: 10, z: 0 });
        // this.addPointLight(0xc27439, { x: 20, y: 5, z: 20 });
        this.animate();

        // Shape group
        
        self.group = new THREE.Group()
				self.group.position.y = 10
        self.scene.add( self.group )

        // Set ease type
        // easingType = Elastic.easeOut.config(1, 0.3)

        this.setupKeyPresses()

        // Axes helper
        // this.addGuides();
        self.setOrbitControls()

        window.addEventListener('resize', this.onResize.bind(this));
        // window.addEventListener('mousemove', this.onMouseMove.bind(this), false); // org
        // window.addEventListener('mousemove', this.onMouseMove.bind(this), false); // org
        // this.onMouseMove({ clientX: 0, clientY: 0 }); // org
        
        // Mouse move event listener
        window.addEventListener('mousemove', (e) => {
          // self.tweenLinesWithCursor(e)
          // self.calulateDistance(e)
          self.onMouseMove(e)
        }, false);
        // Touch event listener
        window.addEventListener('touchmove', (e) => {
          var touch = e.targetTouches[0];
          self.onMouseMove(touch)
        }, false);

      }
    },
    createScene() {
      var self = this
      
      // Get container
      self.container = document.querySelector('#sceneContainer')

      this.scene = new THREE.Scene()

      // Add fog
      self.scene.fog = new THREE.Fog(0xFFFFFF, 0, 300);

      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      this.renderer.setSize(window.innerWidth, window.innerHeight)
      this.renderer.setPixelRatio(window.devicePixelRatio)

      // Should shadows be turned on
      if (self.shadowsOn) {
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      }

      self.container.appendChild(self.renderer.domElement)
      // document.body.appendChild(this.renderer.domElement); // org
    },
    createCamera() {
      // this.camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 1)
      var self = this
      var dist = 120
      this.camera = new THREE.OrthographicCamera( window.innerWidth / - dist, window.innerWidth / dist, window.innerHeight / dist, window.innerHeight / -dist, - 500, 1000)
      this.camera.position.set(0, 65, 0)
      this.camera.rotation.x = -1.57
      this.scene.add(this.camera)
    },
    addGuides () {
      var axesHelper = new THREE.AxesHelper( 5 );
      this.scene.add( axesHelper );
    },
    addAmbientLight() {
      const light = new THREE.AmbientLight('#ffffff', 1);
      this.scene.add(light);
    },
    addSpotLight() {
      const ligh = new THREE.SpotLight('#7bccd7', 1, 1000);
      ligh.position.set(0, 27, 0);
      ligh.castShadow = true;
      // Soften the edge of the light contact
      ligh.penumbra = 0.8
      this.scene.add(ligh);
    },
    addRectLight() {
      const light = new THREE.RectAreaLight('#341212', 1, 2000, 2000);
      light.position.set(5, 50, 50);
      light.lookAt(0, 0, 0);
      this.scene.add(light);
    },
    addPointLight(color, position) {
      const light = new THREE.PointLight(color, 1, 1000, 1);
      light.position.set(position.x, position.y, position.z);
      this.scene.add(light);
    },
    addFloor() {
      var self = this
      
      var material = new THREE.MeshPhongMaterial({ color: 0xFFFFFF })
      self.floor = new THREE.Mesh(new THREE.BoxGeometry(1000, 0.2, 1000), material)  

      // grid texture
      self.textureLoader.load('textures/grid.png', function (texture) {
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        texture.repeat.set(1000, 1000)
        self.floor.material.map = texture
        self.floor.material.transparent = true
        self.floor.material.needsUpdate = true
      })

      this.scene.add(self.floor)
      self.floor.material.opacity = 0

      // const geometry = new THREE.PlaneGeometry(100, 100);
      // const material = new THREE.ShadowMaterial({ opacity: .3 });

      // this.floor = new THREE.Mesh(geometry, material);
      // this.floor.position.y = 0;
      // this.floor.receiveShadow = true;
      // this.floor.rotateX(- Math.PI / 2);

      // this.scene.add(this.floor);
    },
    getRandomColor() {
      return this.colors[Math.floor(Math.random() * Math.floor(this.colors.length))];
    },
    getRandomGeometry() {
      return this.geometries[Math.floor(Math.random() * Math.floor(this.geometries.length))];
    },
    resetCamera () {
      var self = this
      self.camera.position.set(0, 65, 0)
      self.camera.rotation.x = 0
      self.camera.rotation.y = 0
      self.camera.rotation.z = 0
      self.controls.reset()
      console.log('reset camera')
    },
    setupKeyPresses() {
      var self = this
      document.addEventListener('keyup', event => {
        let code = event.keyCode
        console.log(code)
        // R
        if (code === 82) {
          // self.resetRotation()
          self.resetCamera()
        }
        // 1
        if (code === 49) {
          // self.resetRotation()
          self.tweenObject('default')
        }
        // 2
        if (code === 50) {
          // self.resetRotation()
          self.tweenObject('collaborate')
        }
        // 3
        if (code === 51) {
          // self.resetRotation()
          self.tweenObject('collapse')
        }
        // G
        if (code === 71) {
          // self.resetRotation()
          self.tweenObject('spreadout')
        }
        // Isometry
        if (code === 73) {
          self.setCamera('isometry')
        }
        // Frontal
        if (code === 79) {
          self.setCamera('frontal')
        }
        // If 1, 2, 3 ... pressed
        // if (code === 49) { self.changeLayout('horizontal', 'keystroke') } 
        // if (code === 50) { self.changeLayout('vertical', 'keystroke') } 
        // if (code === 51) { self.changeLayout('grid', 'keystroke') } 
        // if (code === 82) { self.resetRotation() }
        // if () 
      })
    },
    changeLayout (target, src) {
      // console.log(target.name)
      var self = this
      var name
      if (src == 'button') {
        name = target.getAttribute('name')
      } else {
        name = target
      }
      switch (name) {
        case 'horizontal':
          // console.log('line')
          self.layout = 0
          break
        case 'circular':
          // console.log('grid')
          self.layout = 1
          break
        default:
      }
    },
    createObjects() {

      var self = this

      this.groupMesh = new THREE.Object3D()

      // const material = new THREE.MeshPhysicalMaterial({
      //   // color: '#3e2917',
      //   color: '#050505',
      //   // metalness: .58,
      //   // emissive: '#000000',
      //   roughness: .05,
      // });

      self.materialObjs = new THREE.MeshPhongMaterial({
        color: 0x000000,    // red (can also use a CSS color string here)
        flatShading: true,
      });

      // Make logo objects
      self.logoShapes.forEach((elm, i) => {
        var mesh = null
        if (elm.type === 'rect') {
          // mesh = new THREE.Mesh(new THREE.BoxGeometry(elm.size.w, elm.size.h, 0.1), self.materialObjs)
          mesh = new THREE.Mesh(new SimpleBox({size: elm.size}).geom, self.materialObjs)
        }
        else if (elm.type === 'cylinder') {
          mesh = new THREE.Mesh(new SimpleCylinder({size: elm.size}).geom, self.materialObjs)
        }
        else if (elm.type === 'prism') {
          // Make prism shape
          mesh = self.addShape( self.triangleShape, self.extrudeSettings, 0x000000, elm.pos.x, elm.pos.y, elm.pos.z, elm.rot.x, elm.rot.y, elm.rot.z, 1 )
        }

        mesh.position.x = elm.pos.x
        mesh.position.y = elm.pos.y
        mesh.position.z = elm.pos.z
        // mesh.position.set( new THREE.Vector3(elm.pos.x, elm.pos.y, elm.pos.z) )

        // var colorS = '0x' + Math.floor(Math.random()*16777215).toString(16)
        // var colorS = self.getRandomColor()
        if (debug) {
          var colorS = self.colors[i]
          if (mesh.material.color) {
            mesh.material.color.setHex( colorS )
            console.log('has color: ', colorS)
          }
        }

        // Shadow settings
        // mesh.castShadow = true
        // mesh.receiveShadow = true

        // // Add to group
        self.groupMesh.add(mesh)
        // self.scene.add(mesh)

        console.log('making')

        elm.obj = mesh
      })

      // Will make grid of selected random geometries
      // self.createGrid(self.materialObjs)

      // const centerX = -(this.grid.cols / 2) * this.gutter.size - 1;
      // const centerZ = -(this.grid.rows / 2) - .8;
      // const centerX = -((this.grid.cols / 4) + (this.grid.cols / 2));
      // const centerZ = -(this.grid.rows / 2);
      // const centerX = -(this.grid.cols / multiplier);
      // isLarge - cols: 20, rows: 8. sm - cols: 6, rows: 8
      // self.centerX = -((this.grid.cols / 1) * (this.gutter.size / 2) - (this.gutter.size / 2))
      // // const centerX = -(this.grid.cols / 2) * this.gutter.size - 1;
      // self.centerZ = -(this.grid.rows / 2);

      // console.log('windowW: ', self.window.w)
      // console.log('size: ', self.gutter.size)

      // Offset groupMesh
      this.groupMesh.position.set(-1, 0, 1)

      // this.posGroupMeshOrg = new THREE.Vector3(centerX, 0, centerZ)

      this.scene.add(this.groupMesh);
    },
    createGrid (objs) {
      var self = this
      for (let row = 0; row < this.grid.rows; row++) {
        this.meshes[row] = [];
        var colStart = 1
        for (let col = 0; col < this.grid.cols; col++) {
          const geometry = this.getRandomGeometry();
          const mesh = this.getMesh(geometry.geom, objs)

          // mesh.position.x = col + (col * this.gutter.size) + (totalCol === this.grid.cols ? 0 : 2.5);
          // mesh.position.z = row + (row * (this.gutter.size / 2));
          // mesh.position.x = 0;
          var multiplier = 2
          var xPos = ((col * multiplier) * (this.gutter.size / 2))
          mesh.position.x = xPos;
          mesh.position.y = 0;
          mesh.position.z = ((row * multiplier) * (this.gutter.size / 2));

          mesh.rotation.x = geometry.rotationX;
          mesh.rotation.y = geometry.rotationY;
          mesh.rotation.z = geometry.rotationZ;

          mesh.initialRotation = {
            x: mesh.rotation.x,
            y: mesh.rotation.y,
            z: mesh.rotation.z,
          };

          this.groupMesh.add(mesh);

          this.meshes[row][col] = mesh;
          this.allObjects.push(mesh)

          // console.log('xPos: ', xPos.toFixed(2))

          self.hasBeenDistributed = true
        }
      }
    },
    setGroupMeshPos(x, y, z) {
      var self = this
      // Group mesh tween
      TweenMax.to(self.groupMesh.position, self.stdTime, {
        x: x,
        y: y,
        z: z
      })
    },
    resetGrid () {
      var self = this

      // Reset pos of group mesh
      // self.groupMesh.position.set(self.posGroupMeshOrg)
      
      // Group mesh tween
      self.setGroupMeshPos(self.centerX, 0, self.centerZ)

      for (let row = 0; row < this.grid.rows; row++) {
        var colStart = 1
        for (let col = 0; col < this.grid.cols; col++) {
          const geometry = this.getRandomGeometry();
          const mesh = self.meshes[row][col]

          // mesh.position.x = col + (col * this.gutter.size) + (totalCol === this.grid.cols ? 0 : 2.5);
          // mesh.position.z = row + (row * (this.gutter.size / 2));
          // mesh.position.x = 0;
          var multiplier = 2
          var xPos = ((col * multiplier) * (this.gutter.size / 2))
          
          TweenMax.to(mesh.position, self.stdTime, {
            x: xPos,
            y: 0,
            z: ((row * multiplier) * (this.gutter.size / 2))
          })

          // mesh.rotation.x = geometry.rotationX;
          // mesh.rotation.y = geometry.rotationY;
          // mesh.rotation.z = geometry.rotationZ;

          // mesh.initialRotation = {
          //   x: mesh.rotation.x,
          //   y: mesh.rotation.y,
          //   z: mesh.rotation.z,
          // };

        }
      }
    },
    setCamera(kind) {
      var self = this
      if (kind === 'isometry') {
        self.camera.position.set( 20, 20, -20 );
        // self.camera.rotation.order = 'YXZ';
        self.camera.rotation.y = - Math.PI / 4;
        self.camera.rotation.x = Math.atan( - 1 / Math.sqrt( 2 ) )
      }
      else if (kind === 'frontal') {
        self.camera.position.set( 20, 20, 0 )
      }
      self.controls.update()
    },
    getTotalRows(col) {
      return (col % 2 === 0 ? this.grid.cols : this.grid.cols - 1);
    },
    getMesh(geometry, material) {
      const mesh = new THREE.Mesh(geometry, material);

      mesh.castShadow = true;
      mesh.receiveShadow = true;

      return mesh;
    },
    getCoordinates ( element, camera ) {
      var self = this
      var screenVector = new THREE.Vector3();
      element.localToWorld( screenVector );
      screenVector.project( self.camera );
      var posx = Math.round(( screenVector.x + 1 ) * self.renderer.domElement.offsetWidth / 2 );
      var posy = Math.round(( 1 - screenVector.y ) * self.renderer.domElement.offsetHeight / 2 );

      // console.log(' posx, posy ');
      // console.log( posx, posy );
      // self.
      self.popOverInfoPos.x = posx
      self.popOverInfoPos.y = posy
      // self.popOverInfo.show = true

      setTimeout(() => {
        self.canShow = true
        if (self.canPlacePopover) {
          // setTimeout(() => {
          //   self.canPlacePopover = true
          // }, 5000)
          // self.canPlacePopover = false
        }
        // self.canPlacePopover = true
      }, 300)
    },
    draw() {
      var self = this

      this.raycaster.setFromCamera(this.mouse3D, this.camera);

      const intersects = this.raycaster.intersectObjects([this.floor]);
      // const intersectsSpheres = this.raycaster.intersectObjects([this.geometries[0].geom]);

      // if (intersectsSpheres.length) {
      //   console.log('hitting sphere')
      // }

      var intersectsObjects = self.raycaster.intersectObjects(
        self.scene.children,
        true
      )

      if (intersectsObjects.length) {
        // console.log(self.canShow)
        if (self.lastHovered === intersectsObjects[0].object) {
          // console.log('is same')
          // if (self.canShow) {
          //   self.canShow = false
          // }
          self.canPlacePopover = false
        } else {
          if (intersectsObjects[0].object.geometry.type === 'SphereGeometry') {
            // console.log('is different')
            self.canPlacePopover = true
            // setTimeout(() => {
            //   self.canShow = true
            // }, 200)
            self.getCoordinates(intersectsObjects[0].object)
          } else {
            self.canShow = false
          }
        }
        if (intersectsObjects[0].object.geometry.type === 'SphereGeometry') {
          // console.log('intersects: ', intersectsObjects[0].object.position)
          // Get coordinates
        }
        // else if (intersectsObjects[0].object.geometry.type === 'PlaneGeometry') {
        //   self.canShow = false
        // }
        self.lastHovered = intersectsObjects[0].object
      }
      // if (self.canPlacePopover) {
      // }

      // if (intersects.length) {
      //   const { x, z } = intersects[0].point;

      //   for (let row = 0; row < this.grid.rows; row++) {
      //     // for (let index = 0; index < 1; index++) {
      //     //   const totalCols = this.getTotalRows(row);

      //     for (let col = 0; col < this.grid.cols; col++) {
      //       const mesh = this.meshes[row][col];

      //       const mouseDistance = distance(x, z,
      //         mesh.position.x + this.groupMesh.position.x,
      //         mesh.position.z + this.groupMesh.position.z);

      //       const y = map(mouseDistance, 7, 0, 0, 6);
      //       TweenMax.to(mesh.position, self.stdTime * 0.5, { y: y < 1 ? 1 : y });

      //       const scaleFactor = mesh.position.y / 1.2;
      //       const scale = scaleFactor < 1 ? 0.5 : (scaleFactor / 2);
      //       if (self.layout === 0) {
      //         TweenMax.to(mesh.scale, self.stdTime * 0.5, {
      //           ease: Expo.easeOut,
      //           x: scale,
      //           y: scale,
      //           z: scale,
      //         });
      //       }

      //       // TweenMax.to(mesh.rotation, .7, {
      //       //   ease: Expo.easeOut,
      //       //   x: map(mesh.position.y, -1, 1, radians(270), mesh.initialRotation.x),
      //       //   z: map(mesh.position.y, -1, 1, radians(-90), mesh.initialRotation.z),
      //       //   y: map(mesh.position.y, -1, 1, radians(45), mesh.initialRotation.y),
      //       // });
      //     }
      //     // }
      //   }
      // }
    },
    onMouseMove({ clientX, clientY }) {
      this.mouse3D.x = (clientX / this.width) * 2 - 1;
      this.mouse3D.y = -(clientY / this.height) * 2 + 1;
    },
    onResize() {
      var self = this
      var frustumSize = 15

      this.width = window.innerWidth;
      this.height = window.innerHeight;

      // Perspective cam
      this.camera.aspect = this.width / this.height;

      // Orthographic cam
      var aspect = this.width / this.height
      self.camera.left = frustumSize * aspect / - 2
      self.camera.right = frustumSize * aspect / 2
      self.camera.top = frustumSize / 2
      self.camera.bottom = - frustumSize / 2

      this.camera.updateProjectionMatrix()
      this.renderer.setSize(this.width, this.height)

      // Get window width
      self.window = {w: window.innerWidth, h: window.innerHeight}
      // console.log('windowW: ', self.window.w)
    },
    animate() {
      var self = this
      this.draw();
      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(this.animate.bind(this));

      // if (self.hasBeenDistributed) {
      //   self.updateObjects()
      // }
    },
    updateObjects() {
      var self = this
      // console.log('getting in here')
      if (self.lastLayout === self.layout) {
        return
      }
      setTimeout(() => {
        if (self.layout === 0) {
          // console.log('layout 0')
          self.resetGrid()
          // console.log('111111')
        }
        // Layout line x axis and squeezed
        else if (self.layout === 1) {
          self.tweenObject('position')
          // console.log('222222')
        }
        else if (self.layout === 2) {
          self.tweenObject('scale')
          // console.log('333333')
        }
      }, 100)
      
      self.lastLayout = self.layout
    },
    setOrbitControls () {
      var self = this
      self.controls = new OrbitControls( self.camera, self.renderer.domElement );
      self.controls.enablePan = false
      self.controls.addEventListener('change', e => {
        console.log('e is: ', self.controls)
      })
      // self.controls.enableDamping = true
      // self.controls.zoomSpeed = 0.2
      // self.controls.minDistance = 1
      // self.controls.maxDistance = 100
      // self.controls.minZoom = 100
      self.controls.maxZoom = parseFloat(20)
      // Avoid going under floor
      self.controls.maxPolarAngle = (Math.PI * 0.5) * 0.99
      // self.controls.addEventListener('change', self.requestRenderIfNotRequested)
    }
  }
};
</script>

<style lang="scss" scoped>
#sceneContainer {
  margin: 0;
  width: 100%;
  height: 100%;
  // z-index: 11111;
}
</style>
