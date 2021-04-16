<template lang="pug">
  .container.outer.black-bg(ref="master_cont")
    #containerNiceLight(ref="cont")
    //- img.img(src="@/assets/images/basilica/posx.jpg" width="400" height="400")
</template>
 
<script>

// https://blog.selfshadow.com/sandbox/ltc.html
// https://twitter.com/josdirksen/status/932231275427049472
// https://github.com/josdirksen/learning-threejs/blob/master/chapter-03/06-area-light.html

// import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// import { generateRandomNumber } from '@/assets/js/helpers'

// import Stats from 'three/examples/jsm/libs/stats.module.js';
// import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'
// import ShaderDeferred from 'three/examples/jsm/postprocessing/ShaderDeferred.js'
// import RenderPass from 'three/examples/jsm/postprocessing/RenderPass.js'
// import EffectComposer from 'three/examples/jsm/postprocessing/EffectComposer.js'
// import CopyShader from 'three/examples/jsm/postprocessing/CopyShader.js'
// import ShaderPass from 'three/examples/jsm/postprocessing/ShaderPass.js'
// import FXAAShader from 'three/examples/jsm/postprocessing/FXAAShader.js'
// import MaskPass from 'three/examples/jsm/postprocessing/MaskPass.js'

// import { map } from '@/assets/js/helpers'

// Noise shader
// const vertexShader = require('@/assets/js/vertexShader.glsl')
// const fragmentShader = require('@/assets/js/fragmentShader.glsl')

// const panoImage = require('@/assets/images/pano.jpg')

