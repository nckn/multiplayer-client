<template lang="pug">
  .container.outer.black-bg
    #sceneContainer
    .container.inner
      .pixel-wrapper.dimmed(ref="pixel_wrapper")
        .pixel(
          v-if="thisClient.id != null"
          v-for="(pixel, index) in filteredList"
          :key="index"
          :id="pixel.clientId"
          ref="items"
        )
          p {{ pixel.clientId }}
      canvas(
        ref="game"
        width="300"
        height="300"
        style="border: 1px solid black; visibility: hidden;"
      )
      .toggle-wrapper
        input(type="checkbox" id="switch")
        label(for="switch") Toggle
      //- Color picker
      #picker
      //- Debug
      //- .debug-info.hide-it
      .debug-info
        .p-pair.w-seperator
          p.id.col id:
          p.col {{ thisClient.clientId }}
        //- .p-pair
        //-   p.id.col unique id:
        //-   p.col {{ thisClient.uuid }}
        .p-pair.w-seperator
          p.col ids:
          .p-sub.col
            p(v-for="(user, index) in allClients") {{ user.clientId }} </br>
        .p-pair
          p.col users: 
          p.col {{ allClients.length }}
      //- div hey
      //-   button(v-on:click="move('right')") Right
      //-   button(v-on:click="move('left')") Left
      //-   button(v-on:click="move('up')") Up
      //-   button(v-on:click="move('down')") Down
      //- img(id="image1" src="../image1.jpg")
</template>
 
<script>

// Creating a 2D Multiplayer Game with Vue.js and Socket.io
// https://www.youtube.com/watch?v=JEYEpledOxs

import * as THREE from 'three'
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
// import { SMAAEffect, GodRaysEffect, RenderPass, EffectPass, EffectComposer } from 'postprocessing'

import { map } from '@/assets/js/helpers'

import iro from '@jaames/iro'

import io from 'socket.io-client'

// import { TweenMax, Sine, Expo, Elastic } from 'gsap'

