<template lang="pug">
  .container.outer.black-bg
    #containerType(ref="container_type")
    #typeinfo
      button#color change color
      button#font change font
      button#weight change weight
      button#bevel change bevel
      br
      a#permalink(href='#') permalink
</template>
 
<script>

// https://www.clicktorelease.com/code/perlin/chrome.html

// https://redstapler.co/realistic-reflection-effect-three-js/
import * as THREE from 'three'
import { MixOperation } from 'three/build/three.min.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
// import Stats from 'three/examples/jsm/libs/stats.module.js';

import { map } from '@/assets/js/helpers'

// const panoImage = require('@/assets/images/pano.jpg')
const panoImage = require('@/assets/images/environment-textures-opposite-sunrise-01.jpg')

var text = "three.js",
  height = 20,
  size = 70,
  hover = 30,
  curveSegments = 4,
  bevelThickness = 2,
  bevelSize = 1.5,
  bevelEnabled = true,
  font = undefined,
  fontName = 'optimer', // helvetiker, optimer, gentilis, droid sans, droid serif
  fontWeight = 'bold'; // normal bold

var mirror = true;

var fontMap = {
  'helvetiker': 0,
  'optimer': 1,
  'gentilis': 2,
  'droid/droid_sans': 3,
  'droid/droid_serif': 4
};

var weightMap = {
  'regular': 0,
  'bold': 1
};

var reverseFontMap = [];
var reverseWeightMap = [];

for (var i in fontMap) reverseFontMap[fontMap[i]] = i;
for (var i in weightMap) reverseWeightMap[weightMap[i]] = i;

var targetRotation = 0;
var targetRotationOnMouseDown = 0;

var mouseX = 0;
var mouseXOnMouseDown = 0;

var windowHalfX = window.innerWidth / 2;

var fontIndex = 1;

const TEXTURE_PATH = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/123879/';

