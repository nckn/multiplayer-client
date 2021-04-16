import Vue from 'vue'
import * as THREE from 'three'

// https://www.digitalocean.com/community/tutorials/vuejs-creating-custom-plugins

const globalThreefunctions = {
  // The install method is all that needs to exist on the plugin object.
  // It takes the global Vue object as well as user-defined options.
  install (Vue, options) {
    // We call Vue.mixin() here to inject functionality into all components.
    // Vue.mixin({
    //   // Anything added to a mixin will be injected into all components.
    //   // In this case, the mounted() method runs when the component is added to the DOM.
    //   mounted () {
    //     console.log('Mounted!')
    //   }
    // })
    // Vue.prototype.doStuff = function() {
    //   console.log("I'm a useless plugin")
    // }

    Vue.prototype.makeLight = (_options) => {
      // console.log(`make a light`)
      var self = this
      this.color = _options.color
      this.light = null
      if (_options.type === 'point') {
        this.light = new THREE.PointLight( this.color, 1, 100 )
      }
      else if (_options.type === 'spot') {
        this.light = new THREE.SpotLight( this.color )
      }
      else if (_options.type === 'area') {
        this.light = new THREE.RectAreaLight( this.color, 1, 10, 10 );
      }
      // this.light.shadow.bias = 0.5;
      this.light.shadow.bias = 0.0001
      
      // Shadows
      // this.light.shadow.mapSize.width = 2048
      // this.light.shadow.mapSize.height = 2048
      if (_options.type != 'area') {
        self.light.castShadow = true
      }
      // this.light.receiveShadow = true
      var d = 1000;
      // this.light.shadow.camera.fov = 1
      this.light.shadow.camera.left = - d;
			this.light.shadow.camera.right = d;
			this.light.shadow.camera.top = d;
      this.light.shadow.camera.bottom = - d;

			// this.light.shadow.camera.near = 0;
			// this.light.shadow.camera.far = 500;

			// this.light.shadow.mapSize.width = 4096
      // this.light.shadow.mapSize.height = 4096
			this.light.shadow.mapSize.width = 6000
      this.light.shadow.mapSize.height = 6000

      // Set position
      this.light.position.set( _options.pos.x, _options.pos.y, _options.pos.z)
      return this.light
    }

    // Make a plane
    Vue.prototype.makePlane = (_options) => {
      var self = this
      this.plane = null
      this.color = _options.color
      var material = new THREE.MeshPhongMaterial({
        color: self.color,
        // emissive: _options.emissive,
        emissive: _options.emissive ? _options.emissive : null,
        // metalness: 0.95,
        side: THREE.BackSide,
        // wireframe: true
      })
      
      var geometry = new THREE.PlaneGeometry(_options.size.w, _options.size.d, _options.subs, _options.subs)
      this.plane = new THREE.Mesh(geometry, material)
      this.plane.receiveShadow = true
      this.plane.castShadow = true
      // this.plane.material.wireframe.true
      // this.plane.castShadow = true
      // this.plane.position.y = -0.5

      // Set plane position
      // if (_options.emissive) {
      //   material.emissive = _options.emissive
      // }

      // Set plane position
      if (_options.position) {
        this.plane.position.set(_options.position.x, _options.position.y, _options.position.z)
      }
      else {
        this.plane.position.set(0, 0, 0)
      }
      
      // Set plane rotation
      if (_options.rotation) {
        // this.plane.rotation.x = _options.rotation
        this.plane.applyMatrix4( new THREE.Matrix4().makeRotationX( Number(_options.rotation) ) )
      }

      // alert(_options.rotation)

      return this.plane
    }
    
    // Make a cube
    Vue.prototype.makeCube = (_options) => {
      var self = this
      this.cube = null
      this.color = _options.color
      var material = new THREE.MeshPhongMaterial({
        color: self.color,
        // emissive: _options.emissive,
        emissive: _options.emissive ? _options.emissive : null,
        // metalness: 0.95,
        // side: THREE.DoubleSide,
      })
      var geometry = new THREE.BoxGeometry( _options.size.x, _options.size.y, _options.size.z )
      // var geometry = new THREE.PlaneGeometry(_options.size.w, _options.size.d, _options.subs, _options.subs)
      this.cube = new THREE.Mesh(geometry, material)
      this.cube.receiveShadow = true
      this.cube.castShadow = true

      // Set cube position
      if (_options.position) {
        this.cube.position.set(_options.position.x, _options.position.y, _options.position.z)
      }
      else {
        this.cube.position.set(0, 0, 0)
      }
      
      // Set plane rotation
      if (_options.rotation) {
        // this.plane.rotation.x = _options.rotation
        this.cube.applyMatrix4( new THREE.Matrix4().makeRotationX( Number(_options.rotation) ) )
      }

      // alert(_options.rotation)

      return this.cube
    }
    
    // Make a sphere
    Vue.prototype.makeSphere = (_options) => {
      var self = this
      this.sphere = null
      this.color = _options.color
      var material = new THREE.MeshPhongMaterial({
        color: self.color,
        flatShading: true,
        // emissive: _options.emissive,
        emissive: _options.emissive ? _options.emissive : null,
        // metalness: 0.95,
        // side: THREE.DoubleSide,
      })
      var geometry = new THREE.SphereGeometry(_options.radius, _options.segments.w, _options.segments.h) // radius, segmentsWidth, segmentsHeight
      this.sphere = new THREE.Mesh(geometry, material)
      this.sphere.receiveShadow = true
      this.sphere.castShadow = true

      // Set sphere position
      if (_options.position) {
        this.sphere.position.set(_options.position.x, _options.position.y, _options.position.z)
      }
      else {
        this.sphere.position.set(0, 0, 0)
      }

      return this.sphere
    }
  }
}

export default globalThreefunctions

// function RectAreaLight () {
//   // constructor() {
//   this.light = new THREE.RectAreaLight( 0xffffff, 1, 10, 10 );
//   this.light.position.set( 10, 10, 0);
//   // this.light.rotation.set( -0.74719, 0.0001, 0.0001 );
//   this.light.width = 10;
//   this.light.height = 1;
//   this.light.applyMatrix( new THREE.Matrix4().makeRotationX( Math.PI / 2 ) )
//   // }
//   return light
// }