export default {
  name: 'NiceLight',
  // props: ['renderer'],
  data () {
    return {
      container: null,
      scene: null,
      camera: null,
      // renderer: null,
      composer: null,
      origin: new this.$gThree.Vector3(),
      param: {},
      // stats: null,
      rectLight: [],
      rectLightMesh: [],
      numOfLights: 2,
      areaLights: [],
      objects: [],
      reqAnim: null,
      renderRequested: false,
      // Shader
      mesh: null,
      fov: 45,
      start: Date.now(),
      controls: null,
      animTime: 0.000025,
      // spheres
      mshStdSphere: null,
      sphereSize: null,
      noOC: 8,
      ringSize: 28
    }
  },
  // watch: {
  //   $parent () {
  //     console.log('this thing: ', this.renderer)
  //   // console.log('the renderer: ', self.$root)
  //   }
  // },
  created () {
    //
  },
  async mounted () {
    var self = this
    // console.log('this thing: ', RectAreaLightUniformsLib)
    // console.log('the renderer: ', self.$root)
    // self.renderer = await self.$parent.renderer
    // console.log('the renderer: ', self.$parent.renderer)
    setTimeout(() => {
      // console.log('the renderer: ', self.renderer)
      self.init()
      // Orbit controls
      self.setOrbitControls()
      // self.render() 
    }, 200)
    // await function () {
    //   this.init();
    //   this.render();
    //   this.setOrbitControls()
    // }
    // Orbit controls
    // self.$nextTick(() => {
    // })
  },
  beforeDestroy () {
    var self = this
    console.log('before destroy NiceLight')
    window.cancelAnimationFrame( self.reqAnim );
    // Dispose controls
    if (typeof self.controls != 'undefined') {
      console.log('destroying controls')
      self.controls.dispose()
    }
    while(self.scene.children.length > 0){
      // console.log('before destroying: ', self.scene.children[0])
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
    init () {
      var self = this

      self.container = self.$refs.cont
      // console.log('ze renderrrr: ', self.$parent.renderer)

      // self.renderer = new self.$gThree.WebGLRenderer( { antialias: true } );
      // self.renderer.setPixelRatio( window.devicePixelRatio );
      // self.renderer.setSize( window.innerWidth, window.innerHeight );
      // self.renderer.shadowMap.enabled = true;
      // self.renderer.shadowMap.type = self.$gThree.PCFSoftShadowMap;
      // self.renderer.outputEncoding = self.$gThree.sRGBEncoding;
      // self.$refs.master_cont.appendChild( self.renderer.domElement );

      // Check for float-RT support
      // TODO (abelnation): figure out fall-back for float textures

      // if ( ! self.renderer.extensions.get( 'OES_texture_float' ) ) {
      //   alert( 'OES_texture_float not supported' );
      //   throw 'missing webgl extension';
      // }

      // if ( ! self.renderer.extensions.get( 'OES_texture_float_linear' ) ) {
      //   alert( 'OES_texture_float_linear not supported' );
      //   throw 'missing webgl extension';
      // }

      self.container.appendChild( self.$parent.renderer.domElement );

      self.camera = new self.$gThree.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
      self.camera.position.set( 0, 20, 35 );

      self.scene = new self.$gThree.Scene();

      // self.ambient = new self.$gThree.AmbientLight( 0xffffff, 0.1 );
      // self.scene.add( self.ambient );

      // var alight = new self.$gThree.AmbientLight( 0x404040, 0.7 ); // soft white light
      // self.scene.add( alight );

      var geoFloor = new self.$gThree.BoxBufferGeometry( 2000, 0.1, 2000 );
      self.matStdFloor = new self.$gThree.MeshStandardMaterial( { color: 0x000000, roughness: 0, metalness: 0 } );
      var mshStdFloor = new self.$gThree.Mesh( geoFloor, self.matStdFloor );
      mshStdFloor.position.y = 0
      // console.log(mshStdFloor)
      self.matStdFloor.castShadow = true;
      self.matStdFloor.receiveShadow = true;
      self.scene.add( mshStdFloor );

      self.material = new self.$gThree.MeshStandardMaterial( { color: 0x000000, roughness: 0, metalness: 0 } );
      // var otherMaterial = new self.$gThree.MeshStandardMaterial( { color: 0x000000, roughness: 0, metalness: 0 } );
      
      // Shader
      // var panoTexture = new self.$gThree.TextureLoader().load( panoImage );

      // self.material = new self.$gThree.ShaderMaterial( {
      //   color: 0x000000,
      //   roughness: 0,
      //   metalness: 0,
      //   uniforms: {
      //     // tShine: { type: "t", value: panoTexture },
      //     tShine: { type: "t", value: otherMaterial },
      //     time: { type: "f", value: 0 },
      //     weight: { type: "f", value: 0 }
      //   },
      //   vertexShader: vertexShader,
      //   fragmentShader: fragmentShader
      //   // vertexShader: document.getElementById( 'vertexShader' ).textContent,
      //   // fragmentShader: document.getElementById( 'fragmentShader' ).textContent
      // });

      self.sphereSize = 6
      var geoSphere = new self.$gThree.SphereBufferGeometry( self.sphereSize, 60, 60 );
      self.mshStdSphere = new self.$gThree.Mesh( geoSphere, self.material );
      self.mshStdSphere.position.set( 0, self.sphereSize, 0 );
      self.mshStdSphere.castShadow = true;
      self.mshStdSphere.receiveShadow = true;
      self.scene.add( self.mshStdSphere );

      // var geoBox = new self.$gThree.BoxBufferGeometry( 16, 1, 16 );
      // var mshStdBox = new self.$gThree.Mesh( geoBox, self.material );
      // // var mshStdBox = new self.$gThree.Mesh( geoBox, self.matStdObjects );
      // mshStdBox.position.set( 0, 0, 0 );
      // // mshStdBox.rotation.set( 0, Math.PI, 0 );
      // mshStdBox.castShadow = true;
      // mshStdBox.receiveShadow = true;
      // self.scene.add( mshStdBox );

      // var geoKnot = new self.$gThree.TorusKnotBufferGeometry( 1.5, 0.5, 100, 16 );
      // var mshStdKnot = new self.$gThree.Mesh( geoKnot, self.matStdObjects );
      // mshStdKnot.position.set( 5, 5, 0 );
      // mshStdKnot.castShadow = true;
      // mshStdKnot.receiveShadow = true;
      // self.scene.add( mshStdKnot );

      RectAreaLightUniformsLib.init();

      // self.setupColoredAreaLight()
      self.setupAreaLight()

      self.controls = new OrbitControls( self.camera, self.$parent.renderer.domElement );
      self.controls.target.copy( self.mshStdSphere.position );
      // self.controls.update();

      // self.initGUI()

      window.addEventListener( 'resize', self.onWindowResize, false );

      self.render();
      // self.renderShader();

      // add plane to the scene
      // var plane = new self.$gThree.Mesh(
      //   new self.$gThree.BoxBufferGeometry( Math.PI, Math.sqrt( 2 ), Math.E ),
      //   new self.$gThree.MeshLambertMaterial({
      //     color: 0x00afaf,
      //     emissive: 0x2a2a2a,
      //     emissiveIntensity: .5,
      //     side: self.$gThree.DoubleSide
      // }));
      // self.scene.add(plane);
    },
    setupAreaLight () {
      var self = this
      for (var i = 0; i < self.noOC; i++ ) {
        self.rectLight[i] = new self.$gThree.RectAreaLight( 0xffffff, 1, 10, 10 );
        // self.rectLight[i].position.set( 5 * i, 10, 0 );

        // Distribute in circle
        self.rectLight[i].position.y = 10
        self.rectLight[i].position.x = Math.sin( i / self.noOC * Math.PI * 2 ) * self.ringSize
        self.rectLight[i].position.z = Math.cos( i / self.noOC * Math.PI * 2 ) * self.ringSize

        // Rotation
        // self.rectLight[i].rotation.set(-Math.PI / 2, 0, 0)

        // self.rectLight[i].rotation.set( Math.PI, Math.PI / 4, 0 );
        self.scene.add( self.rectLight[i] );
        // self.rectLight[i].lookAt( new self.$gThree.Vector3(0,0,0) );
        self.rectLight[i].lookAt( new self.$gThree.Vector3(0, self.mshStdSphere.position.y + self.sphereSize / 2, 0) );

        console.log('sphere: ' , self.mshStdSphere.position.y)
  
        // var rectLightMesh = new self.$gThree.Mesh( new self.$gThree.PlaneBufferGeometry(), new self.$gThree.MeshBasicMaterial( { side: self.$gThree.DoubleSide } ) );
        self.rectLightMesh[i] = new self.$gThree.Mesh( new self.$gThree.BoxGeometry(1, 1, 1, 10, 10), new self.$gThree.MeshBasicMaterial( { side: self.$gThree.DoubleSide } ) );
        // rectLightMesh.rotation.x = Math.PI / 4
        // rectLightMesh.scale.x = self.rectLight.width;
        // rectLightMesh.scale.y = self.rectLight.width;
        // rectLightMesh.scale.z = self.rectLight.width;
        self.rectLightMesh[i].scale.x = self.rectLight[i].width;
        self.rectLightMesh[i].scale.y = self.rectLight[i].height;
        self.rectLightMesh[i].scale.z = 0.1

        // Rotation
        // self.rectLightMesh[i].rotation.set(Math.PI / 4, 0, 0)

        self.rectLight[i].add( self.rectLightMesh[i] );
  
        var rectLightMeshBack = new self.$gThree.Mesh( new self.$gThree.PlaneBufferGeometry(), new self.$gThree.MeshBasicMaterial( { color: 0x080808 } ) );
        self.rectLightMesh[i].add( rectLightMeshBack );
      }

      // var vector = new self.$gThree.Vector3();
      // var objLength = 30

      // for ( var i = 0, l = objLength; i < l; i ++ ) {
      //   // var object = objects[ i ];
      //   // console.log(i)
      //   var phi = Math.acos( -1 + ( 2 * i ) / l );
      //   var theta = Math.sqrt( l * Math.PI ) * phi;
      //   // var object = new self.$gThree.Object3D();
      //   //
      //   self.rectLight[i] = new self.$gThree.RectAreaLight( 0xffffff, 1, 10, 10 );
      //   // self.rectLight[i].position.set( 5, 10, 0 );
      //   // self.rectLight[i].rotation.set( Math.PI, 0, 0 );
      //   self.scene.add( self.rectLight[i] );

      //   // var rectLightMesh = new self.$gThree.Mesh( new self.$gThree.PlaneBufferGeometry(), new self.$gThree.MeshBasicMaterial( { side: self.$gThree.DoubleSide } ) );
      //   self.rectLightMesh[i] = new self.$gThree.Mesh( new self.$gThree.BoxGeometry(1, 1, 1, 10, 10), new self.$gThree.MeshBasicMaterial( { side: self.$gThree.DoubleSide } ) );
      //   self.rectLightMesh[i].scale.x = self.rectLight[i].width;
      //   self.rectLightMesh[i].scale.y = self.rectLight[i].height;
      //   self.rectLightMesh[i].scale.z = 0.1
      //   self.rectLight[i].add( self.rectLightMesh[i] );

      //   var rectLightMeshBack = new self.$gThree.Mesh( new self.$gThree.PlaneBufferGeometry(), new self.$gThree.MeshBasicMaterial( { color: 0x080808 } ) );
      //   self.rectLightMesh[i].add( rectLightMeshBack );
      //   //
      //   self.rectLightMesh[i].position.x = 40 * Math.cos( theta ) * Math.sin( phi );
      //   self.rectLightMesh[i].position.y = 40 * Math.sin( theta ) * Math.sin( phi );
      //   self.rectLightMesh[i].position.z = 40 * Math.cos( phi );
      //   // vector.copy( self.rectLightMesh[i].position ).multiplyScalar( 2 );
      //   self.rectLightMesh[i].lookAt( vector );
      //   // targets.sphere.push( object );
      // }
      
      // }
    },
    setupColoredAreaLight () {
      var self = this
      var areaLight1 = new self.$gThree.RectAreaLight(0xff0000, 3);
      areaLight1.position.set(0, 5, -8);
      areaLight1.rotation.set(-Math.PI / 2, 0, 0);
      areaLight1.width = 4;
      areaLight1.height = 9.9;
      self.scene.add(areaLight1);

      var areaLight2 = new self.$gThree.RectAreaLight(0x00ff00, 3);
      areaLight2.position.set(0, 10, -35);
      areaLight2.rotation.set(-Math.PI / 2, 0, 0);
      areaLight2.width = 4;
      areaLight2.height = 9.9;
      self.scene.add(areaLight2);

      var areaLight3 = new self.$gThree.RectAreaLight(0x0000ff, 3);
      areaLight3.position.set(10, 10, -35);
      areaLight3.rotation.set(-Math.PI / 2, 0, 0);
      areaLight3.width = 4;
      areaLight3.height = 9.9;
      self.scene.add(areaLight3);

      var planeGeometry1 = new self.$gThree.BoxGeometry(4, 10, 0);
      var planeGeometry1Mat = new self.$gThree.MeshBasicMaterial({color: 0xff0000});
      var plane1 = new self.$gThree.Mesh(planeGeometry1, planeGeometry1Mat);
      plane1.position.copy(areaLight1.position);
      self.scene.add(plane1);

      var planeGeometry2 = new self.$gThree.BoxGeometry(4, 10, 0);
      var planeGeometry2Mat = new self.$gThree.MeshBasicMaterial({color: 0x00ff00});
      var plane2 = new self.$gThree.Mesh(planeGeometry2, planeGeometry2Mat);

      plane2.position.copy(areaLight2.position);
      self.scene.add(plane2);

      var planeGeometry3 = new self.$gThree.BoxGeometry(4, 10, 0);
      var planeGeometry3Mat = new self.$gThree.MeshBasicMaterial({color: 0x0000ff});
      var plane3 = new self.$gThree.Mesh(planeGeometry3, planeGeometry3Mat);

      plane3.position.copy(areaLight3.position);
      self.scene.add(plane3);
    },
    onWindowResize () {
      var self = this
      self.camera.aspect = ( window.innerWidth / window.innerHeight )
      self.camera.updateProjectionMatrix()
      self.$parent.renderer.setSize( window.innerWidth, window.innerHeight )
    },
    resizeRendererToDisplaySize(renderer) {
      const canvas = renderer.domElement;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const needResize = canvas.width !== width || canvas.height !== height;
      if (needResize) {
        renderer.setSize(width, height, false);
      }
      return needResize;
    },
    // Shader
    renderShader() {
      var self = this
      self.material.uniforms[ 'time' ].value = self.animTime * ( Date.now() - self.start );
      self.material.uniforms[ 'weight' ].value = 10.0 * ( 0.5 + 0.5 * Math.sin( 0.00025 * ( Date.now() - self.start ) ) );
      // material.uniforms[ 'weight' ].value = 10.0;
      self.$parent.renderer.render(self.scene, self.camera);
      self.reqAnim = requestAnimationFrame( self.renderShader.bind(this) );
    },
    render () {
      var self = this
      self.renderRequested = undefined;

      // if (self.resizeRendererToDisplaySize(self.$parent.renderer)) {
      //   const canvas = self.$parent.renderer.domElement;
      //   self.camera.aspect = canvas.clientWidth / canvas.clientHeight;
      //   self.camera.updateProjectionMatrix();
      // }

      self.controls.update();
      // self.$parent.renderer.render(self.scene, self.camera);

      // console.log('rendering')
      // self.reqAnim = requestAnimationFrame( self.render.bind(this) );
      // console.log(`running this route: ${this.$route.path}`)
      // if ( self.param.motion ) {
      //   var t = ( Date.now() / 2000 );
      //   // move light in circle around center
      //   // change light height with sine curve
      //   var r = 15.0;
      //   var lx = r * Math.cos( t );
      //   var lz = r * Math.sin( t );
      //   var ly = 5.0 + 5.0 * Math.sin( t / 3.0 );
      //   self.rectLight.position.set( lx, ly, lz );
      //   self.rectLight.lookAt( self.origin );
      // }

      // console.log(self.renderer)

      self.$parent.renderer.render( self.scene, self.camera );

      // self.stats.update();
    },
    requestRenderIfNotRequested() {
      var self = this
      if (!self.renderRequested) {
        self.renderRequested = true;
        self.reqAnim = requestAnimationFrame( self.render.bind(this) );
      }
    },
    setOrbitControls () {
      var self = this
      // console.log(`controls before: ${self.controls}`)
      self.controls = new OrbitControls( self.camera, self.$parent.renderer.domElement );
      self.controls.enablePan = false
      // console.log(`controls after: ${self.controls}`)
      self.controls.enableDamping = true
      self.controls.zoomSpeed = 0.2
      self.controls.addEventListener('change', self.requestRenderIfNotRequested)
    },
    initGUI() {
      // var self = this
      // // GUI

      // // var gui = new GUI( { width: 300 } );
      // // gui.open();

      // self.tweaker = self.rectLight[0]

      // self.param = {
      //   motion: true,
      //   width: self.tweaker.width,
      //   height: self.tweaker.height,
      //   color: self.tweaker.color.getHex(),
      //   intensity: self.tweaker.intensity,
      //   'ambient': self.ambient.intensity,
      //   'floor color': self.matStdFloor.color.getHex(),
      //   'object color': self.matStdObjects.color.getHex(),
      //   'roughness': self.matStdFloor.roughness,
      //   'metalness': self.matStdFloor.metalness
      // };

      // // gui.add( self.param, 'motion' );

      // var lightFolder = gui.addFolder( 'Light' );

      // lightFolder.add( self.param, 'width', 1, 20 ).step( 0.1 ).onChange( function ( val ) {

      //   self.tweaker.width = val;
      //   self.rectLightMesh[0].scale.x = val;

      // } );

      // lightFolder.add( self.param, 'height', 1, 20 ).step( 0.1 ).onChange( function ( val ) {

      //   self.tweaker.height = val;
      //   self.rectLightMesh[0].scale.y = val;

      // } );

      // lightFolder.addColor( self.param, 'color' ).onChange( function ( val ) {

      //   self.tweaker.color.setHex( val );
      //   self.rectLightMesh[0].material.color.copy( self.tweaker.color ).multiplyScalar( self.tweaker.intensity );

      // } );

      // lightFolder.add( self.param, 'intensity', 0.0, 4.0 ).step( 0.01 ).onChange( function ( val ) {

      //   self.tweaker.intensity = val;
      //   self.rectLightMesh[0].material.color.copy( self.rectLight.color ).multiplyScalar( self.rectLight.intensity );

      // } );

      // lightFolder.add( self.param, 'ambient', 0.0, 0.2 ).step( 0.01 ).onChange( function ( val ) {

      //   self.ambient.intensity = val;

      // } );

      // lightFolder.open();

      // var standardFolder = gui.addFolder( 'Standard Material' );

      // standardFolder.addColor( self.param, 'floor color' ).onChange( function ( val ) {
      //   self.matStdFloor.color.setHex( val );
      // } );

      // standardFolder.addColor( self.param, 'object color' ).onChange( function ( val ) {
      //   self.matStdObjects.color.setHex( val );
      // } );

      // standardFolder.add( self.param, 'roughness', 0.0, 1.0 ).step( 0.01 ).onChange( function ( val ) {
      //   self.matStdObjects.roughness = val;
      //   self.matStdFloor.roughness = val;
      // } );

      // // TODO (abelnation): use env map to reflect metal property
      // standardFolder.add( self.param, 'metalness', 0.0, 1.0 ).step( 0.01 ).onChange( function ( val ) {
      //   self.matStdObjects.metalness = val;
      //   self.matStdFloor.metalness = val;
      // } );

      // standardFolder.open();

      // TODO: rect area light distance
      // TODO: rect area light decay

      // self.stats = new Stats();
      // document.body.appendChild( self.stats.dom );
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>

</style>
