<template lang="pug">
  .container.outer.black-bg
    #containerTypo(ref="container_distort")
    .dot
</template>
 
<script>

// Example
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const vertex = require('@/assets/js/shaders/distortimage/vertex.glsl')
const fragment = require('@/assets/js/shaders/distortimage/fragment.glsl')

// import { TimelineMax, Sine, Back, Expo, Elastic } from 'gsap'
import { TimelineMax } from 'gsap'

// import globalFunctions from '@/mixins/globalFunctions.js'

let container, camera, pos, controls, scene, renderer, geometry, geometry1, material, plane, tex1, tex2;
let destination = {x:0,y:0};
let textures = [];

let tl = new TimelineMax();
let tl1 = new TimelineMax();

let textureLoader = new THREE.TextureLoader()
let gallery = [
  textureLoader.load( require('@/assets/images/img.jpg') ),
  textureLoader.load( require('@/assets/images/img1.jpg') ),
  textureLoader.load( require('@/assets/images/img2.jpg') ),
  textureLoader.load( require('@/assets/images/img3.jpg') ),
  textureLoader.load( require('@/assets/images/img4.jpg') )
];

/// SCROLL MAGIC
let speed = 0;
let position = 0;

let time = 0;

export default {
  name: 'DistortImage1',
  // mixins: [globalFunctions],
  data () {
    return {
      textureLoader: null
    }
  },
  components: {
    // 
  },
  mounted () {
    var self = this
    self.init()
    self.animate()
    // setTimeout(() => {
    //   self.init()
    //   self.animate()
    // }, 200)
  },
  beforeDestroy () {
    // var self = this
    // console.log('before destroy')
    // window.cancelAnimationFrame( self.reqAnim );
    // // Dispose controls
    // self.controls.dispose()
    // while(self.scene.children.length > 0){
    //   console.log('before destroying: ', self.scene.children[0])
    //   self.scene.remove(self.scene.children[0]);
    // }
  },
  methods: {
    init() {
      var self = this
      
      // Build the container
      container = self.$refs.container_distort
      
      // Create scene
      scene = new THREE.Scene()
      // Add fog
      // self.scene.fog = new THREE.Fog(0x000000, 0, self.camDist * 4)

      renderer = new THREE.WebGLRenderer()
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerWidth);

      // var container = document.getElementById('container');
      container.appendChild(renderer.domElement);

      camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.001, 100
      );
      camera.position.set( 0, 0, 1 );

      material = new THREE.ShaderMaterial( {
        side: THREE.DoubleSide,
        uniforms: {
          time: { type: 'f', value: 0 },
          pixels: {type: 'v2', value: new THREE.Vector2(window.innerWidth,window.innerHeight)},
          accel: {type: 'v2', value: new THREE.Vector2(0.5,2)},
          progress: {type: 'f', value: 0},
          uvRate1: {
            value: new THREE.Vector2(1,1)
          },
          texture1: {
            value: textureLoader.load( require('@/assets/images/img.jpg') )
          },
          texture2: {
            value: textureLoader.load( require('@/assets/images/img1.jpg') )
          },
        },
        // wireframe: true,
        vertexShader: vertex,
        fragmentShader: fragment
      });

      plane = new THREE.Mesh(new THREE.PlaneGeometry( 1,1, 1, 1 ),material);
      scene.add(plane);

      // self.resize();

      window.addEventListener('resize', self.resize)
      
      self.resize()

      document.addEventListener('wheel', function(event) {
        speed += event.deltaY*0.0002;
        console.log('mousewheel event')
        console.log(event)
      });
      
      document.addEventListener('touchmove', function(event) {
        speed += event.touches[0].clientY * 0.00002;
        console.log('touch event')
        console.log(event.touches[0].clientY)
      });

      self.raf()

      // Set orbit controls
      // self.setOrbitControls()
      
    },
    resize() {
      var w = window.innerWidth;
      var h = window.innerHeight;
      renderer.setSize( w, h );
      camera.aspect = w / h;

      material.uniforms.uvRate1.value.y = h / w;

      // calculate scene
      let dist  = camera.position.z - plane.position.z;
      let height = 1;
      camera.fov = 2*(180/Math.PI)*Math.atan(height/(2*dist));

      // if(w/h>1) {
      plane.scale.x = w/h;
      // }

      camera.updateProjectionMatrix();
    },
    raf() {
      var self = this
      position += speed
      speed *=0.7

      let i = Math.round(position)
      let dif = i - position

      // dif = dif<0? Math.max(dif,-0.02):Math.max(dif,+0.03);

      position += dif*0.035
      if (Math.abs(i - position)<0.001) {
        position = i
      }

      tl1.set('.dot',{y:position*200})
      material.uniforms.progress.value = position

      let curslide = (Math.floor(position) - 1 + gallery.length)%gallery.length
      let nextslide = (((Math.floor(position) + 1)%gallery.length -1) + gallery.length)%gallery.length
      // console.log(curslide,nextslide)
      material.uniforms.texture1.value = gallery[curslide]
      material.uniforms.texture2.value = gallery[nextslide]

      // console.log(speed,position);
      // window.requestAnimationFrame(self.raf)
      window.requestAnimationFrame( self.raf.bind(this) )
    },
    setOrbitControls () {
      var self = this
      // Build the controls.
      controls = new OrbitControls( camera, renderer.domElement )
      // self.controls.enablePan = false
      controls.enableZoom = false
      // self.controls.maxDistance = self.camDist * 2 
      // self.controls.minDistance = 3
      // self.controls.maxPolarAngle = (Math.PI * 0.5) * 0.99
      // // Set orbit camera to half way up the cube
      // self.controls.target.copy( new THREE.Vector3(0, sizeCube / 2, 0) )

      controls.addEventListener('change', () => {
        // console.log('updating') 
      })
    },
    animate () {
      var self = this
      time = time+0.05;
      material.uniforms.time.value = time;
      self.reqAnim = requestAnimationFrame( self.animate.bind(this) )
      // self.update()
      self.render()
    },
    render() {
      var self = this
    
      // Render the scene.
      renderer.render(scene, camera) 
  
    },
    resize() {
      var self = this
      camera.aspect = ( window.innerWidth / window.innerHeight )
      camera.updateProjectionMatrix()
      renderer.setSize( window.innerWidth, window.innerHeight )
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
