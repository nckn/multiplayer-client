<template lang="pug">
  .container.outer.black-bg
    #container
    Controls(:settings="settings" :event="'click'")
    //- Slider
    //- img.img(src="@/assets/images/basilica/posx.jpg" width="400" height="400")
</template>
 
<script>

// https://www.clicktorelease.com/code/perlin/chrome.html

// https://redstapler.co/realistic-reflection-effect-three-js/
// import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import { map } from '@/assets/js/helpers'

import Controls from '@/components/gui/Controls'

// import vertexShader from '@/assets/js/vertexShader.glsl'
// import fragmentShader from '@/assets/js/fragmentShader.glsl'

const vertexShader = require('@/assets/js/vertexShader.glsl')
const fragmentShader = require('@/assets/js/fragmentShader.glsl')

const panoImage = require('@/assets/images/pano.jpg')

// import Slider from '@/components/gui/Slider'

export default {
  name: 'Dome',
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
      animTime: 0.000025,
      // Slider settings  
      settings: [
        {name: '',
          sliders: [
            {name: 'Animation time', value: 0},
            // {name: 'Animation time', value: 0},
          ]
        },
      ]
    }
  },
  components: {
    Controls
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
    }, 2000)
    // self.init()
    // self.addGuides()
    // self.animate()
    // window.addEventListener('resize', this.onResize.bind(this));
    // self.vertexShader = document.createElement('script')
    // self.vertexShader.setAttribute('src', require('@/assets/js/vertexShader.glsl'))
    // document.head.appendChild(self.vertexShader)
    // console.log('the script: ', self.vertexShader)
    
    // self.fragmentShader = document.createElement('script')
    // self.fragmentShader.setAttribute('src', require('@/assets/js/fragmentShader.glsl'))
    // document.head.appendChild(self.fragmentShader)
    // console.log('the script: ', self.vertexShader)
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
  // beforeRouteLeave (to, from , next) {
  // beforeRouteLeave () {
  //   // var self = this
  //   // while(self.scene.children.length > 0){ 
  //   //   self.scene.remove(self.scene.children[0]); 
  //   // }
  //   // const answer = window.confirm('Do you really want to leave? you have unsaved changes!')
  //   // if (answer) {
  //   //   next()
  //   // } else {
  //   //   next(false)
  //   // }
  // },
  methods: {
    changeVal(ob) {
      // Slider
      var self = this
      console.log('name: ', ob.name)
      if (ob.name === 'Animation time') {
        self.animTime = map(ob.value, 0, 1, 0, 0.0002)
      }
      // else if (ob.name === 'Attenuation') {
      //   self.material.uniforms['attenuation'].value = map(ob.value, 0, 1, 0, 10)
      // }
    },
    // changeVal (val) {
    //   var self = this
    //   console.log(val)
    //   self.animTime = map(val, 0, 1, 0, 0.0002);
    // },
    init() {
      var self = this
      
      self.container = document.getElementById( 'container' );

      self.scene = new self.$gThree.Scene();

      self.camera = new self.$gThree.PerspectiveCamera( self.fov, window.innerWidth / window.innerHeight, 1, 10000 );
      self.camera.position.z = 100;
      self.camera.target = new self.$gThree.Vector3( 0, 0, 0 );

      self.scene.add( self.camera );

      var panoTexture = new self.$gThree.TextureLoader().load( panoImage );

      self.domeMat = new self.$gThree.MeshBasicMaterial( { map: panoTexture } )
      self.domeMat.side = self.$gThree.DoubleSide
      var sphere = new self.$gThree.Mesh( new self.$gThree.SphereGeometry( 500, 60, 60 ), self.domeMat );
      // sphere.scale.x = -1;
      sphere.doubleSided = true;
      self.scene.add( sphere );

      self.material = new self.$gThree.ShaderMaterial( {
        uniforms: {
          tShine: { type: "t", value: panoTexture },
          time: { type: "f", value: 0 },
          weight: { type: "f", value: 0 }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader
        // vertexShader: document.getElementById( 'vertexShader' ).textContent,
        // fragmentShader: document.getElementById( 'fragmentShader' ).textContent
      });
      // self.material.wireframe = true

      console.log(`material: ${self.material}`)

      // self.mesh = new self.$gThree.Mesh( new self.$gThree.PlaneGeometry(10, 10, 100, 100), self.material)
      // self.mesh = new self.$gThree.Mesh( new self.$gThree.BoxGeometry(5, 5, 5, 10, 10, 10), self.material)
      self.mesh = new self.$gThree.Mesh( new self.$gThree.IcosahedronGeometry( 20, 5 ), self.material );
      self.scene.add( self.mesh );

      // self.renderer = new self.$gThree.WebGLRenderer( {antialias:true});
      // self.renderer.setPixelRatio( window.devicePixelRatio );
      // self.renderer.setSize( window.innerWidth, window.innerHeight );
      // self.renderer.autoClear = false;

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
      var axesHelper = new self.$gThree.AxesHelper( 5 );
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
