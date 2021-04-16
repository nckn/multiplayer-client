<template lang="pug">
  .container.outer.black-bg(ref="master_cont")
    #containerSoftBodies(ref="softbodies_cont") 
</template>
 
<script>

// https://threejs.org/examples/physics_ammo_volume.html

// import * as Ammo from '@hapi/ammo'
// import Ammo from '@hapi/ammo'
// import { Ammo } from 'ammo.js'
// import Ammo from 'ammo.js'
// import Ammo from '@/assets/js/ammo.js'
// var Ammo = require('@/assets/js/ammo.js')

// import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls.js'
// import { VRButton } from 'three/examples/jsm/webxr/VRButton.js'

import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'

import { map, generateRandomNumber } from '@/assets/js/helpers'

import { TweenMax, Sine, Bounce } from 'gsap'

// import CANNON from 'cannon'

// const path = 'audio/fxs/'
// const path = 'audio/'

// const sounds = [
//   'thud-mouth.mp3'
// ]

// const sounds = [
//   {obj: null, name: 'bass', filename: 'silent-web-dummy/bass-silent-web-dummy-1.0.mp3'},
//   {obj: null, name: 'pad', filename: 'silent-web-dummy/covalent-silent-web-dummy-1.0.mp3'},
//   {obj: null, name: 'drum', filename: 'silent-web-dummy/drum-silent-web-dummy-1.0.mp3'},
//   {obj: null, name: 'strings', filename: 'silent-web-dummy/strings-silent-web-dummy-1.0.mp3'},
//   {obj: null, name: 'frogs', filename: 'Africa-2-frogs-and-party.mp3'},
//   {obj: null, name: 'buddha bell', filename: 'budhists-1.mp3'},
//   {obj: null, name: 'random', filename: 'silent-web-dummy/random-silent-web-dummy-1.0.mp3'},
// ]

// const randomPos = false, ringSize = 60

