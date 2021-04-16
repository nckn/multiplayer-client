<template lang="pug">
  .container.outer.black-bg(ref="master_cont")
    #containerTransformControls(ref="cont_transform_ctls" name="container-tfctls")
    MenuOptions(:type="'top-left'" :options="guiControls" :closer="container")
    QuickOptions(:type="'top-left'" :options="quickOptions")
</template>

<script>

// import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'

import { TweenMax, TimelineMax, Sine, Back, Expo, Elastic } from 'gsap'

// import globalFunctions from '@/mixins/globalFunctions.js'

import { radians, map, distance } from '@/assets/js/helpers'

import MenuOptions from '@/components/gui/MenuOptions'
// import QuickOptions from '@/components/gui/QuickOptions'

export default {
  name: 'TFCtls',
  // props: ['layoutState'],
  // mixins: [globalFunctions],
  components: {
    MenuOptions,
    // QuickOptions
  },
  data () {
    return {
      container: null,
      scene: null,
      camera: null,
      cameraPersp: null,
      cameraOrtho: null,
      currentCamera: null,
      orbit: null,
      control: null,
      renderer: null,
      window: null,
      aspect: null,
      quickOptions: [
        {name: 'front', path: '/svg/icons/icon-camera-front.svg'},
        {name: 'top', path: '/svg/icons/icon-camera-top.svg'},
        {name: 'snap', path: '/svg/icons/icon-snap-on.svg'},
      ],
      guiControls: [
        {name: 'camerapos',
          enabled: true,
          methods: [
            {name: 'right', method: 'rotate', path: '/svg/icons/icon-camera-front.svg'},
            {name: 'top', method: 'rotate', path: '/svg/icons/icon-camera-top.svg'},
            {name: 'front', method: 'translate'},
          ]
        },
        {name: 'transforms',
          enabled: true,
          methods: [
            {name: 'scale', method: 'rotate'},
            {name: 'rotate', method: 'rotate'},
            {name: 'translate', method: 'translate'},
          ]
        },
        {name: 'space world',
          enabled: true,
          otherState: 'local',
          methods: [
            {name: 'handlex', method: 'translate'},
            {name: 'handley', method: 'rotate'},
            {name: 'handlez', method: 'rotate'},
          ]
        },
        {name: 'snap', enabled: false},
        // {name: 'togglecam', method: 'toggleCam'},
      ]
    }
  },
  mounted () {
    var self = this;

    // Get window width
    self.window = {w: window.innerWidth, h: window.innerHeight}

    // Check size of client
    // self.isLarge = self.checkIfLarge(768)

    setTimeout(() => {
      self.init()
    }, 1000)
    // self.$nextTick(
    //   self.init()
    // )
  },
  beforeDestroy () {
    var self = this
    // console.log('before destroy')
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
    // Reset options
    self.quickOptions = ''
  },
  methods: {
    clickedCommandInChild (obj) {
      var self = this
      // console.log('obj: ', obj.name)
      if (obj.name === 'camerapos') {
        self.toggleCamera()
        self.guiControls[0].enabled = !self.guiControls[0].enabled
      }
      else if (obj.name === 'front' || obj.name === 'top' || obj.name === 'right') {
        self.changeCameraPos(obj.name)
      }
      else if (obj.name === 'translate') {
        self.control.setMode( 'translate' )
      }
      else if (obj.name === 'rotate') {
        self.control.setMode( 'rotate' )
      }
      else if (obj.name === 'scale') {
        self.control.setMode( 'scale' )
      }
      else if (obj.name === 'transforms') {
        self.control.enabled = !self.control.enabled
        self.guiControls[1].enabled = !self.guiControls[1].enabled
        // self.control.setMode( 'scale' )
      }
      else if (obj.name === 'space world') {
        self.control.setSpace( self.control.space === 'local' ? 'world' : 'local' )
        self.guiControls[2].enabled = !self.guiControls[2].enabled
      }
      else if (obj.name === 'snap') {
        if (self.guiControls[3].enabled) {
          self.guiControls[3].enabled = false
          self.control.setTranslationSnap( null )
          self.control.setRotationSnap( null )
          self.control.setScaleSnap( null )
        }
        else {
          self.guiControls[3].enabled = true
          self.control.setTranslationSnap( 100 )
          self.control.setRotationSnap( self.$gThree.MathUtils.degToRad( 15 ) )
          self.control.setScaleSnap( 0.25 )
        }
      }
    },
    init() {
      var self = this

      // console.log('TransformControls: ')
      // console.log(TransformControls)
      // return

      self.container = self.$refs.cont_transform_ctls
      self.renderer = self.$parent.renderer
      self.container.appendChild( self.renderer.domElement )

      // Set closer
      // self.theCloser = self.container

      self.aspect = self.window.w / self.window.h

      self.cameraPersp = new self.$gThree.PerspectiveCamera( 50, self.aspect, 0.01, 30000 )
      self.cameraOrtho = new self.$gThree.OrthographicCamera( - 600 * self.aspect, 600 * self.aspect, 600, - 600, 0.01, 30000 )
      self.currentCamera = self.cameraPersp

      self.currentCamera.position.set( 1000, 500, 1000 )
      self.currentCamera.lookAt( 0, 200, 0 )

      self.scene = new self.$gThree.Scene()
      self.scene.add( new self.$gThree.GridHelper( 1000, 10 ) )

      var light = new self.$gThree.DirectionalLight( 0xffffff, 2 )
      light.position.set( 1, 1, 1 )
      self.scene.add( light )

      var texture = new self.$gThree.TextureLoader().load( 'textures/crate.gif', self.render() )
      texture.anisotropy = self.renderer.capabilities.getMaxAnisotropy()

      var geometry = new self.$gThree.BoxBufferGeometry( 200, 200, 200 )
      var material = new self.$gThree.MeshLambertMaterial( { map: texture, transparent: true } )

      self.setControls()
      
      var mesh = new self.$gThree.Mesh( geometry, material )
      self.scene.add( mesh )

      self.control.attach( mesh )
      self.scene.add( self.control )

      window.addEventListener( 'resize', self.onWindowResize, false )

      window.addEventListener( 'keydown', function ( event ) {
        // console.log('key code: ', event.keyCode)
        switch ( event.keyCode ) {
          case 81: // Q
            self.control.setSpace( self.control.space === 'local' ? 'world' : 'local' )
            break
          case 16: // Shift
            self.control.setTranslationSnap( 100 )
            self.control.setRotationSnap( self.$gThree.MathUtils.degToRad( 15 ) )
            self.control.setScaleSnap( 0.25 )
            // Set icon state
            self.guiControls[3].enabled = true
            break
          case 87: // W
            self.control.setMode( 'translate' );
            break
          case 69: // E
            self.control.setMode( 'rotate' );
            break
          case 82: // R
            self.control.setMode( 'scale' );
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
          case 86: // V
            const randomFoV = Math.random() + 0.1;
            const randomZoom = Math.random() + 0.1;

            self.cameraPersp.fov = randomFoV * 160;
            self.cameraOrtho.bottom = - randomFoV * 500;
            self.cameraOrtho.top = randomFoV * 500;

            self.cameraPersp.zoom = randomZoom * 5;
            self.cameraOrtho.zoom = randomZoom * 5;
            self.onWindowResize()
            break
          case 187:
          case 107: // +, =, num+
            self.control.setSize( self.control.size + 0.1 )
            break
          case 189:
          case 109: // -, _, num-
            self.control.setSize( Math.max( self.control.size - 0.1, 0.1 ) )
            break
          case 88: // X
            self.control.showX = ! self.control.showX
            break
          case 89: // Y
            self.control.showY = ! self.control.showY
            break;
          case 90: // Z
            self.control.showZ = ! self.control.showZ
            break
          case 32: // Spacebar
            self.control.enabled = ! self.control.enabled
            break
        }
      })

      window.addEventListener( 'keyup', function ( event ) {
        switch ( event.keyCode ) {
          case 16: // Shift
            self.control.setTranslationSnap( null )
            self.control.setRotationSnap( null )
            self.control.setScaleSnap( null )
            // Set icon state
            self.guiControls[3].enabled = false
            break
        }
      })

      self.render()
    },
    changeCameraPos(angle) {
      var self = this
      switch (angle) {
        case 'front':
          self.currentCamera.position.set( 0, 0, 1000 )
          break
        case 'top':
          self.currentCamera.position.set( 0, 1000, 0 )
          break
        case 'right':
          self.currentCamera.position.set( 1000, 0, 0 )
          break
      }
      self.currentCamera.lookAt( 0, 0, 0 ) // TODO: look at "active" object
      self.control.update()
      self.render()
      // self.cameraPersp.position.set( 1000, 500, 1000 )
      // self.cameraOrtho.position.set( 1000, 500, 1000 )
    },
    toggleCamera() {
      var self = this
      const position = self.currentCamera.position.clone()

      self.currentCamera = self.currentCamera.isPerspectiveCamera ? self.cameraOrtho : self.cameraPersp
      self.currentCamera.position.copy( position )

      self.controls.object = self.currentCamera
      self.control.camera = self.currentCamera

      self.currentCamera.lookAt( self.controls.target.x, self.controls.target.y, self.controls.target.z )
      self.onWindowResize()
    },
    optionSelected(target) {
      var self = this
      // console.log('going in here: ', target)
      var name = String(target.name)
      if ( name === 'togglecam' ) { 
        // console.log('si señor!!!!!', self.control)
        self.toggleCamera()
      }
    },
    render() {
      this.renderer.render( this.scene, this.currentCamera )
    },
    onWindowResize() {
      var self = this
      const aspect = window.innerWidth / window.innerHeight

      self.cameraPersp.aspect = aspect
      self.cameraPersp.updateProjectionMatrix()

      self.cameraOrtho.left = self.cameraOrtho.bottom * aspect
      self.cameraOrtho.right = self.cameraOrtho.top * aspect
      self.cameraOrtho.updateProjectionMatrix()

      self.renderer.setSize( window.innerWidth, window.innerHeight )

      self.render()
		},
    setControls () {
      var self = this
      self.controls = new OrbitControls( self.currentCamera, self.renderer.domElement )
      self.controls.update()
      self.controls.addEventListener( 'change', (evt) => {
        self.render()
        // console.log('dragging: ', evt.target)
      })

      self.control = new TransformControls( self.currentCamera, self.renderer.domElement )
      self.control.addEventListener( 'change', self.render )

      self.control.addEventListener( 'dragging-changed', function ( event ) {
        self.controls.enabled = ! event.value
        // console.log(event)
      })
    },
    tweenObject (type) {
      var self = this
      // self.logoShapes.forEach((elm, i) => {
      //   if (type === 'default') {
      //     TweenMax.to(elm.obj.position, easeTime, {
      //       x: elm.pos.x,
      //       y: elm.pos.y,
      //       z: elm.pos.z,
      //       // ease: Sine.easeInOut
      //       ease: self.easingType
      //     })
      //     if (elm.scale) {
      //       TweenMax.to(elm.obj.scale, easeTime, {
      //         x: elm.scale.x,
      //         y: elm.scale.y,
      //         z: elm.scale.z,
      //         // ease: Sine.easeInOut
      //         ease: self.easingType
      //         // ease: Elastic.easeOut.config(1, 0.3)
      //       })
      //     }
      //   }
      // }
    },
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
