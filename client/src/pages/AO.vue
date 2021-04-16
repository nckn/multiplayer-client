<template lang="pug">
  .container.outer.black-bg(ref="master_cont")
    #containerAO
    //- img.img(src="@/assets/images/basilica/posx.jpg" width="400" height="400")
</template>
 
<script>

// https://www.clicktorelease.com/code/perlin/chrome.html

// https://redstapler.co/realistic-reflection-effect-three-js/
// import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js';

// import { map } from '@/assets/js/helpers'

// import vertexShader from '@/assets/js/vertexShader.glsl'
// import fragmentShader from '@/assets/js/fragmentShader.glsl'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { SAOPass } from 'three/examples/jsm/postprocessing/SAOPass.js'

export default {
  name: 'AO',
  data () {
    return {
      container: null,
      scene: null,
      camera: null,
      // renderer: null,
      composer: null,
      renderPass: null,
      saoPass: null,
      group: null
    }
  },
  created () {
    //
  },
  async mounted () {
    var self = this
    setTimeout(() => {
      // console.log('the renderer: ', self.renderer)
      self.init();
      self.animate();
      // Orbit controls
      // self.setOrbitControls()
    }, 2000)
  },
  beforeDestroy () {
    var self = this
    console.log('before destroy')
    window.cancelAnimationFrame( self.reqAnim );
    // Dispose controls
    if (self.controls.dispose()) {
      self.controls.dispose()
    }
    self.gui.destroy()
    while(self.scene.children.length > 0){
      console.log('before destroying: ', self.scene.children[0])
      self.scene.remove(self.scene.children[0]);
    }
  },
  methods: {
    init() {
      var self = this
      // self.container = document.createElement( 'div' );
      // document.body.appendChild( self.container );
      // self.$refs.master_cont.appendChild( self.container );
      self.container = document.getElementById( 'containerAO' );

      var width = window.innerWidth || 1;
      var height = window.innerHeight || 1;
      // var devicePixelRatio = window.devicePixelRatio || 1;

      // self.renderer = new THREE.WebGLRenderer( { antialias: true } );
      // self.renderer.setClearColor( 0x000000 );
      // self.renderer.setPixelRatio( devicePixelRatio );
      // self.renderer.setSize( width, height );
      // document.body.appendChild( self.renderer.domElement );
      self.container.appendChild( self.$parent.renderer.domElement );

      self.camera = new self.$gThree.PerspectiveCamera( 65, width / height, 0.01, 10 );
      self.camera.position.z = 7;
      // self.camera.near = 0.01;

      self.scene = new self.$gThree.Scene();

      self.group = new self.$gThree.Object3D();
      self.scene.add( self.group );

      var light = new self.$gThree.PointLight( 0xddffdd, 0.8 );
      light.position.z = 70;
      light.position.y = - 70;
      light.position.x = - 70;
      self.scene.add( light );

      var light2 = new self.$gThree.PointLight( 0xffdddd, 0.8 );
      light2.position.z = 70;
      light2.position.x = - 70;
      light2.position.y = 70;
      self.scene.add( light2 );

      var light3 = new self.$gThree.PointLight( 0xddddff, 0.8 );
      light3.position.z = 70;
      light3.position.x = 70;
      light3.position.y = - 70;
      self.scene.add( light3 );

      var light4 = new self.$gThree.AmbientLight( 0xffffff, 0.05 );
      self.scene.add( light4 );

      var geometry = new self.$gThree.SphereBufferGeometry( 3, 48, 24 );

      for ( var i = 0; i < 120; i ++ ) {
        var material = new self.$gThree.MeshStandardMaterial();
        material.roughness = 0.5 * Math.random() + 0.25;
        material.metalness = 0;
        material.color.setHSL( Math.random(), 1.0, 0.3 );

        var mesh = new self.$gThree.Mesh( geometry, material );
        mesh.position.x = Math.random() * 4 - 2;
        mesh.position.y = Math.random() * 4 - 2;
        mesh.position.z = Math.random() * 4 - 2;
        mesh.rotation.x = Math.random();
        mesh.rotation.y = Math.random();
        mesh.rotation.z = Math.random();

        mesh.scale.x = mesh.scale.y = mesh.scale.z = Math.random() * 0.2 + 0.05;
        self.group.add( mesh );

      }

      self.stats = new Stats();
      self.container.appendChild( self.stats.dom );

      self.composer = new EffectComposer( self.$parent.renderer );
      self.renderPass = new RenderPass( self.scene, self.camera );
      self.composer.addPass( self.renderPass );
      self.saoPass = new SAOPass( self.scene, self.camera, false, true );
      self.composer.addPass( self.saoPass );

      // Init gui
      var gui = new GUI();
      self.gui = gui
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

      window.addEventListener( 'resize', self.onWindowResize, false );

      // Orbit controls
      self.setOrbitControls()
    },
    animate () {
      var self = this
      // requestAnimationFrame( self.animate );
      self.stats.begin();
      self.render();
      self.stats.end();
      // if (self.stats) {
      // }
      // if (self.stats) {
      // }
      self.reqAnim = requestAnimationFrame( self.animate.bind(this) );
    },
    render() {
      var self = this
      // var timer = performance.now();
      // self.group.rotation.x = timer * 0.0002;
      // self.group.rotation.y = timer * 0.0001;
      self.composer.render();
      // if (self.group) {
      // }
      // if (self.composer) {
      // }
    }, 
    onWindowResize() {
      var self = this
      this.width = window.innerWidth;
      this.height = window.innerHeight;

      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
      this.$parent.renderer.setSize(this.width, this.height);

      // Get window width
      self.window = {w: window.innerWidth, h: window.innerHeight}
      // console.log('windowW: ', self.window.w)
    },
    setOrbitControls () {
      var self = this
      self.controls = new OrbitControls( self.camera, self.$parent.renderer.domElement );
      self.controls.enablePan = false
      self.controls.zoomSpeed = 0.2
    },
    addGuides () {
      var axesHelper = new self.$gThree.AxesHelper( 5 );
      this.scene.add( axesHelper );
      console.log('adding guides')
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