export default {
  name: 'Type',
  data () {
    return {
      container: null,
      scene: null,
      camera: null,
      // stats: null,
      permalink: null,
      hex: null,
      cameraTarget: null,
      group: null,
      textMesh1: null,
      textMesh2: null,
      textGeo: null,
      materials: null,
      firstLetter: true,
      // Reflection related
      textureCube: null,
      cube: null,
      cubeMaterial: null,
      mirrorSphere: null,
      mirrorSphereCamera: null,
      textCamera: null,
      // Reflection Dome
      reflectionDome: null
    }
  },
  components: {
    // 
  },
  mounted () {
    var self = this
    // console.log(vertexShader)
    self.$gThree.Cache.enabled = true
    setTimeout(() => {
      self.init()
      self.animate()
      // Orbit controls
      self.setOrbitControls()
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
    init() {
      var self = this
      
      self.container = self.$refs.container_type
      self.renderer = self.$parent.renderer
      self.container.appendChild( self.renderer.domElement )

      self.permalink = document.getElementById("permalink")

      // CAMERA
      // Create the camera.
      self.camera = new THREE.PerspectiveCamera(
        45, // Angle
        window.innerWidth / window.innerHeight, // Aspect Ratio.
        1, // Near view.
        23000 // Far view.
      );
      self.camera.position.z = -1500;
      self.camera.position.y = 200;
      // self.camera.layers.disable( 2 )

      self.cameraTarget = new self.$gThree.Vector3(0, 0, 0)

      // SCENE
      self.scene = new self.$gThree.Scene()
      self.scene.background = new self.$gThree.Color(0x000000)
      // self.scene.fog = new self.$gThree.Fog(0x000000, 250, 1400)

      // LIGHTS
      var dirLight = new self.$gThree.DirectionalLight(0xffffff, 0.125)
      dirLight.position.set(0, 0, 1).normalize()
      self.scene.add(dirLight)

      // Environment texture
      self.createReflectionDome()

      // Create base.
      self.createBase()
    
      // Create the main object.
      self.createGeometry()

      self.addGuides()

      var pointLight = new self.$gThree.PointLight(0xffffff, 1.5)
      pointLight.position.set(0, 100, 90)
      self.scene.add(pointLight)

      // Get text from hash
      var hash = document.location.hash.substr(1)

      if (hash.length !== 0) {
        var colorhash = hash.substring(0, 6)
        var fonthash = hash.substring(6, 7)
        var weighthash = hash.substring(7, 8)
        var bevelhash = hash.substring(8, 9)
        var texthash = hash.substring(10)

        self.hex = colorhash
        pointLight.color.setHex(parseInt(colorhash, 16))

        fontName = reverseFontMap[parseInt(fonthash)]
        fontWeight = reverseWeightMap[parseInt(weighthash)]

        bevelEnabled = parseInt(bevelhash)

        text = decodeURI(texthash)

        self.updatePermalink()

      } else {
        pointLight.color.setHSL(Math.random(), 1, 0.5)
        self.hex = self.decimalToHex(pointLight.color.getHex())
      }

      self.materials = [
        new self.$gThree.MeshPhongMaterial({ color: 0xffffff, flatShading: true }), // front
        new self.$gThree.MeshPhongMaterial({ color: 0xffffff }) // side
      ];

      self.group = new self.$gThree.Group()
      self.group.position.y = 0

      self.scene.add(self.group)

      self.loadFont()

      // var plane = new self.$gThree.Mesh(
      //   new self.$gThree.PlaneBufferGeometry(10000, 10000),
      //   new self.$gThree.MeshBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true })
      // );
      // plane.position.y = 100;
      // plane.rotation.x = - Math.PI / 2;
      // self.scene.add(plane);

      // RENDERER
      // renderer = new self.$gThree.WebGLRenderer({ antialias: true });
      // renderer.setPixelRatio(window.devicePixelRatio);
      // renderer.setSize(window.innerWidth, window.innerHeight);
      // container.appendChild(renderer.domElement);

      // STATS

      // self.stats = new Stats()
      //container.appendChild( stats.dom );

      // EVENTS
      document.addEventListener('mousedown', self.onDocumentMouseDown.bind(this), false)
      document.addEventListener('touchstart', self.onDocumentTouchStart.bind(this), false)
      document.addEventListener('touchmove', self.onDocumentTouchMove.bind(this), false)
      document.addEventListener('keypress', self.onDocumentKeyPress.bind(this), false)
      document.addEventListener('keydown', self.onDocumentKeyDown.bind(this), false)

      document.getElementById('color').addEventListener('click', function () {
        pointLight.color.setHSL(Math.random(), 1, 0.5)
        self.hex = self.decimalToHex(pointLight.color.getHex())
        self.updatePermalink();
      }, false);

      document.getElementById('font').addEventListener('click', function () {
        fontIndex++;
        fontName = reverseFontMap[fontIndex % reverseFontMap.length];
        self.loadFont()
      }, false);


      document.getElementById('weight').addEventListener('click', function () {
        if (fontWeight === 'bold') {
          fontWeight = 'regular';
        } else {
          fontWeight = 'bold';
        }
        self.loadFont()
      }, false)

      document.getElementById('bevel').addEventListener('click', function () {
        bevelEnabled = !bevelEnabled
        self.refreshText()
      }, false)

      // self.setOrbitControls()

      window.addEventListener( 'resize', self.onWindowResize, false );

      // self.render()
    },
    createReflectionDome() {
      var self = this
      var panoTexture = new THREE.TextureLoader().load( panoImage );
      // self.domeMat = new THREE.MeshBasicMaterial( { map: panoTexture } )
      self.domeMat = new THREE.MeshBasicMaterial({
        map: panoTexture
        // color: 0x000000
      })
      self.domeMat.side = THREE.DoubleSide
      var sphere = new THREE.Mesh( new THREE.SphereGeometry( 3000, 160, 160 ), self.domeMat );
      // sphere.scale.x = -1;
      sphere.doubleSided = true;
      self.reflectionDome = sphere
      self.scene.add( sphere );

      // Assign to layer
      // sphere.layers.set( 2 )
    },
    createBase () {
      var self = this
      // Create a floor.  
      var loader = new THREE.TextureLoader()
      loader.crossOrigin = '';
      loader.load( TEXTURE_PATH + 'MetalRustRepolished001_COL_1K_SPECULAR.jpg', function( texture ) {
        var repeatX = 16
        var repeatY = 16
        texture.anisotropy = self.renderer.capabilities.getMaxAnisotropy();
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(repeatX, repeatY);

        var normal = loader.load( TEXTURE_PATH + 'MetalRustRepolished001_NRM_1K_SPECULAR.jpg');
        normal.anisotropy = self.renderer.capabilities.getMaxAnisotropy();
        normal.wrapS = normal.wrapT = THREE.RepeatWrapping;
        normal.repeat.set(repeatX, repeatY);
        
        var ao = loader.load( TEXTURE_PATH + 'MetalRustRepolished001_GLOSS_VAR2_1K_SPECULAR.jpg');
        ao.anisotropy = self.renderer.capabilities.getMaxAnisotropy();
        ao.wrapS = normal.wrapT = THREE.RepeatWrapping;
        ao.repeat.set(repeatX, repeatY);

        var displace = loader.load( TEXTURE_PATH + 'MetalRustRepolished001_DISP_1K_SPECULAR.jpg');
        displace.anisotropy = self.renderer.capabilities.getMaxAnisotropy();
        displace.wrapS = displace.wrapT = THREE.RepeatWrapping;
        displace.repeat.set(repeatX, repeatY); 
        
        var spec = loader.load( TEXTURE_PATH + 'MetalRustRepolished001_REFL_1K_SPECULAR.jpg');
        spec.anisotropy = self.renderer.capabilities.getMaxAnisotropy();
        spec.wrapS = spec.wrapT = THREE.RepeatWrapping;
        spec.repeat.set(repeatX, repeatY);
        
        var material = new THREE.MeshStandardMaterial({
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
          // combine: THREE.mixOperation,
          combine: MixOperation,
          reflectivity: 0.3,
        });
        
        var simpleMat = new THREE.MeshBasicMaterial({ color: 0x000000 })

        // Create the floor geometry and mesh. Add to scene.
        var geometry = new THREE.PlaneGeometry( 50000, 50000 );
        geometry.computeFaceNormals();
        
        var floor = new THREE.Mesh(geometry, material);
        // var floor = new THREE.Mesh(geometry, simpleMat);
        // var floor = new THREE.Mesh(geometry, self.mirrorSphereMaterial0);
        floor.position.set(0, 0, 0);
        floor.rotation.x = -Math.PI/2;
        floor.receiveShadow = true;
        self.scene.add(floor);

        // var geometry3 =  new THREE.CubeGeometry( 5000, 20, 5000, 1, 1, 1, )
        // self.mirrorFloorCamera = new THREE.CubeCamera( 0.1, 5000, 512 )
        // self.scene.add( self.mirrorFloorCamera )
        // var mirrorRectMaterial3 = new THREE.MeshBasicMaterial({ 
        //   envMap: self.mirrorFloorCamera.renderTarget.texture,
        //   //reflectivity: 0.9,
        //   color: 0xaaaaaa,
        // })
        // self.mirrorFloor = new THREE.Mesh( geometry3, mirrorRectMaterial3 )
        // self.mirrorFloor.position.set(-500, 0, 500)
        // self.mirrorFloorCamera.position.set(-500, 300, 500)
        // self.scene.add(self.mirrorFloor)

      });
    },
    createGeometry() {
      var self = this
      
      // Sphere
      var geometry0 =  new THREE.SphereGeometry( 200, 64, 64 );
      self.mirrorSphereCamera = new THREE.CubeCamera( 0.1, 5000, 512 );
      self.scene.add( self.mirrorSphereCamera );

      self.mirrorSphereMaterial0 = new THREE.MeshBasicMaterial( { envMap: self.mirrorSphereCamera.renderTarget.texture } );
      self.mirrorSphere = new THREE.Mesh( geometry0, self.mirrorSphereMaterial0 );
      self.mirrorSphere.position.set(0, 0, 0);
      self.mirrorSphereCamera.position.set(0, 0, 0);
      // self.scene.add(self.mirrorSphere);
    },
    boolToNum(b) {
      return b ? 1 : 0
    },
    updatePermalink() {
      var self = this
      var link = self.hex + fontMap[fontName] + weightMap[fontWeight] + self.boolToNum(bevelEnabled) + '#' + encodeURI(text)
      self.permalink.href = '#' + link
      window.location.hash = link
    },
    onDocumentKeyDown(event) {
      var self = this
      if (self.firstLetter) {
        self.firstLetter = false
        text = ''
      }
      var keyCode = event.keyCode
      // backspace
      if (keyCode == 8) {
        event.preventDefault()
        text = text.substring(0, text.length - 1)
        self.refreshText()
        return false
      }
    },
    onDocumentKeyPress(event) {
      var self = this
      var keyCode = event.which
      // backspace
      if (keyCode == 8) {
        event.preventDefault()
      } else {
        var ch = String.fromCharCode(keyCode)
        text += ch
        self.refreshText()
      }
    },
    loadFont() {
      var self = this
      var loader = new THREE.FontLoader()
      loader.load('fonts/json/' + fontName + '_' + fontWeight + '.typeface.json', function (response) {
        font = response
        self.refreshText()
      })
    },
    createText() {
      var self = this
      self.textGeo = new self.$gThree.TextGeometry(text, {
        font: font,
        size: size,
        height: height,
        curveSegments: curveSegments,
        bevelThickness: bevelThickness,
        bevelSize: bevelSize,
        bevelEnabled: bevelEnabled
      })

      self.textGeo.computeBoundingBox()
      self.textGeo.computeVertexNormals()

      var triangle = new self.$gThree.Triangle()

      // "fix" side normals by removing z-component of normals for side faces
      // (this doesn't work well for beveled geometry as then we lose nice curvature around z-axis)

      if (!bevelEnabled) {
        var triangleAreaHeuristics = 0.1 * (height * size)
        for (var i = 0; i < self.textGeo.faces.length; i++) {
          var face = self.textGeo.faces[i]
          if (face.materialIndex == 1) {
            for (var j = 0; j < face.vertexNormals.length; j++) {
              face.vertexNormals[j].z = 0
              face.vertexNormals[j].normalize()
            }
            var va = self.textGeo.vertices[face.a]
            var vb = self.textGeo.vertices[face.b]
            var vc = self.textGeo.vertices[face.c]
            var s = triangle.set(va, vb, vc).getArea()
            if (s > triangleAreaHeuristics) {
              for (var j = 0; j < face.vertexNormals.length; j++) {
                face.vertexNormals[j].copy(face.normal)
              }
            }
          }
        }
      }

      var centerOffset = - 0.5 * (self.textGeo.boundingBox.max.x - self.textGeo.boundingBox.min.x);

      self.textGeo = new self.$gThree.BufferGeometry().fromGeometry(self.textGeo);

      var mat = new THREE.MeshBasicMaterial( { envMap: self.mirrorSphereCamera.renderTarget.texture } )
      self.textMesh1 = new self.$gThree.Mesh(self.textGeo, self.materials);
      // self.textMesh1 = new self.$gThree.Mesh(self.textGeo, mat);

      self.textMesh1.position.x = centerOffset
      self.textMesh1.position.y = hover
      self.textMesh1.position.z = 0
      self.textMesh1.rotation.x = 0
      self.textMesh1.rotation.y = Math.PI * 2
      self.group.add(self.textMesh1)

      if (mirror) {
        self.textMesh2 = new self.$gThree.Mesh(self.textGeo, mat)
        self.textMesh2.position.x = centerOffset
        self.textMesh2.position.y = - hover
        self.textMesh2.position.z = height
        self.textMesh2.rotation.x = Math.PI
        self.textMesh2.rotation.y = Math.PI * 2
        self.group.add(self.textMesh2)
      }
    },
    refreshText() {
      var self = this
      self.updatePermalink()
      self.group.remove(self.textMesh1);
      if (mirror) {
        self.group.remove(self.textMesh2)
      }
      if (!text) {
        return
      }
      self.createText()
    },
    onDocumentMouseDown(event) {
      var self = this
      event.preventDefault()
      // console.log('eveeeent: ', event)
      document.addEventListener('mousemove', self.onDocumentMouseMove, false)
      document.addEventListener('mouseup', self.onDocumentMouseUp, false)
      document.addEventListener('mouseout', self.onDocumentMouseOut, false)
      mouseXOnMouseDown = event.clientX - windowHalfX
      targetRotationOnMouseDown = targetRotation
    },
    onDocumentMouseMove(event) {
      // console.log('eveeeent: ', event.clientX)
      mouseX = event.clientX - windowHalfX
      targetRotation = targetRotationOnMouseDown + (mouseX - mouseXOnMouseDown) * 0.02
    },
    onDocumentMouseUp() {
      var self = this
      document.removeEventListener('mousemove', self.onDocumentMouseMove, false)
      document.removeEventListener('mouseup', self.onDocumentMouseUp, false)
      document.removeEventListener('mouseout', self.onDocumentMouseOut, false)
    },
    onDocumentMouseOut() {
      var self = this
      document.removeEventListener('mousemove', self.onDocumentMouseMove, false)
      document.removeEventListener('mouseup', self.onDocumentMouseUp, false)
      document.removeEventListener('mouseout', self.onDocumentMouseOut, false)
    },
    onDocumentTouchStart(event) {
      if (event.touches.length == 1) {
        event.preventDefault()
        mouseXOnMouseDown = event.touches[0].pageX - windowHalfX
        targetRotationOnMouseDown = targetRotation
      }
    },
    onDocumentTouchMove(event) {
      if (event.touches.length == 1) {
        event.preventDefault()
        mouseX = event.touches[0].pageX - windowHalfX
        targetRotation = targetRotationOnMouseDown + (mouseX - mouseXOnMouseDown) * 0.05
      }
    },
    decimalToHex(d) {
      var hex = Number(d).toString(16)
      hex = '000000'.substr(0, 6 - hex.length) + hex
      return hex.toUpperCase()
    },
    setOrbitControls () {
      var self = this
      self.controls = new OrbitControls( self.camera, self.$parent.renderer.domElement );
      self.controls.enablePan = false
      self.controls.maxDistance = 2000
    },
    addGuides () {
      var self = this
      var axesHelper = new self.$gThree.AxesHelper( 5 );
      this.scene.add( axesHelper );
      console.log('adding guides')
    },
    update() {
      this.camera.updateProjectionMatrix()
    },
    animate() {
      var self = this
      self.reqAnim = requestAnimationFrame( self.animate.bind(this) );
      self.update()
      self.render()
    }, 
    render() {
      var self = this
      self.group.rotation.y += (targetRotation - self.group.rotation.y) * 0.05

      self.camera.lookAt(self.cameraTarget)

      self.updateReflections()

      // self.renderer.clear()
      self.renderer.render(self.scene, self.camera);
      // self.reqAnim = requestAnimationFrame( self.render.bind(this) );
    },
    updateReflections() {
      var self = this
      
      // self.reflectionDome.visible = false
      self.mirrorSphere.visible = false
      self.mirrorSphereCamera.update( self.renderer, self.scene )
      self.mirrorSphere.visible = true
      
      // Render the other materials.
      
      // self.mirrorFloor.visible = false
      // self.mirrorFloorCamera.update( self.renderer, self.scene )
      // self.mirrorFloor.visible = true
    },
    onWindowResize() {
      var self = this
      windowHalfX = window.innerWidth / 2
      self.camera.aspect = window.innerWidth / window.innerHeight
      self.camera.updateProjectionMatrix()
      self.renderer.setSize(window.innerWidth, window.innerHeight)
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

#typeinfo {
  position: absolute;
  bottom: 0;
  right: 0;
  width: auto;
}

</style>