export default {
  name: 'SoftBodies',
  data () {
    return {
      container: null,
      scene: null,
      camera: null,
      renderer: null,
      // Graphics variables
      textureLoader: null,
      clock: null,
      clickRequest: false,
      mouseCoords: null,
      raycaster: null,
      ballMaterial: null,
      pos: null,
      quat: null,
      // Physics variables
      gravityConstant: -9.8,
      collisionConfiguration: null,
      dispatcher: null,
      broadphase: null,
      solver: null,
      physicsWorld: null,
      rigidBodies: [],
      softBodies: [],
      margin: 0.05,
      hinge: null,
      transformAux1: null,
      softBodyHelpers: null,
      armMovement: 0,
      // Niels
      boxes: [],
      curBall: null, // collision detection,
      materialMain: null,
      // Lights
      rectLight: [],
      rectLightMesh: [],
      noOC: 8,
      ringSize: 28
    }
  },
  mounted () {
    var self = this
    // THREE init clock
    self.clock = new self.$gThree.Clock()
    self.ballMaterial = new self.$gThree.MeshPhongMaterial({ color: 0x020202 })
    self.mouseCoords = new self.$gThree.Vector2()
    self.raycaster = new self.$gThree.Raycaster()
    self.pos = new self.$gThree.Vector3()
    self.quat = new self.$gThree.Quaternion()
    
    // self.$nextTick(() => {
    //   // self.init()
    //   self.ammoConfig()
    // })
    setTimeout(() => {
      self.ammoConfig()
      // // return
      // self.init()
      // self.animate()
      // self.setOrbitControls()
    }, 200)
  },
  beforeDestroy () {
    var self = this
    // console.log('before destroy')
    window.cancelAnimationFrame( self.reqAnim );
    // Dispose controls
    if (typeof self.controls != 'undefined') {
      self.controls.dispose()
    }
    while(self.scene.children.length > 0){
      console.log('before destroying: ', self.scene.children[0])
      self.scene.remove(self.scene.children[0]);
    }
  },
  methods: {
    ammoConfig() {
      var self = this

      var Ammo
      // console.log('ammo before: ', Ammo)
      Ammo = require('@/assets/js/ammo.js')
      // console.log('ammo after: ', Ammo)
      
      // console.log('ammo: ', Ammo)
      Ammo().then( function( AmmoLib ) {

        Ammo = AmmoLib;
        // self.ammo = AmmoLib

        // Ammo init
        self.transformAux1 = new Ammo.btTransform()
        self.softBodyHelpers = new Ammo.btSoftBodyHelpers()
        
        self.init()
        self.animate()
        // self.setOrbitControls()

      } )
    },
    init() {
      var self = this
      self.initGraphics()
      self.initPhysics()
      self.createObjects()
      self.initInput()
      // Setup light environment
      self.setupAreaLight()
    },
    initGraphics() {
      var self = this

      // self.renderer = self.$parent.renderer

      RectAreaLightUniformsLib.init()

      self.container = self.$refs.softbodies_cont
      self.camera = new self.$gThree.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.2, 2000)
      // self.camera = new self.$gThree.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 1, 1000 )

      self.scene = new self.$gThree.Scene()
      self.scene.fog = new self.$gThree.Fog(0x000000, 0, 40)

      self.camera.position.x = -7
      self.camera.position.y = 5
      self.camera.position.z = 8

      self.setOrbitControls()
      // self.controls = new OrbitControls(self.camera, self.$parent.renderer.domElement)
      // self.controls.target.y = 2
      // self.controls.minDistance = 1
      // self.controls.maxDistance = 24
      // self.controls.enablePan = false

      // renderer = new self.$gThree.WebGLRenderer()
      // renderer.setClearColor(0xbfd1e5)
      // renderer.setPixelRatio(window.devicePixelRatio)
      // renderer.setSize(window.innerWidth, window.innerHeight)
      // renderer.shadowMap.enabled = true

      self.textureLoader = new self.$gThree.TextureLoader()

      var ambientLight = new self.$gThree.AmbientLight(0x404040)
      // self.scene.add(ambientLight)

      var light = new self.$gThree.DirectionalLight(0xffffff, 1)
      light.position.set(0, 10, 0)
      light.castShadow = true
      // var d = 20
      var d = 100 // org: 20
      light.shadow.camera.left = -d
      light.shadow.camera.right = d
      light.shadow.camera.top = d
      light.shadow.camera.bottom = -d

      // light.shadow.camera.near = 2
      // light.shadow.camera.far = 50

      light.shadow.mapSize.x = 512
      light.shadow.mapSize.y = 512

      self.scene.add(light)

      self.container.appendChild(self.$parent.renderer.domElement)

      // stats = new Stats()
      // stats.domElement.style.position = 'absolute'
      // stats.domElement.style.top = '0px'
      // container.appendChild(stats.domElement)

      // Resize
      window.addEventListener('resize', self.onWindowResize, false)

    },
    initPhysics() {
      var self = this
      // Physics configuration
      // console.log(typeof Ammo.btSoftBodyRigidBodyCollisionConfiguration)
      self.collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration()
      self.dispatcher = new Ammo.btCollisionDispatcher(self.collisionConfiguration)
      //
      // console split
      // console.log('self.collisionConfiguration: ', JSON.stringify(self.collisionConfiguration))
      console.log('self.dispatcher: ', self.dispatcher)
      //
      self.broadphase = new Ammo.btDbvtBroadphase()
      self.solver = new Ammo.btSequentialImpulseConstraintSolver()
      self.softBodySolver = new Ammo.btDefaultSoftBodySolver()
      self.physicsWorld = new Ammo.btSoftRigidDynamicsWorld(self.dispatcher, self.broadphase, self.solver, self.collisionConfiguration, self.softBodySolver)
      self.physicsWorld.setGravity(new Ammo.btVector3(0, self.gravityConstant, 0))
      self.physicsWorld.getWorldInfo().set_m_gravity(new Ammo.btVector3(0, self.gravityConstant, 0))
    },
    createObjects() {
      var self = this
      // Ground
      self.pos.set(0, - 0.5, 0)
      self.quat.set(0, 0, 0, 1)
      var ground = self.createParalellepiped(100, 1, 100, 0, self.pos, self.quat, new self.$gThree.MeshPhongMaterial({ color: 0xFFFFFF }))
      ground.castShadow = true
      ground.receiveShadow = true

      // grid texture
      self.textureLoader.load('textures/grid-invert.png', function (texture) {
        texture.wrapS = self.$gThree.RepeatWrapping
        texture.wrapT = self.$gThree.RepeatWrapping
        texture.repeat.set(40, 40)
        ground.material.map = texture
        ground.material.needsUpdate = true
      })

      // Create soft volumes
      var volumeMass = 15

      // Sphere 1
      var sphereGeometry = new self.$gThree.SphereBufferGeometry(1.5, 40, 25);
      // var sphereGeometry = new self.$gThree.IcosahedronBufferGeometry(1.5, 40);
      sphereGeometry.translate(5, 5, 0);
      self.createSoftVolume(sphereGeometry, volumeMass, 250);
      
      // Box 1
      // self.boxes[0] = new self.$gThree.BufferGeometry().fromGeometry(new self.$gThree.BoxGeometry(5, 5, 5, 4, 4, 20));
      // self.boxes[0].translate(5, 5, 0);
      // self.createSoftVolume(self.boxes[0], volumeMass, 250);

      var boxGeometry = new self.$gThree.BufferGeometry().fromGeometry(new self.$gThree.BoxGeometry(1, 1, 5, 4, 4, 20))
      boxGeometry.translate(-2, 5, 0)
      self.createSoftVolume(boxGeometry, volumeMass, 120)

      // Ramp
      self.pos.set(3, 1, 0)
      self.quat.setFromAxisAngle(new self.$gThree.Vector3(0, 0, 1), 30 * Math.PI / 180)
      // var obstacle = self.createParalellepiped(10, 1, 4, 0, self.pos, self.quat, new self.$gThree.MeshPhongMaterial({ color: 0x606060 }))
      // obstacle.castShadow = true
      // obstacle.receiveShadow = true
    },
    processGeometry(bufGeometry) {
      var self = this
      // Obtain a Geometry
      var geometry = new self.$gThree.Geometry().fromBufferGeometry(bufGeometry)
      // Merge the vertices so the triangle soup is converted to indexed triangles
      var vertsDiff = geometry.mergeVertices()
      // Convert again to BufferGeometry, indexed
      var indexedBufferGeom = self.createIndexedBufferGeometryFromGeometry(geometry)
      // Create index arrays mapping the indexed vertices to bufGeometry vertices
      self.mapIndices(bufGeometry, indexedBufferGeom)
    },
    createIndexedBufferGeometryFromGeometry(geometry) {
      var self = this
      var numVertices = geometry.vertices.length
      var numFaces = geometry.faces.length

      var bufferGeom = new self.$gThree.BufferGeometry()
      var vertices = new Float32Array(numVertices * 3)
      var indices = new (numFaces * 3 > 65535 ? Uint32Array : Uint16Array)(numFaces * 3)
      
      // For loop
      for (var i = 0; i < numVertices; i++) {
        var p = geometry.vertices[i]
        var i3 = i * 3
        vertices[i3] = p.x
        vertices[i3 + 1] = p.y
        vertices[i3 + 2] = p.z
      }

      for (var j = 0; j < numFaces; j++) {

        var f = geometry.faces[j]

        var j3 = j * 3

        indices[j3] = f.a
        indices[j3 + 1] = f.b
        indices[j3 + 2] = f.c
      }

      bufferGeom.setIndex(new self.$gThree.BufferAttribute(indices, 1))
      bufferGeom.setAttribute('position', new self.$gThree.BufferAttribute(vertices, 3))

      return bufferGeom
    },
    isEqual(x1, y1, z1, x2, y2, z2) {
      var delta = 0.000001;
      return Math.abs(x2 - x1) < delta &&
        Math.abs(y2 - y1) < delta &&
        Math.abs(z2 - z1) < delta
    },
    mapIndices(bufGeometry, indexedBufferGeom) {
      var self = this
      // Creates ammoVertices, ammoIndices and ammoIndexAssociation in bufGeometry
      var vertices = bufGeometry.attributes.position.array
      var idxVertices = indexedBufferGeom.attributes.position.array
      var indices = indexedBufferGeom.index.array

      var numIdxVertices = idxVertices.length / 3
      var numVertices = vertices.length / 3

      bufGeometry.ammoVertices = idxVertices
      bufGeometry.ammoIndices = indices
      bufGeometry.ammoIndexAssociation = []

      for (var i = 0; i < numIdxVertices; i++) {

        var association = []
        bufGeometry.ammoIndexAssociation.push(association)

        var i3 = i * 3

        for (var j = 0; j < numVertices; j++) {
          var j3 = j * 3;
          if (self.isEqual(idxVertices[i3], idxVertices[i3 + 1], idxVertices[i3 + 2],
            vertices[j3], vertices[j3 + 1], vertices[j3 + 2])) {
            association.push(j3)
          }
        }
      }
    },
    onTriggerEnter () {
      console.log('hey')
    },
    createSoftVolume(bufferGeom, mass, pressure) {
      var self = this
      self.processGeometry(bufferGeom);
      
      // Reflective
      self.materialMain = new self.$gThree.MeshStandardMaterial({
        color: 0x000000,
        roughness: 0,
        metalness: 0,
        // wireframe: true
      })
      
      // Diffuse
      // var material = new self.$gThree.MeshPhongMaterial({
      //   color: 0x000000,
      //   roughness: 0,
      //   metalness: 1
      // })

      var volume = new self.$gThree.Mesh(bufferGeom, self.materialMain);
      volume.castShadow = true
      volume.receiveShadow = true
      volume.frustumCulled = false
      self.scene.add(volume)

      // Show wireframe
      volume.wireframe = true

      // self.textureLoader.load('textures/colors.png', function (texture) {
      //   volume.material.map = texture
      //   volume.material.needsUpdate = true
      // })

      // Volume physic object
      var volumeSoftBody = self.softBodyHelpers.CreateFromTriMesh(
        self.physicsWorld.getWorldInfo(),
        bufferGeom.ammoVertices,
        bufferGeom.ammoIndices,
        bufferGeom.ammoIndices.length / 3,
        true
      )

      // volumeSoftBody.collision.on('triggerenter', this.onTriggerEnter, this)

      var sbConfig = volumeSoftBody.get_m_cfg()
      sbConfig.set_viterations(40)
      sbConfig.set_piterations(40)

      // Soft-soft and soft-rigid collisions
      sbConfig.set_collisions(0x11)

      // Friction
      sbConfig.set_kDF(0.1);
      // Damping
      sbConfig.set_kDP(0.01);
      // Pressure
      sbConfig.set_kPR(pressure);
      // Stiffness
      volumeSoftBody.get_m_materials().at(0).set_m_kLST(0.9);
      volumeSoftBody.get_m_materials().at(0).set_m_kAST(0.9);

      volumeSoftBody.setTotalMass(mass, false)
      Ammo.castObject(volumeSoftBody, Ammo.btCollisionObject).getCollisionShape().setMargin(self.margin);
      self.physicsWorld.addSoftBody(volumeSoftBody, 1, -1);
      volume.userData.physicsBody = volumeSoftBody;
      // Disable deactivation
      volumeSoftBody.setActivationState(4);

      self.softBodies.push(volume);

    },
    createParalellepiped(sx, sy, sz, mass, pos, quat, material) {
      var self = this
      var threeObject = new self.$gThree.Mesh(new self.$gThree.BoxGeometry(sx, sy, sz, 1, 1, 1), material)
      var shape = new Ammo.btBoxShape(new Ammo.btVector3(sx * 0.5, sy * 0.5, sz * 0.5))
      shape.setMargin(self.margin)
      self.createRigidBody(threeObject, shape, mass, pos, quat)
      return threeObject
    },
    createRigidBody(threeObject, physicsShape, mass, pos, quat) {
      var self = this
      threeObject.position.copy(pos);
      threeObject.quaternion.copy(quat);

      var transform = new Ammo.btTransform();
      transform.setIdentity();
      transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
      transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
      var motionState = new Ammo.btDefaultMotionState(transform);

      var localInertia = new Ammo.btVector3(0, 0, 0);
      physicsShape.calculateLocalInertia(mass, localInertia);

      var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, physicsShape, localInertia);
      var body = new Ammo.btRigidBody(rbInfo);

      threeObject.userData.physicsBody = body;

      self.scene.add(threeObject);

      if (mass > 0) {
        self.rigidBodies.push(threeObject);

        // Disable deactivation
        body.setActivationState(4);
      }

      self.physicsWorld.addRigidBody(body);

      return body;
    },
    initInput() {
      var self = this
      window.addEventListener('mousedown', function (event) {
        if (!self.clickRequest) {
          self.mouseCoords.set(
            (event.clientX / window.innerWidth) * 2 - 1,
            - (event.clientY / window.innerHeight) * 2 + 1
          )
          self.clickRequest = true
        }
      }, false)
    },
    processClick() {
      var self = this
      if (self.clickRequest) {

        self.raycaster.setFromCamera(self.mouseCoords, self.camera)

        // Creates a ball
        var ballMass = 3
        var ballRadius = 0.4

        var ball = new self.$gThree.Mesh(new self.$gThree.SphereGeometry(ballRadius, 18, 16), self.materialMain)
        ball.castShadow = true
        ball.receiveShadow = true

        self.curBall = ball

        var ballShape = new Ammo.btSphereShape(ballRadius)
        ballShape.setMargin(self.margin)
        self.pos.copy(self.raycaster.ray.direction)
        self.pos.add(self.raycaster.ray.origin)
        self.quat.set(0, 0, 0, 1)
        var ballBody = self.createRigidBody(ball, ballShape, ballMass, self.pos, self.quat)

        // Ball test
        // var materialSh = new self.$gThree.MeshStandardMaterial( { color: 0x000000, roughness: 0, metalness: 0 } );
        // var sphereSize = 6
        // var geoSphere = new self.$gThree.SphereBufferGeometry( sphereSize, 60, 60 )
        // var mshStdSphere = new self.$gThree.Mesh( geoSphere, materialSh )
        // mshStdSphere.position.set( 0, sphereSize, 0 )
        // mshStdSphere.castShadow = true
        // mshStdSphere.receiveShadow = true
        // self.scene.add( mshStdSphere )
        
        // ballBody attributes
        ballBody.setFriction(0.5)

        ballBody.setRestitution(0)
        // ballBody.setCcdMotionThreshold(1)
        // ballBody.setDamping( 0.8, 0 ) // org
        ballBody.setDamping( 0, 0 )
        // console.log('motion threshold: ', ballBody.setCcdMotionThreshold)

        self.pos.copy(self.raycaster.ray.direction)
        self.pos.multiplyScalar(14)
        ballBody.setLinearVelocity(new Ammo.btVector3(self.pos.x, self.pos.y, self.pos.z))

        self.clickRequest = false
      }
    },
    onWindowResize() {
      var self = this
      self.camera.aspect = window.innerWidth / window.innerHeight
      self.camera.updateProjectionMatrix()
      self.$parent.renderer.setSize(window.innerWidth, window.innerHeight)
    },
    animate() {
      var self = this
      requestAnimationFrame(self.animate.bind(this))
      self.render()
      // stats.update()
    },
    render() {
      var self = this
      var deltaTime = self.clock.getDelta()

      self.updatePhysics(deltaTime)
      self.processClick()
      self.controls.update(deltaTime)
      self.$parent.renderer.render(self.scene, self.camera)

      // self.detectCollision()
    },
    detectCollision() {
      var self = this
      // collision detection:
      //   determines if any of the rays from the cube's origin to each vertex
      //		intersects any face of a mesh in the array of target meshes
      //   for increased collision accuracy, add more vertices to the cube;
      //		for example, new self.$gThree.CubeGeometry( 64, 64, 64, 8, 8, 8, wireMaterial )
      //   HOWEVER: when the origin of the ray is within the target mesh, collisions do not occur
      var ball = self.curBall
      var originPoint = ball.position.clone()
      for (var i = 0; i < ball.geometry.vertices.length; i++) {
        var localVertex = ball.geometry.vertices[i].clone()
        var globalVertex = localVertex.applyMatrix4( ball.matrix )
        var directionVector = globalVertex.sub( ball.position )
        var ray = new self.$gThree.Raycaster( originPoint, directionVector.clone().normalize() );
        var collisionResults = ray.intersectObjects( collidableMeshList );
        if ( collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() ) 
          // appendText(" Hit ");
          console.log('hit')
      }
    },
    updatePhysics(deltaTime) {
      var self = this
      // Step world
      self.physicsWorld.stepSimulation(deltaTime, 10);

      // Update soft volumes
      for (var i = 0, il = self.softBodies.length; i < il; i++) {
        var volume = self.softBodies[i];
        var geometry = volume.geometry;
        var softBody = volume.userData.physicsBody;
        var volumePositions = geometry.attributes.position.array;
        var volumeNormals = geometry.attributes.normal.array;
        var association = geometry.ammoIndexAssociation;
        var numVerts = association.length;
        var nodes = softBody.get_m_nodes();
        for (var j = 0; j < numVerts; j++) {
          var node = nodes.at(j)
          var nodePos = node.get_m_x()
          var x = nodePos.x()
          var y = nodePos.y()
          var z = nodePos.z()
          var nodeNormal = node.get_m_n()
          var nx = nodeNormal.x()
          var ny = nodeNormal.y()
          var nz = nodeNormal.z()

          var assocVertex = association[j]

          for (var k = 0, kl = assocVertex.length; k < kl; k++) {
            var indexVertex = assocVertex[k]
            volumePositions[indexVertex] = x
            volumeNormals[indexVertex] = nx
            indexVertex++
            volumePositions[indexVertex] = y
            volumeNormals[indexVertex] = ny
            indexVertex++
            volumePositions[indexVertex] = z
            volumeNormals[indexVertex] = nz
          }
        }

        geometry.attributes.position.needsUpdate = true
        geometry.attributes.normal.needsUpdate = true

      }

      // Update rigid bodies
      for (var i = 0, il = self.rigidBodies.length; i < il; i++) {
        var objThree = self.rigidBodies[i]
        var objPhys = objThree.userData.physicsBody
        var ms = objPhys.getMotionState()
        if (ms) {
          ms.getWorldTransform(self.transformAux1)
          var p = self.transformAux1.getOrigin()
          var q = self.transformAux1.getRotation()
          objThree.position.set(p.x(), p.y(), p.z())
          objThree.quaternion.set(q.x(), q.y(), q.z(), q.w())
        }
      }
    },
    setupAreaLight () {
      var self = this
      console.log('setting up')

      // var newLight = this.makeLight({
      //   type: 'point',
      //   color: 0x00ff00,
      //   pos: {x: -10, y: 14, z: 0}
      // })
      // // console.log(`light is: ${newLight}`)
      // self.scene.add( newLight )
      // newLight.shadow.near = 

      for (var i = 0; i < self.noOC; i++ ) {
        self.rectLight[i] = new self.$gThree.RectAreaLight( 0xffffff, 1, 10, 10 );
        
        // self.rectLight[i].castShadow = true
        // self.rectLight[i].receiveShadow = true
        // var d = 1000;
        // self.rectLight[i].shadow.camera.left = - d
        // self.rectLight[i].shadow.camera.right = d
        // self.rectLight[i].shadow.camera.top = d
        // self.rectLight[i].shadow.camera.bottom = - d
        // self.rectLight[i].shadow.mapSize.width = 6000
        // self.rectLight[i].shadow.mapSize.height = 6000
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
        self.rectLight[i].lookAt( new self.$gThree.Vector3(0, 5, 0) );

        // console.log('sphere: ' , self.mshStdSphere.position.y)
  
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
    },
    setOrbitControls () {
      var self = this
      self.controls = new OrbitControls( self.camera, self.$parent.renderer.domElement );
      self.controls.enablePan = false
      self.controls.enableDamping = true
      // self.controls.zoomSpeed = 0.2
      self.controls.minDistance = 1
      self.controls.maxDistance = 24
      // Avoid going under floor
      self.controls.maxPolarAngle = (Math.PI * 0.5) * 0.99
      // self.controls.addEventListener('change', self.requestRenderIfNotRequested)
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

</style>
