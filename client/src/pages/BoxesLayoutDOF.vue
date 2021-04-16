<template lang="pug">
  .container.outer.black-bg(ref="master_cont")
    canvas(ref="dof_cont")
</template>
 
<script>

// Example
// https://threejs.org/examples/?q=post#webgl_postprocessing_dof2

// import * as THREE from 'three'
import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { SAOPass } from 'three/examples/jsm/postprocessing/SAOPass.js'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js'

import Box from '@/assets/js/elements/box'
// import Sphere from './elements/sphere'
import Button from '@/assets/js/elements/button.js'

import { TweenMax, Expo, Bounce } from 'gsap'
// import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls.js'

import { BokehShader, BokehDepthShader } from '@/assets/js/shaders/BokehShader2.js'

export default {
  name: 'Boxes',
  data () {
    return {
      container: null,
      scene: null,
      camera: null,
      composer: null,
      renderPass: null,
      saoPass: null,
      fxaaPass: null,
      materialDepth: null,
      postprocessing: { enabled: true },
      shaderSettings: {
        rings: 3,
        samples: 4
      },
      config: {
        debug: null,
        touch: null,
      },
      mouse: null,
      raycaster: null,
      distance: 100,
      target: null,
      effectController: {
        enabled: true,
        jsDepthCalculation: true,
        shaderFocus: false,
        fstop: 2.2,
        maxblur: 1.5,
        showFocus: false,
        focalDepth: 2.8,
        manualdof: false,
        vignetting: false,
        depthblur: false,
        threshold: 0.5,
        gain: 2.0,
        bias: 0.5,
        fringe: 0.7,
        focalLength: 35,
        noise: true,
        pentagon: false,
        dithering: 0.0001
      },
      leaves: 100,
      boxAttr: {
        size: 30
      },
      gutter: { size: 1 },
      grid: {
        cols: 9,
        rows: 1,
        depth: 1
      },
      width: window.innerWidth,
      height: window.innerHeight,
      mouse3D: null,
      meshes: [],
      allCubes: [],
      positions: [],
      collectFirst: true,
      canMove: false,
      curCam: null,
      greyMaterial: null,
      camPos: {x: 280, y: 280, z: 280},
      virgin: true,
      annotation: document.querySelector('.annotation'),
      spriteBehindObject: null,
      sprite: null,
      cam: [
        {
          name: 'top',
          pos: { x: 0.00001, y: 250, z: 0 },
          show: true
        },
        {
          name: 'front',
          pos: { x: 500, y: 0, z: 0 },
          show: false
        },
        {
          name: 'left',
          pos: { x: 0, y: 30, z: 250 },
          show: false
        }
      ],
      buttons: [
        {
          name: 'horizontal',
          color: 'green',
          pos: { x: 20, y: 20 },
          img: 'icon-center-horizontally.svg',
          imgIndex: 0
        },
        {
          name: 'vertical',
          color: 'red',
          pos: { x: 20, y: 60 },
          img: 'icon-center-vertically.svg',
          imgIndex: 1
        },
        {
          name: 'grid',
          color: 'red',
          pos: { x: 20, y: 60 },
          img: 'icon-distribute-grid2d.svg',
          imgIndex: 2
        },
        {
          name: 'camera-front',
          color: 'red',
          pos: { x: 20, y: 120 },
          img: 'icon-center-vertically.svg',
          imgIndex: 3
        },
        {
          name: 'camera-top',
          color: 'red',
          pos: { x: 20, y: 180 },
          img: 'icon-center-vertically.svg',
          imgIndex: 4
        },
        {
          name: 'camera-left',
          color: 'red',
          pos: { x: 20, y: 200 },
          img: 'icon-camera-left.svg',
          imgIndex: 5
        },
        {
          name: 'reset-boxes',
          color: 'red',
          pos: { x: 20, y: 210 },
          img: 'icon-reset-boxes.svg',
          imgIndex: 6
        },
      ],
      layout: [true, false, false],
      startPos: { x: 0, y: 0, z: 0 }
    }
  },
  async mounted () {
    var self = this
    // windowHalfX: window.innerWidth / 2, windowHalfY: window.innerHeight / 2,
    
    self.mouse3D = new self.$gThree.Vector2()
    self.greyMaterial = new self.$gThree.MeshPhongMaterial({
      // specular: 0xffffff,
      // envMap: textureInstance,
      // shininess: 50,
      // reflectivity: 1.0,
      flatShading: true
    })
    self.mouse = new self.$gThree.Vector2()
    self.raycaster = new self.$gThree.Raycaster()
    self.target = new self.$gThree.Vector3(-5, 20, 0)

    setTimeout(() => {
      self.init()
    }, 200)
  },
  beforeDestroy () {
    var self = this
    // console.log('before destroy')
    window.cancelAnimationFrame( self.reqAnim );
    // Dispose objects
    self.gui.destroy()
    // Dispose controls
    if (self.controls.dispose()) {
      self.controls.dispose()
    }
    while(self.scene.children.length > 0){
      // console.log('before destroying: ', self.scene.children[0])
      self.scene.remove(self.scene.children[0]);
    }
  }, 
  methods: {
    setConfig() {
      var self = this
      self.config.debug = window.location.hash === '#debug'
      self.config.touch = false
      window.addEventListener('touchstart', () => {
        self.config.touch = true
        // this.world.controls.setTouch()// 
      }, { once: true })
      window.addEventListener('mousemove', () => {
        self.onMouseMove.bind(self)
      }, { passive: true })
    },
    setDebug() {
      var self = this
      if (self.config.debug) {
        self.debug = new GUI({ width: 250 })
        // GUI.toggleHide()
        self.debug.closed = true
      }
    },
    init () {
      var self = this

      self.container = self.$refs.dof_cont
      // self.container = document.createElement('div')
      // document.body.appendChild(self.container)
      // self.renderer = self.renderer
      // self.container.appendChild( self.renderer.domElement );

      // Make new camera
      self.camera = new self.$gThree.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        1,
        3000
      )

      self.camera.position.x = self.camPos.x
      self.camera.position.y = self.camPos.y
      self.camera.position.z = self.camPos.z

      self.scene = new self.$gThree.Scene()
      self.scene.add(self.camera)

      // Set camera target
      self.camera.lookAt(self.target)

      self.scene.fog = new self.$gThree.Fog(0x000000, 30, 1200)

      self.renderer = new self.$gThree.WebGLRenderer({
        canvas: self.container,
        alpha: true,
        antialias: true
      })
      // Set clear color
      self.renderer.setClearColor( 0x000000, 0 ); //default

      self.renderer.setPixelRatio(window.devicePixelRatio)
      self.renderer.setSize(window.innerWidth, window.innerHeight)
      // Extra settings for renderer
      self.renderer.physicallyCorrectLights = true
      self.renderer.gammaFactor = 2.2
      self.renderer.gammaOutPut = true
      self.renderer.autoClear = false
      // self.renderer.shadowMapSoft = true
      self.renderer.shadowMap.enabled = true
      self.renderer.shadowMap.type = self.$gThree.PCFSoftShadowMap
      // self.container.appendChild(self.renderer.domElement)

      var depthShader = BokehDepthShader

      self.materialDepth = new self.$gThree.ShaderMaterial({
        uniforms: depthShader.uniforms,
        vertexShader: depthShader.vertexShader,
        fragmentShader: depthShader.fragmentShader
      })

      self.materialDepth.uniforms['mNear'].value = self.camera.near
      self.materialDepth.uniforms['mFar'].value = self.camera.far

      // LIGHTS
      self.setupLight()

      self.initPostprocessing()

      // self.stats = new Stats()
      // self.container.appendChild(self.stats.dom)

      document.addEventListener('mousemove', self.onDocumentMouseMove, false)
      document.addEventListener('touchstart', self.onDocumentTouchStart, false)
      document.addEventListener('touchmove', self.onDocumentTouchMove, false)
      
      // window.addEventListener(
      //   'resize',
      //   () => {
      //     self.onWindowResize()
      //   },
      //   false
      //   )
      // alert('inhere')
        
      self.setConfig()
      self.setDebug()

      // self.drawGuides() // Will draw the axis lines
      self.createGrid()
      self.createFloor()
      // self.createLights()
      self.setupButtons()
      // self.render()

      // This is the Ambient occlusion effect. Doesnt work well with DOF
      // this.makeComposer()

      self.lastTouch()
      // self.setupSprite()

      // this.setOrbits()
      this.setupKeyPresses()

      // Orbit controls
      self.setOrbitControls()

      // Listen for resize
      window.addEventListener( 'resize', self.onWindowResize, false );
      
      self.render()

    },
    createFloor () {
      var self = this
      // Floor or plane
      let floorMaterial = new self.$gThree.MeshPhongMaterial({
        color: 0x808080,
        // depthWrite: false,
        flatShading: true
      })

      // Floor Plane
      var plane = new self.$gThree.Mesh(
        new self.$gThree.PlaneBufferGeometry(2000, 2000),
        // this.greyMaterial
        floorMaterial
      )
      plane.rotation.x = -Math.PI / 2
      plane.position.y = -(self.boxAttr.size / 2)
      this.scene.add(plane)
      plane.receiveShadow = true
    },
    onMouseMove({ clientX, clientY }) {
      this.mouse3D.x = (clientX / this.width) * 2 - 1;
      this.mouse3D.y = -(clientY / this.height) * 2 + 1;
    },
    setupLight() {
      var self = this
      var hemisphereLight = new self.$gThree.HemisphereLight(0xffffff,0x000000, .5)
      hemisphereLight.position.set( 0, 50, 0 );
      
      var shadowLight = new self.$gThree.DirectionalLight(0xfedc7d, 1);
      shadowLight.position.set(0, 450, 350);
      shadowLight.castShadow = true;
    
      shadowLight.shadow.camera.left = -650;
      shadowLight.shadow.camera.right = 650;
      shadowLight.shadow.camera.top = 650;
      shadowLight.shadow.camera.bottom = -650;
      shadowLight.shadow.camera.near = 1;
      shadowLight.shadow.camera.far = 1000;
    
      shadowLight.shadow.mapSize.width = 4096;
      shadowLight.shadow.mapSize.height = 4096;
      
      var light2 = new self.$gThree.DirectionalLight(0x7dc0e4, .5);
      light2.position.set(-600, 350, 350);
      
      var light3 = new self.$gThree.DirectionalLight(0xff5050, .15);
      light3.position.set(0, -250, 300);
    
      self.scene.add(hemisphereLight);  
      self.scene.add(shadowLight);
      self.scene.add(light2);
      self.scene.add(light3);

      var hemiLightHelper = new self.$gThree.HemisphereLightHelper( hemisphereLight, 10 );
      self.scene.add( hemiLightHelper );

      // var camLight = new self.$gThree.PointLight(0xff0000, 200, 40);
      // camLight.position.copy(new self.$gThree.Vector3(0,0,0)).sub(self.camera.position);
      // self.camera.add(camLight);

      // LIGHTS
      // var hemiLight = new self.$gThree.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
      // hemiLight.color.setHSL( 0.6, 1, 0.6 );
      // hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
      // hemiLight.position.set( 0, 50, 0 );
      // self.scene.add( hemiLight );

      // var hemiLightHelper = new self.$gThree.HemisphereLightHelper( hemiLight, 10 );
      // self.scene.add( hemiLightHelper );

      // // Directional light
      // var dirLight = new self.$gThree.DirectionalLight( 0xffffff, 1 );
      // dirLight.color.setHSL( 0.1, 1, 0.95 );
      // dirLight.position.set( - 1, 1.75, 1 );
      // dirLight.position.multiplyScalar( 30 );
      // self.scene.add( dirLight );
      // dirLight.castShadow = true;
      // dirLight.shadow.radius = 8;

      // // dirLight.shadow.mapSize.width = 2048;
      // // dirLight.shadow.mapSize.height = 2048;
      // dirLight.shadow.mapSize.width = 4092; // 2x = 8184
      // dirLight.shadow.mapSize.height = 4092;

      // var d = 500;

      // dirLight.shadow.camera.left = - d;
      // dirLight.shadow.camera.right = d;
      // dirLight.shadow.camera.top = d;
      // dirLight.shadow.camera.bottom = - d;

      // dirLight.shadow.camera.far = 3500;
      // dirLight.shadow.bias = - 0.0001;
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
          console.log('line')
          this.layout[0] = true
          this.layout[1] = false
          this.layout[2] = false
          break
        case 'vertical':
          console.log('grid')
          this.layout[1] = true
          this.layout[0] = false
          this.layout[2] = false
          break
        case 'grid':
          console.log('grid')
          this.layout[2] = true
          this.layout[0] = false
          this.layout[1] = false
          break
        case 'camera-front':
          // console.log('grid')
          this.canMove = true
          self.cam[0].show = true
          self.cam[1].show = false
          this.curCam = self.cam[0]
          break
        case 'camera-top':
          // console.log('grid')
          this.canMove = true
          self.cam[1].show = true
          self.cam[0].show = false
          this.curCam = self.cam[1]
          break
        case 'camera-left':
          // console.log('grid')
          this.canMove = true
          self.cam[2].show = true
          self.cam[1].show = false
          self.cam[0].show = false
          this.curCam = self.cam[2]
          // var newTarget = new self.$gThree.Vector3(0, self.boxAttr.size * 1, 0) // + self.target maybe
          // self.camera.lookAt(newTarget)
          break
        case 'reset-boxes':
          self.resetRotation()
          break
        default:
      }
      // for (let row = 0; row < this.grid.rows; row++) {
      //   for (let index = 0; index < 1; index++) {
      //     const totalCols = this.getTotalRows(row)
      //     for (let col = 0; col < totalCols; col++) {
      //       const obj = new Object()
      //       obj.mesh = this.meshes[row][col].mesh
      //       obj.pos = this.meshes[row][col].positions
      //       TweenMax.to(obj.mesh.position, 0.3, {
      //         x: obj.pos[1].x,
      //         y: obj.pos[1].y,
      //         z: obj.pos[1].z
      //       })
      //     }
      //   }
      // }
    },
    resetRotation() {
      var self = this
      self.allCubes.forEach(element => {
        console.log(element.mesh.rotation)
        // element.mesh.rotation.x = 0
        TweenMax.to(element.mesh.rotation, 0.7, {
          ease: Expo.easeOut,
          // x: Math.PI
          x: 0
        })
        // element.mesh.geometry.position(new self.$gThree.Vector3(2,2,0))
      });
    },  
    createGrid () {
      var self = this
      // alert('create grid')
      self.groupMesh = new self.$gThree.Object3D()

      // console.log('coming in here: 1')

      for (var col = 0; col < self.grid.cols; col++) {
        // console.log('coming in here: 2')
        self.meshes[col] = []
        for (var row = 0; row < self.grid.rows; row++) {
          // console.log('coming in here: 3', self.meshes[col])
          // const totalCols = self.getTotalRows(row)
          for (var depth = 0; depth < self.grid.depth; depth++) {
            // const geometry = self.getRandomGeometry()
            // const geometry = self.geometries[0]
            const geometry = new Box({
              size: self.boxAttr.size
            })
            // const geometry = new Sphere({size: self.boxAttr.size})
            // const mesh = self.getMesh(geometry.geom, self.greyMaterial)
            const mesh = self.getMesh(geometry.geom, geometry.material)
            console.log('mesh: ' + geometry.size)
            var boxObject = new Object()
            boxObject = {
              mesh: mesh,
              geometry: geometry,
              positions: []
            }
            self.allCubes.push(boxObject)

            var pos1 = boxObject.positions[0]
            // var offset = row - self.grid.rows.length / 2
            pos1 = {
              // x: self.boxAttr.size + self.gutter.size,
              x: (col * (self.boxAttr.size * 2)) - ((self.grid.cols * (self.boxAttr.size * 2)) / 2),
              y: 0,
              z: 0.5
            }
            var pos2 = boxObject.positions[1]
            pos2 = {
              x: (col * ((self.boxAttr.size / 5))) - ((self.grid.cols * (self.boxAttr.size/5)) / 2),
              y: 0,
              z: 0.5
            }
            var pos3 = boxObject.positions[2]
            pos3 = {
              x: 2,
              y: (col * (self.boxAttr.size * 2)) - ((self.grid.cols * (self.boxAttr.size * 2)) / 2),
              z: row / 1
            }
            self.collectFirst = false
            // console.log('mesh: ' + JSON.stringify(mesh))

            // mesh.position.y = 0
            // mesh.position.x = col + col * self.gutter.size + (totalCol === self.grid.cols ? 0 : 2.5)
            // mesh.position.z = row + row * (index + 0.25)

            // self.positions

            mesh.position.y = pos1.x
            mesh.position.x = pos1.y
            mesh.position.z = pos1.z

            // mesh.rotation.x = geometry.rotationX
            // mesh.rotation.y = geometry.rotationY
            // mesh.rotation.z = geometry.rotationZ

            mesh.rotation.x = 0
            mesh.rotation.y = 0
            mesh.rotation.z = 0

            mesh.initialRotation = {
              x: mesh.rotation.x,
              y: mesh.rotation.y,
              z: mesh.rotation.z
            }

            self.groupMesh.add(mesh)

            self.meshes[row][col] = { mesh: mesh, positions: [pos1, pos2, pos3] }
          }
        }
      }

      // const centerX = -(this.grid.cols / 2) * this.gutter.size - 1
      // const centerZ = -(this.grid.rows / 2) - 0.8

      const centerX = -this.grid.cols / 2
      const centerZ = 0

      self.groupMesh.position.set(centerX, 0, centerZ)

      self.scene.add(self.groupMesh)
    },
    updateDatGUI() {
      // var gui = new GUI()
      var self = this
      var gui = self.debug
      // Mat changer
      var matChanger = function () {
        for (var e in self.effectController) {
          if (e in self.postprocessing.bokeh_uniforms) {
            self.postprocessing.bokeh_uniforms[e].value = self.effectController[e]
          }
        }
        self.postprocessing.enabled = self.effectController.enabled
        self.postprocessing.bokeh_uniforms['znear'].value = self.camera.near
        self.postprocessing.bokeh_uniforms['zfar'].value = self.camera.far
        self.camera.setFocalLength(self.effectController.focalLength)
      }
      gui.add(self.effectController, 'enabled').onChange(matChanger)
      gui.add(self.effectController, 'jsDepthCalculation').onChange(matChanger)
      gui.add(self.effectController, 'shaderFocus').onChange(matChanger)
      gui
        .add(self.effectController, 'focalDepth', 0.0, 200.0)
        .listen()
        .onChange(matChanger)
      gui.add(self.effectController, 'fstop', 0.1, 22, 0.001).onChange(matChanger)
      gui
        .add(self.effectController, 'maxblur', 0.0, 5.0, 0.025)
        .onChange(matChanger)
      gui.add(self.effectController, 'showFocus').onChange(matChanger)
      gui.add(self.effectController, 'manualdof').onChange(matChanger)
      gui.add(self.effectController, 'vignetting').onChange(matChanger)
      gui.add(self.effectController, 'depthblur').onChange(matChanger)
      gui
        .add(self.effectController, 'threshold', 0, 1, 0.001)
        .onChange(matChanger)
      gui.add(self.effectController, 'gain', 0, 100, 0.001).onChange(matChanger)
      gui.add(self.effectController, 'bias', 0, 3, 0.001).onChange(matChanger)
      gui.add(self.effectController, 'fringe', 0, 5, 0.001).onChange(matChanger)
      gui
        .add(self.effectController, 'focalLength', 16, 80, 0.001)
        .onChange(matChanger)
      gui.add(self.effectController, 'noise').onChange(matChanger)
      gui
        .add(self.effectController, 'dithering', 0, 0.001, 0.0001)
        .onChange(matChanger)
      gui.add(self.effectController, 'pentagon').onChange(matChanger)
      gui
        .add(self.shaderSettings, 'rings', 1, 8)
        .step(1)
        .onChange(self.shaderUpdate)
      gui
        .add(self.shaderSettings, 'samples', 1, 13)
        .step(1)
        .onChange(self.shaderUpdate)

      matChanger()
    },
    getMesh (geometry, material) {
      var self = this
      const mesh = new self.$gThree.Mesh(geometry, material)
      mesh.castShadow = true
      mesh.receiveShadow = true
      return mesh
    },
    // object, timing in secs, x, y, z
    tweenObject(obj, time, pos) {
      var self = this
      TweenMax.to(obj, time, {
        ease: Expo.easeOut,
        x: pos.x,
        y: pos.y,
        z: pos.z,
        onComplete: self.myFunction()
      })
    },
    myFunction() {
      // console.log('is done')
    },
    updateBoxes () {
      var self = this
      // Decide which layout
      if (self.canMove) {
        self.tweenObject(self.camera.position, 1, self.curCam.pos)
        // self.tweenObject(self.camera.rotation, 1, new self.$gThree.Vector3(-1.5, 0, 1.5))
        self.canMove = false
      }
      // if (self.cam[0].show && self.canMove) {
      //   // Make the scale tween
      //   self.tweenObject(self.camera.position, 1.5, 0, 500, 10)
      //   self.canMove = false
      // } else if (self.cam[1].show && self.canMove) {
      //   self.tweenObject(self.camera.position, 1.5, 500, 0, 0)
      //   self.canMove = false
      // }
      if (self.layout[0]) {
        // console.log('intersects: ' + x)
        for (var col = 0; col < self.grid.cols; col++) {
          for (var row = 0; row < self.grid.rows; row++) {
            // const totalCols = self.getTotalRows(row)
            for (var depth = 0; depth < self.grid.depth; depth++) {
              const obj = new Object()
              obj.mesh = self.meshes[row][col].mesh
              obj.pos = self.meshes[row][col].positions
              // Position tween happens here
              // cons/t y = map(mouseDistance, 7, 0, 0, 6) // Org
              // const y = map(mouseDistance, 4, 0, 0, 4)
              // TweenMax.to(mesh.position, 0.3, { y: y < 1 ? 1 : y })
              TweenMax.to(obj.mesh.position, 0.3, {
                x: obj.pos[0].x,
                y: obj.pos[0].y,
                z: obj.pos[0].z,
                ease: Bounce.easeOut
              })
              // Position tween happens here - end
              
              // Make the scale tween
              self.tweenObject(obj.mesh.scale, 1.5, new self.$gThree.Vector3(1, 1, 1))

              // Rotation happens here
              // TweenMax.to(mesh.rotation, 0.7, {
              //   ease: Expo.easeOut,
              //   x: map(
              //     mesh.position.y,
              //     -1,
              //     1,
              //     radians(270),
              //     mesh.initialRotation.x
              //   ),
              //   z: map(
              //     mesh.position.y,
              //     -1,
              //     1,
              //     radians(-90),
              //     mesh.initialRotation.z
              //   ),
              //   y: map(
              //     mesh.position.y,
              //     -1,
              //     1,
              //     radians(45),
              //     mesh.initialRotation.y
              //   )
              // })
              // Rotation happens here - end
            }
          }
        }
      }
      // Layout line x axis and squeezed
      else if (self.layout[1]) {
        // console.log('nope')
        for (let col = 0; col < this.grid.cols; col++) {
          for (let row = 0; row < this.grid.rows; row++) {
            for (let depth = 0; depth < this.grid.depth; depth++) {
              const obj = new Object()
              obj.mesh = this.meshes[row][col].mesh
              obj.pos = this.meshes[row][col].positions
              TweenMax.to(obj.mesh.position, 0.3, {
                x: obj.pos[1].x,
                y: obj.pos[1].y,
                z: obj.pos[1].z
              })
              // Scale happens here
              // const scaleFactor = mesh.position.y / 1.2
              // const scale = scaleFactor < 1 ? 1 : scaleFactor
              // return
              // const scaleVal = map(mouseDistance, 4, 0, 1, 2)
              // console.log(mouseDistance)
              // const scale = (1 / y) * 0.1
              // const scale = scaleVal
              // Make the scale tween
              self.tweenObject(obj.mesh.scale, 3, new self.$gThree.Vector3(0.1, 1, 1))
              // Scale happens here - end
            }
          }
        }
      }
      // Layout grid
      else if (self.layout[2]) {
        // console.log('nope')
        for (let col = 0; col < this.grid.cols; col++) {
          var x = col * self.boxAttr.size - (self.boxAttr.size)
          var y = 0
          var threshold = {sm: 2, lg: 5}
          for (let row = 0; row < this.grid.rows; row++) {
            // const totalCols = this.getTotalRows(row)
            for (let depth = 0; depth < this.grid.depth; depth++) {
              const obj = new Object()
              obj.mesh = this.meshes[row][col].mesh
              obj.pos = this.meshes[row][col].positions
              // Make the position tween
              // if (3 % col == 0) {
              if (col > threshold.sm) {
                y = self.boxAttr.size
                x -= (self.boxAttr.size * (threshold.sm + 1))
              }
              if (col > threshold.lg) {
                y = self.boxAttr.size * 2
                x -= (self.boxAttr.size * (threshold.sm + 1))
              }
              console.log('col: ' + col + ', row: ' + row + ', depth: ' + depth)
              var newPos = new self.$gThree.Vector3(x, y, 0)
              // self.tweenObject(obj.mesh.position, 3, obj.pos[2])
              self.tweenObject(obj.mesh.position, 3, newPos)
              // Make the scale tween
              self.tweenObject(obj.mesh.scale, 1.5, new self.$gThree.Vector3(1, 1, 1))
            }
          }
        }
      }

      // Intersections
      // self.raycaster.setFromCamera(self.mouse3D, self.camera)
      // const intersects = self.raycaster.intersectObjects([self.floor])
      // // const intersects = this.raycaster.intersectObjects([this.allCubes[0].mesh])

      // console.log('intersects: ' + intersects)
      // if (intersects.length) {
      //   const { x, z } = intersects[0].point
      //   console.log('intersects: ' + x)
      //   for (let row = 0; row < this.grid.rows; row++) {
      //     for (let index = 0; index < 1; index++) {
      //       const totalCols = this.getTotalRows(row)

      //       // for (let col = 0; col < totalCols; col++) {
      //       //   const obj = new Object()
      //       //   obj.mesh = this.meshes[row][col].mesh
      //       //   obj.pos = this.meshes[row][col].positions

      //       //   const mouseDistance = distance(
      //       //     x,
      //       //     z,
      //       //     obj.mesh.position.x + this.groupMesh.position.x,
      //       //     obj.mesh.position.z + this.groupMesh.position.z
      //       //   )
      //       //   // Position tween happens here - end

      //       //   // Rotation happens here
      //       //   TweenMax.to(mesh.rotation, 0.7, {
      //       //     ease: Expo.easeOut,
      //       //     x: map(
      //       //       mesh.position.y,
      //       //       -1,
      //       //       1,
      //       //       radians(270),
      //       //       mesh.initialRotation.x
      //       //     ),
      //       //     z: map(
      //       //       mesh.position.y,
      //       //       -1,
      //       //       1,
      //       //       radians(-90),
      //       //       mesh.initialRotation.z
      //       //     ),
      //       //     y: map(
      //       //       mesh.position.y,
      //       //       -1,
      //       //       1,
      //       //       radians(45),
      //       //       mesh.initialRotation.y
      //       //     )
      //       //   })
      //       //   // Rotation happens here - end
      //       // }
      //     }
      //   }
      // }
    },
    onDocumentMouseMove (event) {
      var self = this
      self.mouse.x = (event.clientX - self.windowHalfX) / self.windowHalfX
      self.mouse.y = -(event.clientY - self.windowHalfY) / self.windowHalfY

      self.postprocessing.bokeh_uniforms['focusCoords'].value.set(
        event.clientX / window.innerWidth,
        1 - event.clientY / window.innerHeight
      )
    },
    onDocumentTouchStart (event) {
      var self = this
      if (event.touches.length == 1) {
        // event.preventDefault()
        self.mouse.x = (event.touches[0].pageX - self.windowHalfX) / self.windowHalfX
        self.mouse.y = -(event.touches[0].pageY - self.windowHalfY) / self.windowHalfY
      }
    },
    onDocumentTouchMove (event) {
      var self = this
      if (event.touches.length == 1) {
        // event.preventDefault()
        self.mouse.x = (event.touches[0].pageX - self.windowHalfX) / self.windowHalfX
        self.mouse.y = -(event.touches[0].pageY - self.windowHalfY) / self.windowHalfY
      }
    },
    initPostprocessing () {
      var self = this
      self.postprocessing.scene = new self.$gThree.Scene()

      self.postprocessing.camera = new self.$gThree.OrthographicCamera(
        window.innerWidth / -2,
        window.innerWidth / 2,
        window.innerHeight / 2,
        window.innerHeight / -2,
        -10000,
        10000
      )
      self.postprocessing.camera.position.z = 100

      self.postprocessing.scene.add(self.postprocessing.camera)

      var pars = {
        minFilter: self.$gThree.LinearFilter,
        magFilter: self.$gThree.LinearFilter,
        format: self.$gThree.RGBFormat
      }
      self.postprocessing.rtTextureDepth = new self.$gThree.WebGLRenderTarget(
        window.innerWidth,
        window.innerHeight,
        pars
      )
      self.postprocessing.rtTextureColor = new self.$gThree.WebGLRenderTarget(
        window.innerWidth,
        window.innerHeight,
        pars
      )

      var bokeh_shader = BokehShader

      self.postprocessing.bokeh_uniforms = self.$gThree.UniformsUtils.clone(
        bokeh_shader.uniforms
      )

      self.postprocessing.bokeh_uniforms[
        'tColor'
      ].value = self.postprocessing.rtTextureColor.texture
      self.postprocessing.bokeh_uniforms[
        'tDepth'
      ].value = self.postprocessing.rtTextureDepth.texture
      self.postprocessing.bokeh_uniforms['textureWidth'].value = window.innerWidth
      self.postprocessing.bokeh_uniforms['textureHeight'].value =
        window.innerHeight

      self.postprocessing.materialBokeh = new self.$gThree.ShaderMaterial({
        uniforms: self.postprocessing.bokeh_uniforms,
        vertexShader: bokeh_shader.vertexShader,
        fragmentShader: bokeh_shader.fragmentShader,
        defines: {
          RINGS: self.shaderSettings.rings,
          SAMPLES: self.shaderSettings.samples
        }
      })

      self.postprocessing.quad = new self.$gThree.Mesh(
        new self.$gThree.PlaneBufferGeometry(window.innerWidth, window.innerHeight),
        self.postprocessing.materialBokeh
      )
      self.postprocessing.quad.position.z = -500
      self.postprocessing.scene.add(self.postprocessing.quad)
    },
    shaderUpdate () {
      var self = this
      self.postprocessing.materialBokeh.defines.RINGS = self.shaderSettings.rings
      self.postprocessing.materialBokeh.defines.SAMPLES = self.shaderSettings.samples
      self.postprocessing.materialBokeh.needsUpdate = true
    },
    render () {
      var self = this
      // var time = Date.now() * 0.00015
      
      // Set camera target
      self.camera.lookAt(self.target)

      self.renderer.render(self.scene, self.camera)
      self.updateBoxes()
      // console.log('rendering')
      self.reqAnim = requestAnimationFrame( self.render.bind(this) )
      self.renderEverythingElse()
    },
    renderEverythingElse () {
      var self = this
      self.camera.updateMatrixWorld()
      if (self.effectController.jsDepthCalculation) {
        self.raycaster.setFromCamera(self.mouse, self.camera)
        var intersects = self.raycaster.intersectObjects(
          self.scene.children,
          true
        )
        // console.log('intersects: ' + JSON.stringify(intersects[0]))
        if (intersects.length && intersects[0].object.geometry.type === 'BoxGeometry') {
          var object = intersects[0].object
          if (object.geometry.type === 'BoxGeometry') {
            // console.log('hit a box')
            // self.tweenObject(object.position, 3, new self.$gThree.Vector3(0.1, 1, 1))
            // object.rotation.x += 1
            // Rotate it on hover
            // TweenMax.to(object.rotation, 0.7, {
            //   ease: Expo.easeOut,
            //   // x: Math.PI
            //   x: object.rotation.x += 0.05
            // })
            // Rotate it on hover - end
            // var facesLength = object.geometry.faces.length;
            // for ( var i = 0; i < facesLength; i++ ) {
            //   var face = object.geometry.faces[ i ];
            //   face.color.setStyle("#0066FF");
            // }
          }
          // if (self.virgin) {
          //   self.virgin = false
          // }
          // console.log('object: ' + intersects[0].object.metadata)
          // intersects[0].object.scale.set(2,2,2)
        }

        var targetDistance = intersects.length > 0 ? intersects[0].distance : 1000

        self.distance += (targetDistance - self.distance) * 0.03

        var sdistance = self.smoothstep(
          self.camera.near,
          self.camera.far,
          self.distance
        )

        var ldistance = self.linearize(1 - sdistance)

        self.postprocessing.bokeh_uniforms['focalDepth'].value = ldistance

        self.effectController['focalDepth'] = ldistance
      }

      // for (var i = 0; i < self.leaves; i++) {
      //   var plane = self.planes[i]
      //   // plane.rotation.x += plane.rotation.dx
      //   // plane.rotation.y += plane.rotation.dy
      //   // plane.rotation.z += plane.rotation.dz
      //   // plane.position.y -= 2
      //   // plane.position.x += plane.position.dx
      //   // plane.position.z += plane.position.dz

      //   // if (plane.position.y < 0) plane.position.y += 300
      // }

      if (self.postprocessing.enabled) {
        
        self.renderer.clear()

        // render scene into texture

        self.renderer.setRenderTarget(self.postprocessing.rtTextureColor)
        self.renderer.clear()
        self.renderer.render(self.scene, self.camera)

        // render depth into texture

        self.scene.overrideMaterial = self.materialDepth
        self.renderer.setRenderTarget(self.postprocessing.rtTextureDepth)
        self.renderer.clear()
        self.renderer.render(self.scene, self.camera)
        self.scene.overrideMaterial = null

        // render bokeh composite

        self.renderer.setRenderTarget(null)
        self.renderer.render(
          self.postprocessing.scene,
          self.postprocessing.camera
        )
      } else {
        self.scene.overrideMaterial = null

        self.renderer.setRenderTarget(null)
        self.renderer.clear()
        self.renderer.render(self.scene, self.camera)
      }

      // render the composer
      if (self.composer) {
        self.composer.render()
      }

      // Update updateAnnotationOpacity
      // self.updateAnnotationOpacity()
      // self.updateScreenPosition()
    },
    linearize (depth) {
      var zfar = this.camera.far
      var znear = this.camera.near
      return (-zfar * znear) / (depth * (zfar - znear) - zfar)
    },
    smoothstep (near, far, depth) {
      var x = this.saturate((depth - near) / (far - near))
      return x * x * (3 - 2 * x)
    },
    saturate (x) {
      return Math.max(0, Math.min(1, x))
    },
    setOrbitControls () {
      var self = this
      self.controls = new OrbitControls( self.camera, self.renderer.domElement );
      self.controls.enablePan = false
      // self.controls.enableDamping = true
      // self.controls.zoomSpeed = 0.2
      // self.controls.addEventListener('change', self.requestRenderIfNotRequested)
    },
    setupKeyPresses() {
      var self = this
      document.addEventListener('keyup', event => {
        let code = event.keyCode
        console.log(code)
        // If 1, 2, 3 ... pressed
        if (code === 49) { self.changeLayout('horizontal', 'keystroke') } 
        if (code === 50) { self.changeLayout('vertical', 'keystroke') } 
        if (code === 51) { self.changeLayout('grid', 'keystroke') } 
        if (code === 82) { self.resetRotation() } 
      })
    },
    setupButtons () {
      var self = this
      var bA = this.buttons // Button array
      for (var i = 0; i < bA.length; i++) {
        var button = new Button({
          name: bA[i].name,
          color: bA[i].color,
          pos: {x: bA[i].pos.x, y: 24 + (i * 60)}, // normal space
          // pos: {x: 80, y: 80 + (i * 60)}, // more space, for insta video
          imgIndex: bA[i].imgIndex,
          cont: self.$refs.master_cont // tell which container to append to
          // img: bA[i].img
        })
        // console.log('setting up buttons')
        this.buttons.domElem = button
        var el = this.buttons.domElem.button
        el.addEventListener('click', e => {
          e.preventDefault()
          var target = e.target || e.srcElement
          self.changeLayout(target, 'button')
          // // Reset camera target just in case
          // self.camera.lookAt(new self.$gThree.Vector3(0,0,0))
          // setTimeout(() => {
          //   // console.log(target)
          // }, 1000)
        })
        // el.addEventListener('touchstart', self.changeLayout)
        // el.addEventListener('touchstart' || 'click', self.changeLayout)
      }
      // document.body.appendChild(button)
    },
    drawGuides () {
      var axesHelper = new self.$gThree.AxesHelper(5)
      this.scene.add(axesHelper)
    },
    lastTouch() {
      var self = this
      if (self.config.debug) {
        // Run dat gui
        self.updateDatGUI()
      }
    },
    setupSprite () {
      var self = this
      console.log('running okay')
      const numberTexture = new self.$gThree.CanvasTexture(
        // document.querySelector('#number')
        document.querySelector('#containerBoxes')
      );

      const spriteMaterial = new self.$gThree.SpriteMaterial({
        map: numberTexture,
        alphaTest: 0.5,
        transparent: true,
        depthTest: false,
        depthWrite: false
      });

      self.sprite = new self.$gThree.Sprite(spriteMaterial);
      // self.sprite.position.set(0, 0, 0);
      // self.sprite.scale.set(60, 60, 1);

      self.scene.add(self.sprite);
    },
    makeComposer () {
      var self = this
      self.composer = new EffectComposer( self.renderer );
      self.renderPass = new RenderPass( self.scene, self.camera );
      self.composer.addPass( self.renderPass );
      self.saoPass = new SAOPass( self.scene, self.camera, false, true );
      self.composer.addPass( self.saoPass )
      self.fxaaPass = new ShaderPass( FXAAShader )
      self.composer.addPass( self.fxaaPass )

      var gui = self.debug

      // adding sao
      gui.add( self.saoPass.params, 'output', {
        'Beauty': SAOPass.OUTPUT.Beauty,
        'Beauty+SAO': SAOPass.OUTPUT.Default,
        'SAO': SAOPass.OUTPUT.SAO,
        'Depth': SAOPass.OUTPUT.Depth,
        'Normal': SAOPass.OUTPUT.Normal
      } ).onChange( function ( value ) {

        self.saoPass.params.output = parseInt( value );

      } );
      gui.add( self.saoPass.params, 'saoBias', - 1, 1 );
      gui.add( self.saoPass.params, 'saoIntensity', 0, 1 );
      gui.add( self.saoPass.params, 'saoScale', 0, 10 );
      gui.add( self.saoPass.params, 'saoKernelRadius', 1, 100 );
      gui.add( self.saoPass.params, 'saoMinResolution', 0, 1 );
      gui.add( self.saoPass.params, 'saoBlur' );
      gui.add( self.saoPass.params, 'saoBlurRadius', 0, 200 );
      gui.add( self.saoPass.params, 'saoBlurStdDev', 0.5, 150 );
      gui.add( self.saoPass.params, 'saoBlurDepthCutoff', 0.0, 0.1 );
    },
    onWindowResize () {
      var self = this

      self.camera.aspect = window.innerWidth / window.innerHeight
      self.camera.updateProjectionMatrix()

      self.windowHalfX = window.innerWidth / 2
      self.windowHalfY = window.innerHeight / 2

      self.postprocessing.rtTextureDepth.setSize(
        window.innerWidth,
        window.innerHeight
      )
      self.postprocessing.rtTextureColor.setSize(
        window.innerWidth,
        window.innerHeight
      )

      self.postprocessing.bokeh_uniforms['textureWidth'].value = window.innerWidth
      self.postprocessing.bokeh_uniforms['textureHeight'].value =
        window.innerHeight

      self.renderer.setSize(window.innerWidth, window.innerHeight)
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>

</style>
