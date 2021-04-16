<template lang="pug">
  .container.outer.black-bg(ref="master_cont")
    #containerGodRays(ref="cont_god_rays")
    Controls(:settings="settings" :event="'click'")
</template>
 
<script>

// Example
// http://jeromeetienne.github.io/threex.volumetricspotlight/examples/basic.html
// 
// Light
// https://threejsfundamentals.org/threejs/lessons/threejs-lights.html

// import * as THREE from 'three'
import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'

// import { DragControls } from 'three/examples/jsm/controls/DragControls.js'
import { VertexNormalsHelper } from 'three/examples/jsm/helpers/VertexNormalsHelper.js';
import { FaceNormalsHelper } from 'three/examples/jsm/helpers/FaceNormalsHelper.js';

import Controls from '@/components/gui/Controls'

// import Box from '@/assets/js/elements/box'
// import Sphere from './elements/sphere'
// import VolMat from '@/assets/js/volumetric/volumetricspotlightmaterial.js'
// import VolGUI from '@/assets/js/volumetric/volumetricspotlightmaterialdatgui.js'
// import { VolumetricSpotLightMaterial } from '@/assets/js/volumetric/volumetricspotlightmaterial.js'
// import { addVolumetricSpotlightMaterial2DatGui } from '@/assets/js/volumetric/volumetricspotlightmaterialdatgui.js'

const vertexShader = require('@/assets/js/volumetric/vertexShader.glsl')
const fragmentShader = require('@/assets/js/volumetric/fragmentShader.glsl')

import { map } from '@/assets/js/helpers'

import globalFunctions from '@/mixins/globalFunctions.js'

// import { TweenMax, Expo, Bounce } from 'gsap'

const path = 'audio/'

const sounds = [
  {obj: null, name: 'spotlight', filename: 'spotlight-grubzyy-s-on.mp3'},
]

