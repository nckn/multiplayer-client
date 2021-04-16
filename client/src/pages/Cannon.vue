<template lang="pug">
  .container.outer.black-bg(ref="master_cont")
    #containerAO(ref="physics_cont")
    //- img.img(src="@/assets/images/basilica/posx.jpg" width="400" height="400")
</template>
 
<script>

// https://codepen.io/eeonk/pen/pxyVrB

// import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls.js'
// import { VRButton } from 'three/examples/jsm/webxr/VRButton.js'

import { map, generateRandomNumber } from '@/assets/js/helpers'

import { TweenMax, Sine, Bounce } from 'gsap'

import CANNON from 'cannon'

// const path = 'audio/fxs/'
const path = 'audio/'

// const sounds = [
//   'thud-mouth.mp3'
// ]

const sounds = [
  {obj: null, name: 'bass', filename: 'silent-web-dummy/bass-silent-web-dummy-1.0.mp3'},
  {obj: null, name: 'pad', filename: 'silent-web-dummy/covalent-silent-web-dummy-1.0.mp3'},
  {obj: null, name: 'drum', filename: 'silent-web-dummy/drum-silent-web-dummy-1.0.mp3'},
  {obj: null, name: 'strings', filename: 'silent-web-dummy/strings-silent-web-dummy-1.0.mp3'},
  {obj: null, name: 'frogs', filename: 'Africa-2-frogs-and-party.mp3'},
  {obj: null, name: 'buddha bell', filename: 'budhists-1.mp3'},
  {obj: null, name: 'random', filename: 'silent-web-dummy/random-silent-web-dummy-1.0.mp3'},
]

const randomPos = false, ringSize = 60

