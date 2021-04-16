<template lang="pug">
  .container.outer.black-bg(ref="master_cont")
    #containerPosAudio(ref="sound_cont")
</template>
 
<script>

// Example
// https://github.com/mrdoob/three.js/blob/master/examples/webgl_postprocessing_unreal_bloom.html

import * as THREE from 'three'
import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls.js'

const path = 'audio/'

const sounds = [
  'budhists-1.mp3',
  'Fukuoka-forest-1.mp3',
  'Kyrgyzstan-mountain-3.mp3',
]

export default {
  name: 'PosAudio',
  data () {
    return {
      container: null,
      scene: null,
      camera: null,
      composer: null,
      light: null,
      // Audio specific
      audioLoader: null,
      materials1: null,
      materials2: null,
      materials3: null,
      analyser1: null,
      analyser2: null,
      analyser3: null,
      clock: null,
      listener: null,
      startButton: null,
    }
  },
  async mounted () {
    var self = this
    // self.startButton = self.$refs.start_button
    self.container = self.$refs.sound_cont
    self.clock = new THREE.Clock();
    setTimeout(() => {
      self.init()
    }, 200)
  },
  beforeDestroy () {
    var self = this
    // console.log('before destroy')
    window.cancelAnimationFrame( self.reqAnim );
    // Dispose objects
    // self.listener.context.close()
    self.listener.context.suspend()
    if (self.gui) {
      self.gui.destroy()
    }
    // self.controls.dispose()
    while(self.scene.children.length > 0){
      // console.log('before destroying: ', self.scene.children[0])
      self.scene.remove(self.scene.children[0]);
    }
  }, 
  methods: {
    init () {
      var self = this
      // var overlay = document.getElementById( 'overlay' );
      // overlay.remove();

      self.camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 10000 );
      self.camera.position.set( 0, 25, 0 );

      self.listener = new THREE.AudioListener();
      self.listener.context.resume()

      self.camera.add( self.listener );

      self.scene = new THREE.Scene();
      self.scene.fog = new THREE.FogExp2( 0x000000, 0.0025, 1500 );

      self.container.appendChild( self.$parent.renderer.domElement );

      self.light = new THREE.DirectionalLight( 0xffffff );
      self.light.position.set( 0, 1, 1 ).normalize();
      self.scene.add( self.light );

      self.ambient = new THREE.AmbientLight( 0xffffff, 0.1 );
      self.scene.add( self.ambient );

      var sphere = new THREE.SphereBufferGeometry( 20, 32, 16 );

      self.material1 = new THREE.MeshPhongMaterial( { color: 0xffaa00, flatShading: true, shininess: 0 } );
      self.material2 = new THREE.MeshPhongMaterial( { color: 0xff2200, flatShading: true, shininess: 0 } );
      self.material3 = new THREE.MeshPhongMaterial( { color: 0x6622aa, flatShading: true, shininess: 0 } );

      // sound spheres

      self.audioLoader = new THREE.AudioLoader();

      var mesh1 = new THREE.Mesh( sphere, self.material1 );
      mesh1.position.set( - 250, 30, 0 );
      self.scene.add( mesh1 );

      var sound1 = new THREE.PositionalAudio( self.listener );
      self.audioLoader.load( path + sounds[0], function ( buffer ) {

        sound1.setBuffer( buffer );
        sound1.setRefDistance( 20 );
        sound1.play();

      } );
      mesh1.add( sound1 );

      //
      var mesh2 = new THREE.Mesh( sphere, self.material2 );
      mesh2.position.set( 250, 30, 0 );
      self.scene.add( mesh2 );

      var sound2 = new THREE.PositionalAudio( self.listener );
      self.audioLoader.load( path + sounds[1], function ( buffer ) {
        sound2.setBuffer( buffer );
        sound2.setRefDistance( 20 );
        sound2.play();

      } );
      mesh2.add( sound2 );

      //
      var mesh3 = new THREE.Mesh( sphere, self.material3 );
      mesh3.position.set( 0, 30, - 250 );
      self.scene.add( mesh3 );

      var sound3 = new THREE.PositionalAudio( self.listener );
      var oscillator = self.listener.context.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime( 144, sound3.context.currentTime );
      // oscillator.start( 0 );
      sound3.setNodeSource( oscillator );
      sound3.setRefDistance( 20 );
      sound3.setVolume( 0.5 );
      mesh3.add( sound3 );

      // analysers
      self.analyser1 = new THREE.AudioAnalyser( sound1, 32 );
      self.analyser2 = new THREE.AudioAnalyser( sound2, 32 );
      self.analyser3 = new THREE.AudioAnalyser( sound3, 32 );

      // global ambient audio
      var sound4 = new THREE.Audio( self.listener );
      self.audioLoader.load( path + sounds[2], function ( buffer ) {

        sound4.setBuffer( buffer );
        sound4.setLoop( true );
        sound4.setVolume( 0.5 );
        sound4.play();

      } );

      // ground

      var helper = new THREE.GridHelper( 1000, 10, 0x444444, 0x444444 );
      helper.position.y = 0.1;
      self.scene.add( helper );

      // Sound
      var SoundControls = function () {
        this.master = self.listener.getMasterVolume();
        this.firstSphere = sound1.getVolume();
        this.secondSphere = sound2.getVolume();
        this.thirdSphere = sound3.getVolume();
        this.Ambient = sound4.getVolume();
      };

      var GeneratorControls = function () {
        this.frequency = oscillator.frequency.value;
        this.wavetype = oscillator.type;
      };

      self.gui = new GUI()
      var soundControls = new SoundControls()
      var generatorControls = new GeneratorControls()
      var volumeFolder = self.gui.addFolder( 'sound volume' )
      var generatorFolder = self.gui.addFolder( 'sound generator' )

      volumeFolder.add( soundControls, 'master' ).min( 0.0 ).max( 1.0 ).step( 0.01 ).onChange( function () {
        self.listener.setMasterVolume( soundControls.master );
      } );

      volumeFolder.add( soundControls, 'firstSphere' ).min( 0.0 ).max( 1.0 ).step( 0.01 ).onChange( function () {
        sound1.setVolume( soundControls.firstSphere );
      } );

      volumeFolder.add( soundControls, 'secondSphere' ).min( 0.0 ).max( 1.0 ).step( 0.01 ).onChange( function () {
        sound2.setVolume( soundControls.secondSphere );
      } );

      volumeFolder.add( soundControls, 'thirdSphere' ).min( 0.0 ).max( 1.0 ).step( 0.01 ).onChange( function () {
        sound3.setVolume( soundControls.thirdSphere );
      } );

      volumeFolder.add( soundControls, 'Ambient' ).min( 0.0 ).max( 1.0 ).step( 0.01 ).onChange( function () {
        sound4.setVolume( soundControls.Ambient );
      } );

      volumeFolder.open();

      generatorFolder.add( generatorControls, 'frequency' ).min( 50.0 ).max( 5000.0 ).step( 1.0 ).onChange( function () {
        oscillator.frequency.setValueAtTime( generatorControls.frequency, self.listener.context.currentTime );
      } );

      generatorFolder.add( generatorControls, 'wavetype', [ 'sine', 'square', 'sawtooth', 'triangle' ] ).onChange( function () {
        oscillator.type = generatorControls.wavetype;
      } );

      generatorFolder.open();

      // Orbit controls
      self.setOrbitControls()

      // Listen for resize
      window.addEventListener( 'resize', self.onWindowResize, false );
      
      self.render();

    },
    render () {
      var self = this
      const delta = self.clock.getDelta()
      self.controls.update( delta );
      self.material1.emissive.b = self.analyser1.getAverageFrequency() / 256
      self.material2.emissive.b = self.analyser2.getAverageFrequency() / 256
      self.material3.emissive.b = self.analyser3.getAverageFrequency() / 256
      self.$parent.renderer.render(self.scene, self.camera)
      // console.log('rendering')
      self.reqAnim = requestAnimationFrame( self.render.bind(this) )
    },
    setOrbitControls () {
      var self = this
      
      // Orbit controls
      // self.controls = new OrbitControls( self.camera, self.$parent.renderer.domElement );
      // // self.controls.enablePan = false
      // self.controls.enableDamping = true
      // // self.controls.zoomSpeed = 0.2
      // // self.controls.addEventListener('change', self.requestRenderIfNotRequested)
      // Orbit controls - end

      // FPS Controls
      self.controls = new FirstPersonControls( self.camera, self.$parent.renderer.domElement );
      self.controls.movementSpeed = 70;
      self.controls.lookSpeed = 0.05;
      self.controls.noFly = true;
      self.controls.lookVertical = false;
      // FPS Controls - end

    },
    onWindowResize() {
      var self = this
      self.width = window.innerWidth;
      self.height = window.innerHeight;

      self.camera.aspect = self.width / self.height;
      self.camera.updateProjectionMatrix();
      self.$parent.renderer.setSize(self.width, self.height);

      // Get window width
      self.window = {w: window.innerWidth, h: window.innerHeight}
      console.log('windowW: ', self.window.w)
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>

</style>