export default {
  name: 'Boxes',
  mixins: [globalFunctions],
  data () {
    return {
      container: null,
      scene: null,
      camera: null,
      renderer: null,
      // clock: null,
      time: 0,
      spotLight: null,
      areaLight: null,
      coneMesh: null,
      // GUI
      params: {
				anglePower: 0.6,
				attenuation: 8.1,
      },
      // Drag controls
      objects: [],
      enableSelection: false,
      mouse: null,
      raycaster: null,
      group: null,
      canMoveAround: false,
      // Slider settings  
      settings: [
        {name: 'Lights',
          checkbox: [
            {name: 'Spotlight', checked: true},
            {name: 'Show guides', checked: true},
          ]
        },
        {name: '',
          sliders: [
            {name: 'Angle Power', value: 0},
          ]
        },
        {name: '2',
          sliders: [
            {name: 'Attenuation', value: 0.5}
          ]
        }
      ],
      sceneSettings: null,
      // Guides and helpers
      axesHelper: null,
      allGuides: [],
      // Audio related
      audioLoader: [],
      analyser1: null,
      listener: null,
      easeTime: 0.15,
      // Controls
      controls: null,
      tControls: null,
      runThis: 0,
      mouseDown: false,
      oneIsBusy: false,
      lookAtPoint: null,
    }
  },
  components: {
    Controls
  },
  async mounted () {
    var self = this
    // self.clock = new THREE.Clock()
    self.mouse = new self.$gThree.Vector2()
    self.raycaster = new self.$gThree.Raycaster()

    // See if FXs should be rendered
    self.sceneSettings = self.getKeyByValue('Lights', self.settings)

    // windowHalfX: window.innerWidth / 2, windowHalfY: window.innerHeight / 2,
    setTimeout(() => {
      self.makeShaderMaterial()
      self.init()
      // console.log('vol: ', VolMat)
    }, 1000)
  },
  beforeDestroy () {
    var self = this
    // console.log('before destroy')
    window.cancelAnimationFrame( self.reqAnim );
    
    // Audio
    self.listener.context.suspend()
    // Dispose objects
    // if (self.gui.destroy()) {
    //   self.gui.destroy()
    // }
    // Dispose controls
    if (typeof self.controls != 'undefined') {
      console.log('destroying controls')
      self.controls.dispose()
    }
    // self.controls.dispose()
    while(self.scene.children.length > 0){
      // console.log('before destroying: ', self.scene.children[0])
      self.scene.remove(self.scene.children[0]);
    }
  },
  methods: {
    changeVal(ob) {
      // Slider
      var self = this
      console.log('name: ', ob.name)
      if (ob.name === 'Angle Power') {
        self.material.uniforms['anglePower'].value = map(ob.value, 0, 1, 0.1, 10)
      }
      else if (ob.name === 'Attenuation') {
        self.material.uniforms['attenuation'].value = map(ob.value, 0, 1, 0, 10)
      }
      else if (ob.name === 'Spotlight') {
        self.spotLight.visible = !self.spotLight.visible
        self.coneMesh.visible = !self.coneMesh.visible
        // Play sound
        self.playSound(sounds[0].obj, 0.5)
        // console.log(sounds[0].obj)
      }
      else if (ob.name === 'Show guides') {
        self.axesHelper.visible = !self.axesHelper.visible
        for (var i = 0; i < self.allGuides.length; i++) {
          self.allGuides[i].visible = !self.allGuides[i].visible
          // console.log('ze guides')
          console.log(self.allGuides[i])
        }
        // self.allGuides.forEach((el, index) => {
        //   el.visible = !el.visible 
        // })
      }
      self.render()
    },
    makeShaderMaterial() {
      var self = this
      self.material = new self.$gThree.ShaderMaterial({
        uniforms: { 
          attenuation	: {
            type	: 'f',
            value	: self.params.attenuation
          },
          anglePower	: {
            type	: 'f',
            value	: 1.2
          },
          spotPosition		: {
            type	: 'v3',
            value	: new self.$gThree.Vector3( 0, 0, 0 )
          },
          lightColor	: {
            type	: 'c',
            value	: new self.$gThree.Color('cyan')
          },
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        // side		: self.$gThree.DoubleSide,
        // blending	: self.$gThree.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      })
    },
    init () {
      var self = this

      self.container = self.$refs.cont_god_rays
      self.renderer = self.$parent.renderer
      self.container.appendChild( self.renderer.domElement )

      // console.log(self.container)
      // renderer	= new self.$gThree.WebGLRenderer();
      // renderer.setSize( window.innerWidth, window.innerHeight );
      // document.body.appendChild( renderer.domElement );
      // renderer.setClearColor('black', 0 );

      self.lookAtPoint = new self.$gThree.Vector3(0, 0, 0)

      // var onRenderFcts = []
      self.scene	= new self.$gThree.Scene()
      // self.scene.fog	= new self.$gThree.FogExp2( 0x000000, 0.1, 400 )

      var farClipping = 500
      self.camera	= new self.$gThree.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, farClipping);
      // self.camera.position.set(0, 20, 25) // OrbitControls
      self.camera.position.set(0, 10, 15)

      self.initAudio()

      self.setOrbitControls()

      // self.camera.rotation.y = - Math.PI / 4
      // self.camera.rotation.x = Math.atan( - 1 / Math.sqrt( 2 ) )

      // Helper
      // var camHelper = new self.$gThree.CameraHelper( self.camera )
      // self.scene.add( camHelper )
      // self.camera.lookAt(self.scene.position)

      // Plane - start
      var floor = this.makePlane({
        color: 0x010101,
        // emissive: 0xff00ff,
        size: {w: 1000, d: 1000},
        subs: 100,
        rotation: Math.PI / 2,
        position: {x: 0, y: 0, z: 0}
      })
      self.scene.add( floor )
      // Plane - end

      // Cube - start
      var cube = this.makeCube({
        color: 0x020202,
        size: {x: 1, y: 1, z: 1},
        position: {x: 0, y: 0.5, z: 0}
      })
      self.scene.add( cube )
      
      // Add handles
      // self.control.attach( cube )
      
      // Add to objects array
      self.objects.push( cube )
      // Cube - end

      var sphere = this.makeSphere({
        color: 0x00f025,
        radius: 2,
        segments: {w: 16, h: 16},
        position: {x: 0, y: 2, z: -10}
      })
      self.scene.add(sphere)

      //////////////////////////////////////////////////////////////////////////////////
      //		add a volumetric spotligth					//
      //////////////////////////////////////////////////////////////////////////////////

      // add spot light
      var coneRadius = 2.5
      var lightAngle = coneRadius / 12
      var cone = new self.$gThree.CylinderGeometry( 0.1, coneRadius, 10, 32 * 2, 20, true);
      // var geometry	= new self.$gThree.CylinderGeometry( 0.1, 5*Math.cos(Math.PI/3)/1.5, 5, 32*2, 20, true);
      cone.applyMatrix4( new self.$gThree.Matrix4().makeTranslation( 0, -cone.parameters.height/2, 0 ) );
      cone.applyMatrix4( new self.$gThree.Matrix4().makeRotationX( -Math.PI / 2 ) );
      // geometry.computeVertexNormals()
      // var geometry	= new self.$gThree.BoxGeometry( 3, 1, 3 );
      // var material	= new self.$gThree.MeshNormalMaterial({
      // 	side	: self.$gThree.DoubleSide
      // });
      // var material	= new self.$gThree.MeshPhongMaterial({
      // 	color		: 0x000000,
      // 	wireframe	: true,
      // })
      self.coneMesh = new self.$gThree.Mesh( cone, self.material );
      self.coneMesh.position.set(1.5,8,0)
      // self.coneMesh.rotation.x = Math.PI / 2
      self.coneMesh.lookAt(self.lookAtPoint)
      self.material.uniforms.lightColor.value.set('white')
      self.material.uniforms.spotPosition.value	= self.coneMesh.position
      self.scene.add( self.coneMesh )

      // Attach coneMesh
      self.tControls.attach( self.coneMesh )
      self.scene.add( self.tControls )

      // Determine if shown or not on start
      self.coneMesh.visible = self.sceneSettings.checkbox[0].checked

      // Manage sound - start
      var i = 0
      self.audioLoader[i] = new self.$gThree.AudioLoader()

      var sound = new self.$gThree.PositionalAudio( self.listener );
      // sounds[i].obj = sound
      var sndPath = path + sounds[i].filename
      
      // Load sound
      self.loadSound(sound, i, sndPath)
      // Load text
      // self.loadText(i, sounds[i].name, {x: rX, y: rY, z: rZ})
      
      // console.log('it is 2, ', sndPath)
      self.coneMesh.add( sound );
      // Manage sound - end

      // Add to objects array
      self.objects.push( self.coneMesh )

      self.showGuides(self.coneMesh) // Normal
      // helper = new self.$gThree.FaceNormalsHelper( self.coneMesh, 2, 0x00ff00, 1 )
      // self.scene.add( helper )

      // Flip correctly
      // self.coneMesh.applyMatrix( new self.$gThree.Matrix4().makeRotationX( Math.PI / 2 ) )

      // add a DAT.Gui for fine tuning
      // new VolGUI.addVolumetricSpotlightMaterial2DatGui(material)

      //////////////////////////////////////////////////////////////////////////////////
      //		animate the volumetric spotLight				//
      //////////////////////////////////////////////////////////////////////////////////

      // onRenderFcts.push(function(delta, now){
      //   var angle	= 0.1 * Math.PI*2*now
      //   var target	= new self.$gThree.Vector3(1*Math.cos(angle),0,1*Math.sin(angle))
      //   mesh.lookAt(target)
      //   spotLight.target.position.copy(target)
      // })

      //////////////////////////////////////////////////////////////////////////////////
      //		link it with a spotLight					//
      //////////////////////////////////////////////////////////////////////////////////

      self.spotLight = new self.$gThree.SpotLight()
      // self.spotLight.position.set(new self.$gThree.Vector3(0,0,0))
      // self.spotLight.position.copy(self.coneMesh.position)
      // self.spotLight.rotation.copy(self.coneMesh.rotation)
      // self.spotLight.lookAt(self.lookAtPoint)
      // self.spotLight.quaternion.copy(self.coneMesh.quaternion)
      self.spotLight.color = self.coneMesh.material.uniforms.lightColor.value
      self.spotLight.exponent = 30
      self.spotLight.angle = lightAngle
      // self.spotLight.angle = 0 // Org: Math.PI/3
      self.spotLight.intensity = 5
      // Determine if shown or not on start
      self.spotLight.visible = self.sceneSettings.checkbox[0].checked

      // self.spotLight.intensity = 5
      
      // Correct rotation
      // self.spotLight.rotation.x = Math.PI / 180 * 90
      // self.spotLight.applyMatrix4( new self.$gThree.Matrix4().makeRotationX( Math.PI / 2 ) )

      // Soften the edge of the light contact
      self.spotLight.penumbra = 0.52
      // self.spotLight.target = self.coneMesh

      // self.spotLight.shadow.bias = -0.001

      // Place into scene
      self.coneMesh.add( self.spotLight )
      // self.scene.add( self.spotLight )
      // self.scene.add( self.spotLight.target )
      // Parent to cone
      // self.coneMesh.add( self.spotLight )
      // self.coneMesh.add( self.spotLight.target )

      var spotLightHelper = new self.$gThree.SpotLightHelper( self.spotLight );
      self.scene.add( spotLightHelper );
      self.allGuides.push( spotLightHelper )
      // renderer.shadowMapEnabled	= true

      // doesnt seems to work - not moving with the spotLight
      // var helper	= new self.$gThree.SpotLightHelper(spotLight)
      // scene.add(helper)
      // onRenderFcts.push(function(delta, now){
      // 	helper.update()
      // })


      var light	= self.spotLight
      light.castShadow = true

      // Add to objects array
      // self.objects.push( self.spotLight )
      
      // var d = 14;
      // light.shadow.bias = 0.01;
      // light.shadow.camera.fov	= 45
      // light.shadow.camera.left = -d
      // light.shadow.camera.right	= d
      // light.shadow.camera.top	= d
      // light.shadow.camera.bottom = - d
      
      // light.shadow.camera.near = 2 // 0.01
      // light.shadow.camera.far	= 50 // 150

      // // light.shadowCameraVisible = true

      // // light.shadow.bias = 0.0
      // // light.shadowDarkness	= 0.5

      // light.shadow.mapSize.width = 1024
      // light.shadow.mapSize.height	= 1024

      //////////////////////////////////////////////////////////////////////////////////
      //		Camera Controls							//
      //////////////////////////////////////////////////////////////////////////////////
      // var mouse	= {x : 0, y : 0}
      // document.addEventListener('mousemove', function(event){
      //   mouse.x	= (event.clientX / window.innerWidth ) - 0.5
      //   mouse.y	= (event.clientY / window.innerHeight) - 0.5
      // }, false)
      // onRenderFcts.push(function(delta, now){
      //   // camera.position.x += (mouse.x*5 - camera.position.x) * (delta*3)
      //   // camera.position.y += (mouse.y*5 - camera.position.y + 2) * (delta*3)
      //   // camera.lookAt( scene.position )
      // })

      // onRenderFcts.push(function(delta, now){
      // 	var angle	= 0.2 * Math.PI*2*now
      // 	camera.position.x	= 3*Math.cos(angle)
      // 	camera.position.z	= 3*Math.sin(angle)
      // 	mesh.lookAt(new self.$gThree.Vector3(0,0,0) )
      // })

      //////////////////////////////////////////////////////////////////////////////////
      //		render the scene						//
      //////////////////////////////////////////////////////////////////////////////////

      // onRenderFcts.push(function(){
      //   renderer.render(scene, camera);
      // })

      //////////////////////////////////////////////////////////////////////////////////
      //		loop runner							//
      //////////////////////////////////////////////////////////////////////////////////
      // var lastTimeMsec= null
      // requestAnimationFrame(function animate(nowMsec){
      //   // keep looping
      //   requestAnimationFrame( animate );
      //   // measure time
      //   lastTimeMsec	= lastTimeMsec || nowMsec-1000/60
      //   var deltaMsec	= Math.min(200, nowMsec - lastTimeMsec)
      //   lastTimeMsec	= nowMsec
      //   // call each update function
      //   onRenderFcts.forEach(function(onRenderFct){
      //     onRenderFct(deltaMsec/1000, nowMsec/1000)
      //   })
      // })

      // this.setOrbits()

      // Drag related
      self.group = new self.$gThree.Group()
			self.scene.add( self.group )

      // self.setupGUI()
      self.drawGuides()

      // // Orbit controls
      // self.setupLights()
      
      // self.dragControls()
      self.listenForKeyEvents()

      // // Listen for resize
      window.addEventListener( 'resize', self.onWindowResize, false );

      // document.addEventListener( 'click', self.onClick, false )
      // window.addEventListener( 'keydown', self.onKeyDown, false )
      // window.addEventListener( 'keyup', self.onKeyUp, false )
      

      var newLight = this.makeLight({
        type: 'point',
        color: 0x00ff00,
        pos: {x: -10, y: 14, z: 0}
      })
      // console.log(`light is: ${newLight}`)
      self.scene.add( newLight )

      // Set all guide states
      for (var i = 0; i < self.allGuides.length; i++) {
        var obj = self.getKeyByValue('Lights', self.settings)
        console.log('this is it')
        self.allGuides[i].visible = obj.checkbox[1].checked
      }
      
      self.render()

    },
    initAudio() {
      var self = this
      self.listener = new self.$gThree.AudioListener()
      self.listener.context.resume()
      self.camera.add( self.listener )
    },
    loadSound(sound, i, sndPath) {
      var self = this
      self.audioLoader[i].load( sndPath, function ( buffer ) {
        sound.setBuffer( buffer )
        sound.setRefDistance( 20 )
        sounds[i].obj = sound
        // sound.setLoop( true )
        // sound.play()
      })
      sounds[i].analyser = new self.$gThree.AudioAnalyser( sound, 32 );
      // console.log()
    },
    playSound(sound, delay) {
      var self = this
      setTimeout(() => {
        console.log(sound.isPlaying)
        if (sound.isPlaying) {
          sound.stop()
          sound.play()
        }
        else {
          sound.play()
        }
      }, delay)
    },
    showGuides(element) {
      var self = this
      // Show normals
      // var helper = new VertexNormalsHelper( element, 2, 0x00ff00, 1 )
      // self.scene.add( helper )
      var axesHelper = new self.$gThree.AxesHelper(20)
      element.add(axesHelper)
      self.allGuides.push( axesHelper )
    },
    setupLights() {
      var self = this
      self.areaLight = new self.$gThree.RectAreaLight( 0xffffff, 1, 10, 10 );
      self.areaLight.position.set( 10, 10, 0);
      // self.areaLight.rotation.set( -0.74719, 0.0001, 0.0001 );
      self.areaLight.width = 10;
      self.areaLight.height = 1;
      self.areaLight.applyMatrix4( new self.$gThree.Matrix4().makeRotationX( Math.PI / 2 ) )
      // self.areaLight.rotation.x = Math.PI / 2
      // self.areaLight.lookAt(0,0,0)
      self.scene.add( self.areaLight )
      self.showGuides( self.areaLight )

      var light = this.makeLight({
        type: 'point',
        color: 0xff8fe9,
        pos: {x: 0, y: 20, z: 0}
      })
      // console.log(`light is: ${newLight}`)
      self.scene.add( light )

      // var meshEmitter = self.createAreaEmitter( self.areaLight );
      // self.areaLight.add( meshEmitter );
    },
    setupGUI () {
      var self = this
      // GUI - start
			self.gui = new GUI()
			self.gui.add( self.params, 'anglePower', 0.1, 10 ).onChange( function ( value ) {
        // anglePower = uniforms['anglePower'].value
        self.material.uniforms['anglePower'].value = Number( value )
			})
			self.gui.add( self.params, 'attenuation', 0, 10 ).onChange( function ( value ) {
        // anglePower = uniforms['anglePower'].value
        self.material.uniforms['attenuation'].value = Number( value )
			})
      // GUI - end
    },
    render () {
      var self = this
      // var time = Date.now() * 0.00015
      
      // Set camera target
      // self.camera.lookAt(self.target)

      self.renderer.render(self.scene, self.camera)

      self.coneMesh.lookAt(self.lookAtPoint)

      // if (self.spotLight) {
      //   self.spotLight.position.copy(self.coneMesh.position)
      // }
      // self.spotLight.rotation.copy(self.coneMesh.rotation)
      // self.spotLight.quaternion.copy(self.coneMesh.quaternion)

      // console.log('rendering')
      // self.reqAnim = requestAnimationFrame( self.render.bind(this) )

      // Spotlight animation
      // const now = self.clock.getDelta()
      // var angle	= 0.1 * Math.PI * 2 * now
      // var target = new self.$gThree.Vector3(1 * Math.cos(angle), 0, 1 * Math.sin(angle))
      // self.coneMesh.lookAt(target)
      // self.spotLight.target.position.copy(target)

      // Log rendering
      // console.log(`rendering ${this.$route.path}`)

      // New animation
      // return
      // self.time += 0.0001
      // var angle	= 2 * Math.PI * 2 * self.time
      // var target = new self.$gThree.Vector3(1 * Math.cos(angle), 0, 1 * Math.sin(angle))
      // self.spotLight.lookAt(target)
      // self.spotLight.target.position.copy(target)

      // // self.spotLight.position.x = 5 * Math.cos(self.time) + 0
      // // self.spotLight.position.z = 5 * Math.sin(self.time) + 0 // These to strings make it work
      // // self.spotLight.lookAt(new self.$gThree.Vector3(0, 0, 0))
      
      // // Center at mouse position
      // self.coneMesh.position.copy(self.spotLight.position)
      // // Make it face toward the camera
      // self.coneMesh.quaternion.copy(self.spotLight.quaternion)


      // console.log('rendering')
      // New animation - end
    },
    createAreaEmitter( light ) {

      var geometry = new self.$gThree.BoxGeometry( 1, 1, 1 );
      var material = new self.$gThree.MeshBasicMaterial( { color: light.color.getHex(), vertexColors: self.$gThree.FaceColors } );

      var backColor = 0x222222;

      geometry.faces[ 5 ].color.setHex( backColor );
      geometry.faces[ 4 ].color.setHex( backColor );
      geometry.faces[ 2 ].color.setHex( backColor );
      geometry.faces[ 1 ].color.setHex( backColor );
      geometry.faces[ 0 ].color.setHex( backColor );

      var emitter = new self.$gThree.Mesh( geometry, material );
      emitter.scale.set( light.width * 2, 0.2, light.height * 2 );

      return emitter;

    },
    onKeyDown( event ) {
      this.enableSelection = ( event.keyCode === 16 ) ? true : false
    },
    onKeyUp() {
      this.enableSelection = false
    },
    setOrbitControls () {
      var self = this
      self.controls = new OrbitControls( self.camera, self.renderer.domElement )
      self.controls.update()
      self.controls.enablePan = false
      // self.controls.enableDamping = true
      self.controls.minDistance = 1
      self.controls.maxDistance = 100
      self.controls.maxPolarAngle = (Math.PI * 0.5) * 0.99
      self.controls.addEventListener( 'change', (evt) => {
        self.render()
        // console.log('dragging: ', evt.target)
      })

      self.tControls = new TransformControls( self.camera, self.renderer.domElement )
      self.tControls.addEventListener( 'change', self.render )

      self.tControls.addEventListener( 'dragging-changed', function ( event ) {
        self.controls.enabled = ! event.value
        // console.log(event)
      })

    },
    listenForKeyEvents() {
      var self = this
      window.addEventListener( 'keydown', function ( event ) {
        console.log('key code: ', event.keyCode)
        var key
        var isShift
        if (window.event) {
          key = window.event.keyCode
          isShift = !!window.event.shiftKey // typecast to boolean
        } else {
          key = ev.which
          isShift = !!ev.shiftKey
        }
        if (isShift) {
          // event.preventDefault()
        }
        switch ( event.keyCode ) {
          case 81: // Q
            self.tControls.setSpace( self.control.space === 'local' ? 'world' : 'local' )
            break
          case 16: // Shift
            self.tControls.setTranslationSnap( 100 )
            self.tControls.setRotationSnap( self.$gThree.MathUtils.degToRad( 15 ) )
            self.tControls.setScaleSnap( 0.25 )
            break
          case 87: // W
            self.tControls.setMode( 'translate' );
            break
          case 69: // E
            self.tControls.setMode( 'rotate' );
            break
          case 82: // R
            self.tControls.setMode( 'scale' );
            break
        }
      })

      window.addEventListener( 'keyup', function ( event ) {
        self.controls.enabled = true            
        switch ( event.keyCode ) {
          case 16: // Shift
            self.tControls.setTranslationSnap( null )
            self.tControls.setRotationSnap( null )
            self.tControls.setScaleSnap( null )
            break
        }
      })
    },
    drawGuides () {
      var self = this
      self.axesHelper = new self.$gThree.AxesHelper(5)
      self.allGuides.push( self.axesHelper )
      this.scene.add(self.axesHelper)
    },
    onWindowResize () {
      var self = this

      self.camera.aspect = window.innerWidth / window.innerHeight
      self.camera.updateProjectionMatrix()

      self.windowHalfX = window.innerWidth / 2
      self.windowHalfY = window.innerHeight / 2

      // self.renderer.setSize(window.innerWidth, window.innerHeight)
      self.$parent.renderer.setSize(window.innerWidth, window.innerHeight)
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>

</style>