export default {
  name: 'Cannon',
  data () {
    return {
      container: null,
      scene: null,
      camera: null,
      renderer: null,
      // Post processing. AO.
      composer: null,
      renderPass: null,
      saoPass: null,
      group: null,
      // CANNON example
      world: null,
      dt: 1 / 60,
      constraintDown: null,
      gplane: null,
      mesh: null,
      clickMarker: null,
      controls: null,
      time: Date.now(),
      // projector: null,
      jointBody: null,
      constrainedBody: null,
      mouseConstraint: null,
      mouseDownPos: null,
      meshes: [],
      bodies: [],
      // cubePos: [],
      maxPos: 180,
      noOFCubes: 4,
      markerMaterial: null,
      lastx: null,
      lasty: null,
      last: null,
      // Audio related
      audioLoader: [],
      analyser1: null,
      listener: null,
      easeTime: 0.15,
      // controls, FPS related
      clock: null,
      // isWalking: true,
      isWalking: false,
      // Text
      fontLoader: null,
      fonts: [],
      inc: 0,
      INTERSECTED: ''
    }
  },
  mounted () {
    var self = this
    // console.log('CANNON: ', CANNON)
    self.clock = new self.$gThree.Clock()
    // Fonts
    self.fontLoader = new self.$gThree.FontLoader()
    setTimeout(() => {
      self.init();
      self.initCannon();
      self.createCubes()
      // Orbit controls
      self.setOrbitControls()
      self.animate();
    }, 1000)
  },
  beforeDestroy () {
    var self = this
    // console.log('before destroy')
    window.cancelAnimationFrame( self.reqAnim );
    // Dispose controls
    self.listener.context.suspend()
    self.controls.dispose()
    while(self.scene.children.length > 0){
      console.log('before destroying: ', self.scene.children[0])
      self.scene.remove(self.scene.children[0]);
    }
  },
  methods: {
    init() {
      var self = this
      self.container = self.$refs.physics_cont // Asisgn container
      // scene
      self.scene = new self.$gThree.Scene();
      self.scene.fog = new self.$gThree.Fog(0x000000, 50, 1000);

      // camera
      self.camera = new self.$gThree.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.5, 10000);
      self.camera.position.set(30, 2, 5)
      // self.camera.position.set(0, 2, 0)
      // self.camera.position.set( 0, 2, 50 );
      
      // self.camera.rotation.order = 'YXZ';
      // self.camera.rotation.y = - Math.PI / 4;
      // self.camera.rotation.x = Math.atan( - 1 / Math.sqrt( 2 ) );
      // self.camera.quaternion.setFromAxisAngle(new self.$gThree.Vector3(0, 1, 0), Math.PI / 2);
      self.camera.quaternion.setFromAxisAngle(new self.$gThree.Vector3(0, 1, 0), Math.PI / 2)

      self.scene.add(self.camera);

      // Make audio
      // self.audioLoader = new self.$gThree.AudioLoader();

      self.listener = new self.$gThree.AudioListener()
      self.listener.context.resume()
      self.camera.add( self.listener )

      // lights
      // self.scene.add(new self.$gThree.AmbientLight(0x666666));

      var light = new self.$gThree.DirectionalLight(0xffffff, 1.75);
      var d = 20;

      light.position.set(d, d, d);

      light.castShadow = true;
      //light.shadowCameraVisible = true;

      light.shadow.mapSize.width = 2048;
      light.shadow.mapSize.height = 2048;

      light.shadow.camera.left = -d;
      light.shadow.camera.right = d;
      light.shadow.camera.top = d;
      light.shadow.camera.bottom = -d;

      light.shadow.camera.far = 3 * d;
      light.shadow.camera.near = d;
      // light.shadowDarkness = 0.5;

      self.scene.add(light);

      // floor
      var geometry = new self.$gThree.PlaneGeometry(5000, 5000, 1, 1);
      //geometry.applyMatrix( new self.$gThree.Matrix4().makeRotationX( -Math.PI / 2 ) );
      var material = new self.$gThree.MeshLambertMaterial({
        // color: 0x151515
        color: 0x050505
      });
      self.markerMaterial = new self.$gThree.MeshLambertMaterial({
        color: 0xff0000
      });
      
      //self.$gThree.ColorUtils.adjustHSV( material.color, 0, 0, 0.9 );
      self.mesh = new self.$gThree.Mesh(geometry, material);
      self.mesh.castShadow = true;
      self.mesh.quaternion.setFromAxisAngle(new self.$gThree.Vector3(1, 0, 0), -Math.PI / 2);
      self.mesh.receiveShadow = true;
      self.scene.add(self.mesh);

      // Sphere sound
      // var sphere1 = new self.$gThree.SphereBufferGeometry( 20, 32, 16 );
      // var material1 = new self.$gThree.MeshPhongMaterial( { color: 0xff2200, flatShading: true, shininess: 0 } );
      // var mesh1 = new self.$gThree.Mesh( sphere1, material1 );
      // mesh1.position.set( -100, 10, 80 );
      // self.scene.add( mesh1 );

      // var soundTest1 = new self.$gThree.PositionalAudio( self.listener );
      // self.audioLoader.load( path + sounds[0], function ( buffer ) {

      //   soundTest1.setBuffer( buffer );
      //   soundTest1.setRefDistance( 20 );
      //   soundTest1.play();

      // } );
      // mesh1.add( soundTest1 );

      // // Sphere sound 2
      // var sphere2 = new self.$gThree.SphereBufferGeometry( 20, 32, 16 );
      // var material2 = new self.$gThree.MeshPhongMaterial( { color: 0x6622aa, flatShading: true, shininess: 0 } );
      // var mesh2 = new self.$gThree.Mesh( sphere2, material2 );
      // mesh2.position.set( -100, 10, -80 );
      // self.scene.add( mesh2 );

      // var soundTest2 = new self.$gThree.PositionalAudio( self.listener );
      // self.audioLoader.load( path + sounds[3], function ( buffer ) {

      //   soundTest2.setBuffer( buffer );
      //   soundTest2.setRefDistance( 20 );
      //   soundTest2.play();

      // } );
      // mesh2.add( soundTest2 );

      // self.$parent.renderer = new self.$gThree.WebGLRenderer({
      //   antialias: true
      // });
      // self.$parent.renderer.setSize(window.innerWidth, window.innerHeight);
      // self.$parent.renderer.setClearColor(self.scene.fog.color);

      self.container.appendChild(self.$parent.renderer.domElement);

      // self.$parent.renderer.gammaInput = true;
      // // self.$parent.renderer.gammaOutput = true;
      // self.$parent.renderer.shadowMap.enabled = true;

      // VR
      // self.container.appendChild( VRButton.createButton( self.$parent.renderer ) )

      self.addGuides()

      window.addEventListener('touchmove', self.onMouseMove, false);
      window.addEventListener('mousemove', self.onMouseMove, false);
      
      window.addEventListener('touchstart', self.onMouseMove, false);

      window.addEventListener('touchstart', self.onMouseDown, false);
      window.addEventListener('mousedown', self.onMouseDown, false);
      
      window.addEventListener('mouseup', self.onMouseUp, false);
      window.addEventListener('touchend', self.onMouseUp, false);

      window.addEventListener( 'resize', self.onWindowResize, false );
    },
    setClickMarker(x, y, z) {
      var self = this
      if (!self.clickMarker) {
        self.shape = new self.$gThree.SphereGeometry(0.2, 8, 8);
        self.clickMarker = new self.$gThree.Mesh(self.shape, self.markerMaterial);
        self.scene.add(self.clickMarker);
      }
      self.clickMarker.visible = true;
      self.clickMarker.position.set(x, y, z);
    },
    removeClickMarker() {
      var self = this
      if (self.clickMarker) {
        self.clickMarker.visible = false;
      }
    },
    onMouseMove(e) {
      var self = this
      var mouseCoords = self.checkIfTouch(e)
      if (self.gplane && self.mouseConstraint) {
        var pos = self.projectOntoPlane(mouseCoords.x, mouseCoords.y, self.gplane, self.camera);
        if (pos) {
          var yDiff = self.mouseDownPos.y - pos.y
          self.setClickMarker(pos.x - yDiff**2, pos.y, pos.z, self.scene);
          self.moveJointToPoint(pos.x - yDiff**2, pos.y, pos.z);
        }
      }
      // https://stackoverflow.com/questions/38314521/change-color-of-mesh-using-mouseover-in-three-js
      // Get the picking ray from the point. https://jsfiddle.net/wilt/52ejur45/
      var mouseCoords = self.checkIfTouch(e)
      var raycaster = self.getRayCasterFromScreenCoord(mouseCoords.x, mouseCoords.y, self.camera);
      // Find the closest intersecting object
      // Now, cast the ray all render objects in the scene to see if they collide. Take the closest one.
      var intersects = raycaster.intersectObjects(self.meshes);
      var intS = self.INTERSECTED
      if ( intersects.length > 0 ) {
        if ( intS != intersects[ 0 ].object ) {
          if ( intS ) {
            intS.material.emissive.setHex( intS.currentHex );
          }
          intS = intersects[ 0 ].object;
          intS.currentHex = intS.material.emissive.getHex();
          intS.material.emissive.setHex( 0xff0000 );
        }
      }
      else {
        if ( intS ) {
          intS.material.emissive.setHex( intS.currentHex );
        }
        intS = null;
      }
      // self.highlightShape(closest)
      self.meshes.forEach(element => {
        // console.log(element.material)
        if (element != intS) {
          element.material.emissive.setHex( 0x000000 );
        }
        // console.log(element.currentHex)
      });
    },
    turnOffAgain () {
      var self = this
    },
    checkIfTouch(e) {
      var thisX, thisY
      if (e.touches != undefined) {
        thisX = e.touches[0].pageX
        thisY = e.touches[0].pageY
      }
      else {
        thisX = e.clientX
        thisY = e.clientY
      }
      return { x: thisX, y: thisY }
    },
    onMouseDown(e) {
      var self = this
      // Check if touch or not
      var mouseCoords = self.checkIfTouch(e)
      // console.log('mouse coords: ', mouseCoords)
      // var entity = self.findNearestIntersectingObject(e.clientX, e.clientY, self.camera, self.meshes);
      var entity = self.findNearestIntersectingObject(mouseCoords.x, mouseCoords.y, self.camera, self.meshes);
      var pos = entity.point;
      self.mouseDownPos = pos
      if (pos && entity.object.geometry instanceof self.$gThree.BoxGeometry) {
        self.constraintDown = true;
        // Set marker on contact point
        // alert('yes')
        self.setClickMarker(pos.x, pos.y, pos.z, self.scene); 

        // Set the movement plane
        self.setScreenPerpCenter(pos, self.camera);

        var idx = self.meshes.indexOf(entity.object);
        if (idx !== -1) {
          self.addMouseConstraint(pos.x, pos.y, pos.z, self.bodies[idx]);
        }
      }
    },
    // This function creates a virtual movement plane for the mouseJoint to move in
    setScreenPerpCenter(point, camera) {
      var self = this
      // If it does not exist, create a new one
      if (!self.gplane) {
        var planeGeo = new self.$gThree.PlaneGeometry(100, 100);
        var hide = new self.$gThree.MeshLambertMaterial({
          opacity: 0,
          transparent: true
        });
        self.gplane = new self.$gThree.Mesh(planeGeo, hide);
        // plane.visible = false; // Hide it.. 
        self.scene.add(self.gplane);
      }

      // Center at mouse position
      self.gplane.position.copy(point);

      // Make it face toward the camera
      self.gplane.quaternion.copy(camera.quaternion);
    },
    onMouseUp(e) {
      var self = this
      console.log(e)
      self.constraintDown = false
      self.mouseDownPos = null
      // remove the marker
      self.removeClickMarker()

      // Send the remove mouse joint to server
      self.removeJointConstraint()
    },
    projectOntoPlane(screenX, screenY, thePlane, camera) {
      var self = this
      var x = screenX;
      var y = screenY;
      var now = new Date().getTime();
      // project mouse to that plane
      var hit = self.findNearestIntersectingObject(screenX, screenY, camera, [thePlane]);
      self.lastx = x;
      self.lasty = y;
      self.last = now;
      if (hit) {
        return hit.point;
      }
      return false;
    },
    highlightShape (shape) {
      var self = this
      console.log('shape: ', shape.object)
      // store color of closest object (for later restoration)
      // shape.currentHex = INTERSECTED.material.color.getHex();
      // // set a new color for closest object
      // shape.object.material.color.setHex(0xffff00);
    },
    findNearestIntersectingObject(clientX, clientY, camera, objects) {
      var self = this
      // Get the picking ray from the point
      var raycaster = self.getRayCasterFromScreenCoord(clientX, clientY, camera);

      // Find the closest intersecting object
      // Now, cast the ray all render objects in the scene to see if they collide. Take the closest one.
      var hits = raycaster.intersectObjects(objects);
      var closest = false;
      if (hits.length > 0) {
        closest = hits[0];
        self.highlightShape(closest)
      }
      return closest;
    },
    // Function that returns a raycaster to use to find intersecting objects
    // in a scene given screen pos and a camera, and a projector
    getRayCasterFromScreenCoord (screenX, screenY, camera) {
      var self = this
      var raycaster = new self.$gThree.Raycaster()
      var mouse3D = new self.$gThree.Vector3();
      // Get 3D point form the client x y
      mouse3D.x = (screenX / window.innerWidth) * 2 - 1;
      mouse3D.y = -(screenY / window.innerHeight) * 2 + 1;
      mouse3D.z = 0.5;
      raycaster.setFromCamera(mouse3D, camera)
      return raycaster
    },
    animate () {
      var self = this
      // Standard render
      self.reqAnim = requestAnimationFrame( self.animate.bind(this) );
      self.render()

      // Log rendering
      // console.log(`rendering ${this.$route.path}`)
      // VR
      // self.$parent.renderer.setAnimationLoop( self.render );
      // self.$parent.renderer.xr.enabled = true
      // VR - end
    },
    updatePhysics() {
      var self = this
      self.world.step(self.dt);
      for (var i = 0; i !== self.meshes.length; i++) {
        self.meshes[i].position.copy(self.bodies[i].position);
        self.meshes[i].quaternion.copy(self.bodies[i].quaternion);
      }
    },
    render() {
      var self = this
      const delta = self.clock.getDelta()
      self.controls.update( delta )
      
      self.updatePhysics()

      // self.controls.update( delta );
      // console.log(`running this route: ${this.$route.path}`)
      self.$parent.renderer.render(self.scene, self.camera);

      // Scaling
      // log sound analysis
      sounds.forEach((element, index) => {
        // element.shape.scale.y = sounds[0].obj.analyser.getFrequencyData()
        
        var freq = sounds[index].analyser.getFrequencyData()[0]
        var scaledVal = map(freq, 0, 256, 1, 10)
        // element.shape.scale.set(scaledVal * 2, scaledVal * 2, scaledVal * 2)
        
        // Scaling of Physics body
        // var boxShape = self.bodies[index].shapes[0]
        // boxShape.halfExtents.set(scaledVal, scaledVal, scaledVal);
        // // boxShape.halfExtents.set(1, scaledVal, 1);
        // boxShape.updateConvexPolyhedronRepresentation();
        // Scaling of Physics body - end

        // Scaling of Mesh

        // X, Y and Z
        TweenMax.to(element.shape.scale, self.easeTime, {
          x: scaledVal,
          y: scaledVal,
          z: scaledVal,
          ease: Bounce.easeOut
        })
        
        // One dimension
        // TweenMax.to(element.shape.scale, self.easeTime, {y: scaledVal, ease: Bounce.easeOut})
        
        // boxShape.computeBoundingSphereRadius();
        // boxShape.computeAABB();
        // boxShape.updateMassProperties();
        // console.log('body: ', self.bodies[index].shapes)
        // console.log('body: ', boxShape.shapes[0])
        // self.bodies[index].shape.halfExtents.y = scaledVal
        // self.bodies[index].shape.boundingSphereRadiusNeedsUpdate = true
        // self.bodies[index].shape.updateConvexPolyhedronRepresentation()
      });
      // console.log('sound: ', sounds[0].obj.analyser.getFrequencyData().length)
      // console.log('sound: ', sounds[0].shape)
    },
    initCannon () {
      var self = this
      // Setup our world
      self.world = new CANNON.World();
      self.world.quatNormalizeSkip = 0;
      self.world.quatNormalizeFast = false;

      self.world.gravity.set(0, -10, 0);
      self.world.broadphase = new CANNON.NaiveBroadphase();

      // Create a plane
      var groundShape = new CANNON.Plane();
      var groundBody = new CANNON.Body({
        mass: 0
      });
      groundBody.addShape(groundShape);
      groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
      self.world.addBody(groundBody);

      // Joint body
      var shape = new CANNON.Sphere(0.1);
      self.jointBody = new CANNON.Body({
        mass: 0
      });
      self.jointBody.addShape(shape);
      self.jointBody.collisionFilterGroup = 0;
      self.jointBody.collisionFilterMask = 0;
      self.world.addBody(self.jointBody)
    },
    createCubes () {
      var self = this
      var bS = 0.5
      // cubes
      // var cubeGeo = new self.$gThree.BoxGeometry(1, 1, 1, 10, 10);
      // var cubeMaterial = new self.$gThree.MeshPhongMaterial({
        //   color: 0x888888
      // });


      var mass = 5
      var shape = new CANNON.Box(new CANNON.Vec3(bS, bS, bS))
      self.noOFCubes = sounds.length
      for (var i = 0; i < self.noOFCubes; i++) {
        var cubeMaterial = new self.$gThree.MeshStandardMaterial({
          color: 0x333333,
          roughness: 0,
          metalness: 0,
          emissive: 0x000000
        })
        var rX, rY, rZ
        if (randomPos) {
          // Random position
          rX = generateRandomNumber(0, self.maxPos)
          rX = map(rX, 0, self.maxPos, -self.maxPos, self.maxPos);
          // var rY = generateRandomNumber(0, self.maxPos)
          rY = 10
          rZ = generateRandomNumber(0, self.maxPos)
          rZ = map(rZ, 0, self.maxPos, -self.maxPos, self.maxPos);
        }
        else {
          // Distribute in circle
          rX = Math.sin( i / self.noOFCubes * Math.PI * 2 ) * ringSize
          rY = 10
          rZ = Math.cos( i / self.noOFCubes * Math.PI * 2 ) * ringSize
        }

        // First Cannon
        var boxBody = new CANNON.Body({
          mass: mass
        })
        boxBody.addShape(shape)
        boxBody.position.set(rX, rY, rZ)
        self.world.addBody(boxBody)
        self.bodies.push(boxBody)

        // On collision
        // boxBody.addEventListener('collide', () => {
        //   console.log('colliding')
        // })

        // Geometry
        // for some reason geometry is double of Cannon body
        var cubeGeo = new self.$gThree.BoxGeometry(bS * 2, bS * 2, bS * 2, 10, 10);
        var cubeMesh = new self.$gThree.Mesh(cubeGeo, cubeMaterial);
        cubeMesh.castShadow = true;
        self.meshes.push(cubeMesh)
        sounds[i].shape = cubeMesh
        self.scene.add(cubeMesh)

        // Setup sound
        // var snd = self.soundObjs[i]
        // if (i != 1) {
        //   return
        // }
        self.audioLoader[i] = new self.$gThree.AudioLoader()

        var sound = new self.$gThree.PositionalAudio( self.listener );
        sounds[i].obj = sound
        var sndPath = path + sounds[i].filename
        
        // Load sound
        self.loadSound(sound, i, sndPath)
        // Load text
        self.loadText(i, sounds[i].name, {x: rX, y: rY, z: rZ})
        
        console.log('it is 2, ', sndPath)
        cubeMesh.add( sound );

        // if (i === 0) {
        //   console.log('it is 2, ', path + sounds[i])
        //   var snd = new self.$gThree.PositionalAudio( self.listener );
        //   self.audioLoader[i].load( path + sounds[0], function ( buffer ) {
        //     snd.setBuffer( buffer );
        //     snd.setLoop( true );
        //     snd.setRefDistance( 20 );
        //     snd.setVolume( 0.5 );
        //     snd.play();
        //   } );
        //   // console.log(boxBody)
        //   // boxBody.add( snd )
        //   cubeMesh.add( snd )
        // } else {
        //   console.log('it is 2, ', path + sounds[i])
        //   var sound2 = new self.$gThree.PositionalAudio( self.listener );
        //   self.audioLoader[i].load( path + sounds[1], function ( buffer ) {
        //     sound2.setBuffer( buffer );
        //     sound2.setRefDistance( 20 );
        //     sound2.play();

        //   } );
        //   cubeMesh.add( sound2 );
        // }
      }
    },
    loadText(i, name, pos) {
      var self = this
      var textGeo
      self.textMaterial = new self.$gThree.MeshPhongMaterial({ 
        color: 0x0000ff,
        flatShading: true,
        emissive: 0x0000ff
      })
      // var fontInstance
      var loadFont = function () {
        textGeo = new self.$gThree.TextGeometry( name, {
          font: self.fonts[ self.inc ],
          size: 4,
          height: 1,
          curveSegments: 0,
          bevelThickness: 0,
          bevelSize: 0, // 1.5
          bevelEnabled: true
        })
        textGeo.computeBoundingBox()
        textGeo.computeVertexNormals()
        textGeo = new self.$gThree.BufferGeometry().fromGeometry( textGeo )
        console.log('textGeo: ', textGeo)
        console.log('pos x: ' + pos.x + ', pos y: ' + pos.y + ', pos z: ' + pos.z)

        var textMesh = new self.$gThree.Mesh( textGeo, self.textMaterial )
        var centerOffset = - 0.5 * ( textGeo.boundingBox.max.x - textGeo.boundingBox.min.x )
        // textMesh.position.set(new self.$gThree.Vector3(pos.x, 2, pos.z))
        textMesh.position.x = pos.x + centerOffset
        // textMesh.position.x = pos.x
        textMesh.position.y = 10
        textMesh.position.z = pos.z
        // textMesh.position.x = 0
        textMesh.lookAt(self.camera.position)
        sounds[i].text = textMesh
        self.scene.add(textMesh)
        // Iterate font inc load
        self.inc++
      }
      // var fontPath = 'fonts/avenir_ff/Avenir LT Std 65 Medium_Bold.json'
      var fontPath = 'fonts/helvetiker.json'
      self.fontLoader.load( fontPath, function ( response ) {
        self.fonts.push( response )
        // console.log('response: ', response)
        loadFont()
      })
    },
    loadSound(sound, i, sndPath) {
      var self = this
      self.audioLoader[i].load( sndPath, function ( buffer ) {
        sound.setBuffer( buffer )
        sound.setRefDistance( 20 )
        sound.setLoop( true )
        sound.play()
      })
      sounds[i].analyser = new self.$gThree.AudioAnalyser( sound, 32 );
      // console.log()
    },
    addMouseConstraint (x, y, z, body) {
      var self = this
      // The cannon body constrained by the mouse joint
      self.constrainedBody = body;

      // Vector to the clicked point, relative to the body
      var v1 = new CANNON.Vec3(x, y, z).vsub(self.constrainedBody.position);

      // Apply anti-quaternion to vector to tranform it into the local body coordinate system
      var antiRot = self.constrainedBody.quaternion.inverse();
      var pivot = antiRot.vmult(v1); // pivot is not in local body coordinates

      // Move the cannon click marker particle to the click position
      self.jointBody.position.set(x, y, z);

      // Create a new constraint
      // The pivot for the jointBody is zero
      self.mouseConstraint = new CANNON.PointToPointConstraint(self.constrainedBody, pivot, self.jointBody, new CANNON.Vec3(0, 0, 0));

      // Add the constriant to world
      self.world.addConstraint(self.mouseConstraint);
    },
    moveJointToPoint (x, y, z) {
      var self = this
      // Move the joint body to a new position
      self.jointBody.position.set(x, y, z)
      self.mouseConstraint.update()
    },
    removeJointConstraint () {
      var self = this
      // Remove constriant from world
      self.world.removeConstraint(self.mouseConstraint)
      self.mouseConstraint = false
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
      // console.log('windowW: ', self.window.w)
    },
    setOrbitControls () {
      var self = this
      if (self.isWalking) {
        // FPS Controls
        self.controls = new FirstPersonControls( self.camera, self.$parent.renderer.domElement );
        self.controls.movementSpeed = 20;
        self.controls.lookSpeed = 0.05;
        self.controls.noFly = true;
        self.controls.lookVertical = false;
        // FPS Controls - end
      }
      else {
        // Orbit controls
        self.controls = new OrbitControls( self.camera, self.$parent.renderer.domElement );
        self.controls.enablePan = false
        // self.controls.enableRotate = false
        self.controls.enableDamping = true
        self.controls.zoomSpeed = 0.2
        self.controls.addEventListener('change', () => {
          // console.log('x: ', self.camera.position.x)
          // console.log('x: ', self.camera.position.y)
          // console.log('z: ', self.camera.position.z)
          sounds.forEach(element => {
            element.text.lookAt(self.camera.position)
          });
        })
        // Orbit controls - end
      }
    },
    addGuides () {
      var self = this
      
      // Axes
      var axesHelper = new self.$gThree.AxesHelper( 5 );
      this.scene.add( axesHelper );
      console.log('adding guides')

      // Grid
      // var helper = new self.$gThree.GridHelper( 1000, 100, 0x444444, 0x444444 )
      // helper.position.y = 0.1
      // self.scene.add( helper )
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

</style>
