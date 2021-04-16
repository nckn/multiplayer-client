<template lang="pug">
  .container.face-info(ref="face_info")
</template>

<script>

// http://stemkoski.github.io/Three.js/Labeled-Geometry.html

import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
// import { WEBVR } from "three/examples/js/vr/WebVR.js";

// standard global variables
var container, scene, camera, renderer, controls, stats;
// var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();

// custom global variables
var cube;
var projector, mouse = { x: 0, y: 0 }, INTERSECTED;
var sprite1;
var canvas1, context1, texture1;

export default {
  name: 'FaceProjection',
  components: {
    //
  },
  data () {
    return {
      window: null
    }
  },
  mounted() {
    var self = this

    // Get window width
    self.window = {w: window.innerWidth, h: window.innerHeight}

    self.$nextTick(
      self.init(),
      self.animate()
    )
  },
  methods: {
    init() {
      var self = this
      container = self.$refs.face_info
      // document.body.appendChild(container)

      // SCENE
      scene = new THREE.Scene();
      // CAMERA
      var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
      var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
      camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
      scene.add(camera);
      camera.position.set(0,150,400);
      camera.lookAt(scene.position);	
      // RENDERER
      // if ( Detector.webgl )
      //   renderer = new THREE.WebGLRenderer( {antialias:true} );
      // else
      //   renderer = new THREE.CanvasRenderer(); 
      
      renderer = new THREE.WebGLRenderer( {antialias:true} );

      renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
      // container = document.getElementById( 'ThreeJS' );
      container.appendChild( renderer.domElement );
      // EVENTS
      // THREEx.WindowResize(renderer, camera);
      // THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });
      // CONTROLS
      // controls = new THREE.OrbitControls( camera, renderer.domElement );
      // STATS
      // stats = new Stats();
      // stats.domElement.style.position = 'absolute';
      // stats.domElement.style.bottom = '0px';
      // stats.domElement.style.zIndex = 100;
      // container.appendChild( stats.domElement );
      // LIGHT
      var light = new THREE.PointLight(0xffffff);
      light.position.set(0,250,0);
      scene.add(light);
      
      // SKYBOX/FOG
      var skyBoxGeometry = new THREE.CubeGeometry( 10000, 10000, 10000 );
      var skyBoxMaterial = new THREE.MeshBasicMaterial( { color: 0x9999ff, side: THREE.BackSide } );
      var skyBox = new THREE.Mesh( skyBoxGeometry, skyBoxMaterial );
      scene.add(skyBox);
      
      ////////////
      // CUSTOM //
      ////////////
      
      // var geometry = new THREE.SphereGeometry( 100, 4, 3 );
      var geometry = new THREE.CubeGeometry( 100, 100, 100 );
      geometry.mergeVertices();
      // geometry.computeCentroids();
      var material = new THREE.MeshNormalMaterial();
      var mesh = new THREE.Mesh( geometry, material );
      mesh.position.set(0,0,0);
      mesh.material.wireframe = true
      scene.add(mesh);
      
      for (var i = 0; i < geometry.vertices.length; i++)
      {
        var spritey = self.makeTextSprite( " " + i + " ", { fontsize: 32, backgroundColor: {r:255, g:100, b:100, a:1} } );
        self.makeSmallSphere(geometry.vertices[i].clone().multiplyScalar(1.0))
        // scene.add( spritey );
      }
      
      // for (var i = 0; i < geometry.faces.length; i++)
      // {
      //   var spritey = self.makeTextSprite( " " + i + " ", { fontsize: 32, backgroundColor: {r:100, g:100, b:255, a:1} } );
      //   spritey.position = geometry.faces[i].centroid.clone().multiplyScalar(1.1);
      //   scene.add( spritey );
      // }

      self.setOrbitControls()
    },
    makeSmallSphere(pos) {
      console.log('coming in')
      console.log(pos.x)
      var geometry = new THREE.SphereGeometry( 10, 12, 12 );
      geometry.mergeVertices();
      // geometry.computeCentroids();
      var material = new THREE.MeshNormalMaterial();
      var mesh = new THREE.Mesh( geometry, material );
      // mesh.position.set(0,10,0);
      mesh.position.set(pos.x, pos.y, pos.z)
      scene.add(mesh);
    },
    animate() {
      var self = this
      requestAnimationFrame(self.animate)
      self.render()
    },
    render () {
      var self = this
      renderer.render(scene, camera)
    },
    makeTextSprite( message, parameters ) {
      var self = this
      if ( parameters === undefined ) parameters = {};
      
      var fontface = parameters.hasOwnProperty("fontface") ? 
        parameters["fontface"] : "Arial";
      
      var fontsize = parameters.hasOwnProperty("fontsize") ? 
        parameters["fontsize"] : 18;
      
      var borderThickness = parameters.hasOwnProperty("borderThickness") ? 
        parameters["borderThickness"] : 4;
      
      var borderColor = parameters.hasOwnProperty("borderColor") ?
        parameters["borderColor"] : { r:0, g:0, b:0, a:1.0 };
      
      var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
        parameters["backgroundColor"] : { r:255, g:255, b:255, a:1.0 };

      //var spriteAlignment = parameters.hasOwnProperty("alignment") ?
      //	parameters["alignment"] : THREE.SpriteAlignment.topLeft;

      // var spriteAlignment = THREE.SpriteAlignment.topLeft;
        

      var canvas = document.createElement('canvas');
      var context = canvas.getContext('2d');
      context.font = "Bold " + fontsize + "px " + fontface;
        
      // get size data (height depends only on font size)
      var metrics = context.measureText( message );
      var textWidth = metrics.width;
      
      // background color
      context.fillStyle   = "rgba(" + backgroundColor.r + "," + backgroundColor.g + ","
                      + backgroundColor.b + "," + backgroundColor.a + ")";
      // border color
      context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + ","
                      + borderColor.b + "," + borderColor.a + ")";

      context.lineWidth = borderThickness;
      self.roundRect(context, borderThickness/2, borderThickness/2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);
      // 1.4 is extra height factor for text below baseline: g,j,p,q.
      
      // text color
      context.fillStyle = "rgba(0, 0, 0, 1.0)";

      context.fillText( message, borderThickness, fontsize + borderThickness);
      
      // canvas contents will be used for a texture
      var texture = new THREE.Texture(canvas) 
      texture.needsUpdate = true;

      var spriteMaterial = new THREE.SpriteMaterial( 
        { map: texture, useScreenCoordinates: false } );
      var sprite = new THREE.Sprite( spriteMaterial );
      sprite.scale.set(100,50,1.0);
      return sprite;	
    },
    setOrbitControls () {
      var self = this
      // Build the controls.
      self.controls = new OrbitControls( camera, renderer.domElement )
      // self.controls.enablePan = false
      self.controls.enableZoom = true 
      // self.controls.maxDistance = self.camDist
      self.controls.minDistance = 7
      self.controls.maxPolarAngle = (Math.PI * 0.5) * 0.99
    },
    roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x+r, y);
      ctx.lineTo(x+w-r, y);
      ctx.quadraticCurveTo(x+w, y, x+w, y+r);
      ctx.lineTo(x+w, y+h-r);
      ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
      ctx.lineTo(x+r, y+h);
      ctx.quadraticCurveTo(x, y+h, x, y+h-r);
      ctx.lineTo(x, y+r);
      ctx.quadraticCurveTo(x, y, x+r, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();   
    },
    onWindowResize () {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()

      renderer.setSize(window.innerWidth, window.innerHeight)
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
