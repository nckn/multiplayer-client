<template lang="pug">
  .container.outer.black-bg
    #ThreeJS
    //- img.img(src="@/assets/images/basilica/posx.jpg" width="400" height="400")
</template>
 
<script>

// https://redstapler.co/realistic-reflection-effect-three-js/

// https://redstapler.co/realistic-reflection-effect-three-js/
import * as THREE from 'three'
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
// import { Stats } from 'stats.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// import { Detector } from '@/assets/js/detector.js'
// import { keyboardstate } from '@/assets/js/keyboardstate'
// import { fullscreen } from '@/assets/js/fullscreen'
// import { windowresize } from '@/assets/js/windowresize'

// var path = '@/assets/images/'
// // // var path = 'static/'
// // // var path = 'images/'
// const images = [
//   require(`${path}basilica/posx.jpg`),
//   require(`${path}basilica/negx.jpg`),
//   require(`${path}basilica/posy.jpg`),
//   require(`${path}basilica/negy.jpg`),
//   require(`${path}basilica/posz.jpg`),
//   require(`${path}basilica/negz.jpg`)
// ]

// const images = [
//   require(`@/assets/images/basilica/posx.jpg`),
//   require(`@/assets/images/basilica/negx.jpg`),
//   require(`@/assets/images/basilica/posy.jpg`),
//   require(`@/assets/images/basilica/negy.jpg`),
//   require(`@/assets/images/basilica/posz.jpg`),
//   require(`@/assets/images/basilica/negz.jpg`)
// ]

const images = [
  require('@/assets/images/basilica/posx.jpg'),
  require('@/assets/images/basilica/negx.jpg'),
  require('@/assets/images/basilica/posy.jpg'),
  require('@/assets/images/basilica/negy.jpg'),
  require('@/assets/images/basilica/posz.jpg'),
  require('@/assets/images/basilica/negz.jpg')
]

// console.log('image path: ', images[0])

export default {
  name: 'CubicDome',
  data () {
    return {
      container: null,
      scene: null,
      camera: null,
      renderer: null,
      stats: null,
      keyboard: null,
      mirrorCube: null,
      mirrorCubeCamera: null,
      mirrorSphere: null,
      mirrorSphereCamera: null,
    }
  },
  created () {
    // var self = this
  },
  mounted () {
    var self = this
    self.init()
    self.addGuides()
    self.animate()
    window.addEventListener('resize', this.onResize.bind(this));
  },
  methods: {
    init() {
      var self = this
      
      // SCENE
      self.scene = new THREE.Scene()
      
      // CAMERA
      var SCREEN_WIDTH = window.innerWidth
      var SCREEN_HEIGHT = window.innerHeight
      var VIEW_ANGLE = 45
      var ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT
      var NEAR = 0.1
      var FAR = 20000
      self.camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR)
      self.scene.add(self.camera)
      self.camera.position.set(0, 150, 400)
      self.camera.lookAt(self.scene.position)
      
      // RENDERER
      // if (Detector.webgl) {
      //   self.renderer = new THREE.WebGLRenderer({ antialias: true })
      // } else {
      //   self.renderer = new THREE.CanvasRenderer()
      // }
      self.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      self.renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT)
      self.container = document.getElementById('ThreeJS')
      self.container.appendChild(self.renderer.domElement)
      
      // EVENTS
      // THREEx.WindowResize(self.renderer, self.camera)
      // windowresize.WindowResize(self.renderer, self.camera)
      // THREEx.FullScreen.bindKey({ charCode: 'm'.charCodeAt(0) })
      // fullscreen.FullScreen.bindKey({ charCode: 'm'.charCodeAt(0) })
      
      // CONTROLS
      self.controls = new OrbitControls(self.camera, self.renderer.domElement)
      
      // STATS
      // self.stats = new Stats()
      // self.stats.domElement.style.position = 'absolute'
      // self.stats.domElement.style.bottom = '0px'
      // self.stats.domElement.style.zIndex = 100
      // self.container.appendChild(self.stats.domElement)
      
      // LIGHT
      var light = new THREE.PointLight(0xffffff)
      light.position.set(0, 250, 0)
      self.scene.add(light)

      // SKYBOX/FOG
      var materialArray = []
      materialArray.push(new THREE.MeshBasicMaterial({ map: THREE.ImageUtils.loadTexture( images[0] ) })) // posx.jpg
      materialArray.push(new THREE.MeshBasicMaterial({ map: THREE.ImageUtils.loadTexture( images[1] ) }))
      materialArray.push(new THREE.MeshBasicMaterial({ map: THREE.ImageUtils.loadTexture( images[2] ) }))
      materialArray.push(new THREE.MeshBasicMaterial({ map: THREE.ImageUtils.loadTexture( images[3] ) }))
      materialArray.push(new THREE.MeshBasicMaterial({ map: THREE.ImageUtils.loadTexture( images[4] ) }))
      materialArray.push(new THREE.MeshBasicMaterial({ map: THREE.ImageUtils.loadTexture( images[5] ) }))
      for (var i = 0; i < 6; i++) {
        materialArray[i].side = THREE.BackSide
        console.log('material array: ', materialArray[i].map)
      }
      var skyboxMaterial = new THREE.MeshFaceMaterial(materialArray)
      var skyboxGeom = new THREE.BoxGeometry(5000, 5000, 5000, 1, 1, 1)
      var skybox = new THREE.Mesh(skyboxGeom, skyboxMaterial)
      self.scene.add(skybox)

      ////////////
      // CUSTOM //
      ////////////

      // var cubeGeom = new THREE.CubeGeometry(100, 100, 10, 1, 1, 1)
      var cubeGeom = new THREE.BoxGeometry(1000, 1000, 1, 1, 1, 1)
      self.mirrorCubeCamera = new THREE.CubeCamera(0.1, 5000, 512)
      console.log('mirror cube: ', self.mirrorCubeCamera)

      // mirrorCubeCamera.renderTarget.minFilter = THREE.LinearMipMapLinearFilter;
      self.scene.add(self.mirrorCubeCamera)
      var mirrorCubeMaterial = new THREE.MeshBasicMaterial({ envMap: self.mirrorCubeCamera.renderTarget })
      self.mirrorCube = new THREE.Mesh(cubeGeom, mirrorCubeMaterial)
      // self.mirrorCube.position.set(-75, 50, 0)
      self.mirrorCubeCamera.position = self.mirrorCube.position
      self.mirrorCube.rotation.x = Math.PI / 2
      // Add to scene
      self.scene.add(self.mirrorCube)

      var sphereGeom = new THREE.SphereGeometry(50, 32, 16) // radius, segmentsWidth, segmentsHeight
      self.mirrorSphereCamera = new THREE.CubeCamera(0.1, 5000, 512)
      // mirrorCubeCamera.renderTarget.minFilter = THREE.LinearMipMapLinearFilter;
      self.scene.add(self.mirrorSphereCamera)
      
      var mirrorSphereMaterial = new THREE.MeshBasicMaterial({ envMap: self.mirrorSphereCamera.renderTarget })
      self.mirrorSphere = new THREE.Mesh(sphereGeom, mirrorSphereMaterial)
      self.mirrorSphere.position.set(75, 50, 0)
      self.mirrorSphereCamera.position = self.mirrorSphere.position
      // Add to scene
      self.scene.add(self.mirrorSphere)

      // FLOOR
      var floorTexture = new THREE.ImageUtils.loadTexture(require('@/assets/images/checkerboard.jpg'))
      floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping
      floorTexture.repeat.set(10, 10)
      var floorMaterial = new THREE.MeshBasicMaterial({ map: floorTexture, side: THREE.BackSide })
      var floorGeometry = new THREE.PlaneGeometry(1000, 1000, 10, 10)
      var floor = new THREE.Mesh(floorGeometry, floorMaterial)
      floor.position.y = -0.5
      floor.rotation.x = Math.PI / 2
      // self.scene.add(floor)
    },
    addGuides () {
      var axesHelper = new THREE.AxesHelper( 5 );
      this.scene.add( axesHelper );
      console.log('adding guides')
    },
    render() {
      var self = this
      // move the CubeCamera to the position of the object
      //    that has a reflective surface, "take a picture" in each direction
      //    and apply it to the surface.
      // need to hide surface before and after so that it does not
      //    "get in the way" of the camera
      self.mirrorCube.visible = false;
      self.mirrorCubeCamera.update(self.renderer, self.scene);
      self.mirrorCube.visible = true;

      self.mirrorSphere.visible = false;
      self.mirrorSphereCamera.update(self.renderer, self.scene);
      self.mirrorSphere.visible = true;

      self.renderer.render(self.scene, self.camera);
    },
    animate() {
      var self = this
      self.render()
      requestAnimationFrame(self.animate.bind(this));
    },
    onResize() {
      var self = this
      this.width = window.innerWidth;
      this.height = window.innerHeight;

      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.width, this.height);

      // Get window width
      self.window = {w: window.innerWidth, h: window.innerHeight}
      // console.log('windowW: ', self.window.w)
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

