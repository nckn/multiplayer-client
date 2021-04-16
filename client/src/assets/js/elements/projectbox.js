import * as THREE from 'three'
// import RoundedBoxGeometry from './roundedBox'

// let textureFile = require('../../textures/soundescapes-main.jpg')
// let textureFile2 = require('../../textures/img.jpg')
// let landTitle = require('../../textures/land-title-1.png')

let textureFiles = [
  {name: 'k', url: require('@/assets/images/soundescapes-main-square.jpg')},
  {name: 'o', url: require('@/assets/images/soundescapes-main-square.jpg')},
  {name: 'n', url: require('@/assets/images/soundescapes-main-square.jpg')},
  {name: 'r', url: require('@/assets/images/soundescapes-main-square.jpg')},
  {name: 'a', url: require('@/assets/images/soundescapes-main-square.jpg')},
  {name: 'd', url: require('@/assets/images/soundescapes-main-square.jpg')},
  // {name: 'd', url: require('@/assets/svg/letters/letter-d.svg')},
]

export default class Box {
  constructor (_options) {
    this.size = _options.size
    // this.geom = new RoundedBoxGeometry(this.size, this.size, this.size, 0, 0);
    // this.geom = new RoundedBoxGeometry(this.size, this.size, this.size, .02, .2);
    this.rotationX = 0
    this.rotationY = 0
    this.rotationZ = 0
    // this.position = {x: _options.position.x}
    this.material = null
    // this.positions = [
    //   pos1: {x: 0, y: 0, z: 0},
    //   pos2: {x: 0, y: 0, z: 0}
    // ]
    this.textures = []
    
    // this.textureInstance.minFilter = THREE.LinearFilter
    this.loadTextures()
    this.applyGeometry()
    this.applyTexture()
  }

  loadTextures () {
    // var self = this
    textureFiles.forEach(element => {
      element.instance = new THREE.TextureLoader().load(element.url)
      // self.textures.push(element)
    });
    // this.textureInstance2 = new THREE.TextureLoader().load(textureFile2)
  }

  applyGeometry () {
    this.geom = new THREE.BoxGeometry(this.size, this.size, this.size)
  }

  shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    return array;
  }

  applyTexture () {
    // Used like so
    var arr = [0, 1, 2, 3, 4, 5];
    this.shuffle(arr);
    console.log('shuffling: ' + arr)

    var textureK = new THREE.MeshPhongMaterial({
      map: textureFiles[arr[0]].instance,
      flatShading: true,
      emissive: 0xffffff,
      opacity: 0.2
      // emissiveIntensity: 0.4
      // color: 0x00ff00,
      // specular: 0xffffff,
      // envMap: textureInstance,
      // shininess: 50,
      // reflectivity: 1.0,
      // side: THREE.DoubleSide,
    })

    
    var textureO = new THREE.MeshPhongMaterial({map: textureFiles[arr[1]].instance,flatShading: true,emissive: 0x000000})
    var textureN = new THREE.MeshPhongMaterial({map: textureFiles[arr[2]].instance,flatShading: true,emissive: 0x000000})
    var textureR = new THREE.MeshPhongMaterial({map: textureFiles[arr[3]].instance,flatShading: true,emissive: 0x000000})
    var textureA = new THREE.MeshPhongMaterial({map: textureFiles[arr[4]].instance,flatShading: true,emissive: 0x000000})
    var textureD = new THREE.MeshPhongMaterial({map: textureFiles[arr[5]].instance,flatShading: true,emissive: 0x000000})

    // this.material = new THREE.MeshFaceMaterial([
    //   textureK, // front
    //   textureO, // back
    //   textureN, // bottom
    //   textureR, // right
    //   textureA, // back
    //   textureD // under
    // ])

    // this.material = new THREE.MeshBasicMaterial( { color: 0xff0f45 } );
    // this.material = new THREE.MeshBasicMaterial({
    //   vertexColors: THREE.VertexColors,
    //   emissive: 0x000000,
    // })
    
    this.material = new THREE.MeshBasicMaterial({
      vertexColors: THREE.VertexColors,
      map: textureFiles[arr[0]].instance,
      // emissive: 0x000000,
      opacity: 0.2
    })

    // var materials = [
    //   new THREE.MeshLambertMaterial( { color: 0xffffff, opacity: 0.6, depthWrite: false, depthTest: false, vertexColors: THREE.VertexColors } ),
    //   new THREE.MeshLambertMaterial( { color: 0xffffff, opacity: 1, depthWrite: false, depthTest: false, vertexColors: THREE.VertexColors } )
    // ]; // the two materials 

    // this.material = new THREE.MeshFaceMaterial(materials)

    // Greytones
    // this.material = new THREE.MeshFaceMaterial([
    //   texture, // If commented out it will be transparent
    //   new THREE.MeshLambertMaterial({ color: 0x444444 }), // 444444 back
    //   new THREE.MeshLambertMaterial({ color: 0x888888 }), // green, bottom
    //   new THREE.MeshLambertMaterial({ color: 0x252525 }), // turqoise
    //   new THREE.MeshLambertMaterial({ color: 0x666666 }), // blue side left
    //   new THREE.MeshLambertMaterial({ color: 0x555555 })  // green side right
    // ])
    
    // this.material = new THREE.MeshFaceMaterial([
    //   texture,
    //   new THREE.MeshLambertMaterial({ color: 0xff0000 }), // red back
    //   new THREE.MeshLambertMaterial({ color: 0xffff00 }), // yellow, top
    //   new THREE.MeshLambertMaterial({ color: 0x00ffff }), // turqoise
    //   new THREE.MeshLambertMaterial({ color: 0x0000ff }), // blue side left
    //   new THREE.MeshLambertMaterial({ color: 0x00ff00 })  // green side right
    // ])

    // this.material = new THREE.MeshPhongMaterial({
    //   // map: this.textureInstance,
    //   flatShading: true,
    //   emissive: 0x050505
    //   // color: 0x00ff00,
    //   // specular: 0xffffff,
    //   // envMap: textureInstance,
    //   // shininess: 50,
    //   // reflectivity: 1.0,
    //   // side: THREE.DoubleSide,
    // })

    // this.material.receiveShadow = true
    // this.material.castShadow = true
  }

  // TODO ***
  // loadTextures () {
  //   var self = this
  //   textureFiles.forEach((element, index) => {
  //     var newTex = new THREE.MeshPhongMaterial({
  //       map: element.url,
  //       flatShading: true,
  //       emissive: 0x000000,
  //       // emissiveIntensity: 20
  //       // color: 0x00ff00,
  //       // specular: 0xffffff,
  //       // envMap: textureInstance,
  //       // shininess: 50,
  //       // reflectivity: 1.0,
  //       // side: THREE.DoubleSide,
  //     })
  //     self.allTextures.push(newTex)
  //   });
  //   // var self = this
  //   // textureFiles.forEach(element => {
  //   //   element.instance = new THREE.TextureLoader().load(element.url)
  //   //   // self.textures.push(element)
  //   // });
  //   // this.textureInstance2 = new THREE.TextureLoader().load(textureFile2)
  // }
  // TODO ***

  // putPositions (text) {
  //   alert(text)
  // }
}