export default {
  name: 'ColorGame',
  data () {
    return {
      socket: {},
      // context: {},
      // ip: 'http://192.168.2.100:3000', // Home
      ip: 'http://192.168.87.107:3000', // USE
      // ip: 'http://192.168.43.216:3000', // Mobile
      position: {
        x: 0,
        y: 0
      },
      // users: {
      //   amount: 0,
      // },
      users: 0,
      colorPicker: null,
      // clientInfo: {
      //   clientId: null
      // },
      clientDetails: {id: 0},
      thisClient: {
        id: 1,
        uuid: 1
      },
      allClients: [],
      hasStoredClientsOnce: false,
      // pixelation
      sample_size: 100,
      // Threejs
      container: null,
      scene: null,
      camera: null,
      allCubes: [],
      offsetX: 0,
      // post processing
      composer: null
    }
  },
  // watch: {
  //   position () {
  //     this.context.fillRect(this.position.x, this.position.y, 20, 20)
  //   }
  // },
  created () {
    var self = this
    // this.socket = io('http://localhost:3000')
    // this.socket = io('http://192.168.87.107:3000')
    // Small change
    // this.socket = io('http://192.168.2.100:3000')
    // self.socket = io.connect('http://192.168.43.216:3000'); // Mobile
    // self.socket = io.connect('http://192.168.2.100:3000'); // Dacota 
    // self.socket = io.connect('http://192.168.87.107:3000'); // Use
    self.socket = io.connect(self.ip); // Dacota 

    self.socket.on('connect', () => {
      // console.log(data)
      // console.log('here comes..........')
      self.clientDetails = self.socket.emit('storeClientInfo', { customId: '000CustomIdHere0000' });
      // console.log('clientDetails: ', self.clientDetails)
    });

    // const sessionID = socketConnection.socket.sessionid

  },
  beforeDestroy () {
    var self = this
    console.log('before destroy')
    window.cancelAnimationFrame( self.reqAnim );
    // Dispose controls
    self.controls.dispose()
    // End connection to server
    self.socket.close()
    while(self.scene.children.length > 0){
      console.log('before destroying: ', self.scene.children[0])
      self.scene.remove(self.scene.children[0]);
    }
  },
  computed: {
    filteredList() {
      return this.allClients
    }
  },
  async mounted () {
    var self = this

    self.createScene()
    self.createCamera()
    self.addFloor()
    self.addLight()
    // *** godrays, 
    // self.setupGodRaysEffect()

    self.addMirrorSphere()

    // self.addGuides()
    self.orbitControls()

    self.render();

    window.addEventListener('resize', this.onResize.bind(this));
    
    // Setup pixelation
    // self.pixelation()

    this.context = this.$refs.game.getContext('2d')

    // Set color for client
    self.color = '#' + Math.floor(Math.random()*16777215).toString(16)

    // Place this clients cube
    this.socket.on('user_connected', data => {
      // console.log('unique id is: ', data.uuid)
      // alert('joined')
      // Set client ID
      self.thisClient.clientId = data.id
      console.log('this client connected with id: ', self.thisClient.clientId)
      self.addGeometry({clientId: self.thisClient.clientId, domestic: true})
      // self.thisClient.uuid = data.uuid
      // alert('connected it was ' + data)
    })
    
    // When a new one joins or someone leaves
    // this.socket.on('all_clients', data => {
    //   // self.allClients = []
    //   // self.allClients = data

    //   // console.log('clients length: ', self.allClients.length)
      
    //   // for (var i = 0; i < self.allClients.length; i++) {
    //   //   // Add in a cube
    //   //   self.addGeometry(self.allClients[i].clientId)
    //   //   // console.log('all clients: ', self.allClients[i].clientId)
    //   //   // console.log(self.allClients[i])
    //   // }

    //   // self.assignRightSize()
      
    //   // console.log('connected it was with id: ', data)
    // })
    
    // When someone leaves
    // this.socket.on('client_leaving', data => {
    //   console.log('this here person left: ', data)
    // })

    this.socket.on('broadcast', data => {
      // If someone joined
      if (data.joinId) {

        for (var i = 0; i < data.clients.length; i++) {
          
          // 1.0
          // Add in a cube
          if (data.clients[i].clientId != self.thisClient.clientId) {
            self.addGeometry(data.clients[i])
          }
          
          // 1.1
          // Add in a cube
          // if (self.hasStoredClientsOnce) {
          //   if (data.clients[i].clientId != self.thisClient.clientId && data.clients[i].clientId != self.allClients[i].clientId) {
          //     self.addGeometry(data.clients[i])
          //   }
          // } else {
          //   if (data.clients[i].clientId != self.thisClient.clientId) {
          //     self.addGeometry(data.clients[i])
          //   }
          // }

          // if (data.clients[i].clientId != self.allClients[i].clientId) {
          // }
          // console.log('all clients: ', self.allClients[i].clientId)
          // console.log(self.allClients[i])
        }
        
        self.allClients = data.clients
        self.hasStoredClientsOnce = true

        // self.oldClients = self.allClients
        // Make layout
        // self.assignRightSize()

        // Add in a cube
        // self.addGeometry(data.joinId)
      }
      // If someone is leaving
      else if (data.leavingId) {
        // console.log('leaving id: ', data.leavingId)
        self.allClients = data.remainers

        // Remove a cube
        self.removeGeometry(data.leavingId)
      }
      // console.log('clients: ', data)
    })

    // Listen for position
    this.socket.on('position', data => {
      this.position = data
      this.context.clearRect(0, 0, this.$refs.game.width, this.$refs.game.height)
      this.context.fillRect(this.position.x, this.position.y, 20, 20)
    })
    
    console.log('pixels in Home: ', self.$refs.items)

    // Listen for color change
    self.socket.on('color', data => {
      self.color = data.color
      // Iterate pixels
      // console.log('in here.......')
      self.$refs.items.forEach(() => {
        // console.log(element)
        // console.log(element.getAttribute('id'))
        // element.style.backgroundColor = color.hexString
        // if (data.id === self.clientInfo.clientId) {
        // if (index === 1) {
        // if (element.id === data.id) {
        //   // console.log('client id: ', self.thisClient.id)
        //   // console.log('data id: ', data.id)
        //   element.style.backgroundColor = self.color
        // }

        // Change color of cube
        var attr = {
          id: data.id,
          color: self.color
        }
        self.changeColorOfCube(attr)
      });
    })

    // for (var i = 0; i < self.allClients.length; i++) {
    //   // Change color of cube
    //   var attr = {
    //     id: data.id,
    //     color: self.color
    //   }
    //   self.changeColorOfCube(attr)
    // }

    // self.socket.on('storeInfo', data => {
    //   // console.log('here comes..........')
    //   self.clientInfo = data
    //   // console.log('data: ', data)
    // })
    
    // Listen for client Count
    // this.socket.on('getCount', data => {
    //   // this.users = data
    //   this.users = data
    // })

    // 
    this.socket.on('join', color => { 
      // console.log('this color: ', self.color)
      this.socket.color = color
    })

    // Get cursor movement
    document.addEventListener('mousemove', function (e) {
      // var mousecoords = self.getMousePos(e)
      self.moveAround(e)
    })

    // Get tocuh movement
    window.addEventListener('touchmove', (e) => {
      var touch = e.targetTouches[0];
      self.moveAround(touch)
    }, false);

    // Make color picker
    self.colorPicker = new iro.ColorPicker('#picker', {
      // Set the size of the color picker
      width: 160,
      // Set the initial color to pure red
      color: '#f00',
      layout: [
        { 
          component: iro.ui.Wheel,
          options: {}
        },
        { 
          component: iro.ui.Slider,
        },
      ]
    })

    // start listening to the color change event
    // colorChangeCallback will be called whenever the color changes
    self.colorPicker.on('color:change', self.colorChangeCallback)

    self.$nextTick( () => {
      // self.trackWindowResize()
      // self.$refs.items.forEach((elmt) => {
      //   elmt.classList.add('revealed')
      // })
    })
  },
  methods: {
    setupGodRaysEffect (cube) {
      var self = this

      let directionalLight = new THREE.DirectionalLight(0xffccaa, 3);
      directionalLight.position.set(0,0,0);
      self.scene.add(directionalLight);

      let circleGeo = new THREE.CircleGeometry(220,50);
      let circleMat = new THREE.MeshBasicMaterial({color: 0xffccaa});
      let circle = new THREE.Mesh(circleGeo, circleMat);
      circle.position.set(0, 100, -500);
      circle.scale.setX(1.2);
      self.scene.add(circle);

      var geometry = new THREE.BoxGeometry( 2, 2, 2 );
      var material = new THREE.MeshPhongMaterial({
        color: 0xf5f5f5,
        emissive: 0xf5f5f5,
        flatShading: true,
      });
      var cube = new THREE.Mesh( geometry, material );
      self.scene.add(cube)

      let areaImage = new Image();
      areaImage.src = SMAAEffect.areaImageDataURL;
      let searchImage = new Image();
      searchImage.src = SMAAEffect.searchImageDataURL;
      // let smaaEffect = new SMAAEffect(searchImage, areaImage, 1);
      // let godraysEffect = new GodRaysEffect(self.camera, circle, {
      let godraysEffect = new GodRaysEffect(self.camera, cube, {
        resolutionScale: 1,
        density: 0.8,
        decay: 0.95,
        weight: 0.09,
        samples: 100
      });
      let renderPass = new RenderPass(self.scene, self.camera);
      let effectPass = new EffectPass(self.camera, godraysEffect);
      effectPass.renderToScreen = true;
      self.composer = new EffectComposer(self.renderer);
      self.composer.addPass(renderPass);
      self.composer.addPass(effectPass);
    },
    changeColorOfCube (attr) {
      var self = this
      // console.log(color)
      var colorString = attr.color.replace('#', '')
      // console.log(colorString)
      // Set color
      // self.allCubes[0].material.color.setHex( 0xffffff );
      // self.allCubes[0].material.color.setHex( `0x${colorString}` );
      const object = self.scene.getObjectByProperty( 'name', attr.id );
      object.material.color.setHex( `0x${colorString}` );
      object.material.emissive.setHex( `0x${colorString}` );
    },
    createScene() {
      var self = this
      
      // Get container
      self.container = document.querySelector("#sceneContainer");

      this.scene = new THREE.Scene();
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(window.devicePixelRatio);

      // Should shadows be turned on
      if (self.shadowsOn) {
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      }

      self.container.appendChild(self.renderer.domElement)
      // document.body.appendChild(this.renderer.domElement); // org
    },
    createCamera() {
      this.camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 1);
      // this.camera.position.set(0, 65, 0);
      // this.camera.rotation.x = -1.57;
      // this.camera.position.set( 20, 20, 20 );
      this.camera.position.set( 50, 50, 50 );
      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.y = - Math.PI / 4;
      this.camera.rotation.x = Math.atan( - 1 / Math.sqrt( 2 ) );

      this.scene.add(this.camera);
    },
    addMirrorSphere () {
      // var self = this
      // var cubeCamera2 = new THREE.CubeCamera( 1, 1000, 256 );
      // cubeCamera2.renderTarget.texture.generateMipmaps = true;
      // cubeCamera2.renderTarget.texture.minFilter = THREE.LinearMipmapLinearFilter;
      // self.scene.add( cubeCamera2 );

      // // document.body.appendChild( self.renderer.domElement );

      // //

      // var material = new THREE.MeshBasicMaterial( {
      //   envMap: cubeCamera2.renderTarget.texture
      // } );

      // var sphere = new THREE.Mesh( new THREE.IcosahedronBufferGeometry( 20, 3 ), material );
      // self.scene.add( sphere );
    },
    addLight() {
      // const light = new THREE.AmbientLight('#ff00ff', 1);
      // this.scene.add(light);
      const light2 = new THREE.PointLight('#ffffff', 1, 20, 1);
      // light2.position.set(10, 20, 10);
      light2.position.set(0, 20, 0); // super nice flat from top
      this.scene.add(light2);
      // console.log('set light')
    },
    addFloor() {
      const geometry = new THREE.PlaneGeometry(100, 100);
      const material = new THREE.ShadowMaterial({ opacity: .3 });

      this.floor = new THREE.Mesh(geometry, material);
      this.floor.position.y = 0;
      this.floor.receiveShadow = true;
      this.floor.rotateX(- Math.PI / 2);

      this.scene.add(this.floor);
    },
    addGuides () {
      var axesHelper = new THREE.AxesHelper( 5 );
      this.scene.add( axesHelper );
    },
    removeGeometry (id) {
      var self = this
      console.log('removing: ', id)
      // self.allCubes.splice( idx, 1 )
      self.allCubes.splice( 0, 1 )

      // Remove object from scene
      const object = self.scene.getObjectByProperty( 'name', id );

      object.geometry.dispose();
      object.material.dispose();
      self.scene.remove( object );
      self.offsetX -= 2
    },
    generateRandomHexCode () {
      var letters = '0123456789ABCDEF';
      var color = '';
      for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    },
    addGeometry (obj) {
      var self = this
      // var l = 2
      var s = 2

      // for (var i = 0; i < self.allCubes.length; i++) {
      //   if (obj.clientId === self.allCubes[i].id) {
      //     return
      //   }
      // }

      // console.log('obj id is: ', obj.clientId)
      var geometry = new THREE.BoxGeometry( s, s, s );
      // var material = new THREE.MeshBasicMaterial( {
      //   color: 0x777777
      // } );
      // var randomColor = Math.floor(Math.random()*16777215).toString(16)

      // var randomColor = `0x${self.generateRandomHexCode()}`
      // console.log('random color: ', randomColor)
      // console.log('obj.color: ', obj.color)
      
      var material = new THREE.MeshPhongMaterial({
        // color: 0x000000,
        color: obj.color ? obj.color: 0xf5f5f5,
        emissive: obj.color ? obj.color: 0xf5f5f5,
        // color: obj.color ? obj.color : randomColor,
        // emissive: obj.color ? obj.color : randomColor,
        flatShading: true,
      });
      var cube = new THREE.Mesh( geometry, material );
      // Set name of cube
      cube.name = obj.clientId

      // Position cubes
      // cube.position.x = self.offsetX
      if (obj.domestic) {
        cube.position.x = 0
      } else {
        // Map like positioning
        var rX = ( Math.random() - 0 ) * 10
        var rZ = ( Math.random() - 0 ) * 10
        cube.position.x = map(rX, 0, 10, -15, 20);
        // mesh.position.y = Math.random() * 50;
        cube.position.z = map(rZ, 0, 10, -15, 20);
      }

      self.scene.add( cube );
      self.offsetX += 2

      self.allCubes.push( {id: obj.clientId, geom: cube} )
      // self.setupGodRaysEffect(cube)
      
      // console.log('cube id: ', obj.clientId)
      // alert(obj.clientId)
      console.log('cube name: ', obj.clientId)
    },
    render() {
      var self = this

      // Supposed for god rays effect. self.setupGodRaysEffect()
      // self.composer.render(0.1);
      // if (self.allCubes[0]) {
      //   self.composer.render(0.1);
      // }

      // this.draw();
      this.renderer.render(this.scene, this.camera);
      self.reqAnim = requestAnimationFrame( self.render.bind(this) );

      if (self.hasBeenDistributed) {
        self.updateObjects()
      }
    },
    onResize() {
      var self = this
      this.width = window.innerWidth;
      this.height = window.innerHeight;

      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.width, this.height);

      // Get window width
      self.window = {w: window.innerWidth, h: window.innerHeight}
      // console.log('windowW: ', self.window.w)
    },
    orbitControls () {
      var self = this
      // Camera and controls
      self.controls = new OrbitControls(
        self.camera,
        self.renderer.domElement
      )

      // console.log('camera: ' + JSON.stringify(self.camera))
      // console.log('camera: ' + JSON.stringify(self.orbitControls))

      // this.orbitControls.addEventListener('change', e => {
      //   // var zoomDistance = this.orbitControls.distanceTo( new THREE.Vector3(0, 0, 0) )
      //   // e.preventDefault()
      //   // e.stopPropagation()
      //   // console.log(this)
      //   // console.log(this.zoom.distance)
      //   // this.instance.position.y -= 1
      // })
      // this.orbitControls.enabled = true /* This disables touch devices */
      // this.orbitControls.enabled = false /* Only with this as false touch devices work */
      self.controls.enableKeys = false
      self.controls.zoomSpeed = 0.5
      self.controls.enableDamping = true
      // this.orbitControls.maxPolarAngle = Math.PI / 2 - Math.PI / 32 // Math.PI/2 is at floor
      self.controls.maxPolarAngle = Math.PI / 2 - 0.005 // Math.PI/2 is at floor
      // No orbit
      // self.controls.enableRotate = false
      // No pan
      self.controls.enablePan = false
      // this.instance = new THREE.PerspectiveCamera(40, this.sizes.viewport.width / this.sizes.viewport.height, 1, 180)
      // Set max distance
      self.controls.minDistance = 0
      self.controls.maxDistance = 180
    },
    colorChangeCallback(color) {
      var self = this
      // Set color of pixel

      // Iterate pixels
      // this.$refs.items.forEach(element => {
      //   // console.log(element)
      //   // console.log(element.getAttribute('id'))
      //   // element.style.backgroundColor = color.hexString
      // });

      var pixel = {
        id: self.thisClient.clientId,
        color: color.hexString
      }

      this.socket.emit('changeAllColors', pixel)

      // console.log('self.clientInfo.id: ', self.thisClient.id);
      // console.log(color.hexString);
    },
    // pixelation () {
    //   var self = this
    //   let c = document.createElement("canvas");
    //   var ctx = c.getContext('2d');
    //   let img1 = new Image();

    //   img1.onload = function () {
    //     document.getElementById("image1").remove();

    //     var w = img1.width;
    //     var h = img1.height;

    //     c.width = w;
    //     c.height = h;
    //     ctx.drawImage(img1, 0, 0);

    //     var pixelArr = ctx.getImageData(0, 0, w, h).data;

    //     for (let y = 0; y < h; y += self.sample_size) {
    //       for (let x = 0; x < w; x += self.sample_size) {
    //         let p = (x + (y*w)) * 4;
    //         ctx.fillStyle = "rgba(" + pixelArr[p] + "," + pixelArr[p + 1] + "," + pixelArr[p + 2] + "," + pixelArr[p + 3] + ")";
    //         ctx.fillRect(x, y, self.sample_size, self.sample_size);
    //       }
    //     }

    //     let img = new Image();
    //     img.src = c.toDataURL("image/jpeg");
    //     img.width = 200;
    //     img.style.position = 'absolute'
    //     img.classList.add('pixelated-image')
    //     // document.body.appendChild(img);
    //     self.$refs.pixel_wrapper.appendChild(img);
    //   };

    //   img1.src = document.getElementById("image1").src;

    //   console.log('calculating image')
    //   // window.requestAnimationFrame(self.pixelation())
    // },
    move(direction) {
      this.socket.emit('move', direction)
    },
    moveAround(pos) {
      var self = this
      // console.log('x: ', pos.clientX)
      // console.log('y: ', pos.clientY)
      var newPos = {x: pos.clientX, y: pos.clientY}
      // console.log('pos: ', pos)
      self.socket.emit('move', newPos)
      // this.mouse3D.x = (clientX / this.width) * 2 - 1;
      // this.mouse3D.y = -(clientY / this.height) * 2 + 1;
    },
    getMousePos (e) {
      return { x: e.clientX, y: e.clientY }
    },
    // async assignRightSize () {
    //   setTimeout(() => {
    //     var self = this
    //     self.$refs.pixel_wrapper.classList.add('revealed')
    //     // Make sure pixel tiles are always square
    //     // TODO: Make sure they are from beginning
    //     // var idol = document.getElementsByClassName('pixel')
    //     var idol = self.$refs.items
    //     // await self.$refs.items.forEach((element) => {
    //     //   console.log(element)
    //     // });
    //     // if (!self.isSmScreen) {}
    //     console.log('assigning right size ', idol)
    //     // console.log('in alright ', idol)
    //     // console.log('in here as well')
    //     var idolStyle = window.getComputedStyle(idol[0], null)
    //     var idolWidth = (parseInt(idolStyle.width, 10))
    //     for (var i = 0; i < idol.length; i++) {
    //       // console.log('here they are:' + idol[i])
    //       idol[i].style.height = '' + idolWidth + 'px'
    //       // idol[i].classList.add('revealed')
    //     }
    //     // if (idol.length > 0) {
    //     // }
    //   }, 200)
    // },
    // trackWindowResize () {
    //   if (typeof window !== undefined) {
    //     // this.window.addEventListener('resize', this.assignRightSize)
    //     window.addEventListener('resize', this.assignRightSize)
    //   }
    // }
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

</style>