@mixin dropShadow() {
  -webkit-box-shadow: 0px 0px 10px 0px rgba(0,0,0,0.25);
  -moz-box-shadow: 0px 0px 10px 0px rgba(0,0,0,0.25);
  box-shadow: 0px 0px 10px 0px rgba(0,0,0,0.25);
}

.container {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  &.outer {
    padding: 24px;
  }
  &.black-bg {
    background: black;
    padding: 0;
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
    $i-size: 200px;
    .debug-info {
      width: $i-size;
      // height: $i-size;
      height: auto;
      position: absolute;
      padding: 12px;
      background: #5c5c5c;
      top: 4px;
      right: 4px;
      border-radius: 2px;
      @include dropShadow()
      .p-pair {
        width: 100%;
        display: flex;
        justify-content: space-between;
        &.w-seperator {
          padding-bottom: 6px;
          border-bottom: 1px solid rgba(0,0,0,0.2);
        }
        p {
          font-size: 8px;
          margin-bottom: 0;
        }
        .col {
          width: 50%;
        }
        .p-sub {
          display: flex;
          flex-direction: column;
        }
      }
      @media screen and (max-width: 768px) {
        display: none;
      }
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

#sceneContainer {
  margin: 0;
  width: 100%;
  height: 100%;
  background: black;
}

.hide-it {
  visibility: hidden;
}

// Input
.toggle-wrapper {
  width: 64px;
  height: 64px;
  position: absolute;
  bottom: 68px;
  right: 12px;
  @media screen and (min-width: $breakp-md) {
    right: 24px;
  }
}

input[type=checkbox]{
	height: 0;
	width: 0;
	visibility: hidden;
}

label {
	cursor: pointer;
	text-indent: -9999px;
	width: 64px;
	height: 36px;
	background: rgb(52, 52, 52);
	display: block;
	border-radius: 32px;
	position: relative;
}

label:after {
	// content: 'color picker';
	content: '';
	position: absolute;
	top: 3px;
	left: 3px;
	width: 30px;
	height: 30px;
	background: #fff;
	border-radius: 15px;
	transition: 0.3s;
  // background: url(/static/);
}

input:checked + label {
	background: #636363;
  // &:after {
  //   content: 'camera';
  // }
}

input:checked + label:after {
	left: calc(100% - 5px);
	transform: translateX(-100%);
}

label:active:after {
	// width: 130px;
}

</style>
