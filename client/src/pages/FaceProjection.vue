<template lang="pug">
  .container.face-projection(ref="face_projection")
</template>

<script>

import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
// import { WEBVR } from "three/examples/js/vr/WebVR.js";

var models = [
  {name: 'cube', path: 'models/gltf/untitled.stl'},
]

var container
var stlPath =
  'https://dl.dropboxusercontent.com/s/p1xp4lhy4wxmf19/Handle_Tab_floating.STL'

var camera, controls, scene, renderer, model

var mouseX = 0,
  mouseY = 0

var test = true
var meshPlane = null,
  meshStl = null,
  meshCube = null,
  meshHang = null

var windowHalfX = window.innerWidth / 2
var windowHalfY = window.innerHeight / 2

/*THREE.FrontSide = 0;
THREE.BackSide = 1;
THREE.DoubleSide = 2;*/

var materials = []
materials.push(
  new THREE.MeshPhongMaterial({
    color: 0x00ff00,
    side: 0,
    shading: THREE.FlatShading,
    transparent: true,
    opacity: 0.9,
    overdraw: true,
    wireframe: false
  })
)
materials.push(
  new THREE.MeshPhongMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 0.8,
    side: 0,
    shading: THREE.FlatShading,
    overdraw: true,
    metal: false,
    wireframe: false
  })
)
materials.push(
  new THREE.MeshPhongMaterial({
    color: 0x0000ff,
    side: 2,
    shading: THREE.FlatShading,
    overdraw: true,
    metal: false,
    wireframe: false
  })
)
var lineMaterial = new THREE.LineBasicMaterial({
  color: 0x0000ff,
  transparent: true,
  opacity: 0.05
})

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
      container = self.$refs.face_projection
      // document.body.appendChild(container)

      camera = new THREE.PerspectiveCamera(
        25,
        window.innerWidth / window.innerHeight,
        0.1,
        100000000
      )
      camera.position.x = 100
      camera.position.z = -200
      camera.position.y = 100

      // controls = new OrbitControls(camera)

      // scene
      scene = new THREE.Scene()

      var ambient = new THREE.AmbientLight(0x101030) //0x101030
      scene.add(ambient)

      var directionalLight = new THREE.DirectionalLight(0xffffff, 2)
      directionalLight.position.set(0, 3, 0).normalize()
      scene.add(directionalLight)

      var directionalLight = new THREE.DirectionalLight(0xffffff, 2)
      directionalLight.position.set(0, 1, -2).normalize()
      scene.add(directionalLight)

      if (self.webglAvailable()) {
        renderer = new THREE.WebGLRenderer()
      } else {
        renderer = new THREE.CanvasRenderer()
      }
      renderer.setClearColor(0xcdcdcd, 1)

      // renderer = new THREE.WebGLRenderer();
      renderer.setPixelRatio(window.devicePixelRatio)
      renderer.setSize(window.innerWidth, window.innerHeight)
      container.appendChild(renderer.domElement)

      // document.addEventListener('mousemove', onDocumentMouseMove, false)
      // window.addEventListener('resize', onWindowResize, false)

      self.createPlane(500, 500)
      self.createCube(500)
      self.loadStl()

      self.setOrbitControls()
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
    createPlane (width, height) {
      var self = this
      var planegeometry = new THREE.PlaneBufferGeometry(width, height, 0, 0)
      var material = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide
      })
      planegeometry.computeBoundingBox()
      planegeometry.center()

      meshPlane = new THREE.Mesh(planegeometry, material)
      meshPlane.rotation.x = 90 * (Math.PI / 180)
      //meshPlane.position.y = -height/2;
      meshPlane.position.y = 0;
      scene.add(meshPlane)
    },
    createCube (size) {
      var geometry = new THREE.BoxGeometry(size, size, size)
      geometry.computeFaceNormals()
      geometry.mergeVertices()
      geometry.computeVertexNormals()
      geometry.center()

      var material = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        opacity: 0.04,
        transparent: true,
        wireframe: true,
        side: THREE.DoubleSide
      })
      meshCube = new THREE.Mesh(geometry, material)
      meshCube.position.y = size / 2
      scene.add(meshCube)
    },
    loadStl () {
      var self = this
      var loader = new STLLoader()
      // loader.load(stlPath, function (geometry) {
      loader.load(models[0].path, function (geometry) {
        // Convert BufferGeometry to Geometry
        var geometry = new THREE.Geometry().fromBufferGeometry(geometry)

        geometry.computeBoundingBox()
        geometry.computeVertexNormals()
        geometry.center()

        var faces = geometry.faces
        for (var index in faces) {
          var face = faces[index]
          var faceNormal = face.normal
          var axis = new THREE.Vector3(0, -1, 0)
          var angle = Math.acos(axis.dot(faceNormal))
          var angleReal = angle / (Math.PI / 180)
          if (angleReal <= 70) {
            face.materialIndex = 1
          } else {
            face.materialIndex = 0
          }
        }

        geometry.computeFaceNormals()
        geometry.computeVertexNormals()

        meshStl = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials))
        meshStl.position.x = 0
        meshStl.position.y = 10
        scene.add(meshStl)

        // Once loaded, calculate projections mesh
        self.calculateProjectedMesh()
      })
    },
    calculateProjectedMesh () {
      var geometry = meshStl.geometry
      var faces = geometry.faces
      var vertices = geometry.vertices

      var geometry_projected = new THREE.Geometry()
      var faces_projected = []
      var vertices_projected = []

      meshStl.updateMatrixWorld()

      for (var index in faces) {
        var face = faces[index]

        // This are the faces
        if (face.materialIndex == 1) {
          var vertexIndexes = [face.a, face.b, face.c]
          for (var i = 0, l = vertexIndexes.length; i < l; i++) {
            var relatedVertice = vertices[vertexIndexes[i]]
            var vectorClone = relatedVertice.clone()
            console.warn(vectorClone)
            vectorClone.applyMatrix4(meshStl.matrixWorld)

            ////////////////////////////////////////////////////////////////
            // TEST: draw line
            var geometry = new THREE.Geometry()
            geometry.vertices.push(
              new THREE.Vector3(vectorClone.x, vectorClone.y, vectorClone.z)
            )
            //geometry.vertices.push(new THREE.Vector3(vectorClone.x, vectorClone.y, vectorClone.z));
            geometry.vertices.push(
              new THREE.Vector3(vectorClone.x, meshPlane.position.y, vectorClone.z)
            )
            var line = new THREE.Line(geometry, lineMaterial)
            scene.add(line)
            console.log('line added')
            ////////////////////////////////////////////////////////////////

            vectorClone.y = 0
            var vector = new THREE.Vector3(
              vectorClone.x,
              vectorClone.y,
              vectorClone.z
            )
            vertexIndexes[i] = vertices_projected.push(vector) - 1
          }
          var newFace = new THREE.Face3(
            vertexIndexes[0],
            vertexIndexes[1],
            vertexIndexes[2]
          )
          newFace.materialIndex = 2
          faces_projected.push(newFace)
        }
      }
      geometry_projected.faces = faces_projected
      geometry_projected.vertices = vertices_projected
      geometry_projected.mergeVertices()
      console.info(geometry_projected)

      meshHang = new THREE.Mesh(
        geometry_projected,
        new THREE.MeshFaceMaterial(materials)
      )
      var newY = -(2 * meshStl.position.y) + 0
      var newY = -meshStl.position.y
      meshHang.position.set(0, newY, 0)
      meshStl.add(meshHang)
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
    webglAvailable () {
      try {
        var canvas = document.createElement('canvas')
        return !!(
          window.WebGLRenderingContext &&
          (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
        )
      } catch (e) {
        return false
      }
    },
    onWindowResize () {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()

      renderer.setSize(window.innerWidth, window.innerHeight)
    },
    onDocumentMouseMove (event) {
      mouseX = (event.clientX - windowHalfX) / 2
      mouseY = (event.clientY - windowHalfY) / 2
    }
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
