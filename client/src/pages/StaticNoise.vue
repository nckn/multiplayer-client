<template lang="pug">
  .container.outer.black-bg
    #container
    Slider
    //- img.img(src="@/assets/images/basilica/posx.jpg" width="400" height="400")
</template>
 
<script>

// https://www.clicktorelease.com/code/perlin/chrome.html

// https://redstapler.co/realistic-reflection-effect-three-js/
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import { map } from '@/assets/js/helpers'

// import vertexShader from '@/assets/js/vertexShader.glsl'
// import fragmentShader from '@/assets/js/fragmentShader.glsl'

const noiseVertexShader = require('@/assets/js/shaders/noiseVertexShader.glsl')
const noiseFragmentShader = require('@/assets/js/shaders/noiseFragmentShader.glsl')
const noiseVertexShaderTwo = require('@/assets/js/shaders/noiseVertexShaderTwo.glsl')
const noiseGradientShader = require('@/assets/js/shaders/noiseGradientShader.glsl')

const panoImage = require('@/assets/images/pano.jpg')

import Slider from '@/components/gui/Slider'

export default {
  name: 'StaticNoise',
  data () {
    return {
      container: null,
      scene: null,
      camera: null,
      // renderer: null,
      mesh: null,
      fov: 45,
      start: Date.now(),
      controls: null,
    }
  },
  mounted () {
    var self = this
    // console.log(vertexShader)
    setTimeout(() => {
      // console.log('the renderer: ', self.renderer)
      self.init();
      // self.animate();
      // Orbit controls
      // self.setOrbitControls()
    }, 1000)
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
    changeVal (val) {
      var self = this
      console.log(val)
      self.animTime = map(val, 0, 1, 0, 0.0002);
    },
    init() {
      var self = this
      
      container = document.getElementById('container');

      scene = new THREE.Scene();
      bkgScene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 1, 10000);
      camera.position.z = 100;
      camera.target = new THREE.Vector3(0, 0, 0);

      scene.add(camera);

      bkgCamera = new THREE.OrthographicCamera(1 / - 2, 1 / 2, 1 / 2, 1 / - 2, -1000, 1000);

      var bkgShader = new THREE.ShaderMaterial({

        uniforms: {
          resolution: { type: "v2", value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
        },
        vertexShader: document.getElementById('vertexShader').textContent,
        fragmentShader: document.getElementById('fs_Gradient').textContent,

        depthWrite: false,
        depthTest: false

      });

      quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(1, 1), bkgShader);
      bkgScene.add(quad);

      var material = new THREE.ShaderMaterial({
        uniforms: {
          tExplosion: { type: "t", value: THREE.ImageUtils.loadTexture('explosion.png') },
          time: { type: "f", value: 0.0 },
          weight: { type: "f", value: 10.0 }
        },
        vertexShader: noiseVertexShader,
        fragmentShader: noiseFragmentShader
      })

      self.mesh = new THREE.Mesh(new THREE.IcosahedronBufferGeometry(20, 5), material);
      self.scene.add(self.mesh);

      // renderer = new THREE.WebGLRenderer({ antialias: true });
      // renderer.setSize(window.innerWidth, window.innerHeight);
      // renderer.setPixelRatio(window.devicePixelRatio);
      // renderer.autoClear = false;

      // self.container.appendChild(renderer.domElement);

      // controls = new THREE.OrbitControls(camera, renderer.domElement);

      self.container.appendChild( self.$parent.renderer.domElement );

      self.setOrbitControls()

      window.addEventListener( 'resize', self.onWindowResize, false );

      self.render()
    },
    setOrbitControls () {
      var self = this
      self.controls = new OrbitControls( self.camera, self.$parent.renderer.domElement );
      self.controls.enablePan = false
    },
    addGuides () {
      var axesHelper = new THREE.AxesHelper( 5 );
      this.scene.add( axesHelper );
      console.log('adding guides')
    },
    render() {
      var self = this
      self.material.uniforms[ 'time' ].value = self.animTime * ( Date.now() - self.start );
      self.material.uniforms[ 'weight' ].value = 10.0 * ( 0.5 + 0.5 * Math.sin( 0.00025 * ( Date.now() - self.start ) ) );
      // material.uniforms[ 'weight' ].value = 10.0;
      self.$parent.renderer.render(self.scene, self.camera);
      self.reqAnim = requestAnimationFrame( self.render.bind(this) );
    }, 
    onWindowResize() {
      var self = this
      this.width = window.innerWidth;
      this.height = window.innerHeight;

      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
      // this.renderer.setSize(this.width, this.height);

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
