<template lang="pug">
  .container.outer.black-bg
    #container(ref="reflection_cont")
</template>
 
<script>

// Example
// http://www.bryanjones.us/article/reflections-threejs

// import * as THREE from 'three'
import { MixOperation } from 'three/build/three.min.js'
// import { mixOperation} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// import { map } from '@/assets/js/helpers'

const TEXTURE_PATH = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/123879/';

// import vertexShader from '@/assets/js/vertexShader.glsl'
// import fragmentShader from '@/assets/js/fragmentShader.glsl'

// const vertexShader = require('@/assets/js/vertexShader.glsl')
// const fragmentShader = require('@/assets/js/fragmentShader.glsl')

const panoImage = require('@/assets/images/pano.jpg')

// import Slider from '@/components/gui/Slider'

export default {
  name: 'Dome',
  data () {
    return {
      container: null,
      scene: null,
      camera: null,
      // Reflection specific
      // effect: null,
      // controls,
      element: null,
      rotationPoint: null,
      lightRotationPoint: null,
      sphere: null,
      // skybox: null,
      textureCube: null,
      cube: null,
      cubeMaterial: null,
      mirrorSphere: null,
      mirrorSphereCamera: null,
      mirrorRect1: null,
      mirrorRect1Camera: null,
      mirrorRect2: null,
      mirrorRect2Camera: null,
      mirrorRect3: null,
      mirrorRect3Camera: null,
      mirrorRect4: null,
      cone1Camera: null,
      // Niels
      domeMat: null,
      mirrorSphereMaterial0: null
    }
  },
  // components: {
  //   Slider
  // },
  mounted () {
    var self = this
    console.log('mix operation: ', MixOperation)
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
    createReflectionDome() {
      var self = this
      var panoTexture = new self.$gThree.TextureLoader().load( panoImage );
      // self.domeMat = new self.$gThree.MeshBasicMaterial( { map: panoTexture } )
      self.domeMat = new self.$gThree.MeshBasicMaterial({
        map: panoTexture
        // color: 0x000000
      })
      self.domeMat.side = self.$gThree.DoubleSide
      var sphere = new self.$gThree.Mesh( new self.$gThree.SphereGeometry( 2500, 60, 60 ), self.domeMat );
      // sphere.scale.x = -1;
      sphere.doubleSided = true;
      self.scene.add( sphere );
    },
    createReflectionCube() {
      var self = this
      // Create the scene.
      var urls = [
        TEXTURE_PATH + 'px.jpg', TEXTURE_PATH + 'nx.jpg',
        TEXTURE_PATH + 'py.jpg', TEXTURE_PATH + 'ny.jpg',
        TEXTURE_PATH + 'pz.jpg', TEXTURE_PATH + 'nz.jpg',
      ];
      self.loader = new self.$gThree.CubeTextureLoader();
      self.loader.crossOrigin = "";
      var textureCube = self.loader.load( urls );
      textureCube.format = self.$gThree.RGBFormat;
      // self.scene = new self.$gThree.Scene();
      self.scene.background = textureCube;
    },
    init() {
      var self = this
      // Build the container
      self.container = self.$refs.reflection_cont
      // document.body.appendChild( container );
      
      // Create scene
      self.scene = new self.$gThree.Scene();

      self.createReflectionDome()
      // self.createReflectionCube()
      
      // Create a rotation points.
      self.rotationPoint = new self.$gThree.Object3D();
      self.rotationPoint.position.set( 0, 0, 0 );
      self.scene.add(self.rotationPoint);
      
      // light rotation point.
      self.lightRotationPoint = new self.$gThree.Object3D();
      self.lightRotationPoint.position.set( 0, 0, 0 );
      self.scene.add(self.lightRotationPoint);
      
      // Create the camera.
      self.camera = new self.$gThree.PerspectiveCamera(
        45, // Angle
        window.innerWidth / window.innerHeight, // Aspect Ratio.
        1, // Near view.
        23000 // Far view.
      );
      self.camera.position.z = -1500;
      self.camera.position.y = 200;
      
      self.rotationPoint.add( self.camera );

      // Build the renderer.
      self.renderer = new self.$gThree.WebGLRenderer( { antialias: true, alpha: true } );
      var element = self.renderer.domElement;
      self.renderer.setSize( window.innerWidth, window.innerHeight );
      self.renderer.shadowMap.enabled;
      // container.appendChild( element );
      self.container.appendChild( element );
      
      // self.setOrbitControls()
      
      // Ambient lights
      var ambient = new self.$gThree.AmbientLight( 0xffffff );
      self.scene.add( ambient );

      var sun = new self.$gThree.PointLight(0xffffcc, 1, 6000);
      sun.position.set(4000, 1000, -4000);
      self.scene.add(sun);
      
      var sun1 = new self.$gThree.PointLight(0xffffcc, 1, 6000);
      sun1.position.set(-4000, 1000, -4000);
      self.scene.add(sun1);
      
      var sun2 = new self.$gThree.PointLight(0xffffcc, 1, 6000);
      sun2.position.set(-4000, 1000, 4000);
      self.scene.add(sun2);
      
      var sun3 = new self.$gThree.PointLight(0xffffcc, 1, 6000);
      sun3.position.set(4000, 1000, 4000);
      self.scene.add(sun3);
      
      var light = new self.$gThree.PointLight(0x7777aa, 1, 1000);
      light.position.set(-200, 200, -175);
      self.lightRotationPoint.add(light);
      var geometryA = new self.$gThree.SphereBufferGeometry( 10, 8, 8 );
      var materialA = new self.$gThree.MeshLambertMaterial({
          color: 0x7777aa,
          emissive: 0x7777aa,
      });
      var lightBallA = new self.$gThree.Mesh(geometryA, materialA);
      lightBallA.position.set(-200, 200, -175);
      self.lightRotationPoint.add(lightBallA);
      
      var light2 = new self.$gThree.PointLight(0xaa7777, 1, 1000);
      light2.position.set(200, 200, -175);
      self.lightRotationPoint.add(light2);
      var geometryB = new self.$gThree.SphereBufferGeometry( 10, 8, 8 );
      var materialB = new self.$gThree.MeshLambertMaterial({
          color: 0xaa7777,
          emissive: 0xaa7777,
      });
      var lightBallB = new self.$gThree.Mesh(geometryB, materialB);
      lightBallB.position.set(200, 200, -175);
      self.lightRotationPoint.add(lightBallB);
    
      var light3 = new self.$gThree.PointLight(0xaaaaaa, 1, 1000);
      light3.position.set(200, 200, 175);
      self.lightRotationPoint.add(light3);
      var geometryC = new self.$gThree.SphereBufferGeometry( 10, 8, 8 );
      var materialC = new self.$gThree.MeshLambertMaterial({
          color: 0xaaaaaa,
          emissive: 0xaaaaaa,
      });
      var lightBallC = new self.$gThree.Mesh(geometryC, materialC);
      lightBallC.position.set(200, 200, 175);
      self.lightRotationPoint.add(lightBallC);
      
      var light4 = new self.$gThree.PointLight(0x77aa77, 1, 1000);
      light4.position.set(-200, 200, 175);
      self.lightRotationPoint.add(light4);
      var geometryD = new self.$gThree.SphereBufferGeometry( 10, 8, 8 );
      var materialD = new self.$gThree.MeshLambertMaterial({
          color: 0x77aa77,
          emissive: 0x77aa77,
      });
      var lightBallD = new self.$gThree.Mesh(geometryD, materialD);
      lightBallD.position.set(-200, 200, 175);
      self.lightRotationPoint.add(lightBallD);
      
      var light5 = new self.$gThree.PointLight(0x777777, 1, 1400);
      light5.position.set(0, 1000, 0);
      self.scene.add(light5);
      
      // Create base.
      self.createBase();
    
      // Create the main object.
      self.createGeometry();
    
      // Create surrounding shapes.
      // self.createSphere1();
      // self.createSphere2();
      // self.createRect();
      // self.createCone();

      self.setOrbitControls()

      window.addEventListener( 'resize', self.onWindowResize, false );
    },
    createBase () {
      var self = this
      // Create a floor.  
      var loader = new self.$gThree.TextureLoader()
      loader.crossOrigin = '';
      loader.load( TEXTURE_PATH + 'MetalRustRepolished001_COL_1K_SPECULAR.jpg', function( texture ) {
        var repeatX = 16
        var repeatY = 16
        texture.anisotropy = self.renderer.capabilities.getMaxAnisotropy();
        texture.wrapS = texture.wrapT = self.$gThree.RepeatWrapping;
        texture.repeat.set(repeatX, repeatY);

        var normal = loader.load( TEXTURE_PATH + 'MetalRustRepolished001_NRM_1K_SPECULAR.jpg');
        normal.anisotropy = self.renderer.capabilities.getMaxAnisotropy();
        normal.wrapS = normal.wrapT = self.$gThree.RepeatWrapping;
        normal.repeat.set(repeatX, repeatY);
        
        var ao = loader.load( TEXTURE_PATH + 'MetalRustRepolished001_GLOSS_VAR2_1K_SPECULAR.jpg');
        ao.anisotropy = self.renderer.capabilities.getMaxAnisotropy();
        ao.wrapS = normal.wrapT = self.$gThree.RepeatWrapping;
        ao.repeat.set(repeatX, repeatY);

        var displace = loader.load( TEXTURE_PATH + 'MetalRustRepolished001_DISP_1K_SPECULAR.jpg');
        displace.anisotropy = self.renderer.capabilities.getMaxAnisotropy();
        displace.wrapS = displace.wrapT = self.$gThree.RepeatWrapping;
        displace.repeat.set(repeatX, repeatY); 
        
        var spec = loader.load( TEXTURE_PATH + 'MetalRustRepolished001_REFL_1K_SPECULAR.jpg');
        spec.anisotropy = self.renderer.capabilities.getMaxAnisotropy();
        spec.wrapS = spec.wrapT = self.$gThree.RepeatWrapping;
        spec.repeat.set(repeatX, repeatY);
        
        var material = new self.$gThree.MeshStandardMaterial({
          aoMap: ao,
          aoMapIntensity: 0.5,
          color: 0x666666,
          map: texture,
          metalnessMap: texture,
          displacementMap: displace,
          normalMap: normal,
          envMap: self.scene.background,
          metalness: 0.7,
          metalMap: texture,
          roughness: 0.2,
          // combine: self.$gThree.mixOperation,
          combine: MixOperation,
          reflectivity: 0.3,
        });
        
        // Create the floor geometry and mesh. Add to scene.
        var geometry = new self.$gThree.PlaneGeometry( 50000, 50000 );
        geometry.computeFaceNormals();
        var floor = new self.$gThree.Mesh(geometry, material);
        // var floor = new self.$gThree.Mesh(geometry, self.mirrorSphereMaterial0);
        floor.position.set(0, 0, 0);
        floor.rotation.x = -Math.PI/2;
        floor.receiveShadow = true;
        self.scene.add(floor);

        // var geometry3 =  new self.$gThree.CubeGeometry( 5000, 20, 5000, 1, 1, 1, )
        // self.mirrorFloorCamera = new self.$gThree.CubeCamera( 0.1, 5000, 512 )
        // self.scene.add( self.mirrorFloorCamera )
        // var mirrorRectMaterial3 = new self.$gThree.MeshBasicMaterial({ 
        //   envMap: self.mirrorFloorCamera.renderTarget.texture,
        //   //reflectivity: 0.9,
        //   color: 0xaaaaaa,
        // })
        // self.mirrorFloor = new self.$gThree.Mesh( geometry3, mirrorRectMaterial3 )
        // self.mirrorFloor.position.set(-500, 0, 500)
        // self.mirrorFloorCamera.position.set(-500, 300, 500)
        // self.scene.add(self.mirrorFloor)

      });
    },
    createGeometry() {
      var self = this
      
      // Sphere
      var geometry0 =  new self.$gThree.SphereGeometry( 200, 64, 64 );
      self.mirrorSphereCamera = new self.$gThree.CubeCamera( 0.1, 5000, 512 );
      self.scene.add( self.mirrorSphereCamera );
      self.mirrorSphereMaterial0 = new self.$gThree.MeshBasicMaterial( { envMap: self.mirrorSphereCamera.renderTarget.texture } );
      self.mirrorSphere = new self.$gThree.Mesh( geometry0, self.mirrorSphereMaterial0 );
      self.mirrorSphere.position.set(0, 200, 0);
      self.mirrorSphereCamera.position.set(0, 200, 0);
      self.scene.add(self.mirrorSphere);

      // Sphere
      var geometry1 =  new self.$gThree.SphereGeometry( 100, 32, 32 );
      self.mirrorRect1Camera = new self.$gThree.CubeCamera( 0.1, 5000, 512 );
      self.scene.add( self.mirrorRect1Camera );
      var mirrorRectMaterial1 = new self.$gThree.MeshBasicMaterial( { envMap: self.mirrorRect1Camera.renderTarget.texture } );
      self.mirrorRect1 = new self.$gThree.Mesh( geometry1, mirrorRectMaterial1 );
      self.mirrorRect1.position.set(500, 600, 500);
      self.mirrorRect1Camera.position.set(-500, 600, 500);// = mirrorRect1.position;
      self.scene.add(self.mirrorRect1);

      // Sphere
      var geometry2 =  new self.$gThree.SphereGeometry( 100, 32, 32 );
      self.mirrorRect2Camera = new self.$gThree.CubeCamera( 0.1, 5000, 512 );
      self.scene.add( self.mirrorRect2Camera )
      var mirrorRectMaterial2 = new self.$gThree.MeshBasicMaterial( { envMap: self.mirrorRect2Camera.renderTarget.texture } )
      self.mirrorRect2 = new self.$gThree.Mesh( geometry2, mirrorRectMaterial2 )
      self.mirrorRect2.position.set(-500, 300, -500)
      self.mirrorRect2Camera.position.set(-500, 300, -500)
      self.scene.add(self.mirrorRect2)

      // Cube
      var geometry3 =  new self.$gThree.CubeGeometry( 200, 600, 200, 1, 1, 1, )
      self.mirrorRect3Camera = new self.$gThree.CubeCamera( 0.1, 5000, 512 )
      self.scene.add( self.mirrorRect3Camera )
      var mirrorRectMaterial3 = new self.$gThree.MeshBasicMaterial({ 
        envMap: self.mirrorRect3Camera.renderTarget.texture,
        //reflectivity: 0.9,
        color: 0xaaaaaa,
      })
      self.mirrorRect3 = new self.$gThree.Mesh( geometry3, mirrorRectMaterial3 )
      self.mirrorRect3.position.set(-500, 300, 500)
      self.mirrorRect3Camera.position.set(-500, 300, 500)
      self.scene.add(self.mirrorRect3)

      // Cone
      var cone1 =  new self.$gThree.ConeGeometry( 200, 600, 64 )
      self.cone1Camera = new self.$gThree.CubeCamera( 1, 1000, 512 )
      self.scene.add( self.cone1Camera )
      var mirrorRectMaterial4 = new self.$gThree.MeshBasicMaterial({ 
        envMap: self.cone1Camera.renderTarget.texture, 
      })
      self.mirrorRect4 = new self.$gThree.Mesh( cone1, mirrorRectMaterial4 )
      self.mirrorRect4.position.set( 500, 300, -500 )
      self.cone1Camera.position.set(500, 300, -500)
      self.scene.add(self.mirrorRect4)
    },
    setOrbitControls () {
      var self = this
      // Build the controls.
      self.controls = new OrbitControls( self.camera, self.renderer.domElement )
      self.controls.enablePan = true
      self.controls.enableZoom = true 
      self.controls.maxDistance = 2000 
      self.controls.minDistance = 500
      self.controls.target.copy( new self.$gThree.Vector3( 0, 200, 0 ) )
      self.camera.lookAt(new self.$gThree.Vector3( 0, 200, 0 ))
      // self.controls = new OrbitControls( self.camera, self.renderer.domElement );
      self.controls.enablePan = false

      // function setOrientationControls(e) {
      //   if (!e.alpha) {
      //     return;
      //   }
      //   self.controls = new self.$gThree.DeviceOrientationControls( self.camera )
      //   self.controls.connect()
      //   window.removeEventListener('deviceorientation', setOrientationControls, true)
      // }
      // window.addEventListener('deviceorientation', setOrientationControls, true)
    },
    addGuides () {
      var axesHelper = new self.$gThree.AxesHelper( 5 );
      this.scene.add( axesHelper );
      console.log('adding guides')
    },
    update() {
      this.camera.updateProjectionMatrix()
    },
    animate () {
      var self = this
      self.reqAnim = requestAnimationFrame( self.animate.bind(this) )
      self.update()
      self.render()
    },
    render() {
      var self = this

      // console.log('rendering')

      self.updateReflections()
      
      // Render the scene.
      // renderer.render(scene, camera);
      self.renderer.render(self.scene, self.camera)
      
      // Rotate the lights.
      self.lightRotationPoint.rotation.y += 0.005
      
      // Don't let the camera go too low.
      if (self.camera.position.y < 30) {
        self.camera.position.y = 30;
      }
      
      // Slowly rotate the scene.
      self.rotationPoint.rotation.y += 0.0005;
    },
    updateReflections() {
      var self = this
      // Render the main sphere.
      self.mirrorSphere.visible = false
      self.mirrorSphereCamera.update( self.renderer, self.scene )
      self.mirrorSphere.visible = true
      
      // Render the other materials.
      self.mirrorRect1.visible = false
      self.mirrorRect1Camera.update( self.renderer, self.scene )
      self.mirrorRect1.visible = true
      
      self.mirrorRect2.visible = false
      self.mirrorRect2Camera.update( self.renderer, self.scene )
      self.mirrorRect2.visible = true

      self.mirrorRect3.visible = false
      self.mirrorRect3Camera.update( self.renderer, self.scene )
      self.mirrorRect3.visible = true
      
      self.mirrorRect4.visible = false
      self.cone1Camera.update( self.renderer, self.scene )
      self.mirrorRect4.visible = true
      
      // self.mirrorFloor.visible = false
      // self.mirrorFloorCamera.update( self.renderer, self.scene )
      // self.mirrorFloor.visible = true
    },
    onWindowResize() {
      var self = this
      self.camera.aspect = ( window.innerWidth / window.innerHeight )
      self.camera.updateProjectionMatrix()
      self.renderer.setSize( window.innerWidth, window.innerHeight )
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
